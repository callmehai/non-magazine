import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getStore, between, pageData, EDITOR_USERNAME } from '../canvas/store/index.js'
import { clonePageData, newElement, withIds, uid, ungroupElement, groupElements, pageSide, PAGE_W, PAGE_H } from '../canvas/model.js'
import canvasBook from '../content/canvasBook.js'
import { compressImage, fitBox, videoPoster, videoFrame } from '../canvas/media.js'
import { ensureFont, ensureFontsFor, boldWeight } from '../canvas/fonts.js'
import { lockHolder, holdersByPage } from '../canvas/locks.js'
import Stage from './Stage.jsx'
import ContextBar from './ContextBar.jsx'
import SidePanel from './SidePanel.jsx'
import PageStrip, { colorOf, initials } from './PageStrip.jsx'
import { colorsOfPage } from './ui.jsx'
import HistoryPanel from './HistoryPanel.jsx'
import { CanvasLang, textField, plainText } from '../canvas/lang.js'
import VideoPreview from './VideoPreview.jsx'
import { useConfirm, useToasts, GlobeIcon, PasswordDialog } from './Overlays.jsx'
import { TEMPLATE_KINDS } from '../canvas/model.js'
import '../canvas/canvas.css'
import './editor.css'

const BOOK_SLUG = 'non'
const SAVE_DELAY = 700
const UNDO_LIMIT = 500 // bước Ctrl+Z nhớ được cho mỗi trang (tải lại trang thì mất — khi đó dùng Lịch sử)
const CHECKPOINT_GAP = 60 * 1000 // mốc "Trong lần mở này" của Lịch sử: tối đa 1 mốc / phút / trang
const EDIT_LANG_KEY = 'non-editor-lang-2' // đổi tên 14/11 khi mặc định sang 日本語 (lựa chọn cũ không còn giữ)
const MOD = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl+'

/**
 * #/admin có hai chế độ (nút gạt góc trên bên phải):
 *  - Xem: mặc định khi mở/tải lại trang, không cần đăng nhập — lật trang, xem bản Việt/Nhật, xem Lịch sử
 *  - Sửa: nhập mật khẩu của tài khoản biên tập chung (EDITOR_USERNAME); về Xem thì lưu nốt rồi đăng xuất tab này
 */
export default function EditorApp() {
  const [store, setStore] = useState(null)
  const [session, setSession] = useState(null) // null = chế độ Xem

  useEffect(() => {
    let alive = true
    getStore().then((s) => alive && setStore(s))
    return () => {
      alive = false
    }
  }, [])
  useEffect(() => store?.onAuthChange((s) => setSession(s)), [store])

  if (!store) return <div className="ed-splash">Đang tải…</div>
  return (
    <BookEditor
      store={store}
      user={session?.user ?? null}
      onUnlock={async (password) => setSession(await store.signIn(EDITOR_USERNAME, password))}
      onLock={async () => {
        await store.signOut()
        setSession(null)
      }}
    />
  )
}

/* ── editor ─────────────────────────────────────────────── */
function BookEditor({ store, user, onUnlock, onLock }) {
  const viewing = !user // chế độ Xem: không sửa được gì, không giữ khoá trang
  // người dùng cho khoá trang: chỉ đổi khi bật/tắt Sửa (phiên tự làm mới mỗi giờ không tính là vào lại trang)
  const userId = user?.id ?? null
  const userName = user?.name ?? null
  const me = useMemo(() => (userId ? { id: userId, name: userName } : null), [userId, userName])
  const [book, setBook] = useState(null)
  const [pages, setPages] = useState([])
  const pagesRef = useRef([])
  const [currentId, setCurrentId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [editingId, setEditingId] = useState(null)
  // đang sửa bản nào của sách song ngữ (nhớ trên máy này) — mặc định 日本語: bản Nhật là bản chuẩn để nộp
  const [editLang, setEditLangState] = useState(() => {
    try {
      return localStorage.getItem(EDIT_LANG_KEY) === 'vi' ? 'vi' : 'ja'
    } catch {
      return 'ja'
    }
  })
  const setEditLang = (l) => {
    setEditLangState(l)
    setEditingId(null)
    try {
      localStorage.setItem(EDIT_LANG_KEY, l)
    } catch {
      /* bỏ qua */
    }
  }
  const [zoom, setZoom] = useState(1)
  const [tab, setTab] = useState('text')
  const [uploads, setUploads] = useState([])
  const [uploading, setUploading] = useState(0)
  const [saveState, setSaveState] = useState('saved')
  const [presence, setPresence] = useState([])
  const [loadError, setLoadError] = useState('')
  const history = useRef(new Map()) // pageId → { past: [], future: [] }
  const [histCount, setHistCount] = useState({}) // pageId → { undo, redo } — để bật/tắt nút
  const checkpoints = useRef(new Map()) // pageId → [{ id, data, at, session }] — mới nhất trước
  const [historyPanel, setHistoryPanel] = useState(null) // null | { open }
  const [historyTick, setHistoryTick] = useState(0)
  const [videoPreview, setVideoPreview] = useState(null) // null | { id, open }
  const [unlockDialog, setUnlockDialog] = useState(null) // null | { open } — hộp nhập mật khẩu
  const [switching, setSwitching] = useState(false) // đang lưu nốt trước khi về chế độ Xem
  const saving = useRef(new Map()) // pageId → { timer, inFlight, dirty }
  const presenceRef = useRef(null)
  const doSaveRef = useRef(null)
  const clipboard = useRef(null)
  const [toast, toaster] = useToasts()
  const [confirm, confirmDialog] = useConfirm()

  const setAll = (next) => {
    pagesRef.current = next
    setPages(next)
  }

  // ── tải sách + nghe thay đổi từ người khác
  useEffect(() => {
    let unsub = () => {}
    let cancelled = false // effect đã dọn trước khi tải xong (StrictMode) → không đăng ký nữa
    store
      .loadBook(BOOK_SLUG)
      .then(({ book, pages }) => {
        if (cancelled) return
        ensureFontsFor(pages)
        setBook(book)
        setAll(pages)
        setCurrentId(pages[0]?.id ?? null)
        unsub = store.subscribe(book.id, {
          onPage(remote) {
            ensureFontsFor([remote])
            const local = pagesRef.current.find((p) => p.id === remote.id)
            const s = saving.current.get(remote.id)
            const busy = s && (s.timer || s.inFlight || s.dirty)
            let next
            if (!local) next = [...pagesRef.current, remote]
            else if (remote.version > local.version && !busy) next = pagesRef.current.map((p) => (p.id === remote.id ? remote : p))
            else next = pagesRef.current.map((p) => (p.id === remote.id ? { ...p, position: remote.position } : p))
            setAll(next.sort((a, b) => a.position - b.position))
          },
          onDelete(id) {
            setAll(pagesRef.current.filter((p) => p.id !== id))
            setCurrentId((cur) => (cur === id ? pagesRef.current[0]?.id ?? null : cur))
          },
        })
      })
      .catch((e) => !cancelled && setLoadError(e.message || String(e)))
    return () => {
      cancelled = true
      unsub()
    }
  }, [store])

  // thư viện "Tải lên" chỉ dùng khi sửa (danh sách tệp chỉ người biên tập đọc được)
  useEffect(() => {
    if (me) store.listUploads().then(setUploads, () => {})
  }, [store, me])

  // ── ai đang ở trang nào (khoá trang)
  useEffect(() => {
    if (!book) return
    const p = store.joinPresence(book.id, me, (list) => setPresence(list))
    presenceRef.current = p
    return () => p.leave()
  }, [store, book, me])

  // chạy sau effect trên (cùng thứ tự khai báo) → vừa bật Sửa là báo ngay mình đang ở trang nào
  useEffect(() => {
    presenceRef.current?.update({ pageId: currentId, pageSince: Date.now() })
  }, [currentId, book, me])

  const myKey = presence[0]?.key ?? null // phần tử đầu luôn là chính mình
  const holder = currentId ? lockHolder(presence, currentId) : null
  const locked = !!holder && holder.key !== myKey // người khác đang sửa trang này
  const readOnly = viewing || locked
  const readOnlyNote = viewing ? 'Đang ở chế độ Xem — muốn chỉnh thì bật “Sửa” ở góc trên bên phải.' : null

  // về chế độ Xem: đóng Lịch sử (người xem không xem/khôi phục bản cũ)
  useEffect(() => {
    if (viewing) setHistoryPanel((h) => h && { open: false })
  }, [viewing])
  const holders = useMemo(() => holdersByPage(presence), [presence])

  const page = pages.find((p) => p.id === currentId) || null
  const pageIndex = pages.findIndex((p) => p.id === currentId)
  const selection = useMemo(() => (page ? selectedIds.map((id) => page.elements.find((e) => e.id === id)).filter(Boolean) : []), [page, selectedIds])
  const docColors = useMemo(() => colorsOfPage(page), [page])

  useEffect(() => {
    setSelectedIds([])
    setEditingId(null)
  }, [currentId, readOnly])

  // ── lưu (gộp các thay đổi liên tiếp, kiểm tra phiên bản)
  const doSave = useCallback(
    async (id) => {
      const s = saving.current.get(id) || {}
      saving.current.set(id, s)
      s.timer = null
      if (s.inFlight) {
        s.dirty = true
        return
      }
      const p = pagesRef.current.find((x) => x.id === id)
      if (!p) return
      s.inFlight = true
      s.dirty = false
      setSaveState('saving')
      try {
        const { version } = await store.savePage(id, pageData(p), p.version)
        setAll(pagesRef.current.map((x) => (x.id === id ? { ...x, version } : x)))
      } catch (e) {
        if (e.code === 'conflict' && e.page) {
          setAll(pagesRef.current.map((x) => (x.id === id ? e.page : x)))
          toast.show({ type: 'info', title: 'Trang vừa được người khác sửa', desc: 'Đã tải bản mới nhất của trang này.' })
        } else {
          s.failed = true
          setSaveState('error')
          toast.show({ type: 'error', title: 'Chưa lưu được thay đổi', desc: e.message || String(e), action: { label: 'Thử lại', onClick: () => doSaveRef.current(id) } })
          s.inFlight = false
          return
        }
      }
      s.inFlight = false
      s.failed = false
      if (s.dirty) return doSaveRef.current(id)
      const anyPending = [...saving.current.values()].some((v) => v.timer || v.inFlight)
      setSaveState(anyPending ? 'saving' : 'saved')
    },
    [store, toast]
  )
  useEffect(() => {
    doSaveRef.current = doSave
  }, [doSave])

  const scheduleSave = useCallback(
    (id) => {
      const s = saving.current.get(id) || {}
      saving.current.set(id, s)
      clearTimeout(s.timer)
      s.timer = setTimeout(() => doSave(id), SAVE_DELAY)
      setSaveState('saving')
    },
    [doSave]
  )

  /** lưu ngay mọi thay đổi đang chờ rồi đợi xong (tối đa 15 giây) → true nếu đã lưu hết */
  const flushSaves = useCallback(async () => {
    for (const [id, s] of saving.current) {
      if (!s.timer) continue
      clearTimeout(s.timer)
      doSave(id)
    }
    const pending = () => [...saving.current.values()].some((v) => v.timer || v.inFlight || v.dirty)
    const until = Date.now() + 15000
    while (pending() && Date.now() < until) await new Promise((r) => setTimeout(r, 100))
    return !pending() && ![...saving.current.values()].some((v) => v.failed)
  }, [doSave])

  // ── nút gạt Xem / Sửa
  const switchToView = useCallback(async () => {
    if (viewing || switching) return
    setSwitching(true)
    setEditingId(null)
    const ok = await flushSaves()
    if (!ok) {
      setSwitching(false)
      toast.show({ type: 'error', title: 'Chưa chuyển sang Xem được', desc: 'Còn thay đổi chưa lưu. Đợi “✓ Đã lưu” rồi bấm lại.' })
      return
    }
    try {
      await onLock()
      toast.show({ type: 'info', title: 'Đã về chế độ Xem', desc: 'Muốn sửa tiếp thì bật “Sửa” và nhập lại mật khẩu.' })
    } catch (e) {
      toast.show({ type: 'error', title: 'Chưa chuyển sang Xem được', desc: e.message || String(e) })
    } finally {
      setSwitching(false)
    }
  }, [viewing, switching, flushSaves, onLock, toast])

  const unlock = useCallback(
    async (password) => {
      await onUnlock(password) // sai mật khẩu → ném lỗi, hộp thoại hiện lỗi
      setUnlockDialog((d) => d && { open: false })
      toast.show({ title: 'Đã bật chế độ Sửa', desc: 'Mọi thay đổi tự lưu. Bấm “Xem” để khoá lại.' })
    },
    [onUnlock, toast]
  )
  const closeUnlock = useCallback(() => setUnlockDialog((d) => d && { open: false }), [])
  const goneUnlock = useCallback(() => setUnlockDialog(null), [])

  // cảnh báo nếu đóng tab khi còn thay đổi chưa lưu
  useEffect(() => {
    const fn = (e) => {
      if ([...saving.current.values()].some((v) => v.timer || v.inFlight)) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', fn)
    return () => window.removeEventListener('beforeunload', fn)
  }, [])

  /** mốc cho Lịch sử: bản ngay trước khi sửa, tối đa 1 mốc / phút (force: luôn ghi, vd. trước khi khôi phục) */
  const addCheckpoint = useCallback((id, prev, force) => {
    const list = checkpoints.current.get(id) || []
    if (!force && list[0] && Date.now() - Date.parse(list[0].at) < CHECKPOINT_GAP) return
    checkpoints.current.set(id, [{ id: `s${Date.now()}`, data: pageData(prev), at: new Date().toISOString(), session: true }, ...list].slice(0, 60))
  }, [])
  const getSessionVersions = useCallback((id) => checkpoints.current.get(id) || [], [])

  // ── sửa trang (mọi thay đổi đi qua đây → undo + tự lưu)
  const commitPage = useCallback(
    (id, patch, key) => {
      const prev = pagesRef.current.find((p) => p.id === id)
      if (!prev || viewing) return
      const next = { ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }
      const h = history.current.get(id) || { past: [], future: [] }
      const last = h.past[h.past.length - 1]
      // chỉnh liên tục cùng một thứ (gõ, kéo thanh trượt…) → gộp thành một bước undo
      if (!(key && last && last.key === key && Date.now() - last.t < 1200)) {
        h.past.push({ data: pageData(prev), key, t: Date.now() })
        if (h.past.length > UNDO_LIMIT) h.past.shift()
      } else last.t = Date.now()
      h.future = []
      history.current.set(id, h)
      addCheckpoint(id, prev, key === 'restore')
      setHistCount((c) => ({ ...c, [id]: { undo: h.past.length, redo: 0 } }))
      setAll(pagesRef.current.map((p) => (p.id === id ? next : p)))
      scheduleSave(id)
    },
    [scheduleSave, addCheckpoint, viewing]
  )

  /** patches = { [elementId]: patch } — nhiều phần tử, một bước undo */
  const updateElements = useCallback(
    (patches, key) => {
      if (!currentId || readOnly) return
      commitPage(currentId, (p) => ({ elements: p.elements.map((e) => (patches[e.id] ? { ...e, ...patches[e.id] } : e)) }), key)
    },
    [currentId, readOnly, commitPage]
  )

  /** sửa các phần tử đang chọn (từ thanh công cụ) */
  const updateSelected = useCallback(
    (patch, key) => {
      if (patch.font) ensureFont(patch.font)
      updateElements(Object.fromEntries(selectedIds.map((id) => [id, patch])), key && `${selectedIds.join()}:${key}`)
    },
    [selectedIds, updateElements]
  )

  const addElements = useCallback(
    (els) => {
      if (!currentId || readOnly || !els.length) return
      els.forEach((el) => el.font && ensureFont(el.font))
      commitPage(currentId, (p) => ({ elements: [...p.elements, ...els] }))
      setSelectedIds(els.map((e) => e.id))
    },
    [currentId, readOnly, commitPage]
  )
  const addElement = useCallback((el) => addElements([el]), [addElements])

  const deleteSelected = useCallback(() => {
    if (!selectedIds.length || readOnly) return
    commitPage(currentId, (p) => ({ elements: p.elements.filter((e) => !selectedIds.includes(e.id)) }))
    setSelectedIds([])
  }, [selectedIds, readOnly, currentId, commitPage])

  /** rã nhóm → chọn phần vừa bấm (nhấp đúp) hoặc cả các phần */
  const ungroup = useCallback(
    (groupId, focusId) => {
      if (!currentId || readOnly) return
      let kids = []
      commitPage(currentId, (p) => {
        const i = p.elements.findIndex((e) => e.id === groupId)
        if (i < 0 || p.elements[i].type !== 'group') return {}
        kids = ungroupElement(p.elements[i])
        const els = [...p.elements]
        els.splice(i, 1, ...kids)
        return { elements: els }
      })
      if (kids.length) setSelectedIds(focusId && kids.some((k) => k.id === focusId) ? [focusId] : kids.map((k) => k.id))
    },
    [currentId, readOnly, commitPage]
  )

  /** nhóm các phần đang chọn; nhóm nằm ở lớp của phần trên cùng */
  const groupSelected = useCallback(() => {
    if (selectedIds.length < 2 || readOnly) return
    let group = null
    commitPage(currentId, (p) => {
      const picked = p.elements.filter((e) => selectedIds.includes(e.id))
      if (picked.length < 2) return {}
      group = groupElements(picked)
      const top = p.elements.findLastIndex((e) => selectedIds.includes(e.id))
      const below = p.elements.slice(0, top).filter((e) => !selectedIds.includes(e.id))
      const above = p.elements.slice(top + 1)
      return { elements: [...below, group, ...above] }
    })
    if (group) setSelectedIds([group.id])
  }, [selectedIds, readOnly, currentId, commitPage])

  const duplicateSelected = useCallback(() => {
    if (!selection.length || readOnly) return
    addElements(selection.map((el) => ({ ...withIds(el), x: el.x + 12, y: el.y + 12 })))
  }, [selection, readOnly, addElements])

  const layer = useCallback(
    (dir) => {
      if (selectedIds.length !== 1 || readOnly) return
      commitPage(currentId, (p) => {
        const els = [...p.elements]
        const i = els.findIndex((e) => e.id === selectedIds[0])
        const [el] = els.splice(i, 1)
        const to = { front: els.length, back: 0, up: Math.min(els.length, i + 1), down: Math.max(0, i - 1) }[dir]
        els.splice(to, 0, el)
        return { elements: els }
      })
    },
    [selectedIds, readOnly, currentId, commitPage]
  )

  /** căn: 1 phần tử → theo trang; nhiều phần tử → theo khung bao của nhóm */
  const align = useCallback(
    (dir) => {
      if (!selection.length) return
      const box =
        selection.length === 1
          ? { l: 0, t: 0, r: PAGE_W, b: PAGE_H }
          : {
              l: Math.min(...selection.map((e) => e.x)),
              t: Math.min(...selection.map((e) => e.y)),
              r: Math.max(...selection.map((e) => e.x + e.w)),
              b: Math.max(...selection.map((e) => e.y + e.h)),
            }
      const patches = {}
      for (const e of selection) {
        patches[e.id] = {
          left: { x: box.l },
          center: { x: (box.l + box.r) / 2 - e.w / 2 },
          right: { x: box.r - e.w },
          top: { y: box.t },
          middle: { y: (box.t + box.b) / 2 - e.h / 2 },
          bottom: { y: box.b - e.h },
        }[dir]
      }
      updateElements(patches)
    },
    [selection, updateElements]
  )

  /** Ctrl+Z / Ctrl+Shift+Z trên một trang (mặc định trang đang mở) */
  const undo = useCallback(
    (redo = false, id = currentId) => {
      if (!id || (id === currentId && readOnly)) return
      const h = history.current.get(id)
      if (!h) return
      const from = redo ? h.future : h.past
      const to = redo ? h.past : h.future
      const step = from.pop()
      if (!step) return
      const cur = pagesRef.current.find((p) => p.id === id)
      if (!cur) return
      to.push({ data: pageData(cur), t: 0 })
      setHistCount((c) => ({ ...c, [id]: { undo: h.past.length, redo: h.future.length } }))
      setAll(pagesRef.current.map((p) => (p.id === id ? { ...p, ...step.data } : p)))
      setSelectedIds([])
      scheduleSave(id)
    },
    [currentId, readOnly, scheduleSave]
  )

  const restoreVersion = useCallback(
    (v) => {
      if (!currentId || readOnly) return
      const id = currentId
      ensureFontsFor([v.data])
      commitPage(id, pageData(v.data), 'restore')
      setHistoryTick((t) => t + 1)
      toast.show({
        type: 'success',
        title: `Đã khôi phục trang ${pageIndex + 1}`,
        desc: 'Bản đang mở trước đó vẫn nằm trong Lịch sử.',
        action: { label: 'Hoàn tác', onClick: () => undo(false, id) },
      })
    },
    [currentId, readOnly, commitPage, toast, pageIndex, undo]
  )

  // ── tải lên (ảnh được nén trước) → thư viện "Tải lên" dùng chung
  const uploadOne = useCallback(
    async (file) => {
      const isVideo = file.type.startsWith('video/')
      if (!isVideo && !file.type.startsWith('image/')) throw new Error(`${file.name}: chỉ nhận ảnh hoặc video`)
      if (isVideo && file.size > 50 * 1024 * 1024) throw new Error(`${file.name}: video quá 50MB`)
      const prepared = isVideo ? { file } : await compressImage(file, store.kind === 'local' ? 1600 : 2400)
      const id = uid()
      const url = await store.uploadFile(prepared.file, isVideo ? 'video' : 'image', id)
      const item = { url, type: isVideo ? 'video' : 'image', name: file.name, width: prepared.width, height: prepared.height }
      if (isVideo) {
        // ảnh bìa tự động: chụp một khung hình đầu video (lỗi thì bỏ qua — vẫn dùng được video)
        try {
          const shot = await videoPoster(file)
          Object.assign(item, { width: shot.width, height: shot.height, poster: await store.uploadFile(shot.file, 'poster', id) })
        } catch (e) {
          console.warn('Không tạo được ảnh bìa video', e)
        }
      }
      setUploads((u) => [item, ...u.filter((x) => x.url !== url)])
      return item
    },
    [store]
  )

  const uploadFiles = useCallback(
    async (files) => {
      setUploading((n) => n + files.length)
      const tid = toast.show({ type: 'loading', title: files.length > 1 ? `Đang tải lên ${files.length} tệp` : `Đang tải lên “${short(files[0].name)}”` })
      const done = []
      const failed = []
      for (const f of files) {
        try {
          done.push(await uploadOne(f))
        } catch (e) {
          failed.push(e.message || String(e))
        } finally {
          setUploading((n) => n - 1)
        }
      }
      if (failed.length) toast.update(tid, { type: 'error', title: done.length ? `Tải lên được ${done.length}/${files.length} tệp` : 'Tải lên không thành công', desc: failed[0] })
      else toast.update(tid, { type: 'success', title: files.length > 1 ? `Đã tải lên ${files.length} tệp` : 'Đã tải lên', desc: undefined })
      return done
    },
    [uploadOne, toast]
  )

  /** dùng cho "Thay ảnh", ảnh nền… — trả về URL (full: trả cả mục, vd. video kèm ảnh bìa) */
  const uploadForField = useCallback(
    async (file, _kind, full = false) => {
      const [item] = await uploadFiles([file])
      if (!item) throw new Error('upload failed')
      return full ? item : item.url
    },
    [uploadFiles]
  )

  /** ảnh bìa video = khung hình đang dừng trong hộp "Xem video" */
  const setPosterFromFrame = useCallback(
    async (videoEl, elId) => {
      const tid = toast.show({ type: 'loading', title: 'Đang lưu ảnh bìa' })
      try {
        const shot = await videoFrame(videoEl)
        const poster = await store.uploadFile(shot.file, 'poster')
        updateElements({ [elId]: { poster } })
        toast.update(tid, { type: 'success', title: 'Đã đặt ảnh bìa video' })
      } catch (e) {
        toast.update(tid, { type: 'error', title: 'Không đặt được ảnh bìa', desc: e.message || String(e) })
      }
    },
    [store, toast, updateElements]
  )
  const closeVideo = useCallback(() => setVideoPreview((s) => s && { ...s, open: false }), [])
  const goneVideo = useCallback(() => setVideoPreview(null), [])
  const previewEl = videoPreview && page?.elements.find((e) => e.id === videoPreview.id)

  /** phần tử ảnh/video từ một mục trong thư viện; `at` = điểm thả (pt) */
  const elementFromAsset = useCallback(async (asset, at) => {
    let el
    if (asset.type === 'video') el = newElement('video', { src: asset.url, poster: asset.poster, ...(asset.width ? fitBox(asset.width, asset.height, 400) : {}) })
    else {
      const size = asset.width ? { width: asset.width, height: asset.height } : await naturalSize(asset.url)
      el = newElement('image', { src: asset.url, ...fitBox(size.width, size.height, 320) })
    }
    if (at) Object.assign(el, { x: at.x - el.w / 2, y: at.y - el.h / 2 })
    return el
  }, [])

  const onDropData = useCallback(
    async (payload, at, target) => {
      if (payload.kind === 'element') {
        const el = { ...withIds(payload.el) }
        addElement({ ...el, x: at.x - el.w / 2, y: at.y - el.h / 2 })
      } else if (payload.kind === 'asset') {
        // thả ảnh lên một ảnh có sẵn → thay ảnh (giữ nguyên khung)
        if (target?.type === 'image' && payload.asset.type === 'image') updateElements({ [target.id]: { src: payload.asset.url } })
        else if (target?.type === 'video' && payload.asset.type === 'video') updateElements({ [target.id]: { src: payload.asset.url } })
        else addElement(await elementFromAsset(payload.asset, at))
      }
    },
    [addElement, updateElements, elementFromAsset]
  )

  const onDropFiles = useCallback(
    async (files, at, target) => {
      const items = await uploadFiles(files)
      if (!items.length) return
      if (items.length === 1 && target && target.type === items[0].type && (target.type === 'image' || target.type === 'video')) {
        updateElements({ [target.id]: { src: items[0].url } })
        return
      }
      const els = []
      for (const [i, it] of items.entries()) els.push(await elementFromAsset(it, { x: at.x + i * 16, y: at.y + i * 16 }))
      addElements(els)
    },
    [uploadFiles, updateElements, elementFromAsset, addElements]
  )

  // ── thao tác với trang
  const addPage = useCallback(
    async (template, afterId = currentId) => {
      if (viewing) return
      const list = pagesRef.current
      const i = list.findIndex((p) => p.id === afterId)
      const pos = between(list[i]?.position, list[i + 1]?.position)
      const data = template ? clonePageData(template) : { bg: '#f4ede0', elements: [] }
      const p = await store.addPage(book.id, data, pos)
      setAll([...pagesRef.current.filter((x) => x.id !== p.id), p].sort((a, b) => a.position - b.position))
      setCurrentId(p.id)
    },
    [store, book, currentId, viewing]
  )

  const duplicatePage = useCallback((id) => addPage(pagesRef.current.find((p) => p.id === id), id), [addPage])

  const deletePage = useCallback(
    async (id) => {
      if (viewing) return
      const list = pagesRef.current
      const i = list.findIndex((p) => p.id === id)
      const victim = list[i]
      const ok = await confirm({
        tone: 'danger',
        title: `Xoá trang ${i + 1}?`,
        body: (
          <p>
            <b>
              Trang {i + 1} · {describePage(victim)}
            </b>{' '}
            cùng mọi chữ, ảnh trên trang sẽ bị xoá khỏi sách. Các trang phía sau lùi lên một số và đổi bên trái/phải.
          </p>
        ),
        confirmLabel: `Xoá trang ${i + 1}`,
      })
      if (!ok) return
      await store.deletePage(id)
      const rest = pagesRef.current.filter((p) => p.id !== id)
      setAll(rest)
      if (id === currentId) setCurrentId(rest[Math.min(i, rest.length - 1)]?.id ?? null)
      toast.show({
        title: `Đã xoá trang ${i + 1}`,
        action: {
          label: 'Hoàn tác',
          onClick: async () => {
            const back = await store.addPage(book.id, pageData(victim), victim.position)
            setAll([...pagesRef.current, back].sort((a, b) => a.position - b.position))
            setCurrentId(back.id)
          },
        },
      })
    },
    [store, book, currentId, confirm, toast, viewing]
  )

  const movePage = useCallback(
    async (id, toIdx) => {
      if (viewing) return
      // thả lên trang thứ toIdx → chiếm đúng vị trí đó (kéo sang phải: nằm sau, kéo sang trái: nằm trước)
      const list = pagesRef.current.filter((p) => p.id !== id)
      const pos = between(list[toIdx - 1]?.position, list[toIdx]?.position)
      setAll(pagesRef.current.map((p) => (p.id === id ? { ...p, position: pos } : p)).sort((a, b) => a.position - b.position))
      await store.movePage(id, pos)
    },
    [store, viewing]
  )

  const publish = useCallback(async () => {
    const n = pagesRef.current.length
    const pending = [...saving.current.values()].some((v) => v.timer || v.inFlight)
    const ok = await confirm({
      tone: 'neutral',
      icon: <GlobeIcon />,
      title: 'Xuất bản sách?',
      body: (
        <>
          <p>
            <b>
              {canvasBook.title} · {n} trang
            </b>{' '}
            sẽ hiện ngay cho người đọc trên web, đúng như bản bạn đang thấy.
          </p>
          <p>Sau đó bạn vẫn sửa tiếp bình thường; người đọc chỉ thấy thay đổi mới khi bạn xuất bản lần nữa.</p>
        </>
      ),
      note:
        store.kind === 'local'
          ? 'Đang ở chế độ thử: bản xuất bản chỉ lưu trên máy này, chưa lên web. Kết nối Supabase thì mới đưa lên web thật.'
          : pending
            ? 'Còn thay đổi đang lưu — đợi “Đã lưu” rồi xuất bản để không sót.'
            : null,
      confirmLabel: `Xuất bản ${n} trang`,
    })
    if (!ok) return
    const tid = toast.show({ type: 'loading', title: 'Đang xuất bản…' })
    try {
      await store.publish(book.id)
      toast.update(tid, {
        type: 'success',
        title: store.kind === 'local' ? 'Đã xuất bản (bản thử trên máy này)' : 'Đã xuất bản lên web',
        action: { label: 'Xem trang', onClick: () => window.open(location.pathname, '_blank') },
      })
    } catch (e) {
      toast.update(tid, { type: 'error', title: 'Xuất bản không thành công', desc: e.message || String(e), action: { label: 'Thử lại', onClick: () => store.publish(book.id) } })
    }
  }, [store, book, confirm, toast])

  const closeHistory = useCallback(() => setHistoryPanel((s) => s && { open: false }), [])
  const goneHistory = useCallback(() => setHistoryPanel(null), [])

  // ── phím tắt
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return
      const flip = /^(PageDown|PageUp|ArrowLeft|ArrowRight)$/.test(e.key)
      if (viewing && !flip) return // chế độ Xem: chỉ lật trang
      const mod = e.metaKey || e.ctrlKey
      const k = e.key.toLowerCase()
      const single = selection.length === 1 ? selection[0] : null
      if (mod && k === 'z') {
        e.preventDefault()
        undo(e.shiftKey)
      } else if (mod && k === 'y') {
        e.preventDefault()
        undo(true)
      } else if (mod && k === 'g') {
        e.preventDefault()
        if (!e.shiftKey) groupSelected()
        else if (single?.type === 'group') ungroup(single.id)
      } else if (mod && k === 'd') {
        e.preventDefault()
        duplicateSelected()
      } else if (mod && k === 'a') {
        e.preventDefault()
        setSelectedIds(page?.elements.map((x) => x.id) || [])
      } else if (mod && k === 'c' && selection.length) {
        clipboard.current = selection
      } else if (mod && k === 'v' && clipboard.current?.length) {
        e.preventDefault()
        addElements(clipboard.current.map((el) => ({ ...withIds(el), x: el.x + 12, y: el.y + 12 })))
      } else if (mod && k === 'b' && single?.type === 'text') {
        e.preventDefault()
        updateSelected({ weight: (single.weight || 400) >= 600 ? 400 : boldWeight(single.font) })
      } else if (mod && k === 'i' && single?.type === 'text') {
        e.preventDefault()
        updateSelected({ italic: !single.italic })
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selection.length) {
        e.preventDefault()
        deleteSelected()
      } else if (e.key === 'Escape') {
        setSelectedIds([])
      } else if (e.key === 'Enter' && single?.type === 'text') {
        e.preventDefault()
        setEditingId(single.id)
      } else if (e.key.startsWith('Arrow') && selection.length && !viewing) {
        e.preventDefault()
        const d = e.shiftKey ? 10 : 1
        const dx = { ArrowLeft: -d, ArrowRight: d }[e.key] || 0
        const dy = { ArrowUp: -d, ArrowDown: d }[e.key] || 0
        updateElements(Object.fromEntries(selection.map((el) => [el.id, { x: el.x + dx, y: el.y + dy }])), 'nudge')
      } else if (flip && !mod && !e.altKey) {
        // ← → (khi không chọn gì) và PageUp/PageDown: lật sang trang trước/sau theo dải trang bên dưới
        // (chặn mặc định: không để mũi tên cuộn dải trang thay vì lật)
        e.preventDefault()
        const list = pagesRef.current
        const i = list.findIndex((p) => p.id === currentId)
        const n = list[i + (e.key === 'PageDown' || e.key === 'ArrowRight' ? 1 : -1)]
        if (n) setCurrentId(n.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, duplicateSelected, selection, page, deleteSelected, addElements, updateElements, updateSelected, currentId, groupSelected, ungroup, viewing])

  if (loadError) return <div className="ed-splash">Không tải được sách: {loadError}</div>
  if (!book) return <div className="ed-splash">Đang tải sách…</div>

  const others = presence.filter((p) => p.key !== myKey)
  const hist = histCount[currentId] || { undo: 0, redo: 0 }
  const previewUrl = `${location.pathname}?draft=1`

  return (
    <CanvasLang.Provider value={editLang}>
      <div className={`ed-app ${tab && !viewing ? 'has-panel' : ''} ${viewing ? 'is-viewing' : ''}`}>
        <header className="ed-top">
          <div className="ed-top__left">
            <strong className="ed-top__title">{canvasBook.title}</strong>
            {viewing ? (
              <span className="ed-save">Bản nháp · chỉ xem</span>
            ) : (
              <span className={`ed-save is-${saveState}`}>{saveState === 'saving' ? 'Đang lưu…' : saveState === 'error' ? 'Lỗi lưu!' : '✓ Đã lưu'}</span>
            )}
            {store.kind === 'local' && <span className="ed-badge">Chế độ thử — lưu trên máy này</span>}
          </div>
          <div className="ed-top__mid">
            <div className="ed-langswitch" role="group" aria-label={viewing ? 'Đang xem bản' : 'Đang sửa bản'}>
              <button type="button" lang="ja" className={editLang === 'ja' ? 'is-on' : ''} aria-pressed={editLang === 'ja'} onClick={() => setEditLang('ja')} title="Chữ chưa dịch hiện mờ, viền chấm">
                日本語
              </button>
              <button type="button" className={editLang === 'vi' ? 'is-on' : ''} aria-pressed={editLang === 'vi'} onClick={() => setEditLang('vi')}>
                Tiếng Việt
              </button>
            </div>
            {!viewing && (
              <div className="ed-tools" role="group" aria-label="Hoàn tác và lịch sử">
                <button
                  type="button"
                  className="ed-tools__icon"
                  onClick={() => undo(false)}
                  disabled={readOnly || !hist.undo}
                  title={hist.undo ? `Hoàn tác (${MOD}Z) · còn ${hist.undo} bước` : 'Chưa có gì để hoàn tác'}
                  aria-label="Hoàn tác"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 14 4 9l5-5" />
                    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="ed-tools__icon"
                  onClick={() => undo(true)}
                  disabled={readOnly || !hist.redo}
                  title={hist.redo ? `Làm lại (${MOD}⇧Z) · còn ${hist.redo} bước` : 'Chưa có gì để làm lại'}
                  aria-label="Làm lại"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="m15 14 5-5-5-5" />
                    <path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" />
                  </svg>
                </button>
                <span className="ed-tools__sep" aria-hidden="true" />
                <button type="button" className="ed-tools__btn" onClick={() => setHistoryPanel({ open: true })} disabled={!page} title="Xem và khôi phục bản cũ của trang này">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M12 7v5l4 2" />
                  </svg>
                  Lịch sử
                </button>
              </div>
            )}
          </div>
          <div className="ed-top__right">
            <div className="ed-people">
              {others.map((p) => (
                <span key={p.key} className="ed-avatar" style={{ '--c': colorOf(p.user?.id || p.key) }} title={`${p.user?.name} — trang ${pages.findIndex((x) => x.id === p.pageId) + 1 || '?'}`}>
                  {initials(p.user?.name)}
                </span>
              ))}
            </div>
            <a className="ed-btn" href={previewUrl} target="_blank" rel="noreferrer">
              Xem thử
            </a>
            {user?.role === 'admin' && (
              <button type="button" className="ed-btn ed-btn--primary" onClick={publish}>
                Xuất bản
              </button>
            )}
            <div className="ed-langswitch ed-modeswitch" role="group" aria-label="Chế độ">
              <button type="button" className={viewing ? 'is-on' : ''} aria-pressed={viewing} onClick={switchToView} disabled={switching} title={viewing ? 'Đang ở chế độ Xem' : 'Lưu nốt rồi khoá lại, chỉ xem'}>
                {switching ? 'Đang lưu…' : 'Xem'}
              </button>
              <button type="button" className={viewing ? '' : 'is-on'} aria-pressed={!viewing} onClick={() => viewing && setUnlockDialog({ open: true })} title={viewing ? 'Nhập mật khẩu để sửa' : 'Đang ở chế độ Sửa'}>
                {viewing && <LockGlyph />}
                Sửa
              </button>
            </div>
          </div>
        </header>

        {!viewing && (
          <SidePanel
            tab={tab}
            onTab={setTab}
            uploads={uploads}
            uploading={uploading}
            onAddPage={(tpl) => addPage(tpl)}
            onAddElement={addElement}
            onAddAsset={async (a) => addElement(await elementFromAsset(a))}
            onUploadFiles={uploadFiles}
            selection={selection}
            onChangeSelected={updateSelected}
            onUpdateMany={updateElements}
          />
        )}

        <main className="ed-main">
          <ContextBar
            selection={selection}
            readOnly={readOnly}
            readOnlyNote={readOnlyNote}
            page={page}
            pageNumber={pageIndex + 1}
            pageCount={pages.length}
            editLang={editLang}
            docColors={docColors}
            onChange={updateSelected}
            onPageChange={(patch, key) => !readOnly && commitPage(currentId, patch, key && `page:${key}`)}
            onUpload={uploadForField}
            onPreviewVideo={(id) => setVideoPreview({ id, open: true })}
            onUngroup={ungroup}
            onGroup={groupSelected}
            onLayer={layer}
            onAlign={align}
            onDuplicate={duplicateSelected}
            onDelete={deleteSelected}
          />
          {locked && !viewing && (
            <div className="ed-lock" style={{ '--c': colorOf(holder.user?.id || holder.key) }}>
              <b>{holder.user?.name}</b> đang sửa trang này — bạn chỉ xem được. Trang tự mở khoá khi họ chuyển sang trang khác.
            </div>
          )}
          {page ? (
            <Stage
              page={page}
              side={['left', 'back'].includes(pageSide(pageIndex + 1, pages.length, canvasBook.settings.direction)) ? 'left' : 'right'}
              zoom={zoom}
              selectedIds={selectedIds}
              editingId={editingId}
              readOnly={readOnly}
              onSelect={setSelectedIds}
              onCommit={(patches) => updateElements(patches)}
              onStartEdit={(id) => {
                setSelectedIds([id])
                setEditingId(id)
              }}
              onEndEdit={(id, text) => {
                setEditingId(null)
                const el = pagesRef.current.find((p) => p.id === currentId)?.elements.find((x) => x.id === id)
                const field = textField(editLang) // tiếng Việt → text, tiếng Nhật → ja
                if (el && (el[field] || '') !== text) updateElements({ [id]: { [field]: text || undefined } })
              }}
              onDropData={onDropData}
              onDropFiles={onDropFiles}
              onOpenVideo={(id) => setVideoPreview({ id, open: true })}
              onEnterGroup={ungroup}
            />
          ) : (
            <div className="ed-splash ed-splash--inline">Sách chưa có trang nào — bấm “+” ở dưới để thêm.</div>
          )}
          <div className="ed-zoom">
            <button type="button" onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.25) * 100) / 100))} title="Thu nhỏ">
              −
            </button>
            <button type="button" onClick={() => setZoom(1)} title="Vừa màn hình">
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))} title="Phóng to">
              +
            </button>
          </div>
          <PageStrip
            pages={pages}
            currentId={currentId}
            holders={holders}
            myKey={myKey}
            readOnly={viewing}
            onOpen={setCurrentId}
            onAddClick={() => setTab('templates')}
            onDuplicate={duplicatePage}
            onDelete={deletePage}
            onMove={movePage}
          />
        </main>

        {historyPanel && !viewing && (
          <HistoryPanel
            open={historyPanel.open}
            store={store}
            page={page}
            pageNumber={pageIndex + 1}
            readOnly={readOnly}
            getSessionVersions={getSessionVersions}
            refreshKey={historyTick}
            undoKey={`${MOD}Z`}
            onRestore={restoreVersion}
            onClose={closeHistory}
            onGone={goneHistory}
          />
        )}
        {previewEl?.src && (
          <VideoPreview
            open={videoPreview.open}
            el={previewEl}
            readOnly={readOnly}
            readOnlyNote={readOnlyNote}
            onSetPoster={(v) => setPosterFromFrame(v, previewEl.id)}
            onClose={closeVideo}
            onGone={goneVideo}
          />
        )}
        {unlockDialog && (
          <PasswordDialog
            open={unlockDialog.open}
            note={store.kind === 'local' ? 'Chế độ thử trên máy này: nhập gì cũng được.' : null}
            onSubmit={unlock}
            onClose={closeUnlock}
            onGone={goneUnlock}
          />
        )}
        {toaster}
        {confirmDialog}
      </div>
    </CanvasLang.Provider>
  )
}

const LockGlyph = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
  </svg>
)

function naturalSize(url) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth || 400, height: img.naturalHeight || 300 })
    img.onerror = () => resolve({ width: 400, height: 300 })
    img.src = url
  })
}

const KIND_NAMES = Object.fromEntries(TEMPLATE_KINDS.map((t) => [t.template, t.templateName]))
const short = (name, n = 30) => (name.length > n ? name.slice(0, n) + '…' : name)

/** Tên ngắn để nhận ra trang: tiêu đề đầu tiên trên trang, không có thì tên kiểu mẫu */
function describePage(p) {
  // bỏ chữ trang trí (dấu ngoặc lớn, số chương…): cần ít nhất 2 chữ cái thật
  const texts = (p?.elements || []).filter((e) => e.type === 'text' && /[\p{L}]{2,}/u.test(e.text || ''))
  const title = plainText([...texts].sort((a, b) => b.size - a.size)[0]?.text.split('\n')[0] || '')
  return title ? `“${short(title, 24)}”` : KIND_NAMES[p?.template] || 'trang trống'
}
