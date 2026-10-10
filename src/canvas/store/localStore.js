import { clonePageData, TEMPLATE_PAGES, uid } from '../model.js'
import { pageData } from './index.js'

const KEY = 'non-book-local-v1'
const UPLOADS_KEY = 'non-book-local-uploads'
const VERSIONS_KEY = 'non-book-local-versions'
const VERSION_GAP = 5 * 60 * 1000 // giống bản Supabase: tối đa 1 bản cũ / 5 phút / trang

/**
 * Bản lưu trên trình duyệt (chưa cấu hình Supabase): một người dùng "admin", không cần mật khẩu.
 * Các tab cùng trình duyệt đồng bộ với nhau qua BroadcastChannel (để thử khoá trang).
 */
export function createLocalStore() {
  const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('non-book-local') : null
  const tabId = uid()

  const read = () => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw)
    } catch {
      /* hỏng dữ liệu → tạo lại */
    }
    const db = {
      book: { id: 'local-book', slug: 'non', title: 'ノン — 頭上の物語', settings: {} },
      pages: TEMPLATE_PAGES.map((p, i) => ({ id: uid(), position: (i + 1) * 1000, version: 1, ...clonePageData(p) })),
      published: null,
    }
    write(db)
    return db
  }
  const write = (db) => localStorage.setItem(KEY, JSON.stringify(db))
  const sorted = (pages) => [...pages].sort((a, b) => a.position - b.position)
  const emit = (msg) => channel?.postMessage({ ...msg, from: tabId })

  const me = { id: 'local-admin', name: 'Admin (máy này)', role: 'admin' }

  const readVersions = () => {
    try {
      return JSON.parse(localStorage.getItem(VERSIONS_KEY) || '{}')
    } catch {
      return {}
    }
  }
  /** chụp bản đang có của trang trước khi ghi đè */
  const keepVersion = (p) => {
    const all = readVersions()
    const list = all[p.id] || []
    const old = pageData(p)
    if (list[0] && Date.now() - Date.parse(list[0].at) < VERSION_GAP) return
    if (list[0] && JSON.stringify(list[0].data) === JSON.stringify(old)) return
    // at = lúc chụp (giống saved_at bên Supabase): bản này còn nguyên tới thời điểm đó
    all[p.id] = [{ id: uid(), data: old, at: new Date().toISOString(), by: p.updatedBy || null }, ...list].slice(0, 30)
    try {
      localStorage.setItem(VERSIONS_KEY, JSON.stringify(all))
    } catch {
      /* đầy bộ nhớ trình duyệt: bỏ qua bản cũ, vẫn lưu trang */
    }
  }

  return {
    kind: 'local',
    async session() {
      return { user: me }
    },
    async signIn() {
      return { user: me }
    },
    async signOut() {},
    onAuthChange() {
      return () => {}
    },

    async loadBook() {
      const db = read()
      return { book: db.book, pages: sorted(db.pages) }
    },
    async loadPublished() {
      const db = read()
      return db.published ? { book: db.book, pages: db.published.pages } : { book: db.book, pages: sorted(db.pages) }
    },

    async savePage(id, data, version) {
      const db = read()
      const p = db.pages.find((x) => x.id === id)
      if (!p) throw new Error('Trang không còn tồn tại')
      if (version != null && p.version !== version) throw Object.assign(new Error('conflict'), { code: 'conflict', page: p })
      keepVersion(p)
      Object.assign(p, pageData(data), { version: p.version + 1, updatedAt: new Date().toISOString(), updatedBy: me.name })
      write(db)
      emit({ type: 'page', page: p })
      return { version: p.version }
    },
    async addPage(_bookId, data, position) {
      const db = read()
      const p = { id: uid(), position, version: 1, ...pageData(data) }
      db.pages.push(p)
      write(db)
      emit({ type: 'page', page: p })
      return p
    },
    async deletePage(id) {
      const db = read()
      db.pages = db.pages.filter((p) => p.id !== id)
      write(db)
      emit({ type: 'delete', id })
    },
    async movePage(id, position) {
      const db = read()
      const p = db.pages.find((x) => x.id === id)
      p.position = position
      write(db)
      emit({ type: 'page', page: p })
    },

    async listVersions(pageId) {
      return readVersions()[pageId] || []
    },

    async uploadFile(file, kind) {
      // không có máy chủ: nhúng thẳng vào dữ liệu (data URL). Ảnh đã được nén trước khi gọi.
      const url = await new Promise((resolve, reject) => {
        const r = new FileReader()
        r.onload = () => resolve(r.result)
        r.onerror = reject
        r.readAsDataURL(file)
      })
      try {
        const list = JSON.parse(localStorage.getItem(UPLOADS_KEY) || '[]')
        list.unshift({ url, type: kind, name: file.name })
        localStorage.setItem(UPLOADS_KEY, JSON.stringify(list.slice(0, 40)))
      } catch {
        /* đầy bộ nhớ trình duyệt: vẫn dùng được ảnh, chỉ không lưu vào thư viện */
      }
      return url
    },
    async listUploads() {
      try {
        return JSON.parse(localStorage.getItem(UPLOADS_KEY) || '[]')
      } catch {
        return []
      }
    },

    subscribe(_bookId, { onPage, onDelete }) {
      if (!channel) return () => {}
      const fn = (e) => {
        const m = e.data
        if (m.from === tabId) return
        if (m.type === 'page') onPage?.(m.page)
        if (m.type === 'delete') onDelete?.(m.id)
      }
      channel.addEventListener('message', fn)
      return () => channel.removeEventListener('message', fn)
    },

    joinPresence(_bookId, user, onChange) {
      // mỗi tab là một "người" riêng để thử khoá trang
      const self = { key: tabId, user: { ...user, name: `${user.name} · tab ${tabId.slice(0, 4)}` }, since: Date.now(), pageId: null }
      const peers = new Map()
      const publish = () => onChange([self, ...peers.values()])
      const send = (type) => channel?.postMessage({ type, from: tabId, state: self })
      const fn = (e) => {
        const m = e.data
        if (m.from === tabId || !m.type?.startsWith('presence')) return
        if (m.type === 'presence-leave') peers.delete(m.from)
        else {
          peers.set(m.from, { ...m.state, seen: Date.now() })
          if (m.type === 'presence-hello') send('presence-state')
        }
        publish()
      }
      channel?.addEventListener('message', fn)
      send('presence-hello')
      const beat = setInterval(() => {
        send('presence-state')
        const now = Date.now()
        for (const [k, v] of peers) if (now - v.seen > 6000) peers.delete(k)
        publish()
      }, 2000)
      const bye = () => send('presence-leave')
      window.addEventListener('pagehide', bye)
      publish()
      return {
        update(state) {
          Object.assign(self, state)
          send('presence-state')
          publish()
        },
        leave() {
          clearInterval(beat)
          bye()
          window.removeEventListener('pagehide', bye)
          channel?.removeEventListener('message', fn)
        },
      }
    },

    async publish() {
      const db = read()
      db.published = { at: new Date().toISOString(), pages: sorted(db.pages) }
      write(db)
      return { publishedAt: db.published.at }
    },
  }
}
