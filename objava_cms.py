"""Zajednički korak objave: skuplja javne datoteke u _site/ za GitHub Pages.

Poziva ga objava.py svake stranice (lokalno ili u GitHub Actions).
- kopira samo navedene javne datoteke (nikad data/, backup/, server…)
- PREVIEW=1 → noindex na svim stranicama + gumb „Uredi stranicu (demo)”
- lokalnim CSS/JS datotekama dodaje ?v=<commit> da posjetitelji odmah dobiju novu verziju
- zapisuje version.json (uređivač po njemu prepoznaje da je objava gotova)
"""
import json
import os
import re
import shutil
import subprocess
import time

DEMO_WRAP = ('<div class="cms-demo" style="position:fixed;left:16px;bottom:16px;z-index:90;display:flex;flex-direction:column;'
             'align-items:flex-start;gap:8px">{links}</div>')
DEMO_BTN = ('<a href="{href}" style="display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 18px;border-radius:999px;'
            'background:#111827;color:#fff;font:600 14px system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.25);'
            'text-decoration:none;border:1px solid rgba(255,255,255,.15)"><span style="width:8px;height:8px;border-radius:50%;'
            'background:{dot}"></span>{text}</a>')


def sha():
    s = os.environ.get("GITHUB_SHA")
    if s:
        return s
    try:
        return subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip()
    except Exception:
        return str(int(time.time()))


def collect(root, public, out="_site", preview=None, demo_pages=(), demo_buttons=(("uredi.html?demo", "Uredi stranicu (demo)"),)):
    preview = os.environ.get("PREVIEW", "1") == "1" if preview is None else preview
    out = os.path.join(root, out)
    if os.path.isdir(out):
        shutil.rmtree(out)
    os.makedirs(out)
    for f in public:
        src = os.path.join(root, f)
        if not os.path.exists(src):
            continue
        dst = os.path.join(out, f)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        (shutil.copytree if os.path.isdir(src) else shutil.copy2)(src, dst)
    open(os.path.join(out, ".nojekyll"), "w").close()

    v = sha()[:10]
    for dirpath, _, files in os.walk(out):
        for name in files:
            if not name.endswith(".html"):
                continue
            p = os.path.join(dirpath, name)
            s = open(p, encoding="utf-8").read()
            # lokalne css/js datoteke: nova oznaka verzije
            s = re.sub(r'((?:src|href)="(?![a-z]+:|//|#)[^"?#]+\.(?:css|js))(?:\?v=[\w]+)?"', r'\1?v=' + v + '"', s)
            rel = os.path.relpath(p, out)
            if preview and 'name="robots"' not in s:
                s = s.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex">', 1)
            if preview and rel in demo_pages:
                dots = ("#22c55e", "#ff4713", "#3b82f6")
                links = "".join(DEMO_BTN.format(href=h, text=t, dot=dots[i % 3]) for i, (h, t) in enumerate(demo_buttons))
                s = s.replace("</body>", DEMO_WRAP.format(links=links) + "\n</body>", 1)
            open(p, "w", encoding="utf-8").write(s)
    json.dump({"sha": sha(), "time": int(time.time())}, open(os.path.join(out, "version.json"), "w"))
    print(f"✓ _site spreman ({'probna objava, noindex' if preview else 'javna objava'}), verzija {v}")
    return out
