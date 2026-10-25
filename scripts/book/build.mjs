#!/usr/bin/env node
/**
 * Dựng sách "Nón lá Làng Chuông" (song ngữ Việt – Nhật) thành dữ liệu trang cho editor.
 *   node scripts/book/build.mjs            → scripts/book/out/book.json
 *   node scripts/book/push.mjs             → thay các trang của sách "non" trong Supabase (trang cũ được cất đi)
 *
 * Nội dung: scripts/book/content/*.mjs (mỗi đoạn [tiếng Việt, tiếng Nhật]).
 * Yêu cầu của nhóm (bản sửa lần 1):
 *  - mỗi chế độ đọc chỉ một thứ tiếng: không chêm dòng tiếng còn lại dưới tiêu đề;
 *  - ít chữ mỗi trang, trang nào cũng có hình (trang chỉ có chữ → tự đặt một ảnh thật từ kho ảnh của chương);
 *  - ảnh nằm trong khung tỷ lệ cố định (3:2, 16:9, 4:3, vuông), cùng nhóm thì cùng kiểu (tách nền / có nền);
 *  - mục lục trước lời mở đầu; mỗi công đoạn làm nón trải trên một cặp trang đối diện.
 * Ảnh chưa có → khung ảnh tạm ghi rõ cần ảnh gì (hint); nhóm kéo ảnh thật vào thay trong editor.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { front, preface, tocTitle } from './content/00-front.mjs'
import { ch1 } from './content/01-ch1.mjs'
import { ch2 } from './content/02-ch2.mjs'
import { measureKey } from './measureKey.mjs'
import { ch3, ending } from './content/03-ch3.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
// ảnh thật đã tải lên kho (upload-photos.mjs): mô tả khung → URL; chưa có thì khung ảnh tạm
const photoFile = path.join(here, 'out', 'photos.json')
const PHOTOS = fs.existsSync(photoFile) ? JSON.parse(fs.readFileSync(photoFile, 'utf8')) : {}
const VIDEO_SRC = PHOTOS['video: trình diễn quốc tế'] ?? ''
const VIDEO_POSTER = PHOTOS['video: trình diễn quốc tế (ảnh đại diện)']

// ── khổ trang & bảng màu
const W = 595.28
const H = 841.89
const C = {
  paper: '#f7f1e3',
  cream: '#fbf7ee',
  ink: '#2b2118',
  ink2: '#5d4c3c',
  muted: '#8f7b62',
  line: '#d9c9a8',
  gold: '#a07a3c',
  title: '#7a5c38', // nâu nhạt cho tiêu đề
}
const ACC = { 0: '#a07a3c', 1: '#5f7350', 2: '#a95f3c', 3: '#3f7676', 9: '#8c6a33' }
const TINT = { 0: '#efe3c6', 1: '#e3e8d8', 2: '#f1dccd', 3: '#d9e6e3', 9: '#efe3c6' }
const F = { head: 'Playfair Display', body: 'Be Vietnam Pro', script: 'Dancing Script', hand: 'Patrick Hand', jaHead: 'Shippori Mincho', jaBody: 'Noto Serif JP', jaSans: 'Noto Sans JP', jaHand: 'Klee One' }
const M = { bottom: 58, outer: 40, inner: 50 }
// hạn mức chữ thân bài mỗi trang (pt, ≈ 12–13 dòng): phần còn lại của trang là ảnh — góp ý: trang dày đặc chữ quá,
// cả sách không quá ~7 trang toàn chữ. Chữ vượt hạn mức chảy sang trang / cặp trang sau (không cắt bớt, không "Đọc thêm")
const TXT_PAGE = 340
const TOP = 82 // chữ bắt đầu dưới đầu trang
const BOT = H - M.bottom
// thang chữ (pt trên trang A4). Tiếng Nhật ngắn hơn tiếng Việt ~30% → chữ Nhật lớn hơn để lấp khung.
const jaPt = (size, k = 1.06) => Math.round(size * k * 2) / 2
const BODY = { size: 17.5, lh: 1.55, jaSize: jaPt(17.5, 1.14) }
const S = { run: 10, cap: 12.5, note: 12, label: 12.5, block: 21, sec: 30, secNum: 50, quote: 22, card: 19.5, cardText: 16.5, cardTextJa: jaPt(16.5) }
const RUBY_MIN = 12 // chữ nhỏ hơn: bỏ phiên âm (nhãn, chú thích)
// khung ảnh: tỷ lệ cao/rộng cố định
const R = { wide: 2 / 3, cin: 9 / 16, std: 3 / 4, sq: 1, por: 4 / 3, pan: 1 / 2 }

let seq = 0
const id = () => `nl${(++seq).toString(36)}`

// ── ước lượng chiều cao chữ (lấy bản dài hơn trong hai ngôn ngữ)
const strip = (s) => String(s ?? '').replace(/\{([^{}|]+)\|[^{}]+\}/g, '$1')
function lines(str, w, size, ja, font) {
  const k = ja ? 1.02 : font === F.head ? 0.5 : font === F.script ? 0.48 : 0.5
  // tiếng Việt xuống dòng theo từ: mỗi dòng mất trung bình nửa từ
  const cpl = Math.max(4, Math.floor(w / (size * k) - (ja ? 0 : 2.5)))
  return strip(str)
    .split('\n')
    .reduce((n, p) => n + Math.max(1, Math.ceil([...p].length / cpl)), 0)
}
// chiều cao chữ đo thật trên trình duyệt (trang ?measure=1 ghi scripts/book/out/measure.json); chưa đo thì ước lượng
const MEASURED = (() => {
  try {
    return JSON.parse(fs.readFileSync(new URL('./out/measure.json', import.meta.url), 'utf8'))
  } catch {
    return {}
  }
})()
let measureHits = 0
let measureMiss = 0
function textH(pair, w, o = {}) {
  const size = o.size ?? BODY.size
  const lh = o.lh ?? BODY.lh
  const jaSize = o.jaSize ?? size
  const m = MEASURED[measureKey({ text: pair[0], ja: pair[1], w, size, jaSize, lh, paraGap: o.paraGap ?? 0, font: o.font ?? F.body, weight: o.weight ?? 400, tracking: o.tracking ?? 0 })]
  if (m) {
    measureHits++
    return Math.ceil(Math.max(m[0], m[1]) + 2)
  }
  measureMiss++
  const n = String(pair[0]).split('\n').length
  const gap = (o.paraGap ?? 0) * (n - 1)
  const hv = pair[0] ? lines(pair[0], w, size, o.font === F.jaSans || o.font === F.jaBody, o.font) * size * lh + gap : 0
  const nj = String(pair[1] ?? '').split('\n').length
  const hj = pair[1] ? lines(pair[1], w, jaSize, true) * jaSize * lh + (o.paraGap ?? 0) * (nj - 1) : 0
  return Math.ceil(Math.max(hv, hj) + 2)
}

/** chiều cao chữ của MỘT thứ tiếng (k = 0 tiếng Việt, 1 tiếng Nhật): lấy số đo thật của cả cặp nếu có */
function textH1(pair, w, o, k) {
  const size = o.size ?? BODY.size
  const m = MEASURED[measureKey({ text: pair[0], ja: pair[1], w, size, jaSize: o.jaSize ?? size, lh: o.lh ?? BODY.lh, paraGap: o.paraGap ?? 0, font: o.font ?? F.body, weight: o.weight ?? 400, tracking: o.tracking ?? 0 })]
  if (m) return Math.ceil(m[k] + 2)
  return textH(k ? ['', pair[1]] : [pair[0], null], w, o)
}

// ── phần tử
const r1 = (n) => Math.round(n * 100) / 100
function T(x, y, w, h, pair, o = {}) {
  const [vi0, ja0] = Array.isArray(pair) ? pair : [pair, null]
  const small = (o.size ?? BODY.size) < RUBY_MIN
  const vi = small ? strip(vi0) : vi0
  // tiếng Nhật: không ngắt dòng giữa "年" và "前 / 生" (kiểu 2500〜3000年 / 前)
  const ja = (ja0 && small ? strip(ja0) : ja0)?.replace(/年(?=[前生])/g, '年\u2060')
  // khung đặt cao cố định mà chữ cần nhiều chỗ hơn → nới ra
  if (h != null) h = Math.max(h, textH([vi, ja], w, o))
  const el = {
    id: id(),
    type: 'text',
    x: r1(x),
    y: r1(y),
    w: r1(w),
    h: r1(h ?? textH([vi, ja], w, o)),
    rot: 0,
    text: vi,
    font: o.font ?? F.body,
    weight: o.weight ?? 400,
    italic: !!o.italic,
    size: o.size ?? BODY.size,
    color: o.color ?? C.ink,
    align: o.align ?? 'left',
    lineHeight: o.lh ?? BODY.lh,
    tracking: o.tracking ?? 0,
    paraGap: o.paraGap ?? 0,
    name: o.name ?? 'Chữ',
  }
  if (ja) el.ja = ja
  if (o.jaFont) el.jaFont = o.jaFont
  if (o.jaSize) el.jaSize = o.jaSize
  if (o.opacity != null) el.opacity = o.opacity
  if (o.link) el.link = o.link
  // đoạn văn nhiều dòng: khi đọc, giãn dòng cho chữ (thường là bản tiếng Nhật, ngắn hơn) lấp kín khung
  if (FILL_LEADING.has(el.name) && el.h >= el.size * el.lineHeight * 3) el.fillLeading = true
  return el
}
const FILL_LEADING = new Set(['Đoạn văn', 'Mô tả', 'Tiểu sử', 'Ghi chú', 'Mô tả lớp', 'Đoạn dẫn'])
// tâm khung theo ảnh (khóa = chú thích tiếng Việt); ảnh có người không ghi ở đây thì tự canh theo khuôn mặt (faces.json)
const POS = {
  // người đứng sát mép phải ảnh bị cắt nửa người → dịch khung sang trái
  'Ảnh toàn trang: người bán bên những chồng nón trong phiên chợ Chuông': '0% 50%',
  'Trung tâm Thiết kế sáng tạo, giới thiệu, quảng bá và bán sản phẩm OCOP – làng nghề Nón Chuông': '50% 88%',
  'Nón lá trắng và tà áo dài trước sân đình Chuông': '50% 56%',
  'Người vác hàng rời phiên chợ Chuông': '50% 30%',
  // ảnh báo: chiếc nón lá sen nằm ở góc phải, bên trái là đống lá
  'Nón lá sen — Thành phố Huế': '92% 40%',
}
// khung mặt người trong từng ảnh (Vision, chạy một lần trên máy): { a: rộng/cao, f: [x0, y0, x1, y1] tỉ lệ 0..1 }
const FACES = JSON.parse(fs.readFileSync(path.join(here, 'faces.json'), 'utf8'))
// mặt người trong ảnh này là ảnh in / người rất xa phía sau → không canh theo
const NO_FACE = new Set(['Lá tươi được vò qua cát', 'Đôi bàn tay người thợ', 'Người làng gỡ và chọn từng bó lá lụi trên sân gạch', 'Sợi len màu để luồn nhôi bày bán ở chợ Chuông', 'Người phụ nữ đội nón giữa cánh đồng — tranh tại Bảo tàng Mỹ thuật Việt Nam', 'Bài báo “Người dệt hồn quê lên vành nón lá” về nghệ nhân Lê Văn Tuy'])
/**
 * tâm khung cho ảnh có người: khung cắt ảnh theo tỉ lệ cố định (cover) → dời phần nhìn thấy sao cho trọn các khuôn mặt
 * (mặt nằm ở khoảng 40% chiều cao khung). Mặt đã nằm trọn trong khung cắt giữa thì giữ nguyên.
 */
function facePos(key, w, h) {
  const fc = FACES[key]
  if (!fc || NO_FACE.has(key)) return null
  const [x0, y0, x1, y1] = fc.f
  if ((x1 - x0) * (y1 - y0) < 0.004) return null
  const r = h / w
  const k = Math.max(1 / fc.a, r)
  const vw = 1 / (fc.a * k) // phần bề ngang ảnh nhìn thấy
  const vh = r / k // phần chiều cao ảnh nhìn thấy
  const axis = (a0, a1, v, bias) => {
    if (v >= 0.999) return 50
    if (a0 >= 0.5 - v / 2 && a1 <= 0.5 + v / 2) return 50
    const start = Math.min(1 - v, Math.max(0, (a0 + a1) / 2 - v * bias))
    return Math.round((start / (1 - v)) * 100)
  }
  const px = axis(x0, x1, vw, 0.5)
  const py = axis(y0, y1, vh, 0.4)
  return px === 50 && py === 50 ? null : `${px}% ${py}%`
}
const IMG = (x, y, w, h, hint, o = {}) => ({
  id: id(),
  type: 'image',
  x: r1(x),
  y: r1(y),
  w: r1(w),
  h: r1(h),
  rot: 0,
  src: o.src ?? PHOTOS[hint?.[0]] ?? '',
  ...(o.srcJa ? { srcJa: o.srcJa } : {}),
  // tâm khung ảnh (object-position) cho ảnh có người: giữ mặt trong khung khi cắt theo tỉ lệ khung cố định
  ...((o.pos ?? POS[hint?.[0]]) ? { pos: o.pos ?? POS[hint?.[0]] } : {}),
  fit: o.fit ?? 'cover',
  hint: hint?.[0] ?? '',
  hintJa: hint?.[1] ?? '',
  name: o.name ?? 'Ảnh',
  ...(o.opacity != null ? { opacity: o.opacity } : {}),
})
const VIDEO = (x, y, w, h, src, o = {}) => ({ id: id(), type: 'video', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, src, ...(o.poster ? { poster: o.poster } : {}), name: o.name ?? 'Video' })
const DECO = (name, x, y, w, h, opacity = 0.55) => ({ id: id(), type: 'image', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, src: `assets/book/deco/${name}.svg`, fit: 'contain', opacity, name: 'Họa tiết' })
const shape = (kind) => (x, y, w, h, fill, o = {}) => ({ id: id(), type: 'shape', shape: kind, x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, fill, ...(o.stroke ? { stroke: o.stroke, strokeWidth: o.sw ?? 0.8 } : {}), ...(o.radius ? { radius: o.radius } : {}), ...(o.dash ? { dash: o.dash } : {}), ...(o.opacity != null ? { opacity: o.opacity } : {}), ...(o.link ? { link: o.link } : {}), ...(o.alt ? { alt: o.alt } : {}), name: o.name ?? 'Hình' })
const RECT = shape('rect')
/** con dấu son "Làng Chuông": vuông nhỏ, viền trong mảnh, chữ in hoa — kiểu dấu trên họa đồ Henri Oger */
const SEAL = (x, y, s = 60) => [
  RECT(x, y, s, s, '#a8382b', { radius: 3, name: 'Con dấu' }),
  RECT(x + 3.5, y + 3.5, s - 7, s - 7, 'none', { stroke: '#f6e9d6', sw: 0.8, radius: 2, name: 'Viền dấu' }),
  T(x + 2, y + s / 2 - 12, s - 4, 24, ['LÀNG\nCHUÔNG', 'チュオン\n村'], { font: F.head, size: 8.6, weight: 700, tracking: 0.4, lh: 1.3, align: 'center', color: '#f6e9d6', jaFont: F.jaHead, jaSize: 9.5, name: 'Chữ dấu' }),
]
const ELL = shape('ellipse')
const TRI = shape('triangle')
const HL = (x, y, w, stroke = C.line, sw = 0.6) => ({ id: id(), type: 'line', x: r1(x), y: r1(y - 2), w: r1(w), h: 4, rot: 0, x1: 0, y1: 0.5, x2: 1, y2: 0.5, stroke, strokeWidth: sw, name: 'Đường kẻ' })
const join = (paras) => [paras.map((q) => q[0]).join('\n'), paras.map((q) => q[1]).join('\n')]
/** phần tử tương tác (bản đồ, mô hình 3D) — xem src/canvas/widgets */
const WIDGET = (x, y, w, h, kind, o = {}) => ({ id: id(), type: 'widget', kind, x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, name: o.name ?? 'Phần tử tương tác', ...o.data })
/** nút "Đọc thêm": toàn văn một mục mở trong khung đọc (trang chỉ in đoạn tóm tắt) */
const MORE = (x, y, title, paras, parasJa, color) => ({
  id: id(),
  type: 'more',
  x: r1(x),
  y: r1(y),
  w: 128,
  h: 28,
  rot: 0,
  title: strip(title[0]).replace(/\n/g, ' '),
  titleJa: strip(title[1] ?? '').replace(/\n/g, ''),
  paras: paras.map(strip),
  parasJa: (parasJa || []).filter(Boolean).map(strip),
  color,
  font: F.hand,
  ja: '続きを読む',
  jaFont: F.jaHand,
  name: 'Đọc thêm',
})
const isPhoto = (el) => el && ((el.type === 'image' && el.name !== 'Họa tiết') || el.type === 'video' || el.type === 'widget')

// ── trang
const pages = []
class Page {
  constructor(o = {}) {
    this.n = pages.length + 1
    this.side = this.n === 1 ? 'right' : this.n % 2 === 0 ? 'left' : 'right'
    this.bg = o.bg ?? C.paper
    this.hideNumber = !!o.hideNumber
    this.els = []
    this.chapter = o.chapter ?? 0
    this.paper = o.paper // mẫu nền (src/canvas/papers.js); bỏ trống = tự chọn lúc xuất
    this.hasImg = false
    pages.push(this)
  }
  get x0() {
    return this.side === 'left' ? M.outer : M.inner
  }
  get x1() {
    return W - (this.side === 'left' ? M.inner : M.outer)
  }
  get cw() {
    return this.x1 - this.x0
  }
  add(...els) {
    const list = els.flat().filter(Boolean)
    this.els.push(...list)
    if (list.some(isPhoto)) this.hasImg = true
    return this
  }
}
const CW = W - M.outer - M.inner

/** trang ảnh toàn trang (dùng cả để chèn cho trang sau rơi đúng bên) */
// trang ảnh đệm: ảnh vừa phải (khung dọc 3:4, ~60% bề rộng khối) giữa trang + chú thích + hình vẽ nét mảnh —
// góp ý: ảnh to / tràn trang đều xấu (ảnh nhóm tự chụp, không chuyên) → không phóng ảnh ra cả trang
const pageCap = (s) => (s ? strip(s).replace(/^(Ảnh toàn trang|Ảnh trang lót):\s*/, '').replace(/^(全面写真|見返し写真)：/, '').replace(/^./, (c) => c.toUpperCase()) : s)
const padArt = {}
function photoPage(hint, chapter = 0) {
  const p = new Page({ chapter })
  runningHead(p, CH_LABEL[chapter] ?? ['NÓN LÁ LÀNG CHUÔNG', 'チュオン村のノンラー'])
  const cap = [pageCap(hint[0]), pageCap(hint[1])]
  const iw = r1(CW * 0.62)
  const ih = r1(iw * R.por)
  const x = p.x0 + (CW - iw) / 2
  const ch = capH(cap, iw)
  p.add(IMG(x, TOP + 10, iw, ih, hint, { name: 'Ảnh trang' }))
  p.add(T(x, TOP + 10 + ih + 8, iw, ch, cap, { ...capOpt, italic: true, align: 'center', color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
  // hình vẽ dưới ảnh đổi theo chương (không lặp một hình chồng nón ở mọi trang đệm)
  const arts = { 1: ['non', 'tool-but-vong'], 2: ['tool-quay-non', 'tool-khau-non'], 3: ['tre-mang', 'non'] }[chapter]
  const art = arts?.[(padArt[chapter] = (padArt[chapter] ?? -1) + 1) % arts.length]
  const dh = art ? Math.min(BOT - (TOP + 10 + ih + 8 + ch) - 16, 200) : r1(CW * (310 / 640))
  if (art) p.add({ ...DECO(art, p.x0 + (CW - dh * 1.2) / 2, BOT - dh, dh * 1.2, dh, 0.9), name: 'Hình vẽ' })
  else p.add({ ...DECO('still-non', p.x0, BOT - dh, CW, dh, 0.9), name: 'Hình vẽ' })
  return p
}
/** trang kế tiếp phải là trang trái (số chẵn) — nếu không thì chèn một trang ảnh */
function toLeft(hint, chapter) {
  if ((pages.length + 1) % 2 !== 0) photoPage(hint, chapter)
}
function toRight(hint, chapter) {
  if ((pages.length + 1) % 2 === 0) photoPage(hint, chapter)
}
/** trang ảnh tràn trang lấy từ kho ảnh của chương (dùng để khép trang đôi) */
const shortPool = []
// nhãn đầu trang phải theo chương (trang đệm)
const CH_LABEL = { 0: ['LỜI MỞ ĐẦU', 'はじめに'], 1: ch1.label, 2: ch2.label, 3: ch3.label, 9: ['KẾT LUẬN', 'まとめ'] }
// ảnh dọc đẹp dành cho trang ảnh tràn trang: mỗi ảnh chỉ dùng một lần trong cả sách (không lặp ảnh)
const HERO = [
  ['Ảnh toàn trang: những chiếc khung nón xếp chồng ở chợ Chuông', '全面写真：チュオンの市場に積み重ねられた笠の骨組み'],
  ['Ảnh toàn trang: người bán bên những chồng nón trong phiên chợ Chuông', '全面写真：積まれた笠に囲まれて座るチュオンの市場の売り手たち'],
  ['Ảnh toàn trang: phiên chợ lá lụi lúc tờ mờ sáng', '全面写真：夜明け前のチュオンの市場に並ぶライ葉'],
]
/**
 * trang đệm khép cặp trang: ảnh dọc đẹp tràn trang (HERO) → hết thì trang ảnh có khung (2 ảnh kho, có chú thích)
 * → hết nữa thì trang tranh nét mảnh. Không phóng ảnh kho (có thể nhỏ / ngang / tài liệu) ra tràn trang.
 */
function padPage(pool, chapter, label) {
  const hero = HERO.shift()
  if (hero) return photoPage(hero, chapter)
  const p = new Page({ chapter })
  runningHead(p, label ?? CH_LABEL[chapter] ?? ['NÓN LÁ LÀNG CHUÔNG', 'チュオン村のノンラー'])
  let y = TOP + 4
  for (const r of [R.wide, R.cin]) {
    const cap = pool.shift()
    if (!cap) break
    y = figure(p, p.x0, y, CW, CW * r, cap) + 22
  }
  if (y < TOP + 100) {
    shortPool.push(p.n)
    const ih = p.cw * (310 / 640)
    p.add({ ...DECO('vong-non', p.x0 + 40, 150, p.cw - 80, p.cw - 80, 0.12), name: 'Hình vẽ' }, { ...DECO('still-non', p.x0, BOT - ih - 20, p.cw, ih, 0.95), name: 'Hình vẽ' })
  }
  return p
}
/** trang kế tiếp phải là trang trái: chèn một trang ảnh từ kho nếu cần */
function padLeft(pool, chapter, label) {
  if ((pages.length + 1) % 2 !== 0) padPage(pool, chapter, label)
}

/** đầu trang: trái = tên sách, phải = tên chương */
function runningHead(p, label) {
  const acc = ACC[p.chapter] ?? C.gold
  const text = p.side === 'left' ? ['NÓN LÁ LÀNG CHUÔNG', 'チュオン村のノンラー'] : [strip(label[0]).toUpperCase(), strip(label[1])]
  p.add(
    T(p.x0, 30, p.cw, 14, text, { size: S.run, tracking: 1.6, color: C.muted, align: p.side === 'left' ? 'left' : 'right', lh: 1.2, jaFont: F.jaSans, name: 'Đầu trang' }),
    HL(p.x0, 52, p.cw, C.line, 0.5),
    p.side === 'left' ? RECT(p.x0, 50.6, 30, 2.4, acc, { name: 'Vạch màu' }) : RECT(p.x1 - 30, 50.6, 30, 2.4, acc, { name: 'Vạch màu' })
  )
}

/**
 * đầu mục lớn kiểu tạp chí: dòng chương viết tay + tên mục + vạch màu; góc phải là số mục rất to in nhạt
 * (mục không đánh số thì là hình vẽ nét mảnh của chương) → trả y tiếp theo
 */
const SEC_ICON = { 0: 'non', 1: 'non', 2: 'tool-quay-non', 3: 'tre-mang', 9: 'non' } // chương 3 (ghi nhận, bảo tồn, kế nghiệp): "tre già măng mọc"
const SEC_KICKER = { 9: ['Khép lại hành trình', '旅の終わりに'] }
function sectionHead(p, y, num, title, kicker) {
  const acc = ACC[p.chapter] ?? C.gold
  const x = p.x0
  const side = num ? 150 : 96
  const tw = p.cw - side
  const o = { size: S.sec, font: F.head, lh: 1.2, jaSize: 27 }
  const th = textH(title, tw, o)
  const kick = kicker ?? SEC_KICKER[p.chapter] ?? CH_LABEL[p.chapter]
  if (num) p.add(T(p.x1 - 190, y - 8, 190, 116, [num, null], { font: F.head, size: 96, color: acc, lh: 1.1, align: 'right', opacity: 0.22, name: 'Nền số mục' }))
  else p.add({ ...DECO(SEC_ICON[p.chapter] ?? 'non', p.x1 - 80, y - 6, 80, 80, 0.9), name: 'Hình vẽ' })
  if (kick) p.add(T(x, y, tw, 24, kick.map(strip), { font: F.hand, size: 19, lh: 1.2, jaSize: 16, color: acc, jaFont: F.jaHand, name: 'Dòng chương' }))
  const ty = y + 32
  p.add(T(x, ty, tw, th, title, { ...o, color: C.title, jaFont: F.jaHead, name: 'Tên mục' }))
  const end = ty + th + 14
  p.add(HL(x, end, 56, acc, 1.4))
  return Math.max(end + 26, y + 100)
}

/** tiêu đề nhỏ (có thể kèm số mục cấp 3: "1.3.1") → chiều cao */
const blockOpt = { size: S.block, font: F.head, lh: 1.25, jaSize: 20 }
const blockLabel = (h, num) => (num ? [`${num}  ${h[0]}`, `${num}　${h[1]}`] : h)
const blockHeight = (h, w, num) => textH(blockLabel(h, num), w, blockOpt) + 14
function blockHead(p, y, h, num, x = p.x0, w = p.cw) {
  const acc = ACC[p.chapter]
  const pair = blockLabel(h, num)
  const hh = textH(pair, w, blockOpt)
  p.add(T(x, y, w, hh, pair, { ...blockOpt, weight: 700, color: acc, jaFont: F.jaHead, name: 'Tiêu đề nhỏ' }))
  return y + blockHeight(h, w, num)
}

/** tranh, giấy chứng nhận, bài báo: hiện trọn trong khung (không cắt mất mép như ảnh chụp) */
const fitOf = (cap) => (/tranh|Giấy|Bằng công nhận|Bài báo|Chứng nhận/.test(cap?.[0] ?? '') ? 'contain' : 'cover')
/** ảnh + chú thích → y tiếp theo */
const capOpt = { size: S.cap, lh: 1.4 }
const capH = (cap, w) => textH(cap, w, capOpt)
function figure(p, x, y, w, h, cap, o = {}) {
  p.add(IMG(x, y, w, h, cap, o))
  if (o.noCaption) return y + h + 8
  const ch = capH(cap, w)
  p.add(T(x, y + h + 6, w, ch, cap, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
  return y + h + 6 + ch
}

/**
 * ảnh kiểu polaroid (xen kẽ với ảnh khung thường để các trang không cùng một khuôn): khung trắng, chú thích viết tay
 * trong khung, nghiêng nhẹ, băng keo giấy ở mép trên. Cả nhóm xoay quanh tâm khung → tính lại vị trí từng phần tử.
 * w = bề rộng khung, r = tỉ lệ ảnh → trả y dưới khung
 */
const POLA = { pad: 10 }
const polaCapO = { font: F.hand, size: 15, lh: 1.25, jaSize: 12.5 }
// chú thích trong khung: bỏ phần nguồn sau dấu "—" (nguồn ảnh vẫn ghi ở trang Nguồn ảnh)
// chỉ bỏ khi phần sau "—" là nguồn ảnh; phần sau "—" là nội dung (vd. "— nguyên liệu … tại Bảo tàng …") thì giữ (góp ý: chú thích cụt)
const SRC_TAIL = /\s+[—―]\s*(nguồn|ảnh|Nguồn|Ảnh|出典|写真)[:：].*$/
const polaCap = (cap) => [strip(cap[0]).replace(SRC_TAIL, ''), strip(cap[1] ?? '').replace(SRC_TAIL, '')]
const polaBand = (w, cap) => textH(polaCap(cap), w - 2 * POLA.pad, polaCapO) + 16
const polaH = (w, r, cap) => (w - 2 * POLA.pad) * r + POLA.pad + polaBand(w, cap)
function polaroid(p, x, y, w, r, cap, rot) {
  const iw = w - 2 * POLA.pad
  const ih = iw * r
  const band = polaBand(w, cap)
  const fh = ih + POLA.pad + band
  const els = [
    RECT(x, y, w, fh, '#fffdf8', { stroke: '#e3d6bb', sw: 0.6, name: 'Khung polaroid' }),
    { ...IMG(x + POLA.pad, y + POLA.pad, iw, ih, cap), name: 'Ảnh polaroid' },
    T(x + POLA.pad, y + POLA.pad + ih + 7, iw, band - 14, polaCap(cap), { ...polaCapO, color: C.ink2, align: 'center', jaFont: F.jaHand, name: 'Chú thích polaroid' }),
  ]
  const tape = RECT(x + w / 2 - 42, y - 11, 84, 22, '#e9d9b4', { opacity: 0.78, name: 'Băng keo' })
  const gx = x + w / 2
  const gy = y + fh / 2
  const a = (rot * Math.PI) / 180
  for (const e of [...els, tape]) {
    const cx = e.x + e.w / 2 - gx
    const cy = e.y + e.h / 2 - gy
    e.x = r1(gx + cx * Math.cos(a) - cy * Math.sin(a) - e.w / 2)
    e.y = r1(gy + cx * Math.sin(a) + cy * Math.cos(a) - e.h / 2)
    e.rot = e === tape ? rot - 3 : rot
  }
  p.add(els, tape)
  return y + fh
}
/** ảnh rộng cả khối trên trang p tại y (khung tỉ lệ r): trang thứ 3, 6, 9… dùng kiểu polaroid, còn lại khung thường → y dưới cùng */
const polaOn = (p, cap) => p.n % 3 === 0 && fitOf(cap) === 'cover'
function wideFigure(p, y, r, cap) {
  if (polaOn(p, cap)) {
    const w = CW * 0.86
    return polaroid(p, p.x0 + (CW - w) / 2, y + 6, w, r, cap, p.side === 'left' ? -1.6 : 1.6) + 8
  }
  return figure(p, p.x0, y, CW, CW * r, cap, { fit: fitOf(cap) })
}
/** chiều cao ảnh rộng cả khối (kể cả chú thích) cho khung tỉ lệ r */
const wideH = (p, r, cap) => (polaOn(p, cap) ? polaH(CW * 0.86, r, cap) + 14 : CW * r + 6 + capH(cap, CW))

/** trích dẫn lớn */
const quoteOpt = (size) => ({ size, font: F.head, lh: 1.45, jaSize: jaPt(size) - 1 })
function quote(p, y, pair, x = p.x0, w = p.cw, o = {}) {
  const opt = quoteOpt(o.size ?? S.quote)
  const h = textH(pair, w, opt)
  p.add(T(x, y, w, h, pair, { ...opt, italic: true, color: o.color ?? C.ink2, jaFont: F.jaHead, align: o.align ?? 'left', name: 'Trích dẫn' }))
  return y + h
}

/** chú thích cuối trang: neo đáy trang, trả y trên cùng của khối */
function footnotes(p, notes) {
  const pair = join(notes)
  const h = textH(pair, p.cw, { size: S.note, lh: 1.45, paraGap: 3 })
  const y = BOT - h
  p.add({ ...HL(p.x0, y - 10, 90, C.line, 0.6), name: 'Kẻ chú thích' }, T(p.x0, y, p.cw, h, pair, { size: S.note, lh: 1.45, paraGap: 3, color: C.muted, jaFont: F.jaSans, name: 'Chú thích' }))
  return y - 26
}
const notesH = (notes) => textH(join(notes), CW, { size: S.note, lh: 1.45, paraGap: 3 }) + 26

// ── tách đoạn văn khi sang trang: mỗi ngôn ngữ tách ở ranh giới câu, phần đầu vừa chỗ còn lại
const sentencesVi = (s) => s.split(/(?<=[.!?…][”"»)]?)\s+(?=[“"(]?\p{Lu})/u)
const sentencesJa = (s) => s.split(/(?<=[。！？][」』）]*)(?![」』）])/u).filter(Boolean)
function splitPara(q, w, opt, room) {
  if (room < opt.size * opt.lh * 2 + 4) return null
  const vs = sentencesVi(q[0])
  const js = sentencesJa(q[1] ?? '')
  if (vs.length < 2 || js.length < 2) return null
  let k = vs.length - 1
  while (k > 0 && textH([vs.slice(0, k).join(' '), null], w, opt) > room) k--
  if (!k) return null
  const f = vs.slice(0, k).join(' ').length / q[0].length
  let best = 0
  let bestD = Infinity
  for (let j = 1; j < js.length; j++) {
    const head = js.slice(0, j).join('')
    if (textH(['', head], w, opt) > room) break
    const d = Math.abs(head.length / q[1].length - f)
    if (d < bestD) [best, bestD] = [j, d]
  }
  if (!best) return null
  return [
    [vs.slice(0, k).join(' '), js.slice(0, best).join('')],
    [vs.slice(k).join(' '), js.slice(best).join('')],
  ]
}

/** dòng chảy nội dung: tự sang trang khi hết chỗ; trang chỉ có chữ thì đặt ảnh từ kho ảnh của chương */
class Flow {
  constructor(chapter, label, pool = []) {
    this.chapter = chapter
    this.runLabel = label
    this.pool = pool
    this.p = null
    this.y = TOP
    this.bot = BOT
    this.pending = null // ảnh sẽ đặt ngay sau đoạn văn đang chảy → chừa chỗ cho nó
  }
  page(o = {}) {
    this.fill()
    this.p = new Page({ chapter: this.chapter, ...o })
    if (!o.bare) runningHead(this.p, o.label ?? this.runLabel)
    this.y = o.y ?? TOP
    this.bot = BOT
    this.txt = 0 // chiều cao chữ thân bài đã đặt trên trang này
    return this.p
  }
  get room() {
    return this.bot - this.y
  }
  get fresh() {
    return this.y <= TOP + 1
  }
  /** chỗ chừa cho ảnh lấp ở trang chưa có ảnh */
  get reserve() {
    if (!this.p || this.p.hasImg || (!this.pool.length && !this.pending)) return 0
    return CW * R.cin + capH(this.pending ?? this.pool[0], CW) + 26
  }
  /**
   * trang hiện tại chưa có ảnh → đặt một ảnh thật ngay dưới chữ, khung chuẩn lớn nhất còn vừa (4:3 → 3:2 → 16:9 → 2:1);
   * phần dư (nhỏ hơn một bậc khung) settle() chia vào khoảng cách giữa các khối — không để khoảng thủng giữa trang
   */
  fill() {
    if (!this.p || this.p.hasImg || !this.pool.length) return false
    const cap = this.pool[0]
    const y = this.fresh ? this.y : this.y + 12
    const r = [R.std, R.wide, R.cin, R.pan].find((x) => this.bot - y >= wideH(this.p, x, cap))
    if (!r) return false
    const n0 = this.p.els.length
    this.y = wideFigure(this.p, y, r, cap) + 18
    this.pool.shift()
    // khung chuẩn nhảy bậc để lại dải trống ở đáy → hạ ảnh xuống giữa khoảng trống
    const gap = this.bot - (this.y - 18)
    if (gap > 40 && gap < 180) {
      this.p.els.slice(n0).forEach((e) => (e.y = r1(e.y + gap / 2)))
      this.y += gap / 2
    }
    return true
  }
  /**
   * lấp phần còn trống cuối trang bằng ảnh từ kho — chỉ dùng khung tỉ lệ chuẩn: một ảnh rộng cả khối (4:3 → 2:1),
   * chật hơn thì hai ảnh nhỏ cạnh nhau (4:3 / 3:2); còn ít chỗ nữa thì để vignette() vẽ hình nét mảnh
   */
  fillRest() {
    while (this.p && this.pool.length) {
      const y = this.fresh ? this.y : this.y + 6
      const room = this.bot - y
      const cap = this.pool[0]
      const r = [R.std, R.wide, R.cin, R.pan].find((x) => room >= wideH(this.p, x, cap))
      if (r) {
        this.y = wideFigure(this.p, y, r, cap) + 18
        this.pool.shift()
        continue
      }
      if (this.pool.length < 2) break
      const w = (CW - 14) / 2
      const two = this.pool.slice(0, 2)
      const ch2 = Math.max(...two.map((c) => capH(c, w)))
      const r2 = [R.std, R.wide].find((x) => room >= w * x + 6 + ch2)
      if (!r2) break
      two.forEach((c, i) => figure(this.p, this.p.x0 + i * (w + 14), y, w, w * r2, c, { fit: fitOf(c) }))
      this.pool.splice(0, 2)
      this.y = y + w * r2 + 6 + ch2 + 18
    }
  }
  /**
   * Luật trang đôi (cả sách): mỗi đơn vị nội dung (mục, mục con, phần nguyên liệu, từng công đoạn…) chiếm trọn
   * một hoặc nhiều trang đôi — bắt đầu ở trang trái, kết thúc ở cuối trang phải, không dừng giữa trang đôi.
   * close(): lấp chỗ trống cuối đơn vị bằng ảnh; nếu đơn vị dừng ở trang trái thì trang phải là một ảnh tràn trang.
   */
  close() {
    if (!this.p) return
    this.fill()
    this.fillRest()
    if (this.p.side === 'left') padPage(this.pool, this.chapter, this.runLabel)
    this.p = null
  }
  /** mở đơn vị mới ở trang trái */
  unit(o = {}) {
    this.close()
    padLeft(this.pool, this.chapter, this.runLabel)
    return this.page(o)
  }
  end() {
    this.close()
  }
  need(h) {
    if (!this.p || (this.y + h > this.bot && !this.fresh)) this.page()
    return this.p
  }
  /** khối cao h vẽ bằng draw(p, y) */
  place(h, draw, gap = 20) {
    this.need(h)
    draw(this.p, this.y)
    this.y += h + gap
  }
  section(num, title, kicker) {
    this.unit()
    this.y = sectionHead(this.p, this.y, num, title, kicker)
    this.head = { p: this.p, y: this.y }
    return this.p
  }
  block(h, num) {
    // mục con có số (1.3.1…) là một đơn vị trang đôi riêng, trừ khi nằm ngay dưới tiêu đề mục lớn
    if (num && !(this.head?.p === this.p && this.head.y === this.y)) this.unit()
    const bh = blockHeight(h, CW, num)
    this.need(bh + BODY.size * BODY.lh * 3 + this.reserve)
    const from = this.p.els.length
    const y0 = this.y
    this.y = blockHead(this.p, this.y, h, num)
    this.sub = { p: this.p, from, y0, y1: this.y }
    return this.p
  }
  /** trang hiện tại mới chỉ có tiêu đề mục con vừa đặt (chưa có chữ bên dưới) */
  headOnly() {
    const s = this.sub
    return !!s && s.p === this.p && s.y1 === this.y
  }
  /** tiêu đề vừa đặt mà chưa có chữ nào bên dưới → chuyển cả tiêu đề sang trang mới (không bỏ tiêu đề lại cuối trang) */
  carryHead() {
    const s = this.sub
    if (!this.headOnly() || s.y0 <= TOP + 1) return false
    const els = this.p.els.splice(s.from)
    const x0 = this.p.x0
    this.y = s.y0
    this.fillRest()
    this.page()
    // trang trái / phải có lề khác nhau → dời cả x lẫn y
    const dx = this.p.x0 - x0
    const d = this.y - s.y0
    els.forEach((e) => {
      e.x = r1(e.x + dx)
      e.y = r1(e.y + d)
    })
    this.p.add(els)
    this.y += s.y1 - s.y0
    this.sub = { ...s, p: this.p, from: this.p.els.length - els.length, y0: s.y0 + d, y1: this.y }
    return true
  }
  /** đoạn văn: gộp các đoạn cùng trang vào một khối, tách đoạn khi sang trang */
  prose(paras, o = {}) {
    const opt = { size: o.size ?? BODY.size, lh: o.lh ?? BODY.lh, paraGap: o.paraGap ?? 8, jaSize: o.jaSize ?? (o.size ? jaPt(o.size, 1.14) : BODY.jaSize) }
    const w = () => this.p.cw
    const queue = paras.map((q) => [...q])
    let acc = []
    const keep = () => (typeof o.keep === 'function' ? o.keep() : (o.keep ?? 0))
    const hard = () => this.bot - keep() - (o.free ? 0 : this.reserve)
    const limit = () => (o.budget === false ? hard() : Math.min(hard(), this.y + TXT_PAGE - (this.txt ?? 0)))
    const flush = () => {
      if (!acc.length) return
      const pair = join(acc)
      const h = textH(pair, w(), opt)
      this.p.add(T(this.p.x0, this.y, w(), h, pair, { ...opt, align: o.align ?? 'justify', color: o.color ?? C.ink, jaFont: F.jaBody, italic: o.italic, font: o.font, name: o.name ?? 'Đoạn văn' }))
      this.y += h
      this.txt = (this.txt ?? 0) + h
      acc = []
    }
    if (!this.p) this.page()
    while (queue.length) {
      const trial = [...acc, queue[0]]
      if (this.y + textH(join(trial), w(), opt) <= limit()) {
        acc = trial
        queue.shift()
        continue
      }
      // đoạn đầu trang mới / ngay dưới tiêu đề vừa đặt: vừa trang (chỉ thiếu phần chừa cho ảnh) thì đặt trọn đoạn —
      // không tách đoạn, không đẩy tiêu đề sang trang sau
      if (!acc.length && (this.fresh || this.headOnly()) && this.y + textH(join(trial), w(), opt) <= this.bot - keep()) {
        acc = trial
        queue.shift()
        continue
      }
      // không cắt đoạn văn qua trang: đoạn không vừa thì sang trang sau nguyên đoạn, chỗ trống lấp bằng ảnh;
      // chỉ tách (ở ranh giới câu) khi một đoạn dài hơn cả một trang trống
      if (!acc.length && (this.fresh || (this.headOnly() && this.sub.y0 <= TOP + 1))) {
        const sp = splitPara(queue[0], w(), opt, hard() - this.y)
        if (sp) {
          acc.push(sp[0])
          queue[0] = sp[1]
        } else acc.push(queue.shift())
      }
      flush()
      if (queue.length && !this.carryHead()) {
        this.fillRest()
        this.page()
      }
    }
    flush()
    this.y += o.after ?? 16
  }
  /**
   * Một chủ đề = trọn một cặp trang (luật trang đôi), chữ chia cân hai trang ở ranh giới đoạn, mỗi trang có ảnh khung chuẩn:
   *   trái: [tiêu đề] + nhóm đoạn 1 + ảnh lấp phần còn lại · phải: nhóm đoạn 2 + ảnh (hết chữ thì trang phải là ảnh tràn trang).
   * Chữ dài hơn sức chứa của cặp trang → trang chỉ in các đoạn đầu (nguyên văn), toàn văn mở bằng nút "Đọc thêm".
   * o = { h, num, paras, images: [cap | { video: cap }], title (cho khung Đọc thêm) }
   */
  story(o) {
    // chữ dài hơn hạn mức một cặp trang → in tiếp ở cặp trang sau (không tiêu đề), mỗi trang vẫn có ảnh
    let rest = this.storySpread(o)
    while (rest?.paras.length) rest = this.storySpread({ paras: rest.paras, images: rest.images, title: o.title })
  }
  storySpread(o) {
    const underHead = (o.here || (this.head?.p === this.p && this.head.y === this.y)) && this.p?.side === 'left'
    if (!underHead) this.unit()
    const L = this.p
    let y = this.y
    // chú thích cuối trang của đoạn đầu (đoạn đầu luôn ở trang trái): neo đáy trang trái, chữ + ảnh chảy phía trên
    const LB = o.notes ? footnotes(L, o.notes) : BOT
    const bot = (pg) => (pg === L ? LB : BOT)
    const opt = { size: BODY.size, lh: BODY.lh, paraGap: 8, jaSize: BODY.jaSize }
    const H = (ps) => (ps.length ? textH(join(ps), CW, opt) : 0)
    // đoạn dẫn của mục lớn (o.lead) đứng trước tiêu đề chủ đề đầu tiên, cùng một cặp trang
    if (o.lead?.length) {
      const pair = join(o.lead)
      const h = textH(pair, CW, opt)
      L.add(T(L.x0, y, CW, h, pair, { ...opt, align: 'justify', color: C.ink2, jaFont: F.jaBody, name: 'Đoạn dẫn' }))
      y += h + 26
    }
    if (o.h) {
      y = blockHead(L, y, o.h, o.num)
      this.head = null
    }
    const imgs = [...(o.images || [])]
    const nextImg = () => imgs.shift() ?? this.pool.shift() ?? null
    const capOf = (im) => (im ? capH(im.video ?? im, CW) : 0)
    const minImg = CW * R.cin + 30
    const moreH = o.more ? 40 : 0
    const capL = Math.min(LB - y - minImg - 24, TXT_PAGE - (y > TOP + 160 && o.lead?.length ? 120 : 0))
    const capR = Math.min(BOT - TOP - minImg - 24, TXT_PAGE)
    const ps = o.paras
    // trái: nhiều đoạn nhất vừa chỗ; phải: phần còn lại (vừa thì thôi, không thì cắt bớt + Đọc thêm)
    let k = 0
    while (k < ps.length && H(ps.slice(0, k + 1)) <= capL) k++
    if (k === 0 && ps.length) k = 1 // đoạn đầu dài hơn chỗ trống: vẫn đặt (khung chữ tự co ảnh lại)
    let m = ps.length - k
    const cut = () => H(ps.slice(k, k + m)) + (k + m < ps.length ? moreH : 0) > capR
    while (m > 0 && cut()) m--
    // cân hai trang: chuyển bớt đoạn cuối trang trái sang trang phải khi trang trái dày hơn hẳn
    while (k > 1 && m > 0 && H(ps.slice(0, k)) - H(ps.slice(k, k + m)) > 140 && H(ps.slice(k - 1, k + m)) + (k + m < ps.length ? moreH : 0) <= capR) {
      k--
      m++
    }
    // trang trái không còn chỗ cho ảnh mà trang phải còn chỗ → chuyển đoạn cuối trang trái sang phải (trang nào cũng có ảnh);
    // trang trái vẫn còn tiêu đề / đoạn dẫn đứng đầu nên không trơ trọi
    // (chỉ chuyển khi chắc trang trái đặt vừa ảnh — khung nhỏ nhất 2:1, kể cả kiểu polaroid)
    const firstImg = imgs.find((im) => !im.video) ?? this.pool[0]
    const fitsImg = (kk) => !firstImg || LB - (y + (kk ? H(ps.slice(0, kk)) + 18 : 0)) >= wideH(L, R.pan, firstImg)
    if (!fitsImg(k)) {
      let kk = k - 1
      while (kk >= 0 && !fitsImg(kk)) kk--
      // không cách nào vừa ảnh: trang mở mục chỉ còn tiêu đề + đoạn dẫn thì chuyển hết đoạn sang phải, chỗ trống trang trái
      // là hình vẽ nét mảnh (vignette) — còn hơn một trang trái toàn chữ
      if (kk < 0 && (o.lead?.length || o.h) && LB - y >= 170) kk = 0
      if (kk >= 0 && (kk > 0 || o.lead?.length || o.h) && H(ps.slice(kk, k + m)) + (k + m < ps.length ? moreH : 0) <= capR) {
        m += k - kk
        k = kk
      }
    }
    const more = !!o.more && k + m < ps.length
    const rest = { paras: more ? [] : ps.slice(k + m), images: imgs }
    const left = ps.slice(0, k)
    const right = ps.slice(k, k + m)
    const put = (pg, yy, group) => {
      if (!group.length) return yy
      const pair = join(group)
      const h = textH(pair, CW, opt)
      pg.add(T(pg.x0, yy, CW, h, pair, { ...opt, align: 'justify', color: C.ink, jaFont: F.jaBody, name: 'Đoạn văn' }))
      return yy + h + 18
    }
    const media = (pg, yy) => {
      const im = nextImg()
      if (!im) return yy
      const ch = capOf(im)
      const room = bot(pg) - yy - 6 - ch
      const r = im.video ? [R.sq, R.std, R.wide, R.cin, R.pan].find((x) => CW * x <= room) : [R.sq, R.std, R.wide, R.cin, R.pan].find((x) => wideH(pg, x, im) <= bot(pg) - yy)
      if (!r) {
        imgs.unshift(im)
        return yy
      }
      if (im.video) {
        pg.add(VIDEO(pg.x0, yy, CW, CW * r, VIDEO_SRC, { poster: VIDEO_POSTER, name: 'Video trình diễn' }))
        pg.add(T(pg.x0, yy + CW * r + 6, CW, ch, im.video, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích video' }))
        return yy + CW * r + 6 + ch + 18
      }
      return wideFigure(pg, yy, r, im) + 18
    }
    y = put(L, y, left)
    y = media(L, y)
    this.y = y
    if (!L.hasImg) {
      // ảnh của chính chủ đề lấp trước ảnh kho (ảnh kho dễ lạc đề); chừa một ảnh cho trang phải nếu trang phải không có video
      const still = imgs.filter((im) => !im.video)
      const take = still.slice(0, still.length - (right.length && !imgs.some((im) => im.video) ? 1 : 0))
      const n0 = this.pool.length
      take.forEach((im) => imgs.splice(imgs.indexOf(im), 1))
      this.pool.unshift(...take)
      this.fillRest()
      imgs.push(...this.pool.splice(0, Math.max(0, this.pool.length - n0)))
      y = this.y
    }
    if (!right.length && !more) {
      // hết chữ ở trang trái → trang phải là ảnh tràn trang (nhịp "trang ảnh lớn" xen "trang kể chuyện")
      const hero = HERO.shift()
      this.p = null
      if (hero) {
        photoPage(hero, this.chapter)
        return rest
      }
      // hết ảnh dọc đẹp → trang ảnh: hai ảnh khung chuẩn (3:2 + 16:9) có chú thích, không cắt tràn ảnh tài liệu
      const a1 = nextImg()
      const a2 = nextImg()
      const pg = this.page()
      let yy = TOP + 4
      for (const [im, r] of [
        [a1, R.wide],
        [a2, R.cin],
      ]) {
        if (!im || im.video) continue
        yy = figure(pg, pg.x0, yy, CW, CW * r, im) + 22
      }
      this.y = yy
      this.close()
      return rest
    }
    const Rp = this.page()
    let ry = put(Rp, TOP, right)
    if (more) {
      Rp.add(MORE(Rp.x0, ry - 6, o.title ?? o.h, ps.map((q) => q[0]), ps.map((q) => q[1]), ACC[this.chapter]))
      ry += moreH
    }
    const n0 = Rp.els.length
    this.y = media(Rp, ry)
    // ảnh trang phải không lấp kín đáy (khung chuẩn nhảy bậc) → hạ ảnh xuống giữa khoảng trống, không để một dải trống ở đáy
    const gap = BOT - (this.y - 18)
    // (khoảng trống từ 180pt trở lên để close() lấp thêm ảnh)
    if (gap > 40 && gap < 180 && Rp.els.length > n0) {
      Rp.els.slice(n0).forEach((e) => (e.y = r1(e.y + gap / 2)))
      this.y += gap / 2
    }
    this.p = Rp
    this.close()
    return rest
  }
  /** ảnh rộng cả khối, khung 3:2 (chật thì 16:9; không vừa thì sang trang) */
  figure(cap, o = {}) {
    const ch = capH(cap, CW)
    const ratios = o.ratio ? [o.ratio] : [R.wide, R.cin]
    if (!this.p) this.page()
    let r = ratios.find((x) => this.room >= CW * x + 6 + ch)
    if (!r) {
      this.page()
      r = ratios[0]
    }
    this.y = figure(this.p, this.p.x0, this.y, CW, CW * r, cap) + 22
  }
  /** n ảnh cạnh nhau, khung 4:3 (hoặc tỷ lệ o.ratio) */
  row(caps, o = {}) {
    const n = caps.length
    const gap = 14
    const w = (CW - gap * (n - 1)) / n
    const h = w * (o.ratio ?? R.std)
    const ch = Math.max(...caps.map((c) => capH(c, w)))
    if (!this.p || this.room < h + 6 + ch) this.page()
    caps.forEach((c, i) => figure(this.p, this.p.x0 + i * (w + gap), this.y, w, h, c, { fit: fitOf(c) }))
    this.y += h + 6 + ch + 22
  }
  /** lưới ảnh cols cột, khung 4:3 */
  gallery(caps, cols = 2, o = {}) {
    const gap = 14
    const rows = Math.ceil(caps.length / cols)
    const w = (CW - gap * (cols - 1)) / cols
    const h = w * (o.ratio ?? R.std)
    const ch = Math.max(...caps.map((c) => capH(c, w)))
    const need = rows * (h + 6 + ch) + (rows - 1) * 16
    if (!this.p || this.room < need) this.page()
    caps.forEach((c, i) => figure(this.p, this.p.x0 + (i % cols) * (w + gap), this.y + Math.floor(i / cols) * (h + 6 + ch + 16), w, h, c))
    this.y += need + 22
  }
  /**
   * Dãy thẻ (loại nón, nghệ nhân, chủ đề…): xếp đủ thẻ vào từng trang rồi dàn đều chỗ dư vào khoảng cách giữa các thẻ.
   * Trang cuối của dãy không dàn (nội dung tiếp theo chảy tiếp ngay bên dưới).
   */
  cards(items, measure, draw, o = {}) {
    const gap = o.gap ?? 24
    const hs = items.map(measure)
    let i = 0
    while (i < items.length) {
      if (!this.p) this.page()
      const start = this.y
      let j = i
      let used = 0
      // o.max: tối đa bao nhiêu thẻ một trang (phần còn lại lấp ảnh — trang không thành một bức tường chữ)
      while (j < items.length && (o.max == null || j - i < o.max) && start + used + hs[j] <= this.bot) used += hs[j++] + gap
      if (j === i) {
        if (!this.fresh) {
          this.page()
          continue
        }
        j = i + 1 // thẻ cao hơn cả trang: đặt luôn
        used = hs[i] + gap
      }
      const n = j - i
      const last = j === items.length
      const free = Math.max(0, this.bot - start - (used - gap))
      const spare = o.max || (last && free - gap >= (o.tail ?? 0)) ? 0 : free
      const extraGap = n > 1 ? Math.min(60, spare / (n - 1)) : 0
      let y = start
      for (let k = i; k < j; k++) {
        draw(this.p, y, items[k], hs[k])
        y += hs[k] + gap + extraGap
      }
      this.y = y
      i = j
      if (o.max) {
        o.fill?.(items[i - 1]) // ảnh riêng của thẻ (đúng người / đúng chủ đề) trước ảnh kho
        this.fillRest()
      }
      if (i < items.length) this.page()
    }
  }
  /** chú thích cuối trang: neo đáy trang hiện tại, chữ chảy phía trên; trang đã có chú thích thì gộp thành một khối */
  notes(notes) {
    if (!this.p) this.page()
    const all = this.notesOn === this.p ? [...this.noteList, ...notes] : notes
    if (this.notesOn === this.p) this.p.els = this.p.els.filter((e) => e.name !== 'Chú thích' && e.name !== 'Kẻ chú thích')
    this.notesOn = this.p
    this.noteList = all
    this.bot = footnotes(this.p, all)
  }
  /** đoạn văn có dấu chú thích (¹ ²…): chú thích nằm cuối đúng trang của đoạn văn đó */
  noted(paras, notes, o = {}) {
    const opt = { size: BODY.size, lh: BODY.lh, paraGap: 8, jaSize: BODY.jaSize }
    const prev = this.p && this.notesOn === this.p ? this.noteList : []
    const fits = () => this.y + textH(join(paras), CW, opt) <= BOT - notesH([...prev, ...notes])
    if (!this.p) this.page()
    else if (!fits() && !this.fresh && !this.carryHead()) {
      this.fillRest()
      this.page()
    }
    this.notes(notes)
    this.prose(paras, { free: true, ...o })
  }
  /** khung ghi chú nền màu */
  note(pair, o = {}) {
    const opt = { size: o.size ?? 15.5, lh: 1.55, jaSize: jaPt(o.size ?? 15.5) }
    const h = textH(pair, CW - 36, opt)
    this.place(h + 32, (p, y) => p.add(RECT(p.x0, y, p.cw, h + 32, TINT[this.chapter], { radius: 8, name: 'Khung ghi chú' }), T(p.x0 + 18, y + 16, p.cw - 36, h, pair, { ...opt, italic: o.italic ?? true, color: C.ink2, jaFont: F.jaBody, name: 'Ghi chú' })))
  }
  quote(pair, o = {}) {
    const w = CW - (o.inset ?? 0) * 2
    const h = textH(pair, w, quoteOpt(o.size ?? S.quote))
    this.place(h, (p, y) => quote(p, y, pair, p.x0 + (o.inset ?? 0), w, o), o.gap ?? 22)
  }
  label(pair) {
    this.place(16, (p, y) => p.add(T(p.x0, y, p.cw, 16, pair, { size: S.label, tracking: 2.4, weight: 700, color: ACC[this.chapter] ?? C.muted, jaFont: F.jaSans, name: 'Nhóm' })), 12)
  }
}

/** kho ảnh lấp trang chỉ có chữ, theo chương (ảnh nhóm tự chụp; chú thích đúng nội dung ảnh) */
const POOL = {
  0: [
    ['Phiên chợ Chuông họp từ khi trời còn tối, người bán ngồi giữa nón và lá', 'まだ暗いうちから開かれるチュオンの市場：笠と葉に囲まれた売り手たち'],
    ['Chiếc nón trắng vừa hoàn thiện', '仕上がったばかりの白いノンラー'],
    ['Nón lá trắng bên tà áo dài trước sân đình Chuông', 'チュオン村の亭の前で、アオザイとともに並ぶ白いノンラー'],
    ['Người bán nón trao đổi trong phiên chợ Chuông lúc tờ mờ sáng', '夜明け前のチュオンの笠市場で、笠をやりとりする売り手たち'],
    ['Người thợ chằm nón, từng mũi kim xuyên qua lớp lá', '葉を一針ずつ縫い留める笠職人'],
    ['Lòng nón lá trắng với chỉ nhôi đỏ – xanh', '赤と青のニョイの糸が見える白いノンラーの内側'],
  ],
  1: [
    ['Các kiểu nón cổ trưng bày tại Bảo tàng Phụ nữ Việt Nam', 'ベトナム女性博物館に展示された古いノンラー'],
    ['Nón và trang phục dân tộc trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ベトナム民族学博物館に展示された笠と民族衣装'],
    ['Chồng nón làng Chuông trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ベトナム民族学博物館に展示されたチュオン村の笠'],
    ['Nón lá trong tranh sơn dầu — Bảo tàng Mỹ thuật Việt Nam', '油彩画に描かれたノンラー — ベトナム美術博物館'],
    ['Người phụ nữ đội nón giữa cánh đồng — tranh tại Bảo tàng Mỹ thuật Việt Nam', '田んぼでノンラーをかぶる女性 — ベトナム美術博物館の絵画'],
    ['Nón trắng xếp thành từng chồng ở chợ Chuông', 'チュオンの市場に積み重ねられた白い笠'],
    ['Người bán nón giữa những chồng nón trắng ở chợ Chuông', 'チュオンの市場で白い笠の山に囲まれた売り手'],
    ['Nón cổ có trang trí hoa văn — Bảo tàng Phụ nữ Việt Nam', '模様で飾られた古い笠 — ベトナム女性博物館'],
    ['Chợ nón Chuông dưới mái che treo đèn lồng', '提灯の下がる屋根の下のチュオンの笠市場'],
    ['Người mua kẻ bán tấp nập trong phiên chợ nón Chuông', '売り手と買い手でにぎわうチュオンの笠市場'],
    ['Gian trưng bày nón và bằng khen tại một cơ sở làng Chuông', 'チュオン村の工房に並ぶ笠と表彰状'],
    // thêm khi giãn chữ: ảnh chưa dùng trong Drive của nhóm (bảo tàng, chợ, cơ sở làm nón), đã soát không trùng cảnh
    ['Các kiểu nón truyền thống trưng bày tại Bảo tàng Phụ nữ Việt Nam', 'ベトナム女性博物館に展示された伝統的な笠'],
    ['Chiếc nón rộng vành trong gian trưng bày của Bảo tàng Phụ nữ Việt Nam', 'ベトナム女性博物館の展示室にあるつばの広い笠'],
    ['Trang phục và nón của phụ nữ các dân tộc — Bảo tàng Phụ nữ Việt Nam', 'さまざまな民族の女性の衣装と笠 — ベトナム女性博物館'],
    ['Lòng một chiếc nón cổ, nan xòe đều quanh chóp — hiện vật Bảo tàng Phụ nữ Việt Nam', '放射状に骨が広がる古い笠の内側 — ベトナム女性博物館の所蔵品'],
    ['Người bán nón và vật liệu làm nón ở chợ Chuông', 'チュオンの市場で笠と材料を売る人々'],
  ],
  2: [
    ['Người thợ khâu những mũi cuối trên thân nón', '笠の胴に最後の針を通す職人'],
    ['Người thợ khâu nón ngay trong nếp nhà', '家の中で笠を縫う職人'],
    ['Nón đang lợp lá, chỉ màu néo các lớp — trưng bày tại Bảo tàng Dân tộc học Việt Nam', '色糸で葉の層を留めながら葺いている途中の笠 — ベトナム民族学博物館の展示'],
    ['Khung nón và vành nứa — trưng bày tại Bảo tàng Dân tộc học Việt Nam', '笠の骨組みとヌア竹の輪 — ベトナム民族学博物館の展示'],
    ['Nguyên liệu và các lớp của chiếc nón — trưng bày tại Bảo tàng Dân tộc học Việt Nam', '笠の材料と層 — ベトナム民族学博物館の展示'],
    ['Người bán phân loại lá lụi ở chợ Chuông', 'チュオンの市場でライ葉を仕分ける売り手'],
    ['Bó vòng nứa vót sẵn bày bán ở chợ Chuông', 'チュオンの市場に並ぶ、削ったヌア竹の輪の束'],
    ['Người bán bên những chiếc nón lợp dở ở chợ Chuông', 'チュオンの市場で、葺きかけの笠のそばに座る売り手'],
    ['Lá lụi bày bán trước cổng đình Chuông', 'チュオン村の亭の門前で売られるライ葉'],
    ['Người bán nón bên những chồng nón trắng ở chợ Chuông', 'チュオンの市場で白い笠の山の横に座る売り手'],
    ['Nguyên liệu và dụng cụ làm nón bày trên bàn — Bảo tàng Dân tộc học Việt Nam', '机に並べられた笠づくりの材料と道具 — ベトナム民族学博物館'],
    ['Nón lá và trang phục trong gian trưng bày nghề nón — Bảo tàng Dân tộc học Việt Nam', '笠づくりの展示室に並ぶノンラーと衣装 — ベトナム民族学博物館'],
  ],
  3: [
    // thứ tự = thứ tự lấp trang của chương 3 (ảnh đúng đoạn văn bên cạnh): mở mục 3.1 → OCOP → ghi nhận → nghệ nhân
    ['Bàn tay người bán nâng chồng nón trắng', '白い笠の束を持ち上げる売り手の手'],
    ['Người bán ngồi giữa lá, vành và nón trong phiên chợ Chuông', 'チュオンの市場で、葉や輪、笠に囲まれて座る売り手たち'],
    ['Du khách nước ngoài học làm nón trong một xưởng ở làng Chuông', 'チュオン村の工房で笠づくりを学ぶ外国人観光客'],
    ['Nón chùm — sản phẩm OCOP 4 sao của cơ sở Lê Văn Tuy', 'レー・ヴァン・トゥイ工房のOCOP四つ星製品「束ね笠」'],
    ['Giấy khen của Bảo tàng Dân tộc học Việt Nam tặng ông Lê Văn Tuy', 'ベトナム民族学博物館からレー・ヴァン・トゥイ氏に贈られた表彰状'],
    ['Bằng công nhận Nghệ nhân làng nghề Việt Nam của ông Lê Văn Tuy', 'レー・ヴァン・トゥイ氏の「ベトナム工芸村職人」認定証'],
    ['Trải nghiệm làm nón tại nhà nghệ nhân Lê Văn Tuy', '職人レー・ヴァン・トゥイの工房での体験'],
    // ba nghệ nhân giữ nghề: nón xưa trong bảo tàng, người làng nối nghề
    ['Nón làng Chuông xếp chồng — Bảo tàng Dân tộc học Việt Nam', '積み重ねられたチュオン村の笠 — ベトナム民族学博物館'],
    ['Nón lá và trang phục trong gian trưng bày nghề nón — Bảo tàng Dân tộc học Việt Nam', '笠づくりの展示室のノンラーと衣装 — ベトナム民族学博物館'],
    ['Người dân ngồi làm nón trong một cơ sở ở làng Chuông', 'チュオン村の工房で笠づくりをする人々'],
    // những người đưa nghề đi tiếp: mẫu nón mới
    ['Khách ghé một cơ sở bày nón vẽ, nón lụa ở làng Chuông', '絵付けや絹張りの笠が並ぶチュオン村の工房を訪れた客'],
    // trang đệm trước 3.2 (bỏ ảnh "niềm vui người bán nón": người trong ảnh che mũi, nhăn mặt), rồi ảnh chợ cho các chủ đề còn thiếu ảnh
    ['Người bán nón giữa chợ Chuông ban ngày', '昼間のチュオンの市場で笠を売る人'],
    ['Người bán vành và khung nón trong phiên chợ Chuông', 'チュオンの市場で笠の輪と骨組みを売る人'],
    ['Chợ nón Chuông họp từ lúc tờ mờ sáng', '夜明け前から開かれるチュオンの笠市場'],
  ],
  9: [
    // (bỏ "Những chồng nón cao bên đường": người tiền cảnh cúi gục; bỏ ảnh bảo tàng có biển không liên quan, ảnh người thợ quá tối)
    ['Phiên chợ bán lá lụi trước cổng đình Chuông', 'チュオン村の亭の門前で開かれるライ葉の市'],
    ['Người bán xếp nón bên cánh cửa gỗ cũ', '古い木の扉のそばで笠を並べる売り手'],
    ['Mua bán lá và vành nón trong phiên chợ Chuông', 'チュオンの市場で葉や笠の輪を売り買いする人々'],
    ['Bó mo nang được buộc lại trước khi mang ra chợ', '市場へ運ぶ前に束ねられるモーナン'],
    ['Người bán xếp nón trên phố làng Chuông', 'チュオン村の通りで笠を並べる売り手'],
    // thêm khi giãn chữ: ảnh chưa dùng trong Drive của nhóm (bảo tàng, chợ, cơ sở làm nón), đã soát không trùng cảnh
    ['Lá lụi và nón thành phẩm trong phiên chợ Chuông', 'チュオンの市場に並ぶライ葉と仕上がった笠'],
    ['Lá lụi, nón và chỉ màu — nguyên liệu nghề nón trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ライ葉・笠・色糸 — ベトナム民族学博物館に展示された笠づくりの材料'],
  ],
}

/** cặp trang mở chương: trái ảnh lớn tràn trang + số chương thật to, phải tên chương + đoạn dẫn */
function chapterOpener(ch, photo) {
  const acc = ACC[ch.no]
  toLeft(photo.alt, ch.no - 1)
  // trang trái mở chương: không dùng ảnh (ảnh nhóm chụp phóng to thì xấu) — số chương thật to màu chương,
  // hình vẽ nét mảnh của chương trên mười sáu vòng nón in mờ (nhãn "Chương N" đã có ở trang phải)
  const left = new Page({ chapter: ch.no, hideNumber: true, bg: C.cream, paper: 'giay' })
  const iw = left.cw - 110
  left.add(
    { ...DECO('vong-non', left.x0 - 50, 250, left.cw + 100, left.cw + 100, 0.12), name: 'Hình vẽ' },
    T(left.x0 - 6, 80, 320, 176, [String(ch.no).padStart(2, '0'), null], { font: F.head, size: 150, color: acc, lh: 1.05, name: 'Số chương' }),
    HL(left.x0, 262, 64, acc, 1.6),
    { ...DECO(SEC_ICON[ch.no] ?? 'non', left.x0 + 55, 345, iw, iw, 0.95), name: 'Hình vẽ' }
  )
  const p = new Page({ chapter: ch.no, hideNumber: true, bg: C.cream })
  p.fixed = true
  // mười sáu vòng nón nhìn từ trên in mờ, tràn khỏi góc dưới (trống đồng chỉ dùng ở phần lịch sử — skill van-hoa-non-la)
  p.add({ ...DECO('vong-non', W - 330, H - 360, 440, 440, 0.16), name: 'Hình vẽ' }, RECT(W - 18, 0, 18, H, acc, { name: 'Dải màu chương' }))
  // con dấu son "Làng Chuông" (điểm nhấn đỏ duy nhất của trang, như chỗ buộc quai)
  p.add(...SEAL(p.x1 - 70, 92))
  const tw = p.cw - 10
  // giữ chỗ xuống dòng có chủ đích (tiếng Nhật không bị ngắt giữa từ kiểu ノ/ンラー)
  const title = [ch.title[0], strip(ch.title[1])]
  let y = 108
  p.add(T(p.x0, y, 320, 16, [ch.label[0].toUpperCase(), strip(ch.label[1])], { size: S.label + 0.5, tracking: 3, color: acc, weight: 700, jaFont: F.jaSans, name: 'Nhãn chương' }))
  y += 34
  const to = { size: 33, font: F.head, lh: 1.2, jaSize: 29 }
  const th = textH(title, tw, to)
  p.add(T(p.x0, y, tw, th, title, { ...to, color: C.title, jaFont: F.jaHead, name: 'Tên chương' }))
  y += th + 22
  p.add(HL(p.x0, y, 64, acc, 1.8))
  y += 28
  const lo = { size: 17.5, lh: 1.6, jaSize: jaPt(17.5, 1.14), paraGap: 8 }
  p.add(T(p.x0, y, tw - 30, textH(ch.lead, tw - 30, lo), ch.lead, { ...lo, color: C.ink2, jaFont: F.jaBody, align: 'justify', name: 'Đoạn dẫn' }))
  return { left, right: p }
}

// mục lục: ghi lại trang của từng mục để điền sau
const anchors = [] // { level, label, title, page }
const mark = (level, title, page, label) => anchors.push({ level, title, page: page.n, label })

// ═════════════════════════════════════════ BÌA
// chỉ có hình nón làng Chuông: ảnh tràn trang những chồng nón trắng trong đình Chuông (ảnh báo, ghi nguồn),
// lớp tối dần ở trên/dưới để chữ màu kem đọc rõ (nền website xanh lá tre nên bìa nâu tách hẳn khỏi nền)
{
  // bìa giấy ngà (cùng chất giấy ruột sách, nổi trên nền web tối): nón lớn nét nâu trên mười sáu vòng nón in mờ, dấu son —
  // không dùng ảnh (góp ý: ảnh tràn trang, kể cả ảnh bìa, đều xấu vì ảnh không chuyên)
  const p = new Page({ hideNumber: true, bg: C.cream, paper: 'giay' })
  p.add(
    { ...DECO('vong-non', W / 2 - 280, 300, 560, 560, 0.16), name: 'Hình vẽ' },
    { ...DECO('bia-non', W / 2 - 240, 400, 480, 280, 1), name: 'Hình vẽ' },
    RECT(26, 26, W - 52, H - 52, 'none', { stroke: '#a07a3c', sw: 0.8, dash: '3 2.5', opacity: 0.6, name: 'Đường khâu' }),
    T(52, 74, 430, 120, ['NÓN LÁ\nLÀNG CHUÔNG', 'チュオン村の\nノンラー'], { font: F.head, size: 52, lh: 1.08, tracking: 2.5, color: C.title, jaFont: F.jaHead, jaSize: 46, name: 'Tên sách' }),
    T(54, 200, 500, 44, front.subtitle.map(strip), { font: F.script, size: 32, lh: 1.3, color: '#a07a3c', jaFont: F.jaHead, jaSize: 24, name: 'Tên phụ' }),
    HL(56, 260, 70, '#a07a3c', 1.4),
    ...SEAL(W - 52 - 60, 80),
    // bản tiếng Nhật: logo không kèm dòng chữ tiếng Việt "TRƯỜNG ĐẠI HỌC FPT"
    IMG(54, H - 96, 112, 32, ['Logo FPT', 'FPTロゴ'], { fit: 'contain', name: 'Logo', srcJa: PHOTOS['Logo FPT Education'] }),
    T(186, H - 92, 360, 34, front.team, { size: 10.5, lh: 1.5, color: C.ink2, jaFont: F.jaSans, name: 'Thông tin' })
  )
}

// ═════════════════════════════════════════ MỤC LỤC (cặp trang 2–3: mở bìa là thấy ngay, điền sau khi biết số trang)
const tocPages = [new Page({ chapter: 0, bg: C.cream, hideNumber: true, paper: 'khung' }), new Page({ chapter: 0, bg: C.cream, hideNumber: true, paper: 'khung' })]
tocPages.forEach((p) => (p.fixed = true))

// ═════════════════════════════════════════ LỜI MỞ ĐẦU
// nguyên văn năm đoạn của nhóm (tab "Mở đầu"), hai cặp trang:
//   trái = tiêu đề + ảnh + đoạn 1 · phải = đoạn 2 + ảnh · trái = đoạn 3 (giới thiệu ba chương) + ba thẻ chương bấm được
//   · phải = đoạn 4–5 + ký tên. Thẻ chương điền sau khi biết số trang chương.
let contents = null
{
  const f = new Flow(0, ['LỜI MỞ ĐẦU', 'はじめに'], POOL[0].filter((c) => !/áo dài/.test(c[0])))
  const p = f.unit()
  mark(1, preface.title, p, '—')
  p.add(DECO('leaf-sprig', p.x1 - 92, 66, 88, 88, 0.4))
  const to = { size: 38, font: F.head, lh: 1.15, jaSize: 34 }
  p.add(T(p.x0, 92, p.cw - 130, 48, preface.title, { ...to, color: C.title, jaFont: F.jaHead, name: 'Tiêu đề' }))
  p.add(HL(p.x0, 152, 56, ACC[0], 1.4))
  const [p1, p2, p3, ...rest] = preface.paras
  // ảnh khung lớn nhất mà đoạn 1 (cả hai thứ tiếng) vẫn vừa trang
  const ph = capH(preface.photo, CW) + 6 + 22
  const r = [R.wide, R.cin, R.pan].find((x) => 176 + CW * x + ph + textH(p1, CW, BODY) <= BOT) ?? R.pan
  f.y = figure(p, p.x0, 176, CW, CW * r, preface.photo) + 22
  f.prose([p1], { free: true })
  f.page()
  f.prose([p2])
  f.page()
  f.prose([p3], { free: true })
  f.label(preface.contentsTitle.map((s) => strip(s).toUpperCase()))
  const n = preface.chapters.length
  const cardH = 122
  f.place(n * cardH + (n - 1) * 10, (pg, y) => (contents = { page: pg, y, h: cardH, gap: 10 }))
  f.page()
  f.prose(rest, { free: true })
  const sg = { size: 16, lh: 1.45, font: F.hand, jaSize: 15 }
  const sh = textH(preface.sign, 260, sg)
  f.place(sh, (pg, y) => pg.add(T(pg.x1 - 260, y, 260, sh, preface.sign, { ...sg, align: 'right', color: C.ink2, jaFont: F.jaHand, name: 'Ký tên' })), 26)
  f.place(26, (pg, y) => pg.add(T(pg.x0, y, pg.cw, 26, preface.turn, { font: F.hand, size: 19, lh: 1.3, jaSize: 17, color: ACC[0], align: 'right', jaFont: F.jaHand, name: 'Lời mời' })))
  f.end()
}

// ═════════════════════════════════════════ CHƯƠNG 1
{
  const ch = ch1
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: thiếu nữ áo dài đội nón lá giữa cánh đồng', '章扉写真：田んぼの中、アオザイ姿でノンラーをかぶる女性'],
    alt: ['Ảnh toàn trang: nón lá xếp chồng ở chợ Chuông', '全面写真：チュオンの市場に積まれたノンラー'],
  })
  mark(1, ch.title, left, '01')
  const f = new Flow(1, ch.label, [...POOL[1]])

  // 1.1 — khái niệm, công dụng → hình dáng nón lá phổ biến → giá trị văn hóa và thẩm mỹ (thứ tự theo Doc)
  const s11 = ch.life
  mark(2, s11.title, f.section('1.1', s11.title), '1.1')
  for (const b of s11.blocks.slice(0, 2)) {
    f.block(b.h)
    f.prose(b.p)
  }
  f.figure(['Nón lá trong đời sống thường ngày: che nắng, che mưa khi lao động', '日々の暮らしの中のノンラー：働く人を日差しや雨から守る'])

  // hai dáng nón: trọn một cặp trang — trái: tiêu đề + dẫn + nhóm nón chóp, phải: nhóm nón vành rộng + ghi chú
  const sh = ch.shapes
  f.unit()
  f.y = blockHead(f.p, f.y, sh.title)
  f.prose([sh.intro], { free: true, size: 16 })
  // lưới ảnh từng kiểu nón: khung lớn nhất còn vừa trang (vuông → 4:3 → 3:2 → 16:9), ô tên cao bằng nhau, hàng cuối canh giữa
  const grid = (g, cols, reserve = 0, maxR = R.sq) => {
    const gap = 14
    const cw = (CW - gap * (cols - 1)) / cols
    const nameO = { font: F.head, size: 16.5, lh: 1.25, jaSize: 16 }
    const placeO = { size: 12, lh: 1.35 }
    const nameH = Math.max(...g.items.map(([n, pl]) => textH(n, cw, nameO) + 4 + textH(pl, cw, placeO)))
    const rows = Math.ceil(g.items.length / cols)
    const textHt = textH(g.text, CW, { size: 15.5, lh: 1.55, jaSize: jaPt(15.5) })
    const need = (r) => 28 + textHt + 10 + rows * (cw * r + 8 + nameH) + (rows - 1) * 10 + reserve
    const pick = () => [R.sq, R.std, R.wide, R.cin].find((r) => r <= maxR + 0.001 && f.room >= need(r))
    let ratio = pick()
    if (!ratio) {
      f.page()
      ratio = pick() ?? R.cin
    }
    const cell = cw * ratio
    f.label(g.name)
    f.prose([g.text], { size: 15.5, after: 8, free: true })
    const p = f.p
    g.items.forEach(([name, place], i) => {
      const row = Math.floor(i / cols)
      const inRow = Math.min(cols, g.items.length - row * cols)
      const off = (CW - (inRow * cw + (inRow - 1) * gap)) / 2
      const gx = p.x0 + off + (i % cols) * (cw + gap)
      const gy = f.y + row * (cell + 8 + nameH + 10)
      p.add(IMG(gx, gy, cw, cell, [`${name[0]} — ${place[0]}`, `${strip(name[1])} — ${place[1]}`]))
      const nh = textH(name, cw, nameO)
      p.add(T(gx, gy + cell + 6, cw, nh, name, { ...nameO, color: C.ink, jaFont: F.jaHead, name: 'Tên nón' }))
      // địa danh sát dưới tên theo đúng chiều cao chữ của từng thứ tiếng (tên tiếng Nhật dài hai dòng không đẩy bản tiếng Việt tụt xuống)
      for (const [k, lang] of [[0, 'vi'], [1, 'ja']]) {
        const one = k ? [place[0], place[1]] : [place[0], null]
        const nk = textH1(name, cw, nameO, k)
        p.add({ ...T(gx, gy + cell + 10 + nk, cw, textH(one, cw, placeO), one, { ...placeO, color: C.muted, jaFont: F.jaSans, name: 'Địa phương' }), only: lang })
      }
    })
    f.y += rows * (cell + 8 + nameH) + (rows - 1) * 10 + 22
    return ratio
  }
  const r0 = grid(sh.groups[0], 3)
  f.page()
  const outroH = textH(sh.outro, CW - 36, { size: 15.5, lh: 1.55, jaSize: jaPt(15.5) }) + 32 + 20
  // nhóm 2 ít ảnh hơn nên được khung to hơn, nhưng không chênh quá một bậc so với nhóm 1 (hai trang đối diện nhìn cân)
  const steps = [R.cin, R.wide, R.std, R.sq]
  grid(sh.groups[1], 3, outroH, steps[Math.min(steps.length - 1, steps.indexOf(r0) + 1)])
  f.note(sh.outro)
  // giá trị văn hóa và thẩm mỹ: đoạn có dấu ¹ (Nhà hát Cao Văn Lầu) cùng trang với chú thích của nó;
  // mở ở trang mới, phần trống dưới lưới hình dáng nón lấp ảnh (trang lưới không thành trang chữ)
  const val = s11.blocks[2]
  f.fillRest()
  f.page()
  f.block(val.h)
  f.prose(val.p.slice(0, 2))
  f.noted([val.p[2]], val.notes)
  f.prose(val.p.slice(3))
  f.gallery(val.images, 2)

  // 1.2 — dấu tích + dòng thời gian
  const hi = ch.history
  mark(2, hi.title, f.section('1.2', hi.title), '1.2')
  const tr = hi.traces
  // "Dấu tích": hai đoạn, mỗi đoạn một chú thích cuối trang (cùng trang với đoạn) + ảnh hai cổ vật nhóm yêu cầu,
  // khung chuẩn lớn nhất còn vừa trang (Doc bỏ dòng thời gian / truyền thuyết thần Nắng)
  f.y = blockHead(f.p, f.y, tr.h)
  tr.p.forEach((q, i) => f.noted([q], [tr.notes[i]]))
  {
    const pics = [
      ['Trống đồng Ngọc Lũ (ảnh: Wikimedia Commons)', 'ゴックルー銅鼓（写真：ウィキメディア・コモンズ）'],
      ['Thạp đồng Đào Thịnh (ảnh: Daderot, CC0)', 'ダオティン銅甕（写真：Daderot、CC0）'],
    ]
    const pw = (CW - 14) / 2
    const pch = Math.max(...pics.map((c) => capH(c, pw)))
    const ratio = [R.por, R.sq, R.std, R.wide, R.cin].find((r) => f.y + pw * r + 6 + pch <= f.bot) ?? R.std
    f.row(pics, { ratio })
  }
  for (const b of hi.blocks) {
    f.block(b.h)
    f.pending = b.images?.[0] ?? null
    f.prose(b.p)
    f.pending = null
    if (b.images) f.row(b.images)
  }

  // 1.3 — làng Chuông
  const vg = ch.village
  mark(2, vg.title, f.section('1.3', vg.title), '1.3')
  const ab = vg.about
  mark(3, ab.h, f.block(ab.h, ab.id), ab.id)
  f.prose(ab.p.slice(0, 1))
  {
    // bản đồ chữ S: bấm vào → phóng tới Làng Chuông, mô hình 3D của làng nổi lên trên ghim
    // khung dọc: tuyến Hà Nội → Làng Chuông chạy theo chiều bắc – nam; cao theo chỗ còn lại của trang (tối đa 4:3)
    const cap = ab.images[0]
    const ch = capH(cap, CW)
    f.need(CW * 1.12 + 6 + ch)
    const mh = r1(Math.max(CW * 1.12, Math.min(CW * R.por, f.bot - f.y - 6 - ch)))
    f.place(mh + 6 + ch, (p, y) => {
      p.add(WIDGET(p.x0, y, CW, mh, 'map', { name: 'Bản đồ tương tác' }))
      p.add(T(p.x0, y + mh + 6, CW, ch, cap, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
    })
  }
  f.noted([ab.p[1]], ab.notes)
  f.prose(ab.p.slice(2))
  f.row(ab.images.slice(1))

  // 1.3.2 các loại nón: ảnh lớn + thẻ từng loại (ảnh tách nền, khung vuông)
  const ty = vg.types
  f.unit()
  mark(3, ty.h, f.p, ty.id)
  f.y = blockHead(f.p, f.y, ty.h, ty.id)
  f.figure(ty.hero, { ratio: R.cin })
  f.prose([ty.intro])
  // mỗi kiểu nón một trang kiểu catalog: ảnh có nền (sàn gạch ở nhà nghệ nhân — cả nhóm cùng một kiểu ảnh) rộng hết khối,
  // khung chuẩn lớn nhất còn vừa trang (vuông → 4:3 → 3:2), tên nón, mô tả bên dưới
  const to = { size: 16.5, lh: 1.6, jaSize: jaPt(16.5) }
  const no = { size: 24, font: F.head, lh: 1.25, jaSize: 22 }
  const typeCard = (t) => {
    const nh = textH(t.name, CW, no)
    const th = textH(t.text, CW, to)
    const nb = t.notes ? notesH(t.notes) : 0
    const fits = () => [R.sq, R.std, R.wide, R.cin].find((r) => f.p && f.y + CW * r + 20 + nh + 10 + th <= BOT - nb)
    let r = fits()
    if (!r) {
      f.page()
      r = fits() ?? R.cin
    }
    const p = f.p
    let y = f.y
    if (t.notes) footnotes(p, t.notes)
    p.add(IMG(p.x0, y, CW, CW * r, [`${t.name[0]} — ảnh sản phẩm`, `${strip(t.name[1])} — 製品写真`], { fit: 'cover' }))
    // ảnh lấy từ báo: ghi nguồn ngay dưới ảnh (nằm trong khoảng cách sẵn có, không đẩy chữ)
    if (t.credit) p.add(T(p.x0, y + CW * r + 4, CW, 12, t.credit, { size: 8.5, italic: true, color: C.muted, align: 'right', lh: 1.3, jaFont: F.jaSans, name: 'Nguồn ảnh' }))
    y += CW * r + 20
    p.add(T(p.x0, y, CW, nh, t.name, { ...no, weight: 700, color: ACC[1], jaFont: F.jaHead, name: 'Tên nón' }))
    p.add(T(p.x0, y + nh + 10, CW, th, t.text, { ...to, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
    f.y = BOT // mỗi kiểu một trang
  }
  ty.list.forEach(typeCard)
  f.block(ty.styled.h)
  ty.styled.list.forEach(typeCard)
  // lời kết của mục: đoạn văn thường (khối ghi chú nghiêng 15 dòng quá nặng)
  f.prose([ty.outro])
  f.end()
}

// ═════════════════════════════════════════ CHƯƠNG 2
const stepPages = [] // { no, name, page } — cho dải tên công đoạn
let stripPage = null
let stripRight = null
{
  const ch = ch2
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: đôi bàn tay nghệ nhân khâu nón trên khuôn', '章扉写真：型の上で笠を縫う職人の手'],
    alt: ['Ảnh toàn trang: nón lá Làng Chuông', '全面写真：チュオン村のノンラー'],
  })
  mark(1, ch.title, left, '02')
  const f = new Flow(2, ch.label, [...POOL[2]])
  f.story({ paras: ch.intro, title: ch.title, notes: ch.notes })

  // 2.1 — cấu tạo
  const st = ch.structure
  mark(2, st.title, f.section('2.1', st.title), '2.1')
  f.prose([st.intro])
  // trang mở mục: tiêu đề + đoạn dẫn + ảnh; hai ô "phần khung / phần lá" sang trang phải (không dồn cả mục vào một trang chữ)
  f.fillRest()
  f.page()
  {
    // hai phần chính: hai ô nền màu cạnh nhau
    const gap = 14
    const bw = (CW - gap) / 2
    const to = { size: 15, lh: 1.5, jaSize: jaPt(15) }
    const hh = Math.max(...st.parts.map(([n, t]) => textH(n, bw - 28, { size: 18, font: F.head, lh: 1.25 }) + 8 + textH(t, bw - 28, to))) + 32
    f.place(hh, (p, y) =>
      st.parts.forEach(([name, text], i) => {
        const bx = p.x0 + i * (bw + gap)
        const nh = textH(name, bw - 28, { size: 18, font: F.head, lh: 1.25 })
        p.add(RECT(bx, y, bw, hh, TINT[2], { radius: 8, name: 'Ô' }), T(bx + 14, y + 14, bw - 28, nh, name, { font: F.head, size: 18, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên phần' }), T(bx + 14, y + 22 + nh, bw - 28, textH(text, bw - 28, to), text, { ...to, color: C.ink2, jaFont: F.jaBody, name: 'Mô tả' }))
      })
    )
  }
  // 2.1.1 — khung 16 vòng (thứ tự theo Doc: khung trước, lá lợp sau): sơ đồ vòng, dáng thấp như nón thật
  // (cao ≤ 0,72 × bán kính vành, chóp có núm tròn nhỏ — góp ý: hình nón vẽ nhọn quá)
  const fr = st.frame
  mark(3, fr.h, f.block(fr.h, fr.id), fr.id)
  f.prose(fr.p)
  {
    const fw = 300
    const fH = Math.round(fw / 2 * 0.7)
    f.place(fH + 22, (p, y) => {
      const fx = p.x0 + (p.cw - fw) / 2 - 40
      p.add(TRI(fx, y, fw, fH, 'none', { stroke: '#a4865a', sw: 0.8, opacity: 0.6 }), ELL(fx + fw / 2 - 5, y - 4, 10, 8, '#a4865a', { name: 'Núm chóp' }))
      for (let i = 0; i < 16; i++) {
        const t = (i + 1) / 16
        const rw = fw * t
        const ry = y + fH * t
        const eh = Math.max(2, rw * 0.1)
        p.add(ELL(fx + (fw - rw) / 2, ry - eh / 2, rw, eh, 'none', { stroke: i === 15 ? ACC[2] : '#a4865a', sw: i === 15 ? 1.6 : 0.9 }))
      }
      p.add(T(fx + fw / 2 + 16, y - 8, 150, 20, ['← Chóp nón', '← 頂'], { size: 13.5, italic: true, color: C.muted, lh: 1.3, jaFont: F.jaSans, name: 'Nhãn' }), T(fx + fw + 12, y + fH - 10, 150, 20, ['← Vòng cạp (vòng 16)', '← 縁の輪（16本目）'], { size: 13.5, italic: true, color: ACC[2], lh: 1.3, jaFont: F.jaSans, name: 'Nhãn' }))
    })
  }
  f.prose(fr.after)
  f.figure(fr.image)

  // 2.1.2 — ba lớp: sơ đồ ba lớp xếp tầng + mô tả từng lớp
  const ly = st.layers
  mark(3, ly.h, f.block(ly.h, ly.id), ly.id)
  f.prose([ly.intro])
  {
    // mô hình 3D ba lớp: bấm vào lớp nào thì lớp đó sáng màu (chữ trong danh sách lấy từ ly.items + ly.short)
    const lh = 250
    f.place(lh, (p, y) =>
      p.add(WIDGET(p.x0, y, CW, lh, 'layers', { name: 'Mô hình 3 lớp lá', data: { items: ly.items.map((it, i) => ({ name: it[0].map(strip), note: ly.short[i] })) } }))
    )
  }
  ly.items.forEach((item, i) => {
    const w = CW - 40
    const to = { size: 16, lh: 1.55, jaSize: jaPt(16) }
    const nh = textH(item[0], w, { size: S.card, font: F.head, lh: 1.25 })
    const hh = textH(item[1], w, to)
    f.place(nh + 6 + hh, (p, y) => {
      p.add(ELL(p.x0, y, 28, 28, ACC[2]), T(p.x0, y + 5.5, 28, 17, [String(i + 1), null], { size: 13, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số' }))
      p.add(T(p.x0 + 40, y + 1, w, nh, item[0], { font: F.head, size: S.card, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Lớp' }))
      p.add(T(p.x0 + 40, y + nh + 6, w, hh, item[1], { ...to, jaFont: F.jaBody, align: 'justify', name: 'Mô tả lớp' }))
    })
  })
  f.prose([ly.outro])
  f.figure(ly.image)

  // 2.2 — nguyên liệu & dụng cụ: mỗi trang hai món, ảnh so le trái / phải
  const mt = ch.materials
  mark(2, mt.title, f.section('2.2', mt.title), '2.2')
  const itemTo = { size: 16, lh: 1.55, jaSize: jaPt(16) }
  const iw2 = 210
  // nguyên liệu / dụng cụ: so le, mỗi trang khổ dọc đúng 2 mục (yêu cầu của nhóm); mục trên neo đầu, mục dưới neo đáy
  // trang → không có dải trống giữa / cuối trang. Không đủ chỗ cho 2 mục thì trang đó 1 mục (ảnh to hơn).
  const stagger = (list, label) => {
    // ảnh khung dọc 3:4, lớn theo phần chỗ chia cho mỗi mục (tối đa 52% bề ngang); chữ chiếm phần còn lại
    const fit = (name, text, slot) => {
      const w = Math.max(iw2, Math.min(CW * 0.52, slot / R.por))
      const t2 = CW - w - 22
      const nh = textH(name, t2, { size: 20, font: F.head, lh: 1.25 })
      const th = textH(text, t2, itemTo)
      return { w, t2, nh, th, h: Math.max(w * R.por, nh + 10 + th) }
    }
    const put = (p, y, [name, text, hint], k, m) => {
      const right = k % 2 === 1
      const ix = right ? p.x1 - m.w : p.x0
      const tx = right ? p.x0 : p.x0 + m.w + 22
      p.add(IMG(ix, y, m.w, m.w * R.por, hint))
      p.add(T(tx, y - 2, m.t2, m.nh, name, { font: F.head, size: 20, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' }), T(tx, y + m.nh + 10, m.t2, m.th, text, { ...itemTo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
    }
    let i = 0
    let k = 0
    while (i < list.length) {
      if (!f.p || f.room < fit(list[i][0], list[i][1], 0).h) f.page()
      if (label && i === 0) f.label(label)
      const p = f.p
      const room = BOT - f.y
      // hai mục: ảnh lớn nhất mà cả hai vẫn vừa trang
      let pair = null
      if (i + 1 < list.length)
        for (let slot = (room - 36) / 2; slot >= iw2 * R.por; slot -= 12) {
          const a = fit(list[i][0], list[i][1], slot)
          const b = fit(list[i + 1][0], list[i + 1][1], slot)
          if (a.h + b.h + 30 <= room) {
            pair = [a, b]
            break
          }
        }
      if (pair) {
        put(p, f.y, list[i], k++, pair[0])
        put(p, BOT - pair[1].h, list[i + 1], k++, pair[1])
        i += 2
      } else {
        // một mục: tên đứng trước ảnh (ảnh nằm dưới tên của chính nó, không bị đọc thành ảnh của mục phía trên),
        // ảnh ngang khung chuẩn hết bề ngang, mô tả bên dưới; khung chọn để lấp kín trang
        const [name, text, hint] = list[i]
        const nh = textH(name, CW, { size: 22, font: F.head, lh: 1.25 })
        const th = textH(text, CW, itemTo)
        const r = [R.sq, R.std, R.wide, R.cin, R.pan].find((x) => nh + 12 + CW * x + 16 + th <= room) ?? R.pan
        p.add(T(p.x0, f.y, CW, nh, name, { font: F.head, size: 22, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' }))
        p.add(IMG(p.x0, f.y + nh + 12, CW, CW * r, hint))
        p.add(T(p.x0, f.y + nh + 12 + CW * r + 16, CW, th, text, { ...itemTo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
        i += 1
        k++
      }
      f.y = BOT
    }
  }
  stagger(mt.items, ['NGUYÊN LIỆU', '材料'])
  // dụng cụ: khuôn nón (một trang riêng, ảnh lớn) rồi các dụng cụ nhỏ
  const [mold] = mt.tools
  f.unit()
  f.label(['DỤNG CỤ', '道具'])
  f.place(26, (p, y) => p.add(T(p.x0, y, p.cw, 26, mold[0], { font: F.head, size: 22, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' })), 10)
  f.figure(mold[2], { ratio: R.cin })
  f.prose([mold[1], ...mt.moldMore], { size: 16 })
  stagger(mt.small)
  f.note(mt.outro)

  // 2.3 — quy trình
  const pr = ch.process
  mark(2, pr.title, f.section('2.3', pr.title), '2.3')
  const lf = pr.leaf
  f.y = blockHead(f.p, f.y, lf.h, lf.id)
  mark(3, lf.h, f.p, lf.id)
  f.story({ here: true, paras: lf.p, images: lf.images, title: lf.h })
  f.end()

  // dải tên công đoạn: trang trái của một trang đôi, trang phải là ảnh tràn trang; rồi mỗi công đoạn một trang đôi
  // bản đồ hành trình 8 chặng (kiểu bàn cờ, trải cả cặp trang): điền sau khi biết trang từng công đoạn
  padLeft(f.pool, 2)
  stripPage = new Page({ chapter: 2, paper: 'giay' })
  stripPage.fixed = true
  runningHead(stripPage, ch.label)
  mark(3, pr.stepsH.h, stripPage, pr.stepsH.id)
  stripRight = new Page({ chapter: 2, paper: 'giay' })
  stripRight.fixed = true
  runningHead(stripRight, ch.label)

  // mỗi công đoạn một cặp trang: trái = số + tên + khung GIF + đầu đoạn văn, phải = phần còn lại + ảnh thật
  const stepFlow = new Flow(2, ch.label)
  const nameO = { font: F.head, size: 34, lh: 1.15, jaSize: 30 }
  const spread = (s, o) => {
    const p = stepFlow.page()
    stepPages.push({ no: s.no, name: s.name, sub: s.sub, page: p.n })
    const acc = ACC[2]
    let y = TOP
    if (o.label) {
      p.add(T(p.x0, y, p.cw, 16, o.label.map((x) => strip(x).toUpperCase()), { size: S.label, tracking: 2.4, weight: 700, color: acc, jaFont: F.jaSans, name: 'Nhóm' }))
      y += 26
    }
    const head = s.no ? [`Bước ${s.no}`, `ステップ${s.no}`] : null
    if (head) {
      p.add(T(p.x0, y, 200, 20, head, { size: 14, tracking: 2, weight: 700, color: acc, lh: 1.3, jaFont: F.jaSans, name: 'Số bước' }))
      y += 22
    }
    const nh = textH(s.name, p.cw, nameO)
    p.add(T(p.x0, y, p.cw, nh, s.name, { ...nameO, color: C.title, jaFont: F.jaHead, name: 'Tên bước' }))
    y += nh + 4
    const subO = { size: 15, italic: true, lh: 1.4 }
    const sh = textH(s.sub, p.cw, subO)
    p.add(T(p.x0, y, p.cw, sh, s.sub, { ...subO, color: acc, jaFont: F.jaSans, name: 'Phụ đề' }))
    y += sh + 10
    p.add(HL(p.x0, y, 56, acc, 1.4))
    y += 22
    // chia chữ cho cân hai trang: trang trái = GIF + đoạn đầu, trang phải = phần còn lại + ảnh thật lấp kín trang
    // (không để một trang dồn chữ còn trang kia trống nền)
    const to = { size: 15.5, lh: BODY.lh, jaSize: jaPt(15.5, 1.14), paraGap: 8 }
    const hOf = (paras) => (paras.length ? textH(join(paras), CW, to) : 0)
    const minG = CW * R.cin
    const capL = BOT - y - 6 - minG - 18
    const total = hOf(s.text)
    const left = [s.text[0]]
    for (const q of s.text.slice(1)) {
      const h = hOf([...left, q])
      if (h > capL || h > total * 0.6) break
      left.push(q)
    }
    const right = s.text.slice(left.length)
    // GIF lớn hơn khi đoạn chữ trang trái ngắn (khung 16:9 → tối đa 4:3) để trang trái không hụt đáy
    const gh = Math.min(CW * R.std, Math.max(minG, BOT - y - 6 - hOf(left) - 24))
    // khung GIF = khung ngà chung của mọi ảnh (addFrames), không viền trắng bo góc riêng
    stepFlow.y = figure(p, p.x0, y, CW, gh, s.gif, { noCaption: true }) + 10
    // trang công đoạn có bố cục riêng (một bước = một cặp trang, GIF + ảnh thật) → không áp hạn mức chữ chung
    stepFlow.prose(left, { size: 15.5, budget: false })
    if (stepFlow.p === p) stepFlow.page()
    const rp = stepFlow.p
    if (right.length) stepFlow.prose(right, { size: 15.5, keep: 200, after: 18, budget: false })
    if (rp !== stepFlow.p || rp.n !== p.n + 1) console.warn(`⚠ công đoạn ${s.no}: chữ tràn quá một cặp trang`)
    // ảnh thật lấp phần còn lại của trang phải, chỉ khung tỉ lệ chuẩn: hai ảnh thì xếp cạnh nhau (khung dọc 3:4 → 4:3)
    // hoặc chồng dọc (rộng cả khối, tối thiểu 16:9 — không ép thành dải mỏng cắt ngang mặt người), cách nào ảnh lớn hơn
    const top = right.length ? stepFlow.y : TOP + 4
    const avail = BOT - top
    const n = s.photos.length
    const gap = 14
    const frame = (w, room, max) => [R.por, R.sq, R.std, R.wide, R.cin, R.pan].find((r) => r <= max + 0.001 && w * r <= room)
    if (n === 1) {
      const ch = capH(s.photos[0], CW)
      const r = frame(CW, avail - 6 - ch, R.por)
      if (r) figure(rp, rp.x0, top, CW, CW * r, s.photos[0])
    } else {
      const pw = (CW - gap) / 2
      const chS = Math.max(...s.photos.map((c) => capH(c, pw)))
      const rS = frame(pw, avail - 6 - chS, R.por)
      const chV = s.photos.map((c) => capH(c, CW))
      const rV = frame(CW, (avail - 12 - chV[0] - chV[1] - 20) / 2, R.std)
      const areaS = rS ? 2 * pw * pw * rS : 0
      const areaV = rV && rV >= R.cin - 0.001 ? 2 * CW * CW * rV : 0
      if (areaV > areaS) {
        let yy = top
        s.photos.forEach((c) => (yy = figure(rp, rp.x0, yy, CW, CW * rV, c) + 20))
      } else if (rS) s.photos.forEach((c, i) => figure(rp, rp.x0 + i * (pw + gap), top, pw, pw * rS, c))
    }
    stepFlow.y = BOT
  }
  const STEP_MEDIA = {
    1: { gif: ['GIF công đoạn rẽ lá', '葉のばしのGIF'], photos: [['Tay nghệ nhân rẽ từng chiếc lá', '葉を一枚ずつのばす職人の手']] },
    2: { gif: ['GIF công đoạn là lá', '葉のアイロンがけのGIF'], photos: [['Nghệ nhân ngồi là lá bên bếp điện', '電気コンロのそばで葉にアイロンをかける職人']] },
    3: { gif: ['GIF công đoạn bứt vòng', '輪づくりのGIF'], photos: [['Khuôn nón — nơi đặt lần lượt 16 vành nứa', '16本のヌア竹の輪を順にはめていく笠の型'], ['Khuôn nón với các vòng nứa nhìn từ trên xuống', '上から見た、ヌア竹の輪をはめた型']] },
    4: { gif: ['GIF công đoạn quay nón', '葺き込みのGIF'], photos: [['Xếp từng lớp lá lụi lên khuôn', 'ライ葉を一枚ずつ型に重ねる'], ['Trải đều lá quanh khung nón', '骨組みの周りに葉を均等に広げる']] },
    5: { gif: ['GIF công đoạn khâu nón', '縫い付けのGIF'], photos: [['Cận cảnh mũi kim, sợi cước xuyên qua lớp lá', '葉の層を通る針と糸のクローズアップ'], ['Nghệ nhân khâu nón, đặt nghiêng khung giữa hai đầu gối', '型を両ひざの間に斜めに置いて笠を縫う職人']] },
    6: { gif: ['GIF công đoạn nức nón', '縁縫いのGIF'], photos: [['Cắt lá thừa và khâu viền vành nón', '余分な葉を切り、縁を縫う'], ['Khâu viền vành nón', 'つばの縁を縫う']] },
    // hai ảnh luồn nhôi chụp liền nhau gần như giống hệt → chỉ giữ một
    7: { gif: ['GIF công đoạn luồn nhôi', 'ニョイ通しのGIF'], photos: [['Chỉ màu luồn trong lòng nón', '笠の内側に通した色糸']] },
    8: { gif: ['GIF công đoạn quang dầu', '油塗りのGIF'], photos: [['Chiếc nón hoàn thiện nhìn từ trên xuống: lớp lá phẳng, đều', '上から見た完成した笠：平らにそろった葉']] },
  }
  for (const s of pr.steps) spread({ ...s, ...STEP_MEDIA[s.no] }, {})
  spread({ ...pr.finish, no: 0, ...STEP_MEDIA[8] }, { label: pr.finish.label })
  stepPages.at(-1).finish = true
  stepPages.at(-1).label = pr.finish.label
}

// ═════════════════════════════════════════ CHƯƠNG 3
{
  const ch = ch3
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: em bé ôm chiếc nón lá — thế hệ mai sau của làng nghề', '章扉写真：ノンラーを抱く子ども — 工芸村の未来を担う世代'],
    alt: ['Ảnh toàn trang: chợ nón Chuông', '全面写真：チュオンの笠市場'],
  })
  mark(1, ch.title, left, '03')
  const rc = ch.recognition
  const f = new Flow(3, ch.label, [...POOL[3]])

  // 3.1 — ghi nhận
  const p31 = f.section('3.1', rc.title)
  mark(2, rc.title, p31, '3.1')
  f.block(rc.h)
  p31.add(DECO('leaf-sprig', p31.x1 - 96, f.y - 8, 96, 96, 0.35))
  f.quote(rc.proverb, { size: 19, inset: 0, gap: 20 })
  // đoạn có dấu ¹ ² phải cùng trang với chú thích ¹ ²: không vừa trang này thì trang này lấp ảnh, đoạn + chú thích sang trang sau
  {
    const n12 = rc.notes.slice(0, 2)
    const noteH = textH(join(n12), CW, { size: S.note, lh: 1.45, paraGap: 3 }) + 26
    const p0H = textH(join(rc.p.slice(0, 1)), CW, { size: BODY.size, lh: BODY.lh, paraGap: 8, jaSize: BODY.jaSize })
    // trang mở mục chỉ còn tiêu đề + ca dao: lấp ảnh, đoạn có chú thích sang trang sau (không để trang mở mục toàn chữ)
    if (f.y + p0H > BOT - noteH || f.y + p0H > TOP + TXT_PAGE) {
      f.fillRest()
      f.page()
    }
    f.notes(n12)
    f.prose(rc.p.slice(0, 1), { free: true })
  }
  f.page()
  f.notes(rc.notes.slice(2))
  f.prose(rc.p.slice(1))
  f.row([rc.images[1], ['Đình Chuông — không gian sinh hoạt của làng nghề', 'チュオン村の亭 — 工芸村の暮らしの場']])

  // sản phẩm OCOP tiêu biểu: một giấy chứng nhận (hiện trọn, khung trắng) + danh sách năm sản phẩm 4 sao của cùng cơ sở
  // (năm bản chứng nhận giống hệt nhau xếp lưới thì đơn điệu)
  {
    f.page()
    f.y = blockHead(f.p, f.y, ['Một số sản phẩm OCOP tiêu biểu của làng Chuông', 'チュオン村の代表的なOCOP製品'])
    const prods = [
      ['Nón chùm', '{束|たば}ね{笠|がさ}'],
      ['Nón cô dâu', '花嫁の笠'],
      ['Nón lá hai mặt lụa', '両面絹張りの笠'],
      ['Nón lá truyền thống đặc biệt', '特製の伝統的なノンラー'],
      ['Nón lá vải lụa mặt ngoài', '外側に絹を張ったノンラー'],
    ]
    const p = f.p
    const cw = 214
    const ch = cw * R.por
    const y0 = f.y
    p.add(RECT(p.x0, y0, cw, ch, '#ffffff', { radius: 4, stroke: C.line, sw: 0.6, name: 'Khung ảnh' }), IMG(p.x0 + 8, y0 + 8, cw - 16, ch - 16, ['Giấy chứng nhận OCOP 4 sao của cơ sở nón lá Lê Văn Tuy', 'レー・ヴァン・トゥイ工房のOCOP四つ星認定証'], { fit: 'contain' }))
    const lx = p.x0 + cw + 24
    const lw = p.x1 - lx
    let ly = y0 + 2
    p.add(T(lx, ly, lw, 34, ['CƠ SỞ NÓN LÁ LÊ VĂN TUY\nOCOP 4 SAO · 2022', 'レー・ヴァン・トゥイ工房\nOCOP四つ星・2022年'], { size: S.label, tracking: 1.6, weight: 700, lh: 1.4, color: ACC[3], jaFont: F.jaSans, name: 'Nhóm' }))
    ly += 52
    const nameO = { font: F.head, size: 17, lh: 1.25, jaSize: 16 }
    const step = (ch - 54) / prods.length
    prods.forEach((name) => {
      p.add(T(lx, ly, 60, 16, ['★★★★', null], { size: 11, tracking: 2, color: C.gold, lh: 1.3, name: 'Hạng sao' }), T(lx, ly + 16, lw, textH(name, lw, nameO), name, { ...nameO, weight: 700, color: C.ink, jaFont: F.jaHead, name: 'Tên sản phẩm' }))
      ly += step
    })
    f.y = y0 + ch + 6
    const cap = ['Giấy chứng nhận do UBND thành phố Hà Nội cấp năm 2022', '2022年にハノイ市人民委員会が交付した認定証']
    p.add(T(p.x0, f.y, cw, capH(cap, cw), cap, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
    f.y += capH(cap, cw) + 24
  }

  // nghệ nhân
  const ar = ch.artisans
  f.section(null, ar.title)
  f.prose([ar.intro])
  f.fillRest()
  f.page()
  const bioO = { size: 15.5, lh: 1.55, jaSize: jaPt(15.5) }
  const piw = 178
  const ptx = piw + 20
  const smallCap = { size: 11, lh: 1.35 }
  // "Nghệ nhân Phạm Trần Canh (1931)" → tên + dòng năm sinh riêng
  const YEAR = /\s*[（(](\d{4})(?:年生)?[）)]$/
  const splitName = (name) => [name.map((x) => x.replace(YEAR, '')), name[0].match(YEAR)?.[1]]
  const personNh = (name) => textH(splitName(name)[0], CW - ptx, { size: S.card, font: F.head, lh: 1.25 }) + (splitName(name)[1] ? 18 : 0)
  const people = (list, fill) =>
    f.cards(
      list,
      ([[name, , bio], img, cap]) => Math.max(personNh(name) + 24 + textH(bio, CW - ptx, bioO), piw * R.por + (cap ? 6 + textH(cap, piw, smallCap) : 0)),
      (p, y, [[name, role, bio], img, cap]) => {
        const [nm, year] = splitName(name)
        const nh = textH(nm, CW - ptx, { size: S.card, font: F.head, lh: 1.25 })
        p.add(IMG(p.x0, y, piw, piw * R.por, img))
        // chú thích nhỏ dưới ảnh (ảnh sản phẩm thay chân dung → nói rõ đây là nón gắn với nghệ nhân, không phải ghép nhầm)
        if (cap) p.add(T(p.x0, y + piw * R.por + 6, piw, textH(cap, piw, smallCap), cap, { ...smallCap, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
        let ty = y - 2
        p.add(T(p.x0 + ptx, ty, CW - ptx, nh, nm, { font: F.head, size: S.card, weight: 700, color: C.ink, lh: 1.25, jaFont: F.jaHead, name: 'Tên nghệ nhân' }))
        ty += nh
        if (year) {
          p.add(T(p.x0 + ptx, ty, CW - ptx, 18, [`Sinh năm ${year}`, `${year}年生まれ`], { size: 12.5, tracking: 1, color: C.muted, lh: 1.3, jaFont: F.jaSans, name: 'Năm sinh' }))
          ty += 18
        }
        p.add(
          T(p.x0 + ptx, ty + 2, CW - ptx, 18, role, { size: 13.5, italic: true, color: ACC[3], lh: 1.3, jaFont: F.jaSans, name: 'Vai trò' }),
          T(p.x0 + ptx, ty + 26, CW - ptx, textH(bio, CW - ptx, bioO), bio, { ...bioO, align: 'justify', jaFont: F.jaBody, name: 'Tiểu sử' })
        )
      },
      { gap: 26, max: 1, fill }
    )
  const g1 = ar.groups[0]
  f.label(g1.name)
  // ba nghệ nhân đầu: chưa có chân dung → ảnh nón tiêu biểu (theo gợi ý của nhóm)
  people(
    g1.people.map((per, i) => [
      per,
      [
        ['Nón lá trắng truyền thống làng Chuông', 'チュオン村の伝統的な白いノンラー'],
        ['Nghệ nhân Phạm Trần Canh — ảnh: Báo Thể thao & Văn hóa', '職人ファム・チャン・カイン — 写真：テータオ＆ヴァンホア紙'],
        ['Bộ sưu tập các kiểu nón truyền thống', '伝統的な笠のコレクション'],
      ][i],
      [
        ['Nón lá trắng — nghề ông góp phần khôi phục', '白いノンラー：氏が復興に尽くした技'],
        ['Ảnh: Báo Thể thao & Văn hóa', '写真：テータオ＆ヴァンホア紙'],
        ['Những kiểu nón truyền thống — Bảo tàng Phụ nữ Việt Nam', '伝統的な笠の数々 — ベトナム女性博物館'],
      ][i],
    ])
  )
  const g2 = ar.groups[1]
  f.page()
  f.label(g2.name)
  f.prose([g2.intro], { size: 16 })
  f.fillRest()
  f.page()
  // ảnh dưới thẻ đúng người: ông Tuy — bằng Nghệ nhân Hà Nội (2019) + không gian trưng bày của ông; bà Hương — cơ sở của bà
  people(
    g2.people.map((per, i) => [per, ar.image[i]]),
    ([[name]]) =>
      /Tuy/.test(name[0])
        ? f.row(
            [
              ['Bằng công nhận danh hiệu Nghệ nhân Hà Nội (2019) của ông Lê Văn Tuy', 'レー・ヴァン・トゥイ氏の「ハノイ職人」称号の認定証（2019年）'],
              ['Không gian trưng bày của nghệ nhân Lê Văn Tuy', '職人レー・ヴァン・トゥイの展示スペース'],
            ],
            { ratio: R.std }
          )
        : f.pool.unshift(['Nghệ nhân Tạ Thu Hương (áo đỏ) cùng các bạn trẻ tại cơ sở nón của bà', 'ター・トゥー・フオン（赤い服）と、工房を訪れた若者たち'])
  )

  // 3.2 bảo tồn, 3.3 thách thức: mỗi chủ đề = tiêu đề nhỏ + đoạn văn + ảnh
  // mỗi chủ đề một cặp trang (luật trang đôi): chữ chia cân hai trang, ảnh / video khung chuẩn, dài thì "Đọc thêm";
  // đoạn dẫn của mục đứng đầu cặp trang của chủ đề đầu tiên
  const topics = (list, lead) => {
    list.forEach((t, i) => f.story({ lead: i === 0 ? lead : null, h: t.h, paras: t.p, images: [t.video && { video: t.video }, ...(t.images ?? [t.image])].filter(Boolean) }))
  }
  const ps = ch.preservation
  mark(2, ps.title, f.section('3.2', ps.title), '3.2')
  topics(ps.topics, [ps.intro])
  const cl = ch.challenges
  mark(2, cl.title, f.section('3.3', cl.title), '3.3')
  topics(cl.topics, [cl.intro])
  f.end()

  // cặp trang khép chương, hai trang đối xứng (góp ý: bố cục lệch mắt): trái = ảnh khung dọc + chú thích canh giữa trang,
  // dải màu chương ở mép ngoài; phải = lời khép chương chữ lớn canh giữa trang, hình tre già măng mọc phía trên
  if ((pages.length + 1) % 2 === 0) {
    const hint = ['Ảnh toàn trang: nón lá làm duyên cho tà áo dài trong đình Chuông', '全面写真：チュオン村の亭で、アオザイに添えられたノンラー']
    const lp = new Page({ chapter: 3, hideNumber: true, bg: C.cream })
    lp.fixed = true
    const cap = [pageCap(hint[0]), pageCap(hint[1])]
    const iw = 330
    const ih = r1(iw * R.por)
    const ch = capH(cap, iw)
    const x = 18 + (W - 18 - iw) / 2
    const y0 = (H - (ih + 10 + ch)) / 2
    lp.add(RECT(0, 0, 18, H, ACC[3], { name: 'Dải màu' }), IMG(x, y0, iw, ih, hint, { name: 'Ảnh trang' }))
    lp.add(T(x, y0 + ih + 10, iw, ch, cap, { ...capOpt, italic: true, align: 'center', color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
  }
  const p = new Page({ chapter: 3, hideNumber: true, bg: C.cream })
  p.fixed = true
  const qw = W - 150
  const qh = textH(cl.outro, qw, quoteOpt(25))
  const dh = 165
  let y = (H - (dh + 40 + qh)) / 2
  p.add(RECT(W - 18, 0, 18, H, ACC[3], { name: 'Dải màu' }), { ...DECO('tre-mang', (W - 18 - dh) / 2, y, dh, dh, 0.9), name: 'Hình vẽ' })
  y += dh + 18
  p.add(HL((W - 18 - 64) / 2, y, 64, ACC[3], 1.8))
  quote(p, y + 22, cl.outro, (W - 18 - qw) / 2, qw, { size: 25, align: 'center', color: C.ink })
}

// ═════════════════════════════════════════ PHẦN KẾT
{
  const e = ending
  const f = new Flow(9, ['KẾT LUẬN', 'まとめ'], [...POOL[9]])
  mark(1, e.conclusion.title, f.section(null, e.conclusion.title), '—')
  f.story({ paras: e.conclusion.p, title: e.conclusion.title })
  f.end()

  f.runLabel = ['LƯU Ý', 'ご注意'] // đầu trang mọi trang của phần này (không chỉ trang đầu)
  // lưu ý: toàn văn gọn trong một trang (góp ý của người dùng), không chia cặp trang + ảnh
  mark(1, e.notice.title, f.section(null, e.notice.title, ['Đôi lời gửi bạn đọc', '読者の皆様へ']), '—')
  f.prose(e.notice.p, { budget: false, size: 14, lh: 1.55, paraGap: 6 })
  f.end()

  f.runLabel = ['TÀI LIỆU THAM KHẢO', '参考文献']
  f.unit()
  mark(1, e.references.title, f.p, '—')
  f.y = sectionHead(f.p, TOP, null, e.references.title, ['Tư liệu đã dùng', 'この本の資料'])
  e.references.items.forEach((ref, i) => {
    const ro = { size: 14, lh: 1.5, jaSize: 14 }
    const hh = textH(ref, CW - 34, ro)
    f.place(hh, (p, y) => p.add(T(p.x0, y, 30, 18, [`[${i + 1}]`, null], { size: 12, color: ACC[9], weight: 700, lh: 1.5, name: 'Số' }), T(p.x0 + 34, y, p.cw - 34, hh, ref, { ...ro, color: C.ink2, jaFont: F.jaSans, name: 'Tài liệu' })), 12)
  })
  // nguồn ảnh lấy từ báo chí / kho ảnh mở (ảnh còn lại do nhóm tự chụp)
  {
    const credits = [
      ['NGUỒN ẢNH', '写真の出典'],
      ['Ảnh không ghi nguồn do nhóm tự chụp tại làng Chuông và các bảo tàng ở Hà Nội.', '出典の記載がない写真は、チュオン村とハノイの博物館で著者が撮影したものです。'],
      ['Báo Tuổi Trẻ (Nhà hát Ba Nón Lá; Tổng thống Hàn Quốc) · Báo Dân trí (thời trang) · Báo Người Lao Động (nón bài thơ) · Báo Lao Động (nón lá bàng; nón ngựa) · Báo Quân đội nhân dân (nón lá sen; nón lá làng Chuông ở mục 1.1; dao cắt lá; nón thúng — ảnh Hồng Phúc) · VietNamNet (Phu nhân Thủ tướng Singapore)', 'トゥオイチェー紙（三つのノンラー劇場・韓国大統領）・ザンチー紙（ファッション）・グオイラオドン紙（詩の笠）・ラオドン紙（バンの葉の笠・馬の笠）・人民軍隊紙（蓮の葉の笠・1.1節のチュオン村のノンラー・小刀・ノン・トゥン ― 写真：ホン・フック）・ベトナムネット（シンガポール首相夫人）'],
      ['Wikimedia Commons: nón Thanh Oai (Daderot, CC0, hiện vật Bảo tàng Phụ nữ Việt Nam) · thạp đồng Đào Thịnh (Daderot, CC0) · trống đồng Ngọc Lũ (phạm vi công cộng) · hàng bán nón Hà Nội 1896 (André Salles, BnF, phạm vi công cộng)', 'ウィキメディア・コモンズ：タインオアイの笠（Daderot、CC0、ベトナム女性博物館所蔵）・ダオティン銅甕（Daderot、CC0）・ゴックルー銅鼓（パブリックドメイン）・1896年ハノイの笠屋（アンドレ・サル、フランス国立図書館、パブリックドメイン）'],
      ['Video nón lá trên sàn diễn thời trang quốc tế (mục 3.2): nghệ nhân Lê Văn Tuy cung cấp.', '海外のファッションショーのノンラーの動画（3.2節）：職人レー・ヴァン・トゥイ提供。'],
      ['Chân dung nghệ nhân Phạm Trần Canh: Báo Thể thao & Văn hóa (thethaovanhoa.vn) · gian hàng nón làng Chuông tại hội chợ: Báo Đại biểu Nhân dân (daibieunhandan.vn, 2025).', '職人ファム・チャン・カインの写真：テータオ＆ヴァンホア紙（thethaovanhoa.vn）・見本市のチュオン村の笠のブース：ダイビエウニャンザン紙（daibieunhandan.vn、2025年）。'],
      ['Bản đồ Việt Nam: dữ liệu Natural Earth (phạm vi công cộng), bản theo quan điểm của Việt Nam.', 'ベトナムの地図：ナチュラルアースのデータ（パブリックドメイン、ベトナムの立場による版）。'],
      ['Bản đồ hành trình: nền bản đồ vẽ từ dữ liệu © OpenStreetMap contributors (ODbL) · định tuyến OSRM · quãng đường theo Google Maps.', '旅の地図：© オープンストリートマップの貢献者のデータから作成・距離はグーグルマップによる。'],
    ]
    const co = { size: 12.5, lh: 1.5, jaSize: 12.5, paraGap: 5 }
    const body = join(credits.slice(1))
    const hh = textH(body, CW, co)
    f.place(22 + hh, (p, y) => p.add(T(p.x0, y + 10, p.cw, 16, credits[0], { size: S.label, tracking: 2.4, weight: 700, color: ACC[9], jaFont: F.jaSans, name: 'Nhóm' }), T(p.x0, y + 32, p.cw, hh, body, { ...co, color: C.ink2, jaFont: F.jaSans, name: 'Nguồn ảnh' })))
    f.end()
  }

  // trang kết: giảng viên hướng dẫn, thành viên, email
  const p = new Page({ chapter: 9, bg: C.cream })
  runningHead(p, ['NHÓM THỰC HIỆN', '制作チーム'])
  mark(1, e.team.title, p, '—')
  let y = sectionHead(p, TOP, null, e.team.title, ['Những người làm nên cuốn sách', 'この本をつくった人たち'])
  const lo = { size: 16, lh: 1.55, jaSize: jaPt(16) }
  const lh = textH(e.team.lead, p.cw, lo)
  p.add(T(p.x0, y, p.cw, lh, e.team.lead, { ...lo, jaFont: F.jaBody, name: 'Đoạn văn' }))
  y += lh + 18
  p.add(T(p.x0, y, p.cw, 16, e.team.membersTitle.map((s) => s.toUpperCase()), { size: S.label, tracking: 2.4, weight: 700, color: ACC[9], jaFont: F.jaSans, name: 'Nhóm' }))
  y += 30
  const mw = (p.cw - 14) / 2
  e.team.members.forEach(([name, code], i) => {
    const mx = p.x0 + (i % 2) * (mw + 14)
    const my = y + Math.floor(i / 2) * 138
    // chưa có ảnh chân dung của nhóm → chữ cái đầu tên trong vòng đường khâu (không để khung ảnh tạm)
    const ini = name[0].split(' ').slice(-2).map((w) => w[0]).join('')
    const cx = mx + (mw - 64) / 2
    p.add(
      RECT(cx, my, 64, 64, TINT[9], { radius: 32, stroke: ACC[9], sw: 0.9, dash: '3 2.5', name: 'Vòng tên' }),
      T(cx, my + 19, 64, 26, [ini, null], { font: F.head, size: 22, align: 'center', color: ACC[9], lh: 1.2, name: 'Chữ đầu tên' }),
      T(mx, my + 74, mw, 22, name, { font: F.head, size: 16.5, align: 'center', lh: 1.3, jaFont: F.jaHead, jaSize: 15, name: 'Tên thành viên' }),
      T(mx, my + 100, mw, 16, [code, null], { size: 12, tracking: 1.4, align: 'center', color: C.muted, name: 'Mã sinh viên' })
    )
  })
  y += 2 * 138 + 4
  p.add(HL(p.x0, y, p.cw, C.line, 0.5))
  const co = { size: 14, lh: 1.55, jaSize: jaPt(14), paraGap: 4 }
  const ch = textH(e.team.contact, p.cw, co)
  p.add(T(p.x0, y + 16, p.cw, ch, e.team.contact, { ...co, align: 'center', italic: true, color: C.ink2, jaFont: F.jaBody, name: 'Liên hệ' }))
  p.add(T(p.x0, y + 24 + ch, p.cw, 22, ['Email: ' + e.team.email, 'メール：' + e.team.email], { size: 15, weight: 700, align: 'center', color: ACC[9], lh: 1.4, jaFont: F.jaSans, name: 'Email' }))

  // trang lót mặt trong bìa sau (trang phải) rồi bìa sau (trang trái cuối cùng)
  if ((pages.length + 1) % 2 === 0) photoPage(['Ảnh toàn trang: những chiếc nón trên sân phơi lúc hoàng hôn', '全面写真：夕暮れの庭に並ぶノンラー'], 9)
  photoPage(['Ảnh trang lót: em bé ôm chiếc nón lá — thế hệ mai sau của làng nghề', '見返し写真：ノンラーを抱く幼い子 ― 工芸村の次の世代'], 9)
  const b = new Page({ chapter: 9, hideNumber: true, bg: C.cream, paper: 'giay' })
  b.add(
    // không ảnh: mười sáu vòng nón + nón nét vàng như bìa trước
    RECT(26, 26, W - 52, H - 52, 'none', { stroke: '#a07a3c', sw: 0.8, dash: '3 2.5', opacity: 0.6, name: 'Đường khâu' }),
    { ...DECO('vong-non', W / 2 - 210, 110, 420, 420, 0.16), name: 'Hình vẽ' },
    { ...DECO('bia-non', W / 2 - 170, 220, 340, 198, 1), name: 'Hình vẽ' },
    T(50, H * 0.6 + 110, W - 100, 34, ['Cảm ơn quý độc giả', 'ありがとうございました'], { font: F.script, size: 27, align: 'center', color: '#a07a3c', lh: 1.3, jaFont: F.jaBody, jaSize: 21, name: 'Lời cảm ơn' }),
    T(50, H - 100, W - 100, 38, ['NÓN LÁ LÀNG CHUÔNG\nĐại học FPT Hà Nội · 2026 · nonla09092026@gmail.com', 'チュオン村のノンラー\nFPT大学ハノイ校・2026年・nonla09092026@gmail.com'], { size: 10, tracking: 1.2, align: 'center', color: C.muted, lh: 1.7, jaFont: F.jaSans, name: 'Thông tin' })
  )
}

// ═════════════════════════════════════════ HÀNH TRÌNH 8 CHẶNG (điền sau khi biết trang)
// Bản đồ kiểu bàn cờ trải cả cặp trang: con đường uốn lượn từ trên xuống ở trang trái rồi vòng lên ở trang phải,
// mỗi chặng một trạm (hình vẽ nét mảnh dụng cụ của công đoạn), cuối đường là chiếc nón hoàn thiện.
// Ý Minh Ánh: lật tới thì con đường chạy dần, chạy tới đâu hiện công đoạn tới đó; bấm trạm nào lật tới công đoạn đó.
{
  const acc = ACC[2]
  const L = stripPage
  const Rp = stripRight
  const ICON = { 1: 'tool-re-la', 2: 'tool-la-la', 3: 'tool-but-vong', 4: 'tool-quay-non', 5: 'tool-khau-non', 6: 'tool-nuc-non', 7: 'tool-luon-nhoi', 0: 'tool-quang-dau' }
  const anim = (kind, delay, dur) => (el) => ({ ...el, anim: { kind, delay: r1(delay), dur } })
  // con đường: mặt đường ngà rộng + vạch đứt màu đất nung ở giữa (vẽ SVG cùng hệ toạ độ trang)
  const road = (d) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" stroke-linecap="round" stroke-linejoin="round">` +
    `<path d="${d}" stroke="#e7d7b6" stroke-width="26"/><path d="${d}" stroke="#f6eedc" stroke-width="20"/>` +
    `<path d="${d}" stroke="${acc}" stroke-width="2.6" stroke-dasharray="8 9"/></svg>`
  const dir = path.join(here, '..', '..', 'public', 'assets', 'book', 'journey')
  fs.mkdirSync(dir, { recursive: true })
  // hình chữ U: xuống dọc trang trái (trạm cột trái, nhãn bên phải), vòng qua chân hai trang, lên dọc trang phải
  // (trạm cột phải, nhãn bên trái) → đường đi không bao giờ cắt qua chữ
  const ys = [280, 410, 540, 670]
  const PL = ys.map((y) => [118, y])
  const PR = [...ys].reverse().map((y) => [W - 125, y])
  const xr = W - 125
  fs.writeFileSync(path.join(dir, 'left.svg'), road(`M118 205 C 100 230, 100 255, 118 280 C 150 320, 150 370, 118 410 C 86 450, 86 500, 118 540 C 150 580, 150 630, 118 670 C 90 712, 160 752, 300 752 L ${W + 6} 752`))
  fs.writeFileSync(path.join(dir, 'right.svg'), road(`M-6 752 L 290 752 C 420 752, ${xr + 30} 712, ${xr} 670 C ${xr - 32} 630, ${xr - 32} 580, ${xr} 540 C ${xr + 32} 500, ${xr + 32} 450, ${xr} 410 C ${xr - 32} 370, ${xr - 32} 320, ${xr} 280 C ${xr + 20} 250, ${xr + 20} 230, ${xr} 205`))
  const img = (pg, name, kind, delay, dur) => anim(kind, delay, dur)({ ...IMG(0, 0, W, H, null, { src: `assets/book/journey/${name}.svg`, fit: 'fill', name: 'Hình vẽ' }) })
  // tiêu đề + dòng viết tay
  const to = { size: 28, font: F.head, lh: 1.2, jaSize: 26 }
  const head = blockLabel(ch2.process.stepsH.h, ch2.process.stepsH.id)
  L.add(T(L.x0, TOP + 2, L.cw, textH(head, L.cw, to), head, { ...to, color: C.title, jaFont: F.jaHead, name: 'Tiêu đề' }))
  L.add(T(L.x0, TOP + 52, L.cw, 26, ch2.process.journey, { font: F.hand, size: 19, lh: 1.3, jaSize: 17, color: acc, jaFont: F.jaHand, name: 'Lời dẫn' }))
  L.add(img(L, 'left', 'grow', 0.1, 1.9))
  Rp.add(img(Rp, 'right', 'grow-up', 2.0, 1.9))
  const station = (pg, [cx, cy], s, i, delay) => {
    const r = 44
    const right = cx < W / 2 // nhãn nằm bên phải trạm
    const lw = right ? pg.x1 - (cx + r + 18) : cx - r - 18 - pg.x0
    const lx = right ? cx + r + 18 : pg.x0
    const no = s.finish ? [`BƯỚC ${i + 1} · ${strip(s.label[0]).toUpperCase()}`, `ステップ${i + 1}・${strip(s.label[1])}`] : [`BƯỚC ${s.no}`, `ステップ${s.no}`]
    const nameO = { font: F.head, size: 20, lh: 1.2, jaSize: 19 }
    const nh = textH(s.name, lw, nameO)
    const subO = { size: 12.5, italic: true, lh: 1.35 }
    const sub = [`${strip(s.sub[0])} · tr. ${s.page}`, `${strip(s.sub[1])}・${s.page}ページ`]
    const sh = textH(sub, lw, subO)
    const top = cy - (16 + nh + 4 + sh) / 2
    const els = [
      ELL(cx - r, cy - r, 2 * r, 2 * r, '#fbf6ea', { stroke: acc, sw: 2 }),
      { ...DECO(ICON[s.finish ? 0 : s.no], cx - r * 0.78, cy - r * 0.78, r * 1.56, r * 1.56, 1), name: 'Hình vẽ' },
      ELL(cx - r - 4, cy - r - 4, 26, 26, acc),
      T(cx - r - 4, cy - r + 0.5, 26, 18, [String(i + 1), null], { font: F.head, size: 14, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số bước' }),
      T(lx, top, lw, 16, no, { size: 11.5, tracking: 2, weight: 700, color: acc, align: right ? 'left' : 'right', lh: 1.3, jaFont: F.jaSans, name: 'Nhãn bước' }),
      T(lx, top + 16, lw, nh, s.name, { ...nameO, weight: 700, color: C.ink, align: right ? 'left' : 'right', jaFont: F.jaHead, name: 'Tên bước' }),
      T(lx, top + 16 + nh + 4, lw, sh, sub, { ...subO, color: C.muted, align: right ? 'left' : 'right', jaFont: F.jaSans, name: 'Phụ đề' }),
      RECT(Math.min(cx - r, lx) - 6, Math.min(cy - r, top) - 6, lw + 2 * r + 28, Math.max(2 * r, 16 + nh + 4 + sh) + 12, 'none', { radius: 10, link: `#p${s.page}`, alt: `${strip(s.name[0])} — tr. ${s.page}`, name: 'Trạm công đoạn' }),
    ]
    pg.add(els.map(anim('pop', delay, 0.55)))
  }
  stepPages.forEach((s, i) => (i < 4 ? station(L, PL[i], s, i, 0.35 + i * 0.45) : station(Rp, PR[i - 4], s, i, 2.25 + (i - 4) * 0.45)))
  // cuối đường: chiếc nón hoàn thiện + lời viết tay
  Rp.add(anim('pop', 4.1, 0.7)({ ...DECO('non', xr - 95, 70, 190, 165, 1), name: 'Hình vẽ' }))
  Rp.add(anim('fade', 4.4, 0.6)(T(Rp.x0, 116, 280, 60, ch2.process.done, { font: F.hand, size: 24, lh: 1.25, jaSize: 20, color: acc, jaFont: F.jaHand, name: 'Lời kết' })))
  // mỗi cặp trang công đoạn: hình vẽ dụng cụ của bước (giống trạm trên bản đồ) + hàng chấm tiến trình 8 bước,
  // chấm của bước đang xem tô màu, bấm chấm nào lật tới bước đó
  stepPages.forEach((s) => {
    const pg = pages[s.page - 1]
    const hl = pg.els.find((e) => e.type === 'line' && e.name === 'Đường kẻ' && e.y > TOP && e.y < 320)
    const dy = hl ? hl.y + 2 : TOP + 120
    pg.add({ ...DECO(ICON[s.finish ? 0 : s.no], pg.x1 - 92, TOP - 6, 92, 92, 0.95), name: 'Hình vẽ' })
    stepPages.forEach((t, j) => {
      const x = pg.x1 - (stepPages.length - j) * 16
      const on = t === s
      pg.add(ELL(x, dy - 5, 10, 10, on ? acc : '#fbf6ea', { stroke: acc, sw: 1.2, link: on ? undefined : `#p${t.page}`, alt: `${strip(t.name[0])} — tr. ${t.page}`, name: 'Chấm tiến trình' }))
    })
  })

  // mười sáu vòng nón in mờ vắt ngang gáy sách: mỗi trang một nửa → hai trang liền một khối (ý Minh Ánh: họa tiết nối hai trang)
  const ds = 560
  L.els.unshift({ ...DECO('vong-non', W - ds / 2, 250, ds, ds, 0.17), name: 'Hình vẽ' })
  Rp.els.unshift({ ...DECO('vong-non', -ds / 2, 250, ds, ds, 0.17), name: 'Hình vẽ' })
}

// ═════════════════════════════════════════ BA THẺ CHƯƠNG trong lời mở đầu (điền sau khi biết trang chương)
{
  const { page: p, y: top, h: ch, gap } = contents
  const chapters = anchors.filter((a) => /^0\d$/.test(a.label))
  chapters.forEach((a, i) => {
    const y = top + i * (ch + gap)
    const no = Number(a.label)
    const acc = ACC[no]
    const card = preface.chapters[i]
    const title = [strip(a.title[0]).replace(/\n/g, ' '), strip(a.title[1]).replace(/\n/g, '')]
    const alt = `${a.label} ${title[0]} — tr. ${a.page}`
    // thẻ giấy sáng viền "đường khâu" màu chương; hình vẽ trong khung tròn nhạt; số chương lớn + "Trang 08 →" bên phải
    // cả thẻ là một nút: lớp link phủ trên cùng (trước đây chữ và hình nằm đè lên link nên bấm vào chữ không lật trang)
    const iw = 84
    const ix = p.x0 + 14
    const tx = ix + iw + 18
    const tw = p.x1 - 96 - tx
    const tO = { font: F.head, size: 16.5, lh: 1.25, jaSize: 15.5 }
    const th = Math.min(textH(title, tw, tO), 44)
    const pad = String(a.page).padStart(2, '0')
    p.add(
      RECT(p.x0, y, p.cw, ch, '#fbf6ea', { radius: 8, opacity: 0.92, stroke: TINT[no], sw: 1.2, name: 'Thẻ chương' }),
      RECT(p.x0 + 5, y + 5, p.cw - 10, ch - 10, 'none', { radius: 5, stroke: acc, sw: 0.8, dash: '3 2.5', opacity: 0.7, name: 'Đường khâu' }),
      ELL(ix, y + (ch - iw) / 2, iw, iw, TINT[no], { opacity: 0.75, name: 'Nền hình vẽ' }),
      { ...DECO(card.icon, ix + 5, y + (ch - iw) / 2 + 5, iw - 10, iw - 10, 0.95), name: 'Hình vẽ' },
      T(tx, y + 11, 160, 18, [`CHƯƠNG ${no}`, `第${no}章`], { size: 11, tracking: 2.2, weight: 700, color: acc, lh: 1.3, jaFont: F.jaSans, name: 'Số chương' }),
      T(tx, y + 29, tw, th, title, { ...tO, color: C.ink, jaFont: F.jaHead, name: 'Tên chương' }),
      T(tx, y + 33 + th, tw, ch - 44 - th, card.text, { size: 12, lh: 1.38, jaSize: 12, italic: true, color: C.ink2, jaFont: F.jaSans, name: 'Mô tả chương' }),
      T(p.x1 - 66, y + 8, 54, 40, [String(no).padStart(2, '0'), null], { font: F.head, size: 34, color: acc, align: 'right', lh: 1.15, name: 'Số chương lớn' }),
      T(p.x1 - 92, y + ch - 30, 80, 16, [`Trang ${pad} →`, `${a.page}ページ →`], { size: 10.5, weight: 600, tracking: 0.5, color: acc, align: 'right', lh: 1.3, jaFont: F.jaSans, name: 'Số trang chương' }),
      RECT(p.x0, y, p.cw, ch, 'none', { radius: 8, link: `#p${a.page}`, alt, name: 'Nút thẻ chương' })
    )
  })
}

// ═════════════════════════════════════════ MỤC LỤC (điền sau khi biết số trang)
{
  const head = (pg) => {
    pg.add(T(pg.x0, 70, 320, 44, tocTitle.map(strip), { font: F.head, size: 34, lh: 1.2, color: C.title, jaFont: F.jaHead, name: 'Tiêu đề' }), HL(pg.x0, 124, 56, ACC[0], 1.4))
    return 150
  }
  const rows = anchors.map((a) => {
    const title = [strip(a.title[0]).replace(/\n/g, ' '), a.title[1] && strip(a.title[1]).replace(/\n/g, '')]
    const o = a.level === 1 ? { font: F.head, size: 17.5, lh: 1.3, jaSize: 17 } : a.level === 2 ? { size: 14, lh: 1.4, jaSize: 14 } : { size: 13, lh: 1.4, jaSize: 13 }
    const indent = a.level === 1 ? 50 : a.level === 2 ? 88 : 126
    const th = textH(title, CW - indent - 56, o)
    return { a, title, o, indent, th, need: a.level === 1 ? th + 20 : th + 7 }
  })
  // ngắt sang trang phải ở đầu một chương sao cho hai trang dài gần bằng nhau
  const sum = (list) => list.reduce((n, r) => n + r.need, 0)
  let cut = rows.length
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].a.level !== 1) continue
    if (Math.max(sum(rows.slice(0, i)), sum(rows.slice(i))) < Math.max(sum(rows.slice(0, cut)), sum(rows.slice(cut)))) cut = i
  }
  rows.forEach((r, i) => (r.page = i < cut ? 0 : 1))
  let y = head(tocPages[0])
  let p = tocPages[0]
  for (const r of rows) {
    if (r.page === 1 && p === tocPages[0]) {
      // trang phải nối tiếp, không lặp tiêu đề; dòng đầu ngang hàng dòng đầu trang trái
      p = tocPages[1]
      y = 150
    }
    const { a, title, o, indent, th } = r
    const acc = ACC[{ '01': 1, '02': 2, '03': 3 }[a.label] ?? (a.label[0] === '1' ? 1 : a.label[0] === '2' ? 2 : a.label[0] === '3' ? 3 : 9)]
    const pg = String(a.page).padStart(2, '0')
    // cả dòng (số mục + tên + số trang) là một khối bấm: rê chuột sáng cả dòng, bấm → lật tới trang đó
    const row = (pg, ry, rh, dx = 0) => RECT(pg.x0 + dx - 8, ry, pg.cw - dx + 16, rh, 'none', { radius: 4, link: `#p${a.page}`, alt: `${a.label === '—' ? '' : a.label + ' '}${title[0]} — tr. ${a.page}`, name: 'Dòng mục lục' })
    if (a.level === 1) {
      y += 12
      p.add(T(p.x0, y - 3, 44, 26, [a.label, null], { font: F.head, size: 21, color: acc, lh: 1.1, name: 'Số chương' }), T(p.x0 + indent, y, p.cw - indent - 56, th, title, { ...o, color: C.ink, jaFont: F.jaHead, name: 'Mục lục' }), T(p.x1 - 44, y + 1, 44, 20, [pg, null], { font: F.head, size: 15, color: acc, align: 'right', lh: 1.3, name: 'Số trang' }))
      p.add(row(p, y - 6, th + 10))
      y += th + 8
    } else {
      p.add(T(p.x0 + indent - 40, y, 38, 18, [a.label, null], { size: a.level === 2 ? 13.5 : 12.5, color: acc, weight: 700, lh: 1.4, name: 'Số mục' }), T(p.x0 + indent, y, p.cw - indent - 56, th, title, { ...o, color: a.level === 2 ? C.ink2 : C.muted, jaFont: F.jaSans, name: 'Mục lục' }), T(p.x1 - 44, y, 44, 18, [pg, null], { size: 13, color: C.muted, align: 'right', lh: 1.4, name: 'Số trang' }))
      p.add(row(p, y - 3, th + 5, indent - 40))
      y += th + 7
    }
    if (y > BOT) console.warn(`⚠ Mục lục tràn: ${Math.round(y)} > ${Math.round(BOT)}`)
  }
  // trang phải ngắn hơn → tranh tĩnh vật nét mảnh (chồng nón, tre) lấp nửa dưới, không để trống nền
  const room = BOT - y - 30
  if (room > 120) {
    const tp = tocPages[1]
    const ih = Math.min(tp.cw * (310 / 640), room)
    const iw = ih * (640 / 310)
    tp.add({ ...DECO('still-non', tp.x0 + (tp.cw - iw) / 2, BOT - ih - 6, iw, ih, 0.95), name: 'Hình vẽ' })
  }
  // cuối trang trái: lời nhắn viết tay — bấm vào dòng mục lục để lật tới trang
  {
    const tp = tocPages[0]
    tp.add(T(tp.x0, BOT - 30, tp.cw, 26, ['Bấm vào một dòng để lật tới trang đó', '行をタップすると、そのページへ移動します'], { font: F.hand, size: 18, lh: 1.3, jaSize: 15, color: ACC[0], align: 'right', jaFont: F.jaHand, name: 'Lời nhắn' }))
  }
}

// ── dàn lại từng trang: không để dải trống dưới đáy trang
// Sau khi xếp xong, phần còn dư ở đáy trang được (1) dùng để phóng ảnh lên khung tỉ lệ cố định lớn hơn kế tiếp
// (3:2 → 4:3 → 1:1…, ảnh là phần tử cao nhất trong hàng của nó), rồi (2) chia vào khoảng cách giữa các khối.
// Phần tử neo đáy (chú thích cuối trang) và trang trang trí / ảnh tràn trang thì để nguyên.
// trang trí đứng yên: đầu trang (vùng trên TOP), họa tiết góc, lớp tối; đường kẻ / số trong vùng nội dung thì dời theo khối của nó
const DECOR = new Set(['Đầu trang', 'Vạch màu', 'Họa tiết', 'Lớp tối'])
const FRAMES = [R.pan, R.cin, R.wide, R.std, R.sq, R.por]
function settle(p) {
  if (p.fixed || p.bg === '#2b2118' || p.els.some((e) => e.type === 'image' && e.w * e.h > W * H * 0.8)) return
  const movable = p.els.filter((e) => !DECOR.has(e.name) && e.y >= TOP - 10 && e.y < BOT)
  const anchored = movable.filter((e) => e.y + e.h >= BOT - 30 && e.y > BOT - 200 && e.name !== 'Ảnh' && e.type !== 'image' && e.type !== 'widget')
  const free = movable.filter((e) => !anchored.includes(e))
  if (free.length < 2) return
  const floor = anchored.length ? Math.min(...anchored.map((e) => e.y)) - 30 : BOT
  // khối: các phần tử chồng nhau theo chiều dọc, hoặc sát nhau (≤ 10pt: chú thích dưới ảnh, chữ dưới tiêu đề)
  const sorted = [...free].sort((a, b) => a.y - b.y)
  const bands = []
  for (const e of sorted) {
    const b = bands.at(-1)
    if (b && e.y < b.y1 + 10) {
      b.els.push(e)
      b.y1 = Math.max(b.y1, e.y + e.h)
    } else bands.push({ y0: e.y, y1: e.y + e.h, els: [e] })
  }
  let spare = floor - bands.at(-1).y1
  if (spare < 14) return
  const shift = (list, d) => list.forEach((e) => (e.y = r1(e.y + d)))
  // (1) phóng ảnh (hàng ảnh không có chữ đứng cạnh): phần tử bên dưới ảnh trong khối và các khối sau dời xuống
  for (const [bi, b] of bands.entries()) {
    if (spare < 14) break
    const first = b.els.find((e) => isPhoto(e) && e.fit !== 'contain' && !e.rot)
    if (!first) continue
    const row = b.els.filter((e) => isPhoto(e) && Math.abs(e.y - first.y) < 2 && Math.abs(e.h - first.h) < 2)
    const y0 = first.y
    const y1 = first.y + first.h
    const beside = b.els.some((e) => !row.includes(e) && e.type !== 'shape' && e.y < y1 - 2 && e.y + e.h > y0 + 2)
    if (beside) continue
    const w = Math.min(...row.map((e) => e.w))
    const maxR = w > CW * 0.6 ? R.std : R.por
    const next = FRAMES.filter((r) => r <= maxR + 0.001 && r * w > first.h + 4 && r * w - first.h <= spare).at(-1)
    if (!next) continue
    const d = next * w - first.h
    for (const e of b.els) {
      if (row.includes(e) || (e.type === 'shape' && e.y <= y0 + 1 && e.y + e.h >= y1 - 1)) e.h = r1(e.h + d)
      else if (e.y >= y1 - 1) e.y = r1(e.y + d)
    }
    bands.slice(bi + 1).forEach((o) => shift(o.els, d))
    spare -= d
  }
  // (2) chia phần còn dư vào khoảng cách giữa các hàng (mỗi khoảng tối đa 36pt)
  if (spare >= 14 && bands.length > 1) {
    const add = Math.min(36, spare / (bands.length - 1))
    bands.forEach((b, i) => i && shift(b.els, add * i))
  }
}
// trang chỉ có chữ còn chỗ ở đáy → một hình vẽ nét mảnh theo chương (họa tiết nón / tre / sen theo góp ý của nhóm),
// trang không còn trơn chữ và không để dải trống
const VIGNETTE = { 0: 'still-non', 1: 'non', 2: 'tool-quay-non', 3: 'tre-mang', 9: 'still-non' }
function vignette(p) {
  if (p.fixed || p.hasImg || p.els.some((e) => e.type === 'image' && e.name === 'Hình vẽ')) return
  // chú thích cuối trang (và gạch ngắn phía trên nó) neo đáy, không tính là nội dung
  const foot = p.els.find((e) => e.name === 'Chú thích' && e.y > BOT - 200)
  const footTop = foot ? foot.y - 16 : BOT
  const content = p.els.filter((e) => !DECOR.has(e.name) && e.y >= TOP - 10 && e.y < footTop)
  if (!content.length) return
  const bottom = Math.max(...content.map((e) => e.y + e.h))
  const anchoredTop = footTop
  const room = anchoredTop - bottom - 24
  if (room < 64) return
  // ít chỗ thì chỉ một chiếc nón nhỏ làm hoa văn cuối trang
  const name = room < 110 ? 'non' : VIGNETTE[p.chapter] ?? 'non'
  const ratio = name === 'still-non' ? 310 / 640 : name === 'lotus-pond' || name === 'tre-mang' ? 1 : name === 'non' ? 260 / 300 : 1
  const h = Math.min(room, 200)
  const w = Math.min(p.cw, h / ratio)
  p.add({ ...DECO(name, p.x0 + (p.cw - w) / 2, bottom + 24 + (room - h) / 2, w, h, 0.9), name: 'Hình vẽ' })
}
pages.forEach(vignette)
pages.forEach(settle)
// hoa văn cuối trang: trang có ảnh mà đáy còn dải trống (chữ / ảnh không chia đều được) → hình vẽ nét mảnh nhỏ của chương
function tailpiece(p) {
  if (p.fixed || p.bg === '#2b2118' || p.els.some((e) => e.type === 'image' && e.w * e.h > W * H * 0.8)) return
  const foot = p.els.find((e) => e.name === 'Chú thích' && e.y > BOT - 200)
  const footTop = foot ? foot.y - 16 : BOT
  const content = p.els.filter((e) => !DECOR.has(e.name) && e.y >= TOP - 10 && e.y < footTop && e.name !== 'Nền số mục')
  if (!content.length) return
  const bottom = Math.max(...content.map((e) => e.y + e.h))
  const room = footTop - bottom - 20
  if (room < 84) return
  const name = VIGNETTE[p.chapter] === 'still-non' && room >= 110 ? 'still-non' : SEC_ICON[p.chapter] ?? 'non'
  const ratio = name === 'still-non' ? 310 / 640 : 1
  const h = Math.min(room - 16, 120)
  const w = Math.min(p.cw, h / ratio)
  p.add({ ...DECO(name, p.x0 + (p.cw - w) / 2, bottom + 20 + (room - h) / 2, w, h, 0.85), name: 'Hình vẽ' })
}
pages.forEach(tailpiece)
// tâm khung theo khuôn mặt — tính sau cùng, khi khung ảnh đã chốt kích thước
for (const p of pages) for (const e of p.els) if (e.type === 'image' && !e.pos && e.hint) {
  const pos = facePos(e.hint, e.w, e.h)
  if (pos) e.pos = pos
}

// ── kiểm tra: chữ vượt đáy trang
for (const p of pages) {
  for (const el of p.els) {
    if (el.type === 'text' && el.y + el.h > H - 20 && p.bg !== '#2b2118' && !p.hideNumber) console.warn(`⚠ trang ${p.n}: "${String(el.text).slice(0, 30)}" chạm đáy (${Math.round(el.y + el.h)})`)
  }
}
// trang không có ảnh nào (yêu cầu: tối đa 1–2 trang chỉ có chữ)
const textOnly = pages.filter((p) => !p.hasImg && p.els.filter((e) => e.type === 'shape').length < 3 && !p.els.some((e) => e.type === 'image')).map((p) => p.n)
if (textOnly.length) console.warn(`ℹ Trang chỉ có chữ: ${textOnly.join(', ')}`)

// ── xuất
// mẫu nền giấy ngà + họa tiết (góp ý hình thức: nền trắng ngà xuyên suốt, trang nào cũng có họa tiết):
// trang ảnh tràn trang / nền tối thì thôi; trang chỉ có chữ → mười sáu vòng nón in mờ giữa trang (sen chỉ hợp ở ao đình);
// còn lại đổi theo cặp trang (hai trang đối diện cùng một mẫu, họa tiết đối xứng ở mép ngoài)
const SPREAD_PAPERS = ['tre', 'non', 'giay']
function paperFor(p) {
  if (p.paper !== undefined) return p.paper
  if (p.bg === '#2b2118') return null
  if (p.els.some((e) => e.type === 'image' && e.x <= 0 && e.y <= 0 && e.w >= W - 1 && e.h >= H - 1)) return null
  if (!p.hasImg) return 'vong'
  return SPREAD_PAPERS[Math.floor(p.n / 2) % SPREAD_PAPERS.length]
}
// khung cho mọi ảnh / video / bản đồ / mô hình đứng trên trang (góp ý: không để ảnh nào đứng trơ không khung);
// trừ ảnh tràn mép trang, ảnh đã nằm trong khung (polaroid, khung công đoạn, giấy chứng nhận), logo và hình vẽ nét mảnh
function addFrames(p) {
  const frames = p.els.filter((e) => e.type === 'shape' && /Khung/.test(e.name || ''))
  for (const e of p.els) {
    if (!['image', 'video', 'widget'].includes(e.type) || /deco\//.test(e.src || '') || /Logo|polaroid/.test(e.name || '')) continue
    if (e.x <= 0.5 || e.y <= 0.5 || e.x + e.w >= W - 0.5 || e.y + e.h >= H - 0.5) continue
    if (frames.some((f) => f.x <= e.x + 0.5 && f.y <= e.y + 0.5 && f.x + f.w >= e.x + e.w - 0.5 && f.y + f.h >= e.y + e.h - 0.5)) continue
    e.frame = r1(Math.max(3, Math.min(7, Math.min(e.w, e.h) * 0.028)))
  }
  return p.els
}
/**
 * trang kết thúc bằng một ảnh (khung chuẩn nhảy bậc) mà dưới đáy còn dải trống → hạ cụm ảnh + chú thích xuống giữa
 * khoảng trống (chia đều trên / dưới ảnh), không để một dải trống ở đáy trang; trang bố cục riêng (fixed) giữ nguyên
 */
const TAIL = new Set(['Ảnh', 'Chú thích ảnh', 'Chú thích video', 'Video trình diễn', 'Khung polaroid', 'Ảnh polaroid', 'Chú thích polaroid', 'Băng keo', 'Khung ảnh'])
function centerTail(p) {
  if (p.fixed) return
  const body = p.els.filter((e) => !DECOR.has(e.name) && !/deco\//.test(e.src || '') && e.y > TOP - 10)
  if (!body.length) return
  const bottom = Math.max(...body.map((e) => e.y + e.h))
  const gap = BOT - bottom
  if (gap <= 40 || gap >= 180) return
  const imgs = body.filter((e) => ['image', 'video'].includes(e.type) && TAIL.has(e.name ?? 'Ảnh'))
  if (!imgs.length) return
  const top = Math.max(...imgs.map((e) => e.y))
  const row = imgs.filter((e) => Math.abs(e.y - top) < 30)
  const y0 = Math.min(...row.map((e) => e.y)) - 30 // băng keo polaroid nằm trên mép ảnh
  const tail = body.filter((e) => e.y >= y0)
  if (!tail.every((e) => TAIL.has(e.name ?? 'Ảnh') || e.type === 'image')) return
  if (!body.some((e) => e.y + e.h <= y0 + 30)) return // trang chỉ có ảnh: không hạ
  tail.forEach((e) => (e.y = r1(e.y + gap / 2)))
}
pages.forEach(centerTail)
const out = pages.map((p) => ({ bg: p.bg, bgImage: null, paper: paperFor(p), template: null, hideNumber: p.hideNumber, elements: addFrames(p) }))
fs.mkdirSync(path.join(here, 'out'), { recursive: true })
fs.writeFileSync(path.join(here, 'out', 'book.json'), JSON.stringify({ pages: out }, null, 1))
const counts = out.map((p, i) => `${i + 1}:${p.elements.length}`).join(' ')
console.log(`${out.length} trang · ${out.reduce((n, p) => n + p.elements.length, 0)} phần tử · chiều cao chữ đo thật ${measureHits}/${measureHits + measureMiss}\n${counts}`)
// kiểm tra luật trang đôi: mục / mục con / công đoạn phải mở ở trang trái (số chẵn)
const offSpread = [...anchors.filter((a) => a.level >= 2), ...stepPages].filter((a) => a.page % 2 !== 0).map((a) => a.label ?? a.no)
if (offSpread.length) console.warn('⚠ mở ở trang phải (sai luật trang đôi):', offSpread.join(', '))
if (shortPool.length) console.warn('⚠ hết ảnh trong kho, trang ảnh tạm:', shortPool.join(', '))
console.log('Mục lục:', anchors.map((a) => `${a.label} ${strip(a.title[0]).replace(/\n/g, ' ')} → ${a.page}`).join(' | '))
