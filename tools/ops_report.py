# -*- coding: utf-8 -*-
"""九色鹿 · 运营日报。每天跑一次，或随时看数。
用法: python ops_report.py
"""
import sys, io, json, urllib.request, urllib.parse, datetime

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

BASE = "https://jinbangtimingnm.cn"
KEY = "jinbang-2026"


def q(sql):
    u = BASE + "/api/sql?q=" + urllib.parse.quote(sql)
    req = urllib.request.Request(u, headers={"X-API-Key": KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def one(sql, default=0):
    try:
        rows = q(sql)
        if rows and isinstance(rows, list):
            return list(rows[0].values())[0]
    except Exception as e:
        return "ERR:%s" % str(e)[:40]
    return default


def main():
    today = datetime.date.today().isoformat()
    print("=" * 46)
    print(" 九色鹿 · 运营日报   %s" % datetime.datetime.now().strftime("%Y-%m-%d %H:%M"))
    print("=" * 46)

    total_users = one("SELECT COUNT(*) FROM users")
    new_today = one("SELECT COUNT(*) FROM users WHERE date(created_at)='%s'" % today)
    new_7d = one("SELECT COUNT(*) FROM users WHERE date(created_at)>=date('now','-7 day')")
    logins_today = one("SELECT COUNT(*) FROM user_login_log WHERE date(login_time)='%s'" % today)
    dau = one("SELECT COUNT(DISTINCT user_id) FROM user_login_log WHERE date(login_time)='%s'" % today)
    fav = one("SELECT COUNT(*) FROM jb_cloud_fav")
    orders = one("SELECT COUNT(*) FROM vip_orders WHERE state='PAID'")

    print("\n【用户】")
    print("  累计用户      %-8s" % total_users)
    print("  今日新增      %-8s" % new_today)
    print("  近7日新增     %-8s" % new_7d)
    print("  今日登录次数  %-8s" % logins_today)
    print("  今日活跃人数  %-8s" % dau)

    print("\n【转化】")
    print("  云端选校单    %-8s" % fav)
    print("  已支付订单    %-8s" % orders)

    print("\n【历史真实使用】")
    first_use = one("SELECT MIN(date(updated_at,'unixepoch','+8 hours')) FROM jb_cloud_fav")
    last_use = one("SELECT MAX(date(updated_at,'unixepoch','+8 hours')) FROM jb_cloud_fav")
    print("  用过的人      %-8s （云端选校单按 openid 去重）" % fav)
    print("  首次使用      %-8s" % first_use)
    print("  最近使用      %-8s" % last_use)

    print("\n【数据】")
    print("  院校          %-8s" % one("SELECT COUNT(*) FROM college_detail"))
    print("  专业          %-8s" % one("SELECT COUNT(*) FROM major_detail"))
    print("  录取记录      %-8s" % one("SELECT COUNT(*) FROM enrollment"))
    print("  最新录取年份  %-8s" % one("SELECT MAX(year) FROM enrollment"))

    print("\n【提示】")
    if total_users == 0:
        print("  ⚠ 还没有真实用户。先做入口：公众号 / 视频号 / 家长群 / 搜一搜。")
    if str(one("SELECT MAX(year) FROM enrollment")) < "2026":
        print("  ⚠ 录取数据只到 %s 年，缺 2026 年数据（对 2027 届参考价值最高的那一届）。"
              % one("SELECT MAX(year) FROM enrollment"))
    if orders == 0:
        print("  · 还没有付费订单，蓄水期不追付费，先追人数和留存。")
    if last_use and str(last_use).startswith("2026-06"):
        print("  · 上一批用户集中在 6 月志愿填报期 → 6 月下旬(出分后 72 小时)是全年主战场。")
    print("=" * 46)


if __name__ == "__main__":
    main()