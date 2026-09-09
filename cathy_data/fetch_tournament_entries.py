#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch per-event entrant counts and names from USA Fencing tournament detail pages.
Only events relevant to Cathy: Y12 Women Foil (Y12WF), Y14 Women Foil (Y14WF),
Cadet Women Foil (CDTWF).

Reads TOURNAMENTS from fencing_tournament_helper.html, writes/updates entry_counts.json cache.
"""
import argparse
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone, timedelta
from pathlib import Path

import requests
import lxml.html as lh

try:
    import json5
except Exception:
    json5 = None

BASE = Path(__file__).parent.parent
HTML = BASE / "fencing_tournament_helper.html"
CACHE = BASE / "cathy_data" / "entry_counts.json"
LINKS = BASE / "cathy_data" / "live_links.json"

TARGET_CODES = {"Y12WF", "Y14WF", "CDTWF"}
REQUEST_DELAY = 0.25


def extract_tournaments_from_html(html_path):
    """Robustly extract the TOURNAMENTS JS array using bracket counting and json5."""
    text = html_path.read_text(encoding="utf-8")
    marker = "const TOURNAMENTS = ["
    start = text.find(marker)
    if start < 0:
        raise ValueError("Could not find TOURNAMENTS array in HTML")
    start += len(marker)
    i = start
    bracket = 1
    while i < len(text) and bracket > 0:
        c = text[i]
        if c == "[":
            bracket += 1
        elif c == "]":
            bracket -= 1
        i += 1
    array_text = text[start:i - 1]
    if json5:
        return json5.loads("[" + array_text + "]")
    # Fallback: use json by converting unquoted keys (simple, may fail on complex data)
    return json.loads("[" + array_text + "]")


def load_cache():
    if CACHE.exists():
        try:
            return json.loads(CACHE.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def save_cache(cache):
    CACHE.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")


def load_links():
    if LINKS.exists():
        try:
            return json.loads(LINKS.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def save_links(links):
    LINKS.write_text(json.dumps(links, ensure_ascii=False, indent=2), encoding="utf-8")


def parse_live_url(html):
    try:
        doc = lh.fromstring(html)
    except Exception:
        return None
    fallback = None
    for a in doc.xpath("//a"):
        href = a.get("href", "")
        text = a.text_content().strip()
        if "fencingtimelive.com/tournaments/eventSchedule/" in href:
            return href
        if re.search(r"fencingtimelive\.com/\?t=\d+", href):
            return href
        if not fallback and "fencingtimelive.com" in href.lower():
            if "live" in text.lower() or "result" in text.lower() or re.match(r"^(https?://)?(www\.)?fencingtimelive\.com/?$", href):
                fallback = href
    return fallback


def fetch(url, is_json=False):
    try:
        resp = requests.get(url, timeout=30, headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        })
        resp.raise_for_status()
        if is_json:
            return resp.json()
        return resp.text
    except Exception as e:
        print(f"ERROR fetching {url}: {e}", file=sys.stderr)
        return None


def parse_event_info(detail_html):
    """Parse a detail page and return {code: {count, event_id}} for target events."""
    try:
        doc = lh.fromstring(detail_html)
    except Exception:
        return None
    events = doc.xpath('//div[contains(@class, "contested-event")]')
    info = {}
    found_any = False
    for ev in events:
        name_nodes = ev.xpath('.//span[@class="name"]/text()')
        count_nodes = ev.xpath('.//span[@class="entrant-count mono"]/text()')
        if not name_nodes or not count_nodes:
            continue
        name = " ".join(name_nodes[0].split())
        m = re.search(r"\(([A-Z0-9]+)\)", name)
        if not m:
            continue
        code = m.group(1)
        if code not in TARGET_CODES:
            continue
        try:
            count = int(count_nodes[0].strip())
        except Exception:
            continue
        # event_id from the contested-event div, fallback to the view-entrants button
        event_id = ev.get("data-event_id")
        if not event_id:
            btn = ev.xpath('.//a[contains(@class, "js-evt-viewEntrants")]')
            if btn:
                event_id = btn[0].get("data-event_id")
        info[code] = {"count": count, "event_id": event_id}
        found_any = True
    if not found_any:
        return {code: {"count": 0, "event_id": None} for code in TARGET_CODES}
    # ensure all target codes present
    for code in TARGET_CODES:
        if code not in info:
            info[code] = {"count": 0, "event_id": None}
    return info


def parse_entrant_names(entrants_table_html):
    """Parse the entrants table HTML and return a list of {name, club, division, member_num, status}."""
    try:
        doc = lh.fromstring(entrants_table_html)
    except Exception:
        return []
    rows = doc.xpath("//tbody/tr")
    names = []
    for tr in rows:
        name_nodes = tr.xpath('.//h4[contains(@class, "thin")]/text()')
        if not name_nodes:
            continue
        name = " ".join(name_nodes[0].split())
        club = tr.get("data-club", "")
        division = tr.get("data-division", "")
        member_num = ""
        status = ""
        # the small text in the third column: #123456\nApproved
        smalls = tr.xpath('.//small[@class="text-muted"]/text()')
        for txt in smalls:
            txt = txt.strip()
            if not txt:
                continue
            if txt.startswith('#') or '\n' in txt:
                if '\n' in txt:
                    member_num, status = txt.split('\n', 1)
                    status = status.strip()
                else:
                    member_num = txt
                break
        member_num = member_num.replace('#', '').strip()
        names.append({
            "name": name,
            "club": club,
            "division": division,
            "member_num": member_num,
            "status": status,
        })
    return names


def fetch_entrant_names(base_url, event_id):
    if not base_url or not event_id:
        return []
    eurl = f"{base_url}/entrants?event_id={event_id}"
    data = fetch(eurl, is_json=True)
    if not data or not isinstance(data, dict):
        return []
    return parse_entrant_names(data.get("entrants_table", ""))


def process_tournament(t, cache, links, ttl_hours, force, fetch_names=True):
    url = t.get("url")
    tid = t.get("id")
    status = t.get("status", "")
    if not url or not tid:
        return None
    # Skip tournaments that are not yet open; they won't have entries or live links yet.
    if status == "not_yet_open":
        return tid, None, None

    cached = cache.get(tid)
    now = datetime.now(timezone.utc)
    if not force and cached:
        fetched_at = cached.get("fetched_at")
        if fetched_at:
            try:
                ft = datetime.fromisoformat(fetched_at.replace("Z", "+00:00"))
                if now - ft < timedelta(hours=ttl_hours):
                    # Live link is cheap to refresh; if we already have it, keep it.
                    live_url = links.get(tid) if links else None
                    return tid, cached, live_url
            except Exception:
                pass
    time.sleep(REQUEST_DELAY)
    detail_html = fetch(url)
    if detail_html is None:
        return tid, None, None
    info = parse_event_info(detail_html)
    live_url = parse_live_url(detail_html)

    if info is None:
        return tid, None, live_url

    base_url = url.rstrip("/")
    counts = {}
    names = {}
    for code in TARGET_CODES:
        counts[code] = info[code]["count"]
        # fetch names only if there are entrants and we have an event_id
        if fetch_names and info[code]["count"] > 0 and info[code]["event_id"]:
            names[code] = fetch_entrant_names(base_url, info[code]["event_id"])
            time.sleep(0.1)
        else:
            names[code] = []

    total = sum(counts.values())
    entry = {
        "fetched_at": now.isoformat().replace("+00:00", "Z"),
        "counts": counts,
        "names": names,
        "total": total,
    }
    return tid, entry, live_url


def main():
    parser = argparse.ArgumentParser(description="Fetch tournament entry counts and names for Cathy")
    parser.add_argument("--ttl", type=int, default=24, help="Cache TTL in hours")
    parser.add_argument("--workers", type=int, default=8, help="Concurrent fetch workers")
    parser.add_argument("--force", action="store_true", help="Force refetch all")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of tournaments to fetch")
    parser.add_argument("--no-names", action="store_true", help="Skip fetching entrant names (faster)")
    args = parser.parse_args()

    if not HTML.exists():
        print(f"HTML not found: {HTML}")
        return

    tournaments = extract_tournaments_from_html(HTML)
    # Skip not_yet_open tournaments to avoid wasted detail fetches.
    rows = [t for t in tournaments if t.get("url") and t.get("status") != "not_yet_open"]
    if args.limit:
        rows = rows[:args.limit]

    cache = load_cache()
    links = load_links()
    print(f"Tournaments with detail URLs: {len(rows)} | Cache: {len(cache)} | Live links: {len(links)}")

    updated = 0
    live_updated = 0
    errors = 0
    skipped = 0

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        future_to_id = {
            ex.submit(process_tournament, r, cache, links, args.ttl, args.force, not args.no_names): r
            for r in rows
        }
        for future in as_completed(future_to_id):
            result = future.result()
            if result is None:
                continue
            tid, entry, live_url = result
            if tid is None:
                continue
            if live_url is not None and links.get(tid) != live_url:
                links[tid] = live_url
                live_updated += 1
            if entry is None:
                if tid not in cache:
                    cache[tid] = None
                errors += 1
            else:
                if cache.get(tid) == entry and not args.force:
                    skipped += 1
                else:
                    cache[tid] = entry
                    updated += 1
            if (updated + errors + skipped + live_updated) % 50 == 0:
                save_cache(cache)
                save_links(links)
                print(f"  ... processed {updated + errors + skipped}/{len(rows)}", flush=True)

    save_cache(cache)
    save_links(links)
    print(f"Done. Entries updated: {updated}, errors: {errors}, skipped: {skipped}, live links updated: {live_updated}")
    print(f"Saved {len(cache)} entries to {CACHE} and {len(links)} live links to {LINKS}")


if __name__ == "__main__":
    main()
