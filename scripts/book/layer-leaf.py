#!/usr/bin/env python3
"""
Mặt lá lụi (lớp ngoài + lớp trong) cho mô hình ba lớp mục 2.1.2, vẽ bằng tay thay cho dải cắt từ ảnh thật.
Doc 09/11 "Bản sửa lần 2": "Trang 54: C thấy lớp lá lụi trong đang không giống ngoài cho lắm, em bỏ sợi dây trên ba lớp lá
được không?" — dải cắt từ ảnh (layer-tex.py) mang theo các sợi cước buộc tạm chạy chéo, lặp lật gương thành hình sao / chữ V;
lớp trong và lớp ngoài cùng là lá lụi nhưng hai ảnh khác hẳn nhau. Ở đây: các bẹ lá chạy dọc chóp → vành, gân mảnh, mép
lá đè lên nhau đổ bóng nhẹ, không có sợi dây; lớp trong cùng kiểu, tông ấm hơn một chút. Lớp mo nang giữ ảnh cũ (không có dây).

  python3 scripts/book/layer-leaf.py   →  public/assets/book/fx/lop-{outer,inner}.webp  (rồi chụp lại lop-stack-*: layer-stack.browser.js)
"""
import os
import numpy as np
from PIL import Image, ImageFilter

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'book', 'fx')
TW, TH = 1536, 384


def leaf_tex(base, seed):
    rng = np.random.default_rng(seed)
    img = np.zeros((TH, TW, 3), np.float32)
    shade = np.zeros((TH, TW), np.float32)
    x = 0.0
    xs = []
    while x < TW:
        w = rng.uniform(26, 40)
        xs.append((x, w))
        x += w * rng.uniform(0.72, 0.86)  # bẹ sau đè lên mép bẹ trước
    yy = np.arange(TH)[:, None]
    for (x0, w) in xs:
        tone = np.array(base, np.float32) * rng.uniform(0.93, 1.04)
        xi0, xi1 = int(x0), int(min(TW, x0 + w + 1))
        if xi1 <= xi0:
            continue
        u = (np.arange(xi0, xi1)[None, :] - x0) / w  # 0..1 ngang bẹ
        # bẹ hơi sáng giữa, tối dần hai mép; sáng dần về phía vành (dưới)
        prof = 1 - 0.10 * (2 * u - 1) ** 2
        grad = 0.95 + 0.07 * (yy / TH)
        # gân dọc mảnh
        veins = np.zeros_like(u)
        for k in range(int(rng.integers(5, 9))):
            c = rng.uniform(0.08, 0.92)
            veins += np.exp(-((u - c) * w / 0.7) ** 2) * rng.uniform(0.04, 0.09)
        col = tone[None, None, :] * (prof * grad - veins)[..., None]
        img[:, xi0:xi1] = col
        # bóng mép trái (bẹ này đè lên bẹ trước)
        sx = slice(max(0, xi0 - 3), xi0 + 1)
        shade[:, sx] += 0.10
    # thớ dọc rất mịn
    fib = rng.normal(0, 1, (TH // 8, TW)).astype(np.float32)
    fib = np.array(Image.fromarray(fib).resize((TW, TH), Image.BICUBIC))
    img *= (1 + 0.025 * fib)[..., None]
    img *= (1 - shade)[..., None]
    im = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.5))
    # nối liền hai đầu (mặt nón quấn tròn): trộn 24px đầu / cuối
    a = np.asarray(im).astype(np.float32)
    k = 24
    t = np.linspace(0, 1, k)[None, :, None]
    a[:, -k:] = a[:, -k:] * (1 - t) + a[:, :k] * t
    return Image.fromarray(a.astype(np.uint8))


leaf_tex((236, 226, 200), 7).save(os.path.join(OUT, 'lop-outer.webp'), 'WEBP', quality=84, method=6)
leaf_tex((226, 210, 176), 11).save(os.path.join(OUT, 'lop-inner.webp'), 'WEBP', quality=84, method=6)
print('ok')
