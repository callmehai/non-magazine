import { getStore } from '../canvas/store/index.js'
import { PAGE_W, PAGE_H } from '../canvas/model.js'
import { ensureFontsFor } from '../canvas/fonts.js'

/**
 * Sách dựng bằng editor (#/admin) → dữ liệu cho flipbook.
 * Người đọc thấy bản đã "Xuất bản"; thêm &draft=1 để xem bản nháp mới nhất (nút "Xem thử" trong editor).
 */
export async function loadCanvasBook(config, slug, { draft = false, local = false } = {}) {
  const res = local ? await loadLocalBuild() : draft ? await (await getStore()).loadBook(slug) : await (await getStore()).loadPublished(slug)
  if (!res) throw new Error(`Sách "${slug}" chưa được xuất bản`)
  const list = res.pages
  // bản nháp chỉ đọc được khi đã đăng nhập editor; không có trang thì báo lỗi rõ ràng (thư viện lật trang không chạy với sách rỗng)
  if (!list?.length) throw new Error(local ? 'scripts/book/out/book.json chưa có trang nào — chạy node scripts/book/build.mjs' : draft ? 'Bản nháp chưa có trang nào' : `Sách "${slug}" chưa có trang nào`)
  ensureFontsFor(list) // font Google chỉ tải cho những font sách thật sự dùng
  const n = list.length
  const pages = list.map((p, i) => ({
    id: p.id,
    type: 'canvas',
    data: p,
    hard: i === 0 || i === n - 1,
    soft: true, // bìa vẫn lật cong như trang giấy; kiểu "bìa cứng" của StPageFlip xoay phẳng như cánh cửa
    folio: i !== 0 && i !== n - 1 && !p.hideNumber ? i + 1 : null,
    // khoá chữ, dịch lúc vẽ (soát 05/11: dịch ở đây thì bản JA vẫn ghi "Bìa" — lúc tải sách ngôn ngữ còn là vi)
    thumbnailKey: i === 0 ? 'cover' : i === n - 1 ? 'backCover' : undefined,
  }))
  // số trang lẻ → chèn trang trắng trước bìa sau (sách lật kiểu Nhật cần số trang chẵn)
  if (n > 1 && n % 2 === 1) pages.splice(n - 1, 0, { id: 'blank', type: 'canvas', data: { bg: '#f4ede0', elements: [] } })
  return {
    ...config,
    title: config.title || res.book.title,
    publishedAt: draft || local ? undefined : res.publishedAt, // tự cập nhật: so với bản xuất bản mới nhất
    settings: { ...config.settings, pageWidth: PAGE_W, pageHeight: PAGE_H },
    pages,
  }
}

/** Chạy dev: đọc thẳng bản vừa dựng scripts/book/out/book.json — không cần đăng nhập, không cần đẩy bản nháp */
async function loadLocalBuild() {
  const r = await fetch(`${import.meta.env.BASE_URL}scripts/book/out/book.json`, { cache: 'no-store' })
  if (!r.ok) throw new Error('Chưa có scripts/book/out/book.json — chạy node scripts/book/build.mjs')
  const { pages } = await r.json()
  return { book: {}, pages: pages.map((p, i) => ({ id: `local-${i}`, ...p })) }
}
