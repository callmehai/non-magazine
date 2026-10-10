/**
 * Font dùng trong trang sách — tải từ Google Fonts khi cần.
 * Font tiếng Nhật được chia nhỏ theo nhóm chữ: trình duyệt chỉ tải phần chữ thật sự xuất hiện.
 *
 * weights: các độ đậm font có (xin độ đậm không có → Google trả lỗi)
 * italic:  font có kiểu nghiêng thật
 */
export const FONT_LIST = [
  // ゴシック — chữ không chân
  { family: 'Noto Sans JP', group: 'Gothic', weights: [400, 700] },
  { family: 'Zen Kaku Gothic New', group: 'Gothic', weights: [400, 700] },
  { family: 'M PLUS 1p', group: 'Gothic', weights: [400, 700] },
  { family: 'BIZ UDPGothic', group: 'Gothic', weights: [400, 700] },
  { family: 'Sawarabi Gothic', group: 'Gothic', weights: [400] },
  // 明朝 — chữ có chân
  { family: 'Noto Serif JP', group: 'Mincho', weights: [400, 700] },
  { family: 'Shippori Mincho', group: 'Mincho', weights: [400, 700] },
  { family: 'Zen Old Mincho', group: 'Mincho', weights: [400, 700] },
  { family: 'Sawarabi Mincho', group: 'Mincho', weights: [400] },
  // 丸ゴシック — chữ tròn
  { family: 'M PLUS Rounded 1c', group: 'Maru', weights: [400, 700] },
  { family: 'Zen Maru Gothic', group: 'Maru', weights: [400, 700] },
  { family: 'Kosugi Maru', group: 'Maru', weights: [400] },
  // デザイン — trang trí, viết tay
  { family: 'Klee One', group: 'Design', weights: [400, 600] },
  { family: 'Kaisei Decol', group: 'Design', weights: [400, 700] },
  { family: 'Yusei Magic', group: 'Design', weights: [400] },
  { family: 'Zen Kurenaido', group: 'Design', weights: [400] },
  { family: 'Yomogi', group: 'Design', weights: [400] },
  { family: 'Hachi Maru Pop', group: 'Design', weights: [400] },
  { family: 'Dela Gothic One', group: 'Design', weights: [400] },
  { family: 'RocknRoll One', group: 'Design', weights: [400] },
  { family: 'Reggae One', group: 'Design', weights: [400] },
  { family: 'Rampart One', group: 'Design', weights: [400] },
  { family: 'DotGothic16', group: 'Design', weights: [400] },
  // Latin
  { family: 'Playfair Display', group: 'Latin', weights: [400, 700], italic: true },
  { family: 'Cormorant Garamond', group: 'Latin', weights: [400, 700], italic: true },
  { family: 'Lora', group: 'Latin', weights: [400, 700], italic: true },
  { family: 'Be Vietnam Pro', group: 'Latin', weights: [400, 700], italic: true },
  { family: 'Montserrat', group: 'Latin', weights: [400, 700], italic: true },
  { family: 'Bebas Neue', group: 'Latin', weights: [400] },
  { family: 'Great Vibes', group: 'Latin', weights: [400] },
]

export const FONT_GROUPS = {
  Gothic: 'ゴシック · không chân',
  Mincho: '明朝 · có chân',
  Maru: '丸ゴシック · tròn',
  Design: 'デザイン · trang trí',
  Latin: 'Latin',
}

const byFamily = new Map(FONT_LIST.map((f) => [f.family, f]))
const loaded = new Set()

/** Thêm <link> Google Fonts cho font (mỗi font một lần) */
export function ensureFont(family) {
  const f = byFamily.get(family)
  if (!f || loaded.has(family)) return
  loaded.add(family)
  const name = family.replace(/ /g, '+')
  const axis = f.italic
    ? `ital,wght@${[...f.weights.map((w) => `0,${w}`), ...f.weights.map((w) => `1,${w}`)].join(';')}`
    : `wght@${f.weights.join(';')}`
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${name}:${axis}&display=swap`
  document.head.appendChild(link)
}

/** Nạp mọi font đang dùng trong các trang (cả phần tử trong nhóm) */
export function ensureFontsFor(pages) {
  const walk = (els) => {
    for (const el of els || []) {
      if (el.font) ensureFont(el.font)
      if (el.children) walk(el.children)
    }
  }
  for (const p of pages) walk(p.elements)
}

/** Độ đậm gần nhất mà font có */
export function boldWeight(family) {
  const f = byFamily.get(family)
  return f ? Math.max(...f.weights) : 700
}
