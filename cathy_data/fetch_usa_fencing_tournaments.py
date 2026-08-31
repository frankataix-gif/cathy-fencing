#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fetch public USA Fencing tournament list from member.usfencing.org/search/tournaments
Save to CSV. This script does NOT log in. Only uses public data.

Usage:
    python fetch_usa_fencing_tournaments.py           # fetch all pages
    python fetch_usa_fencing_tournaments.py --pages 5 # fetch first 5 pages only
    python fetch_usa_fencing_tournaments.py --season 2026-2027
"""
import argparse
import csv
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin, urlencode

import requests
import lxml.html as lh

BASE_URL = "https://member.usfencing.org/search/tournaments"
OUT_DIR = Path(__file__).parent


def fetch_page(page=1, season=""):
    """Fetch a single page and return parsed rows + next page number."""
    params = {"page": page}
    if season:
        # USA Fencing uses query param like ?season=2026-2027
        params["season"] = season
    url = f"{BASE_URL}?{urlencode(params)}"
    print(f"Fetching {url} ...", flush=True)
    try:
        resp = requests.get(url, timeout=30, headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            )
        })
        resp.raise_for_status()
    except requests.RequestException as e:
        print(f"ERROR fetching page {page}: {e}", file=sys.stderr)
        return [], None

    doc = lh.fromstring(resp.content)
    rows = doc.xpath('//table[contains(@class, "table")]//tr')
    results = []
    for tr in rows:
        tds = tr.xpath('.//td')
        if len(tds) < 4:
            continue
        # Date / date range
        date_raw = " ".join(tds[0].text_content().split())
        # Description + link
        desc_link = tds[1].xpath('.//a')
        name = " ".join(tds[1].text_content().split())
        detail_url = ""
        if desc_link:
            href = desc_link[0].get("href", "")
            detail_url = urljoin(BASE_URL, href)
        # Location
        location = " ".join(tds[2].text_content().split())
        # Action / status
        action = " ".join(tds[3].text_content().split())

        start, end = parse_date_range(date_raw)

        results.append({
            "page": page,
            "date_raw": date_raw,
            "start": start,
            "end": end,
            "name": name,
            "detail_url": detail_url,
            "location": location,
            "action": action,
            "fetched_at": datetime.utcnow().isoformat() + "Z",
        })

    # Look for pagination using regex (fallback to any href with ?page=N)
    next_page = None
    for m in re.finditer(r'[?&]page=(\d+)', resp.text):
        n = int(m.group(1))
        if n > page and (next_page is None or n < next_page):
            next_page = n
    return results, next_page


def parse_date_range(raw):
    """Convert 'Sep 4 - 6, 2026' or 'Sep 4, 2026' to start/end ISO dates (year-month-day).
    Returns ('', '') if cannot parse.
    """
    raw = raw.replace(",", "")
    # month lookup
    months = {
        "Jan": "01", "Feb": "02", "Mar": "03", "Apr": "04",
        "May": "05", "Jun": "06", "Jul": "07", "Aug": "08",
        "Sep": "09", "Oct": "10", "Nov": "11", "Dec": "12",
    }
    # pattern: Sep 4 - 6 2026  or  Sep 4 2026
    m = re.match(r"([A-Za-z]{3})\s+(\d{1,2})\s*-\s*(\d{1,2})\s+(\d{4})", raw)
    if m:
        mon, d1, d2, yr = m.groups()
        y = f"{yr}-{months.get(mon, '01')}-"
        return y + d1.zfill(2), y + d2.zfill(2)
    m = re.match(r"([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})", raw)
    if m:
        mon, d, yr = m.groups()
        y = f"{yr}-{months.get(mon, '01')}-{d.zfill(2)}"
        return y, y
    return "", ""


def state_from_location(loc):
    """Extract two-letter US state/CA province from location string."""
    m = re.search(r',\s*([A-Z]{2})\b', loc)
    if m:
        return m.group(1)
    return ""


def region_from_state(st):
    """Map US state to USA Fencing Region (or INTL for non-US)."""
    regions = {
        "1": {"WA", "OR", "MT", "ID", "WY"},
        "2": {"ND", "SD", "NE", "KS", "OK", "TX", "MN", "IA", "MO", "AR", "LA", "WI", "IL"},
        "3": {"MI", "IN", "OH", "KY", "TN", "MS", "AL", "GA", "FL", "SC", "NC"},
        "4": {"CA", "NV", "UT", "CO", "AZ", "NM"},
        "5": {"PA", "NY", "NJ", "DE", "MD", "DC", "VA", "WV"},
        "6": {"ME", "NH", "VT", "MA", "RI", "CT"},
    }
    if not st:
        return ""
    for r, states in regions.items():
        if st in states:
            return r
    # Special cases for Canada / international
    ca = {"BC", "AB", "ON", "QC"}
    if st in ca:
        return "CA"  # Canada
    return "INTL"


def infer_circuits(name):
    """Infer circuit tags from the tournament name."""
    name_l = name.lower()
    tags = []
    for tag in ["SYC", "RYC", "RJCC", "ROC", "NAC", "RCC", "Local"]:
        if tag.lower() in name_l:
            if tag == "RCC":
                tags.append("RJCC")
            else:
                tags.append(tag)
    # dedup + default
    tags = list(dict.fromkeys(tags))
    if not tags:
        tags = ["Local"]
    return ",".join(tags)


def main():
    parser = argparse.ArgumentParser(description="Fetch USA Fencing tournament list")
    parser.add_argument("--pages", type=int, default=0, help="Max pages to fetch (0=all)")
    parser.add_argument("--season", default="", help="Filter by season, e.g. 2026-2027")
    parser.add_argument("--out", default="usa_fencing_all_tournaments.csv", help="Output CSV name")
    parser.add_argument("--delay", type=float, default=0.4, help="Seconds between requests")
    args = parser.parse_args()

    out_path = OUT_DIR / args.out
    all_rows = []
    page = 1
    max_pages = args.pages or 9999
    seen = set()

    while page <= max_pages:
        rows, next_p = fetch_page(page, args.season)
        if not rows:
            print(f"No rows on page {page}, stopping.")
            break
        for r in rows:
            key = (r["name"], r["start"], r["location"])
            if key in seen:
                continue
            seen.add(key)
            r["state"] = state_from_location(r["location"])
            r["region"] = region_from_state(r["state"])
            r["circuits"] = infer_circuits(r["name"])
            all_rows.append(r)
        print(f"Page {page}: {len(rows)} rows, total {len(all_rows)}", flush=True)
        if next_p is None or next_p <= page:
            break
        page = next_p
        time.sleep(args.delay)

    if not all_rows:
        print("No tournaments fetched.")
        return

    fieldnames = [
        "page", "date_raw", "start", "end", "name", "location", "state", "region",
        "circuits", "action", "detail_url", "fetched_at",
    ]
    with open(out_path, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(all_rows)
    print(f"\nSaved {len(all_rows)} tournaments to {out_path}")


if __name__ == "__main__":
    main()
