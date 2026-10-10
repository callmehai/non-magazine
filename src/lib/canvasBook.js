import { getStore } from '../canvas/store/index.js'
import { PAGE_W, PAGE_H } from '../canvas/model.js'
import { ensureFontsFor } from '../canvas/fonts.js'
import { t } from './i18n.js'

/**
 * Sách dựng bằng editor (#/admin) → dữ liệu cho flipbook.
 * Người đọc thấy bản đã "Xuất bản"; thêm &draft=1 để xem bản nháp mới nhất (nút "Xem thử" trong editor).
 */
export async function loadCanvasBook(config, slug, { draft = false } = {}) {
  const store = await getStore()
  const res = draft ? await store.loadBook(slug) : await store.loadPublished(slug)
  if (!res) throw new Error(`Sách "${slug}" chưa được xuất bản`)
  const list = res.pages
  ensureFontsFor(list) // font Google chỉ tải cho những font sách thật sự dùng
  const n = list.length
  const pages = list.map((p, i) => ({
    id: p.id,
    type: 'canvas',
    data: p,
    hard: i === 0 || i === n - 1,
    folio: i !== 0 && i !== n - 1 && !p.hideNumber ? i + 1 : null,
    thumbnailLabel: i === 0 ? t('cover') : i === n - 1 ? t('backCover') : undefined,
  }))
  // số trang lẻ → chèn trang trắng trước bìa sau (sách lật kiểu Nhật cần số trang chẵn)
  if (n > 1 && n % 2 === 1) pages.splice(n - 1, 0, { id: 'blank', type: 'canvas', data: { bg: '#f4ede0', elements: [] } })
  return {
    ...config,
    title: config.title || res.book.title,
    settings: { ...config.settings, pageWidth: PAGE_W, pageHeight: PAGE_H },
    pages,
  }
}
