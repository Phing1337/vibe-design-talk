"""
Lightweight cleanup on freshly-copied portfolio:
  1. Remove the 'art' nav link (folder excluded)
  2. Renumber 'about' from 03 -> 02 in the rail nav
  3. Remove the '→ art' link on the intro page
"""
import io, os, re

ROOT = 'portfolio'

for dp, _, files in os.walk(ROOT):
    for fn in files:
        if not fn.endswith('.html'):
            continue
        full = os.path.join(dp, fn)
        with io.open(full, 'r', encoding='utf-8') as f:
            s = f.read()
        orig = s
        s = re.sub(r'\s*<a href="[^"]*art/?"[^>]*>\s*<span class="idx">02</span>\s*art\s*</a>', '', s)
        s = re.sub(
            r'(<a href="[^"]*about/?"[^>]*>\s*<span class="idx">)03(</span>\s*about)',
            r'\g<1>02\g<2>', s)
        s = re.sub(
            r'\s*<a href="[^"]*art/?"[^>]*data-reveal[^>]*data-text="→ art"[^>]*>[^<]*</a>',
            '', s)
        if s != orig:
            with io.open(full, 'w', encoding='utf-8', newline='\n') as f:
                f.write(s)
            print('cleaned', full)
