#!/usr/bin/env python3
"""
Ảnh bìa (góp ý 04/11, Minh Ánh — tab "Góp ý sửa (1)": ảnh minh họa bìa + "Chỉ có nón ( Cái nón.jpg ), thêm một số họa tiết
trang trí / Chỉ để một thứ tiếng thôi"). Anh Hải 05/11: ảnh mẫu sáng màu, nón xếp lớp lớp lên nhau; bìa trước tối, bẩn.
→ ảnh nền tràn bìa tông sáng, xếp lớp có chiều sâu: nón xa nhoè phía sau, chiếc nón chính rõ nét, nón gần nhoè tràn mép;
mọi chiếc nón đều từ ảnh "Cái nón.jpg" của nhóm (tách nền), lật / xoay / co giãn cho khác nhau. Lá xanh nhạt xoá phông ở mép.
Chữ, họa tiết nét vàng, dấu son, logo là phần tử của trang (build.mjs) để đúng từng thứ tiếng.

  python3.12 scripts/book/cover.py  →  public/assets/book/cover/bia.webp (1190 × 1684, gấp đôi khổ trang 595 × 842)
"""
import os
import random

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'out', 'new-photos', 'cut', 'cai-non.png')  # "Cái nón.jpg" của nhóm, tách nền (lift.swift)
OUT = os.path.join(HERE, '..', '..', 'public', 'assets', 'book', 'cover', 'bia.webp')
W, H = 1190, 1684
random.seed(11)


def vgrad(w, h, top, bottom):
    g = Image.linear_gradient('L').resize((w, h))
    return Image.composite(Image.new('RGB', (w, h), bottom), Image.new('RGB', (w, h), top), g)


# ── nón gốc: sáng, trắng ngà hơn (như nón trắng trong ảnh mẫu), giữ vân lá
base = Image.open(SRC).convert('RGBA')
rgb = base.convert('RGB')
rgb = ImageEnhance.Brightness(rgb).enhance(1.24)
rgb = ImageEnhance.Color(rgb).enhance(0.66)
rgb = ImageEnhance.Contrast(rgb).enhance(1.04)
r, g, b = rgb.split()
r = r.point(lambda v: min(255, int(v * 1.03 + 6)))
g = g.point(lambda v: min(255, int(v + 4)))
b = b.point(lambda v: min(255, int(v * 0.95 + 2)))
HAT = Image.merge('RGBA', (r, g, b, base.split()[3]))


def hat(width, flip=False, rot=0, blur=0, haze=0.0):
    """một chiếc nón: rộng width px, lật / xoay, nhoè (độ sâu trường ảnh), sương (xa thì nhạt dần về màu nền)"""
    h = HAT.resize((width, round(HAT.height * width / HAT.width)), Image.LANCZOS)
    if flip:
        h = ImageOps.mirror(h)
    if rot:
        h = h.rotate(rot, resample=Image.BICUBIC, expand=True)
    if haze:
        a = h.split()[3]
        h = Image.blend(h, Image.new('RGBA', h.size, (250, 246, 236, 255)), haze)
        h.putalpha(a)
    pad = blur * 3
    if blur:
        # lót màu nón vào phần trong suốt trước khi nhoè (không thì màu đen của điểm trong suốt lem thành viền tối)
        c = Image.new('RGBA', (h.width + pad * 2, h.height + pad * 2), (228, 220, 200, 0))
        c.paste(h, (pad, pad), h)
        h = c.filter(ImageFilter.GaussianBlur(blur))
    return h, pad


def put(canvas, h_pad, x, y):
    h, pad = h_pad
    canvas.alpha_composite(h, (int(x - pad), int(y - pad)))


# ── 1. nền: trắng kem sáng, dưới ấm hơn một chút
bg = vgrad(W, H, (252, 249, 242), (240, 232, 216)).convert('RGBA')

# ── 2. lá xanh nhạt xoá phông ở mép phải / trên-phải và dưới-trái; đốm nắng trắng
greens = [(186, 204, 160), (168, 190, 140), (204, 216, 180), (150, 176, 124)]
lay = Image.new('RGBA', (W, H), (0, 0, 0, 0))
for _ in range(34):
    zone = random.random()
    if zone < 0.6:
        x, y = random.uniform(820, W + 80), random.uniform(-60, 720)
    elif zone < 0.85:
        x, y = random.uniform(-80, 220), random.uniform(820, 1300)
    else:
        x, y = random.uniform(540, 900), random.uniform(-60, 160)
    rr = random.uniform(40, 120)
    leaf = Image.new('RGBA', (int(rr * 2.6), int(rr * 2.6)), (0, 0, 0, 0))
    ImageDraw.Draw(leaf).ellipse((rr * 0.3, rr * 0.85, rr * 2.3, rr * 1.75), fill=random.choice(greens) + (int(random.uniform(90, 170)),))
    leaf = leaf.rotate(random.uniform(0, 180), resample=Image.BICUBIC)
    lay.alpha_composite(leaf, (int(x - rr * 1.3), int(y - rr * 1.3)))
lay = lay.filter(ImageFilter.GaussianBlur(22))
sun = Image.new('RGBA', (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(sun)
for _ in range(40):
    x, y, rr = random.uniform(600, W), random.uniform(-20, 900), random.uniform(8, 34)
    sd.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(255, 255, 250, int(random.uniform(60, 130))))
lay.alpha_composite(sun.filter(ImageFilter.GaussianBlur(24)))
bg.alpha_composite(lay)

# ── 3. lớp xa: nón nhoè, nhạt như sương, xếp chồng phía sau bên phải và sau chiếc nón chính
FAR = [  # (rộng, x, y, lật, xoay, nhoè, sương) — cụm nón chồng lên nhau sau chiếc nón chính (xa → gần)
    (420, 760, 300, True, -6, 10, 0.42),
    (380, 980, 430, False, 8, 10, 0.44),
    (500, 640, 470, False, -3, 8, 0.28),
    (460, 900, 640, True, 5, 7, 0.22),
    (420, 40, 640, False, 4, 9, 0.45),
    (360, -150, 820, True, -6, 10, 0.5),
]
for w, x, y, fl, rot, bl, hz in FAR:
    put(bg, hat(w, fl, rot, bl, hz), x, y)
bg = Image.blend(bg, Image.new('RGBA', (W, H), (252, 249, 242, 255)), 0.12)  # sương mỏng tách lớp xa với nón chính

# ── 4. chiếc nón chính: rõ nét, giữa-dưới, bóng mềm nhạt (tông sáng)
MAIN_W = 860
mh, _ = hat(MAIN_W)
MX = (W - MAIN_W) // 2 + 30
MB = 1420
MY = MB - mh.height
a = mh.split()[3]
base_bg = bg.copy()  # nền chưa có nón chính (lớp nền của bìa nổi)
flat = a.resize((int(MAIN_W * 1.02), int(mh.height * 0.26)))
soft = Image.new('L', (W, H), 0)
soft.paste(flat, (MX + 50, MB - flat.height + 24))
soft = soft.filter(ImageFilter.GaussianBlur(30)).point(lambda v: int(v * 0.36))
bg = Image.composite(Image.new('RGBA', (W, H), (120, 98, 70, 255)), bg, soft)
contact = Image.new('L', (W, H), 0)
contact.paste(a, (MX + 5, MY + 8))
contact = contact.filter(ImageFilter.GaussianBlur(7)).point(lambda v: int(v * 0.42))
bg = Image.composite(Image.new('RGBA', (W, H), (110, 86, 58, 255)), bg, contact)
bg.alpha_composite(mh, (MX, MY))

# ── 5. lớp gần: nón to, nhoè mạnh, tràn mép dưới-trái và trên-phải
FM = 160  # lớp trước vẽ tràn ra ngoài khổ bìa: khi trôi theo con trỏ không lộ mép cắt
front = Image.new('RGBA', (W + FM * 2, H + FM * 2), (0, 0, 0, 0))
put(front, hat(640, True, 12, 16, 0.1), -300 + FM, 1330 + FM)
put(front, hat(520, False, -18, 15, 0.14), 900 + FM, 1380 + FM)
bg.alpha_composite(front.crop((FM, FM, FM + W, FM + H)))


def finish(im):
    """6. vùng sáng sau tên sách (trên-trái); 7. gáy sách nhẹ + hạt ảnh rất mịn"""
    glow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(glow).ellipse((-320, -300, 900, 640), fill=200)
    glow = glow.filter(ImageFilter.GaussianBlur(110))
    im = Image.composite(Image.new('RGBA', (W, H), (253, 251, 246, 255)), im, glow)
    sp = Image.new('L', (W, H), 0)
    spd = ImageDraw.Draw(sp)
    for x in range(0, 26):
        spd.line((x, 0, x, H), fill=int(70 * (1 - x / 26) ** 2))
    im = Image.composite(Image.new('RGBA', (W, H), (120, 100, 76, 255)), im, sp)
    hl = Image.new('L', (W, H), 0)
    ImageDraw.Draw(hl).line((30, 0, 30, H), fill=140, width=2)
    im = Image.composite(Image.new('RGBA', (W, H), (255, 255, 255, 255)), im, hl.filter(ImageFilter.GaussianBlur(1.5)))
    random.seed(5)
    noise = Image.effect_noise((W, H), 14)
    return Image.composite(Image.new('RGBA', (W, H), (255, 255, 255, 255)), im, noise.point(lambda v: int(max(0, v - 128) * 0.08)))


bg = finish(bg)
os.makedirs(os.path.dirname(OUT), exist_ok=True)
bg.convert('RGB').save(OUT, 'WEBP', quality=88, method=6)
print(OUT, os.path.getsize(OUT) // 1024, 'KB')

# ── bìa nổi (trang đọc thật): ba lớp riêng để mỗi lớp trôi theo con trỏ một độ sâu — nền (không có nón chính, không bóng:
# bóng do CSS đổ theo hình nón), chiếc nón chính, cụm nón nhoè phía trước. Toạ độ ghi ra JSON theo điểm của trang (÷ 2).
import json
D = os.path.dirname(OUT)
finish(base_bg).convert('RGB').save(os.path.join(D, 'bia-nen.webp'), 'WEBP', quality=88, method=6)
bb = mh.getbbox()
mh.crop(bb).save(os.path.join(D, 'bia-non.webp'), 'WEBP', quality=90, method=6)
fb = front.getbbox()
front.crop(fb).save(os.path.join(D, 'bia-truoc.webp'), 'WEBP', quality=86, method=6)
lay = {
    'non': [round((MX + bb[0]) / 2, 1), round((MY + bb[1]) / 2, 1), round((bb[2] - bb[0]) / 2, 1), round((bb[3] - bb[1]) / 2, 1)],
    'truoc': [round((fb[0] - FM) / 2, 1), round((fb[1] - FM) / 2, 1), round((fb[2] - fb[0]) / 2, 1), round((fb[3] - fb[1]) / 2, 1)],
}
json.dump(lay, open(os.path.join(HERE, 'cover-layers.json'), 'w'))
print(lay)
