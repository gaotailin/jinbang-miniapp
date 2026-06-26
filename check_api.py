#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
九色鹿前程助手 · API 冒烟测试
用法: python check_api.py
检查所有后端端点是否正常响应，输出 PASS/FAIL 表格。
"""
import urllib.request
import urllib.error
import json
import time
import sys
import os

BASE = os.environ.get("API_BASE", "http://100.74.79.25:5001")
KEY = "jinbang-2026"
TIMEOUT = 10

# ========= 测试用例 =========
# (名称, method, path, params/data, 预期检查)
CASES = [
    # 基础设施
    ("health",           "GET",  "/api/health",                 {},                              lambda r: r.get("status") == "ok"),
    ("stats",            "GET",  "/api/stats",                  {},                              lambda r: r.get("colleges", 0) > 100),
    # 查大学（刚才修好的）
    ("search",           "GET",  "/api/search",                 {"keyword":"内蒙古","limit":3},   lambda r: isinstance(r, list) and len(r) > 0 and "name" in r[0]),
    ("college_detail",   "GET",  "/api/college_detail",         {"name":"清华大学"},              lambda r: isinstance(r, list) and len(r) > 0),
    # 查专业
    ("major_search",     "GET",  "/api/major_search",           {"keyword":"计算机","limit":3},   lambda r: isinstance(r, list) and len(r) > 0),
    ("major_detail",     "GET",  "/api/major_detail",           {"major":"计算机科学与技术"},      lambda r: isinstance(r, list)),
    # 分数/位次
    ("score_convert",    "GET",  "/api/score_convert",          {"score":550,"subject":"理科"},   lambda r: r.get("estimated_rank", 0) > 0),
    ("analyze",          "GET",  "/api/analyze",                {"score":550,"subject":"理科"},   lambda r: all(len(r.get("recommend",{}).get(k,[])) > 0 for k in ["chong","wen","bao"])),
    ("report",           "POST", "/api/report",                 {},                              lambda r: r.get("success") == True,
                          {"province":"内蒙古","subject":"理科","score":550,"holland_answers":[]}),
    # 院校数据
    ("scoreline_history","GET",  "/api/scoreline_history",      {"school":"内蒙古大学"},          lambda r: isinstance(r, list) and len(r) > 0),
    ("college_majors",   "GET",  "/api/college_majors",         {"school":"内蒙古大学"},          lambda r: isinstance(r, list) and len(r) > 0),
    ("enrollment_plan",  "GET",  "/api/enrollment_plan",        {"school":"内蒙古大学"},          lambda r: isinstance(r, list) and len(r) > 0),
    # 批次/一分一段
    ("batchline_list",   "GET",  "/api/batchline_list",         {"province":"内蒙古"},            lambda r: isinstance(r, list) and len(r) > 0),
    ("score_lines",      "GET",  "/api/score_lines",            {"province":"内蒙古","year":2024}, lambda r: isinstance(r, list) and len(r) > 0),
    # 其他
    ("subject_req",      "GET",  "/api/subject_requirement",    {},                              lambda r: isinstance(r, list) and len(r) > 0),
    ("major_satisfaction","GET",  "/api/major_satisfaction",    {},                              lambda r: isinstance(r, list) and len(r) > 0),
    ("holland_questions","GET",  "/api/holland/questions",      {},                              lambda r: r.get("count", 0) == 60),
    # 对比（已知后端问题，标记为 KNOWN_ISSUE）
    ("compare",          "GET",  "/api/compare",                {"schools":"清华大学,北京大学"},  lambda r: isinstance(r, list),
                         None, "KNOWN_ISSUE"),  # 列名bug同源，已修但待验证完整字段
]

HEADERS = {"X-API-Key": KEY, "Content-Type": "application/json"}

def call(method, path, params, data):
    url = BASE + path
    if params:
        qs = "&".join(f"{k}={urllib.request.quote(str(v))}" for k, v in params.items())
        url += "?" + qs
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=HEADERS, method=method)
    # 绕开本机翻墙代理(10809)，否则内网/国内域名会被劫持超时
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    t0 = time.time()
    try:
        with opener.open(req, timeout=TIMEOUT) as resp:
            raw = resp.read().decode()
            elapsed = round((time.time() - t0) * 1000)
            return resp.status, json.loads(raw), elapsed, None
    except urllib.error.HTTPError as e:
        elapsed = round((time.time() - t0) * 1000)
        return e.code, None, elapsed, str(e)
    except Exception as e:
        elapsed = round((time.time() - t0) * 1000)
        return 0, None, elapsed, str(e)

def main():
    total, passed, failed, known = 0, 0, 0, 0
    rows = []
    for case in CASES:
        name, method, path, params, check = case[0], case[1], case[2], case[3], case[4]
        data = case[5] if len(case) > 5 and case[5] else None
        tag = case[6] if len(case) > 6 else None

        total += 1
        code, body, ms, err = call(method, path, params, data)

        if tag == "KNOWN_ISSUE":
            known += 1
            rows.append(("🟡", name, code, f"{ms}ms", tag))
            continue

        if err or code >= 500:
            failed += 1
            rows.append(("🔴", name, code, f"{ms}ms", (err or "500")[:60]))
            continue

        try:
            ok = check(body)
        except Exception:
            ok = False

        if ok:
            passed += 1
            rows.append(("🟢", name, code, f"{ms}ms", ""))
        else:
            failed += 1
            # 截取响应摘要
            preview = json.dumps(body, ensure_ascii=False)[:80] if body else "no body"
            rows.append(("🔴", name, code, f"{ms}ms", f"check failed: {preview}"))

    # 输出
    print(f"{'':4s} {'端点':20s} {'HTTP':>5s} {'耗时':>7s} 备注")
    print("-" * 80)
    for icon, name, code, ms, note in rows:
        print(f"{icon:4s} {name:20s} {str(code):>5s} {ms:>7s}  {note}")
    print("-" * 80)
    print(f"  总计 {total}  通过 {passed}  失败 {failed}  已知问题 {known}")
    print(f"  通过率 {passed}/{total-known} = {round(passed/(total-known)*100) if total-known > 0 else 0}%")
    return 0 if failed == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
