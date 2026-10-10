/**
 * Nén ảnh ngay trên trình duyệt trước khi tải lên: thu về cạnh dài tối đa `max` px, đổi sang WebP.
 * Ảnh điện thoại 5–10MB → vài trăm KB, sách 100 trang vẫn mở nhanh.
 */
export async function compressImage(file, max = 2400, quality = 0.86) {
  if (!file.type.startsWith('image/') || /gif|svg/.test(file.type)) {
    const { width, height } = await imageSize(file)
    return { file, width, height }
  }
  const bmp = await createImageBitmap(file)
  const s = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * s)
  canvas.height = Math.round(bmp.height * s)
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
  bmp.close?.()
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', quality))
  const name = file.name.replace(/\.[^.]+$/, '') + '.webp'
  return { file: new File([blob], name, { type: 'image/webp' }), width: canvas.width, height: canvas.height }
}

function imageSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth || 400, height: img.naturalHeight || 300 })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => resolve({ width: 400, height: 300 })
    img.src = url
  })
}

/** Khung vừa trong `box` (point) mà vẫn giữ tỉ lệ ảnh */
export function fitBox(width, height, box = 320) {
  const s = box / Math.max(width, height)
  return { w: Math.round(width * s), h: Math.round(height * s) }
}

/**
 * Ảnh bìa cho video: chụp một khung hình thành WebP.
 * src: File vừa chọn hoặc URL (URL khác trang cần cho phép CORS — Supabase Storage có).
 * at: giây; mặc định 10% độ dài (tối đa 1s) để tránh khung đen lúc mở đầu.
 */
export async function videoPoster(src, at) {
  const url = src instanceof Blob ? URL.createObjectURL(src) : src
  const v = document.createElement('video')
  try {
    v.muted = true
    v.playsInline = true
    v.preload = 'auto'
    v.crossOrigin = 'anonymous'
    v.src = url
    await once(v, 'loadeddata')
    v.currentTime = at ?? Math.min(1, (v.duration || 0) * 0.1)
    await once(v, 'seeked')
    return await videoFrame(v)
  } finally {
    v.removeAttribute('src')
    v.load()
    if (src instanceof Blob) URL.revokeObjectURL(url)
  }
}

/** khung hình đang hiện của một thẻ <video> → { file (WebP), width, height } của video */
export async function videoFrame(v, max = 1280) {
  const s = Math.min(1, max / Math.max(v.videoWidth, v.videoHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(v.videoWidth * s)
  canvas.height = Math.round(v.videoHeight * s)
  canvas.getContext('2d').drawImage(v, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.82))
  if (!blob) throw new Error('Không chụp được khung hình')
  return { file: new File([blob], 'poster.webp', { type: 'image/webp' }), width: v.videoWidth, height: v.videoHeight }
}

function once(target, event, ms = 15000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => done(reject, new Error('Video tải quá lâu')), ms)
    const ok = () => done(resolve)
    const bad = () => done(reject, new Error('Không đọc được video'))
    const done = (fn, arg) => {
      clearTimeout(t)
      target.removeEventListener(event, ok)
      target.removeEventListener('error', bad)
      fn(arg)
    }
    target.addEventListener(event, ok, { once: true })
    target.addEventListener('error', bad, { once: true })
  })
}
