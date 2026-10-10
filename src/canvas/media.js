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
