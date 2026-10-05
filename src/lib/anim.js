/** Hiệu ứng cho chữ/khối của trang, lấy từ trường `animation` trong magazine.js */
export function textAnim(page) {
  const a = page.animation || 'fade-up'
  if (a === 'none') return undefined
  if (a === 'parallax') return 'fade-up'
  return a
}

export const imageAnim = (page) => {
  const a = page.animation || 'fade-up'
  if (a === 'none' || a === 'parallax') return undefined
  return a === 'slide' ? 'fade-in' : a === 'fade-up' ? 'scale' : a
}

export const delay = (s) => ({ '--d': s + 's' })
