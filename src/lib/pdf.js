import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { asset } from './assets.js'
import { t } from './i18n.js'

GlobalWorkerOptions.workerSrc = workerUrl

const abs = (p) => new URL(p, document.baseURI).href
const pdfjsDir = (dir) => abs(import.meta.env.BASE_URL + `pdfjs/${dir}/`)

/**
 * Mở file PDF (đường dẫn kiểu "assets/book/sach.pdf") và dựng danh sách trang cho flipbook.
 * Khổ trang lấy theo trang 1 của PDF → làm trên Canva khổ nào cũng được.
 */
export async function loadPdfBook(book) {
  const { settings } = book
  const doc = await getDocument({
    url: abs(asset(settings.pdf)),
    cMapUrl: pdfjsDir('cmaps'),
    cMapPacked: true,
    standardFontDataUrl: pdfjsDir('standard_fonts'),
    wasmUrl: pdfjsDir('wasm'),
    iccUrl: pdfjsDir('iccs'),
  }).promise

  const first = await doc.getPage(1)
  const { width, height } = first.getViewport({ scale: 1 })
  const n = doc.numPages
  const labels = book.labels || {}
  const overlays = book.overlays || {}
  const hideNumbers = new Set(settings.hidePageNumbersOn || [])

  const pages = Array.from({ length: n }, (_, i) => ({
    id: `pdf-${i + 1}`,
    type: 'pdf',
    doc,
    pdfPage: i + 1,
    // bìa trước/sau là bìa cứng
    hard: i === 0 || i === n - 1,
    thumbnailLabel: labels[i + 1] || (i === 0 ? t('cover') : i === n - 1 ? t('backCover') : undefined),
    overlays: overlays[i + 1] || [],
    // số trang in ở góc trang (bìa trước/sau không in)
    folio: settings.pageNumbers !== false && i !== 0 && i !== n - 1 && !hideNumbers.has(i + 1) ? i + 1 : null,
  }))
  // Số trang lẻ: chèn một trang trắng trước bìa sau, để bìa sau luôn đứng riêng
  // (sách lật kiểu Nhật bắt buộc số trang chẵn)
  if (n > 1 && n % 2 === 1) pages.splice(n - 1, 0, { id: 'pdf-blank', type: 'pdf', doc, pdfPage: null, overlays: [] })

  return {
    ...book,
    settings: { ...settings, pageWidth: Math.round(width), pageHeight: Math.round(height) },
    pages,
  }
}
