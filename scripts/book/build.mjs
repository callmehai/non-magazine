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
 *
 * Sách đọc trên màn hình: trang A4 thường chỉ hiện cao ~600px, nên cỡ chữ ở đây lớn hơn sách in
 * (thân bài 15pt ≈ 11–14px trên màn hình). Chữ tự chảy sang trang sau (class Flow), không ép vào một trang.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { front, preface, tocTitle } from './content/00-front.mjs'
import { ch1 } from './content/01-ch1.mjs'
import { ch2 } from './content/02-ch2.mjs'
import { ch3, ending } from './content/03-ch3.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
// ảnh thật đã tải lên kho (upload-photos.mjs): mô tả khung → URL; chưa có thì khung ảnh tạm
const photoFile = path.join(here, 'out', 'photos.json')
const PHOTOS = fs.existsSync(photoFile) ? JSON.parse(fs.readFileSync(photoFile, 'utf8')) : {}

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
const M = { bottom: 58, outer: 40, inner: 50 }
const TOP = 82 // chữ bắt đầu dưới đầu trang
const BOT = H - M.bottom
// thang chữ (pt trên trang A4)
// tiếng Nhật ngắn hơn tiếng Việt ~30% → chữ Nhật lớn hơn để lấp khung (khung cao theo bản dài hơn).
// Hệ số đo trên trang thật: đoạn văn dài cần ~1.14, đoạn ngắn (thẻ, mô tả) ~1.06.
const jaPt = (size, k = 1.06) => Math.round(size * k * 2) / 2
const BODY = { size: 17.5, lh: 1.55, jaSize: jaPt(17.5, 1.14) }
const S = { run: 10, cap: 12.5, note: 12, alt: 13, label: 12.5, block: 21, sec: 30, secNum: 50, quote: 22, card: 19.5, cardText: 16.5, cardTextJa: jaPt(16.5) }
const RUBY_MIN = 12 // chữ nhỏ hơn: bỏ phiên âm (nhãn, chú thích, dòng phụ)

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
function textH(pair, w, o = {}) {
  const size = o.size ?? BODY.size
  const lh = o.lh ?? BODY.lh
  const jaSize = o.jaSize ?? size
  const n = String(pair[0]).split('\n').length
  const gap = (o.paraGap ?? 0) * (n - 1)
  const hv = pair[0] ? lines(pair[0], w, size, o.font === F.jaSans || o.font === F.jaBody, o.font) * size * lh + gap : 0
  // phiên âm đội dòng lên: dòng chặt (tiêu đề) cần chừa nhiều hơn dòng thường
  const ruby = 1 // phiên âm hiện trong ô nổi khi rê chuột, không đội dòng
  const nj = String(pair[1] ?? '').split('\n').length
  const hj = pair[1] ? lines(pair[1], w, jaSize, true) * jaSize * lh * ruby + (o.paraGap ?? 0) * (nj - 1) : 0
  return Math.ceil(Math.max(hv, hj) + 2)
}

// ── phần tử
const r1 = (n) => Math.round(n * 100) / 100
function T(x, y, w, h, pair, o = {}) {
  const [vi0, ja0] = Array.isArray(pair) ? pair : [pair, null]
  const small = (o.size ?? BODY.size) < RUBY_MIN
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
  src: o.src ?? PHOTOS[hint?.[0]] ?? '',
  fit: o.fit ?? 'cover',
  hint: hint?.[0] ?? '',
  hintJa: hint?.[1] ?? '',
  name: o.name ?? 'Ảnh',
  ...(o.opacity != null ? { opacity: o.opacity } : {}),
})
const DECO = (name, x, y, w, h, opacity = 0.55) => ({ id: id(), type: 'image', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, src: `assets/book/deco/${name}.svg`, fit: 'contain', opacity, name: 'Họa tiết' })
const shape = (kind) => (x, y, w, h, fill, o = {}) => ({ id: id(), type: 'shape', shape: kind, x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, fill, ...(o.stroke ? { stroke: o.stroke, strokeWidth: o.sw ?? 0.8 } : {}), ...(o.radius ? { radius: o.radius } : {}), ...(o.opacity != null ? { opacity: o.opacity } : {}), name: o.name ?? 'Hình' })
const RECT = shape('rect')
const ELL = shape('ellipse')
const TRI = shape('triangle')
const HL = (x, y, w, stroke = C.line, sw = 0.6) => ({ id: id(), type: 'line', x: r1(x), y: r1(y - 2), w: r1(w), h: 4, rot: 0, x1: 0, y1: 0.5, x2: 1, y2: 0.5, stroke, strokeWidth: sw, name: 'Đường kẻ' })
const VL = (x, y, h, stroke = C.line, sw = 0.6) => ({ id: id(), type: 'line', x: r1(x - 2), y: r1(y), w: 4, h: r1(h), rot: 0, x1: 0.5, y1: 0, x2: 0.5, y2: 1, stroke, strokeWidth: sw, name: 'Đường kẻ' })

/** dòng phụ bằng ngôn ngữ còn lại: đang đọc tiếng Việt thì hiện tiếng Nhật và ngược lại */
const alt = (pair) => [strip(pair[1]), strip(pair[0])]
const altH = (pair, w, size = S.alt) => textH(alt(pair), w, { size, font: F.jaSans, lh: 1.4 })
const ALT = (x, y, w, pair, o = {}) => T(x, y, w, altH(pair, w, o.size), alt(pair), { size: o.size ?? S.alt, font: F.jaSans, jaFont: F.body, color: o.color ?? C.muted, lh: 1.4, align: o.align, tracking: 0.3, name: 'Chữ phụ' })
const join = (paras) => [paras.map((q) => q[0]).join('\n'), paras.map((q) => q[1]).join('\n')]

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
const CW = W - M.outer - M.inner

/** trang ảnh toàn trang (dùng cả để chèn cho trang mở chương rơi đúng bên trái) */
const photoPage = (hint, chapter = 0) => new Page({ chapter, hideNumber: true }).add(IMG(0, 0, W, H, hint, { name: 'Ảnh toàn trang' }))
/** trang kế tiếp phải là trang trái (số chẵn) — nếu không thì chèn một trang ảnh */
function toLeft(hint, chapter) {
  if ((pages.length + 1) % 2 !== 0) photoPage(hint, chapter)
}

/** đầu trang: trái = tên sách, phải = tên chương */
function runningHead(p, label) {
  const acc = ACC[p.chapter] ?? C.gold
  const text = p.side === 'left' ? ['NÓN LÁ LÀNG CHUÔNG', 'チュオン村のノンラー'] : [strip(label[0]).toUpperCase(), label[1]]
  p.add(
    T(p.x0, 30, p.cw, 14, text, { size: S.run, tracking: 1.6, color: C.muted, align: p.side === 'left' ? 'left' : 'right', lh: 1.2, jaFont: F.jaSans, name: 'Đầu trang' }),
    HL(p.x0, 52, p.cw, C.line, 0.5),
    p.side === 'left' ? RECT(p.x0, 50.6, 30, 2.4, acc, { name: 'Vạch màu' }) : RECT(p.x1 - 30, 50.6, 30, 2.4, acc, { name: 'Vạch màu' })
  )
}

/** "1.1  Tên mục" + dòng phụ + vạch màu → trả y tiếp theo */
function sectionHead(p, y, num, title) {
  title = [title[0], strip(title[1])]
  const acc = ACC[p.chapter]
  const x = p.x0
  const tx = num ? x + 86 : x
  const tw = p.x1 - tx
  const o = { size: S.sec, font: F.head, lh: 1.2, jaSize: 28 }
  const th = textH(title, tw, o)
  const ah = altH(title, tw)
  p.add(
    num && T(x, y - 6, 82, 60, [num, null], { font: F.head, size: S.secNum, color: acc, lh: 1.1, name: 'Số mục' }),
    T(tx, y, tw, th, title, { ...o, jaFont: F.jaHead, name: 'Tên mục' }),
    ALT(tx, y + th + 4, tw, title)
  )
  const end = y + th + 4 + ah + 12
  p.add(HL(tx, end, 56, acc, 1.4))
  return Math.max(end + 26, num ? y + 64 : 0)
}

/** tiêu đề nhỏ của khối nội dung → chiều cao */
const blockOpt = { size: S.block, font: F.head, lh: 1.25, jaSize: 20 }
const blockHeight = (h, w) => textH([h[0], strip(h[1])], w, blockOpt) + 3 + altH(h, w, 11) + 14
function blockHead(p, y, h, x = p.x0, w = p.cw) {
  const acc = ACC[p.chapter]
  // tiêu đề nhỏ: bỏ phiên âm để dòng phụ nằm sát tiêu đề ở cả hai bản
  h = [h[0], strip(h[1])]
  const hh = textH(h, w, blockOpt)
  p.add(T(x, y, w, hh, h, { ...blockOpt, weight: 700, color: acc, jaFont: F.jaHead, name: 'Tiêu đề nhỏ' }), ALT(x, y + hh + 3, w, h, { size: 11 }))
  return y + blockHeight(h, w)
}

/** ảnh + chú thích → y tiếp theo */
const capH = (cap, w) => textH(cap, w, { size: S.cap, lh: 1.4 })
function figure(p, x, y, w, h, cap, o = {}) {
  p.add(IMG(x, y, w, h, cap))
  if (o.noCaption) return y + h + 8
  const ch = capH(cap, w)
  p.add(T(x, y + h + 6, w, ch, cap, { size: S.cap, lh: 1.4, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
  return y + h + 6 + ch
}

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
  p.add(HL(p.x0, y - 10, 90, C.line, 0.6), T(p.x0, y, p.cw, h, pair, { size: S.note, lh: 1.45, paraGap: 3, color: C.muted, jaFont: F.jaSans, name: 'Chú thích' }))
  return y - 26
}

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

/** dòng chảy nội dung: tự sang trang khi hết chỗ */
class Flow {
  constructor(chapter, label) {
    this.chapter = chapter
    this.runLabel = label
    this.p = null
    this.y = TOP
    this.bot = BOT
  }
  page(o = {}) {
    this.p = new Page({ chapter: this.chapter, ...o })
    if (!o.bare) runningHead(this.p, o.label ?? this.runLabel)
    this.y = o.y ?? TOP
    this.bot = BOT
    return this.p
  }
  get room() {
    return this.bot - this.y
  }
  get fresh() {
    return this.y <= TOP + 1
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
  section(num, title, o = {}) {
    if (!this.p || o.newPage || this.room < 360) this.page()
    else if (!this.fresh) this.y += 18
    this.y = sectionHead(this.p, this.y, num, title)
    return this.p
  }
  block(h) {
    const bh = blockHeight(h, CW)
    this.need(bh + BODY.size * BODY.lh * 3)
    this.y = blockHead(this.p, this.y, h)
  }
  /** đoạn văn: gộp các đoạn cùng trang vào một khối, tách đoạn khi sang trang */
  prose(paras, o = {}) {
    const opt = { size: o.size ?? BODY.size, lh: o.lh ?? BODY.lh, paraGap: o.paraGap ?? 8, jaSize: o.jaSize ?? (o.size ? jaPt(o.size, 1.14) : BODY.jaSize) }
    const dx = o.dx ?? 0
    const w = () => (o.w ?? this.p.cw) - dx
    const queue = paras.map((q) => [...q])
    let acc = []
    const flush = () => {
      if (!acc.length) return
      const pair = join(acc)
      const h = textH(pair, w(), opt)
      this.p.add(T(this.p.x0 + dx, this.y, w(), h, pair, { ...opt, align: o.align ?? 'justify', color: o.color ?? C.ink, jaFont: F.jaBody, italic: o.italic, font: o.font, name: o.name ?? 'Đoạn văn' }))
      this.y += h
      acc = []
    }
    if (!this.p) this.page()
    while (queue.length) {
      const trial = [...acc, queue[0]]
      if (this.y + textH(join(trial), w(), opt) <= this.bot) {
        acc = trial
        queue.shift()
        continue
      }
      const used = acc.length ? textH(join(acc), w(), opt) + opt.paraGap : 0
      const sp = splitPara(queue[0], w(), opt, this.bot - this.y - used)
      if (sp) {
        acc.push(sp[0])
        queue[0] = sp[1]
      } else if (!acc.length && this.fresh) {
        acc.push(queue.shift()) // đoạn dài hơn cả trang: đặt luôn
      }
      flush()
      if (queue.length) this.page()
    }
    flush()
    this.y += o.after ?? 16
  }
  /** ảnh rộng cả khối; cao trong [minH, maxH], lấp chỗ trống còn lại */
  figure(cap, o = {}) {
    this.row([cap], o)
  }
  /** n ảnh cạnh nhau; còn chỗ ít hơn minH một chút thì thu ảnh lại (tối thiểu minFit) thay vì sang trang */
  row(caps, o = {}) {
    const n = caps.length
    const gap = 14
    const w = (CW - gap * (n - 1)) / n
    const ch = Math.max(...caps.map((c) => capH(c, w)))
    const minH = Math.min(o.minH ?? 150, o.minFit ?? 140)
    const maxH = o.maxH ?? 330
    if (!this.p || this.room < minH + ch + 6) this.page()
    const h = Math.max(minH, Math.min(o.fill ? Infinity : maxH, this.room - ch - 6))
    caps.forEach((c, i) => figure(this.p, this.p.x0 + i * (w + gap), this.y, w, h, c))
    this.y += h + 6 + ch + 22
  }
  /** lưới ảnh cols cột, ảnh giãn ra lấp chỗ còn lại của trang (không đủ chỗ thì sang trang mới) */
  gallery(caps, cols = 2, o = {}) {
    const gap = 14
    const rows = Math.ceil(caps.length / cols)
    const w = (CW - gap * (cols - 1)) / cols
    const ch = Math.max(...caps.map((c) => capH(c, w)))
    const minCell = o.minCell ?? 150
    const need = (cell) => rows * (cell + 6 + ch) + (rows - 1) * 18
    if (!this.p || this.room < need(minCell)) this.ensure(Infinity, o.filler)
    const cell = Math.min(o.maxCell ?? 340, (this.room - need(0)) / rows)
    caps.forEach((c, i) => figure(this.p, this.p.x0 + (i % cols) * (w + gap), this.y + Math.floor(i / cols) * (cell + 6 + ch + 18), w, cell, c))
    this.y += need(cell) + 22
  }
  /** chỗ trống cuối trang đủ lớn → đặt một ảnh lấp kín (ảnh thật chưa dùng ở chỗ khác) */
  fillGap(cap, min = 140) {
    const c = cap?.pool ? cap.pool[0] : cap
    if (!this.p || !c || this.fresh || this.room < min + capH(c, CW) + 6) return false
    this.row([c], { minH: min, fill: true })
    if (cap.pool) cap.pool.shift()
    return true
  }
  /** khối cao h sắp đặt: không vừa trang này thì lấp chỗ trống bằng ảnh rồi sang trang */
  ensure(h, filler) {
    if (this.p && this.room >= h) return
    if (filler) this.fillGap(filler)
    this.page()
  }
  /**
   * Dãy thẻ (loại nón, nguyên liệu, bước làm, nghệ nhân…): xếp đủ thẻ vào từng trang rồi chia đều chỗ dư —
   * thẻ cao thêm tối đa `grow` (ảnh to ra), phần còn lại dàn vào khoảng cách giữa các thẻ.
   * Trang cuối của dãy không dàn (nội dung tiếp theo chảy tiếp ngay bên dưới).
   */
  cards(items, measure, draw, o = {}) {
    const gap = o.gap ?? 24
    const grow = o.grow ?? 60
    const hs = items.map(measure)
    let i = 0
    while (i < items.length) {
      if (!this.p) this.page()
      const start = this.y
      let j = i
      let used = 0
      while (j < items.length && start + used + hs[j] <= this.bot) used += hs[j++] + gap
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
      const spare = last && free - gap >= (o.tail ?? 0) ? 0 : free
      const add = Math.min(grow, spare / n)
      const extraGap = n > 1 ? Math.min(70, (spare - add * n) / (n - 1)) : 0
      let y = start
      for (let k = i; k < j; k++) {
        draw(this.p, y, items[k], hs[k] + add)
        y += hs[k] + add + gap + extraGap
      }
      this.y = y
      i = j
      if (i < items.length) this.page()
    }
  }
  /** chú thích cuối trang: neo đáy trang hiện tại, chữ chảy phía trên */
  notes(notes) {
    if (!this.p) this.page()
    this.bot = footnotes(this.p, notes)
  }
  /** khung ghi chú nền màu */
  note(pair, o = {}) {
    const opt = { size: o.size ?? 15.5, lh: 1.55, jaSize: jaPt(o.size ?? 15.5) }
    const h = textH(pair, CW - 36, opt)
    this.place(h + 32, (p, y) => p.add(RECT(p.x0, y, p.cw, h + 32, TINT[this.chapter], { radius: 8, name: 'Khung ghi chú' }), T(p.x0 + 18, y + 16, p.cw - 36, h, pair, { ...opt, italic: true, color: C.ink2, jaFont: F.jaBody, name: 'Ghi chú' })))
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

/** ảnh thật dùng để lấp chỗ trống cuối trang (Flow.fillGap / ensure), theo chương */
const FILL = {
  1: [
    ['Nón lá trong tranh sơn dầu — Bảo tàng Mỹ thuật Việt Nam', '油彩画に描かれたノンラー — ベトナム美術博物館'],
    ['Nón lá cổ trưng bày tại Bảo tàng Mỹ thuật Việt Nam', 'ベトナム美術博物館に展示された古いノンラー'],
    ['Người phụ nữ đội nón giữa cánh đồng — tranh tại Bảo tàng Mỹ thuật Việt Nam', '田んぼでノンラーをかぶる女性 — ベトナム美術博物館の絵画'],
  ],
  2: [
    ['Khung nón bày bán ở chợ Chuông', 'チュオンの市場で売られる笠の骨組み'],
    ['Nứa chuốt sẵn và sợi màu bày bán ở chợ Chuông', 'チュオンの市場に並ぶ削ったヌア竹と色糸'],
    ['Người bán nón bên những chồng nón trắng ở chợ Chuông', 'チュオンの市場で白い笠の山の横に座る売り手'],
  ],
  3: [
    ['Nón chùm — sản phẩm OCOP 4 sao của cơ sở Lê Văn Tuy', '束ね笠 — レー・ヴァン・トゥイ工房のOCOP四つ星製品'],
    ['Nón lá hai mặt lụa xanh ngọc nhìn từ trong lòng nón', '内側から見た、両面に翡翠色の絹を張った笠'],
  ],
}
// chỉ lấy ảnh khỏi danh sách khi thật sự đặt (fillGap)
const filler = (ch) => ({ pool: FILL[ch] })

/** cặp trang mở chương: trái ảnh lớn tràn trang, phải tên chương */
function chapterOpener(ch, photo) {
  const acc = ACC[ch.no]
  toLeft(photo.alt, ch.no - 1)
  const left = new Page({ chapter: ch.no, hideNumber: true })
  left.add(IMG(0, 0, W, H, photo.main, { name: 'Ảnh mở chương' }), RECT(0, H - 200, W, 200, '#1f1810', { opacity: 0.5, name: 'Nền chữ' }), T(left.x0, H - 186, 320, 150, [String(ch.no).padStart(2, '0'), null], { font: F.head, size: 124, color: '#fbf7ee', lh: 1.1, name: 'Số chương' }))
  const p = new Page({ chapter: ch.no, hideNumber: true, bg: C.cream })
  p.add(RECT(W - 18, 0, 18, H, acc, { name: 'Dải màu chương' }), DECO('bamboo', W - 130, H - 250, 100, 220, 0.32))
  const tw = p.cw - 10
  // tên lớn: bỏ phiên âm (phiên âm giữ ở thân bài) để dòng phụ nằm sát tên ở cả hai bản
  const title = [ch.title[0].replace(/\n/g, ' '), strip(ch.title[1])]
  let y = 108
  p.add(T(p.x0, y, 320, 16, [ch.label[0].toUpperCase(), ch.label[1]], { size: S.label + 0.5, tracking: 3, color: acc, weight: 700, jaFont: F.jaSans, name: 'Nhãn chương' }))
  y += 34
  const to = { size: 33, font: F.head, lh: 1.2, jaSize: 29 }
  const th = textH(title, tw, to)
  p.add(T(p.x0, y, tw, th, title, { ...to, jaFont: F.jaHead, name: 'Tên chương' }))
  y += th + 8
  p.add(ALT(p.x0, y, tw, title, { size: 13 }))
  y += altH(title, tw, 13) + 22
  p.add(HL(p.x0, y, 64, acc, 1.8))
  y += 28
  const lo = { size: 19, lh: 1.6, jaSize: jaPt(19, 1.14) }
  p.add(T(p.x0, y, tw - 30, textH(ch.lead, tw - 30, lo), ch.lead, { ...lo, color: C.ink2, jaFont: F.jaBody, name: 'Đoạn dẫn' }))
  return { left, right: p }
}

// ═════════════════════════════════════════ BÌA
// ảnh tràn trang (hành lang đình Chuông), lớp tối dần ở trên/dưới để chữ màu kem đọc rõ
{
  const p = new Page({ hideNumber: true, bg: '#2b2118' })
  const shade = (y, h, flip) => ({ ...DECO('shade', 0, y, W, h, 1), fit: 'fill', rot: flip ? 180 : 0, name: 'Lớp tối' })
  const cream = '#fbf4e4'
  p.add(
    IMG(0, 0, W, H, ['Ảnh bìa: thiếu nữ áo dài đội nón lá trong hành lang đình Chuông', '表紙写真：チュオン村の亭の回廊で、ノンラーをかぶるアオザイ姿の女性'], { name: 'Ảnh bìa' }),
    shade(0, 330),
    shade(H - 230, 230, true),
    T(46, 54, 500, 112, ['NÓN LÁ\nLÀNG CHUÔNG', null], { font: F.head, size: 50, lh: 1.06, tracking: 2.5, color: cream, name: 'Tên sách' }),
    T(48, 172, 500, 26, [strip(front.title[1]) + '：' + strip(front.subtitle[1]), null], { font: F.jaBody, size: 17, lh: 1.3, color: 'rgba(251,244,228,.88)', name: 'Tên sách tiếng Nhật' }),
    T(46, 200, 500, 46, [front.subtitle[0], null], { font: F.script, size: 31, lh: 1.3, color: '#e7c98f', name: 'Chữ viết tay' }),
    RECT(48, H - 132, 178, 26, 'none', { stroke: '#e7c98f', sw: 0.9, radius: 13, name: 'Khung nhãn' }),
    T(48, H - 126, 178, 15, ['SONG NGỮ VIỆT – NHẬT', null], { size: 9.5, tracking: 1.6, align: 'center', color: '#e7c98f', weight: 700, lh: 1.2, name: 'Nhãn song ngữ' }),
    // logo nhiều màu: đặt trên ô nền sáng để không chìm vào ảnh tối
    RECT(48, H - 94, 124, 42, '#fbf4e4', { radius: 6, opacity: 0.94, name: 'Nền logo' }),
    IMG(54, H - 89, 112, 32, ['Logo FPT', 'FPTロゴ'], { fit: 'contain', name: 'Logo' }),
    T(186, H - 88, 360, 32, [`${front.team[0]}\n${strip(front.team[1])}`, null], { size: 10, lh: 1.5, color: 'rgba(251,244,228,.85)', name: 'Tên nhóm' })
  )
}

// ═════════════════════════════════════════ TRANG LÓT + TRANG TÊN SÁCH
// trang lót mặt trong bìa trước: ảnh toàn trang
photoPage(['Ảnh trang lót: hai thiếu nữ áo dài cầm nón lá bên hiên đình Chuông', '見返し写真：チュオン村の亭の軒下でノンラーを持つアオザイの女性'])
{
  const p = new Page({ hideNumber: true, bg: C.cream })
  p.add(
    DECO('non-line', W / 2 - 70, 200, 140, 75, 0.6),
    T(60, 300, W - 120, 100, ['NÓN LÁ\nLÀNG CHUÔNG', null], { font: F.head, size: 34, lh: 1.15, tracking: 2.5, align: 'center', name: 'Tên sách' }),
    T(60, 392, W - 120, 24, [strip(front.title[1]) + '：' + strip(front.subtitle[1]), null], { font: F.jaBody, size: 14, lh: 1.3, align: 'center', color: C.ink2, name: 'Tên sách tiếng Nhật' }),
    T(60, 420, W - 120, 40, [front.subtitle[0], null], { font: F.script, size: 26, lh: 1.3, align: 'center', color: ACC[0], name: 'Chữ viết tay' }),
    HL(W / 2 - 30, 486, 60, ACC[0], 1.2),
    T(60, H - 150, W - 120, 60, ['Đồ án tốt nghiệp · Ngành Ngôn ngữ Nhật\nTrường Đại học FPT Hà Nội · 2026', 'FPT大学ハノイ校 日本語学科 卒業制作\n2026年'], { size: 12.5, jaFont: F.jaSans, lh: 1.7, tracking: 1, align: 'center', color: C.muted, name: 'Thông tin' })
  )
}

// ═════════════════════════════════════════ LỜI MỞ ĐẦU
{
  const f = new Flow(0, ['LỜI MỞ ĐẦU', 'はじめに'])
  const p = f.page()
  p.add(DECO('leaf-sprig', p.x1 - 120, 64, 120, 120, 0.4))
  const to = { size: 34, font: F.head, lh: 1.2 }
  p.add(T(p.x0, 96, p.cw - 130, textH(preface.title, p.cw - 130, to), preface.title, { ...to, jaFont: F.jaHead, name: 'Tiêu đề' }))
  p.add(ALT(p.x0, 146, 300, preface.title, { size: 13 }))
  p.add(HL(p.x0, 178, 56, ACC[0], 1.4))
  f.y = 200
  f.prose(preface.paras)
  const sign = textH(preface.sign, CW, { size: 15, lh: 1.5 })
  f.place(sign, (pg, y) => pg.add(T(pg.x0, y, pg.cw, sign, preface.sign, { size: 15, italic: true, align: 'right', color: C.ink2, lh: 1.5, jaFont: F.jaBody, name: 'Ký tên' })), 26)
  f.quote(preface.pull, { inset: 20, align: 'center' })
  f.figure(['Cổng làng Chuông, Phương Trung, Hà Nội', 'チュオン村の門（ハノイ・フオンチュン社）'], { minH: 180, fill: true })
}

// ═════════════════════════════════════════ ẢNH + MỤC LỤC
// mục lục nằm trang phải; còn trống trang trái thì đặt một trang ảnh đối diện
if ((pages.length + 1) % 2 === 0) photoPage(['Ảnh toàn trang: chiếc nón lá trắng Làng Chuông (trang ảnh trước mục lục)', '全面写真：チュオン村の白いノンラー'])
const tocPage = new Page({ chapter: 0, bg: C.cream })
const anchors = [] // { level, label, title, page }
const mark = (level, title, page, label) => anchors.push({ level, title, page: page.n, label })

// ═════════════════════════════════════════ CHƯƠNG 1
{
  const ch = ch1
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: thiếu nữ áo dài đội nón lá giữa cánh đồng', '章扉写真：田んぼの中、アオザイ姿でノンラーをかぶる女性'],
    alt: ['Ảnh toàn trang: nón lá trên cánh đồng lúa', '全面写真：田んぼの中のノンラー'],
  })
  mark(1, ch.title, left, '01')
  const [s11, gal, s12, s13] = ch.sections
  const f = new Flow(1, ch.label)

  // 1.1 — khái niệm + công dụng + giá trị
  mark(2, s11.title, f.section('1.1', s11.title), '1.1')
  for (const b of s11.blocks.slice(0, 2)) {
    f.block(b.h)
    f.prose(b.p)
  }
  f.figure(['Nón lá trong đời sống thường ngày: che nắng, che mưa khi lao động', '日々の暮らしの中のノンラー：働く人を日差しや雨から守る'], { minH: 170 })
  const val = s11.blocks[2]
  f.block(val.h)
  f.prose(val.p)
  f.gallery(val.images, 2, { minCell: 170, filler: filler(1) })

  // hai dáng nón
  f.section(null, gal.title, { newPage: true })
  f.prose(gal.intro)
  const g0 = gal.groups[0]
  // nhãn nhóm + lưới ảnh luôn đi cùng nhau; ảnh giãn ra lấp chỗ còn lại
  const grid = (label, items, cols, cellMin) => {
    const gap = 14
    const cw = (CW - gap * (cols - 1)) / cols
    const rows = Math.ceil(items.length / cols)
    const nameH = 54
    if (f.room < 28 + rows * (cellMin + nameH) + (rows - 1) * 10) f.page()
    f.label(label)
    const cell = Math.min(cols === 1 ? 300 : 250, (f.room - 12 - rows * nameH - (rows - 1) * 10) / rows)
    const p = f.p
    items.forEach(([name, place], i) => {
      const gx = p.x0 + (i % cols) * (cw + gap)
      const gy = f.y + Math.floor(i / cols) * (cell + nameH + 10)
      p.add(IMG(gx, gy, cw, cell, [`${name[0]} — ${place[0]}`, `${strip(name[1])} — ${place[1]}`]))
      p.add(T(gx, gy + cell + 6, cw, 22, name, { font: F.head, size: 17, lh: 1.25, jaFont: F.jaHead, jaSize: 16.5, name: 'Tên nón' }), T(gx, gy + cell + 31, cw, 16, place, { size: 12, tracking: 1, color: C.muted, lh: 1.3, jaFont: F.jaSans, name: 'Địa phương' }))
    })
    f.y += rows * (cell + nameH + 10) + 12
  }
  grid(g0.name, g0.items, 2, 120)
  f.page()
  grid(gal.groups[1].name, gal.groups[1].items, 1, 200)

  // 1.2 — dấu tích + dòng thời gian
  const tr = s12.blocks[0]
  mark(2, s12.title, f.section('1.2', s12.title, { newPage: true }), '1.2')
  f.block(tr.h)
  f.prose(tr.p)
  {
    const whenW = 104
    const tlOff = whenW + 14
    const wo = { size: 15.5, lh: 1.5, jaSize: jaPt(15.5) }
    const textW = CW - tlOff - 20
    const rows = tr.timeline.map(([when, what]) => Math.max(textH(when, whenW, { size: 15.5, font: F.head, lh: 1.2 }), textH(what, textW, wo)) + 16)
    const notesH = textH(join(tr.notes), CW, { size: S.note, lh: 1.45, paraGap: 3 }) + 26
    const tlH = rows.reduce((a, b) => a + b, 0)
    f.ensure(tlH + notesH + 10, filler(1))
    f.notes(tr.notes)
    const p = f.p
    const tlX = p.x0 + tlOff
    let ty = f.y + 6
    p.add(VL(tlX, ty + 4, tlH - rows.at(-1) + 6, ACC[1], 1))
    tr.timeline.forEach(([when, what], i) => {
      p.add(
        ELL(tlX - 6, ty, 12, 12, i === 0 ? ACC[1] : C.cream, { stroke: ACC[1], sw: 1.3 }),
        T(p.x0, ty - 3, whenW, 20, when, { font: F.head, size: 15.5, weight: 700, color: ACC[1], align: 'right', lh: 1.2, jaFont: F.jaHead, jaSize: 15, name: 'Mốc thời gian' }),
        T(tlX + 20, ty - 3, textW, rows[i] - 16, what, { ...wo, jaFont: F.jaBody, name: 'Sự kiện' })
      )
      ty += rows[i]
    })
    f.y = ty + 10
  }
  f.prose(tr.after)
  for (const b of s12.blocks.slice(1, 3)) {
    f.block(b.h)
    f.prose(b.p)
  }
  f.row(s12.blocks[2].images, { minH: 170, maxH: 260 })
  const tr2 = s12.blocks[3]
  f.block(tr2.h)
  f.prose(tr2.p)
  f.figure(['Chợ nón Chuông họp phiên — nơi bán lá, vành, sợi và nón thành phẩm', 'チュオンの笠市場 — 葉や輪、糸、完成した笠が並ぶ'], { minH: 180, fill: true })

  // 1.3 — làng Chuông
  const v = s13.blocks[0]
  mark(2, s13.title, f.section('1.3', s13.title, { newPage: true }), '1.3')
  f.block(v.h)
  f.prose(v.p.slice(0, 2))
  f.figure(v.images[0], { minH: 180, maxH: 300 })
  f.prose(v.p.slice(2))
  f.row(v.images.slice(1), { minH: 170, fill: true })

  // các loại nón: trang ảnh lớn rồi từng thẻ
  const ty = s13.blocks[1]
  f.page()
  // ảnh lớn cao vừa đủ để phần giới thiệu nằm gọn trong trang này
  const introH = blockHeight(ty.h, CW) + textH(join(ty.p), CW, { size: BODY.size, lh: BODY.lh, jaSize: BODY.jaSize, paraGap: 8 }) + 4
  const heroH = Math.max(220, Math.min(420, BOT - 60 - 26 - introH))
  f.p.add(IMG(0, 60, W, heroH, ty.hero, { name: 'Ảnh lớn' }))
  f.y = 60 + heroH + 26
  f.block(ty.h)
  f.prose(ty.p)
  const iwT = 160
  const tx = iwT + 18
  const to = { size: S.cardText, lh: 1.55, jaSize: S.cardTextJa }
  const nameOf = (t) => textH(t.name, CW - tx, { size: S.card, font: F.head, lh: 1.25 })
  f.cards(
    ty.types,
    (t) => Math.max(nameOf(t) + 8 + textH(t.text, CW - tx, to), 170),
    (p, y, t, h) => {
      const nh = nameOf(t)
      p.add(IMG(p.x0, y, iwT, Math.min(h, 290), [`${t.name[0]} — ảnh mặt trong và mặt ngoài`, `${strip(t.name[1])} — 内側と外側の写真`]))
      p.add(T(p.x0 + tx, y - 2, CW - tx, nh, t.name, { font: F.head, size: S.card, weight: 700, color: ACC[1], lh: 1.25, jaFont: F.jaHead, name: 'Tên nón' }))
      p.add(T(p.x0 + tx, y + nh + 8, CW - tx, textH(t.text, CW - tx, to), t.text, { ...to, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
    },
    { gap: 26, grow: 90, tail: textH(ty.after[0], CW - 36, { size: 15.5, lh: 1.55, jaSize: jaPt(15.5) }) + 32 }
  )
  f.note(ty.after[0])
  f.fillGap(filler(1))
}

// ═════════════════════════════════════════ CHƯƠNG 2
{
  const ch = ch2
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: đôi bàn tay nghệ nhân khâu nón trên khuôn', '章扉写真：型の上で笠を縫う職人の手'],
    alt: ['Ảnh toàn trang: nón lá Làng Chuông', '全面写真：チュオン村のノンラー'],
  })
  mark(1, ch.title, left, '02')
  const st = ch.structure
  const f = new Flow(2, ch.label)

  // 2.1 — cấu tạo
  mark(2, st.title, f.section('2.1', st.title), '2.1')
  f.prose(st.intro)
  f.block(st.layers.h)
  f.prose([st.layers.intro])
  // sơ đồ ba lớp: ba nón xếp tầng (vẽ bằng hình)
  {
    // sơ đồ co lại cho vừa chỗ còn lại của trang (thay vì sang trang để lại khoảng trắng)
    f.ensure(84 * 2.6 + 40, filler(2))
    const coneH = Math.max(84, Math.min(116, (f.room - 40) / 2.6))
    const dH = coneH * (1 + 2 * 0.8) + 40
    f.place(dH, (p, y) => {
      const dx = p.x0 + 184
      const dw = p.cw - 184
      const fill = ['#e6c991', '#d2b17c', '#f1e2bf']
      const stroke = ['#8c5a32', '#a4865a', '#b9a37a']
      for (let i = 0; i < 3; i++) {
        const cy = y + i * coneH * 0.8
        const cwid = dw * (1 - i * 0.15)
        const cx = dx + (dw - cwid) / 2
        p.add(TRI(cx, cy, cwid, coneH, fill[i], { stroke: stroke[i], sw: i === 0 ? 1.6 : 1, opacity: 0.92 }), ELL(cx, cy + coneH - 10, cwid, 20, fill[i], { stroke: stroke[i], sw: 1, opacity: 0.92 }))
        const item = st.layers.items[i]
        const ly = cy + coneH * 0.4
        p.add(ELL(p.x0, ly, 24, 24, ACC[2]), T(p.x0, ly + 4.5, 24, 15, [String(i + 1), null], { size: 11.5, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số' }), T(p.x0 + 32, ly, 148, 44, item[0], { font: F.head, size: 15.5, weight: 700, color: ACC[2], lh: 1.3, jaFont: F.jaHead, jaSize: 15, name: 'Lớp' }))
      }
      p.add(T(dx, y + dH - 16, dw, 16, ['Minh họa cấu trúc tách lớp, không theo tỷ lệ thực tế', '層を分けた構造のイメージ図（実寸ではありません）'], { size: 12, italic: true, color: C.muted, align: 'center', jaFont: F.jaSans, name: 'Chú thích sơ đồ' }))
    })
  }
  st.layers.items.forEach((item, i) => {
    const w = CW - 40
    const to = { size: 16.5, lh: 1.55, jaSize: jaPt(16.5) }
    const nh = textH(item[0], w, { size: S.card, font: F.head, lh: 1.25 })
    const hh = textH(item[1], w, to)
    f.place(nh + 6 + hh, (p, y) => {
      p.add(ELL(p.x0, y, 28, 28, ACC[2]), T(p.x0, y + 5.5, 28, 17, [String(i + 1), null], { size: 13, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số' }))
      p.add(T(p.x0 + 40, y + 1, w, nh, item[0], { font: F.head, size: S.card, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Lớp' }))
      p.add(T(p.x0 + 40, y + nh + 6, w, hh, item[1], { ...to, jaFont: F.jaBody, align: 'justify', name: 'Mô tả lớp' }))
    })
  })
  f.quote(st.layers.outro, { size: 17 })
  f.figure(st.layers.image, { minH: 200, fill: true })

  // khung 16 vành: chữ + sơ đồ vòng
  f.block(st.frame.h)
  f.prose(st.frame.p)
  {
    const fH = 230
    const fw = 250
    f.place(fH + 16, (p, y) => {
      const fx = p.x0 + (p.cw - fw) / 2 - 40
      p.add(TRI(fx, y, fw, fH, 'none', { stroke: '#a4865a', sw: 0.8, opacity: 0.6 }))
      for (let i = 0; i < 16; i++) {
        const t = (i + 1) / 16
        const rw = fw * t
        const ry = y + fH * t
        const eh = Math.max(2, rw * 0.09)
        p.add(ELL(fx + (fw - rw) / 2, ry - eh / 2, rw, eh, 'none', { stroke: i === 15 ? ACC[2] : '#a4865a', sw: i === 15 ? 1.6 : 0.9 }))
      }
      p.add(T(fx + fw / 2 + 16, y - 6, 150, 20, ['← Chóp nón', '← 頂'], { size: 13.5, italic: true, color: C.muted, lh: 1.3, jaFont: F.jaSans, name: 'Nhãn' }), T(fx + fw + 12, y + fH - 10, 150, 20, ['← Vòng cạp (vòng 16)', '← 縁の輪（16本目）'], { size: 13.5, italic: true, color: ACC[2], lh: 1.3, jaFont: F.jaSans, name: 'Nhãn' }))
    })
  }
  f.note(st.frame.note)
  f.figure(st.frame.image, { minH: 240, fill: true })

  // 2.2 — nguyên liệu & dụng cụ
  const mt = ch.materials
  const cardTo = { size: S.cardText, lh: 1.55, jaSize: S.cardTextJa }
  const cardTx = 150 + 18
  const cardNh = (name) => textH(name, CW - cardTx, { size: S.card, font: F.head, lh: 1.25 })
  const cards = (list, tail = 0) =>
    f.cards(
      list,
      ([name, text]) => Math.max(cardNh(name) + 8 + textH(text, CW - cardTx, cardTo), 124),
      (p, y, [name, text, hint], h) => {
        const nh = cardNh(name)
        p.add(IMG(p.x0, y, 150, Math.min(h, 200), hint))
        p.add(T(p.x0 + cardTx, y - 2, CW - cardTx, nh, name, { font: F.head, size: S.card, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' }))
        p.add(T(p.x0 + cardTx, y + nh + 8, CW - cardTx, textH(text, CW - cardTx, cardTo), text, { ...cardTo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
      },
      { gap: 24, grow: 50, tail }
    )
  mark(2, mt.title, f.section('2.2', mt.title, { newPage: true }), '2.2')
  f.label(['NGUYÊN LIỆU', '材料'])
  cards(mt.items, 330)
  const [mold, ...tools] = mt.tools
  f.section(null, ['Dụng cụ', '道具'], { newPage: f.room < 330 })
  f.figure(mold[2], { minH: 170, maxH: 230 })
  f.place(24, (p, y) => p.add(T(p.x0, y, p.cw, 24, mold[0], { font: F.head, size: S.card, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' })), 8)
  f.prose([mold[1]], { size: 16.5 })
  cards(tools)
  f.note(mt.outro)
  f.fillGap(filler(2))

  // 2.3 — quy trình
  const pr = ch.process
  mark(2, pr.title, f.section('2.3', pr.title, { newPage: true }), '2.3')
  f.block(pr.leaf.h)
  f.prose(pr.leaf.p)
  f.row(pr.leaf.images, { minH: 170, maxH: 260 })
  const iwS = 190
  const stepTw = CW - iwS - 18
  const stepTo = { size: 16, lh: 1.55, jaSize: jaPt(16) }
  const stepNameO = { font: F.head, size: 21, lh: 1.25, jaSize: 20.5 }
  const stepName = (s) => [`Bước ${s.no} · ${s.name[0]}`, `ステップ${s.no}・${s.name[1]}`]
  const stepHead = (s) => textH(stepName(s), CW - 54, stepNameO) + 36
  f.cards(pr.steps, (s) => stepHead(s) + Math.max(textH(s.text, stepTw, stepTo), 190), (p, y, s, h) => {
    const acc = ACC[2]
    const tw = stepTw
    const to = stepTo
    const th = textH(s.text, tw, to)
    const nameO = stepNameO
    const nm = stepName(s)
    const nh = stepHead(s) - 36
    const body = h - stepHead(s)
    {
      p.add(ELL(p.x0, y, 42, 42, acc), T(p.x0, y + 9, 42, 24, [String(s.no), null], { font: F.head, size: 19, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số bước' }))
      p.add(T(p.x0 + 54, y, CW - 54, nh, nm, { ...nameO, weight: 700, color: C.ink, jaFont: F.jaHead, name: 'Tên bước' }))
      p.add(T(p.x0 + 54, y + nh + 2, CW - 54, 18, s.sub, { size: 13.5, italic: true, color: acc, lh: 1.3, jaFont: F.jaSans, name: 'Phụ đề' }))
      const iy = y + nh + 36
      p.add(IMG(p.x0, iy, iwS, body, s.image))
      p.add(T(p.x0 + iwS + 18, iy, tw, th, s.text, { ...to, align: 'justify', jaFont: F.jaBody, name: 'Mô tả bước' }))
    }
  }, { gap: 34, grow: 70, tail: Infinity })
  f.fillGap(filler(2))
  // trang kết chương: ảnh nón hoàn thiện + trích dẫn
  const p = new Page({ chapter: 2, hideNumber: true })
  p.add(IMG(0, 0, W, H - 230, ['Ảnh toàn trang: chiếc nón lá trắng hoàn thiện, bóng nhẹ sau khi quang dầu', '全面写真：油を塗り終え、やわらかな艶をもつ完成したノンラー']), RECT(0, H - 230, W, 230, C.cream, { name: 'Nền' }), DECO('non-line', W / 2 - 80, H - 214, 160, 85, 0.6))
  quote(p, H - 112, ['Mười sáu vòng nứa, ba lớp lá — một ngày cần mẫn của đôi bàn tay.', '十六の輪と三層の葉 — {職人|しょくにん}の手が{紡|つむ}ぐ一日。'], 50, W - 100, { size: 19, align: 'center' })
}

// ═════════════════════════════════════════ CHƯƠNG 3
{
  const ch = ch3
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: nghệ nhân cao tuổi bên chiếc nón — giữ nghề cho mai sau', '章扉写真：笠とともに微笑む年配の職人 — 技を未来へ'],
    alt: ['Ảnh toàn trang: chợ nón Chuông', '全面写真：チュオンの笠市場'],
  })
  mark(1, ch.title, left, '03')
  const rc = ch.recognition
  const f = new Flow(3, ch.label)

  // 3.1 — ghi nhận
  const p31 = f.section('3.1', rc.title)
  mark(2, rc.title, p31, '3.1')
  p31.add(DECO('leaf-sprig', p31.x1 - 96, f.y - 8, 96, 96, 0.35))
  f.quote(rc.proverb, { size: 19, inset: 0, gap: 20 })
  f.notes(rc.notes.slice(0, 2))
  f.prose(rc.p.slice(0, 2))
  f.notes(rc.notes.slice(2))
  f.prose(rc.p.slice(2))
  f.row(rc.images, { minH: 150, maxH: 210 })

  // nghệ nhân
  const ar = ch.artisans
  f.section(null, ar.title, { newPage: true })
  f.prose([ar.intro])
  const bioO = { size: S.cardText, lh: 1.55, jaSize: S.cardTextJa }
  const personW = (img) => CW - (img ? 148 : 0)
  const personNh = (name, img) => textH(name, personW(img), { size: S.card, font: F.head, lh: 1.25 })
  const people = (list, tail = 0) =>
    f.cards(list, ([[name, , bio], img]) => Math.max(personNh(name, img) + 24 + textH(bio, personW(img), bioO), img ? 170 : 0), (p, y, [[name, role, bio], img], h) => {
      const iw = img ? 130 : 0
      const tx = img ? iw + 18 : 0
      const tw = CW - tx
      const nh = personNh(name, img)
      const bh = textH(bio, tw, bioO)
      if (img) p.add(IMG(p.x0, y, iw, Math.min(h, 230), img))
      p.add(
        T(p.x0 + tx, y - 2, tw, nh, name, { font: F.head, size: S.card, weight: 700, color: C.ink, lh: 1.25, jaFont: F.jaHead, name: 'Tên nghệ nhân' }),
        T(p.x0 + tx, y + nh, tw, 18, role, { size: 13.5, italic: true, color: ACC[3], lh: 1.3, jaFont: F.jaSans, name: 'Vai trò' }),
        T(p.x0 + tx, y + nh + 24, tw, bh, bio, { ...bioO, align: 'justify', jaFont: F.jaBody, name: 'Tiểu sử' })
      )
    }, { gap: 24, grow: 40, tail })
  f.label(ar.groups[0].name)
  people(ar.groups[0].people.map((per) => [per, null]))
  f.figure(['Gian trưng bày nón ở làng Chuông: nón trắng, nón quai thao, nón vẽ', 'チュオン村の笠の展示：白い笠、クアイタオ笠、絵付けの笠'], { minH: 160, fill: true })
  f.label(ar.groups[1].name)
  people(ar.groups[1].people.map((per, i) => [per, ar.image[i]]), Infinity)
  f.fillGap(filler(3))

  // 3.2 bảo tồn, 3.3 thách thức: mỗi chủ đề = tiêu đề nhỏ + đoạn văn + ảnh bên phải
  const topicTw = CW - 160 - 18
  const topicNh = (name) => textH(name, CW, { size: S.card + 1, font: F.head, lh: 1.25 })
  const topics = (list) =>
    f.cards(list, ([name, text]) => topicNh(name) + 12 + Math.max(textH(text, topicTw, bioO), 170), (p, y, [name, text, hint], h) => {
      const iw = 160
      const nh = topicNh(name)
      const th = textH(text, topicTw, bioO)
      p.add(T(p.x0, y, p.cw, nh, name, { font: F.head, size: S.card + 1, weight: 700, color: ACC[3], lh: 1.25, jaFont: F.jaHead, name: 'Tiêu đề nhỏ' }))
      p.add(T(p.x0, y + nh + 12, topicTw, th, text, { ...bioO, align: 'justify', jaFont: F.jaBody, name: 'Đoạn văn' }))
      p.add(IMG(p.x1 - iw, y + nh + 12, iw, Math.min(h - nh - 12, 300), hint))
    }, { gap: 30, grow: 60, tail: Infinity })
  const ps = ch.preservation
  mark(2, ps.title, f.section('3.2', ps.title, { newPage: true }), '3.2')
  f.prose([ps.intro])
  topics(ps.topics)
  f.fillGap(filler(3))
  const cl = ch.challenges
  mark(2, cl.title, f.section('3.3', cl.title, { newPage: true }), '3.3')
  f.prose([cl.intro])
  topics(cl.topics)

  const p = new Page({ chapter: 3, hideNumber: true, bg: C.cream })
  p.add(RECT(0, 0, 18, H, ACC[3], { name: 'Dải màu' }), DECO('bamboo', 56, 80, 150, 300, 0.4), HL(80, 360, 64, ACC[3], 1.8))
  quote(p, 384, cl.outro, 80, W - 140, { size: 22, align: 'left', color: C.ink })
}

// ═════════════════════════════════════════ PHẦN KẾT
{
  const e = ending
  const f = new Flow(9, ['KẾT LUẬN', 'まとめ'])
  mark(1, e.conclusion.title, f.section(null, e.conclusion.title), '—')
  f.prose(e.conclusion.p.slice(0, 2))
  f.figure(['Nón cô dâu vẽ hoa — sản phẩm sáng tạo của làng Chuông hôm nay', '花を描いた花嫁の笠 — 今のチュオン村の創作品'], { minH: 170, maxH: 300 })
  f.prose(e.conclusion.p.slice(2))
  if (f.room > 130) f.place(110, (p, y) => p.add(DECO('non-line', p.x0 + p.cw / 2 - 90, y + (f.room - 110) / 2, 180, 96, 0.55)), 16)
  // trang trích dẫn kết: ảnh lớn + câu trích
  {
    const q = new Page({ chapter: 9, hideNumber: true, bg: C.cream })
    const qo = quoteOpt(21)
    const qh = textH(e.conclusion.quote, W - 120, qo)
    const top = H - qh - 150
    q.add(IMG(0, 0, W, top, ['Nón lá hai mặt lụa xanh ngọc — sản phẩm OCOP 4 sao', '両面に翡翠色の絹を張ったノンラー — OCOP四つ星製品'], { name: 'Ảnh' }), DECO('non-line', W / 2 - 60, top + 26, 120, 64, 0.6))
    quote(q, top + 104, e.conclusion.quote, 60, W - 120, { size: 21, align: 'center' })
  }

  f.page({ label: ['LƯU Ý', 'ご注意'] })
  f.y = sectionHead(f.p, TOP, null, e.notice.title)
  f.prose(e.notice.p)
  // họa tiết tre ở góc dưới, chỉ khi còn chỗ (không đè chữ)
  if (BOT - f.y > 140) f.p.add(DECO('bamboo', f.p.x1 - 110, Math.max(f.y, BOT - 230), 100, Math.min(220, BOT - f.y), 0.3))

  f.page({ label: ['TÀI LIỆU THAM KHẢO', '参考文献'] })
  mark(1, e.references.title, f.p, '—')
  f.y = sectionHead(f.p, TOP, null, e.references.title)
  e.references.items.forEach((ref, i) => {
    const ro = { size: 14, lh: 1.5 }
    const hh = textH([ref, null], CW - 34, ro)
    f.place(hh, (p, y) => p.add(T(p.x0, y, 30, 18, [`[${i + 1}]`, null], { size: 12, color: ACC[9], weight: 700, lh: 1.5, name: 'Số' }), T(p.x0 + 34, y, p.cw - 34, hh, [ref, null], { ...ro, color: C.ink2, name: 'Tài liệu' })), 10)
  })
  f.place(18, (p, y) => p.add(T(p.x0, y + 6, p.cw, 18, e.references.note, { size: 12.5, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Ghi chú' })))
  // nguồn ảnh lấy từ báo chí / kho ảnh mở (ảnh còn lại do nhóm tự chụp)
  {
    const credits = [
      ['NGUỒN ẢNH', '写真の出典'],
      ['Ảnh không ghi nguồn do nhóm tự chụp tại làng Chuông và các bảo tàng ở Hà Nội.', '出典の記載がない写真は、チュオン村とハノイの博物館で著者が撮影したものです。'],
      ['Báo Tuổi Trẻ (Nhà hát Ba Nón Lá; Tổng thống Hàn Quốc) · Báo Dân trí (thời trang) · Báo Người Lao Động (nón bài thơ) · Báo Quân đội nhân dân (nón lá sen; dao cắt lá) · VietNamNet (Phu nhân Thủ tướng Singapore)', 'トゥオイチェー紙（三つのノンラー劇場・韓国大統領）・ザンチー紙（ファッション）・グオイラオドン紙（詩の笠）・人民軍隊紙（蓮の葉の笠・小刀）・ベトナムネット（シンガポール首相夫人）'],
      ['Wikimedia Commons: nón ngựa và nón Thanh Oai (Daderot, CC0, hiện vật Bảo tàng Phụ nữ Việt Nam) · hàng bán nón Hà Nội 1896 (André Salles, BnF, phạm vi công cộng) · bản đồ nền Hà Nội (Anewplayer, CC BY-SA 4.0)', 'ウィキメディア・コモンズ：馬の笠とタインオアイの笠（Daderot、CC0、ベトナム女性博物館所蔵）・1896年ハノイの笠屋（アンドレ・サル、BnF、パブリックドメイン）・ハノイの地図（Anewplayer、CC BY-SA 4.0）'],
    ]
    const co = { size: 11.5, lh: 1.5, jaSize: 11.5, paraGap: 4 }
    const body = join(credits.slice(1))
    const hh = textH(body, CW, co)
    f.place(22 + hh, (p, y) => p.add(
      T(p.x0, y + 10, p.cw, 16, credits[0], { size: S.label, tracking: 2.4, weight: 700, color: ACC[9], jaFont: F.jaSans, name: 'Nhóm' }),
      T(p.x0, y + 32, p.cw, hh, body, { ...co, color: C.ink2, jaFont: F.jaSans, name: 'Nguồn ảnh' })
    ))
  }

  // nhóm thực hiện: chèn trang để bìa sau rơi vào trang trái cuối sách
  const p = new Page({ chapter: 9, bg: C.cream })
  runningHead(p, ['NHÓM THỰC HIỆN', '制作チーム'])
  let y = sectionHead(p, TOP, null, e.team.title)
  const lo = { size: 16, lh: 1.55, jaSize: jaPt(16) }
  const lh = textH([e.team.lead], p.cw, lo)
  p.add(T(p.x0, y, p.cw, lh, e.team.lead, { ...lo, jaFont: F.jaBody, name: 'Đoạn văn' }))
  y += lh + 20
  const mw = (p.cw - 14) / 2
  e.team.members.forEach(([name, code], i) => {
    const mx = p.x0 + (i % 2) * (mw + 14)
    const my = y + Math.floor(i / 2) * 200
    p.add(IMG(mx + (mw - 132) / 2, my, 132, 132, [`Ảnh chân dung — ${name}`, `ポートレート — ${name}`]), T(mx, my + 140, mw, 22, [name, null], { font: F.head, size: 16.5, align: 'center', lh: 1.3, name: 'Tên thành viên' }), T(mx, my + 166, mw, 16, [code, null], { size: 12, tracking: 1.4, align: 'center', color: C.muted, name: 'Mã sinh viên' }))
  })
  y += 2 * 200 + 4
  p.add(HL(p.x0, y, p.cw, C.line, 0.5))
  const co = { size: 14.5, lh: 1.55, jaSize: jaPt(14.5), paraGap: 6 }
  const pair = join([e.team.contact, e.team.thanks])
  p.add(T(p.x0, y + 18, p.cw, textH(pair, p.cw, co), pair, { ...co, align: 'center', italic: true, color: C.ink2, jaFont: F.jaBody, name: 'Lời cảm ơn' }))

  // trang lót mặt trong bìa sau (trang phải) rồi bìa sau (trang trái cuối cùng)
  if ((pages.length + 1) % 2 === 0) photoPage(['Ảnh toàn trang: những chiếc nón trên sân phơi lúc hoàng hôn', '全面写真：夕暮れの庭に並ぶノンラー'], 9)
  photoPage(['Ảnh trang lót: chùm nón lá trang trí treo dưới giàn tre', '見返し写真：竹の天井から吊るされたノンラーの飾り'], 9)
  const b = new Page({ chapter: 9, hideNumber: true, bg: '#2b2118' })
  b.add(
    IMG(0, 0, W, H * 0.55, ['Ảnh bìa sau: chiếc nón lá trên nền tre, ánh sáng dịu', '裏表紙写真：竹を背景にしたノンラー'], { name: 'Ảnh bìa sau' }),
    DECO('non-line', W / 2 - 80, H * 0.6, 160, 85, 0.75),
    T(50, H * 0.6 + 104, W - 100, 30, ['ありがとうございました', null], { font: F.jaBody, size: 21, align: 'center', color: '#f4ead4', lh: 1.4, name: 'Lời cảm ơn' }),
    T(50, H * 0.6 + 142, W - 100, 32, ['Cảm ơn quý độc giả', null], { font: F.script, size: 25, align: 'center', color: '#d9bd84', lh: 1.3, name: 'Lời cảm ơn' }),
    T(50, H - 100, W - 100, 38, ['NÓN LÁ LÀNG CHUÔNG · チュオン村のノンラー\nĐại học FPT Hà Nội · 2026 · nonla09092026@gmail.com', null], { size: 10, tracking: 1.2, align: 'center', color: 'rgba(244,234,212,.65)', lh: 1.7, name: 'Thông tin' })
  )
}

// ═════════════════════════════════════════ MỤC LỤC (điền sau khi biết số trang)
{
  const p = tocPage
  p.add(T(p.x0, 84, 320, 44, tocTitle.map(strip), { font: F.head, size: 34, lh: 1.2, jaFont: F.jaHead, name: 'Tiêu đề' }), ALT(p.x0, 132, 300, tocTitle, { size: 13 }), HL(p.x0, 164, 56, ACC[0], 1.4))
  let y = 188
  for (const a of anchors) {
    const acc = ACC[{ '01': 1, '02': 2, '03': 3 }[a.label] ?? 9]
    const pg = String(a.page).padStart(2, '0')
    if (a.level === 1) {
      y += 12
      const tt = a.title.map((s) => (s ? strip(s).replace(/\n/g, ' ') : s))
      const o = { font: F.head, size: 17.5, lh: 1.3, jaSize: 17 }
      const th = textH(tt, p.cw - 110, o)
      p.add(T(p.x0, y - 3, 44, 26, [a.label, null], { font: F.head, size: 21, color: acc, lh: 1.1, name: 'Số chương' }), T(p.x0 + 50, y, p.cw - 110, th, tt, { ...o, jaFont: F.jaHead, name: 'Mục lục' }), T(p.x1 - 44, y + 1, 44, 20, [pg, null], { font: F.head, size: 15, color: acc, align: 'right', lh: 1.3, name: 'Số trang' }))
      y += th + 8
    } else {
      const o = { size: 14, lh: 1.4, jaSize: 14 }
      const st = a.title.map(strip)
      const th = textH(st, p.cw - 150, o)
      p.add(T(p.x0 + 50, y, 34, 18, [a.label, null], { size: 13.5, color: acc, weight: 700, lh: 1.4, name: 'Số mục' }), T(p.x0 + 88, y, p.cw - 150, th, st, { ...o, color: C.ink2, jaFont: F.jaSans, name: 'Mục lục' }), T(p.x1 - 44, y, 44, 18, [pg, null], { size: 13.5, color: C.muted, align: 'right', lh: 1.4, name: 'Số trang' }))
      y += th + 7
    }
  }
  if (y > BOT) console.warn(`⚠ Mục lục tràn: ${Math.round(y)} > ${Math.round(BOT)}`)
}

// ── kiểm tra: chữ vượt đáy / mép trang
for (const p of pages) {
  for (const el of p.els.filter(Boolean)) {
    if (el.type === 'text' && el.y + el.h > H - 20 && p.bg !== '#2b2118' && !p.hideNumber) console.warn(`⚠ trang ${p.n}: "${String(el.text).slice(0, 30)}" chạm đáy (${Math.round(el.y + el.h)})`)
  }
}

// ── xuất
const out = pages.map((p) => ({ bg: p.bg, bgImage: null, template: null, hideNumber: p.hideNumber, elements: p.els.filter(Boolean) }))
fs.mkdirSync(path.join(here, 'out'), { recursive: true })
fs.writeFileSync(path.join(here, 'out', 'book.json'), JSON.stringify({ pages: out }, null, 1))
const counts = out.map((p, i) => `${i + 1}:${p.elements.length}`).join(' ')
console.log(`${out.length} trang · ${out.reduce((n, p) => n + p.elements.length, 0)} phần tử\n${counts}`)
console.log('Mục lục:', anchors.map((a) => `${a.label} ${strip(a.title[0]).replace(/\n/g, ' ')} → ${a.page}`).join(' | '))
