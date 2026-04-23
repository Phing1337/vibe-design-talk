import io, sys

p = 'index.html'
with io.open(p, 'r', encoding='utf-8') as f:
    s = f.read()

start_marker = '    <!-- ======================================================\n         SHOWCASE: Work Digital Garden'
end_marker = '    </section><!-- /slide-garden -->'

i = s.find(start_marker)
j = s.find(end_marker)
if i < 0 or j < 0:
    print('markers not found'); sys.exit(1)
end = j + len(end_marker)

new_block = '''    <!-- ======================================================
         SHOWCASE: Team Portfolio Site
         ====================================================== -->
    <section class="slide slide-portfolio" data-beat="showcase" data-title="Team Portfolio" data-transition="fade" style="background: var(--color-bg-dark) !important;">

      <!-- Left: brief framing -->
      <div class="portfolio-left fade-in fade-in-1">
        <p class="label">Lorem Ipsum</p>
        <h2 class="heading-2 fade-in fade-in-2" style="margin-top: var(--space-md); color: var(--color-text);">
          A site the team<br>is building together.
        </h2>
        <p class="body fade-in fade-in-3" style="margin-top: var(--space-lg); max-width: 320px; color: rgba(255,255,255,0.65);">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Each resident keeps a room &mdash; sed do eiusmod tempor incididunt ut labore.
        </p>
        <p class="body fade-in fade-in-4" style="margin-top: var(--space-md); max-width: 320px; color: rgba(255,255,255,0.4); font-style: italic;">
          Make intranets cool again.
        </p>
      </div>

      <!-- Right: live portfolio site -->
      <div class="portfolio-right">
        <iframe
          src="./portfolio/"
          title="Team Portfolio"
          loading="lazy"
          referrerpolicy="no-referrer"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        ></iframe>
      </div>

    </section><!-- /slide-portfolio -->'''

out = s[:i] + new_block + s[end:]
with io.open(p, 'w', encoding='utf-8', newline='\n') as f:
    f.write(out)
print('ok, removed', end - i, 'chars, inserted', len(new_block))
