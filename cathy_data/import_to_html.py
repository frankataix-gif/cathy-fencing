#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Import Region 1 / Region 4 tournaments from usa_fencing_all_tournaments.csv
into fencing_tournament_helper.html. Keeps existing curated entries.
Uses city coords if known, otherwise state centroids as fallback.
"""
import csv
import json
import re
import shutil
from datetime import datetime, timezone
from pathlib import Path

try:
    import json5
except Exception:
    json5 = None

BASE = Path(__file__).parent.parent  # project root
HTML = BASE / "fencing_tournament_helper.html"
BAK = BASE / "fencing_tournament_helper.html.bak"
CSV = BASE / "cathy_data" / "usa_fencing_all_tournaments.csv"
CACHE = BASE / "cathy_data" / "city_coords.json"
ENTRY_COUNTS = BASE / "cathy_data" / "entry_counts.json"
LIVE_LINKS = BASE / "cathy_data" / "live_links.json"
TRACKER_LINKS = BASE / "cathy_data" / "tracker_links.json"
VERSION = BASE / "cathy_data" / "version.json"

# Known city coords cache; will be updated as new cities are found
CITY_COORDS = {}

# Fallback state centroids (lat, lng) for cities not in cache
STATE_COORDS = {
    "WA": [47.4, -120.3], "OR": [44.0, -120.6], "MT": [47.0, -109.6], "ID": [44.2, -114.9], "WY": [43.0, -107.5],
    "CA": [36.8, -119.4], "NV": [39.3, -116.6], "UT": [39.3, -111.7], "CO": [39.0, -105.5], "AZ": [34.3, -111.7], "NM": [34.4, -106.1],
    "TX": [31.0, -99.8], "OK": [35.6, -97.5], "KS": [38.5, -98.4], "NE": [41.5, -99.8], "SD": [44.4, -100.2], "ND": [47.4, -100.3],
    "MN": [46.4, -94.6], "IA": [42.0, -93.2], "MO": [38.4, -92.4], "AR": [34.9, -92.4], "LA": [31.2, -92.0], "WI": [44.6, -89.8], "IL": [40.0, -89.3],
    "MI": [43.3, -84.6], "IN": [40.0, -86.2], "OH": [40.4, -82.9], "KY": [37.8, -84.9], "TN": [35.9, -86.4], "MS": [32.7, -89.7], "AL": [32.8, -86.8],
    "GA": [32.6, -83.4], "FL": [27.8, -81.8], "SC": [33.9, -80.9], "NC": [35.5, -79.2], "VA": [37.5, -78.7], "WV": [38.6, -80.7],
    "PA": [41.2, -77.6], "NY": [42.9, -75.6], "NJ": [40.2, -74.4], "DE": [39.0, -75.5], "MD": [39.0, -76.7], "DC": [38.9, -77.0],
    "CT": [41.6, -72.7], "RI": [41.7, -71.5], "MA": [42.4, -71.9], "VT": [44.0, -72.7], "NH": [43.9, -71.6], "ME": [45.4, -69.2],
    "AK": [64.1, -152.2], "HI": [20.7, -157.0],
    "BC": [53.7, -127.6], "AB": [53.9, -116.6], "ON": [51.3, -85.5], "QC": [52.0, -72.0],
}


def normalize_name(name):
    """去掉 USA Fencing CSV 名字里附加的实时状态后缀以及多余的 'Tournament'，和 curated 名字对齐。"""
    if not name:
        return name
    n = name.strip()
    # 去掉结尾的 "Happening now!" / "Tournament begins in N days." / "begins in N days." / "Late registration closes ..." / "Registration opens on ..."
    n = re.sub(r"\s+(?:Tournament\s+)?(?:Happening now!|begins? in \d+ day(?:s?)\.|Late registration closes?.*?from? now\.|Registration opens? on .*?)\s*$", "", n, flags=re.IGNORECASE)
    # 去掉 standalone 的 "Tournament" / "Competition" / "Championship" 后缀
    n = re.sub(r"\s+(?:Tournament|Competition|Championship)\s*$", "", n, flags=re.IGNORECASE)
    return n.strip()


def load_city_coords():
    global CITY_COORDS
    if CACHE.exists():
        try:
            CITY_COORDS = json.loads(CACHE.read_text(encoding="utf-8"))
        except Exception:
            CITY_COORDS = {}
    # Add some well-known Canadian tournament/fencing cities commonly used
    defaults = {
        "Vancouver, BC": [49.28, -123.12],
        "Toronto, ON": [43.65, -79.38],
    }
    for k, v in defaults.items():
        if k not in CITY_COORDS:
            CITY_COORDS[k] = v
    # Save updated
    CACHE.write_text(json.dumps(CITY_COORDS, ensure_ascii=False, indent=2), encoding="utf-8")


def save_city_coords():
    CACHE.write_text(json.dumps(CITY_COORDS, ensure_ascii=False, indent=2), encoding="utf-8")


def load_entry_counts():
    if ENTRY_COUNTS.exists():
        try:
            return json.loads(ENTRY_COUNTS.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def load_live_links():
    if LIVE_LINKS.exists():
        try:
            return json.loads(LIVE_LINKS.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def load_tracker_links():
    if TRACKER_LINKS.exists():
        try:
            return json.loads(TRACKER_LINKS.read_text(encoding="utf-8"))
        except Exception:
            pass
    return {}


def attach_cathy_entries(merged):
    counts = load_entry_counts()
    trackers = load_tracker_links()
    for t in merged:
        data = counts.get(t["id"])
        if not data or not data.get("counts"):
            t["cathy_entries"] = None
        else:
            t["cathy_entries"] = {
                "total": data.get("total", 0),
                "y12wf": data["counts"].get("Y12WF", 0),
                "y14wf": data["counts"].get("Y14WF", 0),
                "cdtwf": data["counts"].get("CDTWF", 0),
                "fetched_at": data.get("fetched_at", "")
            }
            tracker = trackers.get(t["id"])
            if tracker:
                t["cathy_entries"]["tracker"] = tracker


def attach_live_url(merged):
    links = load_live_links()
    for t in merged:
        url = links.get(t["id"])
        if url:
            t["live_url"] = url


def get_lat_lng(city, state):
    key = f"{city}, {state}".strip()
    if key in CITY_COORDS:
        return CITY_COORDS[key]
    # Try city-only
    if city in CITY_COORDS:
        return CITY_COORDS[city]
    # Fallback to state
    if state in STATE_COORDS:
        return STATE_COORDS[state]
    return [0.0, 0.0]


def parse_date(d):
    if not d:
        return None
    try:
        return datetime.strptime(d, "%Y-%m-%d").date()
    except Exception:
        return None


def parse_circuits(name):
    n = name.lower()
    circuits = []
    for tag in ["syc", "ryc", "rjcc", "roc", "nac"]:
        if tag in n:
            circuits.append(tag.upper())
    if "rcc" in n and "rjcc" not in n:
        circuits.append("RJCC")
    if not circuits:
        circuits.append("Local")
    return circuits


def parse_weapons(name):
    n = name.lower()
    w = []
    if "foil" in n:
        w.append("Foil")
    if "epee" in n or "épée" in n:
        w.append("Epee")
    if "saber" in n or "sabre" in n:
        w.append("Saber")
    if not w:
        w = ["Foil", "Epee", "Saber"]
    return w


def parse_age_groups(name, circuits):
    n = name.lower()
    ages = []
    mapping = [
        ("y8", "Y8"), ("y10", "Y10"), ("y12", "Y12"), ("y14", "Y14"),
        ("cadet", "CDT"), ("junior", "JNR"), ("senior", "SNR"),
        ("youth 8", "Y8"), ("youth 10", "Y10"), ("youth 12", "Y12"), ("youth 14", "Y14"),
    ]
    for pat, val in mapping:
        if pat in n:
            ages.append(val)
    if not ages:
        # default by circuit
        if any(c in circuits for c in ["RYC", "SYC"]):
            ages = ["Y10", "Y12", "Y14"]
        elif "RJCC" in circuits:
            ages = ["JNR", "CDT"]
        elif any(c in circuits for c in ["ROC", "NAC"]):
            ages = ["JNR", "CDT"]
        else:
            ages = ["Y10", "Y12", "Y14", "JNR", "CDT"]
    return ages


def parse_status(action):
    a = action.lower()
    if "closed" in a:
        return "closed"
    if "late" in a:
        return "late"
    if "open registration" in a or "register now" in a:
        return "open"
    if "not been set" in a or "view details" in a or "see preview" in a:
        return "not_yet_open"
    return "not_yet_open"


def infer_size(circuits):
    if any(c in circuits for c in ["SYC", "NAC"]):
        return "large"
    if any(c in circuits for c in ["RJCC", "ROC"]):
        return "medium"
    return "small"


def infer_difficulty(circuits):
    if any(c in circuits for c in ["SYC", "RJCC", "ROC", "NAC"]):
        return "advanced"
    return "beginner"


def make_id(name, start, city, state):
    clean = re.sub(r"[^a-z0-9]", "-", name.lower())[:30]
    return f"{clean}-{start}-{city.lower().replace(' ', '-')}-{state.lower()}"


def generate_tournaments_from_csv():
    rows = []
    if not CSV.exists():
        print(f"CSV not found: {CSV}")
        return []
    with open(CSV, encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for r in reader:
            start_dt = parse_date(r.get("start", ""))
            if not start_dt:
                continue
            # Only keep future or currently-running events (hide completed)
            end_dt = parse_date(r.get("end", "")) or start_dt
            today = datetime.now(timezone.utc).date()
            if end_dt < today:
                continue
            raw_name = r["name"]
            clean_name = normalize_name(raw_name)
            circuits = parse_circuits(clean_name)
            # Determine coordinates
            city = r.get("city", r.get("location", "").split(",")[0].strip())
            state = r.get("state", "")
            lat, lng = get_lat_lng(city, state)
            weapons = parse_weapons(clean_name)
            ages = parse_age_groups(clean_name, circuits)
            size = infer_size(circuits)
            difficulty = infer_difficulty(circuits)
            status = parse_status(r.get("action", ""))

            # use raw CSV location for city/state
            loc = r.get("location", "")
            loc_city = loc.split(",")[0].strip() if loc else city

            t = {
                # id 仍用 raw name，以兼容已缓存的 entry_counts.json 键
                "id": make_id(raw_name, r.get("start", ""), loc_city, state),
                "name": clean_name,
                "start": r.get("start", ""),
                "end": r.get("end", "") or r.get("start", ""),
                "city": loc_city,
                "state": state,
                "region": r["region"],
                "lat": round(float(lat), 2),
                "lng": round(float(lng), 2),
                "circuits": circuits,
                "age_groups": ages,
                "weapons": weapons,
                "size": size,
                "difficulty": difficulty,
                "recommended": False,
                "status": status,
                "notes": f"{r.get('action','')}. Data imported from USA Fencing public list.",
                "url": r.get("detail_url", ""),
            }
            rows.append(t)
    # sort by start date
    rows.sort(key=lambda x: x["start"])
    return rows


def extract_existing_tournaments(html_text):
    start = html_text.find('const TOURNAMENTS = [')
    if start < 0:
        raise ValueError("Could not find TOURNAMENTS array in HTML")
    start += len('const TOURNAMENTS = [')
    i = start
    bracket = 1
    while i < len(html_text) and bracket > 0:
        c = html_text[i]
        if c == '[':
            bracket += 1
        elif c == ']':
            bracket -= 1
        i += 1
    array_text = html_text[start:i - 1]
    if json5:
        return json5.loads('[' + array_text + ']')
    # Fallback to old regex parser (will fail on nested braces)
    objs = re.findall(r"\{[^{}]+\}", array_text)
    existing = []
    for s in objs:
        try:
            s_json = re.sub(r"(\w+):", r'"\1":', s)
            s_json = s_json.replace("'", '"')
            existing.append(json.loads(s_json))
        except Exception:
            pass
    return existing


def quote(val):
    if isinstance(val, str):
        return json.dumps(val, ensure_ascii=False)
    if isinstance(val, list):
        return "[" + ",".join(quote(v) for v in val) + "]"
    if isinstance(val, dict):
        return "{" + ",".join(f'{k}:{quote(v)}' for k, v in val.items()) + "}"
    if isinstance(val, bool):
        return "true" if val else "false"
    if val is None:
        return "null"
    return str(val)


def obj_to_str(obj):
    fields = ["id", "name", "start", "end", "city", "state", "region", "lat", "lng",
              "circuits", "age_groups", "weapons", "size", "difficulty", "recommended", "status", "notes", "url", "live_url", "cathy_entries"]
    parts = [f"{k}:{quote(obj[k])}" for k in fields if k in obj]
    return "  { " + ", ".join(parts) + " }"


def merge(existing, imported):
    # 先按完整四元组建立索引
    seen = {}
    by_id = {}
    for e in existing:
        by_id[e.get("id")] = e
        key = (e.get("name"), e.get("start"), e.get("city"), e.get("state"))
        seen[key] = e
    for t in imported:
        # 同 id 优先：旧 imported 记录名字带后缀，新 imported 同名但名字清洗过
        if t["id"] in by_id:
            old = by_id[t["id"]]
            old["name"] = t["name"]
            _merge_into(old, t)
            continue
        # 完整四元组匹配
        key = (t["name"], t["start"], t["city"], t["state"])
        if key in seen:
            old = seen[key]
            _merge_into(old, t)
            continue
        seen[key] = t
        by_id[t["id"]] = t

    # 二次合并：按 名字+开始+州 兜底，把重复的城市记录合并
    # 以没有 url（curated）/推荐/已有 cathy_entries 的记录为底
    groups = {}
    for e in seen.values():
        fkey = (e.get("name"), e.get("start"), e.get("state"))
        groups.setdefault(fkey, []).append(e)

    merged = []
    for items in groups.values():
        def score(e):
            return (not e.get("url"), e.get("recommended", False), bool(e.get("cathy_entries")), e.get("lat") != 0)
        base = max(items, key=score)
        for other in items:
            if other is base:
                continue
            _merge_into(base, other)
        merged.append(base)

    merged.sort(key=lambda x: x["start"])
    return merged


def _merge_into(old, t):
    # update coords/status if new data looks more complete
    if old.get("lat") == 0 and t["lat"]:
        old["lat"] = t["lat"]
        old["lng"] = t["lng"]
    if old.get("status") in ("not_yet_open", "open") and t["status"] in ("late", "closed"):
        old["status"] = t["status"]
    if not old.get("url") and t.get("url"):
        old["url"] = t["url"]
    if t.get("cathy_entries"):
        old["cathy_entries"] = t["cathy_entries"]



def update_html(merged):
    if HTML.exists():
        shutil.copy2(HTML, BAK)
    html = HTML.read_text(encoding="utf-8")
    new_array = ",\n".join(obj_to_str(o) for o in merged)
    new_html = re.sub(r"const\s+TOURNAMENTS\s*=\s*\[.*?\];",
                      f"const TOURNAMENTS = [\n{new_array}\n];",
                      html, flags=re.S)
    # update DATA_UPDATED to full UTC timestamp so timeAgo is accurate
    today = datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    new_html = re.sub(r"const\s+DATA_UPDATED\s*=\s*'[^']*';",
                      f"const DATA_UPDATED = '{today}';",
                      new_html)
    HTML.write_text(new_html, encoding="utf-8")
    VERSION.write_text(json.dumps({"version": today}, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Updated {HTML} with {len(merged)} tournaments. Backup: {BAK}")


def main():
    load_city_coords()
    if not CSV.exists():
        print(f"CSV not found. Run run_fetch_tournaments.bat first.")
        return
    html = HTML.read_text(encoding="utf-8")
    existing = extract_existing_tournaments(html)
    # 把已有记录的名字也做一次清洗，方便和 imported 合并
    for e in existing:
        e["name"] = normalize_name(e.get("name", ""))
    imported = generate_tournaments_from_csv()
    print(f"Found {len(imported)} current/upcoming tournaments from CSV")
    # 先给 imported 挂上 cathy_entries，再 merge，这样 curated 能继承
    attach_cathy_entries(imported)
    merged = merge(existing, imported)
    attach_live_url(merged)
    update_html(merged)
    save_city_coords()


if __name__ == "__main__":
    main()
