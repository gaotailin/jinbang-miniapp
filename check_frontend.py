#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
九色鹿前程助手 · 前端代码静态扫描
用法: python check_frontend.py [--strict]
扫描所有页面 JS 文件，检测常见 Bug 模式并输出报告。
"""
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).parent
PAGES = ROOT / "pages"

# ========= 检查规则 =========
# (规则名, 严重度, 正则/grep 模式, 说明)
RULES_PAGE = []

def rule(name, severity, pattern, desc):
    RULES_PAGE.append((name, severity, pattern, desc))

# 🔴 严重
# 这两条已修完，不再告警
# rule("API参数名-旧列名", ...)
# rule("API参数-school送错", ...)

rule("SQL拼接用户输入", "🔴",
     r"\$\{.*(?:examType|rank|score|keyword|subject)\b.*\}",
     "用户输入直接拼入 SQL 字符串 → 注入风险")

rule("Promise无catch", "🔴",
     r"app\.request\([^)]+\)\s*\.then\((?:(?!catch).)*$",
     "app.request().then() 缺少 .catch() 兜底")

rule("硬编码年份", "🔴",
     r"(?:year|YEAR)\s*[=:]\s*202[45]|'202[45]-",
     "硬编码年份，高考季/数据年会过时")

# 🟡 警告
rule("毫秒时间戳未格式化", "🟡",
     r"item\.time\b|\.time\s*\}\}",
     "毫秒时间戳直接显示，用户看到 1718123456789")

rule("数组直接索引无长度检查", "🟡",
     r"\[0\]\.\w+.*\|\|",
     "取数组第一项无长度检查 → undefined 属性访问")

rule("省份列表全量显示", "🟡",
     r"PROVINCES.*=.*\[.*北京.*上海",
     "31省全量列出但 DATA_READY 只开少数 → 用户选完才被告知不可用")

rule("位次模式分数回填", "🟡",
     r"setData.*score.*rank|score.*converted",
     "位次查询后 score 被覆盖为用户看不懂的换算分")

# 🟢 建议
rule("wx.request无timeout", "🟢",
     r"wx\.request\(\{(?:(?!timeout).)*\}",
     "wx.request 未设 timeout，弱网可能永远挂起")

rule("wx:if缺少空态", "🟢",
     r"wx:for=.*(?:(?!wx:if).)*$",
     "列表渲染无 wx:if 兜底空态 → 数据为空时页面白板")

rule("hover-class缺失", "🟢",
     r"bindtap=.*(?:(?!hover-class).)*>",
     "可点击元素无 hover-class → 无触觉反馈")

# ========= 扫描引擎 =========
def scan_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception:
        return []

    findings = []
    lines = content.split('\n')

    for name, severity, pattern, desc in RULES_PAGE:
        # 多行模式的规则特殊处理
        if name == "Promise无catch":
            # 找所有 app.request(...).then(... 但后面没有 .catch
            blocks = re.findall(r"app\.request\([^)]+\)\s*\.then\(", content)
            for block in blocks:
                # 检查该 .then 后面 200 字符内有无 .catch
                idx = content.find(block)
                tail = content[idx:idx+500]
                if ".catch" not in tail:
                    line_no = content[:idx].count('\n') + 1
                    findings.append((severity, name, filepath, line_no, desc))
                    break
            continue

        if name == "wx:if缺少空态":
            # 找 wx:for 但没有对应的 wx:if 空态
            for m in re.finditer(r'wx:for="\{\{(.+?)\}\}"', content):
                var = m.group(1).strip()
                if f'wx:if="{{{{!{var}.length}}}}"' not in content and f'wx:if="{{{{!{var}}}}}' not in content:
                    line_no = content[:m.start()].count('\n') + 1
                    findings.append((severity, name, filepath, line_no,
                                     f"wx:for={var} 缺少 wx:if 空态保护"))
            continue

        # 单行正则匹配
        for i, line in enumerate(lines, 1):
            if re.search(pattern, line):
                # 过滤已知已修复的（compare.js 的 school→name 已修）
                if name == "API参数-school送错" and "compare.js" in str(filepath):
                    continue
                findings.append((severity, name, filepath, i, f"{desc}\n    → {line.strip()[:100]}"))
                if severity == "🔴":
                    break  # 每文件每规则只报一次

    return findings

def main():
    strict = "--strict" in sys.argv
    all_findings = []

    js_files = list(PAGES.rglob("*.js"))
    print(f"🔍 扫描 {len(js_files)} 个页面 JS 文件...\n")

    for fp in sorted(js_files):
        findings = scan_file(fp)
        all_findings.extend(findings)

    # 按严重度排序
    order = {"🔴": 0, "🟡": 1, "🟢": 2}
    all_findings.sort(key=lambda x: (order.get(x[0], 9), str(x[2]), x[3]))

    # 输出
    red = [f for f in all_findings if f[0] == "🔴"]
    yellow = [f for f in all_findings if f[0] == "🟡"]
    green = [f for f in all_findings if f[0] == "🟢"]

    if red:
        print(f"🔴 严重问题 ({len(red)}):")
        for _, name, fp, line, desc in red:
            rel = str(Path(fp).relative_to(ROOT))
            print(f"  [{name}] {rel}:{line}")
            for dline in desc.split('\n'):
                print(f"        {dline.strip()}")
        print()

    if yellow:
        print(f"🟡 警告 ({len(yellow)}):")
        for _, name, fp, line, desc in yellow:
            rel = str(Path(fp).relative_to(ROOT))
            print(f"  [{name}] {rel}:{line}")
            for dline in desc.split('\n'):
                print(f"        {dline.strip()}")
        print()

    if green:
        print(f"🟢 建议 ({len(green)}):")
        for _, name, fp, line, desc in green:
            rel = str(Path(fp).relative_to(ROOT))
            print(f"  [{name}] {rel}:{line}")
            for dline in desc.split('\n'):
                print(f"        {dline.strip()}")
        print()

    print(f"📊 总计 {len(all_findings)} 项: 🔴{len(red)} 🟡{len(yellow)} 🟢{len(green)}")

    if strict:
        return 1 if red else 0
    return 0

if __name__ == "__main__":
    sys.exit(main())
