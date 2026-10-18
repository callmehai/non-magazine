#!/usr/bin/env node
/**
 * Dựng sách "Nón lá Làng Chuông" (song ngữ Việt – Nhật) thành dữ liệu trang cho editor.
 *   node scripts/book/build.mjs            → scripts/book/out/book.json
 *   node scripts/book/push.mjs             → thay các trang của sách "non" trong Supabase (trang cũ được cất đi)
 *
 * Nội dung: scripts/book/content/*.mjs (mỗi đoạn [tiếng Việt, tiếng Nhật]).
 * Quy tắc thiết kế (theo đề xuất của nhóm): giấy trắng ngà, tiêu đề serif + số lớn, họa tiết nét mảnh,
 * màu nhấn riêng từng chương, xen kẽ trang ảnh lớn / trang kể chuyện / trang thông tin.
 * Ảnh chưa có → khung ảnh tạm ghi rõ cần ảnh gì (hint); nhóm kéo ảnh thật vào thay trong editor.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { front, preface, tocTitle } from './content/00-front.mjs'
import { ch1 } from './content/01-ch1.mjs'
import { ch2 } from './content/02-ch2.mjs'
import { ch3, ending } from './content/03-ch3.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))

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
}
const ACC = { 0: '#a07a3c', 1: '#5f7350', 2: '#a95f3c', 3: '#3f7676', 9: '#8c6a33' }
const TINT = { 0: '#efe3c6', 1: '#e3e8d8', 2: '#f1dccd', 3: '#d9e6e3', 9: '#efe3c6' }
const F = { head: 'Playfair Display', body: 'Be Vietnam Pro', script: 'Dancing Script', jaHead: 'Shippori Mincho', jaBody: 'Noto Serif JP', jaSans: 'Noto Sans JP' }
const M = { top: 70, bottom: 74, outer: 50, inner: 62 }
const BODY = { size: 10.2, lh: 1.62, jaSize: 9.3 }

let seq = 0
const id = () => `nl${(++seq).toString(36)}`

// ── ước lượng chiều cao chữ (lấy bản dài hơn trong hai ngôn ngữ)
const strip = (s) => String(s ?? '').replace(/\{([^{}|]+)\|[^{}]+\}/g, '$1')
function lines(str, w, size, ja, font) {
  const k = ja ? 1.02 : font === F.head ? 0.56 : font === F.script ? 0.48 : 0.535
  const cpl = Math.max(4, Math.floor(w / (size * k)))
  return strip(str)
    .split('\n')
    .reduce((n, p) => n + Math.max(1, Math.ceil([...p].length / cpl)), 0)
}
function textH(pair, w, o = {}) {
  const size = o.size ?? BODY.size
  const lh = o.lh ?? BODY.lh
  const jaSize = o.jaSize ?? size
  const n = String(pair[0]).split('\n').length
  const gap = (o.paraGap ?? 0) * (n - 1)
  const hv = lines(pair[0], w, size, o.font === F.jaSans || o.font === F.jaBody, o.font) * size * lh + gap
  // phiên âm đội dòng lên: dòng chặt (tiêu đề) cần chừa nhiều hơn dòng thường
  const ruby = /\{/.test(pair[1] ?? '') ? (lh < 1.5 ? (lh + 0.75) / lh : 1.15) : 1
  const hj = pair[1] ? lines(pair[1], w, jaSize, true) * jaSize * lh * ruby + gap : 0
  return Math.ceil(Math.max(hv, hj) + 2)
}

// ── phần tử
const r1 = (n) => Math.round(n * 100) / 100
function T(x, y, w, h, pair, o = {}) {
  const [vi0, ja0] = Array.isArray(pair) ? pair : [pair, null]
  // chữ nhỏ (nhãn, chú thích, dòng phụ) không cần phiên âm — phiên âm chỉ giữ ở thân bài và tiêu đề
  const small = (o.size ?? BODY.size) < 9.5
  const vi = small ? strip(vi0) : vi0
  const ja = ja0 && small ? strip(ja0) : ja0
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
  if (o.vertical) el.vertical = true
  if (o.opacity != null) el.opacity = o.opacity
  return el
}
const IMG = (x, y, w, h, hint, o = {}) => ({
  id: id(),
  type: 'image',
  x: r1(x),
  y: r1(y),
  w: r1(w),
  h: r1(h),
  rot: 0,
  src: o.src ?? '',
  fit: o.fit ?? 'cover',
  hint: hint?.[0] ?? '',
  hintJa: hint?.[1] ?? '',
  name: o.name ?? 'Ảnh',
  ...(o.opacity != null ? { opacity: o.opacity } : {}),
})
const DECO = (name, x, y, w, h, opacity = 0.55) => ({ id: id(), type: 'image', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, src: `assets/book/deco/${name}.svg`, fit: 'contain', opacity, name: 'Họa tiết' })
const RECT = (x, y, w, h, fill, o = {}) => ({ id: id(), type: 'shape', shape: 'rect', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, fill, ...(o.stroke ? { stroke: o.stroke, strokeWidth: o.sw ?? 0.8 } : {}), ...(o.radius ? { radius: o.radius } : {}), ...(o.opacity != null ? { opacity: o.opacity } : {}), name: o.name ?? 'Hình' })
const ELL = (x, y, w, h, fill, o = {}) => ({ id: id(), type: 'shape', shape: 'ellipse', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, fill, ...(o.stroke ? { stroke: o.stroke, strokeWidth: o.sw ?? 0.8 } : {}), ...(o.opacity != null ? { opacity: o.opacity } : {}), name: 'Hình' })
const TRI = (x, y, w, h, fill, o = {}) => ({ id: id(), type: 'shape', shape: 'triangle', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, fill, ...(o.stroke ? { stroke: o.stroke, strokeWidth: o.sw ?? 0.8 } : {}), ...(o.opacity != null ? { opacity: o.opacity } : {}), name: 'Hình' })
const HL = (x, y, w, stroke = C.line, sw = 0.6) => ({ id: id(), type: 'line', x: r1(x), y: r1(y - 2), w: r1(w), h: 4, rot: 0, x1: 0, y1: 0.5, x2: 1, y2: 0.5, stroke, strokeWidth: sw, name: 'Đường kẻ' })
const VL = (x, y, h, stroke = C.line, sw = 0.6) => ({ id: id(), type: 'line', x: r1(x - 2), y: r1(y), w: 4, h: r1(h), rot: 0, x1: 0.5, y1: 0, x2: 0.5, y2: 1, stroke, strokeWidth: sw, name: 'Đường kẻ' })

/** dòng phụ bằng ngôn ngữ còn lại: đang đọc tiếng Việt thì hiện tiếng Nhật và ngược lại */
const alt = (pair) => [pair[1], strip(pair[0])]
const ALT = (x, y, w, pair, o = {}) => T(x, y, w, o.h ?? textH(alt(pair), w, { size: o.size ?? 8.4, font: F.jaSans, lh: 1.4 }), alt(pair), { size: o.size ?? 8.4, font: F.jaSans, jaFont: F.body, color: o.color ?? C.muted, lh: 1.4, align: o.align, tracking: 0.4, name: 'Chữ phụ' })

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
    this.els.push(...els.flat())
    return this
  }
}

/** đầu trang: trái = tên sách, phải = tên chương */
function runningHead(p, label) {
  const acc = ACC[p.chapter] ?? C.gold
  const text = p.side === 'left' ? ['NÓN LÁ LÀNG CHUÔNG', 'チュオン村のノンラー'] : [label[0].toUpperCase(), label[1]]
  p.add(
    T(p.x0, 36, p.cw, 10, text, { size: 6.6, tracking: 1.8, color: C.muted, align: p.side === 'left' ? 'left' : 'right', lh: 1.2, jaFont: F.jaSans, name: 'Đầu trang' }),
    HL(p.x0, 52, p.cw, C.line, 0.5),
    p.side === 'left' ? RECT(p.x0, 50.6, 26, 2.2, acc, { name: 'Vạch màu' }) : RECT(p.x1 - 26, 50.6, 26, 2.2, acc, { name: 'Vạch màu' })
  )
}

/** "1.1  Tên mục" + dòng phụ + vạch màu → trả y tiếp theo */
function sectionHead(p, y, num, title, o = {}) {
  const acc = ACC[p.chapter]
  const x = p.x0
  const tx = num ? x + 70 : x
  const tw = p.x1 - tx
  const th = textH(title, tw, { size: 19, font: F.head, lh: 1.22, jaSize: 18 })
  p.add(
    num && T(x, y - 4, 66, 44, [num, null], { font: F.head, size: 34, color: acc, lh: 1.1, name: 'Số mục' }),
    T(tx, y, tw, th, title, { font: F.head, size: 19, lh: 1.22, jaFont: F.jaHead, jaSize: 18, name: 'Tên mục' }),
    ALT(tx, y + th + 3, tw, title, { size: 8.6 })
  )
  const end = y + th + 18
  p.add(HL(tx, end + 8, 46, acc, 1.2))
  return Math.max(end + 22, num ? y + 48 : 0) + (o.after ?? 4)
}

/** tiêu đề nhỏ của khối nội dung */
function blockHead(p, y, h, x = p.x0, w = p.cw) {
  const acc = ACC[p.chapter]
  const hh = textH(h, w, { size: 12.6, font: F.head, lh: 1.25 })
  p.add(T(x, y, w, hh, h, { font: F.head, weight: 700, size: 12.6, color: acc, lh: 1.25, jaFont: F.jaHead, jaSize: 12, name: 'Tiêu đề nhỏ' }), ALT(x, y + hh + 1, w, h, { size: 7.8 }))
  return y + hh + 25
}

/** đoạn văn (nhiều đoạn gộp một khối) → y tiếp theo */
function prose(p, y, paras, x = p.x0, w = p.cw, o = {}) {
  const pair = [paras.map((q) => q[0]).join('\n'), paras.map((q) => q[1]).join('\n')]
  const opt = { size: o.size ?? BODY.size, lh: o.lh ?? BODY.lh, paraGap: o.paraGap ?? 6, jaSize: o.jaSize ?? BODY.jaSize }
  const h = textH(pair, w, opt)
  p.add(T(x, y, w, h, pair, { ...opt, align: o.align ?? 'justify', color: o.color ?? C.ink, jaFont: F.jaBody, italic: o.italic, font: o.font, name: o.name ?? 'Đoạn văn' }))
  return y + h + (o.after ?? 10)
}

/** ảnh + chú thích → y tiếp theo */
function figure(p, x, y, w, h, cap, o = {}) {
  p.add(IMG(x, y, w, h, cap))
  if (o.noCaption) return y + h + 8
  const ch = textH(cap, w, { size: 7, lh: 1.35 })
  p.add(T(x, y + h + 4, w, ch, cap, { size: 7, lh: 1.35, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
  return y + h + ch + 12
}

/** trích dẫn lớn */
function quote(p, y, pair, x = p.x0, w = p.cw, o = {}) {
  const size = o.size ?? 15
  const h = textH(pair, w, { size, font: F.head, lh: 1.45, jaSize: size - 1.5 })
  p.add(T(x, y, w, h, pair, { font: F.head, italic: true, size, lh: 1.45, color: o.color ?? C.ink2, jaFont: F.jaHead, jaSize: size - 1.5, align: o.align ?? 'left', name: 'Trích dẫn' }))
  return y + h + 10
}

/** chú thích cuối trang */
function footnotes(p, notes, o = {}) {
  const pair = [notes.map((q) => q[0]).join('\n'), notes.map((q) => q[1]).join('\n')]
  const h = textH(pair, p.cw, { size: 6.9, lh: 1.45, paraGap: 2 })
  const y = H - M.bottom - h + (o.lift ?? 0)
  p.add(HL(p.x0, y - 8, 80, C.line, 0.6), T(p.x0, y, p.cw, h, pair, { size: 6.9, lh: 1.45, paraGap: 2, color: C.muted, jaFont: F.jaSans, name: 'Chú thích' }))
  return y - 16
}

/** cặp trang mở chương: trái ảnh lớn tràn trang, phải tên chương */
function chapterOpener(ch, photo) {
  const acc = ACC[ch.no]
  const left = new Page({ chapter: ch.no, hideNumber: true })
  left.add(IMG(0, 0, W, H, photo, { name: 'Ảnh mở chương' }), RECT(0, H - 170, W, 170, '#1f1810', { opacity: 0.5, name: 'Nền chữ' }), T(left.x0, H - 156, 300, 132, [String(ch.no).padStart(2, '0'), null], { font: F.head, size: 110, color: '#fbf7ee', lh: 1.1, name: 'Số chương' }))
  const p = new Page({ chapter: ch.no, hideNumber: true, bg: C.cream })
  p.add(RECT(W - 18, 0, 18, H, acc, { name: 'Dải màu chương' }), DECO('bamboo', W - 210, H - 380, 170, 350, 0.42))
  let y = 120
  p.add(T(p.x0, y, 300, 14, [ch.label[0].toUpperCase(), ch.label[1]], { size: 9, tracking: 3, color: acc, weight: 700, jaFont: F.jaSans, name: 'Nhãn chương' }))
  y += 30
  const th = textH(ch.title, p.cw - 30, { size: 27, font: F.head, lh: 1.22, jaSize: 24 })
  p.add(T(p.x0, y, p.cw - 30, th, ch.title, { font: F.head, size: 27, lh: 1.22, jaFont: F.jaHead, jaSize: 24, name: 'Tên chương' }))
  y += th + 8
  p.add(ALT(p.x0, y, p.cw - 30, ch.title, { size: 9.4 }))
  y += textH(alt(ch.title), p.cw - 30, { size: 9.4, font: F.jaSans, lh: 1.4 }) + 22
  p.add(HL(p.x0, y, 60, acc, 1.6))
  y += 26
  prose(p, y, [ch.lead], p.x0, p.cw - 150, { size: 10.6, lh: 1.7, align: 'left', color: C.ink2 })
  return { left, right: p }
}

// ═════════════════════════════════════════ BÌA
{
  const p = new Page({ hideNumber: true, bg: C.cream })
  p.add(
    IMG(0, 0, W, 500, ['Ảnh bìa: những chiếc nón lá trắng Làng Chuông xếp lớp, ánh nắng nhẹ', '表紙写真：重ねられたチュオン村の白いノンラー、やわらかな光'], { name: 'Ảnh bìa' }),
    RECT(0, 500, W, 3, ACC[0], { name: 'Vạch màu' }),
    DECO('bamboo', W - 200, 520, 180, 330, 0.5),
    T(52, 540, 420, 96, ['NÓN LÁ\nLÀNG CHUÔNG', null], { font: F.head, size: 42, lh: 1.08, tracking: 2.5, color: C.ink, name: 'Tên sách' }),
    T(54, 642, 420, 22, [strip(front.title[1]) + '：' + strip(front.subtitle[1]), null], { font: F.jaBody, size: 14.5, lh: 1.3, color: C.ink2, name: 'Tên sách tiếng Nhật' }),
    T(52, 668, 420, 40, [front.subtitle[0], null], { font: F.script, size: 26, lh: 1.3, color: ACC[0], name: 'Chữ viết tay' }),
    RECT(54, 726, 128, 20, 'none', { stroke: ACC[0], sw: 0.8, radius: 10, name: 'Khung nhãn' }),
    T(54, 730.5, 128, 12, ['SONG NGỮ VIỆT – NHẬT', null], { size: 6.6, tracking: 1.6, align: 'center', color: ACC[0], weight: 700, lh: 1.2, name: 'Nhãn song ngữ' }),
    IMG(54, 772, 70, 26, ['Logo FPT', 'FPTロゴ'], { fit: 'contain', name: 'Logo' }),
    T(134, 776, 300, 22, [`${front.team[0]}\n${strip(front.team[1])}`, null], { size: 6.8, lh: 1.5, color: C.muted, name: 'Tên nhóm' })
  )
}

// ═════════════════════════════════════════ LỜI MỞ ĐẦU (2 trang)
{
  const p = new Page({ chapter: 0 })
  runningHead(p, ['LỜI MỞ ĐẦU', 'はじめに'])
  p.add(DECO('leaf-sprig', p.x1 - 120, 60, 120, 120, 0.4))
  let y = 92
  p.add(T(p.x0, y, p.cw - 120, 34, preface.title, { font: F.head, size: 26, lh: 1.2, jaFont: F.jaHead, name: 'Tiêu đề' }))
  y += 36
  p.add(ALT(p.x0, y, 300, preface.title, { size: 10 }))
  y += 24
  p.add(HL(p.x0, y, 46, ACC[0], 1.2))
  y += 20
  y = prose(p, y, preface.paras.slice(0, 2))
  y = quote(p, y + 6, preface.pull, p.x0 + 24, p.cw - 48, { size: 14, align: 'center' })

  const q = new Page({ chapter: 0 })
  runningHead(q, ['LỜI MỞ ĐẦU', 'はじめに'])
  let y2 = prose(q, 82, preface.paras.slice(2))
  q.add(T(q.x0, y2 + 4, q.cw, 34, preface.sign, { size: 9.6, italic: true, align: 'right', color: C.ink2, lh: 1.5, jaFont: F.jaBody, name: 'Ký tên' }))
  const imgY = y2 + 52
  figure(q, q.x0, imgY, q.cw, Math.max(160, H - M.bottom - imgY - 30), ['Cổng làng Chuông, Phương Trung, Hà Nội', 'チュオン村の門（ハノイ・フオンチュン社）'])
}

// ═════════════════════════════════════════ ẢNH + MỤC LỤC
{
  const p = new Page({ hideNumber: false, chapter: 0 })
  p.add(IMG(0, 0, W, H, ['Ảnh toàn trang: chiếc nón lá trắng Làng Chuông (trang ảnh trước mục lục)', '全面写真：チュオン村の白いノンラー'], { name: 'Ảnh toàn trang' }))
}
const tocPage = new Page({ chapter: 0, bg: C.cream })
const anchors = [] // { level, label, title, page }
const mark = (level, title, page, label) => anchors.push({ level, title, page: page.n, label })

// ═════════════════════════════════════════ CHƯƠNG 1
{
  const ch = ch1
  const { left } = chapterOpener(ch, ['Ảnh mở chương: thiếu nữ áo dài đội nón lá giữa cánh đồng', '章扉写真：田んぼの中、アオザイ姿でノンラーをかぶる女性'])
  mark(1, ch.title, left, '01')
  const [s11, gal, s12, s13] = ch.sections

  // 1.1 — khái niệm + công dụng
  let p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  mark(2, s11.title, p, '1.1')
  let y = sectionHead(p, 84, '1.1', s11.title)
  for (const b of s11.blocks.slice(0, 2)) {
    y = blockHead(p, y, b.h)
    y = prose(p, y, b.p)
  }
  figure(p, p.x0, y + 4, p.cw, Math.max(120, H - M.bottom - y - 40), ['Nón lá trong đời sống thường ngày: che nắng, che mưa khi lao động', '日々の暮らしの中のノンラー：働く人を日差しや雨から守る'])

  // các giá trị + 4 ảnh
  p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  const val = s11.blocks[2]
  y = blockHead(p, 84, val.h)
  y = prose(p, y, val.p)
  const gw = (p.cw - 12) / 2
  const gh = (H - M.bottom - y - 62) / 2
  let yy = y
  for (let i = 0; i < 4; i++) {
    const gx = p.x0 + (i % 2) * (gw + 12)
    const gy = yy + Math.floor(i / 2) * (gh + 30)
    figure(p, gx, gy, gw, gh, val.images[i])
  }

  // hai dáng nón: trang ảnh
  p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  y = sectionHead(p, 84, null, gal.title)
  y = prose(p, y, gal.intro, p.x0, p.cw, { size: 9.8 })
  const g0 = gal.groups[0]
  p.add(T(p.x0, y, p.cw, 16, g0.name, { font: F.head, size: 13, weight: 700, color: ACC[1], jaFont: F.jaHead, name: 'Nhóm' }))
  y += 22
  const cw4 = (p.cw - 12) / 2
  const ch4 = (H - M.bottom - y - 70) / 2
  g0.items.forEach(([name, place], i) => {
    const gx = p.x0 + (i % 2) * (cw4 + 12)
    const gy = y + Math.floor(i / 2) * (ch4 + 36)
    p.add(IMG(gx, gy, cw4, ch4, [`${name[0]} — ${place[0]}`, `${strip(name[1])} — ${place[1]}`]))
    p.add(T(gx, gy + ch4 + 5, cw4, 15, name, { font: F.head, size: 11, lh: 1.25, jaFont: F.jaHead, name: 'Tên nón' }), T(gx, gy + ch4 + 20, cw4, 11, place, { size: 7.6, tracking: 1, color: C.muted, lh: 1.3, jaFont: F.jaSans, name: 'Địa phương' }))
  })

  p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  const g1 = gal.groups[1]
  p.add(T(p.x0, 84, p.cw, 16, g1.name, { font: F.head, size: 13, weight: 700, color: ACC[1], jaFont: F.jaHead, name: 'Nhóm' }))
  const bh = (H - M.bottom - 112 - 60) / 2
  g1.items.forEach(([name, place], i) => {
    const gy = 108 + i * (bh + 34)
    p.add(IMG(p.x0, gy, p.cw, bh, [`${name[0]} — ${place[0]} (mặt trong / mặt ngoài)`, `${strip(name[1])} — ${place[1]}（内側／外側）`]))
    p.add(T(p.x0, gy + bh + 6, p.cw * 0.6, 16, name, { font: F.head, size: 12, jaFont: F.jaHead, name: 'Tên nón' }), T(p.x1 - 160, gy + bh + 9, 160, 12, place, { size: 7.6, tracking: 1, color: C.muted, align: 'right', jaFont: F.jaSans, name: 'Địa phương' }))
  })

  // 1.2 — dòng thời gian
  p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  mark(2, s12.title, p, '1.2')
  y = sectionHead(p, 84, '1.2', s12.title)
  const tr = s12.blocks[0]
  y = blockHead(p, y, tr.h)
  y = prose(p, y, tr.p)
  const tlX = p.x0 + 96
  const tlTop = y + 6
  const notesTop = footnotes(p, tr.notes)
  const step = Math.min(78, (notesTop - tlTop - 10) / tr.timeline.length)
  p.add(VL(tlX, tlTop, step * (tr.timeline.length - 1) + 8, ACC[1], 1))
  tr.timeline.forEach(([when, what], i) => {
    const ty = tlTop + i * step
    p.add(
      ELL(tlX - 5, ty, 10, 10, i === 0 ? ACC[1] : C.cream, { stroke: ACC[1], sw: 1.2 }),
      T(p.x0, ty - 2, 84, 30, when, { font: F.head, size: 11, weight: 700, color: ACC[1], align: 'right', lh: 1.2, jaFont: F.jaHead, jaSize: 10, name: 'Mốc thời gian' }),
      T(tlX + 16, ty - 2, p.x1 - tlX - 16, step - 8, what, { size: 9.4, lh: 1.5, jaSize: 9, jaFont: F.jaBody, name: 'Sự kiện' })
    )
  })

  // sau timeline + hình dáng hiện đại + biểu trưng
  p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  y = prose(p, 84, tr.after)
  for (const b of s12.blocks.slice(1, 3)) {
    y = blockHead(p, y + 2, b.h)
    y = prose(p, y, b.p)
  }
  const sym = s12.blocks[2]
  const iw = (p.cw - 12) / 2
  const ih = Math.max(100, H - M.bottom - y - 40)
  figure(p, p.x0, y, iw, ih, sym.images[0])
  figure(p, p.x0 + iw + 12, y, iw, ih, sym.images[1])

  // chuyển sang làng Chuông
  p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  const tr2 = s12.blocks[3]
  y = blockHead(p, 84, tr2.h)
  y = prose(p, y, tr2.p)
  figure(p, p.x0, y + 4, p.cw, H - M.bottom - y - 44, ['Toàn cảnh làng Chuông — những sân phơi lá, mái nhà làm nón', 'チュオン村の風景 — 葉を干す庭と笠づくりの家々'])

  // 1.3 — làng Chuông
  p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  mark(2, s13.title, p, '1.3')
  const v = s13.blocks[0]
  y = sectionHead(p, 84, '1.3', s13.title)
  y = blockHead(p, y, v.h)
  y = prose(p, y, v.p.slice(0, 2))
  figure(p, p.x0, y, p.cw, Math.max(110, H - M.bottom - y - 36), v.images[0])

  p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  y = prose(p, 84, v.p.slice(2))
  const hw = (p.cw - 12) / 2
  const hh2 = Math.max(110, H - M.bottom - y - 50)
  figure(p, p.x0, y + 4, hw, hh2, v.images[1])
  figure(p, p.x0 + hw + 12, y + 4, hw, hh2, v.images[2])

  // các loại nón
  const ty = s13.blocks[1]
  p = new Page({ chapter: 1 })
  runningHead(p, ch.label)
  p.add(IMG(0, 60, W, 420, ty.hero, { name: 'Ảnh lớn' }))
  y = blockHead(p, 500, ty.h)
  y = prose(p, y, ty.p)

  const typePage = (items, withAfter) => {
    const tp = new Page({ chapter: 1 })
    runningHead(tp, ch.label)
    let ty0 = 84
    const rowH = (H - M.bottom - ty0 - (withAfter ? 120 : 0)) / items.length
    items.forEach((t) => {
      const iwT = 150
      tp.add(IMG(tp.x0, ty0, iwT, Math.min(rowH - 18, 150), [`${t.name[0]} — ảnh mặt trong và mặt ngoài`, `${strip(t.name[1])} — 内側と外側の写真`]))
      const tx = tp.x0 + iwT + 16
      tp.add(T(tx, ty0 - 2, tp.x1 - tx, 18, t.name, { font: F.head, size: 13, weight: 700, color: ACC[1], lh: 1.25, jaFont: F.jaHead, name: 'Tên nón' }))
      tp.add(T(tx, ty0 + 20, tp.x1 - tx, rowH - 40, t.text, { size: 9.3, lh: 1.55, align: 'justify', jaSize: 8.9, jaFont: F.jaBody, name: 'Mô tả' }))
      ty0 += rowH
    })
    if (withAfter) {
      tp.add(RECT(tp.x0, ty0 - 4, tp.cw, 104, TINT[1], { radius: 6, name: 'Khung ghi chú' }))
      tp.add(T(tp.x0 + 16, ty0 + 8, tp.cw - 32, 84, withAfter[0], { size: 9.2, lh: 1.55, italic: true, color: C.ink2, jaSize: 8.8, jaFont: F.jaBody, name: 'Ghi chú' }))
    }
  }
  typePage(ty.types.slice(0, 3))
  typePage(ty.types.slice(3), ty.after)
}

// ═════════════════════════════════════════ CHƯƠNG 2
{
  const ch = ch2
  if (pages.length % 2 === 0) new Page({ chapter: 1, hideNumber: true }).add(IMG(0, 0, W, H, ['Ảnh toàn trang: nón lá Làng Chuông', '全面写真：チュオン村のノンラー']))
  const { left } = chapterOpener(ch, ['Ảnh mở chương: đôi bàn tay nghệ nhân khâu nón trên khuôn', '章扉写真：型の上で笠を縫う職人の手'])
  mark(1, ch.title, left, '02')
  const st = ch.structure

  // 2.1 + 3 lớp (sơ đồ vẽ bằng hình)
  let p = new Page({ chapter: 2 })
  runningHead(p, ch.label)
  mark(2, st.title, p, '2.1')
  let y = sectionHead(p, 84, '2.1', st.title)
  y = prose(p, y, st.intro)
  y = blockHead(p, y + 2, st.layers.h)
  y = prose(p, y, [st.layers.intro], p.x0, p.cw, { size: 9.8 })
  // sơ đồ ba lớp: ba nón xếp tầng
  const dx = p.x0 + 150
  const dw = p.cw - 150
  const layerFill = ['#e6c991', '#d2b17c', '#f1e2bf']
  const layerStroke = ['#8c5a32', '#a4865a', '#b9a37a']
  const dTop = y + 6
  const dH = H - M.bottom - dTop - 24
  const coneH = Math.min(118, dH / 2.4)
  for (let i = 0; i < 3; i++) {
    const cy = dTop + i * coneH * 0.78
    const cwid = dw * (1 - i * 0.16)
    const cx = dx + (dw - cwid) / 2
    p.add(TRI(cx, cy, cwid, coneH, layerFill[i], { stroke: layerStroke[i], sw: i === 0 ? 1.6 : 1, opacity: 0.92 }), ELL(cx, cy + coneH - 9, cwid, 18, layerFill[i], { stroke: layerStroke[i], sw: 1, opacity: 0.92 }))
    const item = st.layers.items[i]
    const ly = cy + coneH * 0.42
    p.add(ELL(p.x0, ly, 18, 18, ACC[2]), T(p.x0, ly + 3.5, 18, 12, [String(i + 1), null], { size: 8.5, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số' }), T(p.x0 + 24, ly + 1, 120, 30, item[0], { font: F.head, size: 10.5, weight: 700, color: ACC[2], lh: 1.3, jaFont: F.jaHead, jaSize: 9.6, name: 'Lớp' }))
  }
  p.add(T(dx, H - M.bottom - 14, dw, 12, ['Minh họa cấu trúc tách lớp, không theo tỷ lệ thực tế', '層を分けた構造のイメージ図（実寸ではありません）'], { size: 6.8, italic: true, color: C.muted, align: 'center', jaFont: F.jaSans, name: 'Chú thích sơ đồ' }))

  p = new Page({ chapter: 2 })
  runningHead(p, ch.label)
  y = 84
  st.layers.items.forEach((item, i) => {
    p.add(ELL(p.x0, y, 22, 22, ACC[2]), T(p.x0, y + 4.5, 22, 14, [String(i + 1), null], { size: 10, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số' }))
    p.add(T(p.x0 + 34, y, p.cw - 34, 18, item[0], { font: F.head, size: 13, weight: 700, color: ACC[2], jaFont: F.jaHead, name: 'Lớp' }))
    const hh = textH(item[1], p.cw - 34, { size: 9.8, lh: 1.6, jaSize: 9.3 })
    p.add(T(p.x0 + 34, y + 20, p.cw - 34, hh, item[1], { size: 9.8, lh: 1.6, jaSize: 9.3, jaFont: F.jaBody, align: 'justify', name: 'Mô tả lớp' }))
    y += 20 + hh + 16
  })
  y = quote(p, y, st.layers.outro, p.x0, p.cw, { size: 11.5 })
  figure(p, p.x0, y + 4, p.cw, H - M.bottom - y - 42, st.layers.image)

  // khung 16 vành: chữ + sơ đồ vòng
  p = new Page({ chapter: 2 })
  runningHead(p, ch.label)
  y = blockHead(p, 84, st.frame.h)
  y = prose(p, y, st.frame.p)
  const fTop = y + 4
  const fH = Math.min(250, H - M.bottom - fTop - 110)
  const fw = 250
  const fx = p.x0 + (p.cw - fw) / 2
  p.add(TRI(fx, fTop, fw, fH, 'none', { stroke: '#a4865a', sw: 0.8, opacity: 0.6 }))
  for (let i = 0; i < 16; i++) {
    const t = (i + 1) / 16
    const rw = fw * t
    const ry = fTop + fH * t
    p.add(ELL(fx + (fw - rw) / 2, ry - Math.max(2, rw * 0.09) / 2, rw, Math.max(2, rw * 0.09), 'none', { stroke: i === 15 ? ACC[2] : '#a4865a', sw: i === 15 ? 1.6 : 0.9 }))
  }
  p.add(T(fx + fw + 8, fTop - 4, 110, 26, ['Chóp nón', '頂'], { size: 8, italic: true, color: C.muted, lh: 1.3, jaFont: F.jaSans, name: 'Nhãn' }), T(fx + fw + 8, fTop + fH - 8, 120, 26, ['Vòng cạp (vòng 16)', '縁の輪（16本目）'], { size: 8, italic: true, color: ACC[2], lh: 1.3, jaFont: F.jaSans, name: 'Nhãn' }))
  const nY = fTop + fH + 24
  p.add(RECT(p.x0, nY, p.cw, H - M.bottom - nY, TINT[2], { radius: 6, name: 'Khung ghi chú' }), T(p.x0 + 14, nY + 12, p.cw - 28, H - M.bottom - nY - 20, st.frame.note, { size: 8.8, lh: 1.55, italic: true, color: C.ink2, jaFont: F.jaBody, jaSize: 8.4, name: 'Ghi chú' }))

  p = new Page({ chapter: 2, hideNumber: false })
  p.add(IMG(0, 0, W, H, st.frame.image, { name: 'Ảnh toàn trang' }))

  // 2.2 nguyên liệu & dụng cụ
  const mt = ch.materials
  const cards = (pg, y0, items, rowH) => {
    items.forEach(([name, text, hint], i) => {
      const cy = y0 + i * rowH
      pg.add(IMG(pg.x0, cy, 140, Math.min(rowH - 16, 118), hint))
      const tx = pg.x0 + 156
      pg.add(T(tx, cy - 2, pg.x1 - tx, 18, name, { font: F.head, size: 13, weight: 700, color: ACC[2], jaFont: F.jaHead, name: 'Tên' }))
      pg.add(T(tx, cy + 20, pg.x1 - tx, rowH - 34, text, { size: 9.3, lh: 1.55, align: 'justify', jaSize: 8.8, jaFont: F.jaBody, name: 'Mô tả' }))
    })
  }
  p = new Page({ chapter: 2 })
  runningHead(p, ch.label)
  mark(2, mt.title, p, '2.2')
  y = sectionHead(p, 84, '2.2', mt.title)
  p.add(T(p.x0, y, p.cw, 14, ['NGUYÊN LIỆU', '材料'], { size: 8, tracking: 2.4, weight: 700, color: C.muted, jaFont: F.jaSans, name: 'Nhóm' }))
  cards(p, y + 22, mt.items.slice(0, 3), (H - M.bottom - y - 22) / 3)
  p = new Page({ chapter: 2 })
  runningHead(p, ch.label)
  cards(p, 84, mt.items.slice(3), (H - M.bottom - 84) / 3)
  p = new Page({ chapter: 2 })
  runningHead(p, ch.label)
  p.add(T(p.x0, 84, p.cw, 14, ['DỤNG CỤ', '道具'], { size: 8, tracking: 2.4, weight: 700, color: C.muted, jaFont: F.jaSans, name: 'Nhóm' }))
  const [mold, ...tools] = mt.tools
  p.add(IMG(p.x0, 106, p.cw, 170, mold[2]))
  p.add(T(p.x0, 286, p.cw, 18, mold[0], { font: F.head, size: 13, weight: 700, color: ACC[2], jaFont: F.jaHead, name: 'Tên' }))
  y = prose(p, 308, [mold[1]], p.x0, p.cw, { size: 9.3, lh: 1.55, jaSize: 8.8 })
  cards(p, y + 2, tools, (H - M.bottom - y - 2 - 70) / 2)
  p.add(RECT(p.x0, H - M.bottom - 60, p.cw, 60, TINT[2], { radius: 6, name: 'Khung ghi chú' }), T(p.x0 + 14, H - M.bottom - 52, p.cw - 28, 46, mt.outro, { size: 8.6, lh: 1.5, italic: true, color: C.ink2, jaSize: 8.2, jaFont: F.jaBody, name: 'Ghi chú' }))

  // 2.3 quy trình
  const pr = ch.process
  p = new Page({ chapter: 2 })
  runningHead(p, ch.label)
  mark(2, pr.title, p, '2.3')
  y = sectionHead(p, 84, '2.3', pr.title)
  y = blockHead(p, y, pr.leaf.h)
  y = prose(p, y, pr.leaf.p, p.x0, p.cw, { size: 9.5, lh: 1.56, jaSize: 9 })
  const lw = (p.cw - 12) / 2
  const lh2 = Math.max(90, H - M.bottom - y - 36)
  figure(p, p.x0, y, lw, lh2, pr.leaf.images[0])
  figure(p, p.x0 + lw + 12, y, lw, lh2, pr.leaf.images[1])

  const stepBlock = (pg, s, y0, hgt) => {
    const acc = ACC[2]
    pg.add(ELL(pg.x0, y0, 34, 34, acc), T(pg.x0, y0 + 7, 34, 20, [String(s.no), null], { font: F.head, size: 15, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số bước' }))
    pg.add(T(pg.x0 + 46, y0 - 1, pg.cw - 46, 20, [`Bước ${s.no} · ${s.name[0]}`, `ステップ${s.no}・${s.name[1]}`], { font: F.head, size: 15, weight: 700, color: C.ink, lh: 1.25, jaFont: F.jaHead, jaSize: 14, name: 'Tên bước' }))
    pg.add(T(pg.x0 + 46, y0 + 20, pg.cw - 46, 12, s.sub, { size: 8, italic: true, color: acc, lh: 1.3, jaFont: F.jaSans, name: 'Phụ đề' }))
    const iy = y0 + 46
    const iwS = 200
    const ihS = hgt - 64
    pg.add(IMG(pg.x0, iy, iwS, ihS, s.image))
    pg.add(T(pg.x0 + iwS + 16, iy, pg.cw - iwS - 16, ihS, s.text, { size: 10.4, lh: 1.65, align: 'justify', jaSize: 9.8, jaFont: F.jaBody, name: 'Mô tả bước' }))
  }
  for (let i = 0; i < pr.steps.length; i += 2) {
    p = new Page({ chapter: 2 })
    runningHead(p, ['QUY TRÌNH CHẾ TÁC', '製作工程'])
    const half = (H - M.bottom - 84) / 2
    stepBlock(p, pr.steps[i], 84, half - 14)
    p.add(HL(p.x0, 84 + half - 6, p.cw, C.line, 0.5))
    stepBlock(p, pr.steps[i + 1], 84 + half + 8, half - 14)
  }
  // trang kết chương: ảnh nón hoàn thiện + trích dẫn
  p = new Page({ chapter: 2, hideNumber: true })
  p.add(IMG(0, 0, W, H - 190, ['Ảnh toàn trang: chiếc nón lá trắng hoàn thiện, bóng nhẹ sau khi quang dầu', '全面写真：油を塗り終え、やわらかな艶をもつ完成したノンラー']), RECT(0, H - 190, W, 190, C.cream, { name: 'Nền' }), DECO('non-line', W / 2 - 80, H - 175, 160, 85, 0.6))
  quote(p, H - 82, ['Mười sáu vòng nứa, ba lớp lá — một ngày cần mẫn của đôi bàn tay.', '十六の輪と三層の葉 — {職人|しょくにん}の手が{紡|つむ}ぐ一日。'], 60, W - 120, { size: 13, align: 'center' })
}

// ═════════════════════════════════════════ CHƯƠNG 3
{
  const ch = ch3
  if (pages.length % 2 === 0) new Page({ chapter: 2, hideNumber: true }).add(IMG(0, 0, W, H, ['Ảnh toàn trang: chợ nón Chuông', '全面写真：チュオンの笠市場']))
  const { left } = chapterOpener(ch, ['Ảnh mở chương: nghệ nhân cao tuổi bên chiếc nón — giữ nghề cho mai sau', '章扉写真：笠とともに微笑む年配の職人 — 技を未来へ'])
  mark(1, ch.title, left, '03')
  const rc = ch.recognition

  let p = new Page({ chapter: 3 })
  runningHead(p, ch.label)
  mark(2, rc.title, p, '3.1')
  let y = sectionHead(p, 84, '3.1', rc.title)
  p.add(DECO('leaf-sprig', p.x1 - 90, y - 6, 90, 90, 0.35))
  y = quote(p, y + 4, rc.proverb, p.x0 + 20, p.cw - 120, { size: 15.5 })
  y = prose(p, y + 4, rc.p.slice(0, 1))
  footnotes(p, rc.notes.slice(0, 2))

  p = new Page({ chapter: 3 })
  runningHead(p, ch.label)
  y = prose(p, 84, rc.p.slice(1))
  const notesY = footnotes(p, rc.notes.slice(2))
  const w3 = (p.cw - 24) / 3
  const h3 = Math.max(90, notesY - y - 36)
  rc.images.forEach((im, i) => figure(p, p.x0 + i * (w3 + 12), y, w3, h3, im))

  // nghệ nhân
  const ar = ch.artisans
  p = new Page({ chapter: 3 })
  runningHead(p, ch.label)
  y = sectionHead(p, 84, null, ar.title)
  y = prose(p, y, [ar.intro], p.x0, p.cw, { size: 9.8 })
  const person = (pg, yy, [[n0, n1], role, bio], wide) => {
    const hh = textH(bio, pg.cw - (wide ? 0 : 0), { size: 9.1, lh: 1.55, jaSize: 8.7 })
    pg.add(T(pg.x0, yy, pg.cw, 18, [n0, n1], { font: F.head, size: 12.5, weight: 700, color: C.ink, jaFont: F.jaHead, name: 'Tên nghệ nhân' }), T(pg.x0, yy + 18, pg.cw, 12, role, { size: 8, italic: true, color: ACC[3], jaFont: F.jaSans, name: 'Vai trò' }), T(pg.x0, yy + 33, pg.cw, hh, bio, { size: 9.1, lh: 1.55, jaSize: 8.7, align: 'justify', jaFont: F.jaBody, name: 'Tiểu sử' }))
    return yy + 33 + hh + 14
  }
  const g1 = ar.groups[0]
  p.add(T(p.x0, y, p.cw, 14, g1.name, { size: 8, tracking: 2.2, weight: 700, color: ACC[3], jaFont: F.jaSans, name: 'Nhóm' }))
  y += 22
  for (const per of g1.people) y = person(p, y, per)
  figure(p, p.x0, y + 2, p.cw, Math.max(80, H - M.bottom - y - 40), ['Nón lá trắng, nón quai thao cổ và bộ sưu tập các kiểu nón truyền thống', '白いノンラー、古いクアイタオ笠、伝統的な笠のコレクション'])

  p = new Page({ chapter: 3 })
  runningHead(p, ch.label)
  const g2 = ar.groups[1]
  p.add(T(p.x0, 84, p.cw, 14, g2.name, { size: 8, tracking: 2.2, weight: 700, color: ACC[3], jaFont: F.jaSans, name: 'Nhóm' }))
  y = 106
  g2.people.forEach((per, i) => {
    const ph = 150
    p.add(IMG(p.x0, y, 120, ph, ar.image[i]))
    const tx = p.x0 + 134
    const bioH = textH(per[2], p.x1 - tx, { size: 9.1, lh: 1.55, jaSize: 8.7 })
    p.add(T(tx, y - 2, p.x1 - tx, 18, per[0], { font: F.head, size: 12.5, weight: 700, jaFont: F.jaHead, name: 'Tên nghệ nhân' }), T(tx, y + 17, p.x1 - tx, 12, per[1], { size: 8, italic: true, color: ACC[3], jaFont: F.jaSans, name: 'Vai trò' }), T(tx, y + 33, p.x1 - tx, bioH, per[2], { size: 9.1, lh: 1.55, jaSize: 8.7, align: 'justify', jaFont: F.jaBody, name: 'Tiểu sử' }))
    y += Math.max(ph, 33 + bioH) + 26
  })
  p.add(RECT(p.x0, y, p.cw, H - M.bottom - y, TINT[3], { radius: 6, name: 'Khung' }), DECO('non-line', p.x0 + p.cw / 2 - 70, y + (H - M.bottom - y) / 2 - 40, 140, 75, 0.5))

  // 3.2 bảo tồn
  const ps = ch.preservation
  const topicPage = (items, headFn) => {
    const pg = new Page({ chapter: 3 })
    runningHead(pg, ch.label)
    let yy = headFn ? headFn(pg) : 84
    const rowH = (H - M.bottom - yy) / items.length
    items.forEach(([name, text, hint]) => {
      pg.add(T(pg.x0, yy, pg.cw, 18, name, { font: F.head, size: 13, weight: 700, color: ACC[3], jaFont: F.jaHead, name: 'Tiêu đề nhỏ' }))
      const iwT = 150
      pg.add(IMG(pg.x1 - iwT, yy + 24, iwT, Math.min(rowH - 40, 130), hint))
      pg.add(T(pg.x0, yy + 24, pg.cw - iwT - 14, rowH - 34, text, { size: 9.2, lh: 1.55, align: 'justify', jaSize: 8.8, jaFont: F.jaBody, name: 'Đoạn văn' }))
      yy += rowH
    })
    return pg
  }
  let pg = topicPage(ps.topics.slice(0, 1), (pg0) => {
    mark(2, ps.title, pg0, '3.2')
    let yy = sectionHead(pg0, 84, '3.2', ps.title)
    return prose(pg0, yy, [ps.intro], pg0.x0, pg0.cw, { size: 9.8 })
  })
  topicPage(ps.topics.slice(1))

  // 3.3 thách thức
  const cl = ch.challenges
  pg = topicPage(cl.topics.slice(0, 1), (pg0) => {
    mark(2, cl.title, pg0, '3.3')
    let yy = sectionHead(pg0, 84, '3.3', cl.title)
    return prose(pg0, yy, [cl.intro], pg0.x0, pg0.cw, { size: 9.8 })
  })
  const last = topicPage(cl.topics.slice(1))
  void pg
  void last
  p = new Page({ chapter: 3, hideNumber: true, bg: C.cream })
  p.add(RECT(0, 0, 18, H, ACC[3], { name: 'Dải màu' }), DECO('bamboo', 60, 90, 150, 300, 0.4))
  quote(p, 360, cl.outro, 90, W - 160, { size: 17, align: 'left', color: C.ink })
  p.add(HL(90, 340, 60, ACC[3], 1.6))
}

// ═════════════════════════════════════════ PHẦN KẾT
{
  const e = ending
  let p = new Page({ chapter: 9 })
  runningHead(p, ['KẾT LUẬN', 'まとめ'])
  mark(1, e.conclusion.title, p, '—')
  let y = sectionHead(p, 84, null, e.conclusion.title)
  y = prose(p, y, e.conclusion.p.slice(0, 2))
  figure(p, p.x0, y + 2, p.cw, Math.max(80, H - M.bottom - y - 40), ['Nón lá hoa văn — sản phẩm sáng tạo của làng Chuông hôm nay', '絵付けのノンラー — 今のチュオン村の創作品'])

  p = new Page({ chapter: 9 })
  runningHead(p, ['KẾT LUẬN', 'まとめ'])
  y = prose(p, 84, e.conclusion.p.slice(2))
  p.add(DECO('non-line', p.x0 + p.cw / 2 - 90, y + 30, 180, 96, 0.55))
  quote(p, y + 150, e.conclusion.quote, p.x0 + 20, p.cw - 40, { size: 15, align: 'center' })

  p = new Page({ chapter: 9 })
  runningHead(p, ['LƯU Ý', 'ご注意'])
  y = sectionHead(p, 84, null, e.notice.title)
  y = prose(p, y, e.notice.p, p.x0, p.cw, { size: 9.6 })

  p = new Page({ chapter: 9 })
  runningHead(p, ['TÀI LIỆU THAM KHẢO', '参考文献'])
  mark(1, e.references.title, p, '—')
  y = sectionHead(p, 84, null, e.references.title)
  e.references.items.forEach((ref, i) => {
    const hh = textH([ref, null], p.cw - 26, { size: 8.8, lh: 1.5 })
    p.add(T(p.x0, y, 22, 12, [`[${i + 1}]`, null], { size: 8.4, color: ACC[9], weight: 700, lh: 1.5, name: 'Số' }), T(p.x0 + 26, y, p.cw - 26, hh, [ref, null], { size: 8.8, lh: 1.5, color: C.ink2, name: 'Tài liệu' }))
    y += hh + 8
  })
  p.add(T(p.x0, y + 6, p.cw, 14, e.references.note, { size: 7.8, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Ghi chú' }))

  p = new Page({ chapter: 9, bg: C.cream })
  runningHead(p, ['NHÓM THỰC HIỆN', '制作チーム'])
  y = sectionHead(p, 84, null, e.team.title)
  y = prose(p, y, [e.team.lead], p.x0, p.cw, { size: 9.8, align: 'left' })
  const mw = (p.cw - 12) / 2
  e.team.members.forEach(([name, code], i) => {
    const mx = p.x0 + (i % 2) * (mw + 12)
    const my = y + 6 + Math.floor(i / 2) * 150
    p.add(IMG(mx + (mw - 86) / 2, my, 86, 86, [`Ảnh chân dung — ${name}`, `ポートレート — ${name}`]), T(mx, my + 94, mw, 18, [name, null], { font: F.head, size: 12, align: 'center', name: 'Tên thành viên' }), T(mx, my + 113, mw, 12, [code, null], { size: 7.6, tracking: 1.4, align: 'center', color: C.muted, name: 'Mã sinh viên' }))
  })
  y += 6 + 2 * 150 + 10
  p.add(HL(p.x0, y, p.cw, C.line, 0.5))
  y = prose(p, y + 14, [e.team.contact, e.team.thanks], p.x0, p.cw, { size: 9.4, align: 'center', italic: true, color: C.ink2 })

  // bìa sau
  p = new Page({ chapter: 9, hideNumber: true, bg: '#2b2118' })
  p.add(
    IMG(0, 0, W, H * 0.55, ['Ảnh bìa sau: chiếc nón lá trên nền tre, ánh sáng dịu', '裏表紙写真：竹を背景にしたノンラー'], { name: 'Ảnh bìa sau' }),
    DECO('non-line', W / 2 - 80, H * 0.6, 160, 85, 0.75),
    T(60, H * 0.6 + 104, W - 120, 26, ['ありがとうございました', null], { font: F.jaBody, size: 16, align: 'center', color: '#f4ead4', lh: 1.4, name: 'Lời cảm ơn' }),
    T(60, H * 0.6 + 134, W - 120, 20, ['Cảm ơn quý độc giả', null], { font: F.script, size: 18, align: 'center', color: '#d9bd84', lh: 1.3, name: 'Lời cảm ơn' }),
    T(60, H - 92, W - 120, 30, ['NÓN LÁ LÀNG CHUÔNG · チュオン村のノンラー\nĐại học FPT Hà Nội · 2026 · nonla09092026@gmail.com', null], { size: 7, tracking: 1.2, align: 'center', color: 'rgba(244,234,212,.6)', lh: 1.7, name: 'Thông tin' })
  )
}

// ═════════════════════════════════════════ MỤC LỤC (điền sau khi biết số trang)
{
  const p = tocPage
  p.add(DECO('bamboo', p.x1 - 140, 480, 140, 290, 0.35))
  p.add(T(p.x0, 92, 300, 36, tocTitle, { font: F.head, size: 28, lh: 1.2, jaFont: F.jaHead, name: 'Tiêu đề' }), ALT(p.x0, 130, 300, tocTitle, { size: 10 }), HL(p.x0, 156, 46, ACC[0], 1.2))
  let y = 182
  for (const a of anchors) {
    const acc = ACC[{ '01': 1, '02': 2, '03': 3 }[a.label] ?? 9]
    if (a.level === 1) {
      y += 8
      const tt = a.title.map((s) => (s ? s.replace(/\n/g, ' ') : s))
      const th = textH(tt, p.cw - 110, { size: 13, font: F.head, lh: 1.3 })
      p.add(T(p.x0, y - 2, 40, 22, [a.label, null], { font: F.head, size: 18, color: acc, lh: 1.1, name: 'Số chương' }), T(p.x0 + 44, y, p.cw - 110, th, tt, { font: F.head, size: 13, lh: 1.3, jaFont: F.jaHead, jaSize: 12, name: 'Mục lục' }), T(p.x1 - 40, y + 1, 40, 14, [String(a.page).padStart(2, '0'), null], { font: F.head, size: 11, color: acc, align: 'right', name: 'Số trang' }))
      y += th + 8
    } else {
      p.add(T(p.x0 + 44, y, 30, 14, [a.label, null], { size: 8.6, color: acc, weight: 700, lh: 1.4, name: 'Số mục' }), T(p.x0 + 76, y, p.cw - 140, 14, a.title, { size: 9.2, lh: 1.4, color: C.ink2, jaFont: F.jaSans, jaSize: 8.8, name: 'Mục lục' }), T(p.x1 - 40, y, 40, 14, [String(a.page).padStart(2, '0'), null], { size: 8.6, color: C.muted, align: 'right', lh: 1.4, name: 'Số trang' }))
      y += 19
    }
  }
}

// ── xuất
const out = pages.map((p) => ({ bg: p.bg, bgImage: null, template: null, hideNumber: p.hideNumber, elements: p.els.filter(Boolean) }))
fs.mkdirSync(path.join(here, 'out'), { recursive: true })
fs.writeFileSync(path.join(here, 'out', 'book.json'), JSON.stringify({ pages: out }, null, 1))
const counts = out.map((p, i) => `${i + 1}:${p.elements.length}`).join(' ')
console.log(`${out.length} trang · ${out.reduce((n, p) => n + p.elements.length, 0)} phần tử\n${counts}`)
console.log('Mục lục:', anchors.map((a) => `${a.label} ${strip(a.title[0]).replace(/\n/g, ' ')} → ${a.page}`).join(' | '))
