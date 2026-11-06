#!/usr/bin/env python3
"""
Bóng nắng xuyên lũy tre (anh Hải 05/11: "sáng tạo hơn, hiệu ứng nhiều hơn, phá vỡ không gian 2D"; skill văn hoá: "cho nắng
xuyên qua tre"). Bóng một cành tre Bắc Bộ — lá thuôn dài mọc thành chùm 3–5 lá ở đốt — nhoè như bóng đổ từ xa, nền trong
suốt. Trang đọc thật phủ lên giấy (multiply) và lay chậm như có gió.

  python3.12 scripts/book/dapple.py  →  public/assets/book/fx/bong-tre.webp (1100 × 1300, nền trong suốt)
"""
import math
import os
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'public', 'assets', 'book', 'fx', 'bong-tre.webp')
W, H = 1100, 1300
S = 2  # vẽ gấp đôi rồi thu nhỏ cho mép mịn
random.seed(7)

im = Image.new('L', (W * S, H * S), 0)
d = ImageDraw.Draw(im)


def leaf(x, y, ang, ln, wd, a):
    """lá tre: thuôn dài, nhọn hai đầu, hơi cong"""
    pts = []
    bend = random.uniform(-0.18, 0.18)
    for i in range(21):
        t = i / 20
        w = wd * math.sin(math.pi * t) ** 0.8
        cx = x + math.cos(ang) * ln * t + math.cos(ang + math.pi / 2) * ln * bend * t * t
        cy = y + math.sin(ang) * ln * t + math.sin(ang + math.pi / 2) * ln * bend * t * t
        pts.append((cx + math.cos(ang + math.pi / 2) * w, cy + math.sin(ang + math.pi / 2) * w))
    for i in range(20, -1, -1):
        t = i / 20
        w = wd * math.sin(math.pi * t) ** 0.8
        cx = x + math.cos(ang) * ln * t + math.cos(ang + math.pi / 2) * ln * bend * t * t
        cy = y + math.sin(ang) * ln * t + math.sin(ang + math.pi / 2) * ln * bend * t * t
        pts.append((cx - math.cos(ang + math.pi / 2) * w, cy - math.sin(ang + math.pi / 2) * w))
    d.polygon([(px * S, py * S) for px, py in pts], fill=a)


def branch(x0, y0, ang, length, nodes, a):
    """cành tre: thân mảnh vươn ngang rồi võng xuống; mỗi đốt một nhánh con, đầu nhánh một chùm lá dài, mảnh, rủ xuống
    xoè như ngón tay (lá tre Bắc Bộ), không chĩa lên"""
    x, y = x0, y0
    step = length / nodes
    for k in range(nodes):
        ang += random.uniform(0.03, 0.08)
        nx, ny = x + math.cos(ang) * step, y + math.sin(ang) * step
        d.line((x * S, y * S, nx * S, ny * S), fill=a, width=int(max(2, 6 - k * 0.5) * S))
        x, y = nx, ny
        for side in (-1, 1):
            if random.random() < 0.25:
                continue
            ta = ang + side * random.uniform(0.5, 0.9)
            tl = random.uniform(40, 80)
            tx, ty = x + math.cos(ta) * tl, y + math.sin(ta) * tl
            d.line((x * S, y * S, tx * S, ty * S), fill=a, width=2 * S)
            n = random.randint(4, 6)
            for j in range(n):
                # rủ xuống: góc quanh hướng thẳng đứng xuống, xoè theo hướng nhánh
                la = math.pi / 2 + (ta - ang) * 0.4 + (j - (n - 1) / 2) * random.uniform(0.22, 0.32) + random.uniform(-0.08, 0.08)
                leaf(tx, ty, la, random.uniform(150, 230), random.uniform(8, 11), a)


# ba cành chồng nhau từ góc trên-phải, xa gần khác nhau (nhoè khác nhau)
layers = []
for (x0, y0, ang, ln, nodes, a, blur) in [
    (W + 40, -40, math.pi * 0.95, 1000, 7, 120, 15),
    (W + 20, 60, math.pi * 0.98, 760, 5, 150, 8),
    (W + 10, 300, math.pi * 1.0, 560, 4, 90, 20),
]:
    im = Image.new('L', (W * S, H * S), 0)
    d = ImageDraw.Draw(im)
    branch(x0, y0, ang, ln, nodes, a)
    layers.append(im.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(blur)))

alpha = layers[0]
for l in layers[1:]:
    alpha = ImageChops.lighter(alpha, l)
# đốm nắng: chỗ lá dày bóng đậm, chỗ thưa lốm đốm (nhân với nhiễu mềm)
noise = Image.effect_noise((W // 8, H // 8), 60).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(10))
alpha = Image.composite(alpha, alpha.point(lambda v: int(v * 0.55)), noise.point(lambda v: 255 if v > 118 else 0).filter(ImageFilter.GaussianBlur(14)))
out = Image.merge('RGBA', (Image.new('L', (W, H), 58), Image.new('L', (W, H), 44), Image.new('L', (W, H), 26), alpha))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
out = out.crop((0, 0, W, min(H, out.getbbox()[3] + 10)))
out.save(OUT, 'WEBP', quality=82, method=6)
print(out.size)
print(OUT, os.path.getsize(OUT) // 1024, 'KB')
