import { createClient } from '@supabase/supabase-js'
import { uid } from '../model.js'
import { pageData } from './index.js'

/** Tên đăng nhập → email nội bộ (Supabase Auth cần email; không gửi thư tới địa chỉ này) */
export const toEmail = (username) => `${username.toLowerCase()}@non-magazine.app`

const rowToPage = (r) => ({
  id: r.id,
  position: r.position,
  version: r.version,
  updatedAt: r.updated_at,
  updatedBy: r.updated_by,
  ...r.data,
})

/**
 * Kho dữ liệu Supabase: Auth (tài khoản tạo sẵn), bảng pages (+ lịch sử phiên bản),
 * Storage (ảnh/video), Realtime (thay đổi của người khác + ai đang ở trang nào).
 * Bảng/quyền: scripts/supabase/schema.sql
 */
export function createSupabaseStore() {
  const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: true, storageKey: 'non-book-auth' },
  })
  let profile = null
  let names = null // id → tên hiển thị (cho lịch sử trang)

  const loadProfile = async (user) => {
    if (!user) return null
    const { data, error } = await sb.from('profiles').select('id, username, display_name, role').eq('id', user.id).single()
    if (error || !data) return null
    profile = { id: data.id, name: data.display_name, username: data.username, role: data.role }
    return { user: profile }
  }

  const bookBySlug = async (slug) => {
    const { data, error } = await sb.from('books').select('id, slug, title, settings').eq('slug', slug).single()
    if (error) throw new Error(`Không tìm thấy sách "${slug}"`)
    return data
  }

  return {
    kind: 'supabase',

    async session() {
      const { data } = await sb.auth.getSession()
      return loadProfile(data.session?.user)
    },
    async signIn(username, password) {
      const { data, error } = await sb.auth.signInWithPassword({ email: toEmail(username), password })
      if (error) throw new Error(error.status === 400 ? 'Sai tên đăng nhập hoặc mật khẩu' : error.message)
      const s = await loadProfile(data.user)
      if (!s) {
        await sb.auth.signOut()
        throw new Error('Tài khoản chưa được cấp quyền biên tập')
      }
      return s
    },
    async signOut() {
      await sb.auth.signOut()
      profile = null
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') cb(null)
        else if (event === 'TOKEN_REFRESHED' && session) loadProfile(session.user).then(cb)
      })
      return () => data.subscription.unsubscribe()
    },

    async loadBook(slug) {
      const book = await bookBySlug(slug)
      const { data, error } = await sb.from('pages').select('*').eq('book_id', book.id).is('deleted_at', null).order('position')
      if (error) throw error
      return { book, pages: data.map(rowToPage) }
    },
    async loadPublished(slug) {
      const book = await bookBySlug(slug)
      const { data, error } = await sb.from('publications').select('pages, published_at').eq('book_id', book.id).order('published_at', { ascending: false }).limit(1).maybeSingle()
      if (error) throw error
      return data ? { book, pages: data.pages.map(rowToPage) } : null
    },

    async savePage(id, data, version) {
      const { data: v, error } = await sb.rpc('save_page', { p_id: id, p_data: pageData(data), p_version: version })
      if (error) {
        if (error.message?.includes('conflict')) {
          const { data: row } = await sb.from('pages').select('*').eq('id', id).single()
          throw Object.assign(new Error('conflict'), { code: 'conflict', page: row && rowToPage(row) })
        }
        throw error
      }
      return { version: v }
    },
    async addPage(bookId, data, position) {
      const { data: row, error } = await sb.from('pages').insert({ book_id: bookId, position, data: pageData(data), updated_by: profile?.id }).select('*').single()
      if (error) throw error
      return rowToPage(row)
    },
    async deletePage(id) {
      // xoá mềm: admin khôi phục được
      const { error } = await sb.from('pages').update({ deleted_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
    },
    async movePage(id, position) {
      const { error } = await sb.from('pages').update({ position }).eq('id', id)
      if (error) throw error
    },

    async listVersions(pageId) {
      const { data, error } = await sb.from('page_versions').select('id, data, saved_at, saved_by').eq('page_id', pageId).order('saved_at', { ascending: false }).limit(50)
      if (error) throw error
      if (!names) {
        const { data: people } = await sb.from('profiles').select('id, display_name')
        names = new Map((people || []).map((x) => [x.id, x.display_name]))
      }
      return data.map((r) => ({ id: r.id, data: r.data, at: r.saved_at, by: names.get(r.saved_by) || null }))
    },

    async uploadFile(file, kind) {
      const ext = (file.name.split('.').pop() || (kind === 'video' ? 'mp4' : 'webp')).toLowerCase()
      const path = `${kind}/${uid()}.${ext}`
      const { error } = await sb.storage.from('book-assets').upload(path, file, { contentType: file.type, cacheControl: '31536000' })
      if (error) throw error
      return sb.storage.from('book-assets').getPublicUrl(path).data.publicUrl
    },

    async listUploads() {
      const bucket = sb.storage.from('book-assets')
      const out = []
      for (const type of ['image', 'video']) {
        const { data, error } = await bucket.list(type, { limit: 200, sortBy: { column: 'created_at', order: 'desc' } })
        if (error) throw error
        for (const f of data) {
          if (!f.id) continue // thư mục con
          out.push({ url: bucket.getPublicUrl(`${type}/${f.name}`).data.publicUrl, type, name: f.name, createdAt: f.created_at })
        }
      }
      return out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    },

    subscribe(bookId, { onPage, onDelete }) {
      // tên kênh riêng cho mỗi lần đăng ký: supabase-js trả lại kênh cũ nếu trùng tên,
      // mà kênh cũ đã subscribe thì không gắn thêm callback được (React StrictMode gọi effect 2 lần)
      const ch = sb
        .channel(`pages:${bookId}:${uid()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pages', filter: `book_id=eq.${bookId}` }, (payload) => {
          const row = payload.new
          if (payload.eventType === 'DELETE' || row?.deleted_at) onDelete?.(row?.id || payload.old?.id)
          else if (row) onPage?.(rowToPage(row))
        })
        .subscribe()
      return () => sb.removeChannel(ch)
    },

    joinPresence(bookId, user, onChange) {
      const key = uid()
      const topic = `presence:${bookId}` // mọi người phải chung một kênh mới thấy nhau
      const self = { key, user: { id: user.id, name: user.name }, since: Date.now(), pageId: null, pageSince: 0 }
      let ch = null
      let left = false
      const publish = () => {
        const state = ch ? ch.presenceState() : {}
        const others = Object.entries(state)
          .filter(([k]) => k !== key)
          .map(([k, metas]) => ({ ...metas[metas.length - 1], key: k }))
        onChange([self, ...others]) // phần tử đầu luôn là chính mình
      }
      ;(async () => {
        // kênh cùng tên của lần trước (đang đóng dở) phải gỡ hẳn, không thì supabase-js trả lại chính nó
        for (const old of sb.getChannels()) if (old.topic === `realtime:${topic}`) await sb.removeChannel(old)
        if (left) return
        ch = sb.channel(topic, { config: { presence: { key } } })
        ch.on('presence', { event: 'sync' }, publish)
          .on('presence', { event: 'join' }, publish)
          .on('presence', { event: 'leave' }, publish)
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') ch.track(self)
          })
      })()
      publish()
      return {
        update(state) {
          Object.assign(self, state)
          ch?.track(self)
          publish()
        },
        leave() {
          left = true
          if (!ch) return
          ch.untrack()
          sb.removeChannel(ch)
        },
      }
    },

    async publish(bookId) {
      const { data, error } = await sb.rpc('publish_book', { p_book: bookId })
      if (error) throw error
      return { publishedAt: data }
    },
  }
}
