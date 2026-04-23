"""
Targeted portfolio scrub:
  - KEEP: personal identity (Nick McVey, designer at Xbox, Seattle, Theo, bio,
    interests, tools, intro page, about page).
  - REMOVE: real work project names, case study bodies, real exploration
    descriptions, real github URLs, anything that names confidential projects
    or features.
  - Replace removed content with believable, generic-sounding fake content
    (NOT lorem ipsum) so it reads as a polished personal portfolio.
"""
import io, os, re

ROOT = 'portfolio'

# ---- Strip the broken 'art' nav link in every page (folder excluded) ----
def strip_art_nav(s):
    s = re.sub(r'\s*<a href="[^"]*art/?"[^>]*>\s*<span class="idx">02</span>\s*art\s*</a>', '', s)
    s = re.sub(
        r'(<a href="[^"]*about/?"[^>]*>\s*<span class="idx">)03(</span>\s*about)',
        r'\g<1>02\g<2>', s)
    s = re.sub(r'\s*<a href="[^"]*art/?"[^>]*data-reveal[^>]*data-text="→ art"[^>]*>[^<]*</a>', '', s)
    # Kill broken "studio" breadcrumb — any number of ../ up a dead parent
    s = re.sub(
        r'<nav class="crumbs"[^>]*>\s*<a href="(?:\.\./)+">studio</a>\s*<span class="sep">/</span>\s*',
        '<nav class="crumbs" aria-label="breadcrumb">', s)
    # Kill rail-blurb referring to studio.base
    s = re.sub(
        r'<div class="rail-blurb">.*?</div>', '', s, flags=re.S)
    return s


# ---- Fake but plausible project names + descriptions ----
WORK_CARDS = [
    ('Tide',  'Tide is a system-tray companion that brings your most-used utilities one keystroke away. The card stack pattern keeps depth without losing context.'),
    ('Atlas', 'Atlas is a wayfinding system for content-heavy apps. Persistent breadcrumbs, peek navigation, and a quiet command bar that never gets in the way.'),
    ('Grain', 'Grain is a touch-first input study. Building a thumb-zone first interaction model that still feels precise on a trackpad or mouse.'),
    ('Embers','Embers is an ambient notification layer. Soft, low-priority surfaces that breathe rather than interrupt — meant for long focus sessions.'),
]

EXPLORATIONS = [
    ('Margin Mate',          'A Figma plugin that audits spacing and surfaces drift across a design system. Built for the inevitable spacing inconsistency that creeps in late in a sprint.', 'plugin'),
    ('Clipboard Cartographer','A small utility that maps everything you copy across a session into a navigable timeline. Half memory aid, half thinking tool.', 'tool'),
    ('Scope Sketcher',       'A whiteboard-style sketch app meant for the first ten minutes of any project — the part where you are still arguing with yourself about the shape of the thing.', 'tool'),
    ('Pointer Curves',       'A web testbed for tuning cursor acceleration curves and easing. Helpful when you want a pointer to feel like the right kind of heavy.', 'prototype'),
    ('Dock Prototype',       'A bottom dock concept that combines pinned apps, recent docs, and quick actions into a single peekable surface.', 'prototype'),
    ('Window Switcher Study','A research prototype rethinking what cmd-tab could be when the underlying spaces understand the work, not just the windows.', 'research'),
    ('Settings Sprawl Map',  'A research project mapping how settings spread across an OS and where the seams are. The map is more useful than the conclusions.', 'research'),
    ('Modal vs Underlay',    'A small writeup with side-by-side prototypes comparing modal overlays against persistent underlays for system surfaces.', 'writing'),
    ('Quiet Theme',          'A muted, low-contrast color theme designed for late nights. Built around a single warm accent and a lot of restraint.', 'system'),
    ('Print Layouts',        'A revisit of print-style page composition for long-form web content. Multi-column, deliberate typography, no scroll fatigue.', 'system'),
    ('Field Notes',          'A static-site setup I use to keep small writeups close to the prototypes they describe. Optimized for the writing, not the chrome.', 'tool'),
    ('Progress Tracker',     'A personal benchmark I rebuild against each new model release to feel out how the medium of building software is changing.', 'project'),
]

TALKS = [
    ('2025', 'Designing in the Open',         'a talk on shipping prototypes as the document', 'internal talk'),
    ('2025', 'Motion as a System Language',   'how transitions become identity in OS shells', 'design week'),
    ('2024', 'Prototyping with Game Engines', 'why a game engine is a great UI sketchbook',   'learning doc'),
]


def rewrite_work_index(path):
    with io.open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    s = strip_art_nav(s)

    # Replace selected-work cards
    cards_html = ''
    for title, desc in WORK_CARDS:
        slug = title.lower()
        cards_html += f'''      <a class="work-card" href="./{slug}/">
        <h3 data-reveal>{title}</h3>
        <p class="desc" data-reveal>{desc}</p>
        <span class="open">read more →</span>
      </a>

'''
    s = re.sub(
        r'<div class="work-grid">.*?</div>\s*(?=<h2 class="section-head)',
        f'<div class="work-grid">\n{cards_html}    </div>\n\n    ',
        s, count=1, flags=re.S)

    # Replace explorations list
    expl_html = ''
    for title, desc, kind in EXPLORATIONS:
        link = '<span class="explore-soon">link coming soon</span>'
        expl_html += f'''      <div class="explore-row">
        <div class="explore-thumb" aria-hidden="true"></div>
        <div class="explore-body">
          <h3 class="explore-title">{title}</h3>
          <p class="explore-desc">{desc}</p>
        </div>
        {link}
      </div>

'''
    s = re.sub(
        r'<div class="explore-list">.*?</div>\s*(?=<h2 class="section-head)',
        f'<div class="explore-list">\n\n{expl_html}    </div>\n\n    ',
        s, count=1, flags=re.S)

    # Replace talks rows
    talks_rows = '<div class="head">year</div>\n      <div class="head">title</div>\n      <div class="head">where</div>\n\n'
    for yr, title, sub, where in TALKS:
        talks_rows += f'''      <div class="yr">{yr}</div>
      <div class="title">{title}<span class="sub">{sub}</span></div>
      <div class="where"><a href="#">{where} ↗</a></div>

'''
    s = re.sub(r'<div class="rows">.*?</div>\s*</main>',
               f'<div class="rows">\n      {talks_rows}    </div>\n  </main>',
               s, count=1, flags=re.S)

    # Update lede
    s = re.sub(
        r'<p class="page-lede" data-reveal>Projects[^<]*</p>',
        '<p class="page-lede" data-reveal>A small selection of design projects, side experiments, and writing. Most pages are short — built to be easy to scan and easier to share.</p>',
        s, count=1)
    s = re.sub(
        r'<p class="page-lede" data-reveal>Side projects[^<]*</p>',
        '<p class="page-lede" data-reveal>Smaller experiments, plugins, and prototypes. Built to think with — most are short studies rather than finished products.</p>',
        s, count=1)

    # Strip real GitHub urls just in case
    s = re.sub(r'https?://github\.com/[^"\s)]+', '#', s)

    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)


CASE_STUDY_TEMPLATE = '''<article class="case">
      <p class="case-lede" data-reveal>{lede}</p>

      <aside class="case-links-block">
        <div class="case-links-label">links</div>
        <div class="case-links">
          <a class="case-link" href="#"><span class="case-link-kind">figma</span> Figma file <span class="arr">↗</span></a>
          <a class="case-link" href="#"><span class="case-link-kind">proto</span> Prototype <span class="arr">↗</span></a>
        </div>
      </aside>

      <div class="case-body">
        <p class="case-intro" data-reveal>{intro}</p>

      <h2 data-reveal>The problem</h2>

      <p data-reveal>{problem}</p>

      <figure class="case-fig"><div class="case-fig-placeholder">{fig1}</div></figure>

      <h2 data-reveal>What we explored</h2>

      <p data-reveal>{explored}</p>

      <figure class="case-fig"><div class="case-fig-placeholder">{fig2}</div></figure>

      <h2 data-reveal>Where it landed</h2>

      <p data-reveal>{landed}</p>

        <p class="case-footnote" data-reveal>This page is a placeholder writeup — the longer version lives elsewhere.</p>
      </div>

      <nav class="case-foot">
        <a href="../" class="case-back">← back to selected work</a>
      </nav>
    </article>'''

CASE_STUDIES = {
    'tide': dict(
        title='Tide',
        lede='A system-tray companion that keeps utilities one keystroke away.',
        intro='Tide is a low-chrome command surface that lives at the edge of the screen. The goal: cover 80% of small utility tasks without ever taking focus away from the thing in front of you.',
        problem='Power users build up a long tail of small actions — convert this, jump to that, paste from history — and the cost of leaving the current task to perform any one of them is what makes the day feel choppy.',
        fig1='tray surface · default state',
        explored='A keyboard-first card stack that opens beside the cursor, a quiet result list, and a deliberate refusal to grow into a full launcher. Every interaction had to either return you to your task or finish in a single keystroke.',
        fig2='card stack · expanded',
        landed='A small set of card primitives that compose into most of the use cases tested in research. Hand-off ready, with motion specs and a couple of edge-case rules I had to learn the hard way.',
    ),
    'atlas': dict(
        title='Atlas',
        lede='A wayfinding system for content-heavy apps.',
        intro='Atlas is a navigation pattern for surfaces that have more depth than they have screen space. Persistent breadcrumbs, a peek nav, and a quiet command bar that lets you jump without losing your place.',
        problem='Users in deep apps often know what they want but not where it lives. Tree menus and tabs scale linearly with content; perceived complexity scales much faster.',
        fig1='peek nav · open',
        explored='Three navigation primitives that compose: a breadcrumb that always shows where you are, a peek panel that shows where you could go, and a command bar that lets you skip the journey when you already know the destination.',
        fig2='breadcrumb + command bar',
        landed='A small, opinionated nav system documented as a kit. Works best in apps with at least three real levels of depth — at less than that the patterns are overkill.',
    ),
    'grain': dict(
        title='Grain',
        lede='A touch-first input study built to still feel precise on a trackpad.',
        intro='Grain is a working interaction model that treats touch as the primary input but degrades gracefully when a precise pointer is available. The goal: never make a touch user feel like they got the lesser experience.',
        problem='Most apps designed touch-first lose precision when you bring a pointer in; most apps designed pointer-first feel cramped on touch. Choosing one is the easy answer; doing both is where the work is.',
        fig1='thumb zones · overlay',
        explored='Hit targets sized to thumbs, gestures that map cleanly to pointer equivalents, and a focus model that does not require knowing whether the user touched or clicked. Plus a lot of measurement.',
        fig2='gesture map · primary actions',
        landed='A short kit of components, a tuning page for hit targets and gesture thresholds, and a cheat sheet of the things that go wrong when you try to support both inputs in the same surface.',
    ),
    'embers': dict(
        title='Embers',
        lede='An ambient notification layer for long focus sessions.',
        intro='Embers is a quieter pattern for system notifications. Instead of interrupting, low-priority alerts surface as a soft glow at the edge of the screen, and only escalate if you choose to look.',
        problem='Notification stacks are tuned for the worst case (urgent message) and applied to every case (rotation reminder). The result is a low-grade interruption every few minutes and a habit of dismissing without reading.',
        fig1='ambient edge · default',
        explored='A two-tier system: ambient glow for everything; conventional toast only for things you have explicitly marked as worth interrupting for. Plus a tiny review surface that batches the rest.',
        fig2='glow → review',
        landed='A behavior spec, a few motion studies, and a settings panel that defaults to “quiet” and asks you to opt in to interruption. Tested it on myself for a month before writing anything down.',
    ),
}


def write_case_study(slug, data, src_path, dst_path):
    """Take an existing case-study file as the chrome scaffold and replace its body."""
    with io.open(src_path, 'r', encoding='utf-8') as f:
        s = f.read()
    s = strip_art_nav(s)
    # Replace title in case-head
    s = re.sub(
        r'(<header class="page-head case-head">\s*<span[^>]*>[^<]*</span>\s*<h1[^>]*>)([^<]+)(</h1>)',
        rf'\g<1>{data["title"]}\g<3>', s, count=1)
    # Replace article body
    body = CASE_STUDY_TEMPLATE.format(
        lede=data['lede'], intro=data['intro'], problem=data['problem'],
        fig1=data['fig1'], explored=data['explored'], fig2=data['fig2'],
        landed=data['landed'])
    s = re.sub(r'<article class="case">.*?</article>', body, s, count=1, flags=re.S)
    # Update breadcrumb / nav slugs to point at our new slugs
    OLD_SLUGS = ['mouse-mode', 'system-underlay', 'publishing-experiences', 'creator-onboarding']
    for old in OLD_SLUGS:
        s = s.replace('/' + old + '/', '/' + slug + '/')
        s = s.replace('>' + old + '<', '>' + slug + '<')
    # Strip any github urls
    s = re.sub(r'https?://github\.com/[^"\s)]+', '#', s)
    with io.open(dst_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)


def main():
    # 1) Strip art nav from every html
    for dp, _, files in os.walk(ROOT):
        for fn in files:
            if not fn.endswith('.html'):
                continue
            full = os.path.join(dp, fn)
            with io.open(full, 'r', encoding='utf-8') as f:
                s = f.read()
            new = strip_art_nav(s)
            # also strip github urls everywhere
            new = re.sub(r'https?://github\.com/[^"\s)]+', '#', new)
            if new != s:
                with io.open(full, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(new)

    # 2) Rewrite work index with fake projects
    work_index = os.path.join(ROOT, 'work', 'index.html')
    rewrite_work_index(work_index)

    # 3) Replace each old case-study folder with a fake one (use existing file as chrome)
    OLD_SLUGS = ['mouse-mode', 'system-underlay', 'publishing-experiences', 'creator-onboarding']
    NEW = list(CASE_STUDIES.items())  # [(slug, data), ...]
    work_dir = os.path.join(ROOT, 'work')
    # Template can be either a leftover case-study index or a stashed _template.html
    template_src = os.path.join(work_dir, '_template.html')
    if not os.path.exists(template_src):
        for old in OLD_SLUGS:
            p = os.path.join(work_dir, old, 'index.html')
            if os.path.exists(p):
                template_src = p
                break
    if template_src is None:
        print('no case-study template found'); return

    # Read the chrome once
    with io.open(template_src, 'r', encoding='utf-8') as f:
        chrome = f.read()

    # Remove all old folders
    for old in OLD_SLUGS:
        d = os.path.join(work_dir, old)
        if os.path.isdir(d):
            for sub in os.listdir(d):
                os.remove(os.path.join(d, sub))
            os.rmdir(d)

    # Write each new case study
    for slug, data in NEW:
        d = os.path.join(work_dir, slug)
        os.makedirs(d, exist_ok=True)
        out = os.path.join(d, 'index.html')
        with io.open(out, 'w', encoding='utf-8', newline='\n') as f:
            f.write(chrome)
        write_case_study(slug, data, out, out)
        print('wrote', out)

    print('done')


if __name__ == '__main__':
    main()
