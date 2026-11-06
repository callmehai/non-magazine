#!/usr/bin/env python3
"""
Mặt ba lớp của mô hình 3D mục 2.1.2 lấy từ ảnh thật nhóm chụp (anh Hải 05/11: nhóm muốn "thấy rõ các lớp trông như
nào (ảnh thật)"; tab góp ý: "3 lớp lá cho ảnh 3d thật"). Mỗi lớp: một dải dọc mặt nón trong ảnh "sau khi lợp" (vành ở
dưới, chóp ở trên), lặp quanh nón, lặp xen lật gương để không lộ đường nối.

  python3.12 scripts/book/layer-tex.py <thư mục ảnh tải về>  →  public/assets/book/fx/lop-{inner,mo,outer}.webp
Ảnh nguồn (tải từ book-assets, xem out/photos.json): in-a = "Lớp lá lụi trong — sau khi lợp" (IMG_7910),
mo-b = "Lớp mo nang — tàu mo trước khi lợp" (IMG_7938: bẹ mo phẳng, nâu loang rõ hơn ảnh mo đã lợp), out-a = "Lớp lá lụi ngoài — sau khi lợp" (IMG_7929).
"""
import os
import sys

from PIL import Image, ImageOps, ImageEnhance

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'public', 'assets', 'book', 'fx')
# vùng cắt theo ảnh thu về cạnh dài 400 (ảnh dọc rộng 300): x0, y0, x1, y1
CUT = {'outer': ('out-a.webp', (110, 110, 190, 270)), 'mo': ('mo-b.webp', (100, 130, 185, 330)), 'inner': ('in-a.webp', (130, 60, 230, 200))}
TW, TH, N = 1536, 384, 8  # 8 dải quanh nón

for kind, (f, box) in CUT.items():
    im = Image.open(os.path.join(SRC, f)).convert('RGB')
    s = im.width / (300 if im.width < im.height else 400)
    strip = im.crop(tuple(int(v * s) for v in box)).resize((TW // N, TH), Image.LANCZOS)
    strip = ImageEnhance.Contrast(strip).enhance(1.06)
    tex = Image.new('RGB', (TW, TH))
    for k in range(N):
        tex.paste(strip if k % 2 == 0 else ImageOps.mirror(strip), (k * (TW // N), 0))
    tex.save(os.path.join(OUT, f'lop-{kind}.webp'), 'WEBP', quality=80, method=6)
    print(kind, os.path.getsize(os.path.join(OUT, f'lop-{kind}.webp')) // 1024, 'KB')
