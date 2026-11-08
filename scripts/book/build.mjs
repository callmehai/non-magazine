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
import { refGroups } from './content/refs.mjs'
import { photos as PHOTO_PATHS } from './photos.mjs'

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
// góp ý 04/11: chữ thân bài to và dày → nhỏ lại, giãn dòng thoáng hơn (cỡ tiêu đề giữ nguyên)
const BODY = { size: 14.5, lh: 1.62, jaSize: jaPt(14.5, 1.12) }
const S = { run: 10, cap: 12.5, note: 12, label: 12.5, block: 21, sec: 30, secNum: 50, quote: 19, card: 18, cardText: 14.5, cardTextJa: jaPt(14.5) }
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
let FIG = 0 // số thứ tự ảnh (chú thích "Ảnh N: …"), gắn lúc tạo chú thích; lúc xuất đánh lại theo thứ tự trang
// Zalo 04/11 (trưởng nhóm): thuật ngữ "Ảnh" trong số thứ tự ảnh bản tiếng Nhật là 画像
const numCap = (fc, n) => [`Ảnh ${n}: ${fc[0]}`, fc[1] ? `画像${n}：${fc[1]}` : fc[1]]
const CAP_NAMES = new Set(['Chú thích ảnh', 'Chú thích video'])
function T(x, y, w, h, pair, o = {}) {
  // chú thích video không mang số "Ảnh N" (soát vòng 8: "画像110：動画：…" — gọi video là ảnh); vẫn ghi nguồn như chú thích ảnh
  if (o.name === 'Chú thích video' && !o.raw) pair = fmtCap(Array.isArray(pair) ? pair : [pair, null])
  else if (CAP_NAMES.has(o.name) && !o.raw) pair = numCap(fmtCap(Array.isArray(pair) ? pair : [pair, null]), ++FIG)
  const [vi0, ja0] = Array.isArray(pair) ? pair : [pair, null]
  const small = (o.size ?? BODY.size) < RUBY_MIN
  const vi = small ? strip(vi0) : vi0
  // tiếng Nhật: không ngắt dòng giữa "年" và "前 / 生" (kiểu 2500〜3000年 / 前)
  // soát 05/11: chú thích ngắt "著者撮 / 影" → không ngắt giữa "撮影" (nối bằng ký tự nối từ U+2060)
  const ja = (ja0 && small ? strip(ja0) : ja0)?.replace(/年(?=[前生])/g, '年\u2060').replace(/撮影/g, '撮\u2060影')
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
  if (o.linkStyle) el.linkStyle = o.linkStyle
  if (o.alt) el.alt = o.alt
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
  // ảnh mới vòng 04/11: giữ trọn đầu / nón của người trong ảnh
  'Bốn sinh viên ngành Ngôn ngữ Nhật Bản, Trường Đại học FPT Hà Nội': '50% 12%',
  'Nghệ nhân Lê Văn Tuy trong xưởng nón — ảnh: nghệ nhân Lê Văn Tuy': '50% 25%',
  'Nghệ nhân làng Chuông làm nón truyền thống': '45% 40%',
  // soát trọng tâm ảnh 08/11 (anh Hải: "check lại các hình ảnh xem đúng trọng tâm vật chưa"): khung cắt giữa làm mất vật
  // chính của chú thích → dời khung về phía vật
  'Nón lá trên sàn diễn thời trang — nguồn: Báo Sóng Trẻ': '50% 0%', // nón trên đầu hai người mẫu
  'Tổng thống Hàn Quốc đội nón lá — nguồn: Báo Thanh Niên': '85% 50%', // ông ngồi bên phải, tay nâng vành nón
  'Khuôn nón bày bán ở chợ Chuông': '15% 85%', // khuôn xếp góc trái dưới (khung cũ theo mặt người bán)
  'Quét lớp dầu bóng lên mặt nón': '12% 50%', // cọ + thùng dầu bên trái chiếc nón
  'Nghệ nhân khâu nón, đặt nghiêng khung giữa hai đầu gối': '50% 88%', // khung nón giữa hai đầu gối (khung cũ chỉ có mặt)
  'Năm 2023, nghệ nhân Lê Văn Tuy (hàng thứ ba, thứ hai từ trái) chụp ảnh lưu niệm cùng Chủ tịch nước Võ Văn Thưởng': '0% 50%', // giữ mép trái (chú thích chỉ người thứ hai từ trái)
  'Trung tâm thiết kế sáng tạo, giới thiệu, quảng bá và bán sản phẩm OCOP làng nghề nón Chuông — cơ sở của nghệ nhân Lê Văn Tuy': '50% 92%', // biển + gian hàng ở dưới, trên là trời
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
// vật chính trong từng ảnh (subjects.json — Vision, scripts/book/subjects.mjs): a = rộng/cao ảnh gốc, fg = khung chủ thể
// (nhấc chủ thể), sal = khung vùng nổi bật. Ảnh cảnh đông (chủ thể phủ quá nửa ảnh) lấy vùng nổi bật.
// góp ý: "các loại hình ảnh không nên bị cắt ghép, muốn ảnh toàn cảnh nón" → khung cắt theo vật chính, không cắt giữa máy móc
const COVER_LAY = JSON.parse(fs.readFileSync(path.join(here, 'cover-layers.json'), 'utf8')) // cover.py ghi: [x, y, w, h] (điểm)
const SUBJ = JSON.parse(fs.readFileSync(path.join(here, 'subjects.json'), 'utf8'))
// ảnh có mặt người (faces.json): khung vật chính gộp luôn các khuôn mặt (giữ cả người lẫn chiếc nón)
function subjOf(src, hint) {
  const s = SUBJ[path.basename(String(src ?? ''))]
  if (!s) return null
  let box = (s.fg && (s.fgA ?? 1) <= 0.55 ? s.fg : (s.sal ?? s.fg)) ?? [0, 0, 1, 1]
  const fc = FACES[hint]
  if (fc && !NO_FACE.has(hint)) box = [Math.min(box[0], fc.f[0]), Math.min(box[1], fc.f[1]), Math.max(box[2], fc.f[2]), Math.max(box[3], fc.f[3])]
  return { a: s.a, box }
}
const subjOfCap = (cap) => subjOf(PHOTOS[cap?.[0]], cap?.[0])
/** khung w×h cắt ảnh (cover) → { pos, cut }: tâm khung giữ trọn vật chính nếu được; cut = phần vật chính bị cắt mất (0..1) */
function subjFrame(sj, w, h) {
  const r = h / w
  const k = Math.max(1 / sj.a, r)
  const vw = 1 / (sj.a * k)
  const vh = r / k
  let cut = 0
  const axis = (a0, a1, v) => {
    if (v >= 0.999) return 50
    const start = (a0 >= 0.5 - v / 2 && a1 <= 0.5 + v / 2) ? (1 - v) / 2 : Math.min(1 - v, Math.max(0, (a0 + a1) / 2 - v / 2))
    cut = Math.max(cut, (Math.max(0, start - a0) + Math.max(0, a1 - start - v)) / Math.max(0.01, a1 - a0))
    return Math.round((start / (1 - v)) * 100)
  }
  const [x0, y0, x1, y1] = sj.box
  const px = axis(x0, x1, vw)
  const py = axis(y0, y1, vh)
  return { pos: px === 50 && py === 50 ? null : `${px}% ${py}%`, cut }
}
/** tỉ lệ cao/rộng của ảnh gốc (null nếu chưa đo) */
const natR = (cap) => {
  const sj = subjOfCap(cap)
  return sj ? 1 / sj.a : null
}
/** khung tỉ lệ r không cao hơn ảnh gốc quá 12% (khung cao hơn ảnh → cắt hai bên, mất chiếc nón) */
const notTaller = (cap) => (r) => !natR(cap) || r <= natR(cap) * 1.12 || cutOf(cap, CW, CW * r) <= 0.06
/** ảnh lệch thay cho ảnh rộng cả khối khung w×h: bề ngang khung theo tỉ lệ ảnh (khối cao bh) → bề ngang, hoặc null nếu không đỡ cắt hơn */
function sideW(cap, w, h, bh) {
  const sj = subjOfCap(cap)
  if (!sj || 1 / sj.a <= (h / w) * 1.12) return null
  const full = subjFrame(sj, w, h).cut
  if (full <= 0.06) return null
  const iw = Math.min(CW * 0.74, Math.max(CW * 0.42, bh * sj.a))
  return subjFrame(sj, iw, bh).cut + 0.05 < full ? iw : null
}
/** các ảnh cạnh nhau cùng bề ngang w: tỉ lệ khung (trong rs, đã lọc vừa chỗ) để ảnh bị cắt nhiều nhất cũng mất ít nhất; ngang ngửa thì khung lớn hơn */
const bestR = (caps, w, rs) => (rs.length ? rs.map((r) => [r, Math.max(...caps.map((c) => cutOf(c, w, w * r))) - r * 0.05]).sort((a, b) => a[1] - b[1])[0][0] : null)
const cutOf = (cap, w, h) => {
  const sj = subjOfCap(cap)
  return sj ? subjFrame(sj, w, h).cut : 0
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
  ...(o.crop ? { crop: o.crop } : {}),
  hint: hint?.[0] ?? '',
  hintJa: hint?.[1] ?? '',
  name: o.name ?? 'Ảnh',
  ...(o.opacity != null ? { opacity: o.opacity } : {}),
})
const VIDEO = (x, y, w, h, src, o = {}) => ({ id: id(), type: 'video', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, src, ...(o.poster ? { poster: o.poster } : {}), name: o.name ?? 'Video' })
const DECO = (name, x, y, w, h, opacity = 0.55) => ({ id: id(), type: 'image', x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, src: `assets/book/deco/${name}.svg`, fit: 'contain', opacity, name: 'Họa tiết' })
// ── họa tiết lấp trang (anh Hải 08/11: "spam lắm hoạ tiết trùng nhau quá, sáng tạo cho t 7-10 mẫu hoạ tiết dùng đan xen"):
// 9 mẫu mới (scripts/book/motifs.py) + 5 mẫu cũ, chọn xoay vòng theo chỗ đặt; không lặp một mẫu trong vòng hai trang mỗi
// bên (cặp trang và cặp liền kề), mỗi trang tối đa một hình lấp (fillDeco). [cao / rộng, chỗ dùng: c giữa trang · k góc /
// chân trang · s cột trống cạnh ảnh dọc · h biểu tượng góc tiêu đề mục · t cột hẹp dưới số thứ tự trang loại nón]
const MOTIFS = {
  'm-chong-non': [150 / 240, 'ch'],
  'm-canh-tre': [160 / 220, 'kcs'],
  'm-mai-dinh': [130 / 260, 'ch'],
  'sen-goc': [240 / 280, 'kcs'],
  'm-bo-la': [160 / 200, 'csh'],
  'm-la-tre': [120 / 200, 'k'],
  'm-kim-chi': [142 / 200, 'ch'],
  'hoa-dai': [320 / 220, 'st'],
  'm-chuon-chuon': [166 / 200, 'kst'],
  'm-non-ngua': [116 / 210, 'ch'],
  'co-hoa': [92 / 280, 'k'],
  'm-vong-nua': [132 / 210, 'csh'],
  'tre-mang': [1, 'sht'],
  'sen-canh': [420 / 260, 't'],
  'still-non': [310 / 640, 'c'],
}
const motifUsed = new Map() // số trang → các mẫu đã đặt
const motifCur = { c: 0, k: 0, s: 0, h: 0, t: 0 }
/** chọn mẫu cho chỗ `slot` của trang p trong khung tối đa maxW × maxH: mẫu kế tiếp trong vòng, chưa dùng ở 2 trang mỗi bên,
 *  vừa khung với kích thước đủ nhìn (cao ≥ minH). Trả { name, w, h } hoặc null */
function pickMotif(p, slot, maxW, maxH, minH = 50) {
  const list = Object.entries(MOTIFS).filter(([, [, sl]]) => sl.includes(slot))
  const near = new Set()
  for (let d = -2; d <= 2; d++) for (const m of motifUsed.get(p.n + d) ?? []) near.add(m)
  for (let k = 0; k < list.length; k++) {
    const [name, [ar]] = list[(motifCur[slot] + k) % list.length]
    if (near.has(name)) continue
    const h = Math.min(maxH, maxW * ar)
    if (h < minH) continue
    motifCur[slot] = (motifCur[slot] + k + 1) % list.length
    if (!motifUsed.has(p.n)) motifUsed.set(p.n, new Set())
    motifUsed.get(p.n).add(name)
    return { name, w: h / ar, h }
  }
  return null
}
const hasFill = (p) => p.els.some((e) => e.fillDeco)
const shape = (kind) => (x, y, w, h, fill, o = {}) => ({ id: id(), type: 'shape', shape: kind, x: r1(x), y: r1(y), w: r1(w), h: r1(h), rot: 0, fill, ...(o.stroke ? { stroke: o.stroke, strokeWidth: o.sw ?? 0.8 } : {}), ...(o.radius ? { radius: o.radius } : {}), ...(o.dash ? { dash: o.dash } : {}), ...(o.opacity != null ? { opacity: o.opacity } : {}), ...(o.link ? { link: o.link } : {}), ...(o.alt ? { alt: o.alt } : {}), name: o.name ?? 'Hình' })
const RECT = shape('rect')
/** con dấu son "Làng Chuông": vuông nhỏ, viền trong mảnh, chữ in hoa — kiểu dấu trên họa đồ Henri Oger */
/** sách pop-up: phần tử dựng đứng lên từ mặt giấy (gập theo mép dưới) khi trang được lật tới (anh Hải 05/11: "phá vỡ không gian 2D") */
const STAND = (el, delay = 0.2, dur = 1.1) => ({ ...el, anim: { kind: 'stand', delay, dur } })
/** bóng nắng xuyên lũy tre (dapple.py): phủ multiply lên giấy, lay chậm như có gió; mirror = cành chĩa từ góc trái */
const SUN_R = 1100 / 558
const SUN = (x, y, w, mirror = false, opacity = 0.75) => ({ id: id(), type: 'image', x: r1(x), y: r1(y), w: r1(w), h: r1(w / SUN_R), rot: 0, src: 'assets/book/fx/bong-tre.webp', fit: 'fill', opacity, name: 'Bóng nắng', ...(mirror ? { mirror: true } : null) })
const SEAL = (x, y, s = 60) => [
  RECT(x, y, s, s, '#a8382b', { radius: 3, name: 'Con dấu' }),
  RECT(x + 3.5, y + 3.5, s - 7, s - 7, 'none', { stroke: '#f6e9d6', sw: 0.8, radius: 2, name: 'Viền dấu' }),
  // góp ý 04/11: đối tượng chính là NÓN LÁ Làng Chuông → chữ dấu "Nón lá Làng Chuông"
  T(x + 2, y + s / 2 - 17, s - 4, 34, ['NÓN LÁ\nLÀNG\nCHUÔNG', 'チュオン村\nの\nノンラー'], { font: F.head, size: 8, weight: 700, tracking: 0.4, lh: 1.3, align: 'center', color: '#f6e9d6', jaFont: F.jaHead, jaSize: 8, name: 'Chữ dấu' }),
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
const pageCap = (s) => (s ? strip(s).replace(/^(Ảnh toàn trang|Ảnh trang lót|Ảnh mở chương|Ảnh bìa):\s*/, '').replace(/^(全面写真|見返し写真|章扉写真|表紙写真)：/, '').replace(/^./, (c) => c.toUpperCase()) : s)
function photoPage(hint, chapter = 0, label) {
  const p = new Page({ chapter })
  runningHead(p, label ?? CH_LABEL[chapter] ?? ['NÓN LÁ LÀNG CHUÔNG', 'チュオン村のノンラー'])
  const cap = fmtCap(hint)
  cap[0] = pageCap(cap[0])
  cap[1] = pageCap(cap[1])
  // soát 04/11: ảnh khung dọc 62% bề ngang + nón vẽ nhỏ phía dưới → nửa dưới trang trống, lệch cân với trang bên cạnh.
  // Ảnh dọc đẹp phủ trọn khổ chữ (rộng hết khổ, cao tới sát chú thích ở đáy trang)
  const iw = CW
  const ch = capH(cap, iw)
  // ảnh chụp ngang: khung theo tỉ lệ ảnh, không cắt hai bên thành khung dọc
  // soát 06/11 (R9): ảnh ngang nằm giữa trang để trống trên dưới → khung cao dần (tới 3:4) chừng nào vật chính vẫn còn trọn (mất ≤ 4%)
  const room = BOT - (TOP + 10) - 8 - ch
  let rr = Math.min(R.por, room / iw)
  const r0 = Math.min(rr, (natR(hint) ?? R.por) * 1.04)
  while (rr > r0 && cutOf(hint, iw, iw * rr) > 0.04) rr -= 0.02
  const ih = r1(Math.min(iw * Math.max(r0, rr), room))
  const y = TOP + 10 + (BOT - (TOP + 10) - (ih + 8 + ch)) / 2
  p.add(IMG(p.x0, y, iw, ih, hint, { name: 'Ảnh trang' }))
  p.add(T(p.x0, y + ih + 8, iw, ch, cap, { ...capOpt, italic: true, align: 'center', color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
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
// ảnh chợ chuyển từ phần kết lên mục 1.3 (lấp chỗ trống của mục trước các ảnh kho khác)
const KET_UP = [
  ['Mua bán lá và vành nón trong phiên chợ Chuông', 'チュオンの市場で葉やノンラーの輪を売り買いする人々'],
  ['Người bán xếp nón bên cánh cửa gỗ cũ', '古い木の扉のそばでノンラーを並べる売り手'],
  ['Người bán xếp nón trên phố làng Chuông', 'チュオン村の通りでノンラーを並べる売り手'],
  ['Bó mo nang được buộc lại trước khi mang ra chợ', '市場へ運ぶ前に束ねられるモーナン'],
]
const CH_LABEL = { 0: ['LỜI MỞ ĐẦU', 'はじめに'], 1: ch1.label, 2: ch2.label, 3: ch3.label, 9: ['KẾT LUẬN', '終わりに'] }
// ảnh dọc đẹp dành cho trang ảnh tràn trang: mỗi ảnh chỉ dùng một lần trong cả sách (không lặp ảnh)
const HERO = [
  ['Ảnh toàn trang: những chiếc khung nón xếp chồng ở chợ Chuông', '全面写真：チュオンの市場に積み重ねられたノンラーの骨組み'],
  ['Ảnh toàn trang: người bán bên những chồng nón trong phiên chợ Chuông', '全面写真：積まれたノンラーに囲まれて座るチュオンの市場の売り手たち'],
  ['Ảnh toàn trang: phiên chợ lá lụi lúc tờ mờ sáng', '全面写真：夜明け前のチュオンの市場に並ぶラルイ'],
]
/**
 * trang đệm khép cặp trang: ảnh dọc đẹp tràn trang (HERO) → hết thì trang ảnh có khung (2 ảnh kho, có chú thích)
 * → hết nữa thì trang tranh nét mảnh. Không phóng ảnh kho (có thể nhỏ / ngang / tài liệu) ra tràn trang.
 */
function padPage(pool, chapter, label) {
  const hero = HERO.shift()
  if (hero) return photoPage(hero, chapter, label)
  const p = new Page({ chapter })
  runningHead(p, label ?? CH_LABEL[chapter] ?? ['NÓN LÁ LÀNG CHUÔNG', 'チュオン村のノンラー'])
  let y = TOP + 4
  // giấy tờ / bằng chụp dọc (ảnh 3:4): một ảnh dọc phủ cả trang, đọc được chữ — không xếp hai ảnh ngang nhỏ
  if (pool[0] && fitOf(pool[0]) === 'contain') {
    const ih = Math.min(CW * R.por, BOT - y - capH(pool[0], CW) - 8)
    figure(p, p.x0, y, CW, ih, pool.shift())
    return p
  }
  for (const r0 of [R.wide, R.cin]) {
    const cap = pool[0]
    if (!cap) break
    // ảnh chụp dọc: một ảnh lớn đúng tỉ lệ ảnh, cao hết phần trang còn lại, canh giữa (khung ngang sẽ cắt mất chiếc nón,
    // khung lệch nhỏ thì để trống nửa trang)
    const nat = natR(cap) ?? 0
    if (nat > r0 * 1.12) {
      const hh = BOT - y - capH(cap, CW * 0.8) - 8
      const w = Math.min(CW, hh / nat)
      if (w >= CW * 0.5) {
        pool.shift()
        y = figure(p, p.x0 + (CW - w) / 2, y, w, w * nat, cap) + 22
        break
      }
    }
    // khung không vượt đáy trang (chú thích dài hai dòng khi có số ảnh + nguồn)
    const r = Math.min(r0, (BOT - y - capH(cap, CW) - 8) / CW)
    if (r < R.pan) break
    pool.shift()
    y = figure(p, p.x0, y, CW, CW * r, cap) + 22
  }
  // soát 07/11: ảnh ngang đầu trang chừa lại 1/3 trang (không đủ cho ảnh ngang thứ hai) → hai ảnh nhỏ cạnh nhau
  if (y >= TOP + 100 && pool.length >= 2 && BOT - y >= 180) {
    const w = (CW - 14) / 2
    const two = pool.slice(0, 2)
    const ch2 = Math.max(...two.map((c) => capH(c, w)))
    const r2 = bestR(two, w, [R.por, R.sq, R.std, R.wide].filter((x) => BOT - y >= w * x + 6 + ch2))
    if (r2) {
      two.forEach((c, i) => figure(p, p.x0 + i * (w + 14), y, w, w * r2, c, { fit: fitOf(c) }))
      pool.splice(0, 2)
      y += w * r2 + 6 + ch2 + 22
    }
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
/** đầu trang một dòng: tên mục dài quá một dòng thì dùng tên gọn (soát 04/11: đầu trang 3.2 xuống hai dòng, đè đường kẻ) */
const RUN_SHORT = {
  '3.2': ['3.2 · Bảo tồn và phát triển nghề nón Làng Chuông', '3.2　チュオン村のノンラーの保存と発展'],
  '3.3': ['3.3 · Những thách thức đối với nghề nón Làng Chuông', '3.3　チュオン村のノンラーが抱える課題'],
}
const runShort = (num, label) => {
  const one = (k) => textH1([strip(label[0]).toUpperCase(), strip(label[1])], CW, { size: S.run, tracking: 1.6, lh: 1.2 }, k) <= S.run * 1.2 * 1.5
  return one(0) && one(1) ? label : RUN_SHORT[num] ?? label
}
function runningHead(p, label) {
  const acc = ACC[p.chapter] ?? C.gold
  const text = p.side === 'left' ? (CH_LABEL[p.chapter] && p.chapter >= 1 && p.chapter <= 3 ? [`NÓN LÁ LÀNG CHUÔNG · ${strip(CH_LABEL[p.chapter][0]).toUpperCase()}`, `チュオン村のノンラー・${strip(CH_LABEL[p.chapter][1])}`] : ['NÓN LÁ LÀNG CHUÔNG', 'チュオン村のノンラー']) : [strip(label[0]).toUpperCase(), strip(label[1])]
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
  // góp ý 04/11 (Bản sửa lần 1): tiêu đề mục 1.1, 1.2… đang rối (dòng "Chương 1" viết tay + tên + số mờ rất to) →
  // một ô số mục màu chương + tên mục rõ ràng trên dải màu mỏng; mục không đánh số giữ hình vẽ nhỏ ở góc
  if (num) {
    const bw = 66
    const tw = p.cw - bw - 18
    const o = { size: 27, font: F.head, lh: 1.2, jaSize: 25 }
    const th = textH(title, tw, o)
    const bh = Math.max(52, th + 18)
    p.add(
      RECT(x, y, p.cw, bh, TINT[p.chapter] ?? TINT[0], { radius: 4, opacity: 0.55, name: 'Dải tiêu đề' }),
      RECT(x, y, bw, bh, acc, { radius: 4, name: 'Ô số mục' }),
      T(x, y + bh / 2 - 17, bw, 34, [num, null], { font: F.head, size: 26, weight: 700, color: '#fff', align: 'center', lh: 1.25, name: 'Số mục' }),
      T(x + bw + 16, y + (bh - th) / 2, tw, th, title, { ...o, color: C.title, jaFont: F.jaHead, name: 'Tên mục' })
    )
    return y + bh + 30
  }
  const side = 96
  const tw = p.cw - side
  const o = { size: S.sec, font: F.head, lh: 1.2, jaSize: 27 }
  const th = textH(title, tw, o)
  const kick = kicker ?? SEC_KICKER[p.chapter] ?? CH_LABEL[p.chapter]
  // 08/11: biểu tượng góc tiêu đề xoay vòng trong bộ họa tiết (trước: mỗi chương một hình, chương 3 toàn tre măng)
  {
    const m = pickMotif(p, 'h', 96, 80, 36)
    if (m) p.add({ ...DECO(m.name, p.x1 - m.w, y - 6 + (80 - m.h) / 2, m.w, m.h, 0.9), name: 'Hình vẽ' })
  }
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
/**
 * chú thích ảnh theo một mẫu (góp ý 04/11, Bản sửa lần 1): "Nội dung (Nguồn: tên nguồn)"; ảnh nhóm tự chụp ghi
 * "(Nguồn: nhóm tác giả)". Nguồn lấy theo chú thích đã ghi sẵn ("— nguồn: …", "— ảnh: …") hoặc theo thư mục ảnh.
 * Số thứ tự "Ảnh N:" gắn lúc xuất (theo thứ tự trang).
 */
const SRC_BY_PATH = [
  [/^online\/(ba-non-la|tong-thong-han-quoc)/, ['Báo Tuổi Trẻ', 'Báo Tuổi Trẻ']],
  // 08/11: nguồn theo bản Nhật của nhóm cho các ảnh nhóm gắn (tên báo để nguyên tiếng Việt như nhóm ghi)
  [/^Chương 1\/BTHN\/IMG_20261002_150751$/, ['Bảo tàng Hà Nội', 'ハノイ博物館']],
  [/^doc-0811\/danviet-/, ['Báo Dân Việt', 'Báo Dân Việt']],
  [/^doc-0811\/thanhnien-/, ['Báo Thanh Niên', 'Báo Thanh Niên']],
  [/^doc-0811\/vnexpress-/, ['VnExpress', 'VNEXPRESS']],
  [/^doc-0811\/huong-/, ['nghệ nhân Tạ Thu Hương', '職人タ・トゥ・フオン氏']],
  [/^doc-0811\/langnghe-/, ['Tạp chí điện tử Làng nghề Việt', 'Tạp chí điện tử Làng nghề Việt']],
  [/^online\/thoi-trang/, ['Báo Dân trí', 'Báo Dân trí']],
  [/^online\/non-bai-tho/, ['Báo Người Lao Động', 'Báo Người Lao Động']],
  [/^online\/(non-la-bang|non-ngua)/, ['Báo Lao Động', 'Báo Lao Động']],
  // 06/11: nguồn theo cách nhóm ghi trong bản Nhật (tên báo để nguyên tiếng Việt)
  [/^online\/dong-phong-/, ['Đông Phong', 'Đông Phong']],
  [/^online\/dtpt-/, ['Báo Dân tộc và Phát triển', 'Báo Dân tộc và phát triển']],
  [/^online\/thanhnien-/, ['Báo Thanh Niên', 'Báo Thanh niên']],
  [/^online\/(non-la-sen|non-la-chuong|dao-cat-la|non-thung|qdnd-)/, ['Báo Quân đội nhân dân', 'Báo Quân đội Nhân dân']],
  [/^online\/phu-nhan/, ['VietNamNet', 'VietnamNet']],
  [/^online\/pham-tran-canh/, ['Báo Thể thao & Văn hóa', 'テータオ＆ヴァンホア紙']],
  [/^online\/non-hoi-cho/, ['Báo Đại biểu Nhân dân', 'ダイビエウニャンザン紙']],
  [/^online\/(non-thanh-oai|thap-dong)/, ['Daderot, Wikimedia Commons (CC0)', 'Daderot、ウィキメディア・コモンズ（CC0）']],
  [/^online\/trong-dong/, ['Wikimedia Commons', 'ウィキメディア・コモンズ']],
  [/^online\/hang-non-1896/, ['André Salles, Thư viện Quốc gia Pháp', 'アンドレ・サル、フランス国立図書館']],
  [/^online\/bia-cho-non/, ['Hà Trang / Báo Văn Hóa', 'ハー・チャン／ヴァンホア紙']],
  [/^(Drive\/)?(Trọng Khải\/|Chương 3\/Không gian chợ nón\/)/, ['nhiếp ảnh Trọng Khải', '写真家チョン・カイ']],
  [/Nón Lê Văn Tuy\/|^new\/IMG_854[78]/, ['nghệ nhân Lê Văn Tuy', '職人レ・ヴァン・トゥイ氏']],
  // Doc (Thu Nguyệt, mở đầu chương 2): "Ảnh 2: Nghệ Nhân Tạ Thu Hương cung cấp"
  [/Nón Tạ Thu Hương\/|^new\/IMG_861|^new\/Người thợ hoàn thiện bước luồn nhôi cuối cùng$/, ['nghệ nhân Tạ Thu Hương', '職人タ・トゥ・フオン氏']],
]
const SRC_IN_CAP = /\s*(?:[—―·]\s*(?:nguồn|ảnh|Nguồn|Ảnh)\s*:\s*(.+)|\((?:ảnh|nguồn|Ảnh|Nguồn)\s*:\s*([^()]+)\))\s*$/
const SRC_IN_CAP_JA = /\s*(?:[—―・]\s*(?:出典|写真|提供)\s*[：:]\s*(.+)|[（(](?:出典|写真|提供)\s*[：:]\s*([^（）()]+)[）)])\s*$/
function fmtCap(cap, key) {
  if (!cap || cap.fmt) return cap
  const vi0 = strip(cap[0] ?? '')
  const ja0 = strip(cap[1] ?? '')
  const rel = PHOTO_PATHS[key ?? cap[0]]
  // ảnh chưa có (khung trống) / nội dung là chú thích không phải ảnh → giữ nguyên
  if (!vi0 || (!rel && !SRC_IN_CAP.test(vi0))) return cap
  let vi = vi0
  let ja = ja0
  let src = null
  const m = vi0.match(SRC_IN_CAP)
  if (m) {
    vi = vi0.slice(0, m.index).trim()
    src = [(m[1] ?? m[2]).trim(), null]
    const mj = ja0.match(SRC_IN_CAP_JA)
    if (mj) {
      ja = ja0.slice(0, mj.index).trim()
      src[1] = (mj[1] ?? mj[2]).trim()
    }
  }
  if (!src) src = SRC_BY_PATH.find(([re]) => re.test(rel ?? ''))?.[1] ?? (/^online\//.test(rel ?? '') ? null : ['nhóm tác giả', 'グループ撮影'])
  // 08/11 (tab Bổ sung + Zalo chị Linh): mẫu "STT: chú thích (nguồn)", bỏ chữ "Nguồn" / "出典" — vd. nhóm ghi
  // 「画像１：ファッションアイテムとして使われる装飾用ノンラー（職人タ・トゥ・フオン氏提供）」: ảnh nghệ nhân đưa → "… cung cấp" / "…提供"
  // nguồn có ngoặc bên trong ("André Salles (Thư viện Quốc gia Pháp)", "Chạm Sắc (VTV5)") → dấu phẩy, không lồng hai lớp ngoặc
  const flat = (t) => (t == null ? t : String(t).replace(/\s*\(([^()]+)\)/g, ', $1').replace(/（([^（）]+)）/g, '、$1'))
  const sv0 = flat(src?.[0])
  const sv = /^nghệ nhân /i.test(sv0 ?? '') && !/cung cấp$/.test(sv0) ? `${sv0} cung cấp` : sv0
  const sj0 = src ? flat(src[1] ?? src[0]) : null
  const sj = /^職人.+氏$/.test(sj0 ?? '') ? `${sj0}提供` : sj0
  const out = src ? [`${vi} (${sv})`, ja ? `${ja}（${sj}）` : ja] : [vi, ja]
  out.fmt = true
  return out
}

/** ảnh + chú thích → y tiếp theo */
const capOpt = { size: S.cap, lh: 1.4 }
const capH = (cap, w) => textH(numCap(fmtCap(cap), FIG + 1), w, capOpt)
function figure(p, x, y, w, h, cap, o = {}) {
  // ảnh chụp dọc trong khung ngang rộng cả khối (cắt mất vật chính) → khung theo tỉ lệ ảnh, chú thích ở cột bên cạnh
  if (!o.noCaption && !o.crop && !o.capBelow && w >= CW - 1 && (o.fit ?? 'cover') === 'cover') {
    const bh = h + 6 + capH(cap, w)
    const iw = sideW(cap, w, h, bh)
    const yy = iw && sideFigure(p, y, bh, cap, iw)
    if (yy) return yy
  }
  p.add(IMG(x, y, w, h, cap, o))
  if (o.noCaption) return y + h + 8
  const fc = fmtCap(cap)
  const ch = capH(cap, w)
  p.add(T(x, y + h + 6, w, ch, fc, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
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
// góp ý 04/11: bỏ khung polaroid nghiêng + băng dính giả (khung trắng dày, bóng nặng) → mọi ảnh dùng khung mảnh thống nhất
const polaOn = () => false
// góp ý 04/11 (B8): "tạo điểm nhấn bằng ảnh lớn, bố cục bất đối xứng; tránh sắp xếp ảnh đồng đều" → cứ hai ảnh ngang
// rộng cả khối thì một ảnh lệch: ảnh 70% bề ngang sát một mép, chú thích đứng ở cột hẹp bên cạnh (đáy cột, gạch màu chương),
// lần lượt lệch trái / phải. Cùng chiều cao khối như ảnh thường nên không xô bố cục. Không áp cho ảnh nón sản phẩm
// (phải thấy trọn chiếc nón), giấy tờ / tranh (hiện trọn) và khung cao (cắt nhiều)
let ASYM = 0 // đếm ảnh ngang đủ điều kiện đặt lệch (cứ hai ảnh một ảnh)
let SIDE = 0 // ảnh lệch lần lượt sát mép trái / phải
function wideFigure(p, y, r, cap) {
  if (polaOn(p, cap)) {
    const w = CW * 0.86
    return polaroid(p, p.x0 + (CW - w) / 2, y + 6, w, r, cap, p.side === 'left' ? -1.6 : 1.6) + 8
  }
  // ảnh lệch (khung sát một mép, chú thích ở cột hẹp bên cạnh, khối cao như ảnh thường nên không xô trang) khi:
  // (a) ảnh chụp dọc / cao hơn khung mà khung ngang cả khối cắt mất vật chính → khung theo đúng tỉ lệ ảnh, thấy trọn ảnh;
  // (b) cứ hai ảnh ngang thì một ảnh lệch cho đỡ đều — chỉ khi khung hẹp hơn vẫn giữ trọn vật chính
  // (góp ý: ảnh cắt lệch trọng tâm, không thấy hết chiếc nón). Ảnh nón sản phẩm, giấy tờ / tranh không đặt lệch kiểu (b).
  const sj = fitOf(cap) === 'cover' ? subjOfCap(cap) : null
  const bh = CW * r + 6 + capH(cap, CW)
  let iw = sj ? sideW(cap, CW, CW * r, bh) : null
  if (!iw && sj && r <= R.wide + 0.001 && !/ảnh sản phẩm|^Nón /.test(cap?.[0] ?? '') && ASYM++ % 2 === 1) {
    const w0 = CW * (r > R.cin + 0.001 ? 0.74 : 0.7)
    if (subjFrame(sj, w0, bh).cut <= 0.04) iw = w0
  }
  return (iw && sideFigure(p, y, bh, cap, iw)) || figure(p, p.x0, y, CW, CW * r, cap, { fit: fitOf(cap) })
}
/** ảnh lệch: khung iw × bh sát một mép (lần lượt trái / phải), chú thích ở cột hẹp bên cạnh (đáy cột, gạch màu chương) → y dưới, hoặc null nếu chú thích không vừa cột */
function sideFigure(p, y, bh, cap, iw) {
  iw = r1(iw)
  // soát 06/11 (R9): cột chú thích 115pt → chữ Nhật xuống dòng vụn ("葉を / 一 / 枚ずつ…"); cột hẹp thì thu ảnh lại (giữ tỉ lệ)
  if (CW - iw - 16 < 140) {
    const nw = CW - 16 - 140
    bh = r1(bh * (nw / iw))
    iw = nw
  }
  const side = CW - iw - 16
  const fc = fmtCap(cap)
  const sh = textH(numCap(fc, FIG + 1), side, capOpt)
  if (sh > bh - 24) return null
  const imgLeft = SIDE++ % 2 === 0
  const ix = imgLeft ? p.x0 : p.x1 - iw
  const cx = imgLeft ? p.x0 + iw + 16 : p.x0
  p.add(IMG(ix, y, iw, bh, cap))
  p.add(HL(imgLeft ? cx : cx + side - 40, y + bh - sh - 12, 40, ACC[p.chapter] ?? C.gold, 1.4))
  p.add(T(cx, y + bh - sh, side, sh, fc, { ...capOpt, italic: true, color: C.muted, align: imgLeft ? 'left' : 'right', jaFont: F.jaSans, name: 'Chú thích ảnh' }))
  // soát 05/11 (vòng 4, #2): ảnh dọc lệch mà chú thích ngắn → cột bên cạnh trống một mảng lớn (kiểu anh Hải chê ở tr. 108).
  // Không ghép được ảnh đi cặp (SIDE_GAP → pairUp) thì đặt một hình vẽ nét mảnh của sách (hoa dại · măng tre · sen góc)
  // giữa khoảng trống phía trên chú thích — ảnh vẫn trọn, không cắt cho vừa khung ngang
  // (soát vòng 5: hình nhỏ ~99pt mờ 0,55 ở cột hẹp gần như không thấy → chỉ đặt khi cột đủ rộng, hình to + rõ hơn)
  const empty = bh - sh - 30
  if (empty >= 130 && side >= 120) {
    const m = pickMotif(p, 's', side * 0.92, Math.min(empty - 24, 240), 110)
    if (m) p.add({ ...DECO(m.name, cx + (side - m.w) / 2, y + 12 + (empty - 24 - m.h) / 2, m.w, m.h, 0.7), name: 'Hình vẽ', fillDeco: true })
  }
  return y + bh
}
// hình vẽ lấp cột trống cạnh ảnh dọc: [tên, cao / rộng]
/**
 * ảnh chụp dọc đặt lệch mà khung hẹp (dưới 60% bề ngang) → cột chú thích bên cạnh thành khoảng trống lớn (anh Hải 05/11,
 * tr. 108). Tìm trong kho (6 ảnh đầu) một ảnh đi cặp: hai ảnh cạnh nhau cùng khung, không ảnh nào mất quá 8% vật chính.
 * Trả { i (chỉ số trong kho), r, ch } hoặc null.
 */
// soát vòng 5: mở rộng luật ghép (chú thích ngắn → ghép) đã lấy mất ảnh lấp của các trang sau (tr. 91, 107 trống nửa
// trang) và ghép phải ảnh gần trùng cảnh → giữ luật cũ: chỉ ghép khi khung hẹp; cột trống thì sideFigure() đặt hình vẽ
const SIDE_GAP = (cap, r) => {
  const iw = sideW(cap, CW, CW * r, CW * r + 6 + capH(cap, CW))
  return iw && iw < CW * 0.6
}
/** "loạt ảnh": đường dẫn ảnh bỏ số đuôi ("Đôi bàn tay người thợ 2" ~ "Đôi bàn tay người thợ", "xanh ngọc 1" ~ "xanh ngọc 2") */
const SERIES = (hint) => String(PHOTO_PATHS[hint] ?? hint).replace(/\s+\d+$/, '')
function pairUp(pool, cap, room) {
  const w = (CW - 14) / 2
  let best = null
  const used = new Set(pages.flatMap((pg) => pg.els).filter((e) => e.type === 'image' && e.hint).map((e) => SERIES(e.hint)))
  pool.slice(0, 6).forEach((c, i) => {
    // soát 06/11 (R3): không ghép ảnh cùng loạt (cùng tên file, khác số đuôi) với ảnh chính hay ảnh đã có trong sách — gần trùng cảnh
    if (c === cap || fitOf(c) !== 'cover' || !subjOfCap(c) || SERIES(c[0]) === SERIES(cap[0]) || used.has(SERIES(c[0]))) return
    const two = [cap, c]
    const ch = Math.max(...two.map((x) => capH(x, w)))
    const r = bestR(two, w, [R.por, R.sq, R.std].filter((x) => room >= w * x + 6 + ch))
    if (!r) return
    const cut = Math.max(...two.map((x) => cutOf(x, w, w * r)))
    // ngang ngửa thì ưu tiên ảnh cùng loạt (cùng thư mục ảnh của nhóm), rồi ảnh cùng hướng chụp (dọc đi với dọc)
    const dir = (x) => path.dirname(PHOTO_PATHS[x?.[0]] ?? '?')
    const score = cut - r * 0.05 - (dir(c) === dir(cap) ? 0.03 : 0) + 0.02 * Math.abs(Math.log((natR(c) ?? 1) / (natR(cap) ?? 1)))
    if (cut <= 0.08 && (!best || score < best.score)) best = { i, r, ch, score }
  })
  return best
}
/** đặt hai ảnh cạnh nhau (kết quả pairUp) → y dưới */
function pairFigure(p, y, two, pu) {
  const w = (CW - 14) / 2
  two.forEach((c, k) => figure(p, p.x0 + k * (w + 14), y, w, w * pu.r, c, { fit: fitOf(c) }))
  return y + w * pu.r + 6 + pu.ch
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

/**
 * thẻ ghi chú nổi bật cho trang có hiệu ứng (góp ý 04/11: ghi rõ "bấm vào … để …", chữ to): nền vàng nhạt, viền nâu,
 * dấu "!" đỏ ở đầu — như nhãn mẫu trong Doc. Trả y dưới thẻ.
 */
function tipBox(p, y, pair, o = {}) {
  // anh Hải 05/11: hộp vàng viền nâu + dấu "!" đỏ nhìn như cảnh báo ("nhìn khó chịu"), ở mục lục còn che viền khung
  // trang → chỉ một dòng chữ viết tay nhỏ màu nâu nhạt, giữa khối, "☝" đầu dòng (ký hiệu chỗ bấm được của sách)
  const x = o.x ?? p.x0
  const w = o.w ?? p.cw
  const to = { font: F.hand, size: Math.min(o.size ?? 14, 14), lh: 1.3, jaSize: Math.min(o.jaSize ?? 12.5, 12.5) }
  const txt = pair.map((t) => (t && !String(t).includes('☝') ? `☝ ${t}` : t))
  const th = textH(txt, w, to)
  p.add(T(x, y + 4, w, th, txt, { ...to, color: '#8b7355', align: 'center', jaFont: F.jaHand, name: 'Ghi chú tương tác' }))
  return y + th + 8
}

/** chú thích cuối trang: neo đáy trang, trả y trên cùng của khối */
function footnotes(p, notes) {
  const no = { size: S.note, lh: 1.45, paraGap: 3 }
  // 08/11: chú thích chỉ có ở một thứ tiếng (vd. [4]–[8] của bản Nhật, bản Việt không có) → mỗi thứ tiếng một khối riêng,
  // khối chỉ hiện ở thứ tiếng của nó (el.only), không để đường kẻ chú thích trơ trọi ở bản kia
  if (notes.every((n) => n[0] && n[1])) {
    const pair = join(notes)
    const h = textH(pair, p.cw, no)
    const y = BOT - h
    p.add({ ...HL(p.x0, y - 10, 90, C.line, 0.6), name: 'Kẻ chú thích' }, T(p.x0, y, p.cw, h, pair, { ...no, color: C.muted, jaFont: F.jaSans, name: 'Chú thích' }))
    return y - 26
  }
  let top = BOT
  for (const [k, only] of [[0, 'vi'], [1, 'ja']]) {
    const list = notes.map((n) => n[k]).filter(Boolean)
    if (!list.length) continue
    const txt = list.join('\n')
    const pair = only === 'vi' ? [txt, null] : ['', txt]
    const h = textH(pair, p.cw, no)
    const y = BOT - h
    p.add({ ...HL(p.x0, y - 10, 90, C.line, 0.6), name: 'Kẻ chú thích', only }, { ...T(p.x0, y, p.cw, h, pair, { ...no, color: C.muted, jaFont: F.jaSans, name: 'Chú thích' }), only })
    top = Math.min(top, y)
  }
  // soát độc lập 08/11: chỉ bản Nhật có chú thích → bản Việt hở một dải ở đáy trang; đặt hình vẽ nét mảnh chỉ hiện ở bản
  // Việt (như hình lấp đáy trang bottomFlora) vào đúng dải đó
  if (!notes.some((n) => n[0])) {
    const band = BOT + 24 - (top - 26)
    const m = pickMotif(p, 'k', p.cw * 0.5, Math.min(band - 16, 110))
    if (m) {
      const x = p.side === 'left' ? p.x0 - 10 : p.x1 - m.w + 10
      p.add({ ...DECO(m.name, x, BOT + 24 - m.h, m.w, m.h, 0.6), name: 'Hình vẽ', only: 'vi', fillDeco: true })
    }
  }
  return top - 26
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
    const r = [R.sq, R.std, R.wide, R.cin, R.pan].filter(notTaller(cap)).find((x) => this.bot - y >= wideH(this.p, x, cap)) // góp ý: điểm nhấn bằng ảnh lớn
    if (!r) return false
    const n0 = this.p.els.length
    const pu = SIDE_GAP(cap, r) && pairUp(this.pool.slice(1), cap, this.bot - y)
    if (pu) {
      this.y = pairFigure(this.p, y, [cap, this.pool[1 + pu.i]], pu) + 18
      this.pool.splice(1 + pu.i, 1)
    } else this.y = wideFigure(this.p, y, r, cap) + 18
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
      const r = [R.sq, R.std, R.wide, R.cin, R.pan].filter(notTaller(cap)).find((x) => room >= wideH(this.p, x, cap))
      if (r) {
        const pu = SIDE_GAP(cap, r) && pairUp(this.pool.slice(1), cap, room)
        if (pu) {
          this.y = pairFigure(this.p, y, [cap, this.pool[1 + pu.i]], pu) + 18
          this.pool.splice(1 + pu.i, 1)
        } else this.y = wideFigure(this.p, y, r, cap) + 18
        this.pool.shift()
        continue
      }
      if (this.pool.length < 2) break
      const w = (CW - 14) / 2
      const two = this.pool.slice(0, 2)
      const ch2 = Math.max(...two.map((c) => capH(c, w)))
      // hai ảnh chụp dọc → khung dọc / vuông nếu còn chỗ (khung ngang cắt ngang người, nón)
      const r2 = bestR(two, w, [R.por, R.sq, R.std, R.wide].filter((x) => room >= w * x + 6 + ch2))
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
    // đầu trang ghi số + tên mục đang đọc (góp ý: "có thể ghi đầu góc là 1.2") — áp cho mọi trang của mục
    // nhãn mới chỉ áp từ trang mở mục: trang đệm / trang ảnh lấp cuối mục trước giữ nhãn mục trước
    // (soát 04/11: tr. 55 còn nội dung 2.1.2 mà đầu trang đã ghi 2.2)
    const label = num ? runShort(num, [`${num} · ${strip(title[0]).replace(/\n/g, ' ')}`, `${num}　${strip(title[1]).replace(/\n/g, '')}`]) : this.runLabel
    this.unit({ label })
    this.runLabel = label
    this.y = sectionHead(this.p, this.y, num, title, kicker)
    this.head = { p: this.p, y: this.y }
    this.leadNext = !!num
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
    // đoạn dẫn ngay dưới tiêu đề mục có số: chữ nghiêng màu nâu + vạch màu bên trái (góp ý: phần dẫn nhập đầu mục
    // trông giống nội dung chính, dễ nhầm)
    let lead = this.leadNext && this.head?.p === this.p && this.head.y === this.y
    this.leadNext = false
    const flush = () => {
      if (!acc.length) return
      const pair = join(acc)
      const h = textH(pair, w(), opt)
      const isLead = lead
      lead = false
      if (isLead) this.p.add(RECT(this.p.x0 - 12, this.y + 2, 2.4, h - 4, ACC[this.chapter] ?? C.gold, { name: 'Vạch đoạn dẫn' }))
      this.p.add(T(this.p.x0, this.y, w(), h, pair, { ...opt, align: o.align ?? 'justify', color: isLead ? C.ink2 : (o.color ?? C.ink), jaFont: F.jaBody, italic: isLead || o.italic, font: o.font, name: isLead ? 'Đoạn dẫn' : (o.name ?? 'Đoạn văn') }))
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
    // 06/11: ảnh của chính chủ đề chưa có chỗ (mục có nhiều ảnh nhóm gắn hơn chỗ trống) → lên đầu kho lấp trang, in ở khoảng
    // trống kế tiếp thay vì rơi mất
    const left = (rest?.images ?? []).filter((im) => im && !im.video)
    if (left.length) this.pool.unshift(...left)
  }
  storySpread(o) {
    const underHead = (o.here || (this.head?.p === this.p && this.head.y === this.y)) && this.p?.side === 'left'
    if (!underHead) this.unit()
    const L = this.p
    let y = this.y
    // chú thích cuối trang của đoạn đầu (đoạn đầu luôn ở trang trái): neo đáy trang trái, chữ + ảnh chảy phía trên
    const LB = o.notes ? footnotes(L, o.notes) : BOT
    let RB = BOT
    const bot = (pg) => (pg === L ? LB : RB)
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
      let im = nextImg()
      if (!im) return yy
      let ch = capOf(im)
      const room = bot(pg) - yy - 6 - ch
      let r = im.video ? [R.sq, R.std, R.wide, R.cin, R.pan].find((x) => CW * x <= room) : [R.sq, R.std, R.wide, R.cin, R.pan].filter(notTaller(im)).find((x) => wideH(pg, x, im) <= bot(pg) - yy)
      // soát đọc lần đầu 05/11 (tr. 64): dưới đoạn văn còn ~210pt, không đủ khung 2:1 → ảnh của mục bị bỏ, chỗ trống thành
      // hình vẽ nhỏ. Thêm nấc dải ảnh ngang (cao theo chỗ còn, tối thiểu ~3:10) khi ảnh không mất quá 4% vật chính
      if (!r && o.keepOrder && !im.video && bot(pg) - yy - 6 - ch >= 150) return figure(pg, pg.x0, yy, CW, bot(pg) - yy - 6 - ch, im) + 18
      if (!r && !im.video && room >= CW * 0.3) {
        const pr = Math.min(R.pan, room / CW)
        if (cutOf(im, CW, CW * pr) <= 0.04) r = pr
        else {
          // ảnh này cắt dải thì mất vật chính → thử ảnh khác của chính mục (ảnh còn lại sang trang phải)
          const j = imgs.findIndex((x) => !x.video && cutOf(x, CW, CW * pr) <= 0.04)
          if (j >= 0) {
            const alt = imgs.splice(j, 1)[0]
            imgs.unshift(im)
            im = alt
            ch = capOf(im)
            r = Math.min(R.pan, (bot(pg) - yy - 6 - ch) / CW)
          }
        }
      }
      if (!r) {
        imgs.unshift(im)
        return yy
      }
      if (im.video) {
        pg.add(VIDEO(pg.x0, yy, CW, CW * r, VIDEO_SRC, { poster: VIDEO_POSTER, name: 'Video trình diễn' }))
        pg.add(T(pg.x0, yy + CW * r + 6, CW, ch, im.video, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích video' }))
        return yy + CW * r + 6 + ch + 18
      }
      // ảnh dọc khung hẹp → ghép một ảnh kho (hoặc ảnh chủ đề còn dư, vẫn chừa một ảnh cho trang phải) thành hai ảnh cạnh nhau
      if (SIDE_GAP(im, r)) {
        const still = imgs.filter((x) => !x.video)
        const from = [this.pool, still.length > 1 ? imgs : null].filter(Boolean)
        for (const src of from) {
          const pu = pairUp(src.filter((x) => !x.video), im, bot(pg) - yy)
          if (!pu) continue
          const mate = src.filter((x) => !x.video)[pu.i]
          src.splice(src.indexOf(mate), 1)
          return pairFigure(pg, yy, [im, mate], pu) + 18
        }
      }
      return wideFigure(pg, yy, r, im) + 18
    }
    y = put(L, y, left)
    // 08/11: o.pairLeft — hai ảnh đầu của chủ đề (nhóm gắn chung một chú thích) cạnh nhau ở trang trái
    const two = o.pairLeft ? imgs.filter((im) => !im.video).slice(0, 2) : []
    if (two.length === 2) {
      const w2 = (CW - 14) / 2
      const ch2 = Math.max(...two.map((c) => capH(c, w2)))
      const r2 = [R.por, R.sq, R.std, R.wide].find((x) => y + w2 * x + 6 + ch2 <= LB)
      if (r2) {
        two.forEach((c, i) => figure(L, L.x0 + i * (w2 + 14), y, w2, w2 * r2, c, { fit: fitOf(c) }))
        two.forEach((c) => imgs.splice(imgs.indexOf(c), 1))
        y += w2 * r2 + 6 + ch2 + 18
      } else y = media(L, y)
    } else y = media(L, y)
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
        // khung không vượt đáy trang (soát 04/11: tr. 117 chú thích ảnh thứ hai lấn chân trang)
        const rr = Math.min(r, (BOT - yy - 6 - capH(im, CW)) / CW)
        if (rr < R.pan) {
          this.pool.unshift(im)
          continue
        }
        yy = figure(pg, pg.x0, yy, CW, CW * rr, im) + 22
      }
      this.y = yy
      this.close()
      return rest
    }
    const Rp = this.page()
    if (o.notesR) RB = footnotes(Rp, o.notesR)
    let ry = put(Rp, TOP, right)
    if (more) {
      Rp.add(MORE(Rp.x0, ry - 6, o.title ?? o.h, ps.map((q) => q[0]), ps.map((q) => q[1]), ACC[this.chapter]))
      ry += moreH
    }
    const n0 = Rp.els.length
    // o.gallery (góp ý 04/11, Đổi mới sản phẩm: "bổ sung ảnh sp sáng tạo"): trang phải xếp lưới 2 cột các ảnh còn lại
    // của chính chủ đề (tối đa 4), thay vì một ảnh — các ảnh sản phẩm đều được in, không rơi mất
    const still = imgs.filter((im) => !im.video)
    let grid = false
    if (o.gallery && still.length >= 2 && !imgs.some((im) => im.video)) {
      const list = still.slice(0, 4)
      const gw = (CW - 14) / 2
      const rows = Math.ceil(list.length / 2)
      const gch = Math.max(...list.map((c) => capH(c, gw)))
      const gr = Math.min(R.por, (BOT - ry - rows * (6 + gch) - (rows - 1) * 16) / rows / gw)
      // 08/11: mục trải nghiệm có 4 ảnh nhóm gắn cho trang phải → khung thấp nhất ~9:20 (vẫn thấy rõ người, biển)
      if (gr >= 0.45) {
        list.forEach((im) => imgs.splice(imgs.indexOf(im), 1))
        let gy = ry
        for (let r0 = 0; r0 < rows; r0++) {
          const two = list.slice(r0 * 2, r0 * 2 + 2)
          two.forEach((c, k) => figure(Rp, Rp.x0 + k * (gw + 14) + (two.length === 1 ? (gw + 14) / 2 : 0), gy, gw, gw * gr, c))
          gy += gw * gr + 6 + gch + 16
        }
        this.y = gy
        grid = true
      }
    }
    if (!grid) this.y = media(Rp, ry)
    // ảnh trang phải không lấp kín đáy (khung chuẩn nhảy bậc) → hạ ảnh xuống giữa khoảng trống, không để một dải trống ở đáy
    const gap = BOT - (this.y - 18)
    // (khoảng trống từ 180pt trở lên để close() lấp thêm ảnh)
    if (gap > 40 && gap < 180 && Rp.els.length > n0) {
      Rp.els.slice(n0).forEach((e) => (e.y = r1(e.y + gap / 2)))
      this.y += gap / 2
    }
    // review lần 2 (nhịp tr. 100–105): các chủ đề chương 3 trang nào cũng "chữ trên, ảnh dưới" → chủ đề xen kẽ (o.flip) đảo
    // trang phải thành ảnh trên, chữ dưới. Chỉ đảo khi trang phải là một khối chữ + một khối ảnh (không lưới, không "Đọc thêm")
    if (o.flip && !grid && !more && right.length && Rp.els.length > n0) {
      const textEls = Rp.els.slice(0, n0).filter((e) => e.name === 'Đoạn văn' && e.y >= TOP - 1)
      const mediaEls = Rp.els.slice(n0)
      const mTop = Math.min(...mediaEls.map((e) => e.y))
      const mBot = Math.max(...mediaEls.map((e) => e.y + e.h))
      const tTop = Math.min(...textEls.map((e) => e.y))
      const tBot = Math.max(...textEls.map((e) => e.y + e.h))
      if (textEls.length && mTop > tBot) {
        const dm = TOP - mTop
        mediaEls.forEach((e) => (e.y = r1(e.y + dm)))
        const dt = mBot + dm + 24 - tTop
        textEls.forEach((e) => (e.y = r1(e.y + dt)))
        this.y = Math.max(this.y, tBot + dt + 18)
      }
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
    // ảnh chụp dọc: khung lệch đúng tỉ lệ ảnh, cao theo chỗ còn trên trang (tối đa 62% bề ngang) — khung nhỏ để trống cạnh ảnh
    const nat = natR(cap)
    if (!o.plain && nat && fitOf(cap) === 'cover' && nat > r * 1.12) {
      const bh = Math.min(this.room - 4, CW * 0.62 * nat)
      const pu = bh / nat < CW * 0.6 && pairUp(this.pool, cap, this.room - 4)
      if (pu) {
        this.y = pairFigure(this.p, this.y, [cap, this.pool[pu.i]], pu) + 22
        this.pool.splice(pu.i, 1)
        return
      }
      const yy = bh > CW * r + 6 + ch && sideFigure(this.p, this.y, bh, cap, bh / nat)
      if (yy) {
        this.y = yy + 22
        return
      }
    }
    this.y = (o.plain ? figure(this.p, this.p.x0, this.y, CW, CW * r, cap) : wideFigure(this.p, this.y, r, cap)) + 22
  }
  /** n ảnh cạnh nhau, khung 4:3 (hoặc tỷ lệ o.ratio) */
  row(caps, o = {}) {
    const n = caps.length
    const gap = 14
    const w = (CW - gap * (n - 1)) / n
    const ch = Math.max(...caps.map((c) => capH(c, w)))
    // không ghi tỉ lệ → khung theo ảnh: cả hàng đều chụp dọc thì khung dọc (3:4, chật thì vuông), không cắt ngang người / nón
    const fits = (r) => this.p && this.room >= w * r + 6 + ch
    const h = w * (o.ratio ?? bestR(caps, w, [R.por, R.sq, R.std].filter(fits)) ?? R.std)
    if (!this.p || this.room < h + 6 + ch) this.page()
    caps.forEach((c, i) => figure(this.p, this.p.x0 + i * (w + gap), this.y, w, h, c, { fit: fitOf(c) }))
    this.y += h + 6 + ch + 22
  }
  /** lưới ảnh cols cột, khung 4:3 */
  gallery(caps, cols = 2, o = {}) {
    const gap = 14
    const rows = Math.ceil(caps.length / cols)
    const w = (CW - gap * (cols - 1)) / cols
    const ch = Math.max(...caps.map((c) => capH(c, w)))
    const needOf = (r) => rows * (w * r + 6 + ch) + (rows - 1) * 16
    // không ghi tỉ lệ → khung theo ảnh (ảnh dọc khung dọc / vuông nếu còn chỗ trên trang)
    const h = w * (o.ratio ?? bestR(caps, w, [R.por, R.sq, R.std].filter((r) => this.p && this.room >= needOf(r))) ?? R.std)
    const need = needOf(h / w)
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
    // góp ý 04/11: chú thích tr. 17 nằm khác trang với dấu ¹ của nó → đoạn có dấu không được tách sang trang sau
    // vì hạn mức chữ mỗi trang (budget) — chú thích và đoạn văn luôn cùng một trang
    this.prose(paras, { free: true, budget: false, ...o })
  }
  /** khung ghi chú nền màu */
  note(pair, o = {}) {
    const opt = { size: o.size ?? 14, lh: 1.6, jaSize: jaPt(o.size ?? 14) }
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
    ['Phiên chợ Chuông họp từ khi trời còn tối, người bán ngồi giữa nón và lá', 'まだ暗いうちから開かれるチュオンの市場：ノンラーと葉に囲まれた売り手たち'],
    ['Nón lá trắng bên tà áo dài trước sân đình Chuông', 'チュオン村の亭の前で、アオザイとともに並ぶ白いノンラー'],
    ['Người bán nón trao đổi trong phiên chợ Chuông lúc tờ mờ sáng', '夜明け前のチュオンのノンラー市場で、ノンラーをやりとりする売り手たち'],
    ['Người thợ chằm nón, từng mũi kim xuyên qua lớp lá', '葉を一針ずつ縫い留めるノンラー職人'],
    ['Lòng nón lá trắng với chỉ nhôi đỏ – xanh', '赤と青のノイの糸が見える白いノンラーの内側'],
  ],
  1: [
    ['Nón và trang phục dân tộc trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ベトナム民族学博物館に展示されたノンラーと民族衣装'],
    // soát 04/11: bỏ ảnh chồng nón ở Bảo tàng Dân tộc học (cùng gian trưng bày với IMG_2577 tr. 27)
    ['Nón lá trắng bên tà áo dài trước sân đình Chuông', 'チュオン村の亭の前で、アオザイとともに並ぶ白いノンラー'],
    ['Nón lá trong tranh sơn dầu — Bảo tàng Mỹ thuật Việt Nam', '油彩画に描かれたノンラー — ベトナム美術博物館'],
    ['Người phụ nữ đội nón giữa cánh đồng — tranh tại Bảo tàng Mỹ thuật Việt Nam', '田んぼでノンラーをかぶる女性 — ベトナム美術博物館の絵画'],
    ['Nón cổ có trang trí hoa văn — Bảo tàng Phụ nữ Việt Nam', '模様で飾られた古いノンラー — ベトナム女性博物館'],
    ['Chợ nón Chuông dưới mái che treo đèn lồng', '提灯の下がる屋根の下のチュオンのノンラー市場'],
    ['Người mua kẻ bán tấp nập trong phiên chợ nón Chuông', '売り手と買い手でにぎわうチュオンのノンラー市場'],
    ['Gian trưng bày nón và bằng khen tại một cơ sở làng Chuông', 'チュオン村の工房に並ぶノンラーと表彰状'],
    // thêm khi giãn chữ: ảnh chưa dùng trong Drive của nhóm (bảo tàng, chợ, cơ sở làm nón), đã soát không trùng cảnh
    ['Các kiểu nón truyền thống trưng bày tại Bảo tàng Phụ nữ Việt Nam', 'ベトナム女性博物館に展示された伝統的なノンラー'],
    ['Chiếc nón rộng vành trong gian trưng bày của Bảo tàng Phụ nữ Việt Nam', 'ベトナム女性博物館の展示室にあるつばの広いノンラー'],
    ['Trang phục và nón của phụ nữ các dân tộc — Bảo tàng Phụ nữ Việt Nam', 'さまざまな民族の女性の衣装とノンラー — ベトナム女性博物館'],
    ['Lòng một chiếc nón cổ, nan xòe đều quanh chóp — hiện vật Bảo tàng Phụ nữ Việt Nam', '放射状に骨が広がる古いノンラーの内側 — ベトナム女性博物館の所蔵品'],
    ['Người bán nón và vật liệu làm nón ở chợ Chuông', 'チュオンの市場でノンラーと材料を売る人々'],
  ],
  2: [
    ['Người thợ khâu những mũi cuối trên thân nón', 'ノンラーの胴部に最後の針を通す職人'],
    // soát 04/11: trang lớp lá cần ảnh thấy các lớp (ảnh thợ đeo micro không khớp nội dung)
    ['Chiếc nón đang lợp dở: lớp mo nang lộ ra giữa các lớp lá', '重ねている途中のノンラー：葉の層の間に見えるヌアの皮'],
    // soát 06/11 (R9): ảnh quầy bảo tàng này là lần thứ ba cùng một quầy (tr. 46, 54); review lần 2: ảnh "trải lá quanh
    // khung" cùng bàn tay, cùng chiếu, cùng lúc với ảnh 58 (lớp lá ngoài, tr. 53); soát vòng 10: "Chiếc nón trắng vừa hoàn
    // thiện" là CÙNG tấm ảnh với ảnh 33 tr. 31 (thư mục Nón cô dâu(1) chứa IMG_7347 của nhóm) → người thợ khâu nón tại nhà
    // (chương 2 không lấp bằng ảnh chợ — góp ý 04/11; ảnh bảo tàng IMG_6391 cùng quầy tr. 46, 54)
    ['Người thợ khâu nón ngay trong nếp nhà', '自宅でノンラーを縫う職人'],
    ['Khung nón và vành nứa — trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ノンラーの骨組みとヌアの輪 — ベトナム民族学博物館の展示'],
    ['Nguyên liệu và các lớp của chiếc nón — trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ノンラーの材料と層 — ベトナム民族学博物館の展示'],
    ['Người bán phân loại lá lụi ở chợ Chuông', 'チュオンの市場でラルイを仕分ける売り手'],
    ['Bó vòng nứa vót sẵn bày bán ở chợ Chuông', 'チュオンの市場に並ぶ、削ったヌアの輪の束'],
    ['Người bán bên những chiếc nón lợp dở ở chợ Chuông', 'チュオンの市場で、作りかけのノンラーのそばに座る売り手'],
    ['Lá lụi bày bán trước cổng đình Chuông', 'チュオン村の亭の門前で売られるラルイ'],
    ['Nguyên liệu và dụng cụ làm nón bày trên bàn — Bảo tàng Dân tộc học Việt Nam', '机に並べられたノンラー作りの材料と道具 — ベトナム民族学博物館'],
    ['Nón lá và trang phục trong gian trưng bày nghề nón — Bảo tàng Dân tộc học Việt Nam', 'ノンラー作りの展示室に並ぶノンラーと衣装 — ベトナム民族学博物館'],
  ],
  3: [
    // 08/11: ảnh nhóm gắn trong tab パート3 đã đặt đúng chỗ (3.1, nghệ nhân, 3.2, 3.3) → bỏ khỏi kho lấp trang (không in lặp)
    // thứ tự = thứ tự lấp trang của chương 3 (ảnh đúng đoạn văn bên cạnh): mở mục 3.1 → OCOP → ghi nhận → nghệ nhân
    ['Người bán ngồi giữa lá, vành và nón trong phiên chợ Chuông', 'チュオンの市場で、葉や輪、ノンラーに囲まれて座る売り手たち'],
    // 06/11: ảnh nhóm gắn cho phần ghi nhận (3-15, 3-20), chú thích JA nguyên văn nhóm — lấp trang ghi nhận trước ảnh kho
    // soát 07/11: trang đệm sau trang OCOP còn 1/3 → hai ảnh nhỏ cùng chủ đề OCOP: cơ sở ông Tuy (nhóm gắn 3-29, chuyển từ mục
    // trải nghiệm vì cùng biển với ảnh tr. 106) + một giấy chứng nhận khác của cơ sở; giấy khen bà Hương giữ trang mở phần nghệ nhân
    ['Du khách nước ngoài học làm nón trong một xưởng ở làng Chuông', 'チュオン村の工房でノンラー作りを学ぶ外国人観光客'],
    // góp ý 04/11: phần ghi nhận nón và làng nghề không đặt bằng công nhận nghệ nhân (không liên quan nội dung) → bỏ
    // ba nghệ nhân giữ nghề: nón xưa trong bảo tàng, người làng nối nghề
    ['Nón làng Chuông xếp chồng — Bảo tàng Dân tộc học Việt Nam', '積み重ねられたチュオン村のノンラー — ベトナム民族学博物館'],
    // soát 04/11: bỏ ảnh gian manocanh ở bảo tàng (lặp cảnh tr. 22, 27)
    ['Người dân ngồi làm nón trong một cơ sở ở làng Chuông', 'チュオン村の工房でノンラー作りをする人々'],
    // những người đưa nghề đi tiếp: mẫu nón mới
    // soát 04/11: ảnh xưởng tường nón vẽ đã có ở tr. 88; ảnh nón mini đã vào lưới Đổi mới sản phẩm → du khách vẽ nón
    ['Du khách vẽ trang trí nón tại một cơ sở làng Chuông', 'チュオン村の工房でノンラーに絵付けをする観光客'],
    // trang đệm trước 3.2 (bỏ ảnh "niềm vui người bán nón": người trong ảnh che mũi, nhăn mặt), rồi ảnh chợ cho các chủ đề còn thiếu ảnh
    // soát 06/11 (R9): ảnh chợ đèn lồng IMG_3144 lặp cảnh tr. 29, 87 + bưu thiếp → ảnh chợ ban ngày, người bán bên chồng nón
    ['Người bán nón bên những chồng nón trắng ở chợ Chuông', 'チュオンの市場で白いノンラーの山の横に座る売り手'],
    ['Người bán vành và khung nón trong phiên chợ Chuông', 'チュオンの市場でノンラーの輪と骨組みを売る人'],
    // soát 04/11: bỏ ảnh chợ đêm (lặp cảnh); 3.3 "người kế thừa": người thợ lớn tuổi bên người trẻ
    // soát 06/11 (R3): bỏ "Đôi bàn tay người thợ luồn chỉ nhôi" — cùng loạt, cùng tay, cùng nón với "Đôi bàn tay người thợ" (3.3)
    ['Người nghệ nhân lớn tuổi', '年配の職人'],
  ],
  // góp ý buổi họp (anh Hải nhắc 05/11): "phần kết nhiều ảnh đẹp quá, cắt bớt đi vì nó không quan trọng, đẩy cho các nội dung
  // trên" → kết luận chỉ một ảnh; ảnh chợ còn lại chuyển lên kho ảnh mục 1.3 (Làng Chuông, chợ nón) — xem KET_UP
  9: [
    ['Phiên chợ bán lá lụi trước cổng đình Chuông', 'チュオン村の亭の門前で開かれるラルイの市'],
    // soát 06/11 (R2): bỏ "Lá lụi và nón thành phẩm" (IMG_3153) — cùng cảnh, cùng góc ảnh toàn trang tr. 29 (IMG_3152)
  ],
}

/** cặp trang mở chương: trái ảnh lớn tràn trang + số chương thật to, phải tên chương + đoạn dẫn */
function chapterOpener(ch, photo) {
  const acc = ACC[ch.no]
  toLeft(photo.alt, ch.no - 1)
  // trang trái mở chương theo mockup của nhóm (Thu Nguyệt, "CHƯƠNG 2"): chữ CHƯƠNG + số thật to màu chương, tên chương
  // in hoa bên cạnh, gạch ngang; dưới là ảnh thật của nhóm (Doc: "Bìa chương: lấy ảnh thật của nhóm chụp") — ảnh có khung,
  // không tràn trang (góp ý: ảnh nhóm phóng to cả trang thì xấu); cụm sen nét mảnh ở góc dưới, cành hoa ở góc trên
  const left = new Page({ chapter: ch.no, hideNumber: true, bg: C.cream, paper: 'giay' })
  left.fixed = true
  const title = [ch.title[0], strip(ch.title[1])]
  const lx = left.x0
  left.add(
    STAND({ ...DECO('hoa-dai', left.x1 - 74, 58, 84, 122, 0.7), name: 'Hình vẽ' }, 0.9),
    T(lx, 74, 300, 40, ['CHƯƠNG', `パート${ch.no}`], { font: F.head, size: 30, tracking: 2, color: C.title, lh: 1.2, jaFont: F.jaHead, jaSize: 22, name: 'Nhãn chương' }),
    // phông Playfair chừa khoảng trống lớn phía trên chữ số: khung số đặt cao hơn để mặt số ngang tên chương
    STAND(T(lx - 8, 46, 150, 270, [String(ch.no), null], { font: F.head, size: 200, color: acc, lh: 1.05, name: 'Số chương' }), 0.25, 1.2)
  )
  const tx = lx + 148
  const tto = { size: 22, font: F.head, lh: 1.35, jaSize: 21 }
  const ttw = left.x1 - tx - 60
  const up = [title[0].replace(/\n/g, ' ').toUpperCase(), title[1]]
  const tth = textH(up, ttw, tto)
  left.add(T(tx, 168, ttw, tth, up, { ...tto, color: C.title, jaFont: F.jaHead, name: 'Tên chương' }))
  const ry = Math.max(330, 168 + tth + 28)
  left.add(HL(lx, ry, left.cw, C.line, 0.9))
  // ảnh: khung dọc 3:4 lệch phải, cụm sen vẽ sau ảnh ở góc trái dưới (ảnh che một phần như mockup)
  // soát 04/11 (B10): ảnh mở chương cũng có chú thích "Ảnh N: … (Nguồn: …)" dưới ảnh
  // tab Bổ sung (08/11): "Ảnh bìa mỗi chương chỉ cần ghi nguồn, không cần ghi chú thích" → "Ảnh N: (nguồn)" / 「画像N：（出典）」
  const srcOnly = (fc) => {
    const o = [fc[0].match(/\([^()]*\)$/)?.[0] ?? fc[0], fc[1] ? fc[1].match(/（[^（）]*）$/)?.[0] ?? fc[1] : fc[1]]
    o.fmt = true
    return o
  }
  const oc = srcOnly(fmtCap([pageCap(photo.main[0]), pageCap(photo.main[1])], photo.main[0]))
  const pw0 = left.cw - 70
  const och = capH(oc, pw0)
  const ph = BOT + 14 - (ry + 26) - 6 - och
  const pw = Math.min(pw0, ph / R.por)
  left.add(STAND({ ...DECO('sen-goc', lx - 26, H - 236, 238, 204, 0.85), name: 'Hình vẽ' }, 0.6), SUN(-30, -16, 470, true, 0.8))
  // ảnh in nổi khỏi trang (bóng đổ, trôi nhẹ theo con trỏ); photo.breakOut: người trong ảnh "thoát khung" — khung hạ thấp,
  // phần đầu (ảnh tách nền) nhô lên khỏi mép trên khung, đổ bóng lên giấy (anh Hải 05/11: phá vỡ không gian 2D)
  const sjo = photo.breakOut && subjOfCap(photo.main)
  const fh = sjo ? Math.min(ph, ((1 - photo.breakOut.top) * pw) / sjo.a) : ph
  // khung thoát khung: đỉnh đầu (mép trên vật chính) ngay dưới đường kẻ, không để khoảng trống giữa đường kẻ và ảnh
  const fy = sjo ? Math.min(ry + 26 + ph - fh, ry + 30 + (photo.breakOut.top - photo.breakOut.head) * (pw / sjo.a)) : ry + 26
  left.add({
    ...IMG(left.x1 - pw, fy, pw, fh, photo.main, { name: 'Ảnh mở chương', ...(sjo ? { pos: '50% 100%' } : null) }),
    capSrcOnly: true,
    pop: { z: 0.5, kind: 'lift' },
    ...(sjo ? { breakOut: { src: photo.breakOut.src, a: sjo.a } } : null),
  })
  left.add(T(left.x1 - pw, fy + fh + 6, pw, capH(oc, pw), oc, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
  const p = new Page({ chapter: ch.no, hideNumber: true, bg: C.cream })
  p.fixed = true
  // trang phải: nhãn chương + đoạn dẫn, hình vẽ nét mảnh của chương ở dưới, mười sáu vòng nón in mờ, dải màu, dấu son
  p.add({ ...DECO('vong-non', W - 330, H - 360, 440, 440, 0.12), name: 'Hình vẽ' }, RECT(W - 18, 0, 18, H, acc, { name: 'Dải màu chương' }))
  p.add(...SEAL(p.x1 - 70, 92), SUN(W - 440, -16, 460, false, 0.75))
  const tw = p.cw - 10
  let y = 108
  p.add(T(p.x0, y, 320, 16, [ch.label[0].toUpperCase(), strip(ch.label[1])], { size: S.label + 0.5, tracking: 3, color: acc, weight: 700, jaFont: F.jaSans, name: 'Nhãn chương' }))
  y += 30
  p.add(HL(p.x0, y, 64, acc, 1.8))
  y += 30
  const lo = { size: 15, lh: 1.65, jaSize: jaPt(15, 1.12), paraGap: 8 } // góp ý 04/11: chữ trang giới thiệu chương hơi to
  const lh = textH(ch.lead, tw - 30, lo)
  p.add(T(p.x0, y, tw - 30, lh, ch.lead, { ...lo, color: C.ink2, jaFont: F.jaBody, align: 'justify', name: 'Đoạn dẫn' }))
  y += lh + 30
  const iw = Math.min(p.cw - 110, BOT - y)
  if (iw > 120) p.add(STAND({ ...DECO(SEC_ICON[ch.no] ?? 'non', p.x0 + (p.cw - 10 - iw) / 2, y, iw, iw, 0.95), name: 'Hình vẽ' }, 0.5, 1.3))
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
  // anh Hải 05/11: bìa giấy phẳng + nón dán lên trông xấu; nhóm muốn như ảnh minh họa bìa trong tab "Góp ý sửa (1)" (trông như
  // ảnh chụp thật), kèm ghi chú "Chỉ có nón ( Cái nón.jpg ), thêm một số họa tiết trang trí / Chỉ để một thứ tiếng thôi".
  // Ảnh nền tràn bìa dựng bằng scripts/book/cover.py: nền lá xoá phông + mặt vải + chiếc nón của nhóm có bóng đổ + gáy sách.
  const p = new Page({ hideNumber: true, bg: '#efe4cc', paper: null })
  p.fixed = true
  const ink = '#3b2a1b'
  p.add(
    // ba lớp của cover.py — nền, chiếc nón chính (bóng đổ vẽ sẵn trong ảnh), cụm nón nhoè phía trước. Anh Hải 08/11: "bìa thì
    // ko cần 3d đâu, m tạo ra 1 cái ảnh bìa tĩnh thôi" → ba lớp đứng yên như một ảnh (bỏ lơ lửng / trượt theo con trỏ)
    { ...IMG(0, 0, W, H, ['Ảnh bìa: chiếc nón lá Làng Chuông', '表紙写真：チュオン村のノンラー'], { src: 'assets/book/cover/bia-nen.webp', fit: 'cover' }), name: 'Ảnh bìa' },
    { ...IMG(...COVER_LAY.non, ['Ảnh bìa: chiếc nón lá Làng Chuông', '表紙写真：チュオン村のノンラー'], { src: 'assets/book/cover/bia-non.webp', fit: 'fill' }), name: 'Ảnh bìa' },
    { ...IMG(...COVER_LAY.truoc, ['Ảnh bìa: chiếc nón lá Làng Chuông', '表紙写真：チュオン村のノンラー'], { src: 'assets/book/cover/bia-truoc.webp', fit: 'fill' }), name: 'Ảnh bìa' },
    SUN(W - 470, -20, 500, false, 0.6),
    // họa tiết nét vàng: nhánh tre bên phải, cành lá dưới góc (như ảnh minh họa của nhóm)
    { ...DECO('bamboo', W - 128, 300, 110, 240, 0.7), name: 'Họa tiết' },
    { ...DECO('leaf-sprig', W - 176, H - 150, 136, 136, 0.7), name: 'Họa tiết' },
    T(60, 70, 470, 130, ['NÓN LÁ\nLÀNG CHUÔNG', 'チュオン村の\nノンラー'], { font: F.head, size: 58, weight: 700, lh: 1.05, tracking: 1.5, color: ink, jaFont: F.jaHead, jaSize: 50, name: 'Tên sách' }),
    T(64, 204, 470, 50, front.subtitle.map(strip), { font: F.script, size: 36, lh: 1.3, color: '#6a4a2a', jaFont: F.jaHead, jaSize: 24, name: 'Tên phụ' }),
    HL(66, 270, 80, '#a07a3c', 1.4),
    ...SEAL(W - 52 - 60, 74),
    // bản tiếng Nhật: logo không kèm dòng chữ tiếng Việt "TRƯỜNG ĐẠI HỌC FPT"
    IMG(60, H - 92, 112, 32, ['Logo FPT', 'FPTロゴ'], { fit: 'contain', name: 'Logo', srcJa: PHOTOS['Logo FPT Education'] }),
    T(190, H - 88, 330, 34, front.team, { size: 10.5, lh: 1.5, color: ink, jaFont: F.jaSans, name: 'Thông tin' })
  )
}

// ═════════════════════════════════════════ MỤC LỤC (cặp trang 2–3: mở bìa là thấy ngay, điền sau khi biết số trang)
const tocPages = [new Page({ chapter: 0, bg: C.cream, hideNumber: true, paper: 'khung' }), new Page({ chapter: 0, bg: C.cream, hideNumber: true, paper: 'khung' })]
tocPages.forEach((p) => (p.fixed = true))

// ═════════════════════════════════════════ LỜI MỞ ĐẦU
// góp ý 04/11 (Minh Ánh, Bản sửa lần 1): lời mở đầu gọn trong MỘT cặp trang, chữ nhỏ lại, ảnh nhóm 4 người, đơn giản,
// thêm họa tiết sen. Nguyên văn năm đoạn của nhóm (tab "Mở đầu"):
//   trái = tiêu đề + ảnh nhóm + đoạn 1–2 · phải = đoạn 3–5 + ký tên + cụm sen nét mảnh.
// Cặp trang sau: trái = "Trong cuốn sách này" (ba thẻ chương bấm được, vừa đúng một trang) · phải = trang hướng dẫn đọc sách.
let contents = null
let guidePage = null
{
  const f = new Flow(0, ['LỜI MỞ ĐẦU', 'はじめに'], [])
  const p = f.unit()
  mark(1, preface.title, p, '—')
  p.add({ ...DECO('sen-canh', p.x1 - 96, 58, 96, 96, 0.5), name: 'Họa tiết' })
  const to = { size: 34, font: F.head, lh: 1.15, jaSize: 31 }
  p.add(T(p.x0, 90, p.cw - 130, 44, preface.title, { ...to, color: C.title, jaFont: F.jaHead, name: 'Tiêu đề' }))
  p.add(HL(p.x0, 144, 56, ACC[0], 1.4))
  const [p1, p2, p3, p4, p5] = preface.paras
  // góp ý: thu nhỏ chữ lời mở đầu một chút để gọn trong một cặp trang
  const PO = { size: 13, lh: 1.6, jaSize: jaPt(13, 1.12) }
  const po = { free: true, budget: false, after: 10, ...PO }
  // 08/11 (tab Bổ sung: "to ảnh hơn, nguồn ghi xuống dưới"): ảnh nhóm khung lớn nhất mà đoạn 1 vẫn vừa trang trái
  // (đoạn 2 sang trang phải), chú thích ngay dưới ảnh thay cho cột bên cạnh
  const ph = capH(preface.photo, CW) + 6 + 18
  const need = textH(p1, CW, PO) + 12
  const r = [R.std, 0.7, R.wide, R.cin, R.pan, 0.4].find((x) => 164 + CW * x + ph + need <= BOT) ?? 0.4
  f.y = figure(p, p.x0, 164, CW, CW * r, preface.photo, { capBelow: true }) + 18
  f.prose([p1], po)
  f.page()
  f.prose([p2, p3, p4, p5], po)
  const sg = { size: 15, lh: 1.45, font: F.hand, jaSize: 14 }
  const sh = textH(preface.sign, 260, sg)
  f.place(sh, (pg, y) => pg.add(T(pg.x1 - 260, y, 260, sh, preface.sign, { ...sg, align: 'right', color: C.ink2, jaFont: F.jaHand, name: 'Ký tên' })), 12)
  // 08/11: đoạn 2 sang trang phải (ảnh nhóm to hơn) → trang phải chỉ còn chữ: hình nón vẽ nét nhỏ ở góc dưới, cạnh chữ ký
  {
    const q = f.p
    if (BOT - f.y > 30) q.add({ ...DECO('non-line', q.x0 - 4, Math.min(f.y - sh - 4, BOT - 60), 84, 58, 0.55), name: 'Hình vẽ' })
  }
  {
    // cụm sen nét mảnh lấp chân trang phải (góp ý: trang này đơn giản thôi, có thể thêm họa tiết hoa sen)
    const q = f.p
    const room = BOT - f.y - 6
    if (room > 60) {
      const dh = Math.min(room, 190)
      q.add({ ...DECO('lotus-pond', q.x0 + (q.cw - dh * 1.6) / 2, BOT - dh, dh * 1.6, dh, 0.6), name: 'Hình vẽ' })
    }
    q.fixed = true
  }
  f.p.fixed = true
  pages[pages.length - 2].fixed = true
  f.p = null

  // "Trong cuốn sách này": trọn một trang đơn (góp ý: tr. 6 chỉ chiếm một trang A4) — tiêu đề + ba thẻ chương
  const c = new Page({ chapter: 0 })
  runningHead(c, ['TRONG CUỐN SÁCH NÀY', '本書の構成'])
  c.fixed = true
  const cy = sectionHead(c, TOP, null, preface.contentsTitle, ['Ba chương của cuốn sách', '三つのパート'])
  const n = preface.chapters.length
  const gap = 16
  const cardH = Math.min(170, (BOT - cy - (n - 1) * gap) / n)
  const cardH2 = Math.min(cardH, (BOT - 44 - cy - (n - 1) * gap) / n)
  contents = { page: c, y: cy + Math.max(0, (BOT - 44 - cy - n * cardH2 - (n - 1) * gap) / 2), h: cardH2, gap }
  tipBox(c, BOT - 34, ['Bấm vào một thẻ chương để lật tới chương đó', 'パートのカードをクリックすると、そのパートへ移動します'], { size: 14, jaSize: 12.5 })
  guidePage = new Page({ chapter: 0 })
  guidePage.fixed = true
}

// ═════════════════════════════════════════ CHƯƠNG 1
{
  const ch = ch1
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: thiếu nữ áo dài đội nón lá', '章扉写真：アオザイをまとったベトナム人女性とノンラー'],
    alt: ['Ảnh toàn trang: nón lá xếp chồng ở chợ Chuông', '全面写真：チュオンの市場に積まれたノンラー'],
  })
  mark(1, ch.title, left, '01')
  const f = new Flow(1, ch.label, [...POOL[1]])

  // 1.1 — khái niệm, công dụng → hình dáng nón lá phổ biến → giá trị văn hóa và thẩm mỹ (thứ tự theo Doc)
  const s11 = ch.life
  mark(2, s11.title, f.section('1.1', s11.title), '1.1')
  // 08/11: ảnh theo bản Nhật của nhóm — sau đoạn khái niệm: nón (1-02); sau đoạn công dụng: 1-03, 1-04
  for (const b of s11.blocks.slice(0, 2)) {
    f.block(b.h)
    f.prose(b.p)
    if (b.images?.length === 1) f.figure(b.images[0])
    else if (b.images) f.row(b.images)
  }

  // hình dáng nón lá phổ biến — góp ý 04/11 (Khánh Linh, Bản sửa lần 1): tách thành 3 trang
  //   trái: tiêu đề + dẫn + ghi chú · phải: nhóm nón hình chóp · trái: nhóm nón tròn vành rộng
  // ảnh từng kiểu nón trong khung VUÔNG (góp ý Minh Ánh: thấy trọn chiếc nón mà chưa cần bấm phóng to)
  const sh = ch.shapes
  f.unit()
  f.y = blockHead(f.p, f.y, sh.title)
  f.prose([sh.intro], { free: true })
  f.note(sh.outro)
  {
    // hai dáng nón vẽ nét mảnh cạnh nhau (chóp nhọn / tròn vành rộng) — minh họa đúng nội dung trang
    const p = f.p
    const dh = Math.min(170, f.bot - f.y - 40)
    if (dh > 80) {
      p.add({ ...DECO('non', p.x0 + CW * 0.06, f.y + 10, CW * 0.42, dh, 0.95), name: 'Hình vẽ' }, { ...DECO('khung-non', p.x0 + CW * 0.52, f.y + 10 + dh * 0.25, CW * 0.42, dh * 0.75, 0.95), name: 'Hình vẽ' })
      f.y += dh + 24
    }
  }
  f.fillRest()
  // lưới ảnh từng kiểu nón: khung vuông, ô tên cao bằng nhau, hàng cuối canh giữa
  const grid = (g, cols) => {
    const gap = 16
    const nameO = { font: F.head, size: 16, lh: 1.25, jaSize: 15.5 }
    const placeO = { size: 12, lh: 1.35 }
    const rows = Math.ceil(g.items.length / cols)
    f.y = blockHead(f.p, f.y, g.name)
    f.prose([g.text], { after: 14, free: true })
    const p = f.p
    // ô vuông lớn nhất còn vừa phần trang còn lại
    const gridCap = (pl, hint) => fmtCap([pl[0], pl[1]], hint[0])
    const hintOf = (n, pl) => [`${n[0]} — ${pl[0]}`, `${strip(n[1])} — ${pl[1]}`]
    // ô chưa có ảnh (trước 06/11: nón thúng Nghệ An) → hình vẽ 16 vòng nón + dòng địa phương không số ảnh
    const noPhoto = (n, pl) => /Nghệ An/.test(pl[0]) && !PHOTOS[hintOf(n, pl)[0]]
    const plH = (n, pl, w) => textH(noPhoto(n, pl) ? pl : numCap(gridCap(pl, hintOf(n, pl)), 99), w, placeO)
    // 08/11: chú thích ô dài thêm phần nguồn → đo chữ theo đúng bề ngang ô (lặp hai lần), ô không bị thu nhỏ quá mức
    const nameAt = (w) => Math.max(...g.items.map(([n, pl]) => textH(n, w, nameO) + 4 + plH(n, pl, w)))
    const fitW = (w) => Math.min((CW - gap * (cols - 1)) / cols, (f.bot - f.y - 20 - (rows - 1) * 14) / rows - 8 - nameAt(w))
    const cw = fitW(fitW(fitW(160)))
    const nameH = Math.max(...g.items.map(([n, pl]) => textH(n, cw, nameO) + 4 + plH(n, pl, cw)))
    const cell = cw
    // dồn khối lưới xuống giữa phần trang còn lại
    const gh = rows * (cell + 8 + nameH) + (rows - 1) * 14
    const y0 = f.y + Math.max(0, (f.bot - f.y - gh) / 2 - 10)
    g.items.forEach(([name, place], i) => {
      const row = Math.floor(i / cols)
      const inRow = Math.min(cols, g.items.length - row * cols)
      const off = (CW - (inRow * cw + (inRow - 1) * gap)) / 2
      const gx = p.x0 + off + (i % cols) * (cw + gap)
      const gy = y0 + row * (cell + 8 + nameH + 14)
      const hint = [`${name[0]} — ${place[0]}`, `${strip(name[1])} — ${place[1]}`]
      if (noPhoto(name, place)) {
        // "Nón thúng — Nghệ An": chưa có ảnh nón thúng xứ Nghệ (góp ý: không lấy ảnh nón Chuông gọi là Nghệ An) →
        // ô nền nhạt + hình vẽ 16 vòng nón nhìn từ trên xuống (dáng nón thúng bằng, tròn), không để khung trống
        p.add(RECT(gx, gy, cw, cell, TINT[p.chapter] ?? TINT[0], { radius: 2, name: 'Nền ô' }))
        p.add(RECT(gx + 6, gy + 6, cw - 12, cell - 12, 'none', { stroke: C.gold, sw: 0.7, dash: '3 2.5', opacity: 0.6, radius: 1, name: 'Đường khâu' }))
        p.add({ ...DECO('vong-non', gx + cw * 0.14, gy + cell * 0.14, cw * 0.72, cell * 0.72, 0.5), name: 'Hình vẽ' })
      } else {
        // góp ý "chuyển khung ảnh sang khung vuông giống hai ảnh ở cuối trang 15, để nó hiện toàn bộ cái nón" (soát 06/11:
        // ảnh nằm lọt giữa nền trắng trông như viền dày): ảnh phủ kín ô vuông, khung dời theo chiếc nón — chỉ khi cả chiếc
        // nón vẫn nằm trọn trong ô; nón rộng quá ô vuông thì như soát 04/11 (B11): hiện trọn ảnh trên nền giấy nhạt của ô
        const sj = subjOfCap(hint)
        const fr = sj && subjFrame(sj, cw, cell)
        if (fr && fr.cut <= 0.03) p.add(IMG(gx, gy, cw, cell, hint, { pos: fr.pos }))
        else {
          // phần dư của ô lấp bằng chính ảnh phóng to, nhoè (không để dải nền trắng trên / dưới như viền dày)
          p.add({ ...IMG(gx, gy, cw, cell, hint, { fit: 'cover' }), name: 'Nền ô', blur: 1, pos: '50% 50%' })
          p.add(IMG(gx, gy, cw, cell, hint, { fit: 'contain' }))
        }
      }
      const nh = textH(name, cw, nameO)
      p.add(T(gx, gy + cell + 6, cw, nh, name, { ...nameO, color: C.ink, align: 'center', jaFont: F.jaHead, name: 'Tên nón' }))
      if (noPhoto(name, place)) {
        for (const [k, lang] of [[0, 'vi'], [1, 'ja']]) {
          const one = k ? [place[0], place[1]] : [place[0], null]
          const nk = textH1(name, cw, nameO, k)
          p.add({ ...T(gx, gy + cell + 10 + nk, cw, textH(one, cw, placeO), one, { ...placeO, color: C.muted, align: 'center', jaFont: F.jaSans, name: 'Địa phương' }), only: lang })
        }
      } else {
        // soát 04/11 (B10): dòng địa phương = chú thích ảnh "Ảnh N: địa phương (Nguồn: …)" (ảnh báo chí ghi tên báo)
        const cp = gridCap(place, hint)
        p.add(T(gx, gy + cell + 10 + nh, cw, textH(numCap(cp, 99), cw, placeO), cp, { ...placeO, italic: true, color: C.muted, align: 'center', jaFont: F.jaSans, name: 'Chú thích ảnh' }))
      }
    })
    f.y = y0 + gh + 22
    p.fixed = true
  }
  f.page()
  grid(sh.groups[0], 3)
  f.page()
  grid(sh.groups[1], 2)
  // giá trị văn hóa và thẩm mỹ: đoạn có dấu ¹ (Nhà hát Cao Văn Lầu) cùng trang với chú thích của nó;
  // mở ở trang mới, phần trống dưới lưới hình dáng nón lấp ảnh (trang lưới không thành trang chữ)
  const val = s11.blocks[2]
  f.fillRest()
  f.page()
  // 08/11: ảnh nhóm gắn đứng ngay sau đoạn của nó (như bản Nhật): áo dài → bảo tàng → Cao Văn Lầu + thời trang
  f.block(val.h)
  f.prose(val.p.slice(0, 1))
  f.row(val.images.aoDai)
  f.prose(val.p.slice(1, 2))
  f.row(val.images.museum)
  f.noted([val.p[2]], val.notes)
  f.figure(val.images.theater)
  f.row(val.images.fashion)
  f.prose(val.p.slice(3))

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
      // 08/11: ảnh nhóm gắn (1-22, 1-23): 「二つの国宝、ゴックルー銅鼓とダオティン銅製容器 (国立歴史博物館)」
      ['Trống đồng Ngọc Lũ — nguồn: Bảo tàng Lịch sử Quốc gia', 'ゴックルー{銅鼓|どうこ} — 出典：国立歴史博物館'],
      ['Thạp đồng Đào Thịnh — nguồn: Bảo tàng Lịch sử Quốc gia', 'ダオティン銅製容器 — 出典：国立歴史博物館'],
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

  // 1.3 — làng Chuông: kho ảnh lấp trang chỉ còn ảnh nón / chợ / đình làng Chuông (góp ý: ảnh nón bảo tàng khác
  // không phải nón Chuông thì không đặt trong mục này)
  f.pool = [...KET_UP, ...f.pool.filter((c) => !/Bảo tàng Phụ nữ|Bảo tàng Mỹ thuật|tranh/.test(c[0]))]
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
  // C12 (Thu Nguyệt) từng đặt ảnh minh họa AI "dâng nón tiến cống trong cung" ở đây. Soát đọc lần đầu 05/11 + anh Hải đồng ý
  // gỡ: cung điện kiểu Tàu, người dâng đội nón chóp (thời đó Bắc Bộ đội nón ba tầm / quai thao), chú thích "AIで作成" làm
  // người đọc Nhật nghi cả sách ảnh tư liệu. Ảnh Salles 1896 (phạm vi công cộng) ngay sau dồn lên thay chỗ.
  // hai ảnh khung 16:9 để cùng vừa một trang (ảnh AI ở trang trước chiếm chỗ → khung 3:2 đẩy IMG_2577 sang trang sau, trống nửa trang)
  f.figure(ab.images[1], { ratio: R.cin })
  f.figure(ab.museum[0], { ratio: R.cin })
  // 08/11: ảnh 1-30 (ông Tuy làm nón) + 1-31 (đình Chuông), nhóm gắn liền nhau ngay sau đoạn tiến cống / kháng chiến
  f.row([ab.tuy, ab.dinh], { ratio: R.std })
  f.prose(ab.p.slice(2))
  f.row([ab.museum[1], ab.museum[2]], { ratio: R.por })

  // 1.3.2 các loại nón: ảnh lớn + thẻ từng loại (ảnh tách nền, khung vuông)
  const ty = vg.types
  f.unit()
  mark(3, ty.h, f.p, ty.id)
  f.y = blockHead(f.p, f.y, ty.h, ty.id)
  f.figure(ty.hero, { ratio: R.std })
  f.prose([ty.intro])
  // mỗi kiểu nón một trang kiểu tạp chí (theo mockup của nhóm, tab "Yêu cầu hình thức" → Thu Nguyệt): số thứ tự thật to
  // + tên nón có gạch chân, đoạn văn thụt vào cột tên, ảnh lớn + cột ảnh cận chi tiết có nhãn, khung đặc điểm nổi bật,
  // hoa lá nét mảnh ở góc trang. Ảnh thật của nhóm (Doc: "sử dụng ảnh thật"); ảnh chi tiết cắt cận từ chính ảnh lớn.
  const TYPE_EXTRA = {
    'Nón lá hình chóp truyền thống': {
      // ảnh IMG_7347 (góp ý: nón chóp cũ mất đầu): thấy trọn chiếc nón, khung gần vuông
      hero: { r: 0.95, pos: '50% 50%' },
      details: [[['Đỉnh nón', '頂'], 52, 28, 3], [['Mặt lá phẳng, đường khâu đều', '平らな葉面とそろった縫い目'], 40, 54, 3], [['Vành nón', '縁'], 80, 74, 3]],
      box: [['Đặc điểm nổi bật', '主な特徴'], [['Dáng chóp nhọn', '先のとがった円錐形'], ['Lá lụi khâu trên 16 vòng nứa', 'ラルイを16本のヌアひごの輪に縫い付け'], ['Màu trắng sáng hoặc vàng ngà', '明るい白か象牙色'], ['Gọn nhẹ, dùng hằng ngày, làm quà tặng', '軽く、日常使いにも贈り物にも']]],
    },
    'Nón lá già ghép sống': {
      hero: { r: 0.85, pos: '50% 50%' },
      details: [[['Núm chóp', '頂の飾り'], 58, 18, 3.2], [['Đường sống lá tỏa đều', '放射状の葉の筋'], 40, 58, 2.6], [['Vành nón', '縁'], 62, 72, 2.4]],
      box: [['Đặc điểm nổi bật', '主な特徴'], [['Lá cọ già ghép, khâu trên khung', '古いヤシの葉を継ぎ、骨組みに縫う'], ['Màu nâu nhạt', '淡い茶色'], ['Sống lá tỏa từ đỉnh xuống vành', '頂から縁へ広がる葉の筋'], ['Vẻ ngoài mộc mạc', '素朴な姿']]],
    },
    'Nón Ba tầm': {
      // ảnh chụp trọn chiếc nón gần vuông: khung ngang 4:3 cắt mất mép trên + thành nón → khung gần vuông, canh giữa nón
      hero: { r: 1.15, pos: '50% 47%' },
      details: [[['Núm chóp', '頂の飾り'], 50, 37, 3.4], [['Lá Hồ lợp tỉ mỉ', '丁寧に葺かれたホー葉'], 28, 46, 3], [['Thành nón cao', '高い側面'], 50, 84, 2.6]],
      box: [['Kích thước phổ biến', '一般的な大きさ'], [['Đường kính 70–80 cm', '直径70〜80cm'], ['Thành cao 10–12 cm', '側面の高さ10～12cm'], ['Còn gọi là nón Mười', '別名「ノン・ムオイ」'], ['Lợp từ lá Hồ tuyển chọn', '選び抜いたホー葉で葺く']]],
    },
    'Nón Quai thao': {
      // ảnh IMG_7879 (08/11: đúng ảnh nhóm gắn 1-36 — mặt trên, quai lụa đỏ): chụp từ trên xuống, thấy trọn mặt nón
      hero: { r: 0.9, pos: '50% 50%', fit: 'contain' },
      details: [[['Chùm thao trang trí', '房飾り'], 30, 66, 2.6], [['Núm chóp, mặt nón rộng', '頂の飾りと広い面'], 50, 48, 2.3], [['Quai lụa', 'あごひも'], 14, 32, 2.6]],
      box: [['Kích thước phổ biến', '一般的な大きさ'], [['Đường kính 30 cm · 70 cm · 90 cm', '直径30cm・70cm・90cm'], ['Thành cao 3–4 cm', '側面の高さ3～4cm'], ['Mặt nón rộng, tương đối phẳng', '広く比較的平らな面と低い側面'], ['Quai tết, chùm thao quanh vành', '編んだあごひもと房飾り']]],
    },
    'Nón thúng': {
      // ảnh IMG_8480 (góp ý: ảnh nón thúng cũ sai): chụp thẳng từ trên xuống
      // soát 04/11 (B11): khung vuông cắt mất vành → hiện trọn chiếc nón
      hero: { r: 1, pos: '50% 50%', fit: 'contain' },
      details: [[['Núm giữa mặt nón', '中央の飾り'], 50, 48, 3.2], [['Vành rất rộng', 'とても広いつば'], 86, 50, 2.4]],
      box: [['Đặc điểm nổi bật', '主な特徴'], [['Vành rất rộng', 'とても広いつば'], ['Lòng sâu như cái thúng', '籠のように深い形'], ['Đi cùng quai thao, áo tứ thân', '房飾りのあごひも、アオ・トゥータンとともに'], ['Nay dùng biểu diễn, trưng bày', '今は舞台や展示で']]],
    },
    'Nón nhà sư (Nón thầy tu)': {
      details: [[['Chóp thấp', '低い頂'], 48, 38, 3], [['Đường kính rộng', '広い直径'], 50, 86, 2.4]],
      box: [['Đặc điểm nổi bật', '主な特徴'], [['Đường kính khoảng 50 cm', '直径約50cm'], ['Chóp được hạ thấp', '頂を低く改良'], ['Cân đối cùng áo cà sa', '袈裟と釣り合う形'], ['Đón nhận tại Ấn Độ, nhiều nước Phật giáo', 'インドなど多くの仏教国で愛用']]],
    },
    'Nón lụa': {
      details: [[['Lụa vẽ hoa', '花を描いた絹'], 44, 44, 2.6], [['Mặt lụa vân hoa', '花模様の絹地'], 24, 82, 3.4]],
      box: [['Đặc điểm nổi bật', '主な特徴'], [['Bọc lụa tơ tằm Vạn Phúc (Hà Đông)', 'ヴァンフック（ハドン）の絹で包む'], ['Màu sắc, hoa văn đa dạng', '豊かな色と柄'], ['Phụ kiện thời trang, quà lưu niệm', 'ファッション小物・お土産']]],
    },
    'Nón lụa hai mặt': {
      details: [[['Mặt lụa màu ngọc', '青緑の絹の面'], 50, 56, 2.2], [['Vành nón', '縁'], 22, 60, 3]],
      box: [['Đặc điểm nổi bật', '主な特徴'], [['Hai mặt khác màu hoặc họa tiết', '表と裏で異なる色・柄'], ['Giữ dáng nón chóp quen thuộc', 'なじみのある円錐形'], ['Phối màu linh hoạt', '色の組み合わせを自由に']]],
    },
    'Nón cô dâu': {
      details: [[['Họa tiết mặt trong', '内側の模様'], 74, 66, 2.4], [['Mặt ngoài trắng', '白い外側'], 50, 24, 2.6]],
      box: [['Đặc điểm nổi bật', '主な特徴'], [['Họa tiết vẽ ở mặt trong', '内側に模様を描く'], ['Dùng trang trí, chụp ảnh cưới', '飾りや結婚写真の撮影に'], ['Giữ hình dáng nón truyền thống', '伝統的な形を保つ']]],
    },
  }
  const to = { size: 13.5, lh: 1.55, jaSize: jaPt(13.5) }
  const no = { size: 25, font: F.head, lh: 1.2, jaSize: 22 }
  const bo = { size: 13, lh: 1.4, jaSize: 12.5 }
  const TONE = [ACC[1], '#9b5a4a'] // xen hai màu như mockup (xanh lá / đỏ đất)
  let typeNo = 0
  const typeCard = (t, kicker) => {
    const ex = TYPE_EXTRA[t.name[0]] ?? {}
    const tone = TONE[typeNo % 2]
    const num = String(++typeNo).padStart(2, '0')
    const p = f.page()
    const ix = p.x0 + 112 // cột chữ thụt sau số thứ tự
    const iw = p.x1 - ix
    let y = TOP
    if (kicker) {
      p.add(T(p.x0, y, CW, 16, kicker.map((x) => strip(x).toUpperCase()), { size: S.label, tracking: 2.4, weight: 700, color: tone, jaFont: F.jaSans, name: 'Nhóm' }))
      y += 46
    }
    p.add(T(p.x0 - 4, y - 10, 112, 104, [num, null], { font: F.head, size: 84, color: tone, lh: 1.1, name: 'Số thứ tự' }))
    const tw = iw - 20
    const nh = textH(t.name, tw, no)
    p.add(T(ix, y + 4, tw, nh, t.name, { ...no, weight: 700, color: tone, jaFont: F.jaHead, name: 'Tên nón' }))
    p.add(HL(ix, y + 10 + nh, Math.min(tw, 300), tone, 0.8))
    y += 26 + nh
    const th = textH(t.text, iw, to)
    p.add(T(ix, y, iw, th, t.text, { ...to, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
    // cành hoa nét mảnh trong cột trống dưới số thứ tự (như mockup), chỉ khi đoạn văn đủ dài để có chỗ
    const colH = y + th - (y - 26 - nh + 100)
    if (colH > 120) {
      const dh2 = Math.min(colH, 190)
      const m = pickMotif(p, 't', Math.min(dh2 * 0.62, 100), dh2, 80)
      if (m) p.add({ ...DECO(m.name, p.x0 - 6, y + th - m.h, m.w, m.h, 0.7), name: 'Hình vẽ' })
    }
    y = Math.max(y + th, TOP + 96) + 18
    // khung đặc điểm (cuối trang) + chú thích cuối trang (nếu có)
    const bot = t.notes ? footnotes(p, t.notes) : BOT
    const [bt, items] = ex.box ?? [null, []]
    const bw2 = (CW - 46) / 2
    // mỗi hàng hai ý, cao theo ý dài hơn của chính hàng đó
    const rowHs = []
    for (let i = 0; i < items.length; i += 2) rowHs.push(Math.max(...items.slice(i, i + 2).map((it) => textH(it, bw2 - 12, bo)), 16))
    const rowY = rowHs.map((_, r) => rowHs.slice(0, r).reduce((a, h) => a + h + 6, 0))
    const boxH = items.length ? 38 + rowY.at(-1) + rowHs.at(-1) + 12 : 0
    const capH0 = 18
    // ảnh lớn + cột ảnh chi tiết
    const room = bot - y - capH0 - (boxH ? boxH + 16 : 0)
    // cột ảnh chi tiết: mỗi ô cao ít nhất ~78pt (chỗ thấp thì bớt ô, không để thành dải mỏng)
    const dets = (ex.details ?? []).slice(0, Math.max(1, Math.min(3, Math.floor((room + 10) / 108))))
    const hw0 = dets.length ? CW * 0.64 : CW
    const hh = Math.min(room, hw0 * 1.2)
    // ex.hero.r: tỉ lệ khung (rộng / cao) cho ảnh cần thấy trọn vật — khung hẹp lại, cột ảnh chi tiết rộng ra
    const hw = ex.hero?.r ? Math.min(hw0, hh * ex.hero.r) : hw0
    const dw = CW - hw - 14
    const hint = [`${t.name[0]} — ảnh sản phẩm`, `${strip(t.name[1])} — 製品写真`]
    p.add(IMG(p.x0, y, hw, hh, hint, { fit: ex.hero?.fit ?? 'cover', ...(ex.hero?.pos ? { pos: ex.hero.pos } : {}) }))
    const cap = fmtCap(t.credit ? [`${t.name[0]} · ${t.credit[0]}`, `${strip(t.name[1])}・${t.credit[1]}`] : t.name, hint[0])
    p.add(T(p.x0, y + hh + 5, hw, null, cap, { size: 11, italic: true, color: C.muted, lh: 1.3, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
    if (dets.length) {
      const lh = 22
      const dh = (hh - (dets.length - 1) * 8 - dets.length * lh) / dets.length
      dets.forEach(([label, cx, cy, z], i) => {
        const dy = y + i * (dh + lh + 8)
        p.add(IMG(p.x0 + hw + 14, dy, dw, dh, hint, { crop: { x: cx, y: cy, z }, name: 'Ảnh chi tiết' }))
        p.add(T(p.x0 + hw + 14, dy + dh + 5, dw, lh - 6, label, { size: 11.5, lh: 1.25, color: C.ink2, jaFont: F.jaSans, name: 'Nhãn chi tiết' }))
      })
    }
    y += hh + capH0 + 16
    if (boxH) {
      p.add(RECT(p.x0, y, CW, boxH, '#fbf6ea', { radius: 6, stroke: C.line, sw: 0.8, name: 'Khung đặc điểm' }))
      p.add({ ...DECO('non-line', p.x0 + 14, y + 8, 34, 18, 0.9), name: 'Hình vẽ' })
      p.add(T(p.x0 + 56, y + 9, CW - 70, 20, bt, { font: F.head, size: 15, weight: 700, color: tone, lh: 1.3, jaFont: F.jaHead, jaSize: 14, name: 'Tên khung' }))
      items.forEach((it, i) => {
        const bx = p.x0 + 18 + (i % 2) * (bw2 + 10)
        const by = y + 36 + rowY[Math.floor(i / 2)]
        p.add(ELL(bx, by + 6, 4, 4, tone, { name: 'Chấm' }), T(bx + 12, by, bw2 - 12, rowHs[Math.floor(i / 2)], it, { ...bo, color: C.ink2, jaFont: F.jaSans, name: 'Đặc điểm' }))
      })
    }
    f.y = BOT // mỗi kiểu một trang
  }
  ty.list.forEach((t) => typeCard(t))
  ty.styled.list.forEach((t, i) => typeCard(t, i === 0 ? ty.styled.h : null))
  // lời kết của mục: đoạn văn thường (khối ghi chú nghiêng 15 dòng quá nặng)
  f.prose([ty.outro])
  // góp ý 04/11 (Thu Nguyệt): hai ảnh cuối mục thay bằng OCOP.JPG + Làm nón truyền thống.JPG
  f.row(
    [
      ['Giấy chứng nhận OCOP và các mẫu nón trưng bày tại một cơ sở làng Chuông', 'OCOPの認定証'],
      ['Nghệ nhân làng Chuông làm nón truyền thống', 'ノンラーの作り手と一緒にノンラーを作る様子'],
    ],
    { ratio: R.sq }
  )
  f.end()
}

// ═════════════════════════════════════════ CHƯƠNG 2
const stepPages = [] // { no, name, page } — cho dải tên công đoạn
let stripPage = null
let stripRight = null
{
  const ch = ch2
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: đôi bàn tay nghệ nhân khâu nón trên khuôn', '章扉写真：型の上でノンラーを縫う職人の手'],
    alt: ['Ảnh toàn trang: nón lá Làng Chuông', '全面写真：チュオン村のノンラー'],
  })
  mark(1, ch.title, left, '02')
  const f = new Flow(2, ch.label, [...POOL[2]])
  // góp ý 04/11 (Thu Nguyệt): phần giới thiệu chương chỉ 2 trang chữ + 2 ảnh — ảnh 1 = ảnh mở chương (khung và lá),
  // ảnh 2 = thư mục "Ảnh tr43" của nhóm. Trang mở chương phải là trang chữ thứ nhất → cặp sau: trái chữ, phải ảnh.
  f.page()
  f.noted(ch.intro, ch.notes, { budget: false })
  {
    // trang chữ giới thiệu chương: hình vẽ nét mảnh chồng nón + tre lấp phần dưới (không để nửa trang trống)
    const q = f.p
    const room = q.els.filter((e) => e.name === 'Chú thích').reduce((m, e) => Math.min(m, e.y - 30), BOT) - f.y
    // 08/11: ảnh nhóm gắn cuối phần dẫn chương (2-01, 「ノンラーを縫う職人の様子」) thay hình vẽ
    const cap = ['Người thợ khâu nón', 'ノンラーを{縫|ぬ}う職人の様子']
    const ch0 = capH(cap, q.cw * 0.6)
    if (room > 220) {
      const ih = Math.min(room - 30 - ch0, q.cw * 0.6 * (424 / 330))
      const iw = ih * (330 / 424)
      f.y = figure(q, q.x0 + (q.cw - iw) / 2, f.y + 10, iw, ih, cap) + 10
    } else if (room > 140) {
      const ih = Math.min(room - 20, q.cw * (310 / 640))
      const iw = ih * (640 / 310)
      q.add({ ...DECO('still-non', q.x0 + (q.cw - iw) / 2, f.y + (room - ih) / 2, iw, ih, 0.95), name: 'Hình vẽ' })
    }
  }
  f.p.fixed = true
  f.p = null
  {
    const q = photoPage(['Người thợ hoàn thiện bước luồn nhôi cuối cùng', 'ルオン・ノイの最後の仕上げをする職人'], 2)
    q.fixed = true
  }

  // 2.1 — cấu tạo
  const st = ch.structure
  // góp ý 04/11: ảnh mục 2.1 / 2.1.1 gọn gàng, đúng nội dung (khung, vòng nứa, lớp lá) — không lấp bằng ảnh chợ lộn xộn
  f.pool = [
    ['Khuôn nón — tám gọng tre tụ ở chóp', 'ノンラーの製作型 — 頂点に集まる8本の竹の支柱'],
    ['Bó nứa chẻ sẵn để vót vòng', '輪を削るために割ったヌアの束'],
    ...f.pool.filter((c) => !/chợ|Chợ/.test(c[0])),
  ]
  mark(2, st.title, f.section('2.1', st.title), '2.1')
  f.prose([st.intro])
  // trang mở mục: tiêu đề + đoạn dẫn + ảnh; hai ô "phần khung / phần lá" sang trang phải (không dồn cả mục vào một trang chữ)
  f.figure(['Lá lụi, nón và chỉ màu — nguyên liệu nghề nón trưng bày tại Bảo tàng Dân tộc học Việt Nam', 'ベトナム民族学博物館で展示されているノンラーの製作材料'])
  f.fillRest()
  f.page()
  {
    // hai phần chính theo mockup của nhóm: mỗi phần một hàng — hình vẽ nét mảnh, số tròn, tên phần, mô tả
    const to = { size: 13.5, lh: 1.55, jaSize: jaPt(13.5) }
    const art = ['khung-non', 'la-ba-lop']
    const dw = 150
    const tw = CW - dw - 22 - 34
    st.parts.forEach(([name, text], i) => {
      const nh = textH(name, tw, { size: 18, font: F.head, lh: 1.25 })
      const th = textH(text, tw, to)
      const hh = Math.max(nh + 8 + th, dw * 0.62)
      f.place(hh, (p, y) => {
        const tx = p.x0 + dw + 22
        p.add(
          { ...DECO(art[i], p.x0, y + 2, dw, dw * (i ? 0.7 : 0.58), 0.95), name: 'Hình vẽ' },
          ELL(tx, y - 1, 24, 24, ACC[2], { name: 'Số tròn' }),
          T(tx, y + 2, 24, 18, [String(i + 1), null], { size: 13, weight: 700, align: 'center', color: '#fff', lh: 1.3, name: 'Số' }),
          T(tx + 34, y, tw, nh, name, { font: F.head, size: 18, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên phần' }),
          T(tx + 34, y + nh + 8, tw, th, text, { ...to, color: C.ink2, jaFont: F.jaBody, name: 'Mô tả' })
        )
      }, 26)
    })
    f.figure(['Nghệ nhân Lê Văn Tuy bên khung nón đã lên đủ vành', '輪をすべて付け終えた骨組みを手にする職人レ・ヴァン・トゥイ氏'])
  }
  // 2.1.1 — khung 16 vòng (thứ tự theo Doc: khung trước, lá lợp sau): sơ đồ vòng, dáng thấp như nón thật
  // (cao ≤ 0,72 × bán kính vành, chóp có núm tròn nhỏ — góp ý: hình nón vẽ nhọn quá)
  const fr = st.frame
  mark(3, fr.h, f.block(fr.h, fr.id), fr.id)
  f.prose(fr.p)
  // anh Hải 08/11 (thêm tương tác kéo thả): sơ đồ 16 vòng thành trò kéo vòng nứa từ bó lên khuôn — dáng khuôn thấp như
  // nón thật (cao ≈ 0,7 × bán kính vành), đủ 16 vòng thì hiện nhãn chóp nón / vòng cạp như sơ đồ cũ
  {
    const rh = 206
    f.place(rh, (p, y) =>
      p.add({
        ...WIDGET(p.x0, y, p.cw, rh, 'rings', { name: 'Kéo vòng nứa lên khuôn', data: { accent: ACC[2], labels: { apex: ['← Chóp nón', '← 頂点'], rim: ['← Vòng cạp (vòng 16)', '← 外縁の輪（16本目）'] } } }),
        alt: ['Khuôn nón và bó 16 vòng nứa — kéo từng vòng lên khuôn', 'ノンラーの型と16本のヌアの輪 — 輪をドラッグして型に付ける'],
      })
    )
  }
  f.figure(['Khung nón 16 vòng nứa', 'ヌアで作られた16本の輪からなる骨組み'])
  f.prose(fr.after)
  f.figure(fr.image)
  // 08/11: ảnh 2-03 nhóm gắn cuối mục 2.1.1 (trước đây là ảnh mở mục 1.3.2)
  f.figure(['Nghệ nhân Lê Văn Tuy trong xưởng nón — ảnh: nghệ nhân Lê Văn Tuy', 'ノンラーを作る職人のレ・ヴァン・トゥイ氏 — 写真：職人レ・ヴァン・トゥイ氏'])

  const LAYER_PHOTOS = {
    inner: [['Lớp lá lụi trong — trước khi lợp: khung 16 vòng nứa', 'ラルイの層（内層） — 重ねる前：ヌアで作られた16本の輪からなる骨組み'], ['Lớp lá lụi trong — sau khi lợp', 'ラルイの層（内層）']],
    mo: [['Lớp mo nang — tàu mo trước khi lợp', 'ヌアの稈鞘の層'], ['Lớp mo nang — sau khi lợp', 'ヌアの稈鞘の層（中間層）']],
    outer: [['Lớp lá lụi ngoài — đang lợp', 'ラルイの層（外層） — 重ねているところ'], ['Lớp lá lụi ngoài — sau khi lợp', 'ラルイの層（外層）']],
  }
  // 2.1.2 — ba lớp, gói trong MỘT cặp trang (anh Hải 05/11, ý nhóm ở buổi họp: không cần 3D kiểu này nhưng muốn thấy
  // rõ các lớp trông như nào bằng ảnh thật; "trang trái là mô hình 3 lớp, bấm vào lớp nào thì trang phải hiện ảnh + mô
  // tả của lớp đó, chứ không trải dài 3 lớp nội dung ra mấy trang"). Trước: mô hình + 3 lớp × (chữ + 2 ảnh) chảy 3 trang.
  //   trang trái: tiêu đề, đoạn dẫn, mô hình 3D (mặt lớp phủ ảnh thật, scripts/book/layer-tex.py), đoạn kết
  //   trang phải: nút 1 · 2 · 3 + phần của từng lớp chồng cùng chỗ (tên, mô tả nguyên văn Doc, 2 ảnh trước / sau);
  //   chỉ phần của lớp đang chọn hiện ra (el.tab, src/canvas/tabs.js) — ảnh thu nhỏ / bản in thấy lớp 1
  const ly = st.layers
  const TABS = 'lop-212'
  const LCOL = { inner: '#5f8a4a', mo: '#a95f3c', outer: '#d9962f' }
  mark(3, ly.h, f.block(ly.h, ly.id), ly.id)
  if (f.p.side !== 'left') console.warn('⚠ 2.1.2 không mở ở trang trái: trang ảnh ba lớp sẽ không nằm cạnh mô hình')
  f.prose([ly.intro])
  {
    const oh = textH(ly.outro, CW, { size: BODY.size, lh: BODY.lh, jaSize: BODY.jaSize, paraGap: 8 })
    const lh = Math.max(250, Math.min(470, f.bot - f.y - oh - 24))
    f.place(lh, (p, y) =>
      p.add(WIDGET(p.x0, y, CW, lh, 'layers', { name: 'Mô hình 3 lớp lá', data: { tabSet: TABS, items: ly.items.map((it, i) => ({ name: it[0].map(strip), kind: ly.kinds?.[i] })) } }))
    )
  }
  f.prose([ly.outro])
  f.y = f.bot
  {
    const p = f.page()
    if (p.side !== 'right') console.warn('⚠ trang ảnh ba lớp 2.1.2 không nằm bên phải mô hình')
    // hàng chọn lớp: ba mũi khâu trên đường chỉ nét đứt (src/canvas/widgets/TabsWidget.jsx)
    const th = 62
    p.add(WIDGET(p.x0, f.y + 4, CW, th, 'tabs', { name: 'Chọn lớp lá', data: { set: TABS, items: ly.items.map((it, i) => ({ name: it[0].map(strip), color: LCOL[ly.kinds?.[i]] ?? ACC[2] })) } }))
    const y0 = f.y + 4 + th + 30
    const to = { size: 14, lh: 1.6, jaSize: jaPt(14) }
    const nameO = { font: F.head, size: 24, weight: 700, lh: 1.2 }
    ly.items.forEach((item, i) => {
      const from = p.els.length
      const col = LCOL[ly.kinds?.[i]] ?? ACC[2]
      // tên lớp chữ lớn màu lớp + mô tả nguyên văn Doc, rộng hết khổ chữ
      const nh = textH(item[0], CW, nameO)
      const hh = textH(item[1], CW, to)
      p.add(T(p.x0, y0, CW, nh, item[0], { ...nameO, color: col, jaFont: F.jaHead, name: 'Lớp' }))
      p.add(T(p.x0, y0 + nh + 10, CW, hh, item[1], { ...to, jaFont: F.jaBody, align: 'justify', name: 'Mô tả lớp' }))
      // góp ý 04/11 (Thu Nguyệt): mỗi lớp 2 ảnh thật — trước / sau khi lợp lớp đó. Hai khung CÙNG chiều cao, bề ngang
      // chia theo ảnh (ảnh dọc hẹp, ảnh ngang rộng) sao cho không ảnh nào mất quá 4% vật chính; khung cao nhất còn vừa
      // trang → không cắt nón, không viền nhoè, không để ảnh lọt thỏm
      const pair = LAYER_PHOTOS[ly.kinds?.[i]]
      if (pair) {
        const top = y0 + nh + 10 + hh + 26
        const W2 = CW - 14
        let best = null
        for (let h = Math.min(430, BOT - top - 50); h >= 150 && !best; h -= 4)
          for (let w1 = 120; w1 <= W2 - 120; w1 += 3) {
            const w2 = W2 - w1
            const ch = Math.max(capH(pair[0], w1), capH(pair[1], w2))
            if (top + h + 6 + ch > BOT) continue
            const c = Math.max(cutOf(pair[0], w1, h), cutOf(pair[1], w2, h))
            if (c <= 0.04 && (!best || c < best.c)) best = { w1, w2, h, ch, c }
          }
        if (!best) best = { w1: W2 / 2, w2: W2 / 2, h: 220, ch: Math.max(...pair.map((c) => capH(c, W2 / 2))) }
        // cụm ảnh ngay dưới chữ; chân trang còn trống (ảnh không cao thêm được mà không cắt nón / tay người thợ) thì đặt
        // hoa lá nét mảnh ở góc ngoài như các trang khác (bottomFlora — trang này bố cục riêng nên tự đặt theo từng lớp)
        const yy = top
        const gap = BOT + 24 - (yy + best.h + 6 + best.ch)
        const nat = pair.map((c) => natR(c) ?? R.std)
        if (gap >= 130 && Math.min(...nat) < 1 && Math.max(...nat) > 1.2) {
          // một ảnh ngang + một ảnh dọc mà đặt cạnh nhau thì cả hai nhỏ, chân trang trống (lớp ngoài: "đang lợp" chụp ngang)
          // → so le chồng mép như tr. bước 6: ảnh ngang to ở trên-trái, ảnh dọc dưới-phải đè nhẹ góc ảnh trên; cả hai khung
          // đúng tỉ lệ ảnh (không cắt); chú thích ở hai khoảng còn lại (trên-phải, dưới-trái)
          const [ka, kb] = nat[0] <= nat[1] ? [0, 1] : [1, 0]
          const A = pair[ka]
          const B = pair[kb]
          const avail = BOT - top
          const wa = CW * 0.66
          const ha = wa * nat[ka]
          const hb = Math.min(avail - ha + ha * 0.2, avail * 0.66)
          const wb = hb / nat[kb]
          const cA = fmtCap(A)
          const cB = fmtCap(B)
          const wA = CW - wa - 16
          const wB = CW - wb - 16
          const items = [
            [ka, () => p.add(IMG(p.x0, top, wa, ha, A, { fit: 'cover' }), HL(p.x1 - wA, top + 4, 40, col, 1.4), T(p.x1 - wA, top + 14, wA, textH(numCap(cA, 0), wA, capOpt), cA, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))],
            [kb, () => {
              const hc = textH(numCap(cB, 0), wB, capOpt)
              p.add(IMG(p.x1 - wb, BOT - hb, wb, hb, B, { fit: 'cover' }), HL(p.x0 + wB - 40, BOT - hc - 12, 40, col, 1.4), T(p.x0, BOT - hc, wB, hc, cB, { ...capOpt, italic: true, align: 'right', color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
              // khoảng trống dưới ảnh ngang, cạnh ảnh dọc: cụm sen nét mảnh mờ (họa tiết chân trang của sách)
              const free = BOT - hc - 24 - (top + ha + 10)
              const m = free >= 70 && pickMotif(p, 'k', wB - 10, Math.min(free, 130))
              if (m) p.add({ ...DECO(m.name, p.x0 + (wB - m.w) / 2, top + ha + 10 + (free - m.h) / 2, m.w, m.h, 0.5), name: 'Hình vẽ', fillDeco: true })
            }],
          ]
          // thứ tự phần tử = thứ tự số ảnh (Ảnh N) và lớp chồng: ảnh dọc vẽ sau để đè lên góc ảnh ngang
          items.sort((u, v) => (u[0] === ka ? -1 : 1) - (v[0] === ka ? -1 : 1)).forEach(([, draw]) => draw())
          p.els.slice(from).forEach((e) => (e.tab = { set: TABS, i }))
          return
        }
        const fm = gap >= 64 && pickMotif(p, 'k', p.cw * 0.5, Math.min(gap - 12, 120))
        if (fm) p.els.push({ ...DECO(fm.name, p.x1 - fm.w + 10, BOT + 24 - fm.h, fm.w, fm.h, 0.6), name: 'Hình vẽ', fillDeco: true })
        let x = p.x0
        pair.forEach((c, k) => {
          const w = k ? best.w2 : best.w1
          const sj = subjOfCap(c)
          const fr = sj && subjFrame(sj, w, best.h)
          p.add(IMG(x, yy, w, best.h, c, fr ? { pos: fr.pos } : {}))
          p.add(T(x, yy + best.h + 6, w, capH(c, w), fmtCap(c), { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
          x += w + 14
        })
      }
      p.els.slice(from).forEach((e) => (e.tab = { set: TABS, i }))
    })
    p.fixed = true
    f.y = f.bot
  }

  // 2.2 — nguyên liệu & dụng cụ: mỗi trang hai món, ảnh so le trái / phải
  const mt = ch.materials
  mark(2, mt.title, f.section('2.2', mt.title), '2.2')
  // anh Hải 08/11 ("hiệu ứng mở hộp"): hộp đồ nghề ở trang mở mục — mở nắp, các nguyên liệu / dụng cụ của mục hiện ra
  // (ảnh + tên đúng như trong sách); bấm một món → ảnh to + nút lật tới trang tả món đó (số trang điền sau khi dàn)
  const boxItems = [...mt.items.map((x) => [x, 0]), ...mt.tools.map((x) => [x, 1]), ...(mt.small ?? []).map((x) => [x, 1])].map(([[name, , hint], group]) => ({ name, group, src: hint ? PHOTOS[hint[0]] ?? '' : '' }))
  // hộp bên trái, ảnh lá lụi phơi nắng (ảnh mở mục) bên phải — cùng một hàng, mục không dài thêm trang
  const boxW = Math.round(CW * 0.57)
  const boxH = 470
  const boxEl = { ...WIDGET(0, 0, boxW, boxH, 'toolbox', { name: 'Hộp đồ nghề', data: { title: ['Hộp đồ nghề làm nón', 'ノンラー作りの道具箱'], groups: [['Nguyên liệu', '材料'], ['Dụng cụ', '道具']], items: boxItems } }), alt: ['Hộp đồ nghề làm nón — bấm để mở', 'ノンラー作りの道具箱 — クリックして開く'] }
  f.place(boxH, (p, y) => {
    p.add({ ...boxEl, x: r1(p.x0), y: r1(y) })
    const pw = CW - boxW - 18
    figure(p, p.x0 + boxW + 18, y, pw, Math.round(pw * R.por), ['Lá lụi phơi ngoài nắng', '天日に干されるラルイ'], { capBelow: true })
  }, 16)
  const itemTo = { size: 14, lh: 1.6, jaSize: jaPt(14) }
  const iw2 = 210
  // nguyên liệu / dụng cụ: so le, mỗi trang khổ dọc đúng 2 mục (yêu cầu của nhóm); mục trên neo đầu, mục dưới neo đáy
  // trang → không có dải trống giữa / cuối trang. Không đủ chỗ cho 2 mục thì trang đó 1 mục (ảnh to hơn).
  const stagger = (list, label) => {
    // ảnh khung dọc 3:4, lớn theo phần chỗ chia cho mỗi mục (tối đa 52% bề ngang); chữ chiếm phần còn lại
    // soát 04/11 (B10): ảnh từng nguyên liệu / dụng cụ cũng có chú thích "Ảnh N: … (Nguồn: …)" dưới ảnh
    // khung theo tỉ lệ ảnh (dọc 3:4 … ngang 4:3) — trước khung nào cũng dọc 3:4, ảnh chụp ngang bị cắt mất hai bên
    const fit = (name, text, slot, hint) => {
      const rr = Math.min(R.por, Math.max(R.std, natR(hint) ?? R.por))
      const w = Math.max(iw2, Math.min(CW * 0.6, slot / rr)) // ảnh to hơn khi chữ ngắn → không để khoảng trống giữa trang
      const t2 = CW - w - 22
      const nh = textH(name, t2, { size: 20, font: F.head, lh: 1.25 })
      const th = textH(text, t2, itemTo)
      const ch = hint ? capH(hint, w) + 6 : 0
      return { w, rr, t2, nh, th, ch, h: Math.max(w * rr + ch, nh + 10 + th) }
    }
    const put = (p, y, [name, text, hint], k, m) => {
      const right = k % 2 === 1
      const ix = right ? p.x1 - m.w : p.x0
      const tx = right ? p.x0 : p.x0 + m.w + 22
      p.add(IMG(ix, y, m.w, m.w * m.rr, hint))
      if (m.ch) p.add(T(ix, y + m.w * m.rr + 6, m.w, m.ch - 6, hint, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
      p.add(T(tx, y - 2, m.t2, m.nh, name, { font: F.head, size: 20, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' }), T(tx, y + m.nh + 10, m.t2, m.th, text, { ...itemTo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
    }
    let i = 0
    let k = 0
    while (i < list.length) {
      if (!f.p || f.room < fit(list[i][0], list[i][1], 0, list[i][2]).h) f.page()
      if (label && i === 0) f.label(label)
      const p = f.p
      const room = BOT - f.y
      // hai mục: ảnh lớn nhất mà cả hai vẫn vừa trang
      let pair = null
      if (i + 1 < list.length)
        for (let slot = (room - 36) / 2; slot >= iw2 * R.por; slot -= 12) {
          const a = fit(list[i][0], list[i][1], slot, list[i][2])
          const b = fit(list[i + 1][0], list[i + 1][1], slot, list[i + 1][2])
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
        // ảnh chụp dọc: ảnh một bên, chữ một bên (khung vuông / ngang rộng cả khối sẽ cắt mất đầu đuôi vật)
        const nat1 = natR(hint) ?? 0
        if (nat1 > 1.05) {
          // tên, ảnh đúng tỉ lệ canh giữa (cao hết chỗ còn lại), chú thích, mô tả bên dưới — lấp kín trang
          const nh1 = textH(name, CW, { size: 22, font: F.head, lh: 1.25 })
          const th1 = textH(text, CW, itemTo)
          let w1 = CW
          for (let k2 = 0; k2 < 3; k2++) w1 = Math.min(CW, (room - nh1 - 12 - (capH(hint, w1) + 6) - 16 - th1) / nat1)
          if (w1 >= CW * 0.5) {
            const ch1 = capH(hint, w1) + 6
            const ix = p.x0 + (CW - w1) / 2
            const iy = f.y + nh1 + 12
            p.add(T(p.x0, f.y, CW, nh1, name, { font: F.head, size: 22, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' }))
            p.add(IMG(ix, iy, w1, w1 * nat1, hint))
            p.add(T(ix, iy + w1 * nat1 + 6, w1, ch1 - 6, hint, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
            p.add(T(p.x0, iy + w1 * nat1 + ch1 + 16, CW, th1, text, { ...itemTo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
            i += 1
            k++
            f.y = BOT
            continue
          }
          let m = null
          for (let slot = room; slot >= iw2 * R.por; slot -= 12) if ((m = fit(name, text, slot, hint)).h <= room) break
          if (m && m.h <= room) {
            put(p, f.y, list[i], k++, m)
            i += 1
            f.y = BOT
            continue
          }
        }
        const nh = textH(name, CW, { size: 22, font: F.head, lh: 1.25 })
        const th = textH(text, CW, itemTo)
        const ch = capH(hint, CW) + 6
        const r = [R.sq, R.std, R.wide, R.cin, R.pan].filter(notTaller(hint)).find((x) => nh + 12 + CW * x + ch + 16 + th <= room) ?? R.pan
        p.add(T(p.x0, f.y, CW, nh, name, { font: F.head, size: 22, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' }))
        p.add(IMG(p.x0, f.y + nh + 12, CW, CW * r, hint))
        p.add(T(p.x0, f.y + nh + 12 + CW * r + 6, CW, ch - 6, hint, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
        p.add(T(p.x0, f.y + nh + 12 + CW * r + ch + 16, CW, th, text, { ...itemTo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
        i += 1
        k++
      }
      f.y = BOT
    }
  }
  // góp ý 04/11: ảnh từng nguyên liệu theo đúng tên file nhóm gán trong Doc; ảnh tổng thể nguyên liệu (IMG_2612) mở đầu mục,
  // ảnh thứ hai của lá lụi / thanh nứa / khuôn dùng lấp chỗ trống của mục
  // soát 07/11: ảnh tủ nguyên liệu (IMG_2612) cùng tủ với ảnh tr. 46 (IMG_2611) → lá lụi phơi nắng, nguyên liệu chính
  stagger(mt.items, ['NGUYÊN LIỆU', '材料'])
  // dụng cụ: khuôn nón (một trang riêng, ảnh lớn) rồi các dụng cụ nhỏ
  const [mold] = mt.tools
  f.unit()
  f.label(['DỤNG CỤ', '道具'])
  f.place(26, (p, y) => p.add(T(p.x0, y, p.cw, 26, mold[0], { font: F.head, size: 22, weight: 700, color: ACC[2], lh: 1.25, jaFont: F.jaHead, name: 'Tên' })), 10)
  // anh Hải 08/11 (tr. 62–63 "trông đang hơi trống"): hạn mức chữ mỗi trang đẩy ba đoạn khuôn nón ra hai cặp trang, chỗ
  // trống lấp ảnh người khâu nón (không phải khuôn). Nay một cặp trang: trái = ảnh khuôn (dọc, chú thích cột bên) + đoạn 1;
  // phải = hai đoạn thợ làng Vác / làng Đôn Thư làm khuôn + ảnh khuôn nón bày bán ở chợ Chuông, khung cao tới đáy trang
  const pO = { size: 14.5, budget: false, free: true }
  const pH = textH([mold[1]], CW, { size: 14.5, lh: BODY.lh, paraGap: 8, jaSize: jaPt(14.5, 1.14) })
  const nat = natR(mold[2]) ?? 1.33
  const bh = Math.min(f.room - 22 - pH - 12, CW * 0.62 * nat)
  const yy = bh > 200 && sideFigure(f.p, f.y, bh, mold[2], bh / nat)
  if (yy) f.y = yy + 22
  else f.figure(mold[2], { ratio: R.cin })
  f.prose([mold[1]], pO)
  f.page()
  f.prose(mt.moldMore, pO)
  const market = ['Khuôn nón bày bán ở chợ Chuông', 'チュオンの市場で売られるノンラーの製作型']
  const rm = (f.room - 6 - capH(market, CW) - 6) / CW
  f.y += 6
  if (rm >= 0.45) f.figure(market, { ratio: Math.min(R.sq, rm), plain: true })
  else f.pool.unshift(market)
  // góp ý 04/11 (Khánh Huyền): dụng cụ có chú thích ngắn dồn vào một trang (dao kéo + dụng cụ là lá cùng một trang)
  f.fillRest()
  f.page()
  // dụng cụ nhỏ dồn một trang (góp ý Khánh Huyền): các cột cạnh nhau — ảnh dọc lớn + chú thích, tên, mô tả bên dưới;
  // ảnh cao theo chỗ còn lại để cột chạm đáy trang (soát 04/11: kiểu so le để trống lớn cạnh đoạn mô tả ngắn)
  {
    const list = mt.small
    const gap = 20
    const cw = (CW - gap * (list.length - 1)) / list.length
    const p = f.p
    const nO = { size: 20, font: F.head, lh: 1.25 }
    const below = (it) => capH(it[2], cw) + 6 + 14 + textH(it[0], cw, nO) + 8 + textH(it[1], cw, itemTo)
    // anh Hải 05/11 (tr. 62, soát vòng 4 #5): một ảnh ngang + một ảnh dọc xếp hai cột canh đáy → ảnh ngang đứng thấp
    // hơn ảnh dọc ~120pt, góc trên trống. Đổi kiểu "chữ L" của tạp chí: ảnh ngang rộng hết khối ở trên (tên + mô tả
    // ngay dưới), ảnh dọc ở dưới đặt ở mép ngoài, tên + mô tả + chú thích ở cột bên cạnh. Hai khung chọn sao cho ảnh
    // nào cũng không mất quá 4% vật chính và hai ảnh xấp xỉ cùng chiều cao (cân trang).
    const LOGO_POS = { 'Dao, kéo cắt lá': '50% 0%' }
    const land = list.find((it) => (natR(it[2]) ?? 1) < 0.9)
    const port = list.find((it) => (natR(it[2]) ?? 1) > 1.1)
    let lDone = false
    if (list.length === 2 && land && port) {
      const x0 = p.x0
      const capO = { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }
      const nameO = { ...nO, weight: 700, color: ACC[2], jaFont: F.jaHead, name: 'Tên' }
      const descO = { ...itemTo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }
      const room = BOT - f.y
      const gapRow = 30
      const belowL = capH(land[2], CW) + 6 + 14 + textH(land[0], CW, nO) + 8 + textH(land[1], CW, itemTo)
      const pa = 1 / natR(port[2])
      let best = null
      for (let hl = CW * natR(land[2]); hl >= CW * 0.4; hl -= 4) {
        if (cutOf(land[2], CW, hl) > 0.04) continue
        const hp = room - hl - belowL - gapRow
        // ảnh dọc: khung theo đúng tỉ lệ ảnh (không cắt)
        const wp = hp * pa
        const tw = CW - wp - 22
        if (wp > CW * 0.52 || tw < 200) continue
        const tb = textH(port[0], tw, nO) + 8 + textH(port[1], tw, itemTo) + 24 + capH(port[2], tw)
        if (tb > hp) continue
        const score = Math.abs(hp - hl)
        if (!best || score < best.score) best = { hl, hp, wp, tw, score }
      }
      if (best) {
        const { hl, hp, wp, tw } = best
        // soát vòng 6 (#3): ảnh dao kéo (báo QĐND) có logo báo in ở góc phải dưới → khung cắt phần thừa ở đáy (logo mất,
        // mũi dao + hai bàn tay + khung nón vẫn trọn)
        let y = figure(p, x0, f.y, CW, hl, land[2], LOGO_POS[land[2][0]] ? { pos: LOGO_POS[land[2][0]] } : {}) + 14
        const nh = textH(land[0], CW, nO)
        p.add(T(x0, y, CW, nh, land[0], nameO))
        y += nh + 8
        p.add(T(x0, y, CW, textH(land[1], CW, itemTo), land[1], descO))
        // hàng dưới chạm đáy trang
        const yb = BOT - hp
        p.add(IMG(x0, yb, wp, hp, port[2]))
        const tx = x0 + wp + 22
        let ty = yb
        const ph = textH(port[0], tw, nO)
        p.add(T(tx, ty, tw, ph, port[0], nameO))
        ty += ph + 8
        const dh = textH(port[1], tw, itemTo)
        p.add(T(tx, ty, tw, dh, port[1], descO))
        ty += dh
        const fc = fmtCap(port[2])
        const sh = textH(numCap(fc, FIG + 1), tw, capOpt)
        p.add(HL(tx, BOT - sh - 12, 40, ACC[2], 1.4))
        p.add(T(tx, BOT - sh, tw, sh, fc, capO))
        // soát vòng 6 (#4): giữa mô tả và chú thích còn trống → hình vẽ nét mảnh dụng cụ là lá (kiểu họa đồ Oger của sách)
        const gap = BOT - sh - 12 - ty
        if (gap >= 96) {
          // nét vẽ chỉ nằm ở nửa dưới khung 160 × 160 (y ≈ 85–150, tâm ở 0,74) → khung to hơn chỗ trống, đặt sao cho nét vẽ vào giữa
          const ih = Math.min(gap * 1.4, 170)
          p.add({ ...DECO('tool-la-la', tx + (tw - ih) / 2, ty + gap / 2 - ih * 0.74, ih, ih, 0.85), name: 'Hình vẽ' })
        }
        f.y = BOT
        lDone = true
      }
    }
    // soát 06/11 (R6): cột ảnh cao tới sát đáy trang (trước giới hạn 1,5 × bề ngang → nửa dưới trang trống)
    const ih = BOT - f.y - Math.max(...list.map(below)) - 8
    if (!lDone) list.forEach((it, k) => {
      const x = p.x0 + k * (cw + gap)
      // ảnh chụp ngang: khung cao dần chừng nào vật chính vẫn còn trọn, không thì theo tỉ lệ ảnh, đặt sát chú thích
      let ihk = Math.min(ih, cw * (natR(it[2]) ?? 9) * 1.04)
      for (let h = ih; h > ihk; h -= 6) if (cutOf(it[2], cw, h) <= 0.04) { ihk = h; break }
      let y = figure(p, x, f.y + ih - ihk, cw, ihk, it[2]) + 14
      const nh = textH(it[0], cw, nO)
      p.add(T(x, y, cw, nh, it[0], { ...nO, weight: 700, color: ACC[2], jaFont: F.jaHead, name: 'Tên' }))
      y += nh + 8
      p.add(T(x, y, cw, textH(it[1], cw, itemTo), it[1], { ...itemTo, align: 'justify', jaFont: F.jaBody, name: 'Mô tả' }))
    })
    f.y = BOT
  }
  f.note(mt.outro)

  // 2.3 — quy trình
  const pr = ch.process
  mark(2, pr.title, f.section('2.3', pr.title), '2.3')
  const lf = pr.leaf
  f.y = blockHead(f.p, f.y, lf.h, lf.id)
  mark(3, lf.h, f.p, lf.id)
  f.story({ here: true, paras: lf.p, images: lf.images, title: lf.h, keepOrder: true })
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
    // hàng số bước 1–8 + lời mời bấm nằm ngay dưới đường kẻ (trước canh đúng vào đường kẻ → đè lên phụ đề JA dài
    // "色糸を通して固定する") → chừa một dải cho hàng số trước khung GIF
    y += 46
    // chia chữ cho cân hai trang: trang trái = GIF + đoạn đầu, trang phải = phần còn lại + ảnh thật lấp kín trang
    // (không để một trang dồn chữ còn trang kia trống nền)
    // 06/11: bản Nhật của nhóm dài hơn bản cũ ~35% (bước 3: 630 chữ) → chữ Nhật của bước nhỏ dần (tối đa −2pt) tới khi
    // vừa một cặp trang: trang trái (dưới GIF) + trang phải (chừa ≥ 200pt cho ảnh thật)
    const roomJa = BOT - y - 6 - CW * R.cin - 18 + (BOT - TOP - 200 - 18)
    let jaS = jaPt(14, 1.14)
    const jaH = (ps, js) => textH1(join(ps), CW, { size: 14, lh: BODY.lh, jaSize: js, paraGap: 8 }, 1)
    // đoạn đầu luôn ở trang trái, dưới GIF (khung nhỏ nhất 2,35:1) → cũng phải vừa chỗ đó
    const capL0 = BOT - y - 6 - CW * R.cin - 18
    while (jaS > jaPt(14, 1.14) - 2 && (jaH(s.text, jaS) > roomJa || jaH([s.text[0]], jaS) > capL0)) jaS -= 0.5
    const to = { size: 14, lh: BODY.lh, jaSize: jaS, paraGap: 8 }
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
    stepFlow.y = figure(p, p.x0, y, CW, gh, s.gif, { noCaption: true, crop: s.gifCrop }) + 10
    // trang công đoạn có bố cục riêng (một bước = một cặp trang, GIF + ảnh thật) → không áp hạn mức chữ chung
    stepFlow.prose(left, { size: 14, jaSize: jaS, budget: false })
    if (stepFlow.p === p) stepFlow.page()
    const rp = stepFlow.p
    if (right.length) stepFlow.prose(right, { size: 14, jaSize: jaS, keep: 200, after: 18, budget: false })
    if (rp !== stepFlow.p || rp.n !== p.n + 1) console.warn(`⚠ công đoạn ${s.no}: chữ tràn quá một cặp trang`)
    // ảnh thật lấp phần còn lại của trang phải, chỉ khung tỉ lệ chuẩn: hai ảnh thì xếp cạnh nhau (khung dọc 3:4 → 4:3)
    // hoặc chồng dọc (rộng cả khối, tối thiểu 16:9 — không ép thành dải mỏng cắt ngang mặt người), cách nào ảnh lớn hơn
    const top = right.length ? stepFlow.y : TOP + 4
    const avail = BOT - top
    const n = s.photos.length
    const gap = 14
    // khung không cao hơn ảnh gốc (ảnh GIF / ảnh chụp ngang trong khung dọc bị cắt mất hai bên)
    const frame = (w, room, max) => bestR(s.photos, w, [R.por, R.sq, R.std, R.wide, R.cin, R.pan].filter((r) => r <= max + 0.001 && w * r <= room))
    if (n === 1) {
      const ch = capH(s.photos[0], CW)
      const r = frame(CW, avail - 6 - ch, R.por)
      if (r) figure(rp, rp.x0, top, CW, CW * r, s.photos[0])
    } else if (s.photos.every((c) => (natR(c) ?? 0) > 1.2) && avail > CW) {
      // soát 06/11 (R5): hai ảnh chụp dọc → so le chồng mép: ảnh trên lệch trái, ảnh dưới lệch phải đè nhẹ lên góc ảnh trên,
      // chú thích ở hai khoảng trống còn lại (trên-phải, dưới-trái) — phủ kín trang thay vì hai ảnh nhỏ cạnh cột trống
      const nat = Math.max(...s.photos.map(natR))
      const iw = Math.min(CW * 0.64, avail / 1.72 / nat)
      const ih = iw * nat
      const cw2 = CW - iw - 16
      const [a, b] = s.photos
      figure(rp, rp.x0, top, iw, ih, a, { noCaption: true })
      figure(rp, rp.x1 - iw, BOT - ih, iw, ih, b, { noCaption: true })
      const ca = fmtCap(a)
      const cb = fmtCap(b)
      const hb = textH(numCap(cb, FIG + 2), cw2, capOpt)
      rp.add(HL(rp.x0 + iw + 16, top + 4, 40, ACC[2], 1.4))
      rp.add(T(rp.x0 + iw + 16, top + 14, cw2, textH(numCap(ca, FIG + 1), cw2, capOpt), ca, { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
      rp.add(HL(rp.x0 + cw2 - 40, BOT - hb - 12, 40, ACC[2], 1.4))
      rp.add(T(rp.x0, BOT - hb, cw2, hb, cb, { ...capOpt, italic: true, align: 'right', color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
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
    1: { gif: ['GIF công đoạn rẽ lá', '「ゼー・ラー」のGIF'], photos: [['Tay nghệ nhân rẽ từng chiếc lá', '葉を一枚ずつのばす職人の手']] },
    2: { gif: ['GIF công đoạn là lá', '「ラー・ラー」のGIF'], photos: [['Nghệ nhân ngồi là lá bên bếp điện', '電気コンロのそばで葉を平らに伸ばす職人']] },
    3: { gif: ['GIF công đoạn bứt vòng', '「ブット・ヴォン」のGIF'], photos: [['Khuôn nón — nơi đặt lần lượt 16 vành nứa', '16本のヌアの輪を順にはめていくノンラーの製作型'], ['Khuôn nón với các vòng nứa nhìn từ trên xuống', '上から見た、ヌアの輪をはめた製作型']] },
    4: { gif: ['GIF công đoạn quay nón', '「クアイ・ノン」のGIF'], photos: [['Xếp từng lớp lá lụi lên khuôn', 'ラルイを一枚ずつ型に重ねる']] }, // soát 06/11 (R1): bỏ IMG_3856 — gần y hệt IMG_3854 ở trang lớp lá ngoài
    5: { gif: ['GIF công đoạn khâu nón', '「カウ・ノン」のGIF'], photos: [['Cận cảnh mũi kim, sợi cước xuyên qua lớp lá', '葉の層を通る針と糸のクローズアップ'], ['Nghệ nhân khâu nón, đặt nghiêng khung giữa hai đầu gối', '型を両膝の間に斜めに置いてノンラーを縫う職人']] },
    // soát 04/11: GIF gốc cắt ngang cằm người thợ → phóng vào tay và vành nón
    6: { gifCrop: { x: 60, y: 52, z: 1.45 }, gif: ['GIF công đoạn nức nón', '「ヌック・ノン」のGIF'], photos: [['Cắt lá thừa và khâu viền vành nón', '余分な葉を切り、外縁を縫う'], ['Khâu viền vành nón', 'ノンラーの外縁を縫う']] },
    // hai ảnh luồn nhôi chụp liền nhau gần như giống hệt → chỉ giữ một
    7: { gif: ['GIF công đoạn luồn nhôi', '「ルオン・ノイ」のGIF'], photos: [['Chỉ màu luồn trong lòng nón', 'ノンラーの内側に通した色糸']] },
    // góp ý 04/11: thêm ảnh thật của nhóm cho bước quang dầu (IMG_4614)
    8: { gif: ['GIF công đoạn quang dầu', '「クアン・ザウ」のGIF'], photos: [['Quét lớp dầu bóng lên mặt nón', 'ノンラーの表面に保護用の油を塗る'], ['Chiếc nón hoàn thiện nhìn từ trên xuống: lớp lá phẳng, đều', '上から見た完成したノンラー：平らにそろった葉']] },
  }
  for (const s of pr.steps) spread({ ...s, ...STEP_MEDIA[s.no] }, {})
  spread({ ...pr.finish, no: 0, ...STEP_MEDIA[8] }, { label: pr.finish.label })
  stepPages.at(-1).finish = true
  stepPages.at(-1).label = pr.finish.label
  // anh Hải 08/11 (tương tác kéo thả, sắp xếp): cặp trang "thử tài" sau công đoạn cuối — trang trái tám thẻ công đoạn bị
  // xáo, kéo về đúng thứ tự rồi kiểm tra; trang phải chiếc nón trắng, phủ giấy mờ tới khi xếp đúng (thẻ "sort8" → 1)
  // thì hiện câu "Chiếc nón trắng hoàn thiện!" của nhóm + nút xem lại tám công đoạn
  {
    const acc = ACC[2]
    const all = [...pr.steps, { ...pr.finish, no: 8 }]
    const steps = all.map((s) => ({ no: s.no, name: s.name.map(strip), sub: s.sub.map(strip), src: PHOTOS[STEP_MEDIA[s.no].photos[0][0]] ?? '' }))
    const p = stepFlow.page()
    let y = TOP
    p.add(T(p.x0, y, p.cw, 16, ['THỬ TÀI', '腕試し'], { size: S.label, tracking: 2.4, weight: 700, color: acc, jaFont: F.jaSans, name: 'Nhóm' }))
    y += 26
    const tO = { size: 30, font: F.head, lh: 1.2, jaSize: 25 }
    const title = ['Xếp lại tám công đoạn', '八つの工程を並べ替えよう']
    const th = textH(title, p.cw, tO)
    p.add(T(p.x0, y, p.cw, th, title, { ...tO, color: C.title, jaFont: F.jaHead, name: 'Tên bước' }))
    y += th + 8
    const lead = ['Tám công đoạn dựng và hoàn thiện nón dưới đây đã bị xáo trộn. Bạn hãy kéo các thẻ về đúng thứ tự, từ rẽ lá đến quang dầu, rồi bấm “Kiểm tra”.', '下の八つの工程の順番がばらばらになっています。カードをドラッグして「ゼー・ラー」から「クアン・ザウ」まで正しい順に並べ替え、「答え合わせ」をクリックしてください。']
    const lO = { size: 13.5, lh: 1.55, jaSize: 13.5 }
    const lh = textH(lead, p.cw, lO)
    p.add(T(p.x0, y, p.cw, lh, lead, { ...lO, color: C.ink2, jaFont: F.jaBody, name: 'Đoạn dẫn' }))
    y += lh + 10
    p.add(HL(p.x0, y, 56, acc, 1.4))
    y += 16
    p.add({ ...WIDGET(p.x0, y, p.cw, BOT - y, 'sort', { name: 'Xếp lại các công đoạn', data: { steps, set: 'sort8', accent: acc } }), alt: ['Tám thẻ công đoạn làm nón — kéo để xếp đúng thứ tự', 'ノンラー作りの八つの工程カード — ドラッグして正しい順に並べる'] })
    p.fixed = true
    const q = stepFlow.page()
    const hint = ['Nón lá trắng truyền thống làng Chuông', 'チュオン村の伝統的な白いノンラー']
    const iw = q.cw
    const ih = Math.round(iw * 1.02)
    const iy = TOP + 10
    const fy = figure(q, q.x0, iy, iw, ih, hint, { capBelow: true })
    // giấy mờ phủ ảnh khi chưa xếp đúng (thẻ 0), mất đi khi xếp đúng
    q.add(
      { ...RECT(q.x0, iy, iw, ih, '#f4ede0', { opacity: 0.9, name: 'Giấy phủ' }), tab: { set: 'sort8', i: 0 } },
      { ...DECO('non-line', q.x0 + iw / 2 - 90, iy + ih / 2 - 92, 180, 124, 0.7), name: 'Hình vẽ', tab: { set: 'sort8', i: 0 } },
    )
    const dO = { size: 34, font: F.script, lh: 1.15, jaSize: 24 }
    const dh = textH(pr.done, iw, dO)
    const dy = Math.min(fy + 18, BOT - dh - 40)
    // chưa xếp đúng: lời nhắc ở chỗ câu hoàn thành sẽ hiện (dưới ảnh), không đè lên ảnh
    q.add({ ...T(q.x0, dy + 6, iw, 52, ['Xếp đúng cả tám công đoạn để chiếc nón hoàn thiện', '八つの工程を正しく並べると、ノンラーが完成します'], { size: 17, italic: true, lh: 1.45, align: 'center', color: C.muted, jaFont: F.jaSans, jaSize: 15, name: 'Lời nhắc' }), tab: { set: 'sort8', i: 0 } })
    q.add({ ...T(q.x0, dy, iw, dh, pr.done, { ...dO, color: acc, align: 'center', jaFont: F.jaHead, name: 'Câu hoàn thành' }), tab: { set: 'sort8', i: 1 } })
    const mapPage = anchors.find((a) => a.label === '2.3.2')?.page
    if (mapPage)
      q.add({
        ...T(q.x0, dy + dh + 10, iw, 20, [`Xem lại tám công đoạn ở trang ${mapPage} →`, `八つの工程を${mapPage}ページで見直す →`], { size: 13, align: 'center', color: C.ink2, jaFont: F.jaSans, name: 'Xem lại', link: `#p${mapPage}`, linkStyle: 'refno', alt: [`Lật tới trang ${mapPage}`, `${mapPage}ページへ`] }),
        tab: { set: 'sort8', i: 1 },
      })
    q.fixed = true
    stepFlow.y = BOT
  }
}

// ═════════════════════════════════════════ CHƯƠNG 3
{
  const ch = ch3
  const { left } = chapterOpener(ch, {
    main: ['Ảnh mở chương: em bé ôm chiếc nón lá — thế hệ mai sau của làng nghề', '章扉写真：ノンラーを抱く子ども — 工芸村の未来を担う世代'],
    breakOut: { src: 'assets/book/fx/mo-chuong-3.webp', top: 0.34, head: 0.27 }, // head: đỉnh khăn em bé (tỉ lệ chiều cao ảnh)
    alt: ['Ảnh toàn trang: chợ nón Chuông', '全面写真：チュオン村のノンラー市場'],
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
  // 08/11 (tab Bổ sung: cặp trang OCOP tự dựng "Bỏ → Ảnh sẽ theo ND tiếng Nhật đã gán"): ảnh tab パート3 theo đúng chỗ
  // của bản Nhật — ca dao → 3-02 → đoạn ¹ ² → 3-03 → đoạn OCOP ³ → giấy chứng nhận + nón chùm → nón lụa hai mặt →
  // đoạn làng nghề 2008 → ảnh chợ → đoạn kết. Ảnh năm 2023 về trang ông Tuy, trung tâm OCOP về mục 3.2 (như nhóm đặt)
  const ri = rc.images
  f.figure(ri.colorful)
  f.noted(rc.p.slice(0, 1), rc.notes.slice(0, 2))
  // ảnh dọc: khung theo chỗ còn dưới đoạn văn (không đẩy sang trang sau, để lại nửa trang trống)
  f.figure(ri.products, f.p && f.room > CW * 0.4 + 40 ? { ratio: Math.min(R.wide, (f.room - 40) / CW) } : {})
  f.noted([rc.p[1]], rc.notes.slice(2))
  f.row(ri.ocop)
  f.row(ri.silk)
  f.prose([rc.p[2]])
  f.row(ri.market)
  f.prose([rc.p[3]])

  // nghệ nhân
  const ar = ch.artisans
  f.section(null, ar.title)
  // anh Hải 08/11 (tr. 94 "nội dung tab trái đang hơi ít và trống"): bản Nhật của đoạn dẫn dài hơn hẳn → khung theo chữ Nhật,
  // bản Việt chỉ 4 dòng, hở ~100pt trên ảnh. Đoạn dẫn kiểu tạp chí: chữ Việt to dần tới khi cao ngang chữ Nhật (Nhật giữ cỡ thường)
  {
    const jh = textH1(ar.intro, CW, { ...BODY, paraGap: 8 }, 1)
    const vs = [18, 17.5, 17, 16.5, 16, 15.5, 15].find((z) => textH1(ar.intro, CW, { size: z, lh: BODY.lh, paraGap: 8, jaSize: BODY.jaSize }, 0) <= jh + 4) ?? BODY.size
    f.prose([ar.intro], { size: vs, jaSize: BODY.jaSize, color: C.ink2 })
  }
  // 08/11: ảnh nhóm gắn ở đầu phần nghệ nhân (3-11, Lễ báo công 2025)
  f.figure(ar.photos.honor)
  f.fillRest()
  f.page()
  const bioO = { size: 14, lh: 1.6, jaSize: jaPt(14) }
  const piw = 178
  const ptx = piw + 20
  const smallCap = { size: 11, lh: 1.35 }
  // "Nghệ nhân Phạm Trần Canh (1931)" → tên + dòng năm sinh riêng
  const YEAR = /\s*[（(](\d{4})(?:年生)?[）)]$/
  // bản Nhật của nhóm (06/11): 「レ・ヴァン・トゥイ（Lê Văn Tuy、1969年生）」 → tên 「レ・ヴァン・トゥイ（Lê Văn Tuy）」 + dòng năm sinh
  const YEAR_JA = /\s*[（(]([^（）()]*?)[、,]\s*\d{4}年生[^）)]*[）)]$/
  const splitName = (name) => [[name[0].replace(YEAR, ''), YEAR_JA.test(name[1] ?? '') ? name[1].replace(YEAR_JA, (_, latin) => `（${latin}）`) : String(name[1] ?? '').replace(YEAR, '')], name[0].match(YEAR)?.[1]]
  const personNh = (name, tx = ptx) => textH(splitName(name)[0], CW - tx, { size: S.card, font: F.head, lh: 1.25 }) + (splitName(name)[1] ? 18 : 0)
  // 08/11: thẻ không ảnh (ông Hai Cát — nhóm: không có ảnh) thì chữ rộng hết khối; o.notes = chú thích cuối trang của người đó
  const people = (list, fill) =>
    f.cards(
      list,
      ([[name, , bio], img, cap]) => (img ? Math.max(personNh(name) + 24 + textH(bio, CW - ptx, bioO), piw * R.por + (cap ? 6 + textH(fmtCap(cap, img[0]), piw, smallCap) : 0)) : personNh(name, 0) + 24 + textH(bio, CW, bioO)),
      (p, y, [[name, role, bio], img, cap, notes]) => {
        const ptx = img ? piw + 20 : 0
        const [nm, year] = splitName(name)
        const nh = textH(nm, CW - ptx, { size: S.card, font: F.head, lh: 1.25 })
        if (notes) f.notes(notes)
        if (img) p.add(IMG(p.x0, y, piw, piw * R.por, img))
        // chú thích nhỏ dưới ảnh (ảnh sản phẩm thay chân dung → nói rõ đây là nón gắn với nghệ nhân, không phải ghép nhầm)
        if (cap) {
          const fc = fmtCap(cap, img[0])
          p.add(T(p.x0, y + piw * R.por + 6, piw, textH(fc, piw, smallCap), fc, { ...smallCap, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
        }
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
  const g2 = ar.groups[1]
  // DÒNG THỜI GIAN bấm được: mỗi mốc năm một câu chuyện, xếp theo năm. 08/11 (tab Bổ sung: ông Hai Cát, ông Canh "chưa có
  // trang riêng → cần trang riêng như ông Tuy và Hương"): cả bốn người đều có trang riêng → thẻ chỉ in câu có năm đó (nguyên
  // văn tiểu sử của nhóm) + nút "Đọc tiếp ở trang N"; ảnh để ở trang riêng của từng người (không lặp ảnh), thẻ có hình vẽ nón nhỏ
  const [cat, canh] = g1.people
  const tuy = g2.people.find(([nm]) => /Tuy/.test(nm[0]))
  const huong = g2.people.find(([nm]) => /Hương/.test(nm[0]))
  const noSup = (t) => String(t).replace(/[¹²³⁴⁵⁶⁷⁸⁹]/g, '')
  const yearSent = (bio, y) => [
    (String(bio[0]).match(new RegExp(`[^.]*Năm ${y}[^.]*\\.`, 'g')) ?? []).map((x) => x.trim()).join(' '),
    (noSup(bio[1]).match(new RegExp(`[^。\\n]*${y}年[^。]*。`, 'g')) ?? []).map((x) => x.trim()).join(''),
  ]
  const tl = [
    [['1930', '1930年'], [cat[0], cat[1], yearSent(cat[2], 1930)], ['Ông Hai Cát', 'ハイ・カット'], g1.name, cat],
    [['2006', '2006年'], [canh[0], canh[1], yearSent(canh[2], 2006)], ['Phạm Trần Canh', 'ファム・チャン・カイン'], g1.name, canh],
    [['2019', '2019年'], [tuy[0], tuy[1], yearSent(tuy[2], 2019)], ['Lê Văn Tuy', 'レ・ヴァン・トゥイ'], g2.name, tuy],
    [['2022', '2022年'], [huong[0], huong[1], yearSent(huong[2], 2022)], ['Tạ Thu Hương', 'タ・トゥ・フオン'], g2.name, huong],
  ].map(([year, [name, role, bio], short, group, who]) => ({ year, name, role, bio, short, group, who }))
  for (const it of tl) if (!it.bio[0] || !it.bio[1]) throw new Error(`dòng thời gian: thiếu câu có năm ${it.year[0]} trong tiểu sử`)
  f.place(BOT - f.y - 6, (p, y) => p.add(WIDGET(p.x0, y, CW, BOT - y - 6, 'timeline', { name: 'Dòng thời gian nghệ nhân', data: { items: tl, accent: ACC[3] } })), 0)
  // 08/11: trang riêng ông Hai Cát (trái, không ảnh — hình vẽ nón nhỏ) và ông Canh (phải: chân dung + ảnh con gái ông, bà
  // Trần Thị Hoa, nhóm gắn 3-12, 3-13; chú thích [4] ハタイ省 chỉ ở bản Nhật)
  f.unit()
  f.label(g1.name)
  people(
    [
      [cat, null, null],
      [canh, ar.photos.canh, ar.photos.canh, ar.notes.Canh],
    ],
    ([[name]]) => {
      // ảnh bà Hoa cùng trang với ông Canh: khung co theo chỗ còn (không đẩy sang trang sau)
      if (/Canh/.test(name[0])) {
        const r = Math.min(R.wide, (f.room - 6 - capH(ar.photos.hoa, CW) - 4) / CW)
        return f.figure(ar.photos.hoa, r >= 0.4 ? { ratio: r, plain: true } : {})
      }
      // anh Hải 08/11: "tận 2 đống họa tiết, cái trên cái dưới trông hơi dở" (hình nón vẽ + cụm tre lấp đáy) → bỏ cả hai;
      // chỗ trống (ông không có ảnh) là khối chữ kiểu tạp chí giữa phần còn lại: năm 1930 thật to + câu có năm đó trong tiểu
      // sử của nhóm (nguyên văn, như thẻ dòng thời gian)
      const p = f.p
      const yo = { size: 72, font: F.head, lh: 1.15 }
      const so = { size: 19, font: F.head, lh: 1.45, jaSize: jaPt(19) - 1 }
      const sw = CW - 80
      const sent = yearSent(cat[2], 1930)
      const YH = 90
      const bh = YH + 18 + 22 + textH(sent, sw, so)
      const room = f.bot - f.y
      if (room >= bh + 40) {
        // khối hơi cao hơn giữa (thị giác), không để dải trống lớn ngay dưới tiểu sử
        const y0 = f.y + (room - bh) * 0.38
        p.add(
          T(p.x0, y0, CW, YH, ['1930', '1930年'], { ...yo, align: 'center', color: ACC[3], jaFont: F.jaHead, jaSize: 60, name: 'Năm nổi bật' }),
          HL(p.x0 + (CW - 60) / 2, y0 + YH + 18, 60, ACC[3], 1.2),
          T(p.x0 + 40, y0 + YH + 18 + 22, sw, textH(sent, sw, so), sent, { ...so, italic: true, align: 'center', color: C.ink2, jaFont: F.jaHead, name: 'Câu nổi bật' })
        )
        p.noFlora = true
        p.fixed = true // không để bước dàn đều khoảng trống (settle) kéo câu nổi bật tách khỏi số năm
        f.y = f.bot
      }
    }
  )
  f.page()
  f.label(g2.name)
  f.prose([g2.intro], { size: 14.5 })
  // 08/11: ảnh nhóm gắn (3-14 ông Tuy, 3-15 bà Hương)
  f.row(ar.photos.g2)
  f.fillRest()
  f.page()
  // ảnh dưới thẻ đúng người: ông Tuy — bằng Nghệ nhân Hà Nội (2019) + không gian trưng bày của ông; bà Hương — cơ sở của bà
  // soát đọc lần đầu 05/11 (tr. 96–97): bà Hương theo khuôn thẻ chung (chân dung nhỏ cạnh tiểu sử, câu trích, ảnh lấp
  // trang sau) → gần nửa cặp trang trống + hai cành tre giống hệt nhau. Cặp trang riêng: trái = ảnh 103 lớn rộng hết
  // khối, tên + tiểu sử dưới; phải = ảnh 104 lớn, câu trích của bà ngay dưới. Ông Tuy giữ khuôn thẻ.
  const huongAt = g2.people.findIndex(([name]) => /Hương/.test(name[0]))
  const huongSpread = () => {
    const [[name, role, bio], img] = [g2.people[huongAt], ar.image[huongAt]]
    const [nm, year] = splitName(name)
    const bioW = { ...bioO }
    const nh = textH(nm, CW, { size: S.card, font: F.head, lh: 1.25 })
    const bh = textH(bio, CW, bioW)
    const textBlock = nh + (year ? 18 : 0) + 26 + bh + (ar.notes.Hương ? notesH(ar.notes.Hương) : 0)
    const capH0 = capH(img, CW)
    // khung cao theo chỗ còn (ảnh 103 chụp dọc: soát vòng 8 — khung 4:3 cắt sát tóc, mép trái lộ vệt đen), không quá vuông;
    // hạ dần tới khi ảnh không mất quá 4% vật chính
    const room = BOT - TOP - capH0 - 6 - 22 - textBlock
    // 08/11: trang trái có thêm chú thích cuối trang (bản Nhật) → khung ảnh thấp nhất 5:2
    if (room < CW * 0.4) return false
    let ph = Math.min(room, CW * R.sq)
    for (let h = ph; h >= CW * 0.4; h -= 6) if (cutOf(img, CW, h) <= 0.04) { ph = h; break }
    const p = f.unit() // cặp trang riêng, bắt đầu ở trang trái
    let y = figure(p, p.x0, f.y, CW, ph, img) + 22
    // (08/11: ảnh chân dung mới của nhóm, 3-19 — không còn vệt xám ở mép trái như ảnh cũ → bỏ phóng nhẹ)
    p.add(T(p.x0, y, CW, nh, nm, { font: F.head, size: S.card, weight: 700, color: C.ink, lh: 1.25, jaFont: F.jaHead, name: 'Tên nghệ nhân' }))
    y += nh
    if (year) {
      p.add(T(p.x0, y, CW, 18, [`Sinh năm ${year}`, `${year}年生まれ`], { size: 12.5, tracking: 1, color: C.muted, lh: 1.3, jaFont: F.jaSans, name: 'Năm sinh' }))
      y += 18
    }
    p.add(T(p.x0, y + 2, CW, 18, role, { size: 13.5, italic: true, color: ACC[3], lh: 1.3, jaFont: F.jaSans, name: 'Vai trò' }), T(p.x0, y + 26, CW, bh, bio, { ...bioW, align: 'justify', jaFont: F.jaBody, name: 'Tiểu sử' }))
    if (ar.notes.Hương) footnotes(p, ar.notes.Hương)
    f.y = BOT
    // trang phải: ảnh gian trưng bày + câu trích của bà ngay dưới, cả khối canh giữa trang (ảnh ngang 3:2 — khung cao hơn
    // thì cắt hai bên; canh đáy câu trích thì giữa trang thủng một dải)
    // 08/11: trang phải theo bản Nhật — ảnh 3-20 (bà giới thiệu sản phẩm, rộng hết khối) + 3-21 (giấy khen) cạnh câu trích
    const q = f.page()
    const [pic, wall] = ar.photos.huong
    const qO = quoteOpt(19)
    const qh = textH(ar.sayings.Hương, CW - 170 - 54, qO)
    const ch2 = capH(pic, CW)
    const ww = 170
    const wch = capH(wall, ww)
    const lowH = Math.max(ww * R.por + 6 + wch, qh + 18)
    let hh = Math.min(CW * R.wide, BOT - TOP - ch2 - 6 - 30 - lowH)
    for (let h = hh; h >= CW * R.cin; h -= 6) if (cutOf(pic, CW, h) <= 0.04) { hh = h; break }
    const block = hh + 6 + ch2 + 30 + lowH
    const y0 = TOP + Math.max(0, (BOT - TOP - block) / 2)
    const wy = figure(q, q.x0, y0, CW, hh, pic) + 30
    figure(q, q.x1 - ww, wy, ww, ww * R.por, wall)
    const qx = q.x0 + 18
    const qw = CW - ww - 36 - 18
    const qy = wy + 18
    q.add(HL(qx, qy - 18, 40, ACC[3], 1.4))
    quote(q, qy, ar.sayings.Hương, qx, qw, { size: 19, color: ACC[3] })
    q.fixed = true
    f.y = BOT
    return true
  }
  people(
    // soát 04/11 (B10): chân dung cũng có chú thích "Ảnh N: … (Nguồn: …)"
    g2.people.map((per, i) => [per, ar.image[i], ar.image[i], /Tuy/.test(per[0][0]) ? ar.notes.Tuy : ar.notes.Hương]).filter((_, i) => i !== huongAt),
    ([[name]]) => {
      if (!/Tuy/.test(name[0])) {
        f.quote(ar.sayings.Hương, { size: 17, inset: 18, gap: 18, color: ACC[3] })
        return f.pool.unshift(['Nghệ nhân Tạ Thu Hương (áo đỏ) cùng các bạn trẻ tại cơ sở nón của bà', 'タ・トゥ・フオン氏（赤い服）と、工房を訪れた若者たち'])
      }
      // soát 07/11: câu trích trước thì hàng ảnh bằng công nhận + gian trưng bày không vừa, sang trang sau → trang tiểu sử
      // trống 40% dưới câu trích. Hàng ảnh lên trước (ngay dưới tiểu sử), câu trích sau
      // 08/11: ảnh theo bản Nhật (3-16 năm 2023, 3-18 bằng Nghệ nhân Hà Nội 2019). Trang có chú thích cuối trang (bản Nhật)
      // nên câu trích lên trước, ngay dưới tiểu sử; hai ảnh khung theo chỗ còn, chật quá thì sang trang sau
      f.quote(ar.sayings.Tuy, { size: 17, inset: 18, gap: 18, color: ACC[3] })
      // trang phải còn rộng → hai ảnh xếp chồng, rộng hết khối (không để nửa trang trống)
      const [ta, tb] = ar.photos.tuy
      const rs = (f.room - capH(ta, CW) - capH(tb, CW) - 6 * 2 - 18 * 2 - 10) / (2 * CW)
      if (rs >= 0.45) return ar.photos.tuy.forEach((c) => f.figure(c, { ratio: Math.min(R.std, rs) }))
      const w2 = (CW - 14) / 2
      const r2 = (f.room - 6 - Math.max(...ar.photos.tuy.map((c) => capH(c, w2))) - 24) / w2
      f.row(ar.photos.tuy, { ratio: r2 >= 0.5 ? Math.min(r2, R.std) : R.std })
      // soát độc lập 08/11: phần còn lại của cặp trang ông Tuy lấp bằng ảnh của chính ông (gian trưng bày, triển lãm, bằng
      // Nghệ nhân làng nghề Việt Nam) thay cho ảnh chợ / du khách trong kho — anh Hải: "ảnh phải có liên quan đến người nói đến"
      f.pool.unshift(
        ['Gian trưng bày nón Chuông nhiều mẫu mã của nghệ nhân Lê Văn Tuy tại một triển lãm — nguồn: Xuân Lai / Báo Pháp luật', '職人レ・ヴァン・トゥイ氏による、さまざまなデザインのチュオン村のノンラーの展示 — 出典：スアン・ライ／ファップルアット紙'],
        ['Không gian trưng bày của nghệ nhân Lê Văn Tuy', '職人レ・ヴァン・トゥイ氏の展示スペース'],
        ['Bằng công nhận Nghệ nhân làng nghề Việt Nam của ông Lê Văn Tuy', 'レ・ヴァン・トゥイ氏の「ベトナム{工芸村|こうげいむら}職人」{認定|にんてい}証']
      )
    }
  )
  if (huongAt >= 0 && !huongSpread()) people([[g2.people[huongAt], ar.image[huongAt], ar.image[huongAt]]], () => f.quote(ar.sayings.Hương, { size: 17, inset: 18, gap: 18, color: ACC[3] }))
  // nút "đọc tiếp" trên thẻ ông Tuy / bà Hương của dòng thời gian → trang có tiểu sử đầy đủ (số trang biết sau khi dàn)
  for (const it of tl) {
    const who = it.who
    delete it.who
    if (!who) continue
    const key = splitName(who[0])[0][0]
    const pg = pages.find((q) => q.els.some((e) => e.name === 'Tên nghệ nhân' && (Array.isArray(e.text) ? e.text[0] : e.text) === key))
    if (!pg) throw new Error(`dòng thời gian: không thấy trang tiểu sử ${key}`)
    it.link = pg.n
  }
  // hộp đồ nghề (mở 2.2): số trang tả từng món
  for (const it of pages.flatMap((q) => q.els).find((e) => e.kind === 'toolbox')?.items ?? []) {
    const pg = pages.find((q) => q.els.some((e) => (e.name === 'Tên' || e.name === 'Tên dụng cụ' || e.name === 'Tiêu đề khuôn') && (Array.isArray(e.text) ? e.text[0] : e.text) === it.name[0]))
    if (pg) it.page = pg.n
  }

  // 3.2 bảo tồn, 3.3 thách thức: mỗi chủ đề = tiêu đề nhỏ + đoạn văn + ảnh
  // mỗi chủ đề một cặp trang (luật trang đôi): chữ chia cân hai trang, ảnh / video khung chuẩn, dài thì "Đọc thêm";
  // đoạn dẫn của mục đứng đầu cặp trang của chủ đề đầu tiên
  const topics = (list, lead) => {
    // 08/11: video đứng sau ảnh (ảnh cạnh đoạn đầu ở trang trái, video sang trang phải — tab Bổ sung tr. 104–105)
    list.forEach((t, i) => f.story({ lead: i === 0 ? lead : null, h: t.h, paras: t.p, gallery: t.gallery, pairLeft: t.pairLeft, notesR: t.notesR, keepOrder: t.keepOrder, flip: i % 2 === 1, images: [...(t.images ?? [t.image]), t.video && { video: t.video }].filter(Boolean) }))
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
    const cap = fmtCap([pageCap(hint[0]), pageCap(hint[1])], hint[0])
    // soát 04/11: ảnh 330pt giữa nền trống → ảnh lớn gần kín trang (đúng ý "ảnh toàn trang")
    const iw = r1(Math.min(W - 18 - 90, (H - 130 - capH(cap, W - 108)) / R.por))
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
  // trang nghỉ cuối chương 3 (soát 06/11, R8: trang chỉ phủ 36%): mười sáu vòng nón in mờ, bóng nắng lũy tre, măng tre dựng lên
  // (soát 05/11: bóng nắng thứ hai ở góc dưới-trái bỏ — ảnh bóng tre cắt ngang ở mép dưới thành mảng chữ nhật cạnh cứng)
  p.add(RECT(W - 18, 0, 18, H, ACC[3], { name: 'Dải màu' }), { ...DECO('vong-non', 60, H / 2 - 230, W - 138, W - 138, 0.1), name: 'Họa tiết' }, SUN(W - 500, -20, 520, false, 0.8), STAND({ ...DECO('tre-mang', (W - 18 - dh) / 2, y, dh, dh, 0.9), name: 'Hình vẽ' }, 0.3, 1.2))
  y += dh + 18
  p.add(HL((W - 18 - 64) / 2, y, 64, ACC[3], 1.8))
  quote(p, y + 22, cl.outro, (W - 18 - qw) / 2, qw, { size: 25, align: 'center', color: C.ink })
}

// ═════════════════════════════════════════ PHẦN KẾT
{
  const e = ending
  const f = new Flow(9, ['KẾT LUẬN', '終わりに'], [...POOL[9]])
  mark(1, e.conclusion.title, f.section(null, e.conclusion.title), '—')
  // kết luận gọn một cặp trang: chữ trang trái, một ảnh trang phải (trước: 4 trang, 5 ảnh chợ)
  f.prose(e.conclusion.p, { budget: false })
  f.end()

  f.runLabel = ['LƯU Ý', '留意点'] // đầu trang mọi trang của phần này (không chỉ trang đầu)
  // lưu ý: toàn văn gọn trong một trang (góp ý của người dùng), không chia cặp trang + ảnh
  mark(1, e.notice.title, f.section(null, e.notice.title, ['Đôi lời gửi bạn đọc', '読者の皆様へ']), '—')
  f.prose(e.notice.p, { budget: false, size: 13.5, lh: 1.5, paraGap: 5, jaSize: 13.5 })
  // anh Hải 05/11: "trái phải hơi trống … làm cái chuỗi hiệu ứng liên quan đến cây tre lớn dần" → lũy tre vẽ dần
  // (GroveWidget): dải dưới trang chữ = mặt đất + măng non, trang đối diện = 16 vòng tròn, tre mọc từng đốt, nón được
  // làm dưới gốc tre. Mặt đất hai trang cùng độ cao (BOT − 2) để nét đất chạy liền qua gáy sách.
  {
    const lp = f.p
    const gy = Math.max(f.y + 4, BOT - 96)
    lp.add(WIDGET(0, gy, W, BOT + 8 - gy, 'grove', { name: 'Hình vẽ động', data: { variant: 'left' } }))
    lp.grove = true
    const rp = f.page()
    rp.add(WIDGET(0, TOP, W, BOT + 8 - TOP, 'grove', { name: 'Hình vẽ động', data: { variant: 'right' } }))
    rp.grove = true
    rp.fixed = true
    f.y = BOT
  }
  f.end()

  f.runLabel = ['TÀI LIỆU THAM KHẢO', '参考文献']
  f.unit()
  mark(1, e.references.title, f.p, '—')
  f.y = sectionHead(f.p, TOP, null, e.references.title, ['Tư liệu đã dùng', 'この本の資料'])
  // Tài liệu theo mẫu APA (06/11): nguyên văn tab "Sửa 1" / JA 参考資料 của Doc, chia nhóm như nhóm (書籍 · 雑誌 ·
  // 参考ウェブサイト・動画 → ベトナム語 / 日本語 / 英語 · 辞書), cộng một nhóm cuối là các nguồn Claude dùng khi dựng sách
  // (chị Linh nhờ bổ sung). APA không đánh số, nên anh Hải đồng ý bỏ số [n] (06/11).
  // Chỗ dùng tài liệu trong sách vẫn bấm được: dòng nhỏ "→ dùng ở trang …" ở cuối mục. Dữ liệu lấy từ ref-uses.json, nối theo
  // đường dẫn từ bảng IEEE cũ ref-map.proposed.json.
  // Mỗi mục: phần "Tác giả. (năm)." in đậm, phần còn lại chữ thường. Bấm vào cả mục thì mở bài gốc ở tab mới.
  const VI_MONTH = { 'Một': 1, 'Hai': 2, 'Ba': 3, 'Tư': 4, 'Năm': 5, 'Sáu': 6, 'Bảy': 7, 'Tám': 8, 'Chín': 9, 'Mười': 10, 'Mười Một': 11, 'Mười Hai': 12 }
  // anh Hải 05/11: "1 Tháng Mười Một 2026" (Zotero dịch máy) → "ngày 1 tháng 11 năm 2026". Chỉ đổi ở bản VI; bản JA in nguyên văn tab JA.
  const viDate = (s) => String(s).replace(/Truy (cập|vấn):? (\d{1,2}) Tháng (Mười Một|Mười Hai|Mười|Một|Hai|Ba|Tư|Năm|Sáu|Bảy|Tám|Chín) (\d{4})/g, (_, w, d, m, y) => `Truy ${w} ngày ${d} tháng ${VI_MONTH[m]} năm ${y}`)
  const REF_USES = (() => {
    try {
      return JSON.parse(fs.readFileSync(path.join(here, 'ref-uses.json'), 'utf8'))
    } catch {
      return {}
    }
  })()
  const textOf = (e) => (Array.isArray(e.text) ? e.text[0] : e.text) ?? ''
  const pageOfSnippet = (snip) => pages.find((pg) => pg.els.some((e) => (e.type === 'text' && strip(String(textOf(e))).includes(snip)) || (e.type === 'image' && String(e.hint ?? '').includes(snip))))?.n
  // đường dẫn cuối cùng trong mục là bài gốc (mục APA của báo ghi cả trang chủ trước, vd. "https://www.qdnd.vn. https://www.qdnd.vn/…")
  const urlOf = (t) => (String(t).match(/https?:\/\/\S+/g) ?? []).pop()?.replace(/[.,]$/, '')
  const usedPages = (url) => [...new Set((REF_USES[url] ?? []).map(pageOfSnippet).filter(Boolean))].sort((a, b) => a - b)
  // "Tác giả. (năm)." in đậm. Mục từ điển dạng "コトバンク: https://…" thì in đậm phần trước dấu ":".
  const splitApa = (t) => {
    // ngoặc năm: (2017) · (2008, Tháng Tư) · (không ngày) · (n.d.) · (日付なし-a) · (2025年a, 3月 9) — không phải (Chủ biên)
    const m = String(t).match(/^(.*?\((?:\d{4}|không ngày|n\.d\.|日付なし)[^)]*\)\.?)\s+(.*)$/s) ?? String(t).match(/^(.*?):\s+(https?:.*)$/s)
    return m ? [m[1], m[2]] : [t, '']
  }
  let refNo = 0
  const putRef = (t) => {
    const url = urlOf(t)
    const lk = url ? { link: url, linkStyle: 'ref' } : {}
    const [h, rest] = splitApa(t)
    // 08/11 (tab Bổ sung): "đánh số thứ tự, bỏ phần chữ đỏ dùng trang" → số liền 1 → N qua các nhóm, bỏ dòng "→ dùng ở trang"
    refNo++
    const head = [`${refNo}. ${viDate(h)}`, `${refNo}. ${h}`]
    const tail = rest ? [viDate(rest), rest] : null
    const used = []
    const ho = { size: 10.5, lh: 1.38, jaSize: 10.5, weight: 700 }
    const to = { size: 9.5, lh: 1.36, jaSize: 9.5 }
    const uo = { size: 9, lh: 1.3, jaSize: 9, weight: 700 }
    const h1 = textH(head, CW, ho)
    const h2 = tail ? textH(tail, CW, to) : 0
    const h3 = used.length ? 13 : 0
    // soát 07/11: dòng "→ trang" đặt TRÊN tên tài liệu (chiều cao dòng nguồn tính theo thứ tiếng dài hơn → ở bản kia có khoảng hở
    // phía trên dòng "→" nếu nó nằm dưới, trông như thuộc mục sau)
    f.place(h1 + (h2 ? h2 + 1 : 0) + (h3 ? h3 + 1 : 0), (p, y) => {
      const yh = y + (h3 ? h3 + 1 : 0)
      p.add(T(p.x0, yh, p.cw, h1, head, { ...ho, color: C.ink, jaFont: F.jaSans, name: 'Tài liệu', ...lk }))
      if (h2) p.add(T(p.x0, yh + h1 + 1, p.cw, h2, tail, { ...to, color: C.ink2, jaFont: F.jaSans, name: 'Nguồn tài liệu', ...lk }))
      if (h3)
        p.add(T(p.x0, y, p.cw, h3, [`→ dùng ở trang ${used.join(', ')}`, `→ ${used.join('・')}ページで使用`], { ...uo, color: '#a8382b', jaFont: F.jaSans, name: 'Trang dùng tài liệu', link: `#p${used[0]}`, linkStyle: 'refno', alt: [`Lật tới trang ${used[0]}, nơi dùng tài liệu này`, `この資料を使った${used[0]}ページへ`] }))
    }, 3) // 85 mục: cách 3pt để danh sách hết ở trang trái → trang Nguồn ảnh là trang phải (không thừa trang trống)
  }
  const refP0 = pages.length - 1
  refGroups.forEach((g, k) => {
    const label = g.sub ? [`${g.h[0].toUpperCase()} · ${g.sub[0]}`, `${g.h[1]}・${g.sub[1]}`] : [g.h[0].toUpperCase(), g.h[1]]
    f.place(30, (p, y) => {
      p.add(T(p.x0, y + 8, p.cw, 18, [`${label[0]} · ${g.items.length}`, `${label[1]}・${g.items.length}`], { size: S.label, tracking: 1.8, weight: 700, color: ACC[9], lh: 1.3, jaFont: F.jaSans, name: 'Nhóm tài liệu' }), HL(p.x0, y + 28, 40, ACC[9], 1.2))
    }, 6)
    g.items.forEach(putRef)
  })
  // soát 07/11: 6 trang tài liệu chỉ có chữ → mỗi trang một hình vẽ nét nhỏ ở góc dưới phía ngoài (nón, nhánh tre xen nhau)
  pages.slice(refP0).forEach((q, i) => {
    if (q.els.some((e) => e.type === 'image')) return
    const m = pickMotif(q, 'k', 64, 40, 24)
    if (!m) return
    const x = q.side === 'left' ? q.x0 - 6 : q.x1 - m.w + 6
    q.add({ ...DECO(m.name, x, H - 18 - m.h, m.w, m.h, 0.5), name: 'Hình vẽ' })
  })
  // nguồn ảnh: trang riêng (trang phải) — bảng hai cột "nguồn | ảnh nào", chia nhóm báo chí / kho ảnh mở / video, bản đồ
  // (góp ý: khối chữ dày nửa trên, nửa dưới trống → trình bày lại cho đẹp). Ảnh còn lại do nhóm tự chụp.
  {
    // ảnh của nhiếp ảnh Trọng Khải (bên thuê gửi): thư mục "Trọng Khải" + thư mục "Không gian chợ nón" của nhóm (đã so ảnh:
    // toàn bộ là ảnh của anh) → ghi số các trang có ảnh; bưu thiếp cuối sách cũng dùng ảnh chợ đèn lồng của anh
    const tkSrc = new Set(Object.entries(PHOTO_PATHS).filter(([, rel]) => /^(Drive\/)?(Trọng Khải\/|Chương 3\/Không gian chợ nón\/)/.test(rel)).map(([h]) => PHOTOS[h]).filter(Boolean))
    const tkPages = pages.filter((q) => q.els.some((e) => e.type === 'image' && tkSrc.has(e.src))).map((q) => q.n)
    const groups = [
      // 08/11: theo nguồn nhóm ghi cho các ảnh nhóm gắn trong bản Nhật (tên báo để nguyên tiếng Việt như nhóm ghi)
      [['BÁO CHÍ', '新聞・ウェブメディア'], [
        [['Báo Thanh Niên', 'Báo Thanh Niên'], ['Nón lá sen · Nhà hát Ba Nón Lá · Expo 2021 Dubai · Tổng thống Hàn Quốc', 'ノン・ラー・セン・三つのノンラー劇場・ドバイ国際博覧会2021・韓国大統領']],
        [['Báo Quân đội nhân dân', 'Báo Quân đội Nhân dân'], ['Dao, kéo cắt lá · nghệ nhân Phạm Trần Canh · bà Trần Thị Hoa', '小刀とはさみ・職人ファム・チャン・カイン氏・トラン・ティ・ホアさん']],
        [['VietNamNet', 'VietnamNet'], ['Phu nhân Thủ tướng Singapore · nón lá trong thiết kế trang phục', 'シンガポール首相夫人・衣装デザインに取り入れられたノンラー']],
        [['Báo Dân Việt', 'Báo Dân Việt'], ['Nón bài thơ', 'ノン・バイ・トー']],
        [['Báo Lao Động', 'Báo Lao Động'], ['Nón lá bàng', 'ノン・ラー・バン']],
        [['VnExpress', 'VNEXPRESS'], ['Nón ngựa', 'ノン・グア']],
        [['Báo Dân tộc và Phát triển', 'Báo Dân tộc và phát triển'], ['Nón người Tày (Thái Nguyên)', 'タイ族のノンラー（タイグエン省）']],
        [['Đông Phong', 'Đông Phong'], ['Nón thúng (Nghệ An)', 'ノン・トゥン（ゲアン省）']],
        [['Tạp chí điện tử Làng nghề Việt', 'Tạp chí điện tử Làng nghề Việt'], ['Nón quai thao', 'ノン・クアイ・タオ']],
        [['Báo Sóng Trẻ', 'Báo Sóng trẻ'], ['Nón lá trên sàn diễn thời trang', '衣装デザインに取り入れられたノンラー']],
        [['Tạp chí điện tử Văn hóa và Phát triển', 'Tạp chí điện tử Văn hóa và Phát triển'], ['Nón lá làng Chuông nhiều kiểu dáng', 'さまざまな形やデザインのチュオン村のノンラー']],
        [['Chạm Sắc (VTV5)', 'Chạm Sắc（VTV5）'], ['Nón lá vẽ hoa văn sơn mài', '「ノンラー・ソンマイ」']],
        [['Maries', 'Maries'], ['Lễ báo công năm 2025', '2025年の活動報告式']],
      ]],
      [['BẢO TÀNG · KHO ẢNH MỞ', '博物館・パブリックドメイン'], [
        [['Bảo tàng Lịch sử Quốc gia', '国立歴史博物館'], ['Trống đồng Ngọc Lũ · thạp đồng Đào Thịnh', 'ゴックルー銅鼓・ダオティン銅製容器']],
        [['Bảo tàng Hà Nội', 'ハノイ博物館'], ['Nón lá khi lao động · người dân đội nón đi chợ', '屋外での作業に使われるノンラー・市場へ行く人々']],
        [['André Salles (BnF)', 'アンドレ・サル（フランス国立図書館）'], ['Hàng bán nón Hà Nội, 1896 · phạm vi công cộng', '1896年ハノイのノンラー売り・パブリックドメイン']],
      ]],
      [['VIDEO VÀ BẢN ĐỒ', '動画・地図'], [
        [['Nghệ nhân Lê Văn Tuy', '職人レ・ヴァン・トゥイ氏'], ['Video trình diễn nón lá trên sàn diễn thời trang quốc tế (mục 3.2)', '海外のファッションショーのノンラーの動画（3.2節）']],
        [['Natural Earth (phạm vi công cộng)', 'ナチュラルアース（パブリックドメイン）'], ['Bản đồ Việt Nam, bản theo quan điểm của Việt Nam', 'ベトナムの地図（ベトナムの立場による版）']],
        [['© OpenStreetMap contributors (ODbL) · OSRM · Google Maps', '© オープンストリートマップの貢献者・OSRM・グーグルマップ'], ['Bản đồ hành trình: nền bản đồ, định tuyến, quãng đường', '旅の地図：地図データ・経路・距離']],
      ]],
    ]
    const note = [
      `Ảnh chợ nón Chuông ở trang ${tkPages.join(', ')} và hai ảnh bưu thiếp (chợ đèn lồng, bàn tay nâng chồng nón): nhiếp ảnh Trọng Khải. Các ảnh không ghi nguồn khác do nhóm tự chụp tại làng Chuông và các bảo tàng ở Hà Nội.`,
      `${tkPages.join('、')}ページのチュオン村のノンラー市場の画像と絵はがきの画像2点（提灯の下の市場、ノンラーを持つ手）：チョン・カイ撮影。そのほか出典の記載がない画像は、チュオン村とハノイの博物館で著者が撮影したものです。`,
    ]
    f.page()
    const p = f.p
    const y0 = sectionHead(p, TOP, null, ['Nguồn ảnh', '画像の出典'], ['Ghi công hình ảnh', '画像と資料の提供'])
    const lw = 132
    const dw = p.cw - lw - 14
    // cỡ chữ lớn nhất mà cả bảng vừa trang
    const layout = (size, draw) => {
      const o = { size, lh: 1.4, jaSize: size }
      let y = y0 - 6
      const nh = textH(note, p.cw, o)
      if (draw) p.add(T(p.x0, y, p.cw, nh, note, { ...o, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Ghi chú' }))
      y += nh + 10
      for (const [label, rows] of groups) {
        if (draw) p.add(T(p.x0, y, p.cw, 16, label, { size: S.label - 1, tracking: 2.2, weight: 700, color: ACC[9], lh: 1.3, jaFont: F.jaSans, name: 'Nhóm' }))
        y += 20
        rows.forEach(([src, what], i) => {
          const h = Math.max(textH(src, lw, { ...o, weight: 700 }), textH(what, dw, o))
          if (draw) {
            if (i) p.add(HL(p.x0, y - 2.5, p.cw, C.line, 0.4))
            p.add(
              T(p.x0, y, lw, h, src, { ...o, weight: 700, color: C.ink, jaFont: F.jaSans, name: 'Nguồn' }),
              T(p.x0 + lw + 14, y, dw, h, what, { ...o, color: C.ink2, jaFont: F.jaSans, name: 'Ảnh' })
            )
          }
          y += h + 5
        })
        y += 8
      }
      return y
    }
    // cỡ chữ lớn nhất (12pt trở xuống) mà cả bảng vừa trang
    let size = 12
    while (size > 9 && layout(size, false) > BOT - 6) size -= 0.25
    f.y = layout(size, true)
    p.fixed = true
    f.end()
  }

  // trang kết: giảng viên hướng dẫn, thành viên, email
  const p = new Page({ chapter: 9, bg: C.cream })
  p.fixed = true // bố cục tự đặt: không để bước căn giữa phần cuối trang dời lời nhắn xuống đáy
  runningHead(p, ['NHÓM THỰC HIỆN', '制作チーム'])
  mark(1, e.team.title, p, '—')
  let y = sectionHead(p, TOP, null, e.team.title, ['Những người làm nên cuốn sách', 'この本をつくった人たち'])
  const lo = { size: 14, lh: 1.6, jaSize: jaPt(14) }
  const lh = textH(e.team.lead, p.cw, lo)
  p.add(T(p.x0, y, p.cw, lh, e.team.lead, { ...lo, jaFont: F.jaBody, name: 'Đoạn văn' }))
  y += lh + 18
  // khối thành viên + lời nhắn đặt giữa phần trang còn lại (không dồn lên trên, không dạt xuống đáy)
  const co = { size: 13, lh: 1.45, jaSize: 13, paraGap: 3 }
  const ch = textH(e.team.contact, p.cw, co)
  const photo = PHOTOS['Nhóm thực hiện'] && ['Nhóm thực hiện', '制作チーム']
  if (photo) {
    // 08/11 (tab Bổ sung: "Bổ sung ảnh nhóm"): ảnh nhóm ở cổng đình (thư mục ảnh nhóm, chụp ngang) — khác buổi chụp với ảnh
    // Lời mở đầu (tr. 4) và tr. 15 (soát độc lập: hai ảnh cùng buổi). Ảnh rộng hết khổ, dưới là lưới 2×2 tên thành viên
    const pch = capH(photo, p.cw)
    // Zalo chị Linh 08/11: "phần cuối nhóm em để ảnh cá nhân từng người nha" → hàng bốn ảnh chân dung (thư mục "Ảnh nhóm"),
    // tên + mã sinh viên dưới từng ảnh; ảnh cả nhóm thu lại phía trên
    const tw4 = (p.cw - 3 * 12) / 4
    const th4 = r1(tw4)
    const nameO = { font: F.head, size: 13.5, align: 'center', lh: 1.25, jaFont: F.jaHead, jaSize: 12.5 }
    const nh4 = Math.max(...e.team.members.map(([name]) => textH(name, tw4, nameO)))
    const gridH = 26 + th4 + 6 + nh4 + 18 + 10
    const ph = r1(Math.max(p.cw * 0.27, Math.min(p.cw * 0.62, BOT - 10 - y - (6 + pch + 12 + gridH + 12 + 18 + ch + 22))))
    p.add(IMG(p.x0, y, p.cw, ph, photo, { pos: '50% 45%' }))
    p.add(T(p.x0, y + ph + 6, p.cw, pch, fmtCap(photo), { ...capOpt, italic: true, color: C.muted, jaFont: F.jaSans, name: 'Chú thích ảnh' }))
    y += ph + 6 + pch + 12
    y += Math.max(0, (BOT - 10 - y - (gridH + 12 + 18 + ch + 22)) / 2)
    p.add(T(p.x0, y, p.cw, 16, e.team.membersTitle.map((s) => s.toUpperCase()), { size: S.label, tracking: 2.4, weight: 700, color: ACC[9], align: 'center', jaFont: F.jaSans, name: 'Nhóm' }))
    y += 26
    // khung vuông, ảnh dọc 3:4 chụp nửa người: phóng quanh mặt từng người (đầu + vai)
    const FACE = [{ x: 50, y: 40, z: 1.7 }, { x: 35, y: 40, z: 1.7 }, { x: 51, y: 42, z: 1.6 }, { x: 48, y: 40, z: 1.7 }]
    e.team.members.forEach(([name, code], i) => {
      const mx = p.x0 + i * (tw4 + 12)
      const hint = [`Thành viên: ${name[0]}`, name[1]]
      p.add(
        { ...IMG(mx, y, tw4, th4, hint, PHOTOS[hint[0]] ? { crop: FACE[i] } : {}), name: 'Ảnh thành viên', alt: name },
        T(mx - 4, y + th4 + 6, tw4 + 8, nh4, name, { ...nameO, name: 'Tên thành viên' }),
        T(mx, y + th4 + 6 + nh4 + 2, tw4, 14, [code, null], { size: 11, tracking: 1.2, align: 'center', color: C.muted, name: 'Mã sinh viên' })
      )
    })
    y += th4 + 6 + nh4 + 18 + 12
  } else {
    const blockH = 30 + 2 * 110 + 26 + 18 + ch + 22
    y += Math.max(0, (BOT - 10 - y - blockH) / 2)
    p.add(T(p.x0, y, p.cw, 16, e.team.membersTitle.map((s) => s.toUpperCase()), { size: S.label, tracking: 2.4, weight: 700, color: ACC[9], jaFont: F.jaSans, name: 'Nhóm' }))
    y += 30
    const mw = (p.cw - 14) / 2
    e.team.members.forEach(([name, code], i) => {
      const mx = p.x0 + (i % 2) * (mw + 14)
      const my = y + Math.floor(i / 2) * 110
      // chưa có ảnh của nhóm → chữ cái đầu tên trong vòng đường khâu (không để khung ảnh tạm)
      const ini = name[0].split(' ').slice(-2).map((w) => w[0]).join('')
      const cx = mx + (mw - 56) / 2
      p.add(
        RECT(cx, my, 56, 56, TINT[9], { radius: 28, stroke: ACC[9], sw: 0.9, dash: '3 2.5', name: 'Vòng tên' }),
        T(cx, my + 15, 56, 26, [ini, ini.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D')], { font: F.head, size: 20, align: 'center', color: ACC[9], lh: 1.2, name: 'Chữ đầu tên' }),
        T(mx, my + 64, mw, 22, name, { font: F.head, size: 16.5, align: 'center', lh: 1.3, jaFont: F.jaHead, jaSize: 15, name: 'Tên thành viên' }),
        T(mx, my + 88, mw, 16, [code, null], { size: 12, tracking: 1.4, align: 'center', color: C.muted, name: 'Mã sinh viên' })
      )
    })
    // dòng kẻ + lời nhắn cách hàng mã sinh viên một khoảng thở (góp ý: sát ảnh/tên quá)
    y += 2 * 110 + 26
  }
  p.add(HL(p.x0, y, p.cw, C.line, 0.5))
  p.add(T(p.x0, y + 12, p.cw, ch, e.team.contact, { ...co, align: 'center', italic: true, color: C.ink2, jaFont: F.jaBody, name: 'Liên hệ' }))
  p.add(T(p.x0, y + 18 + ch, p.cw, 22, ['Email: ' + e.team.email, 'メールアドレス：' + e.team.email], { size: 15, weight: 700, align: 'center', color: ACC[9], lh: 1.4, jaFont: F.jaSans, name: 'Email' }))

  // trang lót mặt trong bìa sau (trang phải) rồi bìa sau (trang trái cuối cùng)
  if ((pages.length + 1) % 2 === 0) photoPage(['Ảnh toàn trang: những chiếc nón trên sân phơi lúc hoàng hôn', '全面写真：夕暮れの庭に並ぶノンラー'], 9)
  // trang lót → bưu thiếp Làng Chuông: chọn ảnh + câu ca dao, tải về gửi bạn bè (thứ người đọc mang về khi gấp sách)
  {
    const q = new Page({ chapter: 9 })
    runningHead(q, ['BƯU THIẾP', '絵はがき'])
    let y = sectionHead(q, TOP, null, ['Bưu thiếp từ Làng Chuông', 'チュオン村からの絵はがき'], ['Một chút làng mang về', '村のおみやげに'])
    const lead = ['Chọn một bức ảnh và một câu ca dao, rồi tải tấm bưu thiếp về để gửi người thân, bạn bè.', '画像とカーザオ（民謡）を一つずつ選んで、絵はがきを保存し、家族や友だちに送ってみてください。']
    const lo = { size: 14.5, lh: 1.5, jaSize: 14.5 }
    const lh = textH(lead, q.cw, lo)
    q.add(T(q.x0, y - 6, q.cw, lh, lead, { ...lo, color: C.ink2, jaFont: F.jaBody, name: 'Đoạn văn' }))
    y += lh + 14
    const card = (hint, pos) => ({ src: PHOTOS[hint[0]] ?? '', cap: hint.map(pageCap), pos })
    const photos = [
      // anh Hải 08/11: "tránh dùng ảnh thành viên nhóm tại cho người khác tải về" → rồi "ảnh xấu vl … xem cái nào làm tem oke,
      // dùng lại ảnh đc miễn nó đẹp": 4 ảnh nhóm tự chụp, không có thành viên nhóm, hợp khung gần vuông của tấm thiếp
      card(['Đình Chuông — không gian sinh hoạt của làng nghề', 'チュオン村のディン（村の共同祭祀施設）'], [50, 50]),
      card(['Ảnh trang lót: phiên chợ Chuông lúc chiều muộn trước sân đình', '見返し写真：夕暮れの亭の前で開かれるチュオンの市'], [50, 70]),
      // anh Hải: "2 ảnh này xấu mà" (nón xếp chồng, lòng nón chỉ nhôi) → chợ đèn lồng (ảnh cũ) + bàn tay nâng chồng nón
      card(['Chợ nón Chuông dưới mái che treo đèn lồng', '提灯の下がる屋根の下のチュオンのノンラー市場'], [50, 40]),
      card(['Bàn tay người bán nâng chồng nón trắng', 'チュオン{村|むら}のノンラー市場で売られている伝統的なノンラー'], [45, 50]),
    ]
    const verses = [
      ['Muốn ăn cơm trắng cá trê\nMuốn đội nón tốt thì về làng Chuông', '白いご飯とナマズを食べたいなら、\nよいノンラーをかぶりたいなら、チュオン村へ。'],
      ['Qua đình ngả nón trông đình\nĐình bao nhiêu ngói thương mình bấy nhiêu', '亭（ディン）の前を通り、ノンラーを傾けて亭を眺める。\n亭の屋根を覆う瓦の数ほど、あなたを想う。'],
      ['Mồng mười đi chợ Chuông chơi\nXem đánh cờ người, xem thổi cơm thi', '十日にはチュオン市場へ遊びに行こう。\n人間棋の対局や炊飯競争を見て楽しもう。'],
    ]
    // anh Hải 05/11: "màn chọn tem hơi nhỏ, ko nhìn rõ để biết cái nào đẹp cái nào ưng" → khối bưu thiếp cao hết phần
    // còn lại của trang: ảnh chọn to (lưới 2 × 2 giãn theo chỗ), câu ca dao hiện đủ hai dòng (trước chỉ dòng đầu + "…")
    // bản tiếng Nhật: chú thích hai từ trong ca dao (nhóm dịch, tab "Câu nói hay") ngay dưới đoạn dẫn, bản tiếng Việt không cần
    // (soát 04/11: đặt ở đáy trang thì đè lên dòng "JPG 1200 × 1650" ở chân tấm thiếp)
    q.add({ ...T(q.x0, y - 4, q.cw, 32, ['亭（ディン）', '亭（ディン）：ベトナムの村にある伝統的な建物で、守護神を祀り、集会や祭りにも使われます。\n人間棋：人が駒の役割を演じるベトナムの伝統的な遊びです。'], { size: 9.5, lh: 1.45, jaSize: 9.5, color: C.muted, jaFont: F.jaSans, name: 'Chú thích' }), only: 'ja' })
    // soát vòng 7: bản VI không có dòng chú thích JA ở trên → khối bưu thiếp bản VI đặt cao lên 34pt (trước trống một dải)
    q.add({ ...WIDGET(q.x0, y, q.cw, BOT - y, 'postcard', { name: 'Bưu thiếp tương tác', data: { photos, verses } }), only: 'vi' })
    y += 34
    q.add({ ...WIDGET(q.x0, y, q.cw, BOT - y, 'postcard', { name: 'Bưu thiếp tương tác', data: { photos, verses } }), only: 'ja' })
    q.fixed = true
  }
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
  const STATION_PHOTO = {
    1: ['Tay nghệ nhân rẽ từng chiếc lá', '葉を一枚ずつのばす職人の手'],
    2: ['Nghệ nhân ngồi là lá bên bếp điện', '電気コンロのそばで葉を平らに伸ばす職人'],
    3: ['Khuôn nón — nơi đặt lần lượt 16 vành nứa', '16本のヌアの輪を順にはめていくノンラーの製作型'],
    4: ['Xếp từng lớp lá lụi lên khuôn', 'ラルイを一枚ずつ型に重ねる'],
    5: ['Cận cảnh mũi kim, sợi cước xuyên qua lớp lá', '葉の層を通る針と糸のクローズアップ'],
    6: ['Cắt lá thừa và khâu viền vành nón', '余分な葉を切り、外縁を縫う'],
    7: ['Chỉ màu luồn trong lòng nón', 'ノンラーの内側に通した色糸'],
    8: ['Quét lớp dầu bóng lên mặt nón', 'ノンラーの表面に保護用の油を塗る'],
  }
  // soát vòng 8: ~2,5 giây đầu trang gần như trống, 4,5 giây mới đủ 8 công đoạn → mọi nhịp × 0,6 (anh Hải cũng chê hiệu ứng
  // lũy tre "lâu quá")
  const JK = 0.6
  const anim = (kind, delay, dur) => (el) => ({ ...el, anim: { kind, delay: r1(delay * JK), dur: r1(dur * JK) } })
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
    const no = s.finish ? [`BƯỚC ${i + 1} · ${strip(s.label[0]).toUpperCase()}`, strip(s.label[1])] : [`BƯỚC ${s.no}`, `ステップ${s.no}`]
    const nameO = { font: F.head, size: 20, lh: 1.2, jaSize: 19 }
    const nh = textH(s.name, lw, nameO)
    const subO = { size: 12.5, italic: true, lh: 1.35 }
    const sub = [`${strip(s.sub[0])} · tr. ${s.page}`, `${strip(s.sub[1])}・${s.page}ページ`]
    const sh = textH(sub, lw, subO)
    const top = cy - (16 + nh + 4 + sh) / 2
    const els = [
      ELL(cx - r, cy - r, 2 * r, 2 * r, '#fbf6ea', { stroke: acc, sw: 2 }),
      // góp ý 04/11 (Khánh Huyền, Bản sửa lần 1): trong vòng tròn là ảnh thật của công đoạn (ảnh nhóm gán cho bước đó)
      { ...IMG(cx - r + 3, cy - r + 3, 2 * r - 6, 2 * r - 6, STATION_PHOTO[s.finish ? 8 : s.no]), round: true, name: 'Ảnh trạm' },
      ELL(cx - r - 4, cy - r - 4, 26, 26, acc),
      T(cx - r - 4, cy - r + 0.5, 26, 18, [String(i + 1), null], { font: F.head, size: 14, weight: 700, color: '#fff', align: 'center', lh: 1.2, name: 'Số bước' }),
      T(lx, top, lw, 16, no, { size: 11.5, tracking: 2, weight: 700, color: acc, align: right ? 'left' : 'right', lh: 1.3, jaFont: F.jaSans, name: 'Nhãn bước' }),
      T(lx, top + 16, lw, nh, s.name, { ...nameO, weight: 700, color: C.ink, align: right ? 'left' : 'right', jaFont: F.jaHead, name: 'Tên bước' }),
      T(lx, top + 16 + nh + 4, lw, sh, sub, { ...subO, color: C.muted, align: right ? 'left' : 'right', jaFont: F.jaSans, name: 'Phụ đề' }),
      RECT(Math.min(cx - r, lx) - 6, Math.min(cy - r, top) - 6, lw + 2 * r + 28, Math.max(2 * r, 16 + nh + 4 + sh) + 12, 'none', { radius: 10, link: `#p${s.page}`, alt: [`${strip(s.name[0])} — tr. ${s.page}`, `${strip(s.name[1] ?? s.name[0])} — ${s.page}ページ`], name: 'Trạm công đoạn' }),
    ]
    pg.add(els.map(anim('pop', delay, 0.55)))
  }
  stepPages.forEach((s, i) => (i < 4 ? station(L, PL[i], s, i, 0.35 + i * 0.45) : station(Rp, PR[i - 4], s, i, 2.25 + (i - 4) * 0.45)))
  // cuối đường: chiếc nón hoàn thiện + lời viết tay
  Rp.add(anim('pop', 4.1, 0.7)({ ...DECO('non', xr - 95, 70, 190, 165, 1), name: 'Hình vẽ' }))
  Rp.add(anim('fade', 4.4, 0.6)(T(Rp.x0, 116, 280, 60, ch2.process.done, { font: F.hand, size: 24, lh: 1.25, jaSize: 20, color: acc, jaFont: F.jaHand, name: 'Lời kết' })))
  // mỗi cặp trang công đoạn: hình vẽ dụng cụ của bước (giống trạm trên bản đồ) + hàng số bước 1–8 có lời mời bấm
  // (góp ý: chấm trơn không số, không chữ → không ai biết bấm vào để nhảy bước, phải tự đếm). Bước đang xem tô màu.
  stepPages.forEach((s) => {
    const pg = pages[s.page - 1]
    const hl = pg.els.find((e) => e.type === 'line' && e.name === 'Đường kẻ' && e.y > TOP && e.y < 320)
    const dy = hl ? hl.y + 24 : TOP + 140
    pg.add({ ...DECO(ICON[s.finish ? 0 : s.no], pg.x1 - 92, TOP - 6, 92, 92, 0.95), name: 'Hình vẽ' })
    const d = 23
    const step = 27
    const x0 = pg.x1 - stepPages.length * step + (step - d)
    pg.add(T(x0 - 190, dy - 8, 180, 18, ['Bấm số để chuyển bước →', '番号をクリックで工程へ →'], { font: F.hand, size: 15.5, lh: 1.1, jaSize: 12, align: 'right', color: acc, jaFont: F.jaHand, name: 'Lời mời bấm' }))
    stepPages.forEach((t, j) => {
      const x = x0 + j * step
      const on = t === s
      const alt = [`${j + 1}. ${strip(t.name[0])} — tr. ${t.page}`, `${j + 1}. ${strip(t.name[1] ?? t.name[0])} — ${t.page}ページ`]
      pg.add(
        ELL(x, dy - d / 2, d, d, on ? acc : '#fbf6ea', { stroke: acc, sw: 1.1, name: 'Số bước tròn' }),
        T(x, dy - 7.6, d, 15, [String(j + 1), null], { size: 12.5, weight: 700, lh: 1.2, align: 'center', color: on ? '#fff' : acc, name: 'Số trên chấm' }),
        // lớp bấm nằm trên cùng: bấm vào số hay viền đều lật được
        RECT(x - 2, dy - d / 2 - 2, d + 4, d + 4, 'none', { radius: d, link: on ? undefined : `#p${t.page}`, alt, name: 'Chấm tiến trình' })
      )
    })
  })

  // mười sáu vòng nón in mờ vắt ngang gáy sách: mỗi trang một nửa → hai trang liền một khối (ý Minh Ánh: họa tiết nối hai trang)
  const ds = 560
  // xoay chậm (góp ý: cho vòng nón nền xoay tròn thì ấn tượng hơn) — hai nửa cùng nhịp nên vẫn liền một khối qua gáy
  L.els.unshift({ ...DECO('vong-non', W - ds / 2, 250, ds, ds, 0.17), name: 'Hình vẽ', spin: 80 })
  Rp.els.unshift({ ...DECO('vong-non', -ds / 2, 250, ds, ds, 0.17), name: 'Hình vẽ', spin: 80 })
}

// ═════════════════════════════════════════ BA THẺ CHƯƠNG — trang "Trong cuốn sách này" (điền sau khi biết trang chương)
// góp ý 04/11: hình trên thẻ phải khớp nội dung chương (thẻ chương 3 trước là cây tre) → ảnh mở đầu của chính chương đó
// trong khung tròn; đối tượng chính là nón lá Làng Chuông
const CH_PHOTO = {
  1: ['Ảnh mở chương: thiếu nữ áo dài đội nón lá', '章扉写真：アオザイをまとったベトナム人女性とノンラー'],
  2: ['Ảnh mở chương: đôi bàn tay nghệ nhân khâu nón trên khuôn', '章扉写真：型の上でノンラーを縫う職人の手'],
  3: ['Ảnh mở chương: em bé ôm chiếc nón lá — thế hệ mai sau của làng nghề', '章扉写真：ノンラーを抱く子ども — 工芸村の未来を担う世代'],
}
{
  const { page: p, y: top, h: ch, gap } = contents
  const chapters = anchors.filter((a) => /^0\d$/.test(a.label))
  chapters.forEach((a, i) => {
    const y = top + i * (ch + gap)
    const no = Number(a.label)
    const acc = ACC[no]
    const card = preface.chapters[i]
    const title = [strip(a.title[0]).replace(/\n/g, ' '), strip(a.title[1]).replace(/\n/g, '')]
    const alt = [`${a.label} ${title[0]} — tr. ${a.page}`, `${a.label} ${title[1] || title[0]} — ${a.page}ページ`]
    // thẻ giấy sáng viền đường khâu màu chương; ảnh mở chương trong khung tròn; số chương lớn + "Trang 08 →" bên phải.
    // Cả thẻ là một nút: lớp link phủ trên cùng
    const iw = Math.min(ch - 28, 124)
    const ix = p.x0 + 16
    const tx = ix + iw + 20
    const tw = p.x1 - 70 - tx
    const tO = { font: F.head, size: 17, lh: 1.25, jaSize: 16 }
    const th = textH(title, tw, tO)
    const dO = { size: 13, lh: 1.45, jaSize: 13 }
    const dh = textH(card.text, tw, dO)
    const pad = String(a.page).padStart(2, '0')
    const ty = y + Math.max(12, (ch - (18 + th + 8 + dh + 26)) / 2)
    p.add(
      RECT(p.x0, y, p.cw, ch, '#fbf6ea', { radius: 8, opacity: 0.92, stroke: TINT[no], sw: 1.2, name: 'Thẻ chương' }),
      RECT(p.x0 + 5, y + 5, p.cw - 10, ch - 10, 'none', { radius: 5, stroke: acc, sw: 0.8, dash: '3 2.5', opacity: 0.7, name: 'Đường khâu' }),
      ELL(ix - 3, y + (ch - iw) / 2 - 3, iw + 6, iw + 6, 'none', { stroke: acc, sw: 1, name: 'Viền ảnh tròn' }),
      { ...IMG(ix, y + (ch - iw) / 2, iw, iw, CH_PHOTO[no], { name: 'Ảnh chương' }), round: true },
      T(tx, ty, 160, 18, [`CHƯƠNG ${no}`, `パート${no}`], { size: 11, tracking: 2.2, weight: 700, color: acc, lh: 1.3, jaFont: F.jaSans, name: 'Số chương' }),
      T(tx, ty + 18, tw, th, title, { ...tO, color: C.ink, jaFont: F.jaHead, name: 'Tên chương' }),
      T(tx, ty + 26 + th, tw, dh, card.text, { ...dO, italic: true, color: C.ink2, jaFont: F.jaSans, name: 'Mô tả chương' }),
      T(tx, ty + 34 + th + dh, 120, 16, [`Trang ${pad} →`, `${a.page}ページ →`], { size: 11.5, weight: 600, tracking: 0.5, color: acc, lh: 1.3, jaFont: F.jaSans, name: 'Số trang chương' }),
      T(p.x1 - 66, y + 10, 54, 40, [String(no).padStart(2, '0'), null], { font: F.head, size: 34, color: acc, align: 'right', lh: 1.15, name: 'Số chương lớn' }),
      RECT(p.x0, y, p.cw, ch, 'none', { radius: 8, link: `#p${a.page}`, alt, name: 'Nút thẻ chương' })
    )
  })
}

// ═════════════════════════════════════════ TRANG HƯỚNG DẪN ĐỌC SÁCH (góp ý 04/11: cần một trang hướng dẫn ở đầu sách)
{
  const g = guidePage
  runningHead(g, ['CÁCH ĐỌC SÁCH', 'この本の読み方'])
  let y = sectionHead(g, TOP, null, ['Cách đọc cuốn sách', 'この本の{読|よ}み{方|かた}'], ['Trước khi lên đường', '旅に出る前に'])
  const step = anchors.find((a) => a.label === '2.3.2')?.page
  const tips = [
    ['tool-re-la', ['Lật trang', 'ページをめくる'], ['Bấm vào mép trang hoặc kéo góc trang; cũng có thể dùng phím ← → hay hai nút mũi tên dưới sách. Gõ số trang vào ô ở thanh dưới để tới thẳng trang đó.', 'ページの端をクリックするか、角をドラッグしてめくります。キーボードの ← → や、本の下の矢印ボタンも使えます。下のバーにページ番号を入れると、そのページへ移動します。']],
    ['non', ['Xem ảnh lớn', '画像を大きく見る'], ['Bấm vào bất kỳ bức ảnh nào để mở ảnh lớn kèm chú thích; bấm ra ngoài hoặc phím Esc để đóng.', '画像をクリックすると、説明つきで大きく表示されます。外側をクリックするか Esc キーで閉じます。']],
    ['leaf-sprig', ['Mục lục và thẻ chương', '目次とパートのカード'], ['Bấm vào một dòng mục lục hay một thẻ chương để lật ngay tới phần đó.', '目次の行やパートのカードをクリックすると、その部分へすぐに移動します。']],
    ['tool-quay-non', ['Quy trình làm nón', 'ノンラー作りの工程'], [`Ở mục 2.3.2${step ? ` (trang ${step})` : ''}, bấm vào một trạm trên bản đồ tám bước hoặc vào số bước để tới công đoạn đó; mỗi bước có ảnh động (GIF) quay cảnh thật.`, `2.3.2節${step ? `（${step}ページ）` : ''}では、八つの工程の地図の駅や番号をクリックすると、その工程へ移動します。各工程には実際の様子を写したGIF動画があります。`]],
    ['khung-non', ['Mô hình và bản đồ', '模型と地図'], ['Kéo để xoay nón 3D; bấm vào một lớp lá để làm nổi bật lớp đó. Bấm vào bản đồ để xem đường đến làng Chuông.', '3Dのノンラーはドラッグで回転し、葉の層をクリックするとその層が色で強調されます。地図をクリックすると、チュオン村への道のりが見られます。']],
    ['bia-non', ['Bưu thiếp cuối sách', '巻末の絵はがき'], ['Chọn một bức ảnh và một câu ca dao, rồi tải tấm bưu thiếp về làm kỷ niệm.', '画像とカーザオ（民謡）を一つずつ選び、絵はがきを保存して記念にどうぞ。']],
  ]
  const nO = { font: F.head, size: 16, lh: 1.25, jaSize: 15 }
  const dO = { size: 13, lh: 1.5, jaSize: 13 }
  const iw = 52
  const tw = g.cw - iw - 18
  const hs = tips.map(([, n, d]) => textH(n, tw, nO) + 4 + textH(d, tw, dO))
  const gapY = Math.min(30, (BOT - 64 - y - hs.reduce((a, b) => a + b, 0)) / (tips.length - 1))
  tips.forEach(([icon, n, d], i) => {
    const nh = textH(n, tw, nO)
    g.add(
      ELL(g.x0, y, iw, iw, TINT[0], { opacity: 0.8, name: 'Nền hình vẽ' }),
      { ...DECO(icon, g.x0 + 6, y + 6, iw - 12, iw - 12, 0.95), name: 'Hình vẽ' },
      T(g.x0 + iw + 18, y, tw, nh, n, { ...nO, weight: 700, color: ACC[0], jaFont: F.jaHead, name: 'Tên mục' }),
      T(g.x0 + iw + 18, y + nh + 4, tw, textH(d, tw, dO), d, { ...dO, color: C.ink2, jaFont: F.jaBody, name: 'Mô tả' })
    )
    y += hs[i] + gapY
  })
  // thẻ ghi chú nổi bật (kiểu nhãn "!" trong ảnh mẫu của nhóm)
  tipBox(g, BOT - 48, ['Thấy biểu tượng bàn tay ☝ hay chữ viết tay màu nâu là chỗ bấm được.', '☝ の印や茶色の手書き文字のところは、クリックできます。'])
}

// ═════════════════════════════════════════ MỤC LỤC (điền sau khi biết số trang)
// góp ý 04/11: mục lục gọn MỘT trang, không đánh số các mục nhỏ (bỏ 1.3.1, 2.1.1…; mục cấp 2 dùng ký hiệu thay số cho
// bớt trang trọng), bỏ dòng "Lưu ý về nội dung" (đã nằm trong phần Kết luận). Trang đối diện: trang ca dao.
{
  const tp = tocPages[0]
  tp.add(T(tp.x0, 70, 320, 44, tocTitle.map(strip), { font: F.head, size: 34, lh: 1.2, color: C.title, jaFont: F.jaHead, name: 'Tiêu đề' }), HL(tp.x0, 124, 56, ACC[0], 1.4))
  const list = anchors.filter((a) => a.level <= 2 && !/^Lưu ý/.test(strip(a.title[0])))
  // soát 04/11: mỗi thứ tiếng một bộ dòng riêng (el.only) — chiều cao dòng theo đúng chữ của thứ tiếng đó
  // (trước: dòng cao theo bản dài hơn → bản JA có dòng trống thừa dưới tên mục ngắn)
  let y = 150
  for (const [li, lang] of [[0, 'vi'], [1, 'ja']]) {
    const add = (...els) => tp.add(...els.map((e) => ({ ...e, only: lang })))
    const rows = list.map((a) => {
      const title = [strip(a.title[0]).replace(/\n/g, ' '), a.title[1] && strip(a.title[1]).replace(/\n/g, '')]
      const o = a.level === 1 ? { font: F.head, size: 16, lh: 1.25, jaSize: 15.5 } : { size: 12.5, lh: 1.35, jaSize: 12.5 }
      const indent = a.level === 1 ? 46 : 64
      const th = textH1(title, CW - indent - 48, o, li)
      return { a, title, o, indent, th, need: a.level === 1 ? th + 24 : th + 6 }
    })
    const top = 150
    const total = rows.reduce((n, r) => n + r.need, 0)
    const k = Math.min(1.35, Math.max(1, (BOT - 40 - top) / total)) // giãn đều nếu còn chỗ
    y = top
    for (const r of rows) {
      const { a, title, o, indent, th } = r
      const acc = ACC[{ '01': 1, '02': 2, '03': 3 }[a.label] ?? (a.label[0] === '1' ? 1 : a.label[0] === '2' ? 2 : a.label[0] === '3' ? 3 : 9)]
      const pg = String(a.page).padStart(2, '0')
      // cả dòng (số mục + tên + số trang) là một khối bấm: rê chuột sáng cả dòng, bấm → lật tới trang đó
      const row = (ry, rh, dx = 0) => RECT(tp.x0 + dx - 8, ry, tp.cw - dx + 16, rh, 'none', { radius: 4, link: `#p${a.page}`, alt: `${a.label === '—' ? '' : a.label + ' '}${title[li] ?? title[0]} — ${li === 1 ? `${a.page}ページ` : `tr. ${a.page}`}`, name: 'Dòng mục lục' })
      if (a.level === 1) {
        y += 14 * k
        add(T(tp.x0, y - 2, 40, 24, [a.label, null], { font: F.head, size: 19, color: acc, lh: 1.1, name: 'Số chương' }), T(tp.x0 + indent, y, tp.cw - indent - 48, th, title, { ...o, color: C.ink, jaFont: F.jaHead, name: 'Mục lục' }), T(tp.x1 - 44, y + 1, 44, 20, [pg, null], { font: F.head, size: 14, color: acc, align: 'right', lh: 1.3, name: 'Số trang' }))
        add(row(y - 5, th + 9))
        y += th + 8 * k
      } else {
        add(RECT(tp.x0 + indent - 14, y + 7, 5, 5, acc, { radius: 1, opacity: 0.8, name: 'Ký hiệu mục' }), T(tp.x0 + indent, y, tp.cw - indent - 48, th, title, { ...o, color: C.ink2, jaFont: F.jaSans, name: 'Mục lục' }), T(tp.x1 - 44, y, 44, 18, [pg, null], { size: 12, color: C.muted, align: 'right', lh: 1.35, name: 'Số trang' }))
        add(row(y - 3, th + 4, indent - 18))
        y += th + 6 * k
      }
    }
  }
  if (y > BOT - 34) console.warn(`⚠ Mục lục tràn: ${Math.round(y)} > ${Math.round(BOT - 34)}`)
  tipBox(tp, BOT - 36, ['Bấm vào một dòng để lật tới trang đó', '行をクリックすると、そのページへ移動します'], { size: 14, jaSize: 12.5 })

  // trang đối diện mục lục: câu ca dao về nón Chuông + hình nón nét mảnh (trang mở đầu nhẹ nhàng trước lời mở đầu)
  const ep = tocPages[1]
  ep.add({ ...DECO('vong-non', ep.x0 + 20, 190, ep.cw - 40, ep.cw - 40, 0.12), name: 'Hình vẽ' })
  // anh Hải 08/11 ("nhiều cái tương tác hơn — mở hộp, mở phong bì…"): hình nón vẽ thành phong bì thư gửi bạn đọc — bấm
  // mở, lá thư trượt ra mang câu ca dao nhóm dẫn ở mục 3.1 (nguyên văn, bỏ ngoặc kép); câu "Qua đình…" vẫn in dưới
  ep.add({
    ...WIDGET(ep.x0 + 20, 232, ep.cw - 40, 356, 'envelope', {
      name: 'Phong bì thư',
      data: {
        letter: ['Muốn ăn cơm trắng cá trê,\nMuốn đội nón tốt thì về làng Chuông', '白いご飯とナマズを食べたいなら、\n良いノンラーをかぶりたいなら、チュオン村へ'],
        sign: ['— Ca dao —', '— カーザオ（民謡）—'],
        to: ['Gửi bạn đọc', '読者の皆さまへ'],
        from: ['Từ làng Chuông, Hà Nội', 'チュオン村より'],
      },
    }),
    alt: ['Phong bì thư gửi bạn đọc — bấm để mở', '読者の皆さまへの手紙 — クリックして開く'],
  })
  const verse = ['Qua đình ngả nón trông đình\nĐình bao nhiêu ngói thương mình bấy nhiêu', '亭（ディン）の前を通り、ノンラーを傾けて亭を眺める。\n亭の屋根を覆う瓦の数ほど、あなたを想う。']
  const vo = { font: F.head, size: 21, lh: 1.6, jaSize: 17 }
  const vh = textH(verse, ep.cw - 40, vo)
  ep.add(T(ep.x0 + 20, 610, ep.cw - 40, vh, verse, { ...vo, italic: true, align: 'center', color: C.title, jaFont: F.jaHead, name: 'Trích dẫn' }))
  ep.add(T(ep.x0, 610 + vh + 14, ep.cw, 18, ['— Ca dao —', '— ベトナムの民謡（カーザオ）—'], { size: 12, tracking: 2, align: 'center', color: C.muted, lh: 1.3, jaFont: F.jaSans, name: 'Nguồn trích' }))
  ep.add({ ...T(ep.x0, BOT - 22, ep.cw, 18, ['亭', '亭（ディン）：ベトナムの村にある伝統的な建物で、守護神を祀り、集会や祭りにも使われます。'], { size: 9.5, lh: 1.4, jaSize: 9.5, color: C.muted, align: 'center', jaFont: F.jaSans, name: 'Chú thích' }), only: 'ja' })
}

// ── dàn lại từng trang: không để dải trống dưới đáy trang
// Sau khi xếp xong, phần còn dư ở đáy trang được (1) dùng để phóng ảnh lên khung tỉ lệ cố định lớn hơn kế tiếp
// (3:2 → 4:3 → 1:1…, ảnh là phần tử cao nhất trong hàng của nó), rồi (2) chia vào khoảng cách giữa các khối.
// Phần tử neo đáy (chú thích cuối trang) và trang trang trí / ảnh tràn trang thì để nguyên.
// trang trí đứng yên: đầu trang (vùng trên TOP), họa tiết góc, lớp tối; đường kẻ / số trong vùng nội dung thì dời theo khối của nó
const DECOR = new Set(['Đầu trang', 'Vạch màu', 'Họa tiết', 'Lớp tối', 'Bóng nắng'])
const FRAMES = [R.pan, R.cin, R.wide, R.std, R.sq, R.por]
const FIXED_WIDGETS = new Set(['rings', 'toolbox', 'envelope', 'sort'])
function settle(p) {
  if (p.fixed || p.bg === '#2b2118' || p.els.some((e) => e.type === 'image' && e.w * e.h > W * H * 0.8)) return
  const movable = p.els.filter((e) => !DECOR.has(e.name) && e.y >= TOP - 10 && e.y < BOT)
  const anchored = movable.filter((e) => e.y + e.h >= BOT - 30 && e.y > BOT - 200 && e.name !== 'Ảnh' && !CAP_NAMES.has(e.name) && e.type !== 'image' && e.type !== 'widget') // chú thích ảnh đi theo ảnh của nó, không neo đáy (soát 04/11: tr. 117 lấn chân trang)
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
    // trò tương tác dựng theo cỡ cố định (vòng nứa, hộp đồ nghề, phong bì, xếp công đoạn) không phóng như ảnh
    const first = b.els.find((e) => isPhoto(e) && e.fit !== 'contain' && !e.rot && !(e.type === 'widget' && FIXED_WIDGETS.has(e.kind)))
    if (!first) continue
    const row = b.els.filter((e) => isPhoto(e) && Math.abs(e.y - first.y) < 2 && Math.abs(e.h - first.h) < 2)
    const y0 = first.y
    const y1 = first.y + first.h
    const beside = b.els.some((e) => !row.includes(e) && e.type !== 'shape' && e.y < y1 - 2 && e.y + e.h > y0 + 2)
    if (beside) continue
    const w = Math.min(...row.map((e) => e.w))
    // không phóng khung cao hơn ảnh gốc (ảnh chụp ngang trong khung dọc bị cắt mất hai bên)
    const nats = row.map((e) => subjOf(e.src, e.hint)).filter(Boolean).map((sj) => 1 / sj.a)
    const maxR = Math.min(w > CW * 0.6 ? R.std : R.por, nats.length ? Math.max(Math.min(...nats) * 1.08, first.h / w) : 9)
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
function vignette(p) {
  if (p.fixed || p.noFlora || p.grove || p.hasImg || p.els.some((e) => e.type === 'image' && e.name === 'Hình vẽ')) return
  // chú thích cuối trang (và gạch ngắn phía trên nó) neo đáy, không tính là nội dung
  const foot = p.els.find((e) => e.name === 'Chú thích' && e.y > BOT - 200)
  const footTop = foot ? foot.y - 16 : BOT
  const content = p.els.filter((e) => !DECOR.has(e.name) && e.y >= TOP - 10 && e.y < footTop)
  if (!content.length) return
  const bottom = Math.max(...content.map((e) => e.y + e.h))
  const anchoredTop = footTop
  const room = anchoredTop - bottom - 24
  if (room < 64) return
  // 08/11: mẫu xoay vòng (pickMotif), không còn mỗi chương một hình lặp lại
  const m = pickMotif(p, 'c', p.cw * 0.62, Math.min(room, 200), 60)
  if (m) p.add({ ...DECO(m.name, p.x0 + (p.cw - m.w) / 2, bottom + 24 + (room - m.h) / 2, m.w, m.h, 0.85), name: 'Hình vẽ', fillDeco: true })
}
pages.forEach(vignette)
pages.forEach(settle)
// hoa văn cuối trang: trang có ảnh mà đáy còn dải trống (chữ / ảnh không chia đều được) → hình vẽ nét mảnh nhỏ của chương
function tailpiece(p) {
  if (p.fixed || p.grove || p.bg === '#2b2118' || p.els.some((e) => e.type === 'image' && e.w * e.h > W * H * 0.8)) return
  const foot = p.els.find((e) => e.name === 'Chú thích' && e.y > BOT - 200)
  const footTop = foot ? foot.y - 16 : BOT
  const content = p.els.filter((e) => !DECOR.has(e.name) && e.y >= TOP - 10 && e.y < footTop && e.name !== 'Nền số mục')
  if (!content.length) return
  const bottom = Math.max(...content.map((e) => e.y + e.h))
  const room = footTop - bottom - 20
  if (room < 84 || hasFill(p)) return
  const m = pickMotif(p, 'c', p.cw * 0.5, Math.min(room - 16, 120), 60)
  if (m) p.add({ ...DECO(m.name, p.x0 + (p.cw - m.w) / 2, bottom + 20 + (room - m.h) / 2, m.w, m.h, 0.8), name: 'Hình vẽ', fillDeco: true })
}
pages.forEach(tailpiece)
// tâm khung theo khuôn mặt — tính sau cùng, khi khung ảnh đã chốt kích thước
// ảnh không có mặt người → tâm khung theo vật chính (chiếc nón, đôi tay, khung nón…)
for (const p of pages) for (const e of p.els) if (e.type === 'image' && !e.pos && e.fit === 'cover' && !e.crop) {
  // giữ trọn cả mặt người lẫn vật chính nếu được; không được thì ưu tiên khuôn mặt
  const sj = subjOf(e.src, e.hint)
  const fr = sj && subjFrame(sj, e.w, e.h)
  const pos = fr && (fr.cut <= 0.02 || !FACES[e.hint] || NO_FACE.has(e.hint)) ? fr.pos : e.hint && facePos(e.hint, e.w, e.h)
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
  const pick = SPREAD_PAPERS[Math.floor(p.n / 2) % SPREAD_PAPERS.length]
  // review lần 2 (tr. 56, 74, 80): nền "nón và lá ở chân trang" vẽ ở góc dưới phía mép ngoài — chữ / ảnh chạm xuống đó thì
  // đè lên hình vẽ → trang đó dùng giấy trơn
  if (pick === 'non') {
    const outer = (e) => (p.side === 'left' ? e.x < 170 : e.x + e.w > W - 170)
    if (p.els.some((e) => !DECOR.has(e.name) && e.name !== 'Hình vẽ' && e.type !== 'line' && e.y + e.h > H - 175 && outer(e))) return 'giay'
  }
  return pick
}
// khung cho mọi ảnh / video / bản đồ / mô hình đứng trên trang (góp ý: không để ảnh nào đứng trơ không khung);
// trừ ảnh tràn mép trang, ảnh đã nằm trong khung (polaroid, khung công đoạn, giấy chứng nhận), logo và hình vẽ nét mảnh
function addFrames(p) {
  const frames = p.els.filter((e) => e.type === 'shape' && /Khung/.test(e.name || ''))
  for (const e of p.els) {
    if (!['image', 'video', 'widget'].includes(e.type) || /deco\//.test(e.src || '') || /Logo|polaroid|tách nền|Ảnh bìa/.test(e.name || '') || e.round) continue
    // mô hình 3 lớp (2.1.2) tự có nền giấy ngà + viền đường khâu (soát 05/11: ô trắng tinh trên giấy ngà trông lạc)
    if (e.kind === 'postcard' || e.kind === 'timeline' || e.kind === 'tabs' || e.kind === 'layers' || e.kind === 'grove' || FIXED_WIDGETS.has(e.kind)) continue // bưu thiếp, dòng thời gian tự có viền + bóng, không bọc thêm khung ảnh
    if (e.x <= 0.5 || e.y <= 0.5 || e.x + e.w >= W - 0.5 || e.y + e.h >= H - 0.5) continue
    if (frames.some((f) => f.x <= e.x + 0.5 && f.y <= e.y + 0.5 && f.x + f.w >= e.x + e.w - 0.5 && f.y + f.h >= e.y + e.h - 0.5)) continue
    // góp ý 04/11: viền ảnh đừng to → lề giấy mảnh 1,5–3pt
    e.frame = r1(Math.max(1.5, Math.min(3, Math.min(e.w, e.h) * 0.012)))
  }
  // ảnh "thoát khung" (breakOut): lớp ảnh tách nền đè đúng lên ảnh (trong lề khung), phần nhô khỏi mép trên khung lộ ra giấy
  for (const e of [...p.els]) {
    if (!e.breakOut) continue
    const m = (e.frame ?? 0) + 0.45
    const iw = e.w - 2 * m
    const dh = iw / e.breakOut.a
    const o = { ...IMG(e.x + m, e.y + e.h - m - dh, iw, dh, null, { src: e.breakOut.src, fit: 'fill' }), name: 'Ảnh bìa', pop: { z: e.pop?.z ?? 0.5, kind: 'lift' } }
    delete e.breakOut
    p.els.splice(p.els.indexOf(e) + 1, 0, o)
  }
  return p.els
}
/**
 * trang kết thúc bằng một ảnh (khung chuẩn nhảy bậc) mà dưới đáy còn dải trống → hạ cụm ảnh + chú thích xuống giữa
 * khoảng trống (chia đều trên / dưới ảnh), không để một dải trống ở đáy trang; trang bố cục riêng (fixed) giữ nguyên
 */
// phần tử chiếm chỗ trong vùng nội dung: chữ, ảnh và cả hình vẽ nhỏ đặt giữa trang (vignette); bỏ họa tiết nền / góc
const contentEls = (p) =>
  p.els.filter((e) => e.y > TOP - 10 && (/deco\//.test(e.src || '') ? e.w < CW * 0.6 && e.y + e.h <= BOT + 30 && e.x >= p.x0 - 1 : !DECOR.has(e.name)))
const TAIL = new Set(['Ảnh', 'Chú thích ảnh', 'Chú thích video', 'Video trình diễn', 'Khung polaroid', 'Ảnh polaroid', 'Chú thích polaroid', 'Băng keo', 'Khung ảnh'])
function centerTail(p) {
  if (p.fixed) return
  const body = contentEls(p)
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
/**
 * hoa lá nét mảnh ở chân trang (theo mockup của nhóm: cây cỏ, hoa sen nét mảnh ở lề): trang thường còn khoảng trống
 * dưới đáy thì đặt dải cỏ hoa ở góc ngoài, không chạm chữ / ảnh; xen kẽ cụm sen thấp và dải cỏ hoa
 */
function bottomFlora(p) {
  if (p.fixed || p.noFlora || hasFill(p)) return
  const body = contentEls(p)
  if (!body.length) return
  const bottom = Math.max(...body.map((e) => e.y + e.h))
  const gap = BOT + 24 - bottom
  if (gap < 64) return
  const m = pickMotif(p, 'k', p.cw * 0.5, Math.min(gap - 12, 120))
  if (!m) return
  const x = p.side === 'left' ? p.x0 - 10 : p.x1 - m.w + 10
  p.els.push({ ...DECO(m.name, x, BOT + 24 - m.h, m.w, m.h, 0.6), name: 'Hình vẽ', fillDeco: true })
}
pages.forEach(bottomFlora)
// số thứ tự ảnh "Ảnh N:" theo thứ tự trang (góp ý: "Ảnh stt: nội dung (nguồn: …)"); khung chú thích nới nếu dài thêm dòng
{
  let n = 0
  for (const p of pages)
    for (const e of p.els) {
      if (!['Chú thích ảnh', 'Chú thích video'].includes(e.name) || !e.text || !/^Ảnh \d+: /.test(e.text)) continue
      n++
      e.text = e.text.replace(/^Ảnh \d+: /, `Ảnh ${n}: `)
      if (e.ja) e.ja = e.ja.replace(/^画像\d+：/, `画像${n}：`)
      e.h = r1(Math.max(e.h, textH([e.text, e.ja], e.w, { size: e.size, lh: e.lineHeight, jaSize: e.jaSize ?? e.size })))
    }
  // khung phóng ảnh (lightbox) hiện đúng chú thích in trên trang ("Ảnh N: … (nguồn)"), không phải gợi ý thô
  // "— nguồn: …" / "— 出典：…" / "全面写真：…" (soát độc lập 08/11). Ảnh không có ô chú thích → chú thích đã định dạng, không số.
  const bare = (s) => (s ?? '').replace(/^Ảnh \d+: /, '').replace(/^画像\d+：/, '')
  for (const p of pages) {
    const caps = p.els.filter((e) => ['Chú thích ảnh', 'Chú thích video'].includes(e.name) && e.text)
    for (const e of p.els) {
      if (!['image', 'video'].includes(e.type) || !e.hint) continue
      const fc = fmtCap([e.hint, e.hintJa ?? null])
      const vi = strip(pageCap(fc[0]) ?? '')
      const ja = fc[1] ? strip(pageCap(fc[1])) : null
      const hit = e.capSrcOnly ? caps.find((c) => /^Ảnh \d+: \(/.test(c.text)) : caps.find((c) => bare(c.text) === vi || (ja && bare(c.ja) === ja))
      e.cap = hit ? hit.text : vi
      e.capJa = hit ? hit.ja ?? null : ja
    }
  }
}
// ảnh gốc có viền đen (chụp từ màn hình video): phóng nhẹ quanh tâm cho mất viền — { x, y, z } như el.crop
const CROP_FIX = {
  'Người thợ khâu nón ngay trong nếp nhà': { x: 50, y: 50, z: 1.12 },
  // soát 08/11: chú thích nói khung 16 vòng nứa (ảnh gần trùng ảnh ông Tuy bên khung nón tr. 49) → cận vào khung trên tay ông
  'Lớp lá lụi trong — trước khi lợp: khung 16 vòng nứa': { x: 76, y: 64, z: 1.5 },
}
for (const [hint, c] of Object.entries(CROP_FIX)) {
  const src = PHOTOS[hint]
  if (src) for (const p of pages) for (const e of p.els) if (e.type === 'image' && e.src === src && !e.crop) e.crop = c
}
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
