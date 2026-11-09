/**
 * Tự cập nhật (anh Hải 10/11: "cài auto update đc ko, cứ phải load lại trang").
 * - Web thật: mỗi phút (và khi quay lại tab) xem có bản xuất bản mới (publications.published_at) hoặc bản code mới
 *   (index.html trỏ tới file JS khác) → tự tải lại trang.
 * - Chạy dev: dựng lại sách (scripts/book/out/book.json đổi) → plugin bookMeasure báo qua HMR → tự tải lại.
 * Tải lại thì mở thẳng đúng trang đang đọc, bỏ màn mở đầu (sessionStorage, chỉ dùng trong 60 giây).
 * Không tải lại giữa lúc người đọc đang thao tác (bấm, kéo, gõ, cuộn trong 8 giây gần nhất) → đợi rảnh tay.
 */
const KEY = 'non-resume'

function take() {
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    sessionStorage.removeItem(KEY)
    if (s && Date.now() - s.at < 60000 && Number.isInteger(s.page)) return s
  } catch {
    /* bỏ qua: chế độ riêng tư / chặn lưu trữ */
  }
  return null
}

/** trang cần mở lại sau một lần tự tải lại (null nếu là lần mở bình thường) — đọc một lần lúc nạp module */
export const resume = take()

let getPage = () => 0
/** App báo trang đang đọc để lúc tải lại còn mở đúng trang */
export function setPageGetter(fn) {
  getPage = fn
}

function save() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ page: getPage(), at: Date.now() }))
  } catch {
    /* bỏ qua */
  }
}

let lastInput = 0
for (const ev of ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart'])
  addEventListener(ev, (e) => {
    if (ev !== 'pointermove' || e.buttons) lastInput = Date.now()
  }, { passive: true, capture: true })

let pending = false
function reloadKeep() {
  if (pending) return
  pending = true
  const go = () => {
    if (Date.now() - lastInput < 8000) return void setTimeout(go, 2000)
    save()
    location.reload()
  }
  go()
}

/**
 * @param {{ publishedAt?: string, slug?: string, local?: boolean }} o
 *   publishedAt: thời điểm xuất bản của bản đang mở (bản Supabase) · local: đang đọc scripts/book/out/book.json (dev)
 */
export function watchUpdates({ publishedAt, slug, local } = {}) {
  if (import.meta.hot) {
    // sửa code lúc dev mà Vite phải tải lại cả trang → cũng mở lại đúng trang
    import.meta.hot.on('vite:beforeFullReload', save)
    if (local) import.meta.hot.on('non:book', reloadKeep)
  }
  if (local) return
  const mine = document.querySelector('script[type="module"][src]')?.getAttribute('src')
  const check = async () => {
    if (document.hidden || pending) return
    try {
      if (!import.meta.env.DEV && mine) {
        // ?_= để qua mặt bộ đệm CDN của GitHub Pages (giữ index.html tới 10 phút)
        const html = await (await fetch(`${location.pathname}?_=${Date.now()}`, { cache: 'no-store' })).text()
        const src = html.match(/<script\b[^>]*\btype="module"[^>]*\bsrc="([^"]+)"/)?.[1]
        if (src && src !== mine) return reloadKeep()
      }
      if (publishedAt && slug) {
        const { getStore } = await import('../canvas/store/index.js')
        const at = await (await getStore()).latestPublishedAt?.(slug)
        if (at && at !== publishedAt) return reloadKeep()
      }
    } catch {
      /* mất mạng một lúc: lần sau thử lại */
    }
  }
  setInterval(check, 60000)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) check()
  })
}
