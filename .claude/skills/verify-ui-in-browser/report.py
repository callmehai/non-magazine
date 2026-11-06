"""Build one self-contained HTML report of a UI change: what changed, what was tested, before/after pairs
and scenario screenshots, all images embedded, so it opens offline in any browser and any agent can make it.

Every image is embedded at full resolution (shots up to 3000px wide, pairs 6000px) and opens in a zoom viewer on click: fit to
the screen, then 100% and 200%, +/- and Ctrl+wheel to zoom, drag to pan, arrow keys for the next image,
Esc to close. A screenshot scaled down to the page column is too small to read on its own.

Usage: python3 report.py reports/<ticket>/manifest.json      -> writes reports/<ticket>/index.html

manifest.json (image paths are relative to the manifest):
{
  "title": "SCRUM-20 Thành phần tham dự",
  "eyebrow": "TrustCabinet · SCRUM-20 · <branch>",
  "heading": "...", "lead": "...",
  "facts": ["Test BE <b>1173/1173</b> qua", ...],          # short chips under the heading (HTML allowed)
  "changes": ["...", ...],                                  # what changed (HTML allowed)
  "checks": [["scenario", "Qua"], ...],                     # what was tested and the result (wraps; keep it to a line or two)
  "pairs": [["pairs/x.png", "Screen", "One line on what changed"], ...],
  "shots": [["shots/y.png", "Scenario", "What it shows"], ...],
  "asks": ["...", ...],                                     # decisions still open (optional)
  "labels": {"changes": "...", "checks": "...", "pairs": "...", "shots": "...", "asks": "..."}
                                                            # optional section titles, e.g. for a Doc audit
}
"""
import base64
import html
import io
import json
import pathlib
import sys

from PIL import Image

manifest = pathlib.Path(sys.argv[1]).resolve()
root = manifest.parent
m = json.loads(manifest.read_text())
L = {'changes': 'Đã thay đổi', 'checks': 'Đã kiểm tra trên trình duyệt', 'pairs': 'Trước / sau',
     'shots': 'Các kịch bản khác', 'asks': 'Cần chốt', **m.get('labels', {})}


def img(path, width):
    im = Image.open(root / path).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=82, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()


def figure(cls, path, title, desc, width):
    src = img(path, width)
    cap = f'<figcaption><h3>{html.escape(title)}</h3><p>{html.escape(desc)}</p></figcaption>'
    # One embedded copy serves both the page and the zoom viewer, so the file does not double in size.
    pic = (f'<button type="button" class="zoomable" aria-label="Phóng to: {html.escape(title)}">'
           f'<img src="{src}" alt="{html.escape(title)}" loading="lazy"></button>')
    return f'<figure class="{cls}">{cap}{pic}</figure>' if cls == 'pair' else f'<figure class="{cls}">{pic}{cap}</figure>'


def items(xs):
    return ''.join(f'<li>{x}</li>' for x in xs)


# A "Mục | Trước | Sau" table needs the full width; squeezed into half a column it reads word by word.
_tables = [c for c in m.get('changes', []) if c.lstrip().startswith('<table')]
_plain = [c for c in m.get('changes', []) if not c.lstrip().startswith('<table')]
_changes = ''.join(_tables) + (f'<ul>{items(_plain)}</ul>' if _plain else '')
_checks_panel = f'<div class="panel"><h2>{L["checks"]}</h2><ul class="checks">{{checks}}</ul></div>'
facts = ''.join(f'<span class="fact">{f}</span>' for f in m.get('facts', []))
checks = ''.join(f'<li><span>{html.escape(s)}</span><b class="ok">{html.escape(r)}</b></li>' for s, r in m.get('checks', []))
changes_html = (
    f'<section class="panel"><h2>{L["changes"]}</h2>{_changes}</section>'
    f'<section class="cols">{_checks_panel.format(checks=checks)}</section>'
    if _tables
    else f'<section class="cols"><div class="panel"><h2>{L["changes"]}</h2>{_changes}</div>{_checks_panel.format(checks=checks)}</section>'
)
# Shots are taken at 2x (playwright.config.ts): a 1440px window is 2880 pixels, a pair twice that.
pairs = ''.join(figure('pair', *p, 6000) for p in m.get('pairs', []))
shots = ''.join(figure('shot', *s, 3000) for s in m.get('shots', []))
asks = m.get('asks', [])

page = f'''<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(m["title"])}</title>
<style>
:root {{
  --bg: #f3f5f9; --surface: #ffffff; --ink: #172033; --muted: #5a6478; --line: #dde3ec;
  --brand: #2a4b8d; --brand-wash: #e8eef8; --ok: #17794a; --ok-wash: #e3f4ea;
  --font: "Segoe UI", system-ui, -apple-system, sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, monospace;
}}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.6 var(--font); }}
.page {{ max-width: 1240px; margin: 0 auto; padding: 40px 16px 64px; display: flex; flex-direction: column; gap: 40px; }}
header {{ display: flex; flex-direction: column; gap: 10px; max-width: 72ch; }}
.eyebrow {{ margin: 0; color: var(--brand); font-size: 12.5px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; }}
h1 {{ margin: 0; font-size: clamp(26px, 4vw, 34px); line-height: 1.2; }}
h2 {{ margin: 0 0 14px; font-size: 21px; }}
h3 {{ margin: 0; font-size: 15.5px; }}
p {{ margin: 0; }}
.lead {{ color: var(--muted); font-size: 16px; }}
.facts {{ display: flex; flex-wrap: wrap; gap: 10px; margin-top: 6px; }}
.fact {{ padding: 8px 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--surface); font-size: 14px; }}
.cols {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }}
.panel {{ min-width: 0; padding: 22px 24px; border: 1px solid var(--line); border-radius: 10px; background: var(--surface); }}
ul, ol {{ margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }}
code {{ font: 13px var(--mono); padding: 1px 5px; border-radius: 4px; background: var(--brand-wash); color: var(--brand); overflow-wrap: anywhere; }}
.checks {{ list-style: none; padding: 0; gap: 0; }}
/* Two fixed columns, both wrapping: a long result once kept its one line and squeezed the scenario
   to a word per line, then ran out of the panel. A short result still hugs the right edge. */
.checks li {{ display: grid; grid-template-columns: minmax(0, 2fr) minmax(0, 3fr); align-items: start; gap: 12px;
  padding: 8px 0; border-top: 1px solid var(--line); }}
.checks li:first-child {{ border-top: none; }}
.ok {{ justify-self: end; max-width: 100%; padding: 2px 10px; border-radius: 6px; background: var(--ok-wash); color: var(--ok);
  font-size: 13px; overflow-wrap: anywhere; }}
@media (max-width: 520px) {{ .checks li {{ grid-template-columns: minmax(0, 1fr); gap: 4px; }} .ok {{ justify-self: start; }} }}
.pairs {{ display: flex; flex-direction: column; gap: 28px; }}
.shots {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 28px 24px; align-items: start; }}
figure {{ margin: 0; display: flex; flex-direction: column; gap: 12px; min-width: 0; }}
figcaption {{ display: flex; flex-direction: column; gap: 4px; }}
figcaption p {{ color: var(--muted); font-size: 14px; }}
figure img {{ display: block; max-width: 100%; height: auto; border: 1px solid var(--line); border-radius: 8px; background: #fff; }}
.zoomable {{ display: block; padding: 0; border: 0; background: none; cursor: zoom-in; position: relative; }}
.zoomable::after {{ content: "Bấm để phóng to"; position: absolute; right: 10px; bottom: 10px; padding: 4px 10px; border-radius: 6px;
  background: rgb(23 32 51 / .78); color: #fff; font: 600 12.5px var(--font); opacity: 0; transition: opacity .15s; }}
.zoomable:hover::after, .zoomable:focus-visible::after {{ opacity: 1; }}
.zoomable:focus-visible img {{ outline: 3px solid var(--brand); outline-offset: 2px; }}
.lb {{ width: 100vw; height: 100vh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: #0d1320; color: #fff; }}
.lb::backdrop {{ background: #0d1320; }}
.lb[open] {{ display: flex; flex-direction: column; }}
.lb-bar {{ display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #172033; font-size: 14px; }}
.lb-title {{ flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }}
.lb-bar button {{ min-width: 40px; height: 36px; padding: 0 12px; border: 1px solid #3a4560; border-radius: 6px; background: #22304a; color: #fff; font: 600 14px var(--font); cursor: pointer; }}
.lb-bar button:hover {{ background: #2e3f60; }}
.lb-zoom {{ min-width: 52px; text-align: center; font-variant-numeric: tabular-nums; color: #c9d3e6; }}
.lb-stage {{ flex: 1; overflow: auto; cursor: zoom-in; display: grid; }}
.lb-stage.can-pan {{ cursor: grab; }}
.lb-stage.panning {{ cursor: grabbing; }}
.lb-stage img {{ margin: auto; max-width: none; border: 0; border-radius: 0; user-select: none; -webkit-user-drag: none; }}
.lb-hint {{ padding: 6px 16px; background: #172033; color: #9aa6bd; font-size: 12.5px; }}
.ask {{ border-color: var(--brand); background: var(--brand-wash); }}
</style>
</head>
<body>
<div class="page">
<header>
  <p class="eyebrow">{m.get("eyebrow", "")}</p>
  <h1>{m["heading"]}</h1>
  <p class="lead">{m.get("lead", "")}</p>
  <div class="facts">{facts}</div>
</header>
{changes_html}
{f'<section><h2>{L["pairs"]}</h2><div class="pairs">{pairs}</div></section>' if pairs else ''}
{f'<section><h2>{L["shots"]}</h2><div class="shots">{shots}</div></section>' if shots else ''}
{f'<section class="panel ask"><h2>{L["asks"]}</h2><ol>{items(asks)}</ol></section>' if asks else ''}
</div>
<dialog class="lb" aria-label="Xem ảnh">
  <div class="lb-bar">
    <span class="lb-title"></span>
    <button type="button" data-act="prev" aria-label="Ảnh trước">←</button>
    <button type="button" data-act="next" aria-label="Ảnh sau">→</button>
    <button type="button" data-act="out" aria-label="Thu nhỏ">−</button>
    <span class="lb-zoom"></span>
    <button type="button" data-act="in" aria-label="Phóng to">+</button>
    <button type="button" data-act="fit">Vừa màn hình</button>
    <button type="button" data-act="one">100%</button>
    <button type="button" data-act="close" aria-label="Đóng">×</button>
  </div>
  <div class="lb-stage"><img alt=""></div>
  <p class="lb-hint">Bấm ảnh: vừa màn hình → 100% → 200%. Ctrl + lăn chuột hoặc +/− để zoom, kéo để di chuyển, ← → đổi ảnh, Esc để đóng.</p>
</dialog>
<script>
(() => {{
  const lb = document.querySelector('.lb'), stage = lb.querySelector('.lb-stage'), pic = stage.querySelector('img')
  const title = lb.querySelector('.lb-title'), zoomText = lb.querySelector('.lb-zoom')
  const buttons = [...document.querySelectorAll('.zoomable')]
  let index = 0, scale = 1, fit = 1, moved = false
  const fitScale = () => Math.min(1, (stage.clientWidth - 24) / pic.naturalWidth, (stage.clientHeight - 24) / pic.naturalHeight)
  function zoom(next, cx, cy) {{
    // Keep the point under the cursor (or the centre) in place while the size changes.
    const r = stage.getBoundingClientRect()
    const px = (cx ?? r.left + r.width / 2) - r.left, py = (cy ?? r.top + r.height / 2) - r.top
    const ix = (stage.scrollLeft + px) / scale, iy = (stage.scrollTop + py) / scale
    scale = Math.min(4, Math.max(fit / 2, next))
    pic.style.width = pic.naturalWidth * scale + 'px'
    pic.style.height = pic.naturalHeight * scale + 'px'
    stage.scrollLeft = ix * scale - px
    stage.scrollTop = iy * scale - py
    zoomText.textContent = Math.round(scale * 100) + '%'
    stage.classList.toggle('can-pan', stage.scrollWidth > stage.clientWidth || stage.scrollHeight > stage.clientHeight)
  }}
  function show(i) {{
    index = (i + buttons.length) % buttons.length
    const img = buttons[index].querySelector('img')
    title.textContent = `${{index + 1}}/${{buttons.length}} · ${{img.alt}}`
    pic.onload = () => {{ fit = fitScale(); zoom(fit) }}
    pic.src = img.src
    if (pic.complete) pic.onload()
  }}
  buttons.forEach((b, i) => b.addEventListener('click', () => {{ lb.showModal(); show(i) }}))
  lb.querySelector('.lb-bar').addEventListener('click', (e) => {{
    const act = e.target.closest('button')?.dataset.act
    if (act === 'close') lb.close()
    else if (act === 'prev' || act === 'next') show(index + (act === 'next' ? 1 : -1))
    else if (act === 'in' || act === 'out') zoom(scale * (act === 'in' ? 1.25 : 0.8))
    else if (act === 'fit') zoom(fit)
    else if (act === 'one') zoom(1)
  }})
  // A click (not a drag) steps through fit → 100% → 200% → fit, around the point clicked.
  stage.addEventListener('click', (e) => {{
    if (moved) return
    const next = scale < 0.999 ? 1 : scale < 1.999 ? 2 : fit
    zoom(next, e.clientX, e.clientY)
  }})
  stage.addEventListener('wheel', (e) => {{
    if (!e.ctrlKey && !e.metaKey) return
    e.preventDefault()
    zoom(scale * (e.deltaY < 0 ? 1.15 : 0.87), e.clientX, e.clientY)
  }}, {{ passive: false }})
  let start = null
  stage.addEventListener('pointerdown', (e) => {{
    moved = false
    start = {{ x: e.clientX, y: e.clientY, left: stage.scrollLeft, top: stage.scrollTop }}
  }})
  stage.addEventListener('pointermove', (e) => {{
    if (!start) return
    const dx = e.clientX - start.x, dy = e.clientY - start.y
    if (!moved && Math.hypot(dx, dy) < 4) return
    moved = true
    stage.classList.add('panning')
    stage.scrollLeft = start.left - dx
    stage.scrollTop = start.top - dy
  }})
  const stop = () => {{ start = null; stage.classList.remove('panning') }}
  stage.addEventListener('pointerup', stop)
  stage.addEventListener('pointerleave', stop)
  lb.addEventListener('keydown', (e) => {{
    if (e.key === 'ArrowRight') show(index + 1)
    else if (e.key === 'ArrowLeft') show(index - 1)
    else if (e.key === '+' || e.key === '=') zoom(scale * 1.25)
    else if (e.key === '-') zoom(scale * 0.8)
    else if (e.key === '0') zoom(fit)
  }})
  window.addEventListener('resize', () => {{ if (lb.open) {{ fit = fitScale(); zoom(Math.max(scale, fit / 2)) }} }})
}})()
</script>
</body>
</html>
'''
out = root / 'index.html'
out.write_text(page)
print(out, f'{out.stat().st_size // 1024} KB')
