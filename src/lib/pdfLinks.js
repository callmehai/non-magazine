// Tách khỏi pdf.js để trang PDF không kéo cả thư viện pdf.js vào bundle chính

/** Link gắn sẵn trong PDF (Canva: chọn chữ → Liên kết) → vùng bấm được, toạ độ % của trang */
export async function pdfLinks(pdfPage) {
  const annots = await pdfPage.getAnnotations({ intent: 'display' })
  const vp = pdfPage.getViewport({ scale: 1 })
  return annots
    .filter((a) => a.subtype === 'Link' && a.url)
    .map((a) => {
      const [x1, y1, x2, y2] = vp.convertToViewportRectangle(a.rect)
      return {
        type: 'link',
        href: a.url,
        x: (Math.min(x1, x2) / vp.width) * 100,
        y: (Math.min(y1, y2) / vp.height) * 100,
        w: (Math.abs(x2 - x1) / vp.width) * 100,
        h: (Math.abs(y2 - y1) / vp.height) * 100,
      }
    })
}
