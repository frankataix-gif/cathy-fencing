#!/usr/bin/env python3
"""
自动从 FencingTracker 抓取 Cathy He（何云熙）的比赛成绩。
数据来源：https://fencingtracker.com/p/<USFA_ID>/<slug>/history
公开数据，无需登录 USA Fencing。
"""

import json
import re
import sys
from pathlib import Path
from datetime import datetime
from urllib.parse import quote

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError as e:
    print(f"缺少依赖: {e}")
    sys.exit(1)

ROOT = Path(__file__).parent
HTML_DIR = ROOT.parent

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def fetch_history(usfa_id: int, slug: str):
    """抓取 FencingTracker history 页面，返回 BeautifulSoup 对象。"""
    url = f"https://fencingtracker.com/p/{usfa_id}/{slug}/history"
    print(f"Fetching {url}")
    resp = requests.get(url, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    return BeautifulSoup(resp.text, "html.parser")


def parse_bout_row(row):
    """从一行 bout 数据提取关键字段。"""
    tds = row.find_all("td")
    if not tds:
        return None

    def get_text(td, sel=None):
        if sel:
            el = td.select_one(sel)
            return (el.get_text(strip=True) if el else "")
        return td.get_text(strip=True)

    # 列索引从表头确定；按类名更安全
    bout = ""
    result = ""
    score = ""
    opponent = ""
    opponent_club = ""
    opponent_country = ""
    for td in tds:
        cls = " ".join(td.get("class", []))
        if "person-history__bout-col" in cls:
            bout = td.get("data-ranking-text", td.get_text(strip=True))
        elif "person-history__result-col" in cls:
            result = td.get("data-ranking-text", td.get_text(strip=True))
        elif "person-history__score-col" in cls:
            score = td.get("data-ranking-text", td.get_text(strip=True))
        elif "person-history__opponent-col" in cls:
            link = td.select_one("a")
            opponent = (link.get_text(strip=True) if link else td.get_text(strip=True))
        elif "person-history__club-col" in cls:
            opponent_club = td.get("data-ranking-text", td.get_text(strip=True))
        elif "person-history__country-col" in cls:
            opponent_country = td.get("data-ranking-text", td.get_text(strip=True))

    if not result and not score:
        return None
    return {
        "bout": bout,
        "result": result,
        "score": score,
        "opponent": opponent,
        "opponent_club": opponent_club,
        "opponent_country": opponent_country,
    }


def parse_event_section(section):
    """解析单个比赛（section）。"""
    title = ""
    h2 = section.find("h2")
    if h2:
        title = h2.get_text(strip=True)

    event_name = ""
    event_link = section.select_one("a.person-history__event-link")
    if event_link:
        event_name = event_link.get_text(strip=True)

    # meta chips: C2, Y14 and date
    chips = section.select(".person-history__meta-chip")
    event_class = ""
    age_group = ""
    date_str = ""
    for chip in chips:
        text = chip.get_text(strip=True)
        # 有些 meta chip 是 "C2, Y14" 合并在一个 span 里
        parts = [p.strip() for p in text.split(",")]
        for p in parts:
            p = p.strip()
            if re.match(r"^Y\d{1,2}$", p):
                age_group = p
            elif re.match(r"^[A-Z]\d{1,2}$", p):
                event_class = p
        # 日期 chip 示例：September 7, 2026
        if re.search(r"\d{4}", text) and ("," in text and re.search(r"[A-Za-z]+", text)):
            date_str = text

    # fact chips: Place 21 of 86, Seed 50, Not ranked, Rating U
    fact_texts = [fc.get_text(strip=True) for fc in section.select(".person-history__fact-chip")]
    place = ""
    seed = ""
    ranked = ""
    rating = ""
    total = None
    for ft in fact_texts:
        if ft.startswith("Place"):
            place = ft.replace("Place", "").strip()
            m = re.search(r"(\d+)\s*(?:of|/|\\)\s*(\d+)", place)
            if m:
                total = int(m.group(2))
        elif ft.startswith("Seed"):
            seed = ft.replace("Seed", "").strip()
        elif ft.startswith("Not ranked"):
            ranked = "Not ranked"
        elif ft.startswith("Rating"):
            rating = ft.replace("Rating", "").strip()

    # bouts
    table = section.select_one("table.person-history__event-table")
    bouts = []
    if table:
        for row in table.select("tbody tr"):
            bout = parse_bout_row(row)
            if bout:
                bouts.append(bout)

    return {
        "tournament": title,
        "event": event_name,
        "event_class": event_class,
        "age_group": age_group,
        "date_display": date_str,
        "place": place,
        "seed": seed,
        "ranked": ranked,
        "rating": rating,
        "total": total,
        "bouts": bouts,
        "source_url": "https://fencingtracker.com" + event_link.get("href") if event_link and event_link.get("href") else "",
    }


def parse_history(soup):
    """解析 history 页面，返回所有比赛成绩。"""
    sections = soup.select("section[data-person-history-event]")
    results = []
    for sec in sections:
        try:
            event = parse_event_section(sec)
            if event.get("tournament") or event.get("bouts"):
                results.append(event)
        except Exception as e:
            print(f"解析某场比赛失败: {e}", file=sys.stderr)
    return results


def write_markdown(results, path: Path):
    """生成 markdown 成绩记录。"""
    lines = ["# 比赛成绩 / Results", "", "自动从 FencingTracker 抓取，最后更新：" + datetime.now().strftime("%Y-%m-%d %H:%M:%S"), ""]

    if not results:
        lines += ["## 暂无成绩", "", "- 待 FencingTracker 更新或补充"]
        path.write_text("\n".join(lines), encoding="utf-8")
        return

    lines += ["## 概览", "", "| 日期 | 赛事 | 项目 | 名次 | 参赛人数 | 种子 | 评分 |", "|------|------|------|------|----------|------|------|"]
    for r in results:
        total = r.get("total") or "-"
        lines.append(f"| {r.get('date_display', '')} | {r.get('tournament', '')} | {r.get('event', '')} | {r.get('place', '')} | {total} | {r.get('seed', '')} | {r.get('rating', '')} |")

    lines.append("")
    for r in results:
        lines.append(f"## {r.get('date_display', '')} · {r.get('tournament', '')}")
        lines.append(f"- 项目：{r.get('event', '')} ({r.get('event_class', '')}, {r.get('age_group', '')})")
        lines.append(f"- 名次：{r.get('place', '')}")
        lines.append(f"- 种子：{r.get('seed', '')}")
        lines.append(f"- 评分：{r.get('rating', '')}")
        if r.get("bouts"):
            lines.append("- 对手记录：")
            for b in r["bouts"]:
                club = f" ({b.get('opponent_club', '')})" if b.get('opponent_club') else ""
                lines.append(f"  - {b.get('bout', '')}: {b.get('opponent', '')}{club} {b.get('score', '')} {b.get('result', '')}")
        lines.append("")

    path.write_text("\n".join(lines), encoding="utf-8")


def main():
    usfa_id = 102111079
    slug = "yunxi-he"
    soup = fetch_history(usfa_id, slug)
    results = parse_history(soup)

    json_path = ROOT / "results.json"
    md_path = ROOT / "results.md"

    json_path.write_text(json.dumps({"results": results}, ensure_ascii=False, indent=2), encoding="utf-8")
    write_markdown(results, md_path)

    print(f"抓到 {len(results)} 场比赛成绩")
    print(f"Saved: {json_path}")
    print(f"Saved: {md_path}")


if __name__ == "__main__":
    main()
