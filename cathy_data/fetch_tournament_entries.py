#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch per-event entrant counts from USA Fencing tournament detail pages.
Only counts events relevant to Cathy: Y12 Women Foil (Y12WF), Y14 Women Foil (Y14WF),
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

TARGET_CODES = {"Y12WF", "Y14WF", "CDTWF"}
REQUEST_DELAY = 0.2


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


def parse_event_counts(text):
    """Parse a detail page and return {code: count} for target women foil events."""
    try:
        doc = lh.fromstring(text)
    except Exception:
        return None
    events = doc.xpath('//div[contains(@class, "contested-event")]')
    counts = {code: 0 for code in TARGET_CODES}
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
        counts[code] += count
        found_any = True
    if not found_any:
        # Page may not list the events yet, but we still return zero counts
        return counts
    return counts


def fetch_detail(url):
    try:
        resp = requests.get(url, timeout=30, headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        })
        resp.raise_for_status()
        return resp.text
    except Exception as e:
        print(f"ERROR fetching {url}: {e}", file=sys.stderr)
        return None


def process_tournament(t, cache, ttl_hours, force):
    url = t.get("url")
    tid = t.get("id")
    if not url or not tid:
        return None
    cached = cache.get(tid)
    now = datetime.now(timezone.utc)
    if not force and cached:
        fetched_at = cached.get("fetched_at")
        if fetched_at:
            try:
                ft = datetime.fromisoformat(fetched_at.replace("Z", "+00:00"))
                if now - ft < timedelta(hours=ttl_hours):
                    return tid, cached
            except Exception:
                pass
    time.sleep(REQUEST_DELAY)
    html = fetch_detail(url)
    if html is None:
        return tid, None
    counts = parse_event_counts(html)
    if counts is None:
        return tid, None
    total = sum(counts.values())
    entry = {
        "fetched_at": now.isoformat().replace("+00:00", "Z"),
        "counts": counts,
        "total": total,
    }
    return tid, entry


def main():
    parser = argparse.ArgumentParser(description="Fetch tournament entry counts for Cathy")
    parser.add_argument("--ttl", type=int, default=24, help="Cache TTL in hours")
    parser.add_argument("--workers", type=int, default=8, help="Concurrent fetch workers")
    parser.add_argument("--force", action="store_true", help="Force refetch all")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of tournaments to fetch")
    args = parser.parse_args()

    if not HTML.exists():
        print(f"HTML not found: {HTML}")
        return

    tournaments = extract_tournaments_from_html(HTML)
    rows = [t for t in tournaments if t.get("url")]
    if args.limit:
        rows = rows[:args.limit]

    cache = load_cache()
    print(f"Tournaments with detail URLs: {len(rows)} | Cache: {len(cache)} entries")

    updated = 0
    errors = 0
    skipped = 0

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        future_to_id = {
            ex.submit(process_tournament, r, cache, args.ttl, args.force): r
            for r in rows
        }
        for future in as_completed(future_to_id):
            result = future.result()
            if result is None:
                continue
            tid, entry = result
            if tid is None:
                continue
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
            if (updated + errors + skipped) % 50 == 0:
                save_cache(cache)
                print(f"  ... processed {updated + errors + skipped}/{len(rows)}", flush=True)

    save_cache(cache)
    print(f"Done. Updated: {updated}, Errors: {errors}, Skipped/Cached: {skipped}")
    print(f"Saved {len(cache)} entries to {CACHE}")


if __name__ == "__main__":
    main()
