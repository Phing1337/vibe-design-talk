import io, os, re

ROOT = 'portfolio'

# Fix _lib files
fixes = [
    ('_lib/shell.css', [(r'shared shell.*?used by every page in nick\.mcvey/', 'shared shell - used by every page')]),
    ('_lib/theme.js', [(r"'nick\.theme'", "'res.theme'"), (r"'nick\.size'", "'res.size'")]),
    ('_lib/reveal.js', [(r'nick\.mcvey', 'site')]),
]
for fn, subs in fixes:
    p = os.path.join(ROOT, fn.replace('/', os.sep))
    if os.path.exists(p):
        with io.open(p, 'r', encoding='utf-8') as f:
            s = f.read()
        for pat, rep in subs:
            s = re.sub(pat, rep, s)
        with io.open(p, 'w', encoding='utf-8', newline='\n') as f:
            f.write(s)
        print('fixed', p)

RENAMES = {
    'mouse-mode': 'project-alpha',
    'system-underlay': 'project-beta',
    'publishing-experiences': 'project-gamma',
    'creator-onboarding': 'project-delta',
}
work = os.path.join(ROOT, 'work')
for old, new in RENAMES.items():
    src = os.path.join(work, old)
    dst = os.path.join(work, new)
    if os.path.exists(src):
        os.rename(src, dst)
        print('renamed', old, '->', new)

for dp, _, files in os.walk(ROOT):
    for fn in files:
        if not fn.endswith('.html'):
            continue
        full = os.path.join(dp, fn)
        with io.open(full, 'r', encoding='utf-8') as f:
            s = f.read()
        orig = s
        for old, new in RENAMES.items():
            s = s.replace('/' + old + '/', '/' + new + '/')
            s = s.replace('./' + old + '/', './' + new + '/')
            s = s.replace('>' + old + '<', '>' + new + '<')
        if s != orig:
            with io.open(full, 'w', encoding='utf-8', newline='\n') as f:
                f.write(s)
            print('updated links in', full)
