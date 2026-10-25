"""Bộ hình vẽ nét mảnh cho sách (họa tiết lấy từ nón lá, tre, sen, trống đồng, dụng cụ làm nón).
python3 -I scripts/book/deco.py  → public/assets/book/deco/*.svg
Nét nâu ấm, mảnh, đầu tròn; tô nhạt vài mảng (ngà, xanh xô thơm, đất nung) cho có khối mà vẫn thanh.
"""
import math, os, sys

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'book', 'deco')
INK = '#8a6a3c'
IVORY = '#efe2c4'
SAGE = '#d3dfc3'
CLAY = '#ecd0bd'
RED = '#b4533a'
TEAL = '#5f8f8a'


def svg(name, vb, body, sw=1.5):
    w, h = vb
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none" stroke="{INK}" '
         f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">\n{body}\n</svg>\n')
    with open(os.path.join(OUT, name + '.svg'), 'w') as f:
        f.write(s)


f = lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')


def arc_pts(cx, cy, rx, ry, a0, a1, n=40):
    return [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]


def poly(pts, close=False):
    d = 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts)
    return d + (' Z' if close else '')


# ── nón lá 3/4 (nhìn hơi từ trên): thân nón, các vòng, nan chạy dọc, vành đôi, quai lụa
def non(cx, cy_apex, rx, height, tilt=0.26, strap=True, wash=IVORY, rings=9, ribs=True):
    # dáng nón Chuông thật: góc đỉnh ~100°, cao ≈ 0,7 bán kính vành (nhìn hơi từ trên còn thấp hơn) — không vẽ chóp nhọn.
    # Giữ nguyên vị trí vành, hạ đỉnh xuống.
    h2 = min(height, rx * 0.68)
    cy_apex += height - h2
    height = h2
    ry = rx * tilt
    by = cy_apex + height  # tâm vành
    parts = []
    # thân nón: tam giác cong nhẹ + nửa trước vành
    body = [(cx, cy_apex)] + arc_pts(cx, by, rx, ry, 180, 0, 60)[::-1]
    body = [(cx, cy_apex)] + arc_pts(cx, by, rx, ry, 0, 180, 60) + [(cx, cy_apex)]
    parts.append(f'<path d="{poly(body, True)}" fill="{wash}" stroke="none"/>')
    # vòng (16 vòng của khung, vẽ thưa)
    for i in range(1, rings + 1):
        t = i / (rings + 1)
        parts.append(f'<path d="{poly(arc_pts(cx, cy_apex + height * t, rx * t, ry * t, 8, 172, 30))}" stroke-width="0.8" opacity=".55"/>')
    # nan dọc nhẹ
    if ribs:
        for a in (30, 55, 80, 100, 125, 150):
            x, y = cx + rx * math.cos(math.radians(a)), by + ry * math.sin(math.radians(a))
            parts.append(f'<path d="M{f(cx)} {f(cy_apex + 4)} L{f(x)} {f(y)}" stroke-width="0.6" opacity=".35"/>')
    # hai cạnh thân
    parts.append(f'<path d="M{f(cx)} {f(cy_apex)} L{f(cx - rx)} {f(by)} M{f(cx)} {f(cy_apex)} L{f(cx + rx)} {f(by)}"/>')
    # vành đôi (cả vòng, nửa sau mảnh hơn)
    parts.append(f'<path d="{poly(arc_pts(cx, by, rx, ry, 0, 180, 60))}"/>')
    parts.append(f'<path d="{poly(arc_pts(cx, by + 2.4, rx * 0.985, ry * 0.95, 4, 176, 60))}" stroke-width="0.9" opacity=".7"/>')
    # chóp
    # núm chóp tròn (bông chỉ khâu chóp), không để đỉnh nhọn hoắt
    parts.append(f'<circle cx="{f(cx)}" cy="{f(cy_apex + 1)}" r="{f(max(2.2, rx * 0.04))}" fill="{wash}" stroke-width="0.9"/>')
    if strap:
        # quai lụa mềm buông dưới vành
        l, r_ = cx - rx * 0.42, cx + rx * 0.42
        y0 = by + ry * 0.85
        # võng vừa phải (≈0,4 bán kính) để quai nằm gọn trong khung hình, không bị cắt mất phần dưới
        parts.append(f'<path d="M{f(l)} {f(y0)} C {f(l + 6)} {f(y0 + rx * 0.42)}, {f(r_ - 6)} {f(y0 + rx * 0.42)}, {f(r_)} {f(y0)}" stroke="{RED}" stroke-width="1.6"/>')
        parts.append(f'<path d="M{f(l + 4)} {f(y0 + 1)} C {f(l + 10)} {f(y0 + rx * 0.37)}, {f(r_ - 10)} {f(y0 + rx * 0.37)}, {f(r_ - 4)} {f(y0 + 1)}" stroke="{RED}" stroke-width="0.8" opacity=".6"/>')
    return '\n'.join(parts)


def bamboo(x, y0, y1, lean=6, leaves=((0.3, 1), (0.55, -1), (0.8, 1))):
    parts = [f'<path d="M{f(x)} {f(y1)} C {f(x - lean)} {f(y0 + (y1 - y0) * 0.6)}, {f(x + lean)} {f(y0 + (y1 - y0) * 0.3)}, {f(x + lean * 1.4)} {f(y0)}"/>']
    parts.append(f'<path d="M{f(x + 5)} {f(y1)} C {f(x - lean + 5)} {f(y0 + (y1 - y0) * 0.6)}, {f(x + lean + 5)} {f(y0 + (y1 - y0) * 0.3)}, {f(x + lean * 1.4 + 4)} {f(y0 + 2)}" opacity=".5"/>')
    n = 5
    for i in range(1, n):
        yy = y1 - (y1 - y0) * i / n
        parts.append(f'<path d="M{f(x - 2 + lean * 0.3 * i / n)} {f(yy)} h9" opacity=".8"/>')
    for t, side in leaves:
        yy = y1 - (y1 - y0) * t
        xx = x + lean * t
        L = 46
        tip = (xx + side * L, yy - 18)
        parts.append(f'<path d="M{f(xx)} {f(yy)} C {f(xx + side * 14)} {f(yy - 14)}, {f(tip[0] - side * 10)} {f(tip[1] - 4)}, {f(tip[0])} {f(tip[1])} C {f(tip[0] - side * 12)} {f(tip[1] + 8)}, {f(xx + side * 16)} {f(yy - 2)}, {f(xx)} {f(yy)} Z" fill="{SAGE}"/>')
        parts.append(f'<path d="M{f(xx + side * 4)} {f(yy - 2)} Q {f(xx + side * 22)} {f(yy - 12)} {f(tip[0] - side * 4)} {f(tip[1] + 1)}" stroke-width="0.7" opacity=".6"/>')
    return '\n'.join(parts)


def leafy(x, y, ang, L=40, fill=SAGE):
    a = math.radians(ang)
    tx, ty = x + L * math.cos(a), y + L * math.sin(a)
    nx, ny = -math.sin(a) * L * 0.22, math.cos(a) * L * 0.22
    return (f'<path d="M{f(x)} {f(y)} Q {f((x + tx) / 2 + nx)} {f((y + ty) / 2 + ny)} {f(tx)} {f(ty)} Q {f((x + tx) / 2 - nx)} {f((y + ty) / 2 - ny)} {f(x)} {f(y)} Z" fill="{fill}"/>'
            f'<path d="M{f(x)} {f(y)} L{f(tx)} {f(ty)}" stroke-width="0.6" opacity=".5"/>')


def lotus(cx, cy, s=1.0):
    p = []
    for ang, L in ((-90, 46), (-125, 40), (-55, 40), (-155, 32), (-25, 32)):
        a = math.radians(ang)
        tx, ty = cx + L * s * math.cos(a), cy + L * s * math.sin(a)
        nx, ny = -math.sin(a) * 13 * s, math.cos(a) * 13 * s
        p.append(f'<path d="M{f(cx)} {f(cy)} C {f(cx + nx)} {f(cy + ny)}, {f(tx + nx * 0.6)} {f(ty + ny * 0.6)}, {f(tx)} {f(ty)} C {f(tx - nx * 0.6)} {f(ty - ny * 0.6)}, {f(cx - nx)} {f(cy - ny)}, {f(cx)} {f(cy)} Z" fill="{CLAY}"/>')
    p.append(f'<path d="M{f(cx)} {f(cy)} C {f(cx - 3)} {f(cy + 40 * s)}, {f(cx + 4)} {f(cy + 70 * s)}, {f(cx - 2)} {f(cy + 110 * s)}"/>')
    return '\n'.join(p)


def cloud(cx, cy, s=1.0, mirror=False):
    """mây cuộn kiểu hoa văn Việt: dải mây mảnh, hai đầu cuộn tròn vào trong, nét đôi"""
    k = -1 if mirror else 1
    X = lambda v: f(cx + k * v * s)
    Y = lambda v: f(cy + v * s)
    spiral = lambda x, y, r, d: (f'<path d="M{X(x)} {Y(y)} C {X(x + d * r)} {Y(y)}, {X(x + d * r)} {Y(y - r)}, {X(x)} {Y(y - r)} '
                                 f'C {X(x - d * r * 0.6)} {Y(y - r)}, {X(x - d * r * 0.6)} {Y(y - r * 0.45)}, {X(x - d * r * 0.1)} {Y(y - r * 0.45)}" stroke-width="1.1"/>')
    body = (f'<path d="M{X(-58)} {Y(4)} C {X(-60)} {Y(-14)}, {X(-36)} {Y(-20)}, {X(-26)} {Y(-8)} C {X(-22)} {Y(-30)}, {X(8)} {Y(-34)}, {X(14)} {Y(-14)} '
            f'C {X(22)} {Y(-26)}, {X(46)} {Y(-22)}, {X(46)} {Y(-4)} C {X(58)} {Y(-6)}, {X(64)} {Y(6)}, {X(56)} {Y(12)} '
            f'C {X(30)} {Y(10)}, {X(-30)} {Y(10)}, {X(-58)} {Y(4)} Z" fill="{IVORY}" stroke-width="1.1"/>')
    inner = (f'<path d="M{X(-50)} {Y(4)} C {X(-20)} {Y(1)}, {X(24)} {Y(1)}, {X(50)} {Y(7)}" stroke-width="0.7" opacity=".6"/>')
    return body + inner + spiral(-26, -8, 9, 1) + spiral(14, -14, 11, 1) + spiral(46, -4, 7, -1)


os.makedirs(OUT, exist_ok=True)

# 1. nón lá đơn (dùng nhiều nơi)
svg('non', (300, 260), non(150, 18, 140, 150))

# 1b. nón lá chỉ nét (chân trang giấy "non"): cùng dáng thấp như trên — đỉnh y 42, vành y 132, bán kính 138
ax, ay, by_, rx_ = 160, 42, 132, 138
nl = [f'<path d="M{ax} {ay + 2} L {ax - rx_} {by_} Q {ax} {by_ + 40}, {ax + rx_} {by_} L {ax} {ay + 2} Z"/>',
      f'<ellipse cx="{ax}" cy="{by_}" rx="{rx_}" ry="16" opacity=".6"/>',
      f'<circle cx="{ax}" cy="{ay + 3}" r="4" fill="{IVORY}" stroke-width="1"/>']
ribs = ' '.join(f'M{ax} {ay + 6} L {f(ax + rx_ * math.cos(math.radians(a)))} {f(by_ + 16 * math.sin(math.radians(a)) + 2)}' for a in (32, 58, 80, 100, 122, 148))
rings_ = ' '.join(f'M{f(ax - rx_ * t)} {f(ay + (by_ - ay) * t)} Q {ax} {f(ay + (by_ - ay) * t + 16 * t * 1.2)}, {f(ax + rx_ * t)} {f(ay + (by_ - ay) * t)}' for t in (i / 7 for i in range(1, 7)))
nl.append(f'<g opacity=".45"><path d="{ribs}"/><path d="{rings_}"/></g>')
svg('non-line', (320, 170), '\n'.join(nl), sw=1.2)

# 2. tĩnh vật: chồng nón + nón nghiêng + tre + lá (chân trang, mục lục)
body = []
body.append(bamboo(64, 6, 300, lean=8))
body.append(bamboo(96, 40, 300, lean=-6, leaves=((0.35, -1), (0.62, 1))))
for i in range(5):  # chồng nón
    body.append(non(250, 128 - i * 9, 118, 112, rings=7 if i == 4 else 0, strap=False, ribs=i == 4))
body.append(f'<g transform="rotate(-14 470 210)">{non(470, 120, 104, 96)}</g>')
body.append(leafy(380, 296, -160, 54) + leafy(388, 294, -120, 44) + leafy(560, 296, -30, 50))
body.append(f'<path d="M20 298 C 160 292, 420 302, 620 296" stroke-width="1" opacity=".6"/>')
svg('still-non', (640, 310), '\n'.join(body))

# 3. trống đồng Đông Sơn (in mờ): sao giữa, các vành, chim lạc bay, răng cưa, chấm
d = []
c = 200
d.append(f'<circle cx="{c}" cy="{c}" r="196"/><circle cx="{c}" cy="{c}" r="190" stroke-width="0.8"/>')
star = []
for i in range(28):
    r = 46 if i % 2 == 0 else 14
    a = math.pi * 2 * i / 28 - math.pi / 2
    star.append((c + r * math.cos(a), c + r * math.sin(a)))
d.append(f'<path d="{poly(star, True)}" fill="{IVORY}"/>')
for r in (52, 58, 84, 90, 120, 126, 160, 166, 186):
    d.append(f'<circle cx="{c}" cy="{c}" r="{r}" stroke-width="0.8"/>')
for i in range(48):  # chấm tròn giữa 52–58 và 120–126
    a = math.pi * 2 * i / 48
    for r in (55, 123):
        d.append(f'<circle cx="{f(c + r * math.cos(a))}" cy="{f(c + r * math.sin(a))}" r="1.2" fill="{INK}" stroke="none"/>')
zig = []
for i in range(97):  # răng cưa 60–84
    a = math.pi * 2 * i / 96
    r = 66 if i % 2 == 0 else 78
    zig.append((c + r * math.cos(a), c + r * math.sin(a)))
d.append(f'<path d="{poly(zig)}" stroke-width="0.8"/>')
for i in range(36):  # vạch chéo 90–120
    a = math.pi * 2 * i / 36
    x0, y0 = c + 92 * math.cos(a), c + 92 * math.sin(a)
    x1, y1 = c + 118 * math.cos(a + 0.06), c + 118 * math.sin(a + 0.06)
    d.append(f'<path d="M{f(x0)} {f(y0)} L{f(x1)} {f(y1)}" stroke-width="0.7"/>')
for i in range(10):  # chim lạc bay ngược chiều kim đồng hồ ở vành 126–160
    a = math.pi * 2 * i / 10
    bx, by = c + 143 * math.cos(a), c + 143 * math.sin(a)
    deg = math.degrees(a) + 90
    d.append(f'<g transform="translate({f(bx)} {f(by)}) rotate({f(deg)})"><path d="M-14 2 C -6 -2, -2 -2, 4 0 L 14 -6 M4 0 L 12 4 M-4 -1 C -8 -9, -2 -12, 2 -7 M-4 1 C -8 9, -2 12, 2 7" stroke-width="1"/></g>')
for i in range(60):
    a = math.pi * 2 * i / 60
    d.append(f'<path d="M{f(c + 168 * math.cos(a))} {f(c + 168 * math.sin(a))} L{f(c + 184 * math.cos(a))} {f(c + 184 * math.sin(a))}" stroke-width="0.6"/>')
svg('dong-son', (400, 400), '\n'.join(d), sw=1.1)

# 4. mây
svg('cloud', (140, 60), cloud(70, 38), sw=1.1)

# 5. sen + lá sen (góc trang / in mờ)
body = [lotus(110, 120, 1.1), f'<path d="M30 230 C 60 196, 160 196, 190 230 C 150 222, 70 222, 30 230 Z" fill="{SAGE}"/>',
        f'<path d="M110 230 L 110 200 M70 224 L 110 206 L 150 224" stroke-width="0.7" opacity=".6"/>',
        lotus(186, 168, 0.6)]
svg('lotus-pond', (240, 240), '\n'.join(body))

# 5b. tre già măng mọc (chương 3: ghi nhận, bảo tồn, truyền nghề cho lớp sau) — hai cây tre già + mầm măng ở gốc
body = [bamboo(92, 26, 214, lean=10, leaves=((0.55, -1), (0.72, 1), (0.9, -1))),
        bamboo(132, 58, 214, lean=-8, leaves=((0.5, 1), (0.74, -1), (0.92, 1)))]
# măng: búp nhọn nhiều lớp bẹ ôm nhau, màu đất nung nhạt
mx, my = 168, 214
body.append(f'<path d="M{mx - 16} {my} C {mx - 14} {my - 22}, {mx - 6} {my - 40}, {mx + 2} {my - 52} C {mx + 6} {my - 38}, {mx + 14} {my - 20}, {mx + 16} {my} Z" fill="{CLAY}"/>')
for i in range(4):
    yy = my - 8 - i * 11
    w = 15 - i * 3.2
    body.append(f'<path d="M{f(mx - w)} {f(yy + 4)} Q {f(mx)} {f(yy - 6)} {f(mx + w)} {f(yy + 4)}" stroke-width="0.9"/>')
body.append(f'<path d="M{mx - 26} {my - 1} q 5 -14 10 -2 M{mx + 22} {my - 1} q 4 -10 8 0" stroke-width="0.8"/>')
body.append(f'<path d="M30 {my + 2} C 90 {my - 4}, 160 {my + 6}, 212 {my + 1}" stroke-width="1" opacity=".6"/>')
svg('tre-mang', (240, 240), '\n'.join(body))

# ── dụng cụ / công đoạn (mỗi hình trong ô 160×160)
tools = {}
# rẽ lá: bó lá lụi dài buộc giữa + một lá đang được vuốt phẳng
t = []
for i, ang in enumerate((-8, -4, 0, 4, 8)):
    t.append(f'<g transform="rotate({ang} 80 120)"><path d="M80 150 C 74 110, 76 60, 80 14 C 84 60, 86 110, 80 150 Z" fill="{IVORY}"/><path d="M80 140 L 80 24" stroke-width="0.6" opacity=".5"/></g>')
t.append(f'<path d="M66 104 C 74 110, 86 110, 94 104" stroke="{RED}" stroke-width="2"/>')
t.append(f'<path d="M100 60 C 120 66, 140 64, 152 56 C 140 76, 118 78, 100 60 Z" fill="{SAGE}"/>')
tools['re-la'] = t
# là lá: nồi / bếp điện + tấm gang + lá + hơi nóng
t = [f'<path d="M40 150 L 40 104 C 40 96, 120 96, 120 104 L 120 150 Z" fill="{IVORY}"/>',
     f'<ellipse cx="80" cy="104" rx="40" ry="8"/>', f'<path d="M30 92 L 130 92 L 122 100 L 38 100 Z" fill="#cfc6b8"/>',
     f'<path d="M48 88 C 70 84, 96 84, 118 88" stroke-width="1.2" fill="{SAGE}"/>',
     f'<path d="M58 70 C 52 62, 64 56, 58 46 M80 66 C 74 58, 86 52, 80 42 M102 70 C 96 62, 108 56, 102 46" stroke-width="1" opacity=".7"/>',
     f'<path d="M44 128 h 72" stroke-width="0.8" opacity=".5"/>']
tools['la-la'] = t
# bứt vòng: các vòng nứa tròn lồng nhau, buộc
t = []
for i, r in enumerate((60, 50, 40, 31, 22, 14)):
    t.append(f'<ellipse cx="80" cy="96" rx="{r}" ry="{f(r * 0.34)}" stroke-width="{1.4 - i * 0.1:.1f}"/>')
t.append(f'<ellipse cx="80" cy="70" rx="44" ry="15" stroke-width="1.2"/><ellipse cx="80" cy="50" rx="30" ry="10" stroke-width="1.1"/>')
t.append(f'<path d="M80 30 L 80 120" stroke-width="0.6" opacity=".4"/>')
tools['but-vong'] = t
# quay nón: khuôn nón dáng thấp (cao ≈ 0,7 bán kính như nón thật) có 8 gọng, các vòng, lá xếp lên một phần
ax, ay, by_, rx_ = 80, 70, 122, 70
t = [f'<path d="M{ax} {ay} L {ax - rx_} {by_} Q {ax} {by_ + 22} {ax + rx_} {by_} Z" fill="{IVORY}" stroke="none"/>']
for i in range(1, 8):
    k = i / 8
    t.append(f'<path d="M{f(ax - rx_ * k)} {f(ay + (by_ - ay) * k)} Q {ax} {f(ay + (by_ - ay) * k + 22 * k)} {f(ax + rx_ * k)} {f(ay + (by_ - ay) * k)}" stroke-width="0.8"/>')
for a in (198, 222, 246, 270, 294, 318, 342):
    x = ax + rx_ * math.cos(math.radians(a - 180))
    y = by_ + 11 * math.sin(math.radians(a - 180)) * -1
    t.append(f'<path d="M{ax} {ay + 3} L {f(x)} {f(by_ + 11 * abs(math.sin(math.radians(a))))}" stroke-width="0.7" opacity=".6"/>')
t.append(f'<path d="M{ax} {ay} L {ax - rx_} {by_} Q {ax} {by_ + 22} {ax + rx_} {by_} Z"/>')
t.append(f'<path d="M{ax - 2} {ay + 4} L {ax - 46} {by_ - 6} Q {ax - 26} {by_ + 6} {ax - 6} {by_ + 9} Z" fill="{SAGE}" opacity=".9"/>')
t.append(f'<circle cx="{ax}" cy="{ay + 1}" r="3.2" fill="{IVORY}" stroke-width="1"/>')
tools['quay-non'] = t
# khâu nón: kim + sợi cước uốn lượn + đoạn vành
t = [f'<path d="M24 120 Q 80 96 136 120" stroke-width="2"/>', f'<path d="M26 126 Q 80 102 134 126" stroke-width="1" opacity=".6"/>',
     f'<path d="M104 26 L 60 116" stroke-width="2"/>', f'<ellipse cx="102" cy="30" rx="2.4" ry="5" transform="rotate(26 102 30)"/>',
     f'<path d="M102 30 C 126 40, 140 66, 118 80 C 100 92, 118 110, 140 104" stroke="{TEAL}" stroke-width="1.1"/>',
     f'<path d="M40 112 l 6 6 M56 106 l 6 6 M72 102 l 6 6 M88 102 l 6 6 M104 106 l 6 6" stroke-width="1"/>']
tools['khau-non'] = t
# nức nón: kéo cắt lá thừa ở vành
t = [f'<path d="M20 128 Q 80 100 140 128" stroke-width="2.2"/>',
     f'<path d="M40 126 l -4 12 M60 118 l -3 12 M80 114 l 0 12 M100 118 l 3 12 M120 126 l 4 12" stroke-width="0.9" opacity=".7"/>',
     f'<circle cx="62" cy="58" r="12"/><circle cx="96" cy="46" r="12"/>',
     f'<path d="M70 66 L 118 112 M88 54 L 112 116" stroke-width="2"/>', f'<circle cx="104" cy="100" r="2" fill="{INK}"/>']
tools['nuc-non'] = t
# luồn nhôi: lòng nón nhìn từ dưới, chỉ màu chạy vòng + cuộn chỉ
t = [f'<circle cx="74" cy="84" r="56" fill="{IVORY}"/>', f'<circle cx="74" cy="84" r="40" stroke-width="0.8" opacity=".6"/>',
     f'<circle cx="74" cy="84" r="22" stroke-width="0.8" opacity=".6"/>', f'<circle cx="74" cy="84" r="3" fill="{INK}"/>',
     f'<path d="M34 84 C 44 60, 60 50, 74 62 C 88 50, 104 60, 114 84" stroke="{RED}" stroke-width="1.6"/>',
     f'<path d="M40 96 C 52 110, 96 110, 108 96" stroke="{TEAL}" stroke-width="1.6"/>',
     f'<path d="M126 132 h 22 M128 112 h 18 M130 112 v 20 M144 112 v 20" stroke-width="1.2"/>',
     f'<path d="M131 116 h 12 M131 120 h 12 M131 124 h 12 M131 128 h 12" stroke="{RED}" stroke-width="1"/>']
tools['luon-nhoi'] = t
# quang dầu: nón + chổi quét dầu + giọt dầu + nắng
t = [non(70, 40, 58, 74, strap=False, rings=5, ribs=False),
     f'<path d="M110 40 L 150 12" stroke-width="2"/>', f'<path d="M104 46 L 116 34 L 122 40 L 110 52 Z" fill="#d9b77a"/>',
     f'<path d="M98 56 q -3 7 0 9 q 3 -2 0 -9 Z" fill="#d9b77a"/>',
     f'<circle cx="138" cy="70" r="9"/><path d="M138 52 v6 M138 82 v6 M120 70 h6 M150 70 h6 M126 58 l4 4 M146 78 l4 4 M150 58 l-4 4 M126 82 l4 -4" stroke-width="0.9"/>']
tools['quang-dau'] = t
for k, v in tools.items():
    svg('tool-' + k, (160, 160), '\n'.join(v), sw=1.4)

print('ok', len(os.listdir(OUT)))
