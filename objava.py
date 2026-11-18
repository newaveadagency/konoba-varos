#!/usr/bin/env python3
"""Objava Konobe Varoš: skuplja javne datoteke u _site/ za GitHub Pages.

Pokreće se automatski u GitHub Actions nakon svake promjene na grani main
(.github/workflows/objava.yml). Lokalno za provjeru:  python3 objava.py
"""
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
os.chdir(ROOT)

import objava_cms  # noqa: E402

objava_cms.collect(ROOT, [
    "index.html", "jelovnik.html", "galerija.html", "style.css", "app.js",
    "fonts", "img", "uredi.html", "cms",
], demo_pages=("index.html", "jelovnik.html"),
   demo_buttons=(("uredi.html?demo", "Uredi stranicu (demo)"), ("uredi.html?demo&stranica=jelovnik.html", "Uredi jelovnik (demo)")))
