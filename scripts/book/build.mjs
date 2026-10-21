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
const F = { head: 'Playfair Display', body: 'Be Vietnam Pro', script: 'Dancing Script', jaHead: 'Shippori Mincho', jaBody: 'Noto Serif JP', jaSans: 'Noto Sans JP' }
const M = { bottom: 58, outer: 40, inner: 50 }
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
function textH(pair, w, o = {}) {
  const size = o.size ?? BODY.size
  const lh = o.lh ?? BODY.lh
  const jaSize = o.jaSize ?? size
  const n = String(pair[0]).split('\n').length
  const gap = (o.paraGap ?? 0) * (n - 1)
  const hv = pair[0] ? lines(pair[0], w, size, o.font === F.jaSans || o.font === F.jaBody, o.font) * size * lh + gap : 0
  const nj = String(pair[1] ?? '').split('\n').length
  const hj = pair[1] ? lines(pair[1], w, jaSize, true) * jaSize * lh + (o.paraGap ?? 0) * (nj - 1) : 0
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
  if (o.link) el.link = o.link
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
const VIDEO = (x, y, w, h, src, o = {}) => ({ id: id(), type: 'video', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, src, ...(o.poster ? { poster: o.poster } : {}), name: o.name ?? 'Video' })
const DECO = (name, x, y, w, h, opacity = 0.55) => ({ id: id(), type: 'image', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, src: `assets/book/deco/${name}.svg`, fit: 'contain', opacity, name: 'Họa tiết' })
const shape = (kind) => (x, y, w, h, fill, o = {}) => ({ id: id(), type: 'shape', shape: kind, x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, fill, ...(o.stroke ? { stroke: o.stroke, strokeWidth: o.sw ?? 0.8 } : {}), ...(o.radius ? { radius: o.radius } : {}), ...(o.opacity != null ? { opacity: o.opacity } : {}), name: o.name ?? 'Hình' })
const RECT = shape('rect')
const ELL = shape('ellipse')
const TRI = shape('triangle')
const HL = (x, y, w, stroke = C.line, sw = 0.6) => ({ id: id(), type: 'line', x: r1(x), y: r1(y - 2), w: r1(w), h: 4, rot: 0, x1: 0, y1: 0.5, x2: 1, y2: 0.5, stroke, strokeWidth: sw, name: 'Đường kẻ' })
const VL = (x, y, h, stroke = C.line, sw = 0.6) => ({ id: id(), type: 'line', x: r1(x - 2), y: r1(y), w: 4, h: r1(h), rot: 0, x1: 0.5, y1: 0, x2: 0.5, y2: 1, stroke, strokeWidth: sw, name: 'Đường kẻ' })
const join = (paras) => [paras.map((q) => q[0]).join('\n'), paras.map((q) => q[1]).join('\n')]
const isPhoto = (el) => el && ((el.type === 'image' && el.name !== 'Họa tiết') || el.type === 'video')

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
const photoPage = (hint, chapter = 0) => new Page({ chapter, hideNumber: true }).add(IMG(0, 0, W, H, hint, { name: 'Ảnh toàn trang' }))
/** trang kế tiếp phải là trang trái (số chẵn) — nếu không thì chèn một trang ảnh */
function toLeft(hint, chapter) {
  if ((pages.length + 1) % 2 !== 0) photoPage(hint, chapter)
}
function toRight(hint, chapter) {
  if ((pages.length + 1) % 2 === 0) photoPage(hint, chapter)
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

/** "1.1  Tên mục" + vạch màu → trả y tiếp theo */
function sectionHead(p, y, num, title) {
  const acc = ACC[p.chapter]
  const x = p.x0
  const tx = num ? x + 86 : x
  const tw = p.x1 - tx
  const o = { size: S.sec, font: F.head, lh: 1.2, jaSize: 27 }
  const th = textH(title, tw, o)
  p.add(
    num && T(x, y - 6, 82, 60, [num, null], { font: F.head, size: S.secNum, color: acc, lh: 1.1, name: 'Số mục' }),
    T(tx, y, tw, th, title, { ...o, color: C.title, jaFont: F.jaHead, name: 'Tên mục' })
  )
  const end = y + th + 12
  p.add(HL(tx, end, 56, acc, 1.4))
  return Math.max(end + 26, num ? y + 64 : 0)
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
  /** trang hiện tại chưa có ảnh → đặt một ảnh thật (khung 3:2, chật thì 16:9 / 2:1), canh đáy trang */
  fill() {
    if (!this.p || this.p.hasImg || !this.pool.length) return false
    const cap = this.pool[0]
    const ch = capH(cap, CW)
    for (const r of [R.wide, R.cin, R.pan]) {
      const need = CW * r + 6 + ch
      if (this.room >= need + 12) {
        const y = Math.max(this.y + 12, this.bot - need)
        figure(this.p, this.p.x0, y, CW, CW * r, cap)
        this.pool.shift()
        this.y = y + need + 18
        return true
      }
    }
    return false
  }
  end() {
    this.fill()
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
    if (!this.p || o.newPage || this.room - this.reserve < 300) this.page()
    else if (!this.fresh) this.y += 18
    this.y = sectionHead(this.p, this.y, num, title)
    return this.p
  }
  block(h, num) {
    const bh = blockHeight(h, CW, num)
    this.need(bh + BODY.size * BODY.lh * 3 + this.reserve)
    this.y = blockHead(this.p, this.y, h, num)
    return this.p
  }
  /** đoạn văn: gộp các đoạn cùng trang vào một khối, tách đoạn khi sang trang */
  prose(paras, o = {}) {
    const opt = { size: o.size ?? BODY.size, lh: o.lh ?? BODY.lh, paraGap: o.paraGap ?? 8, jaSize: o.jaSize ?? (o.size ? jaPt(o.size, 1.14) : BODY.jaSize) }
    const w = () => this.p.cw
    const queue = paras.map((q) => [...q])
    let acc = []
    const keep = () => (typeof o.keep === 'function' ? o.keep() : (o.keep ?? 0))
    const limit = () => this.bot - keep() - (o.free ? 0 : this.reserve)
    const flush = () => {
      if (!acc.length) return
      const pair = join(acc)
      const h = textH(pair, w(), opt)
      this.p.add(T(this.p.x0, this.y, w(), h, pair, { ...opt, align: o.align ?? 'justify', color: o.color ?? C.ink, jaFont: F.jaBody, italic: o.italic, font: o.font, name: o.name ?? 'Đoạn văn' }))
      this.y += h
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
      const used = acc.length ? textH(join(acc), w(), opt) + opt.paraGap : 0
      const sp = splitPara(queue[0], w(), opt, limit() - this.y - used)
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
    caps.forEach((c, i) => figure(this.p, this.p.x0 + i * (w + gap), this.y, w, h, c))
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
      const extraGap = n > 1 ? Math.min(60, spare / (n - 1)) : 0
      let y = start
      for (let k = i; k < j; k++) {
        draw(this.p, y, items[k], hs[k])
        y += hs[k] + gap + extraGap
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
    ['Nón lá trắng bên tà áo dài trước sân đình Chuông', 'チュオン村の亭の前で、アオザイとともに並ぶ白いノンラー'],
    ['Ba thiếu nữ áo dài ngắm nón lá trên bậc thềm đình Chuông', 'チュオン村の亭の石段で、ノンラーを眺めるアオザイ姿の三人'],
    ['Đội nón lá dạo bước trước cổng đình Chuông', 'ノンラーをかぶってチュオン村の亭の門の前を歩く'],
    ['Lòng nón lá trắng với chỉ nhôi đỏ – xanh', '赤と青のニョイの糸が見える白いノンラーの内側'],
    ['Nón lụa nhiều màu xếp chồng tại làng Chuông', 'チュオン村に積み重ねられた色とりどりの絹の笠'],
  ],
  1: [
    ['Các kiểu nón cổ trưng bày tại Bảo tàng Phụ nữ Việt Nam', 'ベトナム女性博物館に展示された古いノンラー'],
    ['Nón và trang phục dân tộc trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ベトナム民族学博物館に展示された笠と民族衣装'],
    ['Chồng nón làng Chuông trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ベトナム民族学博物館に展示されたチュオン村の笠'],
    ['Nón lá trong tranh sơn dầu — Bảo tàng Mỹ thuật Việt Nam', '油彩画に描かれたノンラー — ベトナム美術博物館'],
    ['Nón lá cổ trưng bày tại Bảo tàng Mỹ thuật Việt Nam', 'ベトナム美術博物館に展示された古いノンラー'],
    ['Người phụ nữ đội nón giữa cánh đồng — tranh tại Bảo tàng Mỹ thuật Việt Nam', '田んぼでノンラーをかぶる女性 — ベトナム美術博物館の絵画'],
    ['Phiên chợ nón Chuông họp từ sáng sớm', '早朝から開かれるチュオンの笠市場'],
    ['Nón trắng xếp thành từng chồng ở chợ Chuông', 'チュオンの市場に積み重ねられた白い笠'],
    ['Bốn bạn trẻ đội nón lá trước cổng đình Chuông', 'チュオン村の亭の門の前で、ノンラーをかぶる四人の若者'],
    ['Nón lá trắng trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ベトナム民族学博物館に展示された白いノンラー'],
    ['Nón cổ có trang trí hoa văn — Bảo tàng Phụ nữ Việt Nam', '模様で飾られた古い笠 — ベトナム女性博物館'],
    ['Chợ nón Chuông dưới mái che treo đèn lồng', '提灯の下がる屋根の下のチュオンの笠市場'],
    ['Người mua kẻ bán tấp nập trong phiên chợ nón Chuông', '売り手と買い手でにぎわうチュオンの笠市場'],
    ['Gian trưng bày nón và bằng khen tại một cơ sở làng Chuông', 'チュオン村の工房に並ぶ笠と表彰状'],
  ],
  2: [
    ['Bó vòng nứa vót sẵn bày bán ở chợ Chuông', 'チュオンの市場に並ぶ、削ったヌア竹の輪の束'],
    ['Khuôn nón bày bán ở chợ Chuông', 'チュオンの市場で売られる笠の型'],
    ['Sợi len màu để luồn nhôi bày bán ở chợ Chuông', 'チュオンの市場に並ぶ、ニョイ用の色糸'],
    ['Lá lụi bày bán trước cổng đình Chuông', 'チュオン村の亭の門前で売られるライ葉'],
    ['Bó liếc bày bán ở chợ Chuông', 'チュオンの市場に並ぶリエックの束'],
    ['Lá lụi và nón thành phẩm trong phiên chợ Chuông', 'チュオンの市場に並ぶライ葉と完成した笠'],
    ['Khung nón bày bán ở chợ Chuông', 'チュオンの市場で売られる笠の骨組み'],
    ['Người bán nón bên những chồng nón trắng ở chợ Chuông', 'チュオンの市場で白い笠の山の横に座る売り手'],
    ['Người bán lá lụi ở chợ Chuông', 'チュオンの市場でライ葉を売る人々'],
    ['Khung nón xếp chồng ở chợ Chuông', 'チュオンの市場に積まれた笠の骨組み'],
    ['Người bán nón bên chồng nón ở chợ Chuông', 'チュオンの市場で、積まれた笠のそばに座る売り手'],
    ['Nón làng Chuông xếp chồng — Bảo tàng Dân tộc học Việt Nam', '積み重ねられたチュオン村の笠 — ベトナム民族学博物館'],
  ],
  3: [
    ['Biển “Lớp học giữ nghề nón làng Chuông”', '「チュオン村の笠づくりを守る教室」の看板'],
    ['Trung tâm Thiết kế sáng tạo, giới thiệu, quảng bá và bán sản phẩm OCOP – làng nghề Nón Chuông', 'ノン・チュオン工芸村OCOP製品の創作デザイン・紹介・PR・販売センター'],
    ['Du khách trải nghiệm làm nón tại làng Chuông', 'チュオン村で笠づくりを体験する観光客'],
    ['Du khách thử vẽ trang trí nón', '笠の絵付けを体験する観光客'],
    ['Bài báo “Người dệt hồn quê lên vành nón lá” về nghệ nhân Lê Văn Tuy', '職人レー・ヴァン・トゥイを紹介した記事「笠に故郷の心を織り込む人」'],
    ['Không gian trưng bày của nghệ nhân Lê Văn Tuy', '職人レー・ヴァン・トゥイの展示スペース'],
    ['Giấy khen của Bảo tàng Dân tộc học Việt Nam tặng ông Lê Văn Tuy', 'ベトナム民族学博物館からレー・ヴァン・トゥイ氏に贈られた表彰状'],
    ['Bằng công nhận Nghệ nhân làng nghề Việt Nam của ông Lê Văn Tuy', 'レー・ヴァン・トゥイ氏の「ベトナム工芸村職人」認定証'],
    ['Du khách cùng trải nghiệm làm nón tại một cơ sở làng Chuông', 'チュオン村の工房で笠づくりを体験する観光客'],
    ['Không gian trải nghiệm làm nón tại làng Chuông', 'チュオン村の笠づくり体験の場'],
    ['Phiên chợ nón Chuông đông đúc', '大勢の人でにぎわうチュオンの笠市場'],
  ],
  9: [
    ['Nón chùm — sản phẩm OCOP 4 sao của cơ sở Lê Văn Tuy', '束ね笠 — レー・ヴァン・トゥイ工房のOCOP四つ星製品'],
    ['Nón lá hai mặt lụa xanh ngọc nhìn từ trong lòng nón', '内側から見た、両面に翡翠色の絹を張った笠'],
    ['Phiên chợ bán lá lụi trước cổng đình Chuông', 'チュオン村の亭の門前で開かれるライ葉の市'],
    ['Nón ba tầm làng Chuông', 'チュオン村のバータム笠'],
    ['Nón lụa nhiều màu tại một cơ sở làng Chuông', 'チュオン村の工房の色とりどりの絹の笠'],
    ['Bốn bạn trẻ áo dài cùng nón lá ở đình Chuông', 'チュオン村の亭で、ノンラーを手にするアオザイ姿の四人'],
  ],
}

/** cặp trang mở chương: trái ảnh lớn tràn trang + số chương thật to, phải tên chương + đoạn dẫn */
function chapterOpener(ch, photo) {
  const acc = ACC[ch.no]
  toLeft(photo.alt, ch.no - 1)
  const left = new Page({ chapter: ch.no, hideNumber: true })
  left.add(
    IMG(0, 0, W, H, photo.main, { name: 'Ảnh mở chương' }),
    RECT(0, H - 210, W, 210, '#1f1810', { opacity: 0.5, name: 'Nền chữ' }),
    T(left.x0, H - 196, 320, 150, [String(ch.no).padStart(2, '0'), null], { font: F.head, size: 132, color: '#fbf7ee', lh: 1.1, name: 'Số chương' })
  )
  const p = new Page({ chapter: ch.no, hideNumber: true, bg: C.cream })
  p.add(RECT(W - 18, 0, 18, H, acc, { name: 'Dải màu chương' }), DECO('bamboo', W - 130, H - 250, 100, 220, 0.32))
  const tw = p.cw - 10
  const title = [ch.title[0].replace(/\n/g, ' '), strip(ch.title[1]).replace(/\n/g, '')]
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
// chỉ có hình chiếc nón làng Chuông (ảnh nhóm chụp, đã tách nền) trên nền giấy, họa tiết nét mảnh
{
  const p = new Page({ hideNumber: true, bg: C.paper })
  const brown = '#5b4128'
  p.add(
    DECO('bamboo', -10, 40, 150, 330, 0.28),
    DECO('lotus', W - 170, H - 300, 160, 230, 0.32),
    IMG(-20, 300, W + 40, 420, ['Ảnh bìa: chiếc nón lá chóp truyền thống làng Chuông (ảnh tách nền)', '表紙写真：チュオン村の伝統的な円錐形のノンラー'], { fit: 'contain', name: 'Ảnh bìa' }),
    T(48, 70, 500, 120, ['NÓN LÁ\nLÀNG CHUÔNG', 'チュオン村の\nノンラー'], { font: F.head, size: 52, lh: 1.08, tracking: 2.5, color: brown, jaFont: F.jaHead, jaSize: 46, name: 'Tên sách' }),
    T(50, 196, 500, 44, front.subtitle.map(strip), { font: F.script, size: 32, lh: 1.3, color: ACC[0], jaFont: F.jaHead, jaSize: 24, name: 'Tên phụ' }),
    HL(52, 258, 70, ACC[0], 1.4),
    RECT(48, H - 94, 124, 42, '#fbf4e4', { radius: 6, opacity: 0.94, name: 'Nền logo' }),
    IMG(54, H - 89, 112, 32, ['Logo FPT', 'FPTロゴ'], { fit: 'contain', name: 'Logo' }),
    T(186, H - 89, 360, 34, front.team, { size: 10.5, lh: 1.5, color: '#6d5640', jaFont: F.jaSans, name: 'Thông tin' })
  )
}

// ═════════════════════════════════════════ MỤC LỤC (cặp trang 2–3: mở bìa là thấy ngay, điền sau khi biết số trang)
const tocPages = [new Page({ chapter: 0, bg: C.cream, hideNumber: true }), new Page({ chapter: 0, bg: C.cream, hideNumber: true })]

// ═════════════════════════════════════════ LỜI MỞ ĐẦU
{
  const f = new Flow(0, ['LỜI MỞ ĐẦU', 'はじめに'], [...POOL[0]])
  const p = f.page()
  mark(1, preface.title, p, '—')
  p.add(DECO('leaf-sprig', p.x1 - 120, 64, 120, 120, 0.4))
  const to = { size: 34, font: F.head, lh: 1.2 }
  p.add(T(p.x0, 96, p.cw - 130, textH(preface.title, p.cw - 130, to), preface.title, { ...to, color: C.title, jaFont: F.jaHead, name: 'Tiêu đề' }))
  p.add(HL(p.x0, 154, 56, ACC[0], 1.4))
  f.y = 178
  f.prose(preface.paras)
  const sign = textH(preface.sign, CW, { size: 15, lh: 1.5 })
  f.place(sign, (pg, y) => pg.add(T(pg.x0, y, pg.cw, sign, preface.sign, { size: 15, italic: true, align: 'right', color: C.ink2, lh: 1.5, jaFont: F.jaBody, name: 'Ký tên' })), 26)
  f.end()
}

// ═════════════════════════════════════════ CHƯƠNG 1
{
  const ch = ch1
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: thiếu nữ áo dài đội nón lá giữa cánh đồng', '章扉写真：田んぼの中、アオザイ姿でノンラーをかぶる女性'],
    alt: ['Ảnh toàn trang: nón lá trên cánh đồng lúa', '全面写真：田んぼの中のノンラー'],
  })
  mark(1, ch.title, left, '01')
  const f = new Flow(1, ch.label, [...POOL[1]])

  // 1.1 — khái niệm, công dụng, giá trị
  const s11 = ch.life
  mark(2, s11.title, f.section('1.1', s11.title), '1.1')
  for (const b of s11.blocks.slice(0, 2)) {
    f.block(b.h)
    f.prose(b.p)
  }
  f.figure(['Nón lá trong đời sống thường ngày: che nắng, che mưa khi lao động', '日々の暮らしの中のノンラー：働く人を日差しや雨から守る'])
  const val = s11.blocks[2]
  f.block(val.h)
  f.prose(val.p)
  f.gallery(val.images, 2)

  // hai dáng nón
  const sh = ch.shapes
  f.page()
  f.y = blockHead(f.p, f.y, sh.title)
  f.prose([sh.intro])
  const grid = (g, cols) => {
    const gap = 14
    const cw = (CW - gap * (cols - 1)) / cols
    const cell = cw * R.std
    const nameO = { font: F.head, size: 16.5, lh: 1.25, jaSize: 16 }
    const placeO = { size: 12, lh: 1.35 }
    const nameH = Math.max(...g.items.map(([n, pl]) => textH(n, cw, nameO) + 4 + textH(pl, cw, placeO)))
    const rows = Math.ceil(g.items.length / cols)
    const textHt = textH(g.text, CW, { size: 16.5, lh: 1.55, jaSize: jaPt(16.5) })
    if (f.room < 28 + textHt + 12 + rows * (cell + 8 + nameH) + (rows - 1) * 14) f.page()
    f.label(g.name)
    f.prose([g.text], { size: 16.5, after: 10, free: true })
    const p = f.p
    g.items.forEach(([name, place], i) => {
      const gx = p.x0 + (i % cols) * (cw + gap)
      const gy = f.y + Math.floor(i / cols) * (cell + 8 + nameH + 14)
      p.add(IMG(gx, gy, cw, cell, [`${name[0]} — ${place[0]}`, `${strip(name[1])} — ${place[1]}`]))
      const nh = textH(name, cw, nameO)
      p.add(T(gx, gy + cell + 6, cw, nh, name, { ...nameO, color: C.ink, jaFont: F.jaHead, name: 'Tên nón' }), T(gx, gy + cell + 10 + nh, cw, textH(place, cw, placeO), place, { ...placeO, color: C.muted, jaFont: F.jaSans, name: 'Địa phương' }))
    })
    f.y += rows * (cell + 8 + nameH) + (rows - 1) * 14 + 22
  }
  grid(sh.groups[0], 3)
  grid(sh.groups[1], 3)
  f.note(sh.outro)

  // 1.2 — dấu tích + dòng thời gian
  const hi = ch.history
  mark(2, hi.title, f.section('1.2', hi.title, { newPage: true }), '1.2')
  const tr = hi.traces
  f.block(tr.h)
  f.notes(tr.notes)
  f.prose(tr.p)
  {
    const whenW = 112
    const tlOff = whenW + 16
    const nameO = { font: F.head, size: 17, lh: 1.3, jaSize: 16.5 }
    const wo = { size: 15.5, lh: 1.55, jaSize: jaPt(15.5) }
    const textW = CW - tlOff - 22
    const rowH = (e) => textH(e.name, textW, nameO) + 4 + textH(e.text, textW, wo) + 18
    const rows = tr.timeline.map(rowH)
    f.cards(
      tr.timeline,
      (e) => rowH(e),
      (p, y, e, h) => {
        const tlX = p.x0 + tlOff
        p.add(
          VL(tlX, y + 14, h, ACC[1], 1),
          ELL(tlX - 6, y + 2, 12, 12, ACC[1], { stroke: ACC[1], sw: 1.3 }),
          T(p.x0, y - 2, whenW, 20, e.when, { font: F.head, size: 15, weight: 700, color: ACC[1], align: 'right', lh: 1.25, jaFont: F.jaHead, jaSize: 14.5, name: 'Mốc thời gian' })
        )
        const nh = textH(e.name, textW, nameO)
        p.add(T(tlX + 22, y - 3, textW, nh, e.name, { ...nameO, weight: 700, color: C.ink, jaFont: F.jaHead, name: 'Sự kiện' }), T(tlX + 22, y + nh + 1, textW, textH(e.text, textW, wo), e.text, { ...wo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
      },
      { gap: 6 }
    )
    void rows
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
  mark(2, vg.title, f.section('1.3', vg.title, { newPage: true }), '1.3')
  const ab = vg.about
  mark(3, ab.h, f.block(ab.h, ab.id), ab.id)
  f.prose(ab.p.slice(0, 1))
  f.figure(ab.images[0], { ratio: R.wide })
  f.prose(ab.p.slice(1))
  f.row(ab.images.slice(1))

  // 1.3.2 các loại nón: ảnh lớn + thẻ từng loại (ảnh tách nền, khung vuông)
  const ty = vg.types
  f.page()
  mark(3, ty.h, f.p, ty.id)
  f.y = blockHead(f.p, f.y, ty.h, ty.id)
  f.figure(ty.hero, { ratio: R.cin })
  f.prose([ty.intro])
  const iw = 168
  const tx = iw + 20
  const to = { size: 16, lh: 1.55, jaSize: jaPt(16) }
  const nameOf = (t) => textH(t.name, CW - tx, { size: S.card, font: F.head, lh: 1.25 })
  const typeCards = (list, imgHint) =>
    f.cards(
      list,
      (t) => Math.max(nameOf(t) + 8 + textH(t.text, CW - tx, to), iw),
      (p, y, t) => {
        const nh = nameOf(t)
        p.add(IMG(p.x0, y, iw, iw, imgHint(t), { fit: 'cover' }))
        p.add(T(p.x0 + tx, y - 2, CW - tx, nh, t.name, { font: F.head, size: S.card, weight: 700, color: ACC[1], lh: 1.25, jaFont: F.jaHead, name: 'Tên nón' }))
        p.add(T(p.x0 + tx, y + nh + 8, CW - tx, textH(t.text, CW - tx, to), t.text, { ...to, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
      },
      { gap: 26 }
    )
  typeCards(ty.list, (t) => [`${t.name[0]} — ảnh tách nền`, `${strip(t.name[1])} — 背景を切り抜いた写真`])
  f.block(ty.styled.h)
  typeCards(ty.styled.list, (t) => [`${t.name[0]} — ảnh sản phẩm`, `${strip(t.name[1])} — 製品写真`])
  f.note(ty.outro, { italic: false })
  f.end()
}

// ═════════════════════════════════════════ CHƯƠNG 2
const stepPages = [] // { no, name, page } — cho dải tên công đoạn
let stripPage = null
{
  const ch = ch2
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: đôi bàn tay nghệ nhân khâu nón trên khuôn', '章扉写真：型の上で笠を縫う職人の手'],
    alt: ['Ảnh toàn trang: nón lá Làng Chuông', '全面写真：チュオン村のノンラー'],
  })
  mark(1, ch.title, left, '02')
  const f = new Flow(2, ch.label, [...POOL[2]])
  f.page()
  f.prose(ch.intro)

  // 2.1 — cấu tạo
  const st = ch.structure
  mark(2, st.title, f.section('2.1', st.title), '2.1')
  f.prose([st.intro])
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
  // 2.1.1 — ba lớp: sơ đồ ba lớp xếp tầng + mô tả từng lớp
  const ly = st.layers
  mark(3, ly.h, f.block(ly.h, ly.id), ly.id)
  f.prose([ly.intro])
  {
    const coneH = 96
    const dH = coneH * (1 + 2 * 0.8) + 34
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
        const item = ly.items[i]
        const lyy = cy + coneH * 0.4
        p.add(ELL(p.x0, lyy, 24, 24, ACC[2]), T(p.x0, lyy + 4.5, 24, 15, [String(i + 1), null], { size: 11.5, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số' }), T(p.x0 + 32, lyy, 148, 44, item[0], { font: F.head, size: 15, weight: 700, color: ACC[2], lh: 1.3, jaFont: F.jaHead, jaSize: 14.5, name: 'Lớp' }))
      }
      p.add(T(dx, y + dH - 16, dw, 16, ['Minh họa cấu trúc tách lớp, không theo tỷ lệ thực tế', '層を分けた構造のイメージ図（実寸ではありません）'], { size: 12, italic: true, color: C.muted, align: 'center', jaFont: F.jaSans, name: 'Chú thích sơ đồ' }))
    })
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

  // 2.1.2 — khung 16 vòng: sơ đồ vòng (dáng thấp, bớt nhọn)
  const fr = st.frame
  mark(3, fr.h, f.block(fr.h, fr.id), fr.id)
  f.prose(fr.p)
  {
    const fH = 170
    const fw = 300
    f.place(fH + 22, (p, y) => {
      const fx = p.x0 + (p.cw - fw) / 2 - 40
      p.add(TRI(fx, y, fw, fH, 'none', { stroke: '#a4865a', sw: 0.8, opacity: 0.6 }))
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
  f.note(fr.note, { size: 14.5 })
  f.prose(fr.after)
  f.figure(fr.image)

  // 2.2 — nguyên liệu & dụng cụ: mỗi trang hai món, ảnh so le trái / phải
  const mt = ch.materials
  mark(2, mt.title, f.section('2.2', mt.title, { newPage: true }), '2.2')
  const itemTo = { size: 16, lh: 1.55, jaSize: jaPt(16) }
  const iw2 = 210
  const stagger = (list, label) => {
    let k = 0
    list.forEach(([name, text, hint]) => {
      const tw = CW - iw2 - 22
      const nh = textH(name, tw, { size: 20, font: F.head, lh: 1.25 })
      const th = textH(text, tw, itemTo)
      const h = Math.max(iw2 * R.por, nh + 10 + th)
      if (!f.p || f.room < h) {
        f.page()
        k = 0
      }
      if (label && f.fresh) f.label(label)
      const p = f.p
      const right = k % 2 === 1
      const ix = right ? p.x1 - iw2 : p.x0
      const tx = right ? p.x0 : p.x0 + iw2 + 22
      p.add(IMG(ix, f.y, iw2, iw2 * R.por, hint))
      p.add(T(tx, f.y - 2, tw, nh, name, { font: F.head, size: 20, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' }), T(tx, f.y + nh + 10, tw, th, text, { ...itemTo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
      f.y += h + 34
      k++
    })
  }
  stagger(mt.items, ['NGUYÊN LIỆU', '材料'])
  // dụng cụ: khuôn nón (một trang riêng, ảnh lớn) rồi các dụng cụ nhỏ
  const [mold] = mt.tools
  f.page()
  f.label(['DỤNG CỤ', '道具'])
  f.place(26, (p, y) => p.add(T(p.x0, y, p.cw, 26, mold[0], { font: F.head, size: 22, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' })), 10)
  f.figure(mold[2], { ratio: R.cin })
  f.prose([mold[1], ...mt.moldMore], { size: 16 })
  stagger(mt.small)
  f.note(mt.outro)

  // 2.3 — quy trình
  const pr = ch.process
  mark(2, pr.title, f.section('2.3', pr.title, { newPage: true }), '2.3')
  const lf = pr.leaf
  mark(3, lf.h, f.block(lf.h, lf.id), lf.id)
  f.prose(lf.p)
  f.row(lf.images)
  f.end()

  // dải tên công đoạn: trang phải, ngay trước cặp trang của công đoạn 1
  toRight(['Ảnh toàn trang: nón lá Làng Chuông', '全面写真：チュオン村のノンラー'], 2)
  stripPage = new Page({ chapter: 2, bg: C.cream })
  runningHead(stripPage, ch.label)
  mark(3, pr.stepsH.h, stripPage, pr.stepsH.id)

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
    // khung GIF (tạm dùng ảnh thật của công đoạn; nhóm thay bằng GIF)
    const gh = CW * R.cin
    p.add(RECT(p.x0 - 6, y - 6, CW + 12, gh + 12, '#ffffff', { radius: 6, name: 'Khung GIF' }))
    stepFlow.y = figure(p, p.x0, y, CW, gh, s.gif, { noCaption: true }) + 10
    // trang phải: chữ còn lại rồi ảnh thật (chừa chỗ ảnh ở đáy trang phải)
    const n = s.photos.length
    const gap = 14
    const pw = (CW - gap * (n - 1)) / n
    const ch = Math.max(...s.photos.map((c) => capH(c, pw)))
    // ảnh trang phải: khung lớn nhất còn vừa chỗ (chữ trang phải ước bằng phần dư sau trang trái)
    const restH = Math.max(0, textH(join(s.text), CW, { size: 15.5, lh: BODY.lh, jaSize: jaPt(15.5, 1.14), paraGap: 8 }) - (BOT - stepFlow.y))
    const roomR = BOT - TOP - restH - 40 - ch
    const ph = pw * ((n === 1 ? [R.wide, R.cin] : [R.por, R.std]).find((r) => pw * r <= roomR) ?? (n === 1 ? R.cin : R.std))
    stepFlow.prose(s.text, { size: 15.5, keep: () => (stepFlow.p === p ? 0 : ph + 6 + ch + 20) })
    if (stepFlow.p === p) stepFlow.page()
    const rp = stepFlow.p
    if (rp.n !== p.n + 1) console.warn(`⚠ công đoạn ${s.no}: chữ tràn quá một cặp trang`)
    const top = Math.max(stepFlow.y + 10, BOT - ph - 6 - ch)
    s.photos.forEach((c, i) => figure(rp, rp.x0 + i * (pw + gap), top, pw, ph, c))
    if (stepFlow.y < top - 150) rp.add(DECO('leaf-sprig', rp.x0 + rp.cw / 2 - 60, stepFlow.y + (top - stepFlow.y) / 2 - 60, 120, 120, 0.35))
    stepFlow.y = BOT
  }
  const STEP_MEDIA = {
    1: { gif: ['GIF công đoạn rẽ lá', '葉のばしのGIF'], photos: [['Tay nghệ nhân rẽ từng chiếc lá', '葉を一枚ずつのばす職人の手']] },
    2: { gif: ['GIF công đoạn là lá', '葉のアイロンがけのGIF'], photos: [['Nghệ nhân ngồi là lá bên bếp điện', '電気コンロのそばで葉にアイロンをかける職人']] },
    3: { gif: ['GIF công đoạn bứt vòng', '輪づくりのGIF'], photos: [['Nối các vành nứa và đặt vào khuôn 16 vòng', 'ヌア竹の輪をつないで型にはめる'], ['Khuôn nón với các vòng nứa nhìn từ trên xuống', '上から見た、ヌア竹の輪をはめた型']] },
    4: { gif: ['GIF công đoạn quay nón', '葺き込みのGIF'], photos: [['Xếp từng lớp lá lụi lên khuôn', 'ライ葉を一枚ずつ型に重ねる'], ['Trải đều lá quanh khung nón', '骨組みの周りに葉を均等に広げる']] },
    5: { gif: ['GIF công đoạn khâu nón', '縫い付けのGIF'], photos: [['Cận cảnh mũi kim, sợi cước xuyên qua lớp lá', '葉の層を通る針と糸のクローズアップ'], ['Nghệ nhân khâu nón, đặt nghiêng khung giữa hai đầu gối', '型を両ひざの間に斜めに置いて笠を縫う職人']] },
    6: { gif: ['GIF công đoạn nức nón', '縁縫いのGIF'], photos: [['Cắt lá thừa và khâu viền vành nón', '余分な葉を切り、縁を縫う'], ['Khâu viền vành nón', 'つばの縁を縫う']] },
    7: { gif: ['GIF công đoạn luồn nhôi', 'ニョイ通しのGIF'], photos: [['Chỉ màu luồn trong lòng nón', '笠の内側に通した色糸'], ['Nghệ nhân luồn sợi chỉ màu vào lòng nón', '笠の内側に色糸を通す職人']] },
    8: { gif: ['GIF công đoạn quang dầu', '油塗りのGIF'], photos: [['Quét dầu bóng và phơi nón', '油を塗って笠を干す']] },
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
    main: ['Ảnh mở chương: nghệ nhân cao tuổi bên chiếc nón — giữ nghề cho mai sau', '章扉写真：笠とともに微笑む年配の職人 — 技を未来へ'],
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
  f.notes(rc.notes.slice(0, 2))
  f.prose(rc.p.slice(0, 1))
  f.page()
  f.notes(rc.notes.slice(2))
  f.prose(rc.p.slice(1))
  f.row([rc.images[1], ['Đình Chuông — không gian sinh hoạt của làng nghề', 'チュオン村の亭 — 工芸村の暮らしの場']])

  // sản phẩm OCOP tiêu biểu: 5 giấy chứng nhận của cơ sở Lê Văn Tuy (ảnh + tên + cơ sở + hạng)
  {
    f.page()
    f.y = blockHead(f.p, f.y, ['Một số sản phẩm OCOP tiêu biểu của làng Chuông', 'チュオン村の代表的なOCOP製品'])
    const prods = [
      [['Nón chùm', '{束|たば}ね{笠|がさ}'], 'Nón chùm'],
      [['Nón cô dâu', '花嫁の笠'], 'Nón cô dâu'],
      [['Nón lá hai mặt lụa', '両面絹張りの笠'], 'Nón lá hai mặt lụa'],
      [['Nón lá truyền thống đặc biệt', '特製の伝統的なノンラー'], 'Nón lá truyền thống đặc biệt'],
      [['Nón lá vải lụa mặt ngoài', '外側に絹を張ったノンラー'], 'Nón lá vải lụa mặt ngoài'],
    ]
    const cols = 3
    const gap = 16
    const cw = (CW - gap * (cols - 1)) / cols
    const ih = cw * R.por
    const nameO = { font: F.head, size: 15.5, lh: 1.25, jaSize: 15 }
    const metaO = { size: 11.5, lh: 1.4 }
    const meta = ['Cơ sở nón lá Lê Văn Tuy\nOCOP 4 sao · 2022', 'レー・ヴァン・トゥイ工房\nOCOP四つ星・2022年']
    const nameH = Math.max(...prods.map(([n]) => textH(n, cw, nameO)))
    const cellH = ih + 8 + nameH + 4 + textH(meta, cw, metaO)
    const p = f.p
    prods.forEach(([name, key], i) => {
      const row = Math.floor(i / cols)
      const inRow = row === 0 ? cols : prods.length - cols
      const offset = row === 0 ? 0 : (CW - (inRow * cw + (inRow - 1) * gap)) / 2
      const gx = p.x0 + offset + (i % cols) * (cw + gap)
      const gy = f.y + row * (cellH + 20)
      p.add(IMG(gx, gy, cw, ih, [`Giấy chứng nhận OCOP 4 sao — ${key}`, `OCOP四つ星の認定証 — ${strip(name[1])}`], { fit: 'cover' }))
      p.add(T(gx, gy + ih + 8, cw, nameH, name, { ...nameO, weight: 700, color: ACC[3], jaFont: F.jaHead, align: 'center', name: 'Tên sản phẩm' }), T(gx, gy + ih + 12 + nameH, cw, textH(meta, cw, metaO), meta, { ...metaO, color: C.muted, align: 'center', jaFont: F.jaSans, name: 'Cơ sở · hạng' }))
    })
    f.y += 2 * cellH + 20 + 24
  }

  // nghệ nhân
  const ar = ch.artisans
  f.section(null, ar.title, { newPage: true })
  f.prose([ar.intro])
  const bioO = { size: 15.5, lh: 1.55, jaSize: jaPt(15.5) }
  const piw = 140
  const ptx = piw + 18
  const personNh = (name) => textH(name, CW - ptx, { size: S.card, font: F.head, lh: 1.25 })
  const people = (list) =>
    f.cards(
      list,
      ([[name, , bio]]) => Math.max(personNh(name) + 24 + textH(bio, CW - ptx, bioO), piw * R.por),
      (p, y, [[name, role, bio], img]) => {
        const nh = personNh(name)
        p.add(IMG(p.x0, y, piw, piw * R.por, img))
        p.add(
          T(p.x0 + ptx, y - 2, CW - ptx, nh, name, { font: F.head, size: S.card, weight: 700, color: C.ink, lh: 1.25, jaFont: F.jaHead, name: 'Tên nghệ nhân' }),
          T(p.x0 + ptx, y + nh, CW - ptx, 18, role, { size: 13.5, italic: true, color: ACC[3], lh: 1.3, jaFont: F.jaSans, name: 'Vai trò' }),
          T(p.x0 + ptx, y + nh + 24, CW - ptx, textH(bio, CW - ptx, bioO), bio, { ...bioO, align: 'justify', jaFont: F.jaBody, name: 'Tiểu sử' })
        )
      },
      { gap: 26 }
    )
  const g1 = ar.groups[0]
  f.label(g1.name)
  // ba nghệ nhân đầu: chưa có chân dung → ảnh nón tiêu biểu (theo gợi ý của nhóm)
  people(
    g1.people.map((per, i) => [
      per,
      [
        ['Nón lá trắng truyền thống làng Chuông', 'チュオン村の伝統的な白いノンラー'],
        ['Nón quai thao', 'クアイタオ笠'],
        ['Bộ sưu tập các kiểu nón truyền thống', '伝統的な笠のコレクション'],
      ][i],
    ])
  )
  const g2 = ar.groups[1]
  f.page()
  f.label(g2.name)
  f.prose([g2.intro], { size: 16 })
  people(g2.people.map((per, i) => [per, ar.image[i]]))

  // 3.2 bảo tồn, 3.3 thách thức: mỗi chủ đề = tiêu đề nhỏ + đoạn văn + ảnh
  const topics = (list) => {
    for (const t of list) {
      f.block(t.h)
      f.pending = t.image ?? null
      f.prose(t.p)
      f.pending = null
      if (t.video) {
        const vh = CW * R.cin
        const ch = capH(t.video, CW)
        if (f.room < vh + 6 + ch) f.page()
        f.p.add(VIDEO(f.p.x0, f.y, CW, vh, VIDEO_SRC, { poster: VIDEO_POSTER, name: 'Video trình diễn' }))
        f.p.add(T(f.p.x0, f.y + vh + 6, CW, ch, t.video, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích video' }))
        f.y += vh + 6 + ch + 22
      }
      if (t.image) f.figure(t.image)
    }
  }
  const ps = ch.preservation
  mark(2, ps.title, f.section('3.2', ps.title, { newPage: true }), '3.2')
  f.prose([ps.intro])
  topics(ps.topics)
  const cl = ch.challenges
  mark(2, cl.title, f.section('3.3', cl.title, { newPage: true }), '3.3')
  f.prose([cl.intro])
  topics(cl.topics)
  f.end()

  const p = new Page({ chapter: 3, hideNumber: true, bg: C.cream })
  p.add(RECT(0, 0, 18, H, ACC[3], { name: 'Dải màu' }), DECO('bamboo', 56, 80, 150, 300, 0.4), HL(80, 360, 64, ACC[3], 1.8))
  quote(p, 384, cl.outro, 80, W - 140, { size: 22, align: 'left', color: C.ink })
}

// ═════════════════════════════════════════ PHẦN KẾT
{
  const e = ending
  const f = new Flow(9, ['KẾT LUẬN', 'まとめ'], [...POOL[9]])
  mark(1, e.conclusion.title, f.section(null, e.conclusion.title), '—')
  f.prose(e.conclusion.p)
  f.end()

  f.page({ label: ['LƯU Ý', 'ご注意'] })
  f.y = sectionHead(f.p, TOP, null, e.notice.title)
  f.prose(e.notice.p)
  f.end()

  f.page({ label: ['TÀI LIỆU THAM KHẢO', '参考文献'] })
  mark(1, e.references.title, f.p, '—')
  f.y = sectionHead(f.p, TOP, null, e.references.title)
  e.references.items.forEach((ref, i) => {
    const ro = { size: 14, lh: 1.5, jaSize: 14 }
    const hh = textH(ref, CW - 34, ro)
    f.place(hh, (p, y) => p.add(T(p.x0, y, 30, 18, [`[${i + 1}]`, null], { size: 12, color: ACC[9], weight: 700, lh: 1.5, name: 'Số' }), T(p.x0 + 34, y, p.cw - 34, hh, ref, { ...ro, color: C.ink2, jaFont: F.jaSans, name: 'Tài liệu' })), 10)
  })
  f.place(18, (p, y) => p.add(T(p.x0, y + 6, p.cw, 18, e.references.note, { size: 12.5, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Ghi chú' })))
  // nguồn ảnh lấy từ báo chí / kho ảnh mở (ảnh còn lại do nhóm tự chụp)
  {
    const credits = [
      ['NGUỒN ẢNH', '写真の出典'],
      ['Ảnh không ghi nguồn do nhóm tự chụp tại làng Chuông và các bảo tàng ở Hà Nội.', '出典の記載がない写真は、チュオン村とハノイの博物館で著者が撮影したものです。'],
      ['Báo Tuổi Trẻ (Nhà hát Ba Nón Lá; Tổng thống Hàn Quốc) · Báo Dân trí (thời trang) · Báo Người Lao Động (nón bài thơ) · Báo Quân đội nhân dân (nón lá sen; dao cắt lá) · VietNamNet (Phu nhân Thủ tướng Singapore)', 'トゥオイチェー紙（三つのノンラー劇場・韓国大統領）・ザンチー紙（ファッション）・グオイラオドン紙（詩の笠）・人民軍隊紙（蓮の葉の笠・小刀）・ベトナムネット（シンガポール首相夫人）'],
      ['Wikimedia Commons: nón ngựa và nón Thanh Oai (Daderot, CC0, hiện vật Bảo tàng Phụ nữ Việt Nam) · hàng bán nón Hà Nội 1896 (André Salles, BnF, phạm vi công cộng) · bản đồ nền Hà Nội (Anewplayer, CC BY-SA 4.0)', 'ウィキメディア・コモンズ：馬の笠とタインオアイの笠（Daderot、CC0、ベトナム女性博物館所蔵）・1896年ハノイの笠屋（アンドレ・サル、フランス国立図書館、パブリックドメイン）・ハノイの地図（Anewplayer、CC BY-SA 4.0）'],
      ['Video trình diễn quốc tế: nghệ nhân Lê Văn Tuy cung cấp.', '国際イベントでの実演動画：職人レー・ヴァン・トゥイ提供。'],
    ]
    const co = { size: 11.5, lh: 1.5, jaSize: 11.5, paraGap: 4 }
    const body = join(credits.slice(1))
    const hh = textH(body, CW, co)
    f.place(22 + hh, (p, y) => p.add(T(p.x0, y + 10, p.cw, 16, credits[0], { size: S.label, tracking: 2.4, weight: 700, color: ACC[9], jaFont: F.jaSans, name: 'Nhóm' }), T(p.x0, y + 32, p.cw, hh, body, { ...co, color: C.ink2, jaFont: F.jaSans, name: 'Nguồn ảnh' })))
  }

  // trang kết: giảng viên hướng dẫn, thành viên, email
  const p = new Page({ chapter: 9, bg: C.cream })
  runningHead(p, ['NHÓM THỰC HIỆN', '制作チーム'])
  let y = sectionHead(p, TOP, null, e.team.title)
  const lo = { size: 16, lh: 1.55, jaSize: jaPt(16) }
  const lh = textH(e.team.lead, p.cw, lo)
  p.add(T(p.x0, y, p.cw, lh, e.team.lead, { ...lo, jaFont: F.jaBody, name: 'Đoạn văn' }))
  y += lh + 18
  p.add(T(p.x0, y, p.cw, 16, e.team.membersTitle.map((s) => s.toUpperCase()), { size: S.label, tracking: 2.4, weight: 700, color: ACC[9], jaFont: F.jaSans, name: 'Nhóm' }))
  y += 30
  const mw = (p.cw - 14) / 2
  e.team.members.forEach(([name, code], i) => {
    const mx = p.x0 + (i % 2) * (mw + 14)
    const my = y + Math.floor(i / 2) * 196
    p.add(IMG(mx + (mw - 128) / 2, my, 128, 128, [`Ảnh chân dung — ${name[0]}`, `ポートレート — ${name[1]}`]), T(mx, my + 136, mw, 22, name, { font: F.head, size: 16.5, align: 'center', lh: 1.3, jaFont: F.jaHead, jaSize: 15, name: 'Tên thành viên' }), T(mx, my + 162, mw, 16, [code, null], { size: 12, tracking: 1.4, align: 'center', color: C.muted, name: 'Mã sinh viên' }))
  })
  y += 2 * 196 + 2
  p.add(HL(p.x0, y, p.cw, C.line, 0.5))
  const co = { size: 14, lh: 1.55, jaSize: jaPt(14), paraGap: 4 }
  const ch = textH(e.team.contact, p.cw, co)
  p.add(T(p.x0, y + 16, p.cw, ch, e.team.contact, { ...co, align: 'center', italic: true, color: C.ink2, jaFont: F.jaBody, name: 'Liên hệ' }))
  p.add(T(p.x0, y + 24 + ch, p.cw, 22, ['Email: ' + e.team.email, 'メール：' + e.team.email], { size: 15, weight: 700, align: 'center', color: ACC[9], lh: 1.4, jaFont: F.jaSans, name: 'Email' }))

  // trang lót mặt trong bìa sau (trang phải) rồi bìa sau (trang trái cuối cùng)
  if ((pages.length + 1) % 2 === 0) photoPage(['Ảnh toàn trang: những chiếc nón trên sân phơi lúc hoàng hôn', '全面写真：夕暮れの庭に並ぶノンラー'], 9)
  photoPage(['Ảnh trang lót: chùm nón lá trang trí treo dưới giàn tre', '見返し写真：竹の天井から吊るされたノンラーの飾り'], 9)
  const b = new Page({ chapter: 9, hideNumber: true, bg: '#2b2118' })
  b.add(
    IMG(0, 0, W, H * 0.55, ['Ảnh bìa sau: chiếc nón lá trên nền tre, ánh sáng dịu', '裏表紙写真：竹を背景にしたノンラー'], { name: 'Ảnh bìa sau' }),
    DECO('non-line', W / 2 - 80, H * 0.6, 160, 85, 0.75),
    T(50, H * 0.6 + 110, W - 100, 34, ['Cảm ơn quý độc giả', 'ありがとうございました'], { font: F.script, size: 27, align: 'center', color: '#d9bd84', lh: 1.3, jaFont: F.jaBody, jaSize: 21, name: 'Lời cảm ơn' }),
    T(50, H - 100, W - 100, 38, ['NÓN LÁ LÀNG CHUÔNG\nĐại học FPT Hà Nội · 2026 · nonla09092026@gmail.com', 'チュオン村のノンラー\nFPT大学ハノイ校・2026年・nonla09092026@gmail.com'], { size: 10, tracking: 1.2, align: 'center', color: 'rgba(244,234,212,.65)', lh: 1.7, jaFont: F.jaSans, name: 'Thông tin' })
  )
}

// ═════════════════════════════════════════ DẢI TÊN CÔNG ĐOẠN (điền sau khi biết trang)
{
  const p = stripPage
  const acc = ACC[2]
  let y = TOP + 4
  const to = { size: 30, font: F.head, lh: 1.2, jaSize: 27 }
  p.add(T(p.x0, y, p.cw, 40, ch2.process.stepsH.h, { ...to, color: C.title, jaFont: F.jaHead, name: 'Tiêu đề' }))
  y += 46
  p.add(T(p.x0, y, p.cw, 18, ch2.process.stripTitle.map((s) => strip(s).toUpperCase()), { size: S.label, tracking: 2.4, weight: 700, color: acc, jaFont: F.jaSans, name: 'Nhóm' }))
  y += 30
  const rowH = (BOT - y - 12) / stepPages.length
  const lineX = p.x0 + 26
  p.add(VL(lineX, y + 20, rowH * (stepPages.length - 1), acc, 1.2))
  stepPages.forEach((s, i) => {
    const ry = y + i * rowH
    const nm = s.finish ? [`${s.label[0]} · ${s.name[0]}`, `${strip(s.label[1])}・${strip(s.name[1])}`] : s.name
    const go = `#p${s.page}` // bấm tên công đoạn → lật tới trang của công đoạn đó
    p.add(
      ELL(lineX - 20, ry, 40, 40, s.finish ? C.cream : acc, { stroke: acc, sw: 1.4 }),
      T(lineX - 20, ry + 9, 40, 22, [s.finish ? '✦' : String(s.no), null], { font: F.head, size: 18, weight: 700, align: 'center', color: s.finish ? acc : '#fff', lh: 1.2, link: go, name: 'Số bước' }),
      T(lineX + 36, ry + 1, p.cw - 130, 26, nm, { font: F.head, size: 20, weight: 700, color: C.ink, lh: 1.25, jaFont: F.jaHead, jaSize: 19, link: go, name: 'Tên bước' }),
      T(lineX + 36, ry + 27, p.cw - 130, 18, s.sub, { size: 13, italic: true, color: C.muted, lh: 1.3, jaFont: F.jaSans, link: go, name: 'Phụ đề' }),
      T(p.x1 - 70, ry + 6, 70, 20, [`tr. ${s.page}`, `${s.page}ページ`], { font: F.head, size: 14, color: acc, align: 'right', lh: 1.3, jaFont: F.jaSans, link: go, name: 'Số trang' })
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
    const title = a.title.map((s) => (s ? strip(s).replace(/\n/g, ' ') : s))
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
    const go = `#p${a.page}` // bấm dòng mục lục → lật tới trang đó
    if (a.level === 1) {
      y += 12
      p.add(T(p.x0, y - 3, 44, 26, [a.label, null], { font: F.head, size: 21, color: acc, lh: 1.1, link: go, name: 'Số chương' }), T(p.x0 + indent, y, p.cw - indent - 56, th, title, { ...o, color: C.ink, jaFont: F.jaHead, link: go, name: 'Mục lục' }), T(p.x1 - 44, y + 1, 44, 20, [pg, null], { font: F.head, size: 15, color: acc, align: 'right', lh: 1.3, link: go, name: 'Số trang' }))
      y += th + 8
    } else {
      p.add(T(p.x0 + indent - 40, y, 38, 18, [a.label, null], { size: a.level === 2 ? 13.5 : 12.5, color: acc, weight: 700, lh: 1.4, link: go, name: 'Số mục' }), T(p.x0 + indent, y, p.cw - indent - 56, th, title, { ...o, color: a.level === 2 ? C.ink2 : C.muted, jaFont: F.jaSans, link: go, name: 'Mục lục' }), T(p.x1 - 44, y, 44, 18, [pg, null], { size: 13, color: C.muted, align: 'right', lh: 1.4, link: go, name: 'Số trang' }))
      y += th + 7
    }
    if (y > BOT) console.warn(`⚠ Mục lục tràn: ${Math.round(y)} > ${Math.round(BOT)}`)
  }
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
const out = pages.map((p) => ({ bg: p.bg, bgImage: null, template: null, hideNumber: p.hideNumber, elements: p.els }))
fs.mkdirSync(path.join(here, 'out'), { recursive: true })
fs.writeFileSync(path.join(here, 'out', 'book.json'), JSON.stringify({ pages: out }, null, 1))
const counts = out.map((p, i) => `${i + 1}:${p.elements.length}`).join(' ')
console.log(`${out.length} trang · ${out.reduce((n, p) => n + p.elements.length, 0)} phần tử\n${counts}`)
console.log('Mục lục:', anchors.map((a) => `${a.label} ${strip(a.title[0]).replace(/\n/g, ' ')} → ${a.page}`).join(' | '))
