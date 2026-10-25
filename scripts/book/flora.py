"""Hoa lá nét mảnh kiểu tranh khắc (theo mockup của nhóm, tab "Yêu cầu hình thức" → Thu Nguyệt): cành sen, hoa dại, cỏ.
python3 -I scripts/book/flora.py  → public/assets/book/deco/{sen-canh,sen-goc,hoa-dai,co-hoa}.svg
Nét ô liu nâu mảnh, không tô màu (chỉ tô màu giấy để nét phía sau bị che như tranh khắc), dùng ở lề / góc trang.
"""
import math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'book', 'deco')
INK = '#8b8460'
PAPER = '#f8f2e6'

f = lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')


def svg(name, vb, body, sw=1.1):
    w, h = vb
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none" stroke="{INK}" '
         f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">\n{body}\n</svg>\n')
    with open(os.path.join(OUT, name + '.svg'), 'w') as fh:
        fh.write(s)


def unit(ang):
    a = math.radians(ang)
    return math.cos(a), math.sin(a)


def petal(bx, by, ang, L, W, veins=2, fill=PAPER, lean=0.0):
    """cánh hoa từ gốc (bx, by) hướng ang (độ), dài L, rộng W; lean > 0 uốn đầu cánh sang phải"""
    dx, dy = unit(ang)
    nx, ny = -dy, dx
    tx, ty = bx + dx * L + nx * lean * L, by + dy * L + ny * lean * L
    c = lambda t, s: (bx + dx * L * t + nx * W * s, by + dy * L * t + ny * W * s)
    a1, a2 = c(0.25, 0.95), c(0.82, 0.62)
    b1, b2 = c(0.82, -0.62), c(0.25, -0.95)
    out = [f'<path d="M{f(bx)} {f(by)} C {f(a1[0])} {f(a1[1])}, {f(a2[0])} {f(a2[1])}, {f(tx)} {f(ty)} '
           f'C {f(b1[0])} {f(b1[1])}, {f(b2[0])} {f(b2[1])}, {f(bx)} {f(by)} Z" fill="{fill}"/>']
    for k in range(veins):
        s = (k + 1) / (veins + 1) * 2 - 1  # -1..1
        m = c(0.5, s * 0.55)
        e = c(0.78, s * 0.3)
        out.append(f'<path d="M{f(bx + nx * W * s * 0.15)} {f(by + ny * W * s * 0.15)} Q {f(m[0])} {f(m[1])} {f(e[0])} {f(e[1])}" stroke-width="0.55" opacity=".7"/>')
    return out


def lotus_flower(cx, cy, s=1.0, tilt=0.0):
    """bông sen nở nhìn nghiêng: gốc đài ở (cx, cy)"""
    p = []
    # cánh sau (vẽ trước, bị cánh trước che)
    for ang, L, W in ((-90 - 70, 48, 19), (-90 + 70, 48, 19), (-90 - 44, 62, 22), (-90 + 44, 62, 22)):
        p += petal(cx, cy, ang + tilt, L * s, W * s, veins=3, lean=0.1 if ang > -90 else -0.1)
    # cánh trong nhô lên giữa các cánh
    for ang in (-90 - 22, -90 + 22):
        p += petal(cx, cy - 4 * s, ang + tilt, 66 * s, 17 * s, veins=2, lean=0.05 if ang > -90 else -0.05)
    p += petal(cx, cy - 4 * s, -90 + tilt, 72 * s, 20 * s, veins=3)
    # cánh trước, ôm lấy lòng hoa
    for ang, L, W in ((-90 - 30, 52, 23), (-90 + 30, 52, 23)):
        p += petal(cx, cy + 4 * s, ang + tilt, L * s, W * s, veins=3, lean=0.12 if ang > -90 else -0.12)
    p += petal(cx, cy + 6 * s, -90 + tilt, 50 * s, 21 * s, veins=3)
    # đài hoa
    p.append(f'<path d="M{f(cx - 14 * s)} {f(cy + 2 * s)} Q {f(cx)} {f(cy + 12 * s)} {f(cx + 14 * s)} {f(cy + 2 * s)}" fill="{PAPER}"/>')
    return p


def bud(bx, by, ang, s=1.0):
    p = petal(bx, by, ang, 42 * s, 15 * s, veins=0, lean=0.04)
    dx, dy = unit(ang)
    nx, ny = -dy, dx
    for k in (-1, 1):
        a = (bx + nx * k * 9 * s + dx * 6 * s, by + ny * k * 9 * s + dy * 6 * s)
        m = (bx + dx * 26 * s + nx * k * 7 * s, by + dy * 26 * s + ny * k * 7 * s)
        e = (bx + dx * 40 * s, by + dy * 40 * s)
        p.append(f'<path d="M{f(a[0])} {f(a[1])} Q {f(m[0])} {f(m[1])} {f(e[0])} {f(e[1])}" stroke-width="0.8"/>')
    return p


def stem(pts, double=True):
    """thân cong (cubic qua 4 điểm); double: hai nét song song cho có độ dày"""
    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = pts
    out = [f'<path d="M{f(x0)} {f(y0)} C {f(x1)} {f(y1)}, {f(x2)} {f(y2)}, {f(x3)} {f(y3)}"/>']
    if double:
        o = 2.4
        out.append(f'<path d="M{f(x0 + o)} {f(y0)} C {f(x1 + o)} {f(y1)}, {f(x2 + o)} {f(y2)}, {f(x3 + o)} {f(y3)}" stroke-width="0.7"/>')
    # gai nhỏ trên thân sen
    for t in (0.3, 0.5, 0.7, 0.85):
        bx = (1 - t) ** 3 * x0 + 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3 * x3
        by = (1 - t) ** 3 * y0 + 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3 * y3
        out.append(f'<circle cx="{f(bx - 1.6)}" cy="{f(by)}" r="0.55" fill="{INK}" stroke="none"/>')
    return out


def pad(cx, cy, rx, ry, rot=0.0, curl=0.0):
    """lá sen nhìn chéo 3/4: mép lượn sóng, gân tỏa từ cuống"""
    pts = []
    for i in range(73):
        t = math.radians(i * 5)
        w = 1 + 0.035 * math.sin(t * 9) + 0.02 * math.sin(t * 5 + 1)
        x, y = rx * w * math.cos(t), ry * w * math.sin(t)
        if y < 0:
            y *= 1 - curl  # mép sau hơi lật
        r = math.radians(rot)
        pts.append((cx + x * math.cos(r) - y * math.sin(r), cy + x * math.sin(r) + y * math.cos(r)))
    d = 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts) + ' Z'
    out = [f'<path d="{d}" fill="{PAPER}"/>']
    hx, hy = cx + rx * 0.08, cy + ry * 0.15  # cuống lá
    for i in range(0, 72, 6):
        x, y = pts[i]
        mx, my = (hx + x) / 2 + (y - hy) * 0.06, (hy + y) / 2 - (x - hx) * 0.06
        out.append(f'<path d="M{f(hx)} {f(hy)} Q {f(mx)} {f(my)} {f(x * 0.96 + hx * 0.04)} {f(y * 0.96 + hy * 0.04)}" stroke-width="0.55" opacity=".75"/>')
    out.append(f'<circle cx="{f(hx)}" cy="{f(hy)}" r="2" fill="{PAPER}"/>')
    return out


def leaf(x, y, ang, L, W, rib=True):
    """lá thuôn (lá cỏ / lá hoa dại) có gân giữa"""
    dx, dy = unit(ang)
    nx, ny = -dy, dx
    tx, ty = x + dx * L, y + dy * L
    c = lambda t, s: (x + dx * L * t + nx * W * s, y + dy * L * t + ny * W * s)
    a, b = c(0.35, 1.0), c(0.35, -1.0)
    out = [f'<path d="M{f(x)} {f(y)} Q {f(a[0])} {f(a[1])} {f(tx)} {f(ty)} Q {f(b[0])} {f(b[1])} {f(x)} {f(y)} Z" fill="{PAPER}"/>']
    if rib:
        m = c(0.5, 0.12)
        out.append(f'<path d="M{f(x)} {f(y)} Q {f(m[0])} {f(m[1])} {f(tx)} {f(ty)}" stroke-width="0.55" opacity=".75"/>')
    return out


def blossom(cx, cy, r, n=5, rot=0.0):
    """hoa nhỏ 5 cánh nhìn thẳng"""
    out = []
    for k in range(n):
        ang = rot + 360 / n * k - 90
        out += petal(cx, cy, ang, r, r * 0.42, veins=1)
    out.append(f'<circle cx="{f(cx)}" cy="{f(cy)}" r="{f(r * 0.18)}" fill="{PAPER}"/>')
    for k in range(6):
        a = math.radians(60 * k + rot)
        out.append(f'<circle cx="{f(cx + r * 0.3 * math.cos(a))}" cy="{f(cy + r * 0.3 * math.sin(a))}" r="0.6" fill="{INK}" stroke="none"/>')
    return out


def grass(x, y, h, lean):
    return f'<path d="M{f(x)} {f(y)} Q {f(x + lean * 0.3)} {f(y - h * 0.6)} {f(x + lean)} {f(y - h)}" stroke-width="0.8"/>'


# ── cành sen đứng: bông nở + nụ + lá, dùng ở lề trái / phải
b = []
b += stem([(120, 168), (112, 260), (132, 340), (124, 418)])
b += stem([(196, 214), (186, 300), (150, 360), (138, 418)])
b += stem([(70, 300), (84, 350), (104, 390), (112, 418)], double=False)
b += pad(70, 292, 66, 23, rot=-12, curl=0.25)
b += pad(212, 330, 38, 12, rot=14, curl=0.35)
b += stem([(212, 332), (200, 360), (176, 392), (164, 418)], double=False)
b += bud(196, 214, -78, s=1.05)
b += lotus_flower(120, 168, s=1.12)
for x, h, l in ((96, 46, -14), (150, 38, 10), (160, 52, 18), (88, 34, -22)):
    b.append(grass(x, 418, h, l))
svg('sen-canh', (260, 420), '\n'.join(b))

# ── góc trang: cụm sen thấp (bông + lá) nghiêng, đặt góc dưới
g = []
g += stem([(150, 120), (150, 170), (140, 200), (138, 236)])
g += stem([(60, 150), (80, 190), (110, 215), (124, 236)], double=False)
g += pad(70, 150, 62, 22, rot=-8, curl=0.3)
g += pad(214, 196, 40, 13, rot=10, curl=0.2)
g += stem([(214, 198), (200, 214), (176, 228), (160, 236)], double=False)
g += lotus_flower(150, 120, s=0.95, tilt=6)
g += bud(232, 126, -70, s=0.8)
g += stem([(232, 126), (236, 170), (220, 210), (196, 236)], double=False)
svg('sen-goc', (280, 240), '\n'.join(g))

# ── hoa dại: thân mảnh rẽ nhánh, ba bông năm cánh, nụ, lá thuôn
h = []
h.append('<path d="M110 318 C 108 260, 98 200, 104 150 C 108 118, 116 92, 112 60"/>')
h.append('<path d="M104 196 C 86 176, 70 150, 62 112"/>')
h.append('<path d="M106 150 C 126 128, 146 108, 160 80"/>')
h.append('<path d="M108 250 C 128 236, 150 226, 168 206"/>')
for args in ((106, 290, -152, 54, 12), (110, 276, -30, 58, 12), (104, 232, -158, 48, 11), (106, 212, -36, 44, 10), (105, 176, -22, 40, 9), (92, 176, -148, 36, 8), (140, 230, -42, 32, 8), (76, 140, -128, 28, 7), (130, 126, -60, 26, 6)):
    h += leaf(*args)
h += blossom(112, 46, 19, rot=8)
h += blossom(62, 98, 16, rot=-12)
h += blossom(160, 70, 15, rot=20)
h += petal(168, 206, -55, 16, 5, veins=0)
h += petal(168, 206, -85, 15, 5, veins=0)
svg('hoa-dai', (220, 320), '\n'.join(h))

# ── cỏ hoa thấp: dải cỏ có vài bông nhỏ, dùng ngang chân trang
c = []
for i, (x, hh, l) in enumerate(((20, 40, -8), (34, 58, 6), (52, 44, 12), (70, 64, -4), (88, 36, 10), (210, 46, -10), (226, 62, 8), (244, 40, 14), (262, 54, -6))):
    c.append(grass(x, 90, hh, l))
c += leaf(120, 90, -120, 46, 8)
c += leaf(150, 90, -64, 42, 7)
c.append('<path d="M136 90 C 134 70, 140 50, 136 30"/>')
c += blossom(136, 24, 10, rot=4)
c.append('<path d="M178 90 C 182 74, 176 60, 184 48"/>')
c += blossom(184, 42, 8, rot=-10)
svg('co-hoa', (280, 92), '\n'.join(c))
print('ok')
