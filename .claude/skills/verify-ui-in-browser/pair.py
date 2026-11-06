"""Put a before and an after screenshot side by side, labelled "Trước" / "Sau", with every change
boxed in red on both sides and numbered, so the reader sees at once where to look.

Usage:
  python3 pair.py before.png after.png out.png [options]

Boxes (x,y,w,h in screenshot pixels; repeat each option as needed):
  --box x,y,w,h          the same region on both sides (a button that appeared, a label that changed)
  --before-box x,y,w,h   one side only, when the element moved: give its place in each shot
  --after-box x,y,w,h
  --boxes before.json after.json
                         boxes the spec saved for the changed elements (a list of [x,y,w,h] per
                         shot, see verify-ui-in-browser): box i covers element i in both shots,
                         drawn in the same place on both sides; an element missing on one side
                         (a button that is new) is boxed where it appears on the other
  (no box given)         find the changed regions by pixel diff (same viewport, same data only)
  --ignore x,y,w,h       leave this region out of the diff (clock, timestamps, generated IDs)
  --labels LEFT RIGHT    the two titles on top (default "Trước" "Sau"), e.g. "Nhóm gắn" "Sách"
                         when the pair compares the client's Doc with the book, not two builds
  --no-boxes             draw no box and skip the diff: the two images are different photos
                         (Doc vs book), so there is no "change" to point at

It prints every box it drew. Read them: a diff box around a timestamp or the whole page means the
shots differ in data or layout, not only in the change, so pass explicit boxes instead.
"""
import argparse
import json
from collections import deque
from PIL import Image, ImageChops, ImageDraw, ImageFont

RED = '#e3171b'
CELL = 8  # diff resolution in px; changed cells closer than MERGE cells become one box
MERGE = 3


def rect(text):
    x, y, w, h = (int(float(v)) for v in text.split(','))
    return (x, y, x + w, y + h)


def boxes_from(before_file, after_file):
    before, after = json.load(open(before_file)), json.load(open(after_file))
    boxes = []
    for i in range(max(len(before), len(after))):
        rects = [rect(','.join(map(str, side[i]))) for side in (before, after) if i < len(side)]
        boxes.append((min(r[0] for r in rects), min(r[1] for r in rects),
                      max(r[2] for r in rects), max(r[3] for r in rects)))
    return boxes


def diff_boxes(a, b, ignore):
    w, h = max(a.width, b.width), max(a.height, b.height)
    pa, pb = Image.new('RGB', (w, h), 'white'), Image.new('RGB', (w, h), 'white')
    pa.paste(a)
    pb.paste(b)
    mask = ImageChops.difference(pa, pb).convert('L').point(lambda v: 255 if v > 24 else 0)
    draw = ImageDraw.Draw(mask)
    for box in ignore:
        draw.rectangle(box, fill=0)
    cols, rows = (w + CELL - 1) // CELL, (h + CELL - 1) // CELL
    small = mask.resize((cols, rows), Image.Resampling.BOX).load()
    hot = {(c, r) for r in range(rows) for c in range(cols) if small[c, r] > 0}
    boxes, seen = [], set()
    for start in hot:
        if start in seen:
            continue
        seen.add(start)
        queue, cells = deque([start]), []
        while queue:
            c, r = queue.popleft()
            cells.append((c, r))
            for dc in range(-MERGE, MERGE + 1):
                for dr in range(-MERGE, MERGE + 1):
                    n = (c + dc, r + dr)
                    if n in hot and n not in seen:
                        seen.add(n)
                        queue.append(n)
        cs, rs = [c for c, _ in cells], [r for _, r in cells]
        boxes.append((min(cs) * CELL, min(rs) * CELL, (max(cs) + 1) * CELL, (max(rs) + 1) * CELL))
    return sorted(boxes, key=lambda b: (b[1], b[0]))


def mark(img, boxes, font, pad=6, k=1):
    img = img.copy()
    draw = ImageDraw.Draw(img)
    pad = round(pad * k)
    for i, (x0, y0, x1, y1) in enumerate(boxes, 1):
        box = (max(x0 - pad, 2), max(y0 - pad, 2), min(x1 + pad, img.width - 3), min(y1 + pad, img.height - 3))
        draw.rectangle(box, outline=RED, width=round(4 * k))
        # The number sits outside the box, so it never hides what the box points at: to the right,
        # else to the left, else above, else below.
        tag = str(i)
        tw, th = draw.textlength(tag, font=font) + round(12 * k), round(24 * k)
        mid = (box[1] + box[3]) // 2 - th // 2
        spots = [(box[2] + 4, mid), (box[0] - tw - 4, mid), (box[0], box[1] - th - 2), (box[0], box[3] + 2)]
        tx, ty = next(((x, y) for x, y in spots if x >= 0 and y >= 0 and x + tw <= img.width
                       and y + th <= img.height), spots[0])
        draw.rectangle((tx, ty, tx + tw, ty + th), fill=RED)
        draw.text((tx + round(6 * k), ty + round(k)), tag, fill='white', font=font)
    return img


def main():
    p = argparse.ArgumentParser()
    p.add_argument('before')
    p.add_argument('after')
    p.add_argument('out')
    p.add_argument('--box', action='append', type=rect, default=[])
    p.add_argument('--before-box', action='append', type=rect, default=[])
    p.add_argument('--after-box', action='append', type=rect, default=[])
    p.add_argument('--ignore', action='append', type=rect, default=[])
    p.add_argument('--boxes', nargs=2, metavar=('BEFORE_JSON', 'AFTER_JSON'))
    p.add_argument('--no-boxes', action='store_true')
    p.add_argument('--labels', nargs=2, metavar=('LEFT', 'RIGHT'), default=['Trước', 'Sau'])
    o = p.parse_args()

    a, b = Image.open(o.before).convert('RGB'), Image.open(o.after).convert('RGB')
    # A font with Vietnamese diacritics; PIL's built-in bitmap font has none.
    # Shots taken at 2x (or a phone at 3x) get marks and labels scaled to match, not 1x-sized ones.
    k = max(1, round(min(a.width, b.width) / 1200, 1)) if a.width > 600 else 1
    try:
        font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', round(20 * k))
        title = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Bold.ttf', round(24 * k))
    except OSError:
        font = title = ImageFont.load_default()

    if o.boxes:
        o.box += boxes_from(*o.boxes)
    if o.no_boxes:
        before_boxes, after_boxes, source = [], [], 'none'
    elif o.box or o.before_box or o.after_box:
        before_boxes, after_boxes, source = o.box + o.before_box, o.box + o.after_box, 'given'
    else:
        before_boxes = after_boxes = diff_boxes(a, b, o.ignore)
        source = 'pixel diff'
    if not before_boxes and not after_boxes and not o.no_boxes:
        print('warning: no box drawn — the two shots are identical, or pass --box')

    a, b = mark(a, before_boxes, font, k=k), mark(b, after_boxes, font, k=k)
    gap, head = round(24 * k), round(44 * k)
    sheet = Image.new('RGB', (a.width + gap + b.width, head + max(a.height, b.height)), 'white')
    sheet.paste(a, (0, head))
    sheet.paste(b, (a.width + gap, head))
    draw = ImageDraw.Draw(sheet)
    draw.text((round(8 * k), round(8 * k)), o.labels[0], fill='#b3261e', font=title)
    draw.text((a.width + gap + round(8 * k), round(8 * k)), o.labels[1], fill='#146c2e', font=title)
    sheet.save(o.out)
    for side, boxes in (('before', before_boxes), ('after', after_boxes)):
        for i, (x0, y0, x1, y1) in enumerate(boxes, 1):
            print(f'{side} {i}: x={x0} y={y0} w={x1 - x0} h={y1 - y0} ({source})')
    print(o.out)


main()
