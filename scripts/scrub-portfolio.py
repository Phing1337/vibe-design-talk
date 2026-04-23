"""
Scrub all internal/identifying references from the embedded portfolio.
Replaces real content with neutral lorem-ipsum equivalents while preserving
layout, classes, and chrome.
"""
import io, os, re

ROOT = os.path.join(os.path.dirname(__file__), '..', 'portfolio')
ROOT = os.path.normpath(ROOT)

LOREM_SHORT = "Lorem ipsum dolor sit amet, consectetur adipiscing elit."
LOREM_MED = ("Lorem ipsum dolor sit amet, consectetur adipiscing elit. "
             "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. "
             "Ut enim ad minim veniam, quis nostrud exercitation ullamco.")
LOREM_LONG = (LOREM_MED + " Duis aute irure dolor in reprehenderit in voluptate velit esse "
              "cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non "
              "proident, sunt in culpa qui officia deserunt mollit anim id est laborum.")

# Generic project names
PROJECTS = ["Project Alpha", "Project Beta", "Project Gamma", "Project Delta",
            "Project Epsilon", "Project Zeta", "Project Eta", "Project Theta",
            "Project Iota", "Project Kappa", "Project Lambda", "Project Mu"]

def scrub_html(path):
    with io.open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    orig = s

    # --- Title / brand / identity ---
    s = re.sub(r'Nick McVey', 'Lorem Ipsum', s)
    s = re.sub(r'nick mcvey', 'lorem ipsum', s)
    s = re.sub(r'>\s*nick\s*<', '>resident<', s)
    s = re.sub(r'designer\s*<br>\s*at xbox', 'designer<br>at studio', s, flags=re.I)
    s = re.sub(r'senior designer,\s*xbox', 'designer, studio', s, flags=re.I)

    # --- Localstorage namespace ---
    s = s.replace("'nick.theme'", "'res.theme'").replace("'nick.size'", "'res.size'")

    # --- Specific repo URLs / org refs -> # (must run before Microsoft replacement) ---
    s = re.sub(r'https?://github\.com/[^"\s)]+', '#', s)
    s = re.sub(r'https?://[A-Za-z0-9.\-]*\bmicrosoft\b[^"\s)]*', '#', s, flags=re.I)
    s = re.sub(r'gaming-microsoft', 'org', s)
    s = re.sub(r'nimcvey_microsoft', 'user', s)
    s = re.sub(r'Phing1337', 'user', s)

    # --- Company / product names ---
    s = re.sub(r'Microsoft Dynamics 365', 'an enterprise software role', s)
    s = re.sub(r'microsoft dynamics 365[^<\n]*', 'an enterprise software role', s, flags=re.I)
    s = re.sub(r'\bMicrosoft\b', 'the company', s)
    s = re.sub(r'\bmicrosoft\b', 'the company', s)
    s = re.sub(r'\bXbox\b', 'Studio', s)
    s = re.sub(r'\bxbox\b', 'studio', s)
    s = re.sub(r'\bHelix\b', 'Atlas', s)
    s = re.sub(r'\bhelix\b', 'atlas', s)

    # --- Personal: family / city ---
    s = re.sub(r'and my son Theo', 'and walks at dusk', s, flags=re.I)
    s = re.sub(r'\bTheo\b', 'a friend', s)
    s = re.sub(r'\bSeattle\b', 'a coastal city', s)
    s = re.sub(r'\bseattle\b', 'a coastal city', s)

    # --- Project / feature names ---
    name_map = {
        r'Xbox Mode Transitions': 'Project Alpha',
        r'XDS Token Extraction': 'Project Beta',
        r'QS Overlay Redesign': 'Project Gamma',
        r'Mouse Mode': 'Project Alpha',
        r'System Underlay': 'Project Beta',
        r'Publishing Experiences': 'Project Gamma',
        r'Creator Onboarding': 'Project Delta',
        r'Switcher Prototype': 'Prototype One',
        r'Switcher v2 \(Native\)': 'Prototype Two',
        r'Integrated App Switching': 'Prototype Three',
        r'Helix UX Prototypes': 'Team Prototypes',
        r'Context Grabber': 'Plugin One',
        r'Figma Spec Navigator': 'Plugin Two',
        r'Controller Input Playground': 'Input Playground',
        r'Games on Tap': 'Storage Wizard',
        r'Gaming Settings Analysis': 'Settings Audit',
        r'Progress App': 'Tracker App',
        r'Quick Settings': 'Quick Panel',
        r'Game Hub': 'App Hub',
        r'Game Bar': 'Tool Bar',
        r'Guide Bar': 'Guide Panel',
        r'Designing for Handheld': 'Designing for Small Screens',
        r'handheld[^<,\.\n]*': 'small-screen device',
        r'\bcontroller\b': 'input device',
        r'\bConsole\b': 'Device',
        r'\bconsole\b': 'device',
        r'\bGodot\b': 'Engine X',
        r'\bgodot\b': 'engine x',
    }
    for pat, repl in name_map.items():
        s = re.sub(pat, repl, s)

    # --- Project descriptions / lede paragraphs: replace any p.desc / page-lede / explore-desc text ---
    def replace_desc(m):
        return m.group(1) + LOREM_MED + m.group(3)

    s = re.sub(r'(<p class="desc"[^>]*>)([^<]+)(</p>)', replace_desc, s)
    s = re.sub(r'(<p class="explore-desc"[^>]*>)([^<]+)(</p>)', replace_desc, s)
    s = re.sub(r'(<p class="page-lede"[^>]*>)([^<]+)(</p>)', replace_desc, s)

    # explore-title - anonymize
    titles_seen = {}
    counter = [0]
    def replace_title(m):
        prefix, body, suffix = m.group(1), m.group(2).strip(), m.group(3)
        if body not in titles_seen:
            titles_seen[body] = PROJECTS[counter[0] % len(PROJECTS)]
            counter[0] += 1
        return prefix + titles_seen[body] + suffix
    s = re.sub(r'(<h3 class="explore-title">)([^<]+)(</h3>)', replace_title, s)

    # work-card h3
    s = re.sub(r'(<a class="work-card"[^>]*>\s*<h3[^>]*>)([^<]+)(</h3>)',
               lambda m: m.group(1) + name_map.get(m.group(2).strip(), m.group(2)) + m.group(3), s)

    # talks/writing rows
    s = re.sub(r'(<div class="title">)([^<]+)(<span class="sub">)([^<]+)(</span></div>)',
               lambda m: m.group(1) + LOREM_SHORT + m.group(3) + LOREM_SHORT + m.group(5), s)

    # rail-blurb -> generic
    s = re.sub(r'<a href="([^"]*)">studio\.base</a>\.[^<]*',
               r'<a href="\1">site</a>. lorem ipsum dolor sit amet, consectetur adipiscing elit.', s)

    # Studio/studio brand stays. clean up any duplicate "the company" pile-ups
    s = re.sub(r'the company the company', 'the company', s)
    s = re.sub(r'studio studio', 'studio', s)

    if s != orig:
        with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
            f.write(s)
        return True
    return False


def scrub_intro(path):
    """Special handling for portfolio root index intro page."""
    with io.open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    # Replace the intro h2 + meta + paragraphs with lorem ipsum equivalents
    s = re.sub(
        r'(<h2>\s*).*?(\s*</h2>)',
        r'\1<span data-reveal data-text="Lorem ipsum dolor sit amet, ">Lorem ipsum dolor sit amet, </span><em data-reveal data-text="consectetur adipiscing">consectetur adipiscing</em><span data-reveal data-text=" elit sed do eiusmod tempor."> elit sed do eiusmod tempor.</span>\2',
        s, count=1, flags=re.S
    )
    s = re.sub(
        r'<div class="meta">.*?</div>',
        '<div class="meta">'
        '<span data-reveal data-text="role · designer at studio"><b>role</b> · designer at studio</span>'
        '<span data-reveal data-text="focus · lorem ipsum, dolor sit amet, consectetur"><b>focus</b> · lorem ipsum, dolor sit amet, consectetur</span>'
        '<span data-reveal data-text="based · a coastal city"><b>based</b> · a coastal city</span>'
        '</div>',
        s, count=1, flags=re.S
    )
    # Replace the two intro paragraphs
    s = re.sub(
        r'<p data-reveal>I work on the surfaces[^<]*</p>',
        '<p data-reveal>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>',
        s
    )
    s = re.sub(
        r'<p data-reveal>I know our publishing[^<]*</p>',
        '<p data-reveal>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>',
        s
    )
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)


def scrub_about(path):
    """Replace about page paragraphs with lorem."""
    with io.open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    # Replace paragraphs in about block
    s = re.sub(
        r'(<div class="about">\s*<div>).*?(</div>\s*<dl)',
        r'''\1
        <p data-reveal>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
        <p data-reveal>Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <p data-reveal>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>
        <p data-reveal>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>\2''',
        s, count=1, flags=re.S
    )
    # Replace dl facts
    s = re.sub(
        r'<dl class="facts">.*?</dl>',
        '<dl class="facts">'
        '<dt>now</dt><dd>designer, studio</dd>'
        '<dt>tools</dt><dd>lorem ipsum, dolor sit amet, consectetur, adipiscing, elit</dd>'
        '<dt>previously</dt><dd>various studios and roles, sed do eiusmod tempor</dd>'
        '</dl>',
        s, count=1, flags=re.S
    )
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)


CASE_BODY_TEMPLATE = '''<article class="case">
      <p class="case-lede" data-reveal>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>

      <aside class="case-links-block">
        <div class="case-links-label">links</div>
        <div class="case-links">
          <a class="case-link" href="#"><span class="case-link-kind">figma</span> Figma file <span class="arr">↗</span></a>
          <a class="case-link" href="#"><span class="case-link-kind">proto</span> Prototype <span class="arr">↗</span></a>
          <a class="case-link" href="#"><span class="case-link-kind">repo</span> Repo <span class="arr">↗</span></a>
        </div>
      </aside>

      <div class="case-body">
        <p class="case-intro" data-reveal>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>

      <h2 data-reveal>Lorem ipsum</h2>

      <p data-reveal>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>

      <figure class="case-fig"><div class="case-fig-placeholder">placeholder</div></figure>

      <h2 data-reveal>Dolor sit amet</h2>

      <p data-reveal>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.</p>

      <figure class="case-fig"><div class="case-fig-placeholder">placeholder</div></figure>

      <h2 data-reveal>Consectetur adipiscing</h2>

      <p data-reveal>Sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet.</p>

        <p class="case-footnote" data-reveal>Placeholder content.</p>
      </div>

      <nav class="case-foot">
        <a href="../" class="case-back">← back to selected work</a>
      </nav>
    </article>'''


def scrub_case_study(path):
    with io.open(path, 'r', encoding='utf-8') as f:
        s = f.read()
    s = re.sub(r'<article class="case">.*?</article>', CASE_BODY_TEMPLATE, s, count=1, flags=re.S)
    # Also nuke the h1 in page-head case-head
    s = re.sub(r'(<header class="page-head case-head">\s*<span[^>]*>[^<]*</span>\s*<h1[^>]*>)([^<]+)(</h1>)',
               r'\1Project Placeholder\3', s, count=1)
    with io.open(path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(s)


def main():
    changed = []
    for dirpath, _, files in os.walk(ROOT):
        for fn in files:
            if fn.endswith('.html'):
                full = os.path.join(dirpath, fn)
                if scrub_html(full):
                    changed.append(full)
    # Specialized passes
    intro_path = os.path.join(ROOT, 'index.html')
    if os.path.exists(intro_path):
        scrub_intro(intro_path)
    about_path = os.path.join(ROOT, 'about', 'index.html')
    if os.path.exists(about_path):
        scrub_about(about_path)
    # Case study pages
    work_dir = os.path.join(ROOT, 'work')
    if os.path.isdir(work_dir):
        for entry in os.listdir(work_dir):
            sub = os.path.join(work_dir, entry)
            if os.path.isdir(sub):
                idx = os.path.join(sub, 'index.html')
                if os.path.exists(idx):
                    scrub_case_study(idx)
                    # Rename folder to generic name handled elsewhere; keep links working
    # Also catch leftover words anywhere in portfolio
    leftover_map = {
        r'\bHandheld\b': 'Small-screen',
        r'\bhandheld\b': 'small-screen',
        r'creator onboarding': 'lorem ipsum',
        r'Creator Onboarding': 'Lorem Ipsum',
        r'Creator onboarding': 'Lorem ipsum',
        r'\bcreator\b': 'user',
        r'\bdeveloper\b': 'user',
        r'\bdevelopers\b': 'users',
        r'\bpublishing\b': 'workflow',
        r'\bPublishing\b': 'Workflow',
        r'\bplayers?\b': 'users',
        r'\bgame\b': 'app',
        r'\bgames\b': 'apps',
        r'\bGame\b': 'App',
        r'\bGames\b': 'Apps',
        r'\bGuide\b': 'Panel',
        r'\bguide\b': 'panel',
        r'\bnotifications?\b': 'alerts',
        r'\bparty\b': 'group',
        r'\bachievements?\b': 'rewards',
        r'\bd[\s-]?pad\b': 'directional',
    }
    for dirpath, _, files in os.walk(ROOT):
        for fn in files:
            if not fn.endswith('.html'):
                continue
            full = os.path.join(dirpath, fn)
            with io.open(full, 'r', encoding='utf-8') as f:
                s = f.read()
            orig = s
            for pat, repl in leftover_map.items():
                s = re.sub(pat, repl, s)
            if s != orig:
                with io.open(full, 'w', encoding='utf-8', newline='\n') as f:
                    f.write(s)
    print(f'Scrubbed {len(changed)} files')
    for c in changed:
        print('  ', os.path.relpath(c, ROOT))


if __name__ == '__main__':
    main()
