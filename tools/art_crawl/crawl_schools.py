# -*- coding: utf-8 -*-
"""阳光高考(chsi)院校库全量爬取——官方公开源。产出 art_crawl/out/schools.json + .sql"""
import urllib.request, re, json, time, os, ssl, sys

OUT = os.path.join(os.path.dirname(__file__), 'out')
os.makedirs(OUT, exist_ok=True)
UA = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Referer': 'https://gaokao.chsi.com.cn/'}
CTX = ssl.create_default_context()
CTX.set_ciphers('DEFAULT@SECLEVEL=1')  # 兼容部分老服务器

def fetch(start):
    u = 'https://gaokao.chsi.com.cn/sch/search--ss-on,option-qg,searchType-1,start-%d.dhtml' % start
    for _ in range(3):
        try:
            r = urllib.request.urlopen(urllib.request.Request(u, headers=UA), timeout=25, context=CTX)
            return r.read().decode('utf-8', 'replace')
        except Exception as e:
            time.sleep(2)
    return ''

# 每个 sch-item 块：schId + 校名 + 地区 + 主管部门
ITEM = re.compile(
    r"schoolInfo--schId-(\d+)\.dhtml'.*?"
    r'class="name[^"]*"[^>]*>\s*([^<]+?)\s*</a>.*?'
    r'class="sch-department[^"]*"[^>]*>(.*?)</a>', re.S)

def parse(html):
    out = []
    for sid, name, dept in ITEM.findall(html):
        txt = re.sub(r'<[^>]+>', '', dept)
        txt = re.sub(r'&#x[0-9a-fA-F]+;', '', txt).replace('&nbsp;', ' ')
        loc = txt.split('|')[0].strip()
        depart = ''
        m = re.search(r'主管部门：\s*(.+)', txt)
        if m: depart = m.group(1).strip()
        out.append({'schId': int(sid), 'name': name.strip(), 'province_loc': loc, 'department': depart})
    return out

def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 2960
    seen = {}
    for start in range(0, limit, 20):
        html = fetch(start)
        rows = parse(html)
        for r in rows:
            seen[r['schId']] = r
        print('start=%d  本页%d  累计%d' % (start, len(rows), len(seen)), flush=True)
        if not rows and start > 0:
            break
        time.sleep(0.4)
    schools = list(seen.values())
    json.dump(schools, open(os.path.join(OUT, 'schools.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    # SQL
    with open(os.path.join(OUT, 'schools.sql'), 'w', encoding='utf-8') as w:
        for s in schools:
            nm = s['name'].replace("'", "")
            loc = s['province_loc'].replace("'", "")
            dp = s['department'].replace("'", "")
            w.write("INSERT INTO art_school(school,province,department) VALUES('%s','%s','%s');\n" % (nm, loc, dp))
    print('完成：%d 所院校 → out/schools.json + schools.sql' % len(schools))

if __name__ == '__main__':
    main()
