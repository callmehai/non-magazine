import { useEffect, useState } from 'react'

/**
 * Ảnh nhỏ cho ô thu nhỏ trang (dải trang của editor, bảng trang của trang đọc).
 *
 * Ô thu nhỏ chỉ rộng 60–120px mà ảnh gốc rộng 1200–2560px: để nguyên thì trình duyệt giữ ảnh giải mã cỡ gốc cho cả
 * trăm trang (đo 14/11: ~2.5 GB) → giữ phím mũi tên lướt dải trang một lúc là giật rồi đen màn hình.
 * Ở đây mỗi ảnh được giải mã một lần, thu về `WIDTH` px, giữ lại bản nhỏ (blob URL) — ảnh gốc giải phóng ngay.
 * Làm lần lượt (tối đa `PARALLEL` ảnh cùng lúc) để không dồn cả trăm ảnh gốc vào bộ nhớ một lúc.
 * Không thu được (SVG, trình duyệt cũ, lỗi mạng/CORS) → dùng ảnh gốc như trước.
 */
const WIDTH = 240 // đủ nét cho ảnh cắt cận (phóng 2–3 lần) trong ô 120px trên màn hình 2x
const PARALLEL = 3

const cache = new Map() // url → Promise<url nhỏ>
const queue = []
let active = 0

function pump() {
  while (active < PARALLEL && queue.length) {
    const job = queue.shift()
    active++
    job().finally(() => {
      active--
      pump()
    })
  }
}

const canShrink = () => typeof createImageBitmap === 'function' && typeof OffscreenCanvas === 'function'

export function thumbUrl(url) {
  if (!url || /\.svg(\?|#|$)/i.test(url) || url.startsWith('data:') || url.startsWith('blob:') || !canShrink()) return Promise.resolve(url)
  let p = cache.get(url)
  if (!p) {
    p = new Promise((resolve) => {
      queue.push(async () => {
        try {
          const res = await fetch(url)
          if (!res.ok) throw new Error(String(res.status))
          const bmp = await createImageBitmap(await res.blob())
          if (bmp.width <= WIDTH) {
            bmp.close()
            return resolve(url) // ảnh vốn đã nhỏ
          }
          const h = Math.max(1, Math.round((bmp.height * WIDTH) / bmp.width))
          const small = await createImageBitmap(bmp, { resizeWidth: WIDTH, resizeHeight: h, resizeQuality: 'medium' })
          bmp.close()
          const c = new OffscreenCanvas(WIDTH, h)
          c.getContext('2d').drawImage(small, 0, 0)
          small.close()
          resolve(URL.createObjectURL(await c.convertToBlob({ type: 'image/webp', quality: 0.82 })))
        } catch {
          resolve(url)
        }
      })
      pump()
    })
    cache.set(url, p)
  }
  return p
}

/** on = true: trả ảnh nhỏ (null khi đang thu nhỏ — ô để trống chốc lát); on = false: trả nguyên url */
export function useThumbSrc(url, on) {
  const [small, setSmall] = useState(null)
  useEffect(() => {
    if (!on || !url) return
    let alive = true
    thumbUrl(url).then((u) => alive && setSmall({ url, u }))
    return () => {
      alive = false
    }
  }, [url, on])
  if (!on) return url
  return small?.url === url ? small.u : null
}
