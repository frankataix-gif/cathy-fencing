#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Extract text from files in 1 Files/Updates/ and save to
 cathy_data/updates_extracted.md. This raw text is then used to update
cathy_database.md manually or by Devin.
"""
from pypdf import PdfReader
from pathlib import Path

BASE = Path(__file__).parent.parent
UPDATES = BASE / "1 Files" / "Updates"
OUT = BASE / "cathy_data" / "updates_extracted.md"


def extract_pdf(path):
    try:
        r = PdfReader(str(path))
        parts = []
        for p in r.pages:
            try:
                parts.append(p.extract_text() or '')
            except Exception:
                pass
        return '\n'.join(parts)
    except Exception as e:
        return f"[无法读取: {e}]"


def main():
    lines = ["# Updates 上传资料提取 / Extracted Uploads\n", f"来源: {UPDATES}\n"]
    if not UPDATES.exists():
        lines.append("1 Files/Updates/ 目录不存在。\n")
        OUT.write_text('\n'.join(lines), encoding='utf-8', errors='replace')
        print("No updates folder")
        return

    files = sorted(UPDATES.iterdir())
    if not files:
        lines.append("暂无上传文件。\n")
    for f in files:
        lines.append(f"\n## {f.name}\n")
        if f.suffix.lower() == '.pdf':
            text = extract_pdf(f)
            lines.append(f"\n```\n{text}\n```\n")
        elif f.suffix.lower() in ('.png', '.jpg', '.jpeg'):
            lines.append("（图片文件，请由 Devin 读取图片后整理）\n")
        else:
            try:
                text = f.read_text(encoding='utf-8', errors='replace')
                lines.append(f"\n```\n{text}\n```\n")
            except Exception as e:
                lines.append(f"[无法读取: {e}]\n")

    OUT.write_text('\n'.join(lines), encoding='utf-8', errors='replace')
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
