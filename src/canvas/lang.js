import { createContext, useContext } from 'react'

/**
 * Sách hai ngôn ngữ: mỗi khối chữ có `text` (tiếng Việt — bản gốc) và `ja` (tiếng Nhật, có thể chưa có).
 * Trang đọc/editor đặt ngôn ngữ đang xem bằng <CanvasLang.Provider value="vi" | "ja">.
 */
export const CanvasLang = createContext('vi')
export const useCanvasLang = () => useContext(CanvasLang)

/** khối chữ đã có bản cho ngôn ngữ này chưa (tiếng Việt luôn có) */
export const hasLang = (el, lang) => lang !== 'ja' || !!el.ja

/** chữ hiển thị: bản tiếng Nhật nếu đang xem tiếng Nhật và đã dịch, không thì bản tiếng Việt */
export const textOf = (el, lang) => (lang === 'ja' && el.ja ? el.ja : (el.text ?? ''))

/** trường lưu chữ khi sửa ở ngôn ngữ này */
export const textField = (lang) => (lang === 'ja' ? 'ja' : 'text')

// Font Latin không có chữ Nhật → đổi sang font Nhật cùng dáng
const JA_EQUIV = {
  'Playfair Display': 'Shippori Mincho',
  'Cormorant Garamond': 'Shippori Mincho',
  Lora: 'Noto Serif JP',
  'Be Vietnam Pro': 'Noto Sans JP',
  Montserrat: 'Noto Sans JP',
  'Bebas Neue': 'Noto Sans JP',
}

/** font của khối chữ theo ngôn ngữ (ưu tiên jaFont nếu người thiết kế đặt riêng) */
export function fontOf(el, lang) {
  if (lang !== 'ja' || !el.ja) return el.font
  return el.jaFont || JA_EQUIV[el.font] || el.font
}

/** cỡ chữ theo ngôn ngữ — chữ Nhật đặc hơn nên có thể đặt nhỏ hơn (jaSize) */
export const sizeOf = (el, lang) => (lang === 'ja' && el.ja && el.jaSize ? el.jaSize : el.size)

/**
 * Phiên âm (furigana): viết {漢字|かんじ} trong chữ tiếng Nhật.
 * Trả về mảng: chuỗi thường hoặc { base, ruby }.
 */
export function parseRuby(s) {
  const out = []
  const re = /\{([^{}|]+)\|([^{}]+)\}/g
  let last = 0
  let m
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index))
    out.push({ base: m[1], ruby: m[2] })
    last = re.lastIndex
  }
  if (last < s.length) out.push(s.slice(last))
  return out
}

/** bỏ cú pháp phiên âm — dùng cho mô tả trang, tìm kiếm… */
export const plainText = (s) => String(s ?? '').replace(/\{([^{}|]+)\|[^{}]+\}/g, '$1')
