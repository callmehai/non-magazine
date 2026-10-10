/**
 * Kho dữ liệu sách. Có Supabase (VITE_SUPABASE_URL trong .env.local) thì dùng Supabase,
 * chưa có thì dùng bản lưu trên trình duyệt (localStorage) — đủ để dựng/thử editor.
 *
 * Giao diện chung (mọi hàm đều async trừ khi ghi khác):
 *   session()                         → { user: { id, name, role } } | null
 *   signIn(username, password)        → session ; signOut()
 *   onAuthChange(cb)                  → huỷ đăng ký (sync)
 *   loadBook(slug)                    → { book: { id, slug, title, settings }, pages: Page[] }   (bản nháp)
 *   loadPublished(slug)               → { book, pages } | null   (bản đã xuất bản, cho người đọc)
 *   savePage(id, data, version)       → { version }    (data = { bg, bgImage, template, hideNumber, elements })
 *   addPage(bookId, data, position)   → Page
 *   deletePage(id) ; movePage(id, position)
 *   listVersions(pageId)              → [{ id, data, at, by }]   (bản cũ của trang, mới nhất trước — tự ghi ~5 phút/bản khi lưu)
 *   uploadFile(file, kind)            → URL dùng được trong <img>/<video>
 *   listUploads()                     → [{ url, type: 'image'|'video', name }]  (mới nhất trước, dùng chung cả nhóm)
 *   subscribe(bookId, { onPage, onDelete })          → huỷ (sync)   — thay đổi từ người khác
 *   joinPresence(bookId, me, onChange)              → { update(state), leave() }  (sync)
 *   publish(bookId)                   → { publishedAt }
 *
 * Page = { id, position, version, updatedAt, updatedBy, bg, bgImage, template, hideNumber, elements }
 */

let storePromise

export function getStore() {
  if (!storePromise) {
    storePromise = import.meta.env.VITE_SUPABASE_URL
      ? import('./supabaseStore.js').then((m) => m.createSupabaseStore())
      : import('./localStore.js').then((m) => m.createLocalStore())
  }
  return storePromise
}

/** Vị trí ở giữa hai trang (sắp xếp bằng số thực → chèn/kéo không phải đánh lại số cả sách) */
export function between(a, b) {
  if (a == null && b == null) return 1000
  if (a == null) return b - 1000
  if (b == null) return a + 1000
  return (a + b) / 2
}

export const pageData = (p) => ({
  bg: p.bg,
  bgImage: p.bgImage ?? null,
  template: p.template ?? null,
  hideNumber: !!p.hideNumber,
  elements: p.elements || [],
})
