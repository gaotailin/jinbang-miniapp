import io, os, re, sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
hits = []
for root, dirs, files in os.walk("."):
    if any(s in root for s in ("node_modules", ".git", "miniprogram_npm")): continue
    for f in files:
        if f.endswith((".js", ".wxml", ".json")):
            p = os.path.join(root, f)
            try: t = io.open(p, encoding="utf-8").read()
            except Exception: continue
            if "订单" in t:
                for i, line in enumerate(t.split("\n"), 1):
                    if "订单" in line:
                        hits.append("%s:%d: %s" % (p, i, line.strip()[:100]))
print(len(hits))
print("\n".join(hits[:20]))
