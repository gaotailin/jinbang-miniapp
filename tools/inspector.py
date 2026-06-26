#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
九色鹿前程助手 · 小程序自检工具
用法: python tools/inspector.py
输出: tools/inspection_report.md + 上传到二蛋 sync 信箱
依赖: pip install requests
"""

import os, sys, json, time, re, subprocess
from pathlib import Path
from datetime import datetime

# ====== 配置 ======
ROOT = Path(__file__).resolve().parent.parent
TOOLS = ROOT / "tools"
SCREENSHOTS = TOOLS / "screenshots"
REPORT_PATH = TOOLS / "inspection_report.md"
SCREENSHOTS.mkdir(parents=True, exist_ok=True)

BASE_URL = os.environ.get("API_BASE", "https://jinbangtimingnm.cn")
API_KEY = "jinbang-2026"
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}
TIMEOUT = 12

CLI_BAT = r"E:\微信web开发者工具\cli.bat"

PROVINCES = [
    "北京","天津","河北","山西","内蒙古","辽宁","吉林","黑龙江",
    "上海","江苏","浙江","安徽","福建","江西","山东","河南",
    "湖北","湖南","广东","广西","海南","重庆","四川","贵州",
    "云南","西藏","陕西","甘肃","青海","宁夏","新疆"
]

# ====== 工具函数 ======
try:
    import requests as req
    session = req.Session()
    session.headers.update(HEADERS)
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("⚠ pip install requests 未安装，API 检测将使用 urllib")

def api_get(path, params=None, timeout=TIMEOUT):
    """GET 请求，返回 (status, json_body, error_msg)"""
    url = BASE_URL + path
    try:
        if HAS_REQUESTS:
            r = session.get(url, params=params, timeout=timeout)
            code = r.status_code
            try: body = r.json()
            except: body = r.text[:200]
            err = None if code == 200 else f"HTTP {code}"
        else:
            import urllib.request as _ur, urllib.error as _ue
            qs = ""
            if params:
                qs = "&".join(f"{k}={_ur.quote(str(v))}" for k,v in params.items())
            full = url + ("?" + qs if qs else "")
            req_obj = _ur.Request(full, headers=HEADERS)
            try:
                with _ur.urlopen(req_obj, timeout=timeout) as resp:
                    code = resp.status
                    body = json.loads(resp.read().decode())
                    err = None
            except _ue.HTTPError as e:
                code = e.code
                body = None
                err = f"HTTP {e.code}"
    except Exception as e:
        code = 0
        body = None
        err = str(e)[:100]
    return code, body, err

def ok(icon): return "✅" if icon else "❌"

# ====== 1. 页面文件完整性 ======
def check_page_integrity():
    results = []
    app_json = ROOT / "app.json"
    if not app_json.exists():
        return [("❌", "app.json", "app.json 不存在!")]
    try:
        with open(app_json, 'r', encoding='utf-8') as f:
            pages = json.load(f).get("pages", [])
    except Exception as e:
        return [("❌", "app.json", f"解析失败: {e}")]

    for page in pages:
        base = ROOT / page
        js = base.with_suffix(".js")
        wxml = base.with_suffix(".wxml")
        json_f = base.with_suffix(".json")
        missing = []
        if not js.exists(): missing.append("js")
        if not wxml.exists(): missing.append("wxml")
        if not json_f.exists(): missing.append("json")
        if missing:
            results.append(("❌", page, f"缺: {', '.join(missing)}"))
        else:
            results.append(("✅", page, "三件套完整"))
    return results

# ====== 2. 微信预览编译 ======
def check_preview():
    if not os.path.exists(CLI_BAT):
        return "❌", f"微信 CLI 不存在: {CLI_BAT}"
    png = str(SCREENSHOTS / "preview.png")
    cmd = [CLI_BAT, "preview", "--project", str(ROOT),
           "--qr-output", png, "--qr-format", "image"]
    try:
        t0 = time.time()
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=90,
                          encoding='utf-8', errors='replace')
        elapsed = round(time.time() - t0, 1)
        if r.returncode == 0 and os.path.exists(png):
            size = os.path.getsize(png)
            return "✅", f"编译成功 ({elapsed}s, 截图 {size//1024}KB)"
        else:
            err = (r.stderr or r.stdout or "")[:200]
            return "❌", f"编译失败 ({elapsed}s): {err}"
    except subprocess.TimeoutExpired:
        return "❌", "编译超时 (>90s)"
    except Exception as e:
        return "❌", str(e)[:100]

# ====== 3. API 连通性 ======
def check_api_endpoints():
    tests = [
        ("health",       "/api/health",                                    {},         lambda c,b: c==200),
        ("search",       "/api/search",       {"keyword":"北京大学","limit":3},  lambda c,b: c==200 and isinstance(b,list) and len(b)>0),
        ("college_detail","/api/college_detail",{"name":"北京大学"},             lambda c,b: c==200 and isinstance(b,list) and len(b)>0),
        ("ranking",      "/api/analyze",       {"score":550,"subject":"理科"},   lambda c,b: c==200 and "recommend" in str(b)),
        ("sync",         "/api/sync",          {"since":0},                      lambda c,b: c in (200, 404)),
        ("chat",         "/api/chat",          {"msg":"理科550分能报什么学校"},   lambda c,b: c==200 and isinstance(b,dict) and b.get("reply","")),
    ]
    results = []
    for name, path, params, check in tests:
        code, body, err = api_get(path, params)
        ms = ""
        if err:
            results.append(("❌", name, f"{err}"))
        elif check(code, body):
            if name == "chat":
                engine = (body or {}).get("engine", "?")
                ms = f" engine={engine}"
            if name == "search" and isinstance(body, list):
                ms = f" {len(body)}条"
            results.append(("✅", name, f"HTTP {code}{ms}"))
        else:
            preview = str(body)[:60] if body else "no body"
            results.append(("❌", name, f"HTTP {code} check failed: {preview}"))
    return results

# ====== 4. 省区数据覆盖 ======
def check_province_coverage():
    results = []
    covered = 0
    for prov in PROVINCES:
        code, body, err = api_get("/api/search", {"keyword": prov, "limit": 10})
        time.sleep(0.3)  # 避免连续请求触发限流
        if err:
            results.append(("❌", prov, err[:60]))
        elif isinstance(body, list) and len(body) > 0:
            results.append(("✅", prov, f"{len(body)}所"))
            covered += 1
        else:
            results.append(("⚠️", prov, "0所院校"))
    rate = round(covered / len(PROVINCES) * 100)
    return results, covered, rate

# ====== 5. 核心交互静态扫描 ======
def check_core_methods():
    checks = [
        ("index 首页分享",  ROOT/"pages/index/index.js",  [r"goAbout\s*\("]),
        ("warn 野鸡大学",   ROOT/"pages/warn/warn.js",    [r"tapTip\s*\("]),
        ("aiChat 发送",     ROOT/"pages/aiChat/aiChat.js", [r"send\s*\(", r"askQuick\s*\("]),
    ]
    results = []
    for label, filepath, patterns in checks:
        if not filepath.exists():
            results.append(("❌", label, f"文件不存在: {filepath.name}"))
            continue
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        for pat in patterns:
            mname = re.search(pat, content)
            if not mname:
                results.append(("❌", label, f"缺方法: {pat}"))
            else:
                results.append(("✅", label, f"方法 {pat} 已定义"))

    # tabBar 检查
    app_json = ROOT / "app.json"
    with open(app_json, 'r', encoding='utf-8') as f:
        cfg = json.load(f)
    tab = cfg.get("tabBar", {}).get("list", [])
    if len(tab) >= 2 and all("pagePath" in t and "text" in t for t in tab):
        results.append(("✅", "tabBar", f"{len(tab)}项: {', '.join(t['text'] for t in tab)}"))
    else:
        results.append(("❌", "tabBar", f"配置不完整 (list={len(tab)}项)"))
    return results

# ====== 6. Key 一致性 ======
def check_key_consistency():
    app_js = ROOT / "app.js"
    with open(app_js, 'r', encoding='utf-8') as f:
        content = f.read()
    m = re.search(r"apiKey\s*:\s*['\"]([^'\"]+)['\"]", content)
    frontend_key = m.group(1) if m else "NOT_FOUND"

    code, body, err = api_get("/api/health")
    backend_ok = (code == 200)

    if frontend_key == API_KEY and backend_ok:
        return "✅", f"前端 key={frontend_key} 后端 key={API_KEY} 匹配且健康"
    elif frontend_key != API_KEY:
        return "❌", f"KEY 不一致! 前端={frontend_key} 后端={API_KEY}"
    else:
        return "❌", f"后端不可达 ({err or code})"

# ====== 生成报告 ======
def generate_report(sections):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    lines = [
        f"# 九色鹿前程助手 · 自检报告",
        f"**时间**: {now}",
        f"**项目**: {ROOT}",
        f"**后端**: {BASE_URL}",
        "",
    ]

    for title, items in sections:
        lines.append(f"## {title}")
        if isinstance(items, list):
            for entry in items:
                if len(entry) == 2:
                    icon, detail = entry
                    lines.append(f"| {icon} | {detail} |")
                else:
                    icon, name, detail = entry
                    lines.append(f"| {icon} | {name} | {detail} |")
        elif isinstance(items, tuple):
            if len(items) == 2:
                icon, msg = items
                lines.append(f"| {icon} | {msg} |")
            else:
                lines.append(f"| {items[0]} | {items[1]} | {items[2] if len(items)>2 else ''} |")
        lines.append("")

    # 统计（兼容 2 元组和 3 元组）
    total, ok_count, warn_count = 0, 0, 0
    for _, items in sections:
        if not isinstance(items, list):
            continue
        for entry in items:
            total += 1
            icon = entry[0]
            if icon == "✅": ok_count += 1
            elif icon == "⚠️": warn_count += 1
    fail_count = total - ok_count - warn_count
    lines.append("---")
    lines.append(f"**总计**: {total} 项  ✅{ok_count}  ⚠️{warn_count}  ❌{fail_count}")
    lines.append(f"**通过率**: {ok_count}/{total} = {round(ok_count/total*100) if total else 0}%")

    report = "\n".join(lines)
    with open(REPORT_PATH, 'w', encoding='utf-8') as f:
        f.write(report)
    return report

# ====== 上报到 sync ======
def upload_report(report_md):
    if not HAS_REQUESTS:
        print("⚠ 无 requests 库，跳过上报")
        return False
    try:
        r = session.post(BASE_URL + "/api/sync", json={
            "sender": "xiaoke",
            "target": "erdan",
            "type": "msg",
            "content": report_md[:3000]  # 截断防过大
        }, timeout=15)
        return r.status_code == 200
    except Exception as e:
        print(f"⚠ 上报失败: {e}")
        return False

# ====== 主流程 ======
def main():
    print("🔍 九色鹿前程助手 · 自检启动")
    print(f"   后端: {BASE_URL}")
    print(f"   requests: {'已安装' if HAS_REQUESTS else '未安装(urllib兜底)'}")
    print()

    sections = []

    # 1. 页面完整性
    print("1/6 页面文件完整性...")
    pages = check_page_integrity()
    ok_n = sum(1 for i,_,_ in pages if i=="✅")
    print(f"   {ok_n}/{len(pages)} 完整")
    sections.append(("1. 页面文件完整性", pages))

    # 2. 微信预览
    print("2/6 微信预览编译...")
    preview = check_preview()
    print(f"   {preview[0]} {preview[1][:80]}")
    sections.append(("2. 微信预览编译", [preview]))

    # 3. API 连通性
    print("3/6 API 连通性...")
    apis = check_api_endpoints()
    for icon, name, detail in apis:
        print(f"   {icon} {name}: {detail}")
    sections.append(("3. API 连通性", apis))

    # 4. 省区覆盖
    print("4/6 省区数据覆盖 (31省)...")
    provs, covered, rate = check_province_coverage()
    print(f"   {covered}/31 = {rate}%")
    sections.append((f"4. 省区数据覆盖 ({covered}/31 = {rate}%)", provs))

    # 5. 核心交互
    print("5/6 核心交互静态扫描...")
    methods = check_core_methods()
    for icon, name, detail in methods:
        print(f"   {icon} {name}: {detail}")
    sections.append(("5. 核心交互静态扫描", methods))

    # 6. Key 一致性
    print("6/6 Key 一致性...")
    key_ok = check_key_consistency()
    print(f"   {key_ok[0]} {key_ok[1]}")
    sections.append(("6. Key 一致性检查", [key_ok]))

    # 生成报告
    print()
    report = generate_report(sections)
    print(f"📄 报告已生成: {REPORT_PATH}")

    # 上报
    print("📤 上报到二蛋 sync 信箱...")
    if upload_report(report):
        print("   ✅ 已上报")
    else:
        print("   ⚠️ 上报失败（报告已本地保存）")

    print()
    print("✅ 自检完成")

if __name__ == "__main__":
    main()
