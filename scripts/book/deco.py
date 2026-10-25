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


def svg(name, vb, body, sw=1.5, ink=INK):
    w, h = vb
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none" stroke="{ink}" '
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
    if strap:
        # quai lụa buộc vào hai mảng nhôi TRONG lòng nón: vẽ trước thân nón để thân che hai đầu quai,
        # chỉ phần võng thò ra dưới vành trước là nhìn thấy (trước đây quai mọc ra từ mặt ngoài nón)
        l, r_ = cx - rx * 0.46, cx + rx * 0.46
        y0 = by - ry * 0.25
        low = by + ry + rx * 0.2  # điểm thấp nhất của quai
        c = y0 + (low - y0) / 0.75
        parts.append(f'<path d="M{f(l)} {f(y0)} C {f(l)} {f(c)}, {f(r_)} {f(c)}, {f(r_)} {f(y0)}" stroke="{RED}" stroke-width="1.6"/>')
        parts.append(f'<path d="M{f(l + 5)} {f(y0)} C {f(l + 5)} {f(c - 7)}, {f(r_ - 5)} {f(c - 7)}, {f(r_ - 5)} {f(y0)}" stroke="{RED}" stroke-width="0.8" opacity=".6"/>')
    # thân nón: tam giác cong nhẹ + nửa trước vành
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

# 1b. nón lá chỉ nét (chân trang giấy "non", 30 trang): dáng thấp, chỉ vẽ phần nhìn thấy — không vẽ vành sau xuyên qua thân
ax, ay, by_, rx_, ry_ = 160, 44, 132, 138, 17
front = arc_pts(ax, by_, rx_, ry_, 0, 180, 60)
nl = [f'<path d="{poly([(ax, ay)] + front, True)}" fill="{IVORY}" fill-opacity=".35"/>',
      f'<path d="{poly(arc_pts(ax, by_ + 3, rx_ * 0.985, ry_ * 0.95, 5, 175, 60))}" stroke-width=".8" opacity=".6"/>']
rings_ = ' '.join(poly(arc_pts(ax, ay + (by_ - ay) * t, rx_ * t, ry_ * t, 6, 174, 30)) for t in (i / 8 for i in range(1, 8)))
ribs = ' '.join(f'M{ax} {ay + 5} L {f(ax + rx_ * math.cos(math.radians(a)))} {f(by_ + ry_ * math.sin(math.radians(a)))}' for a in (35, 60, 80, 100, 120, 145))
nl.append(f'<g opacity=".45" stroke-width=".9"><path d="{ribs}"/><path d="{rings_}"/></g>')
nl.append(f'<circle cx="{ax}" cy="{ay + 1}" r="4" fill="{IVORY}" stroke-width="1"/>')
svg('non-line', (320, 170), '\n'.join(nl), sw=1.2)

# 1c. nón nhìn từ trên: mười sáu vòng nứa + gân lá toả từ chóp (in mờ ở trang mở chương; gợi mặt trống đồng mà không chép trống)
c = 200
v = [f'<circle cx="{c}" cy="{c}" r="194" stroke-width="1.6"/>', f'<circle cx="{c}" cy="{c}" r="188" stroke-width=".8"/>']
v += [f'<circle cx="{c}" cy="{c}" r="{f(186 * i / 16)}" stroke-width="{.7 + .3 * (i % 4 == 0)}"/>' for i in range(2, 16)]
v.append('<g stroke-width=".45" opacity=".6">' + ''.join(
    f'<path d="M{f(c + 14 * math.cos(a))} {f(c + 14 * math.sin(a))} L{f(c + 186 * math.cos(a))} {f(c + 186 * math.sin(a))}"/>'
    for a in (math.pi * 2 * i / 72 for i in range(72))) + '</g>')
# mũi khâu dọc theo các vòng (chỗ sợi cước giữ lá vào vòng)
for i in range(4, 16, 2):
    r = 186 * i / 16
    n = int(r / 5)
    v.append('<g stroke-width=".7">' + ''.join(
        f'<path d="M{f(c + (r - 2.2) * math.cos(a))} {f(c + (r - 2.2) * math.sin(a))} L{f(c + (r + 2.2) * math.cos(a))} {f(c + (r + 2.2) * math.sin(a))}"/>'
        for a in (math.pi * 2 * k / n for k in range(n))) + '</g>')
v.append(f'<circle cx="{c}" cy="{c}" r="9" fill="{IVORY}" stroke-width="1.2"/>')
svg('vong-non', (400, 400), '\n'.join(v), sw=1)
# bản nét vàng thếp trên nền then (bìa, bìa sau — kiểu sơn mài; không dùng ảnh tràn trang)
GOLD = '#d9b56a'
svg('vong-non-gold', (400, 400), '\n'.join(v).replace(f'fill="{IVORY}"', 'fill="#3a2a1c"'), sw=1, ink=GOLD)
# nón lớn cho bìa trước / bìa sau (giấy ngà, nét nâu): đỉnh y 20, vành y 210, quai võng dưới vành — khung đủ cao không cắt quai
svg('bia-non', (600, 350), non(300, 20, 280, 190, rings=12), sw=1.6)

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

# ── dụng cụ / công đoạn (mỗi hình trong ô 160×160), vẽ theo đúng mô tả từng bước ở chương 2 (scripts/book/content/02-ch2.mjs)
IRON = '#a39a8c'  # gang
WOOD = '#c9a46a'


def blade(x0, y0, x1, y1, w, wave=0.0, wave_from=1.0, n=48):
    """lá lụi dài: thuôn hai đầu; wave > 0 thì nửa ngọn còn quăn (mép lượn sóng)"""
    dx, dy = x1 - x0, y1 - y0
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    nx, ny = -uy, ux
    top, bot, mid = [], [], []
    for i in range(n + 1):
        t = i / n
        hw = w * math.sin(math.pi * min(t * 1.08, 1)) ** 0.7 if t < 0.97 else w * 0.15 * (1 - t) / 0.03
        k = max(0.0, (t - wave_from) / (1 - wave_from)) if wave else 0
        off = wave * k * math.sin(t * 34)
        px, py = x0 + dx * t + nx * off, y0 + dy * t + ny * off
        top.append((px + nx * hw, py + ny * hw))
        bot.append((px - nx * hw * (1 + 0.6 * k * math.cos(t * 29)), py - ny * hw * (1 + 0.6 * k * math.cos(t * 29))))
        mid.append((px, py))
    return poly(top + bot[::-1], True), poly(mid[2:-2])


tools = {}

# 1. rẽ lá: lá mua về còn quăn → rẽ từ ngọn xuống cuống cho phẳng; dưới là xấp lá đã rẽ
t = []
for k in range(3):
    o, m = blade(18 + k * 4, 140 - k * 5, 142 + k * 2, 132 - k * 5, 5.5)
    t.append(f'<path d="{o}" fill="{IVORY}" stroke-width="1.1"/><path d="{m}" stroke-width=".5" opacity=".5"/>')
o, m = blade(24, 112, 140, 34, 9, wave=3.2, wave_from=0.45)
t.append(f'<path d="{o}" fill="{IVORY}"/><path d="{m}" stroke-width=".6" opacity=".55"/>')
# mũi tên chiều tay vuốt: từ ngọn xuống cuống
t.append(f'<path d="M128 22 C 104 30, 76 52, 50 80" stroke-width="1" stroke-dasharray="3 3"/>')
t.append(f'<path d="M50 80 l 2 -8 M50 80 l 8 -2" stroke-width="1.1"/>')
tools['re-la'] = t

# 2. là lá: bếp điện + lưỡi cày gang nóng, lá đặt lên mặt gang, bọc vải miết kéo cho phẳng
t = [f'<path d="M24 124 L 136 124 L 124 108 L 36 108 Z" fill="#e8dcc4"/>',
     f'<path d="M24 124 L 24 146 Q 24 150 28 150 L 132 150 Q 136 150 136 146 L 136 124" fill="{IVORY}"/>',
     f'<circle cx="118" cy="137" r="4.5"/><path d="M118 134 v3" stroke-width="1"/><path d="M34 137 h 50" stroke-width=".7" opacity=".5"/>',
     f'<path d="M40 117 C 60 112, 96 108, 132 100 C 124 110, 110 118, 98 120 C 78 122, 56 122, 40 117 Z" fill="{IRON}"/>']
o, m = blade(52, 116, 112, 110, 4.5)
t.append(f'<path d="{o}" fill="{IVORY}" stroke-width="1"/>')
# bọc vải: miếng giẻ gấp nhiều lớp, dẹt, có nếp
t.append(f'<path d="M68 109 C 66 100, 70 95, 80 94 L 106 92 C 116 92, 120 100, 116 108 C 104 112, 80 113, 68 109 Z" fill="{CLAY}"/>')
t.append(f'<path d="M74 101 C 86 99, 100 98, 112 99 M80 95 C 84 98, 86 102, 85 108 M98 93 C 101 97, 102 102, 100 110" stroke-width=".8" opacity=".7"/>')
t.append(f'<path d="M48 100 C 54 98, 58 98, 62 99 M44 106 C 52 104, 58 104, 64 105" stroke-width=".9" opacity=".7"/>')
t.append(f'<path d="M122 92 c -4 -6 4 -10 0 -16 M132 90 c -4 -6 4 -10 0 -16" stroke-width=".9" opacity=".6"/>')
tools['la-la'] = t

# 3. bứt vòng: vòng nứa đủ cỡ xếp lồng nhau (16 vòng, từ vòng cạp đến vòng chóp); vòng cạp ngoài cùng có mối nối vát mỏng
#    quấn chỉ; dao vót nằm cạnh với vài phoi nứa
t = ['<g transform="translate(4 -22)">']
for i, r in enumerate((60, 52, 45, 38, 32, 26, 21, 16, 11)):
    t.append(f'<ellipse cx="72" cy="{96 + (60 - r) * 0.1:.1f}" rx="{r}" ry="{f(r * 0.34)}" stroke-width="{1.6 - i * 0.1:.1f}"/>')
jx, jy = 72 + 60 * math.cos(math.radians(60)), 96 + 20.4 * math.sin(math.radians(60))
t.append(f'<path d="{poly(arc_pts(72, 96, 60, 20.4, 48, 72, 10))}" stroke-width="4" opacity=".35"/>')
t.append(''.join(f'<path d="M{f(jx - 6 + 4 * k)} {f(jy - 3)} l 2 6" stroke="{RED}" stroke-width="1.1"/>' for k in range(4)))
t.append(f'<g transform="rotate(-28 118 134)"><path d="M92 134 L 124 130 L 126 136 L 94 137 Z" fill="#e3e0d8"/><rect x="124" y="129.5" width="26" height="7.5" rx="2" fill="{WOOD}"/></g>')
t.append(f'<path d="M30 132 c 4 -4 8 -2 10 2 M48 140 c 3 -5 9 -4 10 0 M24 142 c 5 -3 9 -1 9 3" stroke-width=".9" opacity=".7"/>')
t.append('</g>')
tools['but-vong'] = t

# 4. quay nón: khuôn nón (gọng gỗ + vòng) — lớp lá xếp dần từ chóp xuống, kim cắm giữ ở chóp
ax, ay, by_, rx_, ry_ = 80, 70, 120, 72, 18
hp = poly([(ax, ay)] + arc_pts(ax, by_, rx_, ry_, 0, 180, 60), True)
t = [f'<defs><clipPath id="qn"><path d="{hp}"/></clipPath></defs>', f'<path d="{hp}" fill="#f3ead6" fill-opacity=".5" stroke="none"/>', '<g clip-path="url(#qn)">']
for a in (20, 45, 70, 90, 110, 135, 160):  # gọng khuôn
    x, y = ax + rx_ * math.cos(math.radians(a)), by_ + ry_ * math.sin(math.radians(a))
    t.append(f'<path d="M{ax} {ay} L {f(x)} {f(y)}" stroke="{WOOD}" stroke-width="2.2"/>')
for i in range(1, 8):
    k = i / 8
    t.append(f'<path d="{poly(arc_pts(ax, ay + (by_ - ay) * k, rx_ * k, ry_ * k, 0, 180, 30))}" stroke-width=".8"/>')
for a in range(96, 186, 9):  # lá đã xếp phủ một phần khuôn (bên trái)
    x0, y0 = ax + rx_ * 1.1 * math.cos(math.radians(a)), by_ + ry_ * 1.1 * math.sin(math.radians(a))
    x1, y1 = ax + rx_ * 1.1 * math.cos(math.radians(a + 11)), by_ + ry_ * 1.1 * math.sin(math.radians(a + 11))
    t.append(f'<path d="M{ax} {ay} L {f(x0)} {f(y0)} L {f(x1)} {f(y1)} Z" fill="{IVORY}" stroke-width=".7"/>')
t.append('</g>')
t.append(f'<path d="{hp}"/>')
t.append(f'<path d="M{ax - 6} {ay - 12} L {ax + 3} {ay + 8}" stroke-width="1.2"/><circle cx="{ax - 6.5}" cy="{ay - 13}" r="1.6" fill="{IVORY}" stroke-width=".9"/>')
tools['quay-non'] = t

# 5. khâu nón: kim + sợi cước khâu lá vào từng vòng, từ chóp xuống vành; các vòng trên đã khâu xong
ax, ay, by_, rx_, ry_ = 76, 62, 116, 70, 18
hp = poly([(ax, ay)] + arc_pts(ax, by_, rx_, ry_, 0, 180, 60), True)
t = [f'<defs><clipPath id="kn"><path d="{hp}"/></clipPath></defs>', f'<path d="{hp}" fill="{IVORY}" stroke="none"/>', '<g clip-path="url(#kn)">']
for a in range(0, 181, 6):
    x, y = ax + rx_ * math.cos(math.radians(a)), by_ + ry_ * math.sin(math.radians(a))
    t.append(f'<path d="M{ax} {ay} L {f(x)} {f(y)}" stroke-width=".4" opacity=".4"/>')
for i in range(1, 8):
    k = i / 8
    cy_, rr, ry2 = ay + (by_ - ay) * k, rx_ * k, ry_ * k
    t.append(f'<path d="{poly(arc_pts(ax, cy_, rr, ry2, 0, 180, 30))}" stroke-width=".8"/>')
    done = 180 if i < 5 else (100 if i == 5 else -1)  # vòng 5 đang khâu dở
    for a in range(180, 0, -12 if i > 2 else -24):
        if a < 180 - done:
            continue
        x, y = ax + rr * math.cos(math.radians(a)), cy_ + ry2 * math.sin(math.radians(a))
        t.append(f'<path d="M{f(x)} {f(y - 2.2)} L {f(x)} {f(y + 2.2)}" stroke="{TEAL}" stroke-width="1"/>')
t.append('</g>')
t.append(f'<path d="{hp}"/><path d="{poly(arc_pts(ax, by_ + 2.5, rx_ * 0.985, ry_ * 0.95, 4, 176, 40))}" stroke-width=".8" opacity=".6"/>')
t.append(f'<circle cx="{ax}" cy="{ay + 1}" r="2.8" fill="{IVORY}" stroke-width="1"/>')
kx, ky = ax + 70 * 5 / 8 * math.cos(math.radians(80)), ay + (by_ - ay) * 5 / 8 + 18 * 5 / 8 * math.sin(math.radians(80))
t.append(f'<path d="M{f(kx)} {f(ky)} L 138 30" stroke-width="1.8"/><ellipse cx="136" cy="32" rx="1.6" ry="3.6" transform="rotate(37 136 32)" stroke-width="1"/>')
t.append(f'<path d="M136 32 C 152 46, 150 70, 132 74 C 116 78, 104 92, {f(kx + 4)} {f(ky + 2)}" stroke="{TEAL}" stroke-width="1.1"/>')
tools['khau-non'] = t

# 6. nức nón: cắt lá thừa sát vòng cạp rồi khâu bọc (nức) quanh vành cho chắc — mũi nức quấn chéo dọc vành trước
ax, ay, by_, rx_, ry_ = 76, 54, 100, 68, 18
t = [non(ax, ay - 20, rx_, 66, strap=False, rings=6, ribs=True)]
for i in range(1, 20):
    a = 180 - i * 9
    x, y = ax + rx_ * math.cos(math.radians(a)), by_ + ry_ * math.sin(math.radians(a))
    if 30 < a < 170:
        t.append(f'<path d="M{f(x - 2)} {f(y - 3)} L {f(x + 2)} {f(y + 5)}" stroke="{TEAL}" stroke-width="1.2"/>')
ex, ey = ax + rx_ * math.cos(math.radians(30)), by_ + ry_ * math.sin(math.radians(30))
t.append(f'<path d="M{f(ex)} {f(ey + 2)} L {f(ex + 18)} {f(ey - 34)}" stroke-width="1.6"/><ellipse cx="{f(ex + 17)}" cy="{f(ey - 32)}" rx="1.4" ry="3.2" transform="rotate(26 {f(ex + 17)} {f(ey - 32)})" stroke-width=".9"/>')
t.append(f'<path d="M{f(ex + 17)} {f(ey - 32)} C {f(ex + 30)} {f(ey - 20)}, {f(ex + 26)} {f(ey + 6)}, {f(ex + 6)} {f(ey + 6)}" stroke="{TEAL}" stroke-width="1"/>')
# kéo + mẩu lá thừa đã cắt
t.append(f'<g transform="translate(22 132) rotate(-10)"><circle cx="0" cy="0" r="6"/><circle cx="0" cy="16" r="6"/>'
         f'<path d="M5 3 L 40 14 M5 13 L 40 2" stroke-width="1.6"/><circle cx="17" cy="8" r="1.4" fill="{INK}"/></g>')
t.append(f'<path d="M84 138 l 10 -2 M100 144 l 9 1 M118 138 l 8 -3" stroke-width="1" opacity=".7"/>')
tools['nuc-non'] = t

# 7. luồn nhôi: nhìn vào lòng nón từ dưới lên — chỉ màu (xanh, đỏ, trắng) đan thành hai mảng nhôi ở hai bên thành nón, buộc quai
cx_, cy_, rx_, ry_ = 80, 70, 66, 40
apx, apy = 80, 46  # chóp nón (đáy lòng nón) nằm lệch lên trên
t = [f'<ellipse cx="{cx_}" cy="{cy_}" rx="{rx_}" ry="{ry_}" fill="{IVORY}" stroke-width="1.8"/>',
     f'<ellipse cx="{cx_}" cy="{cy_ + 2}" rx="{rx_ - 3}" ry="{ry_ - 3}" stroke-width=".7" opacity=".6"/>']
for i in range(1, 8):
    k = i / 8
    t.append(f'<ellipse cx="{f(apx + (cx_ - apx) * k)}" cy="{f(apy + (cy_ - apy) * k)}" rx="{f(rx_ * k)}" ry="{f(ry_ * k)}" stroke-width=".6" opacity=".45"/>')
for a in range(0, 360, 20):
    x, y = cx_ + rx_ * math.cos(math.radians(a)), cy_ + ry_ * math.sin(math.radians(a))
    t.append(f'<path d="M{apx} {apy} L {f(x)} {f(y)}" stroke-width=".4" opacity=".35"/>')
t.append(f'<circle cx="{apx}" cy="{apy}" r="2.2" fill="{INK}" stroke="none" opacity=".6"/>')


def nhoi(x, y, ang):
    g = [f'<g transform="translate({f(x)} {f(y)}) rotate({ang})">', f'<rect x="-6" y="-9" width="12" height="18" rx="1.5" fill="{IVORY}" stroke-width=".9"/>']
    for j, col in enumerate((RED, TEAL, RED, '#ffffff', TEAL)):
        g.append(f'<path d="M-4.5 {-6.5 + j * 3.2:.1f} h9" stroke="{col}" stroke-width="1.8"/>')
    g.append('</g>')
    return ''.join(g)


lx, ly = cx_ - rx_ * 0.62, cy_ + 2
rx2, ry2 = cx_ + rx_ * 0.62, cy_ + 2
t.append(nhoi(lx, ly, 14) + nhoi(rx2, ry2, -14))
t.append(f'<path d="M{f(lx)} {f(ly + 8)} C {f(lx + 4)} 150, {f(rx2 - 4)} 150, {f(rx2)} {f(ry2 + 8)}" stroke="{RED}" stroke-width="2"/>')
t.append(f'<path d="M{f(lx + 4)} {f(ly + 9)} C {f(lx + 8)} 144, {f(rx2 - 8)} 144, {f(rx2 - 4)} {f(ry2 + 9)}" stroke="{RED}" stroke-width=".8" opacity=".6"/>')
tools['luon-nhoi'] = t

# 8. quang dầu: chổi lông quét dầu bóng từ chóp toả xuống vành; phần đã quét bóng lên; phơi nắng nhẹ
t = [non(70, 40, 60, 74, strap=False, rings=6, ribs=True)]
# vệt bóng trên phần đã quét (bên phải)
for k in (0.45, 0.62, 0.8):
    t.append(f'<path d="{poly(arc_pts(70, 75 + 39 * k + 0.0, 60 * k, 15.6 * k, 20, 70, 12))}" stroke="#fffaf0" stroke-width="2.4" opacity=".95"/>')
t.append(f'<path d="M80 96 L 88 88 L 96 96 L 88 104 Z" fill="#d9b77a" stroke-width="1"/>')
t.append(f'<path d="M92 92 L 132 52" stroke="{WOOD}" stroke-width="4"/><path d="M88 88 L 96 96" stroke-width="2.2"/>')
t.append(f'<circle cx="28" cy="28" r="9"/><path d="M28 12 v6 M28 38 v6 M12 28 h6 M38 28 h6 M17 17 l4 4 M35 35 l4 4 M39 17 l-4 4 M17 39 l4 -4" stroke-width=".9"/>')
tools['quang-dau'] = t

for k, v in tools.items():
    svg('tool-' + k, (160, 160), '\n'.join(v), sw=1.4)

print('ok', len(os.listdir(OUT)))
