"""
Xuất sách ra PowerPoint (.pptx) để nhóm nhập vào Canva (họp 15/11: nhóm muốn bản Canva giống web ≥ 80%, tự thêm hiệu ứng
bằng chuyển động của Canva). Mỗi trang sách = một slide A4 dọc; chữ là khung chữ sửa được (đúng font, cỡ, màu, ngắt dòng
như trên web), ảnh / hình vẽ / hình khối / đường kẻ là từng phần tử riêng; phần tương tác là ảnh chụp trạng thái đầu.
Ghi chú của mỗi slide: hiệu ứng nên thêm trong Canva.

Chạy (cần: scripts/book/out/book.json; scripts/book/out/pptx/harvest-ja.json — chụp dòng chữ từ trang soát bằng
scripts/book/out/pptx/harvest.js; assets/ — nền giấy, hình vẽ, thành phần tương tác; cache/ — ảnh từ Supabase):
  /usr/local/bin/python3 scripts/book/export_pptx.py
"""
import json
import os
import re
import sys
from io import BytesIO

from PIL import Image, ImageDraw, ImageOps
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.dml import MSO_LINE_DASH_STYLE
from pptx.enum.shapes import MSO_CONNECTOR, MSO_SHAPE
from pptx.enum.text import MSO_ANCHOR, PP_ALIGN
from pptx.oxml.ns import qn
from pptx.util import Emu, Pt

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, 'out', 'pptx')
LANG = sys.argv[1] if len(sys.argv) > 1 else 'ja'
A4 = (595.28, 841.89)
K = 2.5  # px / pt cho ảnh chụp (~180 dpi)

book = json.load(open(os.path.join(ROOT, 'out', 'book.json')))
raw = open(os.path.join(OUT, f'harvest-{LANG}.json')).read()
harvest = json.loads(raw[raw.index('{'):raw.rindex('}') + 1])['pages']
os.makedirs(os.path.join(OUT, 'img'), exist_ok=True)


def pt(v):
    return Emu(int(round(v * 12700)))


def color(s):
    """'#rrggbb' | 'rgb(r, g, b)' | 'rgba(r, g, b, a)' → (RGBColor, alpha 0..1) hoặc None"""
    if not s or s == 'none' or s == 'transparent':
        return None
    if s.startswith('#'):
        h = s[1:]
        if len(h) == 3:
            h = ''.join(c * 2 for c in h)
        return RGBColor.from_string(h[:6].upper()), 1.0
    m = re.match(r'rgba?\(([^)]+)\)', s)
    if m:
        p = [float(x) for x in m.group(1).replace('/', ',').split(',') if x.strip()]
        return RGBColor(int(p[0]), int(p[1]), int(p[2])), (p[3] if len(p) > 3 else 1.0)
    return None


def set_alpha(fill_or_line_fore, alpha):
    """độ trong của màu tô (a:srgbClr/a:alpha)"""
    if alpha >= 0.999:
        return
    clr = fill_or_line_fore._xPr.find('.//' + qn('a:srgbClr')) if hasattr(fill_or_line_fore, '_xPr') else None
    if clr is None:
        return
    a = clr.makeelement(qn('a:alpha'), {'val': str(int(alpha * 100000))})
    clr.append(a)


def fill_alpha(shape, alpha):
    if alpha >= 0.999:
        return
    for clr in shape._element.spPr.iter(qn('a:srgbClr')):
        if clr.getparent().tag == qn('a:solidFill') and clr.getparent().getparent().tag == qn('p:spPr'):
            clr.append(clr.makeelement(qn('a:alpha'), {'val': str(int(alpha * 100000))}))


def save_img(im, key, alpha):
    path = os.path.join(OUT, 'img', key + ('.png' if alpha else '.jpg'))
    if alpha:
        im.save(path, optimize=True)
    else:
        im.convert('RGB').save(path, quality=86, optimize=True)
    return path


def cache_file(url):
    return os.path.join(OUT, 'cache', url.rsplit('/', 1)[-1])


def asset_file(src):
    if src.startswith('assets/') and src.endswith('.svg'):
        return os.path.join(OUT, 'assets', 'svg__' + src.replace('assets/book/', '').replace('/', '__') + '.png')
    if src.startswith('assets/'):
        return os.path.join(OUT, 'assets', 'file__' + src.replace('/', '__'))
    return cache_file(src)


ANIMATED = set()


def open_src(src):
    im = Image.open(asset_file(src))
    if getattr(im, 'n_frames', 1) > 1:
        ANIMATED.add(src)
        im.seek(0)
    return im.convert('RGBA')


def parse_pos(pos):
    if not pos:
        return 0.5, 0.5
    a = pos.replace('%', '').split()
    x = float(a[0]) / 100 if a else 0.5
    y = float(a[1]) / 100 if len(a) > 1 else 0.5
    return x, y


def fit_image(im, bw, bh, fit, pos, crop):
    """vẽ ảnh vào khung bw×bh (px) như object-fit / object-position / el.crop của CanvasPage"""
    iw, ih = im.size
    if fit == 'contain' and not crop:
        s = min(bw / iw, bh / ih)
        nw, nh = max(1, round(iw * s)), max(1, round(ih * s))
        px, py = parse_pos(pos)
        out = Image.new('RGBA', (bw, bh), (0, 0, 0, 0))
        out.paste(im.resize((nw, nh), Image.LANCZOS), (round((bw - nw) * px), round((bh - nh) * py)))
        return out
    if fit == 'fill':
        return im.resize((bw, bh), Image.LANCZOS)
    s = max(bw / iw, bh / ih)  # cover
    if crop:
        px, py = crop['x'] / 100, crop['y'] / 100
    else:
        px, py = parse_pos(pos)
    cw, ch = bw / s, bh / s  # cửa sổ trên ảnh gốc
    x0, y0 = (iw - cw) * px, (ih - ch) * py
    if crop and crop.get('z', 1) != 1:
        z = crop['z']
        mid = lambda v: min(max(v, 0.5 / z), 1 - 0.5 / z)  # noqa: E731
        mx, my = mid(px), mid(py)
        cx, cy = x0 + cw * mx, y0 + ch * my
        cw, ch = cw / z, ch / z
        x0, y0 = cx - cw / 2, cy - ch / 2
    return im.crop((round(x0), round(y0), round(x0 + cw), round(y0 + ch))).resize((bw, bh), Image.LANCZOS)


def render_image(el, key):
    src = (LANG == 'ja' and el.get('srcJa')) or el.get('src')
    w, h = el['w'], el['h']
    vector = src.endswith('.svg')
    k = K if not vector else max(K, 1200 / max(w, 1))
    bw, bh = max(1, round(w * k)), max(1, round(h * k))
    im = open_src(src)
    f = el.get('frame') or 0
    if f:
        mat = (f + 0.45) * k
        inner = fit_image(im, max(1, round(bw - 2 * mat)), max(1, round(bh - 2 * mat)), el.get('fit') or 'cover', el.get('pos'), el.get('crop'))
        out = Image.new('RGBA', (bw, bh), (255, 253, 248, 255))
        d = ImageDraw.Draw(out)
        bwid = max(1, round(0.45 * k))
        d.rectangle([0, 0, bw - 1, bh - 1], outline=(230, 219, 195, 255), width=bwid)
        out.alpha_composite(inner, (round(mat), round(mat)))
        im = out
    else:
        im = fit_image(im, bw, bh, el.get('fit') or ('contain' if vector else 'cover'), el.get('pos'), el.get('crop'))
    if el.get('mirror'):
        im = ImageOps.mirror(im)
    alpha = vector or src.endswith('.png')
    if el.get('round'):
        mask = Image.new('L', im.size, 0)
        ImageDraw.Draw(mask).ellipse([0, 0, im.size[0] - 1, im.size[1] - 1], fill=255)
        im.putalpha(Image.composite(im.getchannel('A'), Image.new('L', im.size, 0), mask))
        alpha = True
    op = el.get('opacity')
    if op is not None and op < 0.999:
        im.putalpha(im.getchannel('A').point(lambda a: int(a * op)))
        alpha = True
    if not alpha and im.getchannel('A').getextrema()[0] < 255:
        alpha = True
    return save_img(im, key, alpha)


VN_RUN = re.compile(r"[A-Za-zÀ-ÖØ-öø-ÿĂăĐđĨĩŨũƠơƯưẠ-ỹ]")
JA_FONTS = {'Noto Sans JP', 'Noto Serif JP', 'Shippori Mincho', 'Klee One'}


def set_run_font(run, name, size, rgb, alpha, bold, italic, spc):
    f = run.font
    f.size = Pt(size)
    f.bold = bold
    f.italic = italic
    if rgb is not None:
        f.color.rgb = rgb
        if alpha < 0.999:
            clr = run._r.rPr.find('.//' + qn('a:srgbClr'))
            clr.append(clr.makeelement(qn('a:alpha'), {'val': str(int(alpha * 100000))}))
    rPr = run._r.get_or_add_rPr()
    if spc:
        rPr.set('spc', str(int(round(spc * 100))))
    for tag in ('a:latin', 'a:ea', 'a:cs'):
        e = rPr.find(qn(tag))
        if e is None:
            e = rPr.makeelement(qn(tag), {})
            rPr.append(e)
        e.set('typeface', name)
    rPr.set('lang', 'ja-JP' if LANG == 'ja' and name in JA_FONTS else 'vi-VN')


ALIGN = {'left': PP_ALIGN.LEFT, 'start': PP_ALIGN.LEFT, 'right': PP_ALIGN.RIGHT, 'end': PP_ALIGN.RIGHT, 'center': PP_ALIGN.CENTER, 'justify': PP_ALIGN.JUSTIFY}


def add_text(slide, el, T):
    """khung chữ: xuống dòng đúng như web (ngắt mềm giữa các dòng), nới khung 6% để font Canva hơi rộng hơn không đẩy chữ"""
    x, y, w, h = el['x'], el['y'], el['w'], el['h']
    al = T['align']
    if not T['vertical']:
        extra = w * 0.06 + 2
        if al in ('right', 'end'):
            x -= extra
        elif al == 'center':
            x -= extra / 2
        w += extra
    else:
        h += h * 0.06 + 2
    tb = slide.shapes.add_textbox(pt(x), pt(y), pt(w), pt(h))
    tb.name = el.get('name') or 'Chữ'
    if el.get('rot'):
        tb.rotation = el['rot']
    tf = tb.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    tf.vertical_anchor = MSO_ANCHOR.TOP
    bodyPr = tf._txBody.find(qn('a:bodyPr'))
    if T['vertical']:
        bodyPr.set('vert', 'eaVert')
    base = color(T['color'])
    op = float(T.get('opacity') or 1)
    first = True
    for para in T['paras']:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.alignment = ALIGN.get(al, PP_ALIGN.LEFT)
        p.line_spacing = Pt(T['lh'])
        if para.get('gap'):
            p.space_after = Pt(para['gap'])
        spc = para.get('ls') or T.get('ls') or 0
        if not para['lines']:
            r = p.add_run()
            r.text = ''
            set_run_font(r, T['font'], T['size'], base[0] if base else None, (base[1] if base else 1) * op, int(T['weight']) >= 600, T['italic'], spc)
            continue
        for li, line in enumerate(para['lines']):
            if li:
                p.add_line_break()
            runs = line['runs']
            # bỏ khoảng trắng thừa ở cuối dòng (chỗ trình duyệt ngắt)
            if runs:
                runs[-1] = {**runs[-1], 't': runs[-1]['t'].rstrip()}
            for rr in runs:
                if not rr['t']:
                    continue
                fam, col, weight, style, size = rr['k'].split('|')
                c = color(col) or base
                r = p.add_run()
                r.text = rr['t']
                set_run_font(r, fam, float(size), c[0] if c else None, (c[1] if c else 1) * op, int(weight) >= 600, style == 'italic', spc)
    return tb


def add_shape(slide, el):
    kind = el.get('shape')
    mso = MSO_SHAPE.OVAL if kind == 'ellipse' else MSO_SHAPE.ISOSCELES_TRIANGLE if kind == 'triangle' else (MSO_SHAPE.ROUNDED_RECTANGLE if el.get('radius') else MSO_SHAPE.RECTANGLE)
    sh = slide.shapes.add_shape(mso, pt(el['x']), pt(el['y']), pt(el['w']), pt(el['h']))
    sh.name = el.get('name') or 'Hình'
    if el.get('rot'):
        sh.rotation = el['rot']
    if mso == MSO_SHAPE.ROUNDED_RECTANGLE:
        sh.adjustments[0] = min(0.5, el['radius'] / max(1, min(el['w'], el['h'])))
    op = el.get('opacity') if el.get('opacity') is not None else 1
    fc = color(el.get('fill'))
    if fc:
        sh.fill.solid()
        sh.fill.fore_color.rgb = fc[0]
        fill_alpha(sh, fc[1] * op)
    else:
        sh.fill.background()
    lc = color(el.get('stroke'))
    if lc and el.get('strokeWidth', 1):
        sh.line.color.rgb = lc[0]
        sh.line.width = Pt(el.get('strokeWidth') or 1)
        if el.get('dash'):
            sh.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    else:
        sh.line.fill.background()
    sh.shadow.inherit = False
    if sh.has_text_frame:
        sh.text_frame.text = ''
    return sh


def add_line(slide, el):
    x, y, w, h = el['x'], el['y'], el['w'], el['h']
    ln = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, pt(x + el['x1'] * w), pt(y + el['y1'] * h), pt(x + el['x2'] * w), pt(y + el['y2'] * h))
    ln.name = el.get('name') or 'Đường kẻ'
    c = color(el.get('stroke'))
    if c:
        ln.line.color.rgb = c[0]
    ln.line.width = Pt(el.get('strokeWidth') or 1)
    if el.get('dash'):
        ln.line.dash_style = MSO_LINE_DASH_STYLE.DASH
    return ln


# ── hướng dẫn hiệu ứng Canva cho từng slide (ghi chú slide) ──
EFFECT = {
    'fade': 'Pan (Lia) — trượt từ trái vào',
    'pop': 'Pop (Bật ra)',
    'stand': 'Rise (Nhô lên)',
    'grow': 'Wipe (Lau) — hướng từ trên xuống',
    'grow-up': 'Wipe (Lau) — hướng từ dưới lên',
}
WIDGET_GUIDE = {
    'envelope': 'Phong bì thư: ảnh này là phong bì đóng. Trong Canva: đặt ảnh lá thư (trang tiếp theo trong tab Tài nguyên hoặc chụp từ web) chồng lên, gán hiệu ứng Rise (Nhô lên) cho lá thư, chọn "Khi bấm" (On click) để bấm mới mở thư.',
    'map': 'Bản đồ hành trình: dùng ảnh "Bản đồ đường phố (tuyến xe)" trong tab Tài nguyên làm nền, vẽ đường tuyến xe bằng công cụ Đường kẻ (màu đỏ), gán Wipe (Lau) cho đường kẻ để đường chạy dần; hình xe buýt gán Pan (Lia). Thêm nút "Xem trên Google Maps" gắn link chỉ đường Hồ Hoàn Kiếm → Làng Chuông.',
    'rings2': 'Trò xếp 16 vòng nứa: Canva không kéo thả được. Dựng lại: hình khuôn nón + 16 vòng (hình vẽ "Vòng nứa" trong Tài nguyên), gán Rise (Nhô lên) lần lượt từng vòng, độ trễ tăng dần (0,2 giây / vòng).',
    'lock': 'Ảnh khoá: đặt hình ổ khoá lên trên ảnh, gán hiệu ứng thoát Fade (Mờ dần) "Khi bấm" để bấm vào thì ảnh lộ ra.',
    'layers': 'Mô hình 3 lớp lá: dùng 3 ảnh "Lớp lá ngoài / Lớp mo nang / Lớp lá trong" trong Tài nguyên, xếp chồng như ảnh này; gán Rise (Nhô lên) lần lượt cho 3 lớp (trễ 0,3 giây). Muốn bấm từng lớp: mỗi lớp gắn link tới slide riêng của lớp đó.',
    'tabs': 'Hàng chọn 01 · 02 · 03: trong Canva gắn mỗi nút một link tới slide tương ứng (mỗi lớp một slide).',
    'toolbox': 'Hộp đồ nghề: ảnh này là hộp đóng. Dựng lại: ảnh nắp hộp gán hiệu ứng thoát Pan (Lia) lên trên; các món đồ gán Pop (Bật ra) lần lượt.',
    'sort': 'Trò xếp công đoạn: Canva không kéo thả được. Dựng lại: các thẻ công đoạn gán Rise (Nhô lên) lần lượt theo đúng thứ tự; có thể thêm slide "đáp án" với chiếc nón hoàn thiện.',
    'timeline': 'Dòng thời gian: các mốc năm gán Pan (Lia) lần lượt; thẻ câu chuyện gán Fade (Mờ dần). Muốn bấm từng mốc: gắn link mỗi mốc tới slide riêng.',
    'grove': 'Lũy tre lớn dần: dùng hình vẽ "Bụi tre", "Tre và măng" trong Tài nguyên, gán Wipe (Lau) hướng từ dưới lên cho từng cây, trễ tăng dần.',
    'postcard': 'Bưu thiếp: ảnh chụp trạng thái đầu. Trong Canva có thể để nguyên, hoặc làm vài slide bưu thiếp với ảnh + câu ca dao khác nhau.',
    'video': 'Video: chèn file video gốc (tải trong trang Biên tập) vào chỗ ảnh này; Canva tự phát được video.',
}


def notes_for(page, els, num=0):
    lines = []
    for el in els:
        a = el.get('anim')
        if a and a.get('kind') in EFFECT:
            lines.append(f"- {el.get('name') or el['type']}: {EFFECT[a['kind']]}, trễ {a.get('delay', 0):.1f} giây")
        if el.get('spin'):
            lines.append(f"- {el.get('name') or 'Hình'}: Rotate (Xoay) chậm, lặp lại")
        if el.get('pop'):
            lines.append(f"- {el.get('name') or 'Hình'}: Breathe (Thở) hoặc Drift (Trôi) — nổi nhẹ")
        if el['type'] in ('widget', 'video'):
            lines.append('- ' + WIDGET_GUIDE.get(el.get('kind') or 'video', 'Phần tương tác: ảnh chụp trạng thái đầu.'))
        if el['type'] == 'image' and ((LANG == 'ja' and el.get('srcJa')) or el.get('src')) in ANIMATED:
            lines.append(f"- Ảnh động (GIF): xoá ảnh tĩnh này, kéo file gif/trang-{num:03d}-….gif (thư mục gif đi kèm) vào đúng chỗ.")
    head = 'Hiệu ứng nên thêm trong Canva (chọn phần tử → Animate / Tạo hiệu ứng):'
    return head + '\n' + '\n'.join(lines) if lines else ''


def build():
    prs = Presentation()
    prs.slide_width, prs.slide_height = pt(A4[0]), pt(A4[1])
    blank = prs.slide_layouts[6]
    pages = book['pages']
    n = len(pages)
    links = []
    slides = []
    for i, page in enumerate(pages):
        num = i + 1
        H = harvest.get(str(num), {'side': 'right', 'hidden': [], 'texts': []})
        side = H['side']
        hidden = set(H['hidden'])
        texts = {T['id']: T for T in H['texts']}
        slide = prs.slides.add_slide(blank)
        slides.append(slide)
        bg = color(page.get('bg') or '#ffffff')
        slide.background.fill.solid()
        slide.background.fill.fore_color.rgb = bg[0]
        if page.get('paper'):
            pf = os.path.join(OUT, 'assets', f"paper__{page['paper']}__{side}.png")
            jpg = os.path.join(OUT, 'img', f"paper-{page['paper']}-{side}.jpg")
            if not os.path.exists(jpg):
                Image.open(pf).convert('RGB').save(jpg, quality=84, optimize=True)
            pic = slide.shapes.add_picture(jpg, 0, 0, prs.slide_width, prs.slide_height)
            pic.name = f"Nền giấy ({page['paper']})"
        els = [e for e in page['elements'] if not (e.get('only') and e['only'] != LANG) and e['id'] not in hidden]
        for el in els:
            t = el['type']
            shp = None
            try:
                if t == 'text':
                    T = texts.get(el['id'])
                    if T:
                        shp = add_text(slide, el, T)
                elif t == 'image' and el.get('src'):
                    path = render_image(el, f"{num:03d}-{el['id']}")
                    shp = slide.shapes.add_picture(path, pt(el['x']), pt(el['y']), pt(el['w']), pt(el['h']))
                    shp.name = el.get('name') or 'Ảnh'
                    if el.get('rot'):
                        shp.rotation = el['rot']
                elif t == 'shape':
                    shp = add_shape(slide, el)
                elif t == 'line':
                    shp = add_line(slide, el)
                elif t in ('widget', 'video'):
                    wf = os.path.join(OUT, 'assets', f"widget__{el['id']}.png")
                    if os.path.exists(wf):
                        shp = slide.shapes.add_picture(wf, pt(el['x']), pt(el['y']), pt(el['w']), pt(el['h']))
                        shp.name = f"Tương tác: {el.get('kind') or 'video'}"
            except Exception as ex:  # một phần tử lỗi không làm hỏng cả trang
                print(f'tr. {num} {el["id"]} ({t}): {ex}')
            if shp is not None and el.get('link'):
                links.append((shp, el['link']))
        # số trang (như .cv-folio của trang đọc)
        if i != 0 and i != n - 1 and not page.get('hideNumber'):
            fw, fh = 90, 24
            fx = A4[0] * 0.065 if side == 'left' else A4[0] * (1 - 0.065) - fw
            fy = A4[1] * (1 - 0.026) - fh
            tb = slide.shapes.add_textbox(pt(fx), pt(fy), pt(fw), pt(fh))
            tb.name = 'Số trang'
            tf = tb.text_frame
            tf.word_wrap = False
            tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT if side == 'left' else PP_ALIGN.RIGHT
            r = p.add_run()
            r.text = f'{num:02d}'
            light = sum(int(page.get('bg', '#ffffff')[k:k + 2], 16) for k in (1, 3, 5)) / 3 < 140
            set_run_font(r, 'Playfair Display', A4[0] * 0.027, RGBColor(244, 237, 224) if light else RGBColor(42, 31, 23), 0.72 if light else 0.62, False, False, A4[0] * 0.027 * 0.12)
        note = notes_for(page, els, num)
        if note:
            slide.notes_slide.notes_text_frame.text = note
        print(f'\rtr. {num}/{n}', end='', flush=True)
    print()
    # link: "#p12" → nhảy tới slide 12 (mục lục…), link ngoài → mở trang web
    for shp, link in links:
        m = re.match(r'^#p(\d+)$', link)
        try:
            if m and 0 < int(m.group(1)) <= len(slides):
                shp.click_action.target_slide = slides[int(m.group(1)) - 1]
            elif link.startswith('http'):
                shp.click_action.hyperlink.address = link
        except Exception as ex:
            print('link', link, ex)
    out = os.path.join(OUT, f'non-la-lang-chuong-{LANG}.pptx')
    prs.save(out)
    print(out, round(os.path.getsize(out) / 1e6, 1), 'MB', '· ảnh động:', len(ANIMATED))
    json.dump(sorted(ANIMATED), open(os.path.join(OUT, f'animated-{LANG}.json'), 'w'))


if __name__ == '__main__':
    build()
