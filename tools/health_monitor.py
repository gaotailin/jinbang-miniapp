# -*- coding: utf-8 -*-
"""九色鹿接口巡检：每 30 分钟探活一次，异常就在桌面留警报文件 + 记日志。

背景：7月13日密钥被改坏后没人发现，小程序坏了 4 个半月。
     这个脚本就是为了让“坏了”当天就被看见。
"""
import os, sys, json, time, datetime, urllib.request, urllib.error

BASE = "https://jinbangtimingnm.cn"
KEY = "jinbang-2026"
HERE = os.path.dirname(os.path.abspath(__file__))
LOG = os.path.join(HERE, "health.log")
STATE = os.path.join(HERE, "health_state.json")
DESKTOP = os.path.join(os.path.expanduser("~"), "Desktop")
INTERVAL = 1800

CHECKS = [
    ("health", "GET", "/api/health", None),
    ("stats", "GET", "/api/stats", None),
    ("chat", "POST", "/api/chat", {"msg": "你好"}),
]


def log(msg):
    line = "[%s] %s" % (datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"), msg)
    with open(LOG, "a", encoding="utf-8") as f:
        f.write(line + "\n")
    print(line, flush=True)


def call(method, path, body):
    url = BASE + path
    data = None
    headers = {"X-API-Key": KEY}
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=30) as r:
        raw = r.read().decode("utf-8", "replace")
        return r.status, raw, int((time.time() - t0) * 1000)


def probe():
    problems = []
    detail = {}
    for name, method, path, body in CHECKS:
        try:
            code, raw, ms = call(method, path, body)
            detail[name] = {"code": code, "ms": ms}
            if code != 200:
                problems.append("%s HTTP %s" % (name, code))
                continue
            if name == "chat":
                j = json.loads(raw)
                engine = j.get("engine", "")
                detail[name]["engine"] = engine
                if engine == "fallback":
                    problems.append("chat 走兜底(fallback)，AI 可能不可用")
                elif ms > 20000:
                    problems.append("chat 响应 %dms 偏慢" % ms)
        except urllib.error.HTTPError as e:
            problems.append("%s HTTP %s" % (name, e.code))
        except Exception as e:
            problems.append("%s 请求异常: %s" % (name, e))
    return problems, detail


def read_state():
    try:
        return json.load(open(STATE, encoding="utf-8"))
    except Exception:
        return {}


def write_state(s):
    try:
        json.dump(s, open(STATE, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    except Exception:
        pass


def alert_file(problems):
    try:
        os.makedirs(DESKTOP, exist_ok=True)
        p = os.path.join(DESKTOP, "⚠️九色鹿接口异常.txt")
        with open(p, "w", encoding="utf-8") as f:
            f.write("九色鹿小程序接口异常\n时间：%s\n\n" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
            for x in problems:
                f.write("- " + x + "\n")
            f.write("\n排查：C:\\Users\\Administrator\\jinbang-miniapp\\check_api.py\n日志：%s\n" % LOG)
    except Exception:
        pass


def clear_alert():
    try:
        p = os.path.join(DESKTOP, "⚠️九色鹿接口异常.txt")
        if os.path.exists(p):
            os.remove(p)
    except Exception:
        pass


def main():
    log("巡检启动 间隔=%ds" % INTERVAL)
    last_ok = None
    while True:
        problems, detail = probe()
        st = read_state()
        if problems:
            log("异常 " + " | ".join(problems))
            if st.get("last_status") != "down":
                alert_file(problems)
            st["last_status"] = "down"
            st["last_detail"] = detail
        else:
            if last_ok is not None or st.get("last_status") == "down":
                log("恢复正常 " + json.dumps(detail, ensure_ascii=False))
                clear_alert()
            st["last_status"] = "up"
            st["last_ok"] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            st["last_detail"] = detail
        last_ok = not problems
        write_state(st)
        time.sleep(INTERVAL)


if __name__ == "__main__":
    if "--once" in sys.argv:
        p, d = probe()
        print("problems:", p or "none")
        print(json.dumps(d, ensure_ascii=False, indent=1))
    else:
        main()