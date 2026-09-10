#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""根据关键词规则重新分类 cathy_data/emails.md 中的历史邮件。

用法：
    python reclassify_emails.py

规则按需调整 CATEGORY_KEYWORDS 即可。注意：短关键词容易引发 URL/随机字符误命中，
建议使用完整词或带 @ 的域名。
"""
import re
from pathlib import Path

# 关键词分类规则：命中即覆盖原分类（不区分大小写）
# 按列表顺序匹配，前面的规则优先
CATEGORY_KEYWORDS = [
    ('击剑', ['@usafencing', 'usafencing.org', 'usafencing']),
    # ('学校', ['meadowridge', 'school', 'student']),
    # ('营销', ['unsubscribe', 'promotion', 'sale']),
    # ('待办', ['invoice', 'payment', 'deadline']),
]


def keyword_classify(text):
    combined = text.lower()
    for category, keywords in CATEGORY_KEYWORDS:
        for k in keywords:
            if k.lower() in combined:
                return category
    return None


def reclassify_emails(path):
    text = Path(path).read_text(encoding='utf-8')
    # 按单独成行的 ## 分割，保留 ## 标记
    parts = re.split(r'\n(?=## )', text)
    if len(parts) < 2:
        return 0
    header = parts[0]
    entries = parts[1:]
    changed = 0
    new_entries = []
    for entry in entries:
        lines = entry.splitlines()
        if not lines:
            new_entries.append(entry)
            continue
        # 去掉标题行的 ## 前缀
        title_line = lines[0].lstrip('#').strip()
        m = re.match(r'^\[([^\]]+)\]\s*(.*)', title_line)
        if not m:
            new_entries.append(entry)
            continue
        old_category = m.group(1)
        subject = m.group(2)
        # 只处理带分类标签的邮件条目，跳过管理章节
        if not title_line.startswith('['):
            new_entries.append(entry)
            continue
        # 收集用于判断的文本
        meta_text = [subject]
        body_start = 0
        for i, line in enumerate(lines):
            if line.startswith('**发件人:**'):
                meta_text.append(line.replace('**发件人:**', '').strip())
            elif line.startswith('**摘要:**'):
                meta_text.append(line.replace('**摘要:**', '').strip())
            elif line.startswith('**待办:**'):
                meta_text.append(line.replace('**待办:**', '').strip())
            elif body_start == 0 and not line.startswith('**'):
                body_start = i
        meta_text.append('\n'.join(lines[body_start:body_start+20]))
        combined_text = ' '.join(meta_text)
        new_category = keyword_classify(combined_text)
        if new_category and new_category != old_category:
            lines[0] = f'## [{new_category}] {subject}'
            changed += 1
        new_entries.append('\n'.join(lines))
    new_text = header + ''.join(['\n' + e for e in new_entries])
    Path(path).write_text(new_text, encoding='utf-8')
    return changed


if __name__ == '__main__':
    repo = Path(__file__).parent
    path = repo / 'cathy_data' / 'emails.md'
    changed = reclassify_emails(path)
    print(f'已重新分类 {changed} 封邮件：{path}')
