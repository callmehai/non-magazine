"""MẪU (vòng 05/11): chép file này vào scripts/book/out/<vòng>/make.py rồi sửa REPORT, các trang trong P và hàm boxes().
Báo cáo Trước/Sau theo skill verify-ui-in-browser:
cắt cặp trang từ ảnh chụp trang soát (pw=480, DPR 2), khung đỏ lấy từ toạ độ phần tử trong book.json của từng bản,
ghép bằng pair.py, rồi report.py dựng index.html (cả hai nằm cạnh file này trong .claude/skills/verify-ui-in-browser/).
Chạy: /usr/local/bin/python3 scripts/book/out/<vòng>/make.py   (python này có Pillow)
"""
import json
import pathlib
import subprocess

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
REPO = next(p for p in HERE.parents if (p / '.git').exists())
SKILL = REPO / '.claude' / 'skills' / 'verify-ui-in-browser'
RAW = HERE / 'raw'
REPORT = pathlib.Path.home() / '.playwright-e2e' / 'reports' / 'nonla-0511'
(REPORT / 'pairs').mkdir(parents=True, exist_ok=True)
(REPORT / 'shots').mkdir(parents=True, exist_ok=True)
BEFORE = json.load(open(REPO.parent / 'non-before' / 'scripts/book/out/book.json'))['pages']
AFTER = json.load(open(REPO / 'scripts/book/out/book.json'))['pages']
S = 480 / 595.28 * 2  # pt → px ảnh (trang rộng 480 CSS px, DPR 2)
CROP = (480, 0, 2400, round(480 * 841.89 / 595.28) * 2)


def els(pages, n, lang, pred):
    """phần tử trang n (số in trên sách) thoả pred → khung [x, y, w, h] px trong ảnh cặp trang"""
    left = n % 2 == 0
    out = []
    for e in pages[n - 1]['elements']:
        if e.get('only') and e['only'] != lang:
            continue
        if pred(e):
            ox = 0 if left else 960
            out.append((ox + e['x'] * S, e['y'] * S, ox + (e['x'] + e['w']) * S, (e['y'] + e['h']) * S))
    return out


def union(rs):
    rs = [r for r in rs if r]
    if not rs:
        return None
    return [round(min(r[0] for r in rs)), round(min(r[1] for r in rs)), round(max(r[2] for r in rs) - min(r[0] for r in rs)), round(max(r[3] for r in rs) - min(r[1] for r in rs))]


def pt(n, x, y, w, h):
    ox = 0 if n % 2 == 0 else 960
    return (ox + x * S, y * S, ox + (x + w) * S, (y + h) * S)


src = lambda key: (lambda e: key in (e.get('src') or ''))
name = lambda *ns: (lambda e: e.get('name') in ns)
kind = lambda k: (lambda e: e.get('kind') == k)

# mỗi cặp: (tên, trang trái, [ (khung trước, khung sau) … ])
def boxes(n, lang):
    B = lambda p, pred: union(els(BEFORE, p, lang, pred))
    A = lambda p, pred: union(els(AFTER, p, lang, pred))
    if n == 62:
        return [
            (B(62, src('d83f64538a7c')), A(62, src('d83f64538a7c'))),
            (B(62, src('e7e78c7ac11e')), A(62, src('e7e78c7ac11e'))),
            (union([pt(62, 40, 82, 243, 212)]), A(62, src('tool-la-la'))),
        ]
    if n == 114:
        return [
            (B(114, lambda e: e.get('name') == 'Hình vẽ' and e['y'] > 600) or union([pt(114, 40, 700, 505, 84)]), A(114, kind('grove'))),
            (B(115, lambda e: e.get('name') == 'Hình vẽ'), A(115, kind('grove'))),
        ]
    if n == 122:
        return [(B(123, kind('postcard')), A(123, kind('postcard')))]
    if n == 116:
        num = lambda e: e.get('name') == 'Số'
        return [(B(116, num), A(116, num)), (B(117, num), A(117, num))]
    if n == 2:
        return [(B(2, name('Thẻ ghi chú', 'Ghi chú tương tác', 'Dấu chú ý')), A(2, name('Ghi chú tương tác')))]


def crop(path):
    im = Image.open(path).convert('RGB').crop(CROP)
    out = HERE / ('c-' + path.name)
    im.save(out)
    return out


def pair(n, lang):
    b = crop(RAW / f'b-{lang}-{n}.png')
    a = crop(RAW / f'a-{lang}-{n}.png')
    out = REPORT / 'pairs' / f'{lang}-{n}.png'
    args = ['/usr/local/bin/python3', str(SKILL / 'pair.py'), str(b), str(a), str(out)]
    for bb, ab in boxes(n, lang):
        args += ['--before-box', ','.join(map(str, bb)), '--after-box', ','.join(map(str, ab))]
    print(subprocess.run(args, capture_output=True, text=True).stdout.strip().splitlines()[-1])
    return f'pairs/{lang}-{n}.png'


for f in ['live-1', 'live-2', 'live-3', 'live-4', 'live-5', 'live-jump', 'live-refs', 'live-refjump']:
    Image.open(RAW / f'{f}.png').convert('RGB').save(REPORT / 'shots' / f'{f}.png')

P = {(n, l): pair(n, l) for n in (62, 114, 122, 2, 116) for l in ('vi', 'ja') if (n, l) not in ((2, 'ja'), (116, 'ja'))}
for k, v in P.items():
    print(k, v)
