import templateData from './templatePages.json'

/** Khổ trang (point, A4 dọc) — mọi toạ độ trong dữ liệu trang tính theo khổ này */
export const PAGE_W = templateData.width
export const PAGE_H = templateData.height

export const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36))

/** Gán id mới cho phần tử (và phần tử con của nhóm) */
export function withIds(el) {
  const out = { ...el, id: uid() }
  if (el.children) out.children = el.children.map(withIds)
  return out
}

/** Trang mới (chưa có id/position — kho dữ liệu sẽ gán) từ dữ liệu trang có sẵn */
export function clonePageData(page) {
  return {
    bg: page.bg,
    bgImage: page.bgImage,
    template: page.template,
    elements: (page.elements || []).map(withIds),
  }
}

/** 18 trang mẫu: dùng làm nội dung khởi đầu */
export const TEMPLATE_PAGES = templateData.pages

/** Mỗi kiểu trang một mẫu (để "Thêm trang theo mẫu") */
export const TEMPLATE_KINDS = (() => {
  const seen = new Map()
  for (const p of templateData.pages) if (!seen.has(p.template)) seen.set(p.template, p)
  return [...seen.values()]
})()

export const PALETTE = ['#f4ede0', '#ebe0cb', '#2a1f17', '#5e4d3d', '#3b2a1e', '#24180f', '#b8955a', '#d9bd84', '#7d2f2a', '#ffffff']

export const FONTS = [
  { family: 'Noto Sans JP', label: 'Noto Sans JP — thân bài' },
  { family: 'Noto Serif JP', label: 'Noto Serif JP — tiêu đề' },
  { family: 'Playfair Display', label: 'Playfair Display — chữ Latin lớn' },
]

/** Phần tử mới, đặt giữa trang */
export function newElement(type, opts = {}) {
  const base = { id: uid(), x: PAGE_W / 2 - 120, y: PAGE_H / 2 - 40, w: 240, h: 80 }
  switch (type) {
    case 'text':
      return { ...base, type: 'text', text: 'テキストを入力', font: 'Noto Sans JP', weight: 400, size: 14, color: '#2a1f17', align: 'left', lineHeight: 1.6, name: 'Chữ' }
    case 'vtext':
      return {
        ...base,
        x: PAGE_W / 2 - 40,
        y: PAGE_H / 2 - 160,
        w: 80,
        h: 320,
        type: 'text',
        vertical: true,
        text: '縦書きテキスト',
        font: 'Noto Serif JP',
        weight: 700,
        size: 24,
        color: '#2a1f17',
        align: 'left',
        lineHeight: 1.4,
        name: 'Chữ dọc',
      }
    case 'rect':
    case 'ellipse':
    case 'triangle':
      return { ...base, w: 160, h: 160, x: PAGE_W / 2 - 80, y: PAGE_H / 2 - 80, type: 'shape', shape: type, fill: '#b8955a', name: 'Hình' }
    case 'line':
      return { ...base, h: 4, y: PAGE_H / 2 - 2, type: 'line', x1: 0, y1: 0.5, x2: 1, y2: 0.5, stroke: '#2a1f17', strokeWidth: 1, name: 'Đường kẻ' }
    case 'image':
      return { ...base, w: opts.w || 300, h: opts.h || 200, x: PAGE_W / 2 - (opts.w || 300) / 2, y: PAGE_H / 2 - (opts.h || 200) / 2, type: 'image', src: opts.src || '', fit: 'cover', name: 'Ảnh' }
    case 'video':
      if (opts.w && opts.h) return { ...base, w: opts.w, h: opts.h, x: PAGE_W / 2 - opts.w / 2, y: PAGE_H / 2 - opts.h / 2, type: 'video', src: opts.src || '', poster: opts.poster || '', name: 'Video' }
      return { ...base, x: PAGE_W * 0.1, y: PAGE_H * 0.3, w: PAGE_W * 0.8, h: PAGE_H * 0.45, type: 'video', src: opts.src || '', poster: opts.poster || '', name: 'Video' }
    default:
      throw new Error('unknown element ' + type)
  }
}

export const ELEMENT_LABELS = {
  text: 'Chữ',
  shape: 'Hình',
  line: 'Đường kẻ',
  image: 'Ảnh',
  video: 'Video',
  group: 'Nhóm',
}
