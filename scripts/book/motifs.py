"""Bộ họa tiết lấp trang nét mảnh (anh Hải 08/11: "spam lắm hoạ tiết trùng nhau quá, sáng tạo cho t 7-10 mẫu hoạ tiết dùng
đan xen đi"). Cùng nét với flora.py (ô liu nâu mảnh, tô màu giấy để nét phía sau bị che), toàn vật thật của làng Chuông.
python3 -I scripts/book/motifs.py  → public/assets/book/deco/m-*.svg
Luật vẽ (anh Hải: "vẽ ẩu, nét lòi"): nét không đâm qua viền; vật phía sau vẽ trước, vật phía trước tô màu giấy che lên;
không để nét cụt ở mép hình (đặt trên mặt đất / mặt nước / để lơ lửng trọn vẹn).
"""
import math, os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'book', 'deco')
INK = '#8b8460'
PAPER = '#f8f2e6'
f = lambda v: f'{v:.1f}'.rstrip('0').rstrip('.')


def svg(name, vb, body, sw=1.1):
    w, h = vb
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" fill="none" stroke="{INK}" '
         f'stroke-width="{sw}" stroke-linecap="round" stroke-linejoin="round">\n' + '\n'.join(body) + '\n</svg>\n')
    with open(os.path.join(OUT, name + '.svg'), 'w') as fh:
        fh.write(s)


def P(d, sw=None, fill=None, op=None):
    a = f' stroke-width="{sw}"' if sw else ''
    a += f' fill="{fill}"' if fill else ''
    a += f' opacity="{op}"' if op else ''
    return f'<path d="{d}"{a}/>'


def unit(ang):
    a = math.radians(ang)
    return math.cos(a), math.sin(a)


def blade(x, y, ang, L, W, rib=True, fill=PAPER, sw=None):
    """lá thuôn hai đầu từ gốc (x, y) theo hướng ang (độ): lá tre, lá lụi, lá cỏ"""
    dx, dy = unit(ang)
    nx, ny = -dy, dx
    c = lambda t, s: (x + dx * L * t + nx * W * s, y + dy * L * t + ny * W * s)
    a1, a2, b1, b2 = c(0.3, 1.0), c(0.72, 0.7), c(0.72, -0.7), c(0.3, -1.0)
    tx, ty = x + dx * L, y + dy * L
    out = [P(f'M{f(x)} {f(y)} C {f(a1[0])} {f(a1[1])}, {f(a2[0])} {f(a2[1])}, {f(tx)} {f(ty)} '
             f'C {f(b1[0])} {f(b1[1])}, {f(b2[0])} {f(b2[1])}, {f(x)} {f(y)} Z', sw=sw, fill=fill)]
    if rib:
        s, e = c(0.08, 0), c(0.86, 0)
        out.append(P(f'M{f(s[0])} {f(s[1])} L {f(e[0])} {f(e[1])}', sw=0.55, op='.7'))
    return out


def arc(cx, cy, rx, ry, a0, a1, n=36):
    pts = [(cx + rx * math.cos(math.radians(a0 + (a1 - a0) * i / n)), cy + ry * math.sin(math.radians(a0 + (a1 - a0) * i / n))) for i in range(n + 1)]
    return 'M' + ' L'.join(f'{f(x)} {f(y)}' for x, y in pts)


def wave(x0, x1, y, amp=1.3, period=16, sw=0.75, op=None):
    n = max(2, round((x1 - x0) / (period / 2)))
    st = (x1 - x0) / n
    d = [f'M{f(x0)} {f(y)}'] + [f'Q {f(x0 + k * st + st / 2)} {f(y + (-amp if k % 2 == 0 else amp))} {f(x0 + (k + 1) * st)} {f(y)}' for k in range(n)]
    return P(' '.join(d), sw=sw, op=op)


def ground(x0, x1, y, op='.6'):
    """đường đất: một nét mảnh hơi lượn + hai nét ngắn nhạt"""
    return [P(f'M{f(x0)} {f(y)} C {f(x0 + (x1 - x0) * 0.3)} {f(y - 2)}, {f(x0 + (x1 - x0) * 0.7)} {f(y + 2)}, {f(x1)} {f(y)}', sw=0.8, op=op),
            P(f'M{f(x0 + 18)} {f(y + 6)} L {f(x0 + 46)} {f(y + 6)} M{f(x1 - 60)} {f(y + 6)} L {f(x1 - 26)} {f(y + 6)}', sw=0.6, op='.45')]


def cone(cx, apex, rim, rx, ry, rings=(0.38, 0.62, 0.82), ribs=7, fill=PAPER):
    """nón nhìn ngang hơi chếch: mặt nón (tô giấy), vành trước, vài vòng nứa + sống lá"""
    out = [P(f'M{f(cx)} {f(apex)} L {f(cx - rx)} {f(rim)} A {f(rx)} {f(ry)} 0 0 0 {f(cx + rx)} {f(rim)} Z', fill=fill)]
    for t in rings:
        yy = apex + (rim - apex) * t
        r = rx * t
        out.append(P(arc(cx, yy, r, ry * t, 10, 170), sw=0.55, op='.7'))
    for k in range(1, ribs):
        a = 180 - 180 * k / ribs
        ex, ey = cx + rx * math.cos(math.radians(a)) * 0.98, rim + ry * math.sin(math.radians(a)) * 0.98
        out.append(P(f'M{f(cx)} {f(apex + 4)} L {f(ex)} {f(ey)}', sw=0.45, op='.55'))
    return out


SON = '#b4533a'  # quai lụa (điểm son duy nhất)
PINK = '#f0d3c6'
LEAF = '#dfe6cc'


def hat(cx, by, rx, ry, h=None, rings=(0.3, 0.5, 0.68, 0.84), ribs=9):
    """nón Chuông đặt ngửa mặt lên trời (chóp trên), nhìn chếch từ trên: thành thẳng, cao 0,66 bán kính vành;
    nửa sau vành thấy được hai bên thân nón (vẽ trước, thân tô giấy che phần giữa); vành trước đôi (cạp); núm chóp tròn"""
    h = h or rx * 0.66
    ap = by - h
    out = [P(arc(cx, by, rx, ry, 180, 360, 48), sw=0.8)]
    out.append(P(f'M{f(cx)} {f(ap)} L {f(cx - rx)} {f(by)} A {f(rx)} {f(ry)} 0 0 0 {f(cx + rx)} {f(by)} Z', fill=PAPER))
    for t in rings:  # vòng nứa hằn qua lá: chỉ nửa trước, nằm trong thân
        out.append(P(arc(cx, ap + h * t, rx * t * 0.97, ry * t, 14, 166, 30), sw=0.5, op='.55'))
    for k in range(1, ribs):  # sống lá chạy từ chóp xuống vành
        a = 180 - 180 * k / ribs
        ex, ey = cx + rx * math.cos(math.radians(a)) * 0.97, by + ry * math.sin(math.radians(a)) * 0.9
        out.append(P(f'M{f(cx)} {f(ap + 5)} L {f(ex)} {f(ey)}', sw=0.4, op='.4'))
    out.append(P(arc(cx, by + 2.2, rx * 0.99, ry * 0.96, 6, 174, 48), sw=0.8, op='.75'))  # cạp vành
    out.append(f'<circle cx="{f(cx)}" cy="{f(ap + 1.5)}" r="2.6" fill="{PAPER}" stroke-width="0.9"/>')
    return out, ap


def strap(x0, x1, y, low, curl):
    """quai lụa buộc trong lòng nón: hai đầu khuất sau thân (vẽ trước thân), võng xuống nằm trên nền, uốn một vòng"""
    d = (f'M{f(x0)} {f(y)} C {f(x0 - 2)} {f(low)}, {f(x0 + 20)} {f(low + 3)}, {f((x0 + x1) / 2 + curl)} {f(low + 2)} '
         f'C {f(x1 + 10)} {f(low + 1)}, {f(x1 + 2)} {f(low - 6)}, {f(x1)} {f(y)}')
    return [f'<path d="{d}" stroke="{SON}" stroke-width="1.15"/>', f'<path d="{d}" stroke="{SON}" stroke-width="2.6" opacity=".18"/>']


# 1. chồng nón trắng ở chợ Chuông: một chiếc trên cùng + mép các chiếc xếp lồng bên dưới
b = []
cx, apex, rim, rx, ry = 120, 22, 92, 96, 11
for k in (3, 2, 1):  # mép các chiếc bên dưới (vẽ trước, chiếc trên che phần sau)
    yy = rim + k * 7
    b.append(P(f'M{f(cx - rx - k * 1.2)} {f(yy - 7)} L {f(cx - rx - k * 1.2)} {f(yy)} A {f(rx + k * 1.2)} {f(ry)} 0 0 0 {f(cx + rx + k * 1.2)} {f(yy)} L {f(cx + rx + k * 1.2)} {f(yy - 7)}', fill=PAPER))
b += cone(cx, apex, rim, rx, ry)
b.append(f'<circle cx="{cx}" cy="{apex + 3}" r="2.4" fill="{PAPER}"/>')  # núm chóp
b += ground(16, 224, rim + 3 * 7 + ry + 6)
svg('m-chong-non', (240, 150), b)

# 2. bó lá lụi buộc lạt, xòe như quạt (lá phơi trên đê sông Đáy trước khi là)
b = []
bx, by = 100, 140
angs = [-150, -136, -122, -108, -94, -80, -66, -52, -38]
order = sorted(range(len(angs)), key=lambda i: -abs(angs[i] + 94))  # lá ngoài vẽ trước, lá giữa đè lên
for i in order:
    a = angs[i]
    L = 112 - abs(a + 94) * 0.35
    b += blade(bx, by - 18, a, L, 6.5)
b.append(P(f'M{bx - 13} {by - 30} Q {bx} {by - 25} {bx + 13} {by - 30} L {bx + 11} {by - 20} Q {bx} {by - 15} {bx - 11} {by - 20} Z', fill=PAPER))  # lạt buộc
b.append(P(f'M{bx - 7} {by - 18} L {bx - 9} {by - 4} M{bx} {by - 17} L {bx} {by - 2} M{bx + 7} {by - 18} L {bx + 9} {by - 4}', sw=0.8))  # cuống lá
b += ground(40, 160, by)
svg('m-bo-la', (200, 160), b)

# 3. mái đình hai tầng, đầu đao cong (đình Chuông — chỉ dáng mái, không chi tiết riêng chưa kiểm)
b = []
def roof(x0, x1, top, eave, lift, tiles=12):
    w = x1 - x0
    out = [P(f'M{f(x0 - 18)} {f(eave - lift)} Q {f(x0 - 6)} {f(eave + 2)} {f(x0 + 12)} {f(eave)} L {f(x1 - 12)} {f(eave)} '
             f'Q {f(x1 + 6)} {f(eave + 2)} {f(x1 + 18)} {f(eave - lift)} Q {f(x1 + 4)} {f(eave - 6)} {f(x1 - 14)} {f(top)} '
             f'L {f(x0 + 14)} {f(top)} Q {f(x0 - 4)} {f(eave - 6)} {f(x0 - 18)} {f(eave - lift)} Z', fill=PAPER)]
    for k in range(1, tiles):
        xx = x0 + 14 + (w - 28) * k / tiles
        out.append(P(f'M{f(xx)} {f(top + 3)} L {f(xx + (xx - (x0 + x1) / 2) * 0.06)} {f(eave - 2)}', sw=0.5, op='.6'))
    out.append(P(f'M{f(x0 + 14)} {f(top)} L {f(x1 - 14)} {f(top)}', sw=1.4))  # bờ nóc
    return out
b += [P('M70 86 L70 112 M110 86 L110 112 M150 86 L150 112 M190 86 L190 112', sw=0.9)]  # cột
b += [P('M60 112 L200 112', sw=0.9)]  # bậc
b += roof(46, 214, 60, 86, 14, tiles=14)
b += [P('M96 42 L96 58 M164 42 L164 58', sw=0.8)]  # cột tầng trên (sau mái dưới)
b += roof(82, 178, 22, 44, 11, tiles=8)
b.append(P('M96 22 q -6 -8 -12 -4 M164 22 q 6 -8 12 -4', sw=0.9))  # đầu kìm cuộn ở hai đầu bờ nóc
b.append(P('M130 22 L130 14 M126 16 L134 16', sw=0.8, op='.8'))  # hồ lô giữa nóc
b += ground(34, 226, 118)
svg('m-mai-dinh', (260, 130), b)

# 4. kim khâu nón + cuộn cước (sợi cước thay sợi móc từ đầu những năm 80)
b = []
sx, sy, sr = 58, 46, 26
b.append(P(f'M{sx - sr} {sy} L {sx - sr} {sy + 52} A {sr} 8 0 0 0 {sx + sr} {sy + 52} L {sx + sr} {sy} Z', fill=PAPER))  # thân cuộn
for k in range(1, 7):
    yy = sy + 7 * k
    b.append(P(arc(sx, yy, sr, 8, 12, 168, 24), sw=0.5, op='.65'))
b.append(f'<ellipse cx="{sx}" cy="{sy}" rx="{sr}" ry="8" fill="{PAPER}"/>')
b.append(f'<ellipse cx="{sx}" cy="{sy}" rx="5" ry="1.8"/>')
# kim nằm chéo; sợi cước từ cuộn võng xuống dưới thân kim rồi vòng lên xỏ lỗ kim từ phía dưới bên phải
ex, ey = 183, 47
b.append(P(f'M{sx + sr} {sy + 30} C 104 112, 150 128, 168 100 C 176 86, 180 64, {ex} {ey + 2}', sw=0.85))
b.append(P(f'M148 100 L {ex - 3} {ey + 4}', sw=1.6))  # gốc kim nằm trên chỗ sợi võng (không cắt nhau)
b.append(f'<ellipse cx="{ex}" cy="{ey}" rx="4.4" ry="2" transform="rotate(-48 {ex} {ey})" fill="{PAPER}"/>')
b.append(P(f'M{ex + 1} {ey - 1} C {ex + 6} {ey - 8}, {ex + 12} {ey - 4}, {ex + 12} {ey + 6}', sw=0.85))  # đuôi sợi qua lỗ kim
b += ground(24, 176, 132)
svg('m-kim-chi', (200, 142), b)

# 5. cành tre (lũy tre Bắc Bộ): đoạn cành có đốt, chùm lá rủ ở từng đốt, hai đầu cành giấu trong chùm lá
b = []
stem = [(40, 112), (84, 92), (132, 62), (182, 34)]
(x0, y0), (x1, y1), (x2, y2), (x3, y3) = stem
bez = lambda t: ((1 - t) ** 3 * x0 + 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3 * x3,
                 (1 - t) ** 3 * y0 + 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3 * y3)
b.append(P(f'M{x0} {y0} C {x1} {y1}, {x2} {y2}, {x3} {y3}', sw=1.5))
for t in (0.36, 0.7):
    px, py = bez(t)
    b.append(P(f'M{f(px - 3.5)} {f(py - 4.5)} L {f(px + 3.5)} {f(py + 4.5)}', sw=1.1))  # đốt tre
CL = [(0.0, ((150, 44), (176, 40), (124, 36))),      # gốc cành: chùm lá che đầu cắt
      (0.36, ((112, 50), (140, 46), (88, 38))),
      (0.7, ((104, 48), (132, 44), (80, 36))),
      (1.0, ((-26, 42), (6, 38), (-56, 32), (36, 30)))]  # ngọn: lá chĩa theo hướng cành, che đầu ngọn
for t, leaves in CL:
    px, py = bez(t)
    for ang, L in leaves:
        b += blade(px, py, ang, L, 5)
svg('m-canh-tre', (220, 160), b)

# 6. nón Chuông đặt trên nền, quai lụa buông võng trước vành; sau lưng một bó lá lụi phơi (thay "nón ngửa": anh Hải 08/11
# "hoạ tiết cái nón trông xấu vl, làm lại hoặc làm cái khác")
b = ground(12, 198, 107)  # đất vẽ trước: nón + quai đè lên
for a, L in ((-128, 58), (-116, 66), (-104, 70), (-92, 66), (-80, 58)):  # bó lá dựng sau nón, gốc khuất sau thân
    b += blade(52, 102, a, L, 5.5)
b.append(P('M40 70 Q 46 73 54 71 L 54 77 Q 46 79 40 76 Z', fill=PAPER, sw=0.9))  # lạt buộc
b += strap(98, 146, 98, 110, 6)
g, _ = hat(122, 90, 66, 14.5)
b += g
svg('m-non-ngua', (210, 116), b)

# 7. chuồn chuồn đậu ngọn cỏ ao làng (cả con nằm trọn trong hình, không chạm mép)
b = []
b += [wave(30, 130, 150, sw=0.8), wave(46, 114, 156, amp=1, sw=0.65, op='.6')]
for x, top, l in ((56, 76, 8), (70, 98, -10), (86, 112, 14), (100, 124, 22)):
    b.append(P(f'M{x} 150 Q {f(x + l * 0.3)} {f(150 - (150 - top) * 0.6)} {f(x + l)} {f(top)}', sw=0.9))
b += blade(70, 128, -124, 30, 4, rib=False)
# chuồn chuồn đậu ngọn cỏ cao nhất (64, 76): đầu bên trái, thân chĩa sang phải hơi chúc xuống
hx, hy = 62, 70
body_ang = 8
dx, dy = unit(body_ang)
for wa, L, W in ((body_ang - 74, 46, 7.5), (body_ang - 104, 42, 7), (body_ang + 74, 44, 7.5), (body_ang + 104, 38, 6.5)):
    b += blade(hx + dx * 9, hy + dy * 9, wa, L, W, rib=True)
tail = (hx + dx * 100, hy + dy * 100)
b.append(P(f'M{f(hx + dx * 6)} {f(hy + dy * 6)} L {f(tail[0])} {f(tail[1])}', sw=2.2))
for k in range(1, 8):
    px, py = hx + dx * (18 + k * 10), hy + dy * (18 + k * 10)
    b.append(P(f'M{f(px - dy * 2)} {f(py + dx * 2)} L {f(px + dy * 2)} {f(py - dx * 2)}', sw=0.6, op='.7'))
b.append(f'<circle cx="{f(hx)}" cy="{f(hy)}" r="4.4" fill="{PAPER}"/>')
svg('m-chuon-chuon', (200, 166), b)

# 8. lá tre rơi (góc trang, rất nhẹ)
b = []
for x, y, a, L in ((30, 40, 20, 42), (86, 22, 152, 36), (120, 70, 64, 40), (62, 92, -18, 30), (168, 48, 118, 34)):
    b += blade(x, y, a, L, 5)
for x, y in ((150, 96), (100, 104), (40, 72)):
    b.append(f'<circle cx="{x}" cy="{y}" r="0.9" fill="{INK}" stroke="none" opacity=".6"/>')
svg('m-la-tre', (200, 120), b)

# 9. nón vẽ (mục "Đổi mới sản phẩm": nón vẽ, nón lụa, du khách trải nghiệm vẽ nón): trên thân nón một cành sen vừa vẽ,
# cạnh đó đĩa màu + cây bút gác lên đĩa (thay "bó vành nứa": anh Hải 08/11 chê hình nón xấu)
b = ground(12, 198, 121)  # đất vẽ trước: nón, quai, đĩa màu đè lên
b += strap(58, 112, 108, 123, -4)
g, ap = hat(86, 102, 70, 16)
b += g
# cành sen vẽ trên mặt trước, lệch trái (nằm gọn trong thân nón): lá sen, nụ, hoa
b.append(P('M66 100 C 66 94, 68 88, 72 84', sw=0.6))
b.append(P('M72 98 C 75 95, 80 94, 84 96', sw=0.6))
b.append(P('M84 96 C 88 90, 98 90, 101 95 C 97 99, 89 100, 84 96 Z', fill=LEAF, sw=0.6))  # lá sen
b.append(P('M88 95.5 L 99 94.5', sw=0.4, op='.7'))
for a, L, W in ((-140, 10, 3.2), (-40, 10, 3.2), (-115, 12, 3.6), (-65, 12, 3.6), (-90, 13, 3.8)):
    b += blade(72, 84, a, L, W, rib=False, fill=PINK, sw=0.6)
b.append(P('M60 99 C 59 95, 58 92, 58 89', sw=0.55))
b += blade(58, 89, -96, 8, 2.6, rib=False, fill=PINK, sw=0.55)  # nụ
# đĩa màu + bút lông gác chéo
b.append(f'<ellipse cx="174" cy="115" rx="17" ry="4.8" fill="{PAPER}"/>')
b.append(f'<ellipse cx="174" cy="114.4" rx="11" ry="2.6" stroke-width="0.6" opacity=".7"/>')
b.append(f'<ellipse cx="170" cy="114.3" rx="3.4" ry="1.3" fill="{PINK}" stroke="none"/>')
b.append(f'<ellipse cx="178.5" cy="114.6" rx="2.8" ry="1.1" fill="{LEAF}" stroke="none"/>')
b.append(P('M180 111 L 196 85', sw=1.2))  # cán tre
b.append(P('M178.6 113.2 L 181.6 108.4', sw=2.6, op='.9'))  # khâu bút
b += blade(178.6, 113.2, 122, 6.5, 1.8, rib=False, fill=PINK, sw=0.6)  # ngòi lông chấm màu
svg('m-vong-nua', (210, 132), b)
print('ok')
