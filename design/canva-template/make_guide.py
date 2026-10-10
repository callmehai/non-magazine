"""
Sinh file PDF hướng dẫn + quy tắc sửa nội dung trên Canva (4 trang A4) cho nhóm nội dung.

Chạy:
  python make_guide.py --fonts ./fonts --template ./non-template.pdf --out ./huong-dan-canva.pdf
Cần: reportlab, pypdf, pillow; macOS (dùng `sips` để chụp hình thu nhỏ các trang mẫu).
Font: Be Vietnam Pro (Regular/Medium/SemiBold/Bold), Noto Sans JP Regular.
"""
import argparse
import os
import subprocess
import tempfile

from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph

W, H = 595.28, 841.89
M = 48  # lề trang
INK = HexColor('#2a1f17')
INK2 = HexColor('#5e4d3d')
INK3 = HexColor('#8d7a64')
WINE = HexColor('#7d2f2a')
GOLD = HexColor('#b8955a')
CREAM = HexColor('#f4ede0')
LINE = HexColor('#e3d8c4')
TOTAL = 4

PALETTE = [
    ('Giấy', '#f4ede0'), ('Kem', '#ebe0cb'), ('Chữ', '#2a1f17'), ('Nâu', '#3b2a1e'),
    ('Nâu đậm', '#24180f'), ('Vàng', '#b8955a'), ('Vàng nhạt', '#d9bd84'), ('Đỏ rượu', '#7d2f2a'),
]

# trang trong template → tên kiểu trang
LAYOUTS = [
    (1, 'Bìa trước'), (2, 'Mục lục'), (3, 'Mở chương'), (4, 'Bài có ảnh'),
    (5, 'Bài chữ dọc'), (6, 'Ảnh tràn trang'), (7, 'Trích dẫn'), (8, 'Bài chỉ có chữ'),
    (9, 'Trang video'), (10, 'Bài có link'), (17, 'Ê-kíp'), (18, 'Bìa sau'),
]


def fonts(d):
    for name, file in [
        ('vi', 'BeVietnamPro-Regular.ttf'), ('viM', 'BeVietnamPro-Medium.ttf'),
        ('viS', 'BeVietnamPro-SemiBold.ttf'), ('viB', 'BeVietnamPro-Bold.ttf'), ('jp', 'NotoSansJP-Regular.ttf'),
    ]:
        pdfmetrics.registerFont(TTFont(name, os.path.join(d, file)))


BODY = ParagraphStyle('body', fontName='vi', fontSize=9.5, leading=14.5, textColor=INK)
SMALL = ParagraphStyle('small', parent=BODY, fontSize=8.5, leading=12.5, textColor=INK2)


def para(c, html, x, top, w, style=BODY):
    """Vẽ đoạn văn, đỉnh tại `top` (tính từ trên xuống). Trả về toạ độ đáy."""
    # Be Vietnam Pro không có mũi tên → lấy từ Noto Sans JP
    p = Paragraph(html.replace('→', '<font name="jp">→</font>'), style)
    _, h = p.wrapOn(c, w, 1000)
    p.drawOn(c, x, H - top - h)
    return top + h


def jp(s):
    return f'<font name="jp">{s}</font>'


def frame(c, n, kicker):
    c.setFillColor(HexColor('#ffffff'))
    c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(WINE)
    c.rect(0, H - 6, W, 6, stroke=0, fill=1)
    c.setFont('viS', 7.5)
    c.setFillColor(INK3)
    c.drawString(M, H - 30, 'HƯỚNG DẪN LÀM SÁCH TRÊN CANVA')
    c.drawRightString(W - M, H - 30, f'{kicker}   ·   {n}/{TOTAL}')
    c.setStrokeColor(LINE)
    c.setLineWidth(0.6)
    c.line(M, H - 38, W - M, H - 38)


def heading(c, text, top, size=17):
    c.setFont('viB', size)
    c.setFillColor(INK)
    c.drawString(M, H - top - size, text)
    return top + size + 8


def section(c, text, top, x=M):
    c.setFillColor(WINE)
    c.rect(x, H - top - 11, 3, 11, stroke=0, fill=1)
    c.setFont('viB', 10.5)
    c.setFillColor(INK)
    c.drawString(x + 10, H - top - 10, text)
    return top + 20


def numbered(c, items, top, x=M, w=W - 2 * M, gap=7):
    for i, html in enumerate(items, 1):
        c.setFillColor(WINE)
        c.circle(x + 8, H - top - 8, 8, stroke=0, fill=1)
        c.setFillColor(HexColor('#ffffff'))
        c.setFont('viB', 8.5)
        c.drawCentredString(x + 8, H - top - 11, str(i))
        top = max(para(c, html, x + 24, top + 0.5, w - 24), top + 16) + gap
    return top


def bullets(c, items, top, x=M, w=W - 2 * M, style=BODY, gap=4):
    for html in items:
        c.setFillColor(GOLD)
        c.circle(x + 3, H - top - style.leading / 2 - 0.5, 2, stroke=0, fill=1)
        top = para(c, html, x + 12, top, w - 12, style) + gap
    return top


def box(c, top, h, fill=CREAM):
    c.setFillColor(fill)
    c.roundRect(M, H - top - h, W - 2 * M, h, 6, stroke=0, fill=1)


def thumbs(template_pdf, pages, width_px=420):
    """Chụp hình thu nhỏ các trang mẫu (macOS sips)"""
    tmp = tempfile.mkdtemp()
    reader = PdfReader(template_pdf)
    out = {}
    for n in pages:
        w = PdfWriter()
        w.add_page(reader.pages[n - 1])
        pdf = os.path.join(tmp, f'{n}.pdf')
        png = os.path.join(tmp, f'{n}.png')
        w.write(pdf)
        subprocess.run(['sips', '-s', 'format', 'png', '--resampleWidth', str(width_px), pdf, '--out', png], capture_output=True, check=True)
        out[n] = png
    return out


# ───────────────────────────── trang 1: tổng quan + 5 quy tắc
def page1(c):
    frame(c, 1, 'TỔNG QUAN')
    top = 64
    c.setFont('viB', 26)
    c.setFillColor(INK)
    c.drawString(M, H - top - 26, 'Làm sách')
    wd = pdfmetrics.stringWidth('Làm sách ', 'viB', 26)
    c.setFont('jp', 26)
    c.setFillColor(WINE)
    c.drawString(M + wd, H - top - 26, 'ノン')
    wd += pdfmetrics.stringWidth('ノン ', 'jp', 26)
    c.setFont('viB', 26)
    c.setFillColor(INK)
    c.drawString(M + wd, H - top - 26, 'trên Canva')
    top += 40
    top = para(c, 'Hướng dẫn và quy tắc cho nhóm nội dung. Đọc một lần trước khi bắt đầu, mất khoảng 5 phút.', M, top, W - 2 * M, SMALL) + 18

    box(c, top, 92)
    para(c, '<font name="viB">Chúng ta đang làm gì?</font>', M + 16, top + 14, W - 2 * M - 32)
    para(
        c,
        'Một cuốn tạp chí điện tử <font name="viS">bằng tiếng Nhật</font>, đọc trên web như sách thật: lật từng trang, '
        '<font name="viS">lật từ phải sang trái</font> kiểu sách Nhật. Mọi người chỉ làm việc trong Canva. '
        'Khi xong, người phụ trách web tải file PDF từ Canva về và đưa lên web, nên '
        '<font name="viS">những gì bạn thấy trong Canva cũng là những gì người đọc thấy</font>.',
        M + 16, top + 32, W - 2 * M - 32,
    )
    top += 92 + 24

    top = section(c, 'Quy trình', top)
    steps = [
        ('Mở link Canva', 'được chia sẻ trong nhóm'),
        ('Làm phần của bạn', 'dựa trên các trang mẫu'),
        ('Tự kiểm tra', 'theo danh sách ở trang 4'),
        ('Báo xong', 'cho người phụ trách web'),
    ]
    bw = (W - 2 * M - 3 * 10) / 4
    for i, (t, s) in enumerate(steps):
        x = M + i * (bw + 10)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.8)
        c.roundRect(x, H - top - 62, bw, 62, 5, stroke=1, fill=0)
        c.setFont('viB', 18)
        c.setFillColor(GOLD)
        c.drawString(x + 12, H - top - 26, str(i + 1))
        c.setFont('viS', 9.5)
        c.setFillColor(INK)
        c.drawString(x + 12, H - top - 42, t)
        c.setFont('vi', 8)
        c.setFillColor(INK2)
        c.drawString(x + 12, H - top - 54, s)
    top += 62 + 26

    top = section(c, '5 quy tắc quan trọng nhất', top)
    top = numbered(c, [
        '<font name="viS">Không đổi khổ trang.</font> Không bấm "Đổi cỡ". Mọi trang giữ đúng khổ của thiết kế.',
        '<font name="viS">Thêm trang bằng cách nhân bản một trang mẫu</font> (chuột phải vào trang → Nhân bản trang), '
        'đừng tạo trang trắng rồi tự dựng lại từ đầu.',
        '<font name="viS">Không tự đánh số trang.</font> Web tự in số trang ở góc dưới, nên thêm, bớt hay đổi chỗ trang thoải mái.',
        f'<font name="viS">Chữ Nhật chỉ dùng hai font: Noto Serif JP</font> (tiêu đề) <font name="viS">và Noto Sans JP</font> (thân bài). '
        f'Font khác có thể thiếu chữ Kanji, ví dụ {jp("漢字")} bị hiện thành ô vuông.',
        '<font name="viS">Chữ và chi tiết quan trọng phải cách mép trang và gáy sách.</font> Góc dưới phía ngoài để trống cho số trang. '
        'Chi tiết ở trang 3.',
    ], top, gap=9)

    top += 10
    box(c, top, 46, HexColor('#f7ecea'))
    para(
        c,
        '<font name="viB" color="#7d2f2a">Không chắc thì hỏi.</font> Dùng <font name="viS">Bình luận</font> của Canva '
        '(chuột phải → Bình luận) để hỏi ngay trên trang. Canva lưu lịch sử phiên bản nên sửa nhầm vẫn khôi phục được.',
        M + 16, top + 12, W - 2 * M - 32,
    )
    c.showPage()


# ───────────────────────────── trang 2: các trang mẫu
def page2(c, imgs):
    frame(c, 2, 'TRANG MẪU')
    top = heading(c, 'Các kiểu trang có sẵn', 64)
    top = para(
        c,
        'Thiết kế trong Canva đã có sẵn 12 kiểu trang dưới đây. Muốn làm trang mới, hãy chọn kiểu gần giống nhất, '
        '<font name="viS">nhân bản</font>, rồi sửa chữ và thay ảnh. Chữ tiếng Nhật trong mẫu chỉ để giữ chỗ.',
        M, top, W - 2 * M,
    ) + 16

    cols, gap = 4, 14
    tw = (W - 2 * M - (cols - 1) * gap) / cols
    th = tw * H / W
    for i, (n, name) in enumerate(LAYOUTS):
        r, col = divmod(i, cols)
        x = M + col * (tw + gap)
        y = top + r * (th + 30)
        c.drawImage(imgs[n], x, H - y - th, tw, th)
        c.setStrokeColor(LINE)
        c.setLineWidth(0.6)
        c.rect(x, H - y - th, tw, th, stroke=1, fill=0)
        c.setFont('viS', 8.5)
        c.setFillColor(INK)
        c.drawString(x, H - y - th - 13, name)
    top += 3 * (th + 30) + 6

    top = section(c, 'Thay ảnh và hình minh hoạ', top)
    bullets(c, [
        f'Hình nón lá và ảnh hoàng hôn trong mẫu chỉ là <font name="viS">hình giữ chỗ</font> (tên lớp {jp("画像（差し替え）")} / {jp("写真（差し替え）")}). '
        'Chọn hình đó → <font name="viS">Xoá</font> → kéo ảnh thật vào đúng vùng đó.',
        '<font name="viS">Ảnh tràn trang</font>: kéo ảnh phủ kín cả trang, cho tràn ra ngoài mép một chút để không hở viền.',
        'Dùng ảnh rõ nét (cạnh dài từ khoảng 1500px), ảnh tự chụp hoặc có quyền sử dụng. Có nguồn thì ghi trong chú thích ảnh.',
    ], top)
    c.showPage()


# ───────────────────────────── trang 3: lật kiểu Nhật + bố cục
def mini_page(c, x, top, w, h, label, fill=HexColor('#ffffff'), color=INK):
    c.setFillColor(fill)
    c.setStrokeColor(INK3)
    c.setLineWidth(0.8)
    c.rect(x, H - top - h, w, h, stroke=1, fill=1)
    c.setFont('viB', 15)
    c.setFillColor(color)
    c.drawCentredString(x + w / 2, H - top - h / 2 - 5, label)


def arrow_left(c, x1, x2, y, color=WINE):
    """mũi tên từ x1 sang x2 (x2 < x1), y tính từ trên xuống"""
    c.setStrokeColor(color)
    c.setFillColor(color)
    c.setLineWidth(1.2)
    c.line(x1, H - y, x2 + 6, H - y)
    p = c.beginPath()
    p.moveTo(x2, H - y)
    p.lineTo(x2 + 7, H - y + 4)
    p.lineTo(x2 + 7, H - y - 4)
    p.close()
    c.drawPath(p, stroke=0, fill=1)


def page3(c):
    frame(c, 3, 'LẬT KIỂU NHẬT & BỐ CỤC')
    top = heading(c, 'Sách lật từ phải sang trái', 64)
    top = para(
        c,
        'Sách Nhật mở từ phía bên phải. Trên web, mỗi lần người đọc thấy <font name="viS">hai trang đối nhau</font>, '
        'nên hai trang đó phải được thiết kế cho hợp nhau.',
        M, top, W - 2 * M,
    ) + 14

    # sơ đồ dãy trang: [1] ← [3|2] ← [5|4] ← … ← [cuối]
    pw, ph = 40, 58
    y = top + 18
    groups = [['1'], ['3', '2'], ['5', '4'], ['7', '6'], ['…'], ['Cuối']]
    gx = W - M
    centers = []
    for g in groups:
        gw = pw * len(g)
        gx -= gw
        for j, lb in enumerate(g):
            special = lb in ('1', 'Cuối')
            mini_page(c, gx + j * pw, y, pw, ph, lb, HexColor('#3b2a1e') if special else HexColor('#ffffff'),
                      HexColor('#f4ede0') if special else INK)
        centers.append((gx, gx + gw))
        gx -= 22
    for (l1, _), (_, r2) in zip(centers, centers[1:]):
        arrow_left(c, l1 - 4, r2 + 4, y + ph / 2)
    c.setFont('vi', 8)
    c.setFillColor(INK2)
    c.drawRightString(W - M, H - y - ph - 14, 'Thứ tự đọc: từ phải sang trái (ngược với sách tiếng Việt)')
    top = y + ph + 34

    c.setFillColor(CREAM)
    c.roundRect(M, H - top - 58, W - 2 * M, 58, 6, stroke=0, fill=1)
    para(
        c,
        '<font name="viB" color="#7d2f2a">Trang CHẴN nằm bên PHẢI, trang LẺ nằm bên TRÁI.</font> '
        'Bìa trước (trang 1) và bìa sau (trang cuối) đứng riêng. Các cặp trang đối nhau là 2–3, 4–5, 6–7… '
        'Tổng số trang nên là số chẵn; nếu lẻ, web tự chèn một trang trắng trước bìa sau.',
        M + 16, top + 11, W - 2 * M - 32,
    )
    top += 58 + 26

    top = section(c, 'Vùng an toàn trên một trang', top)
    # sơ đồ trang chẵn (nằm bên phải): gáy bên trái, số trang góc phải dưới
    dw, dh = 150, 212
    dx = M + 6
    dy = top + 4
    c.setFillColor(HexColor('#ffffff'))
    c.setStrokeColor(INK3)
    c.setLineWidth(0.8)
    c.rect(dx, H - dy - dh, dw, dh, stroke=1, fill=1)
    c.setFillColor(HexColor('#efe3cf'))
    c.rect(dx, H - dy - dh, dw * 0.08, dh, stroke=0, fill=1)  # phía gáy
    c.setDash(3, 2)
    c.setStrokeColor(WINE)
    c.rect(dx + dw * 0.1, H - dy - dh + dh * 0.07, dw * 0.83, dh * 0.86, stroke=1, fill=0)
    c.setDash()
    c.setFillColor(GOLD)
    c.rect(dx + dw * 0.8, H - dy - dh + 5, dw * 0.15, 12, stroke=0, fill=1)
    c.setFont('viS', 7)
    c.setFillColor(INK2)
    c.saveState()
    c.translate(dx + dw * 0.05, H - dy - dh / 2)
    c.rotate(90)
    c.drawCentredString(0, -2.5, 'GÁY SÁCH')
    c.restoreState()
    c.drawCentredString(dx + dw * 0.52, H - dy - dh / 2, 'Chữ, mặt người, logo')
    c.drawCentredString(dx + dw * 0.52, H - dy - dh / 2 - 10, 'đặt trong khung đỏ')
    c.drawCentredString(dx + dw / 2, H - dy - dh - 14, 'Ví dụ: trang chẵn (nằm bên phải)')

    rx = dx + dw + 28
    bullets(c, [
        '<font name="viS">Cách mép ít nhất bằng lề của mẫu</font>, tức khoảng cách từ mép trang tới dòng kẻ đầu trang. '
        'Nằm sát mép quá thì trên điện thoại dễ bị che.',
        '<font name="viS">Phía gáy sách</font> (ở giữa hai trang đối nhau) bị đổ bóng. Không đặt chữ hay mặt người sát phía đó. '
        'Trang chẵn có gáy ở mép trái, trang lẻ có gáy ở mép phải.',
        '<font name="viS">Góc dưới phía ngoài</font> (ô vàng) dành cho số trang web tự in. Đừng đặt chữ ở đó.',
        '<font name="viS">Chi tiết trang trí được tràn ra mép ngoài</font>, nhưng chữ và hình chính thì không.',
        'Ảnh tràn trang và trang mở chương có thể không cần số trang: báo người phụ trách web để tắt số ở trang đó.',
    ], dy, x=rx, w=W - M - rx, gap=6)
    c.showPage()


# ───────────────────────────── trang 4: chữ, video, link, checklist
def page4(c):
    frame(c, 4, 'CHỮ · VIDEO · KIỂM TRA')
    top = heading(c, 'Chữ, màu, video và link', 64) + 6

    col_w = (W - 2 * M - 24) / 2
    lx, rx = M, M + col_w + 24

    t = section(c, 'Chữ', top)
    t = bullets(c, [
        '<font name="viS">Tiêu đề:</font> Noto Serif JP (đậm). <font name="viS">Thân bài:</font> Noto Sans JP. '
        '<font name="viS">Chữ Latin cỡ lớn</font> (như "NÓN"): Playfair Display.',
        '<font name="viS">Cỡ chữ thân bài không nhỏ hơn mẫu</font>, vì người đọc xem trên điện thoại.',
        f'<font name="viS">Chữ dọc ({jp("縦書き")}):</font> sao chép khung chữ dọc có sẵn trong mẫu rồi sửa nội dung. '
        'Không xoay khung chữ ngang 90°.',
        'Sau khi sửa, kiểm tra <font name="viS">không có chữ tràn ra ngoài khung</font> và không đè lên chữ khác.',
    ], t, x=lx, w=col_w)

    t2 = section(c, 'Màu dùng chung', top, rx)
    sw = (col_w - 3 * 8) / 4
    for i, (name, hx) in enumerate(PALETTE):
        r, col = divmod(i, 4)
        x = rx + col * (sw + 8)
        y = t2 + r * 52
        c.setFillColor(HexColor(hx))
        c.setStrokeColor(LINE)
        c.roundRect(x, H - y - 26, sw, 26, 3, stroke=1, fill=1)
        c.setFont('viS', 7.5)
        c.setFillColor(INK)
        c.drawString(x, H - y - 36, name)
        c.setFont('vi', 7)
        c.setFillColor(INK2)
        c.drawString(x, H - y - 45, hx)
    t2 += 2 * 52 + 2
    t2 = para(c, 'Trong Canva: chọn chữ hoặc hình → ô màu → dán mã (ví dụ #7d2f2a).', rx, t2, col_w, SMALL)
    top = max(t, t2) + 16

    t = section(c, 'Video', top)
    t = bullets(c, [
        '<font name="viS">Video chèn trong Canva sẽ không chạy trên web.</font>',
        'Dùng kiểu <font name="viS">Trang video</font>: giữ nguyên vị trí và cỡ khung tối có nút play.',
        'Gửi <font name="viS">file video (.mp4)</font> kèm <font name="viS">số trang</font> cho người phụ trách web. '
        'Video sẽ được đặt đúng vào khung đó.',
    ], t, x=lx, w=col_w)
    t2 = section(c, 'Link và những thứ không dùng', top, rx)
    t2 = bullets(c, [
        '<font name="viS">Link:</font> chọn chữ → biểu tượng Liên kết → dán địa chỉ. Trên web bấm được.',
        '<font name="viS">Không dùng:</font> Chuyển động (animation), nhạc trong Canva, GIF/sticker động. '
        'Trên web chúng thành ảnh tĩnh hoặc biến mất.',
        f'<font name="viS">Mục lục ({jp("目次")}):</font> số trang trong mục lục phải sửa tay mỗi khi thêm hoặc bớt trang.',
    ], t2, x=rx, w=col_w)
    top = max(t, t2) + 16

    t = section(c, 'Làm việc nhóm', top)
    t = bullets(c, [
        'Mỗi người phụ trách một phần (chương) đã chia. <font name="viS">Không sửa hay xoá trang của người khác</font>.',
        'Muốn góp ý cho trang của người khác thì dùng <font name="viS">Bình luận</font>.',
    ], t, x=M, w=W - 2 * M)
    top = t + 14

    # checklist
    items = [
        'Chữ Nhật dùng Noto Serif JP / Noto Sans JP, không có ô vuông',
        'Không có chữ tràn khung, chữ nằm trong vùng an toàn',
        'Không tự gõ số trang; góc dưới phía ngoài để trống',
        'Ảnh rõ nét, đã thay hết hình giữ chỗ trong phần của mình',
        'Video: đã gửi file .mp4 + số trang',
        'Mục lục khớp số trang; đã soát chính tả tiếng Nhật',
    ]
    bh = 30 + len(items) * 19
    box(c, top, bh)
    c.setFont('viB', 10.5)
    c.setFillColor(WINE)
    c.drawString(M + 16, H - top - 20, 'Kiểm tra trước khi báo xong')
    y = top + 34
    for it in items:
        c.setStrokeColor(WINE)
        c.setLineWidth(0.9)
        c.rect(M + 16, H - y - 10, 10, 10, stroke=1, fill=0)
        c.setFont('vi', 9.5)
        c.setFillColor(INK)
        c.drawString(M + 34, H - y - 9, it)
        y += 19
    c.showPage()


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--fonts', required=True)
    ap.add_argument('--template', required=True)
    ap.add_argument('--out', required=True)
    a = ap.parse_args()
    fonts(a.fonts)
    imgs = thumbs(a.template, [n for n, _ in LAYOUTS])
    c = canvas.Canvas(a.out, pagesize=(W, H))
    c.setTitle('Hướng dẫn làm sách trên Canva')
    page1(c)
    page2(c, imgs)
    page3(c)
    page4(c)
    c.save()
    print('ok', a.out)
