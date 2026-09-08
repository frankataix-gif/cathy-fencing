#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch per-tournament live results link from USA Fencing detail pages.
Stores mapping tournament_id -> live_url in cathy_data/live_links.json.
"""
import argparse
import json
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import requests
import lxml.html as lh

try:
    import json5
except Exception:
    json5 = None

BASE = Path(__file__).parent.parent
HTML = BASE / "fencing_tournament_helper.html"
LINKS = BASE / "cathy_data" / "live_links.json"

REQUEST_DELAY = 0.25


def extract_tournaments_from_html(html_path):
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
    return json.loads("[" + array_text + "]")


def load_links():
    if LINKS.exists():
        try:
            return json.loads(LINKS.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def save_links(data):
    LINKS.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


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
            # 优先选重要链接/文本里带 Live 的，否则兜底记录第一个
            if "live" in text.lower() or "result" in text.lower() or re.match(r"^(https?://)?(www\.)?fencingtimelive\.com/?$", href):
                fallback = href
    return fallback


def fetch(url):
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


def process_tournament(t):
    url = t.get("url")
    tid = t.get("id")
    if not url or not tid:
        return None
    time.sleep(REQUEST_DELAY)
    html = fetch(url)
    if html is None:
        return tid, None
    live_url = parse_live_url(html)
    return tid, live_url


def main():
    parser = argparse.ArgumentParser(description="Fetch tournament live result links")
    parser.add_argument("--workers", type=int, default=8, help="Concurrent fetch workers")
    parser.add_argument("--limit", type=int, default=0, help="Limit number of tournaments")
    parser.add_argument("--force", action="store_true", help="Force refetch all")
    args = parser.parse_args()

    if not HTML.exists():
        print(f"HTML not found: {HTML}")
        return

    tournaments = extract_tournaments_from_html(HTML)
    rows = [t for t in tournaments if t.get("url")]
    if args.limit:
        rows = rows[:args.limit]

    links = load_links()
    updated = 0
    errors = 0
    skipped = 0

    if not args.force:
        # keep existing, only fetch missing
        needed = [t for t in rows if t["id"] not in links]
    else:
        needed = rows

    print(f"Tournaments with detail URLs: {len(rows)} | existing links: {len(links)} | to fetch: {len(needed)}")

    with ThreadPoolExecutor(max_workers=args.workers) as ex:
        future_to_id = {ex.submit(process_tournament, r): r for r in needed}
        for future in as_completed(future_to_id):
            t = future_to_id[future]
            result = future.result()
            if result is None:
                continue
            tid, live_url = result
            if tid is None:
                continue
            if live_url is None:
                errors += 1
                if tid not in links:
                    links[tid] = None
            else:
                if links.get(tid) == live_url and not args.force:
                    skipped += 1
                else:
                    links[tid] = live_url
                    updated += 1
            if (updated + errors + skipped) % 50 == 0:
                save_links(links)
                print(f"  ... processed {updated + errors + skipped}/{len(needed)}", flush=True)

    # ensure all rows have an entry (None if missing)
    for t in rows:
        if t["id"] not in links:
            links[t["id"]] = None

    save_links(links)
    print(f"Done. Updated: {updated}, Errors/None: {errors}, Skipped: {skipped}")
    print(f"Saved {len(links)} entries to {LINKS}")


if __name__ == "__main__":
    main()
