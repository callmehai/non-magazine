// Đo một trang canvas đã vẽ trên trình duyệt (đơn vị pt của trang A4). Dùng cho trang soát ?review=1.

const TOP = 76 // vùng nội dung: dưới đầu trang …
const BOT = 784 // … tới trên số trang
const CELL = 8
const DECOR = new Set(['Đầu trang', 'Đường kẻ', 'Vạch màu', 'Số trang', 'Họa tiết', 'Lớp tối', 'Chỉ vàng'])
const FULL = new Set(['Ảnh toàn trang', 'Ảnh bìa', 'Ảnh mở chương'])
const BODY = new Set(['Đoạn văn', 'Mô tả', 'Ghi chú'])
// khung nền (chữ nằm trên là chủ đích, không tính là đè)
const isBackdrop = (name) => /^(Khung|Nền|Thẻ|Hình)/.test(name || '')
const END = /[.!?…:;)\]"”»」』）。！？]\s*$/

/** khung chữ thật (theo dòng chữ đã vẽ, không theo khung đặt sẵn) */
function textRects(node) {
  const box = node.querySelector('.cv-text')
  if (!box) return []
  const r = document.createRange()
  r.selectNodeContents(box)
  return [...r.getClientRects()].filter((q) => q.width > 1 && q.height > 1)
}

export function measurePage(page, W, H) {
  if (!page) return null
  const pr = page.getBoundingClientRect()
  const k = W / pr.width
  const pt = (q) => ({ x: (q.left - pr.left) * k, y: (q.top - pr.top) * k, w: q.width * k, h: q.height * k })
  const els = [...page.querySelectorAll(':scope > .cv-el')].map((node) => {
    const name = node.dataset.name || ''
    const type = [...node.classList].find((c) => c.startsWith('cv-el--'))?.slice(7)
    const box = pt(node.getBoundingClientRect())
    const lines = type === 'text' ? textRects(node).map(pt) : null
    return { node, name, type, box, lines, text: type === 'text' ? node.innerText.trim() : '' }
  })
  if (els.some((e) => FULL.has(e.name) || (e.type === 'image' && e.box.w * e.box.h > W * H * 0.8))) return { full: true }
  const content = els.filter((e) => !DECOR.has(e.name) && (e.type !== 'line' || e.box.h > 20))

  // độ phủ: lưới ô 8pt trong vùng nội dung
  const cols = Math.ceil((W - 80) / CELL)
  const rows = Math.ceil((BOT - TOP) / CELL)
  const grid = new Uint8Array(cols * rows)
  const mark = (q) => {
    const c0 = Math.max(0, Math.floor((q.x - 40) / CELL))
    const c1 = Math.min(cols - 1, Math.floor((q.x + q.w - 40) / CELL))
    const r0 = Math.max(0, Math.floor((q.y - TOP) / CELL))
    const r1 = Math.min(rows - 1, Math.floor((q.y + q.h - TOP) / CELL))
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) grid[r * cols + c] = 1
  }
  for (const e of content) {
    if (e.lines) e.lines.forEach((q) => mark({ ...q, h: q.h + 6 }))
    else mark(e.box)
  }
  const fill = grid.reduce((a, b) => a + b, 0) / grid.length
  // dải trống: các hàng ô hoàn toàn trống liền nhau (khoảng trắng ngang cả trang)
  let band = 0
  let bandAt = 0
  let run = 0
  for (let r = 0; r < rows; r++) {
    let empty = true
    for (let c = 0; c < cols && empty; c++) if (grid[r * cols + c]) empty = false
    run = empty ? run + 1 : 0
    if (run > band) [band, bandAt] = [run, r - run + 1]
  }
  // khoảng trống lớn ở nửa trang: hàng mà nửa trái hoặc nửa phải trống liền nhau
  let half = 0
  for (const [a, b] of [
    [0, cols >> 1],
    [cols >> 1, cols],
  ]) {
    let rr = 0
    for (let r = 0; r < rows; r++) {
      let empty = true
      for (let c = a; c < b && empty; c++) if (grid[r * cols + c]) empty = false
      rr = empty ? rr + 1 : 0
      half = Math.max(half, rr)
    }
  }

  const issues = []
  // chữ nền (số mục in mờ phía sau tiêu đề…) là trang trí, không soát tràn / đè
  const texts = content.filter((e) => e.type === 'text' && e.lines?.length && !isBackdrop(e.name))
  for (const e of texts) {
    const bottom = Math.max(...e.lines.map((q) => q.y + q.h))
    if (bottom > e.box.y + e.box.h + 3) issues.push(`chữ tràn khung "${e.name}" (${Math.round(bottom - e.box.y - e.box.h)}pt): ${e.text.slice(0, 40)}…`)
    if (bottom > BOT + 4) issues.push(`chữ "${e.name}" lấn xuống chân trang`)
  }
  // chữ đè lên ảnh / chữ khác / đường kẻ
  const hit = (a, b) => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 4 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 3
  for (const e of texts) {
    for (const o of content) {
      // phần tử xoay (ảnh polaroid) có khung bao lớn hơn hình thật → không soát đè
      if (o === e || isBackdrop(o.name) || o.type === 'shape' || /rotate/.test(o.node.style.transform + e.node.style.transform)) continue
      const rects = o.lines ?? [o.box]
      if (e.lines.some((q) => rects.some((r) => hit(q, r)))) issues.push(`"${e.name}" đè lên "${o.name || o.type}"`)
    }
  }
  // đoạn văn cuối trang dừng giữa câu → bị cắt sang trang sau
  const body = texts.filter((e) => BODY.has(e.name)).sort((a, b) => a.box.y - b.box.y)
  const last = body.at(-1)
  if (last && !END.test(last.text)) issues.push(`đoạn văn bị cắt sang trang: "…${last.text.slice(-40)}"`)
  const hasPic = content.some((e) => e.type === 'image' || e.type === 'widget' || e.type === 'video')
  return {
    fill: Math.round(fill * 100),
    band: band * CELL,
    bandAt: Math.round(TOP + bandAt * CELL),
    half: half * CELL,
    pic: hasPic,
    words: texts.reduce((a, e) => a + e.text.length, 0),
    issues: [...new Set(issues)],
  }
}

/** lỗi của một cặp trang (pair) */
export function spreadIssues(L, R) {
  const out = []
  for (const [side, m] of [
    ['trái', L],
    ['phải', R],
  ]) {
    if (!m || m.full) continue
    if (m.band >= 90) out.push(`trang ${side}: dải trống ngang ${m.band}pt (từ y=${m.bandAt})`)
    else if (m.half >= 160) out.push(`trang ${side}: khoảng trống ${m.half}pt ở nửa trang`)
    if (m.fill < 55) out.push(`trang ${side}: nội dung chỉ phủ ${m.fill}% trang`)
    const other = side === 'trái' ? R : L
    // trang kể chuyện đối diện trang ảnh tràn trang là bố cục có chủ đích
    if (!m.pic && !other?.full) out.push(`trang ${side}: chỉ có chữ, không có hình`)
    m.issues.forEach((t) => out.push(`trang ${side}: ${t}`))
  }
  if (L && R && !L.full && !R.full && Math.abs(L.fill - R.fill) > 30) out.push(`hai trang lệch nhau: trái phủ ${L.fill}%, phải ${R.fill}%`)
  return out
}
