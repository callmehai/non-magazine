import { useEffect, useLayoutEffect, useState } from 'react'
import CanvasPage from '../canvas/CanvasPage.jsx'
import { ensureFontsFor } from '../canvas/fonts.js'
import { pageData } from '../canvas/store/index.js'

/**
 * Lịch sử trang — panel trượt từ phải.
 * Gộp hai nguồn: bản cũ đã lưu trên máy chủ (store.listVersions, ~5 phút/bản, còn sau khi tải lại)
 * và mốc trong phiên này (getSessionVersions, ~1 phút/bản, mất khi tải lại).
 */
export default function HistoryPanel({ open, undoKey = 'Ctrl+Z', store, page, pageNumber, readOnly, getSessionVersions, refreshKey, onRestore, onClose, onGone }) {
  const [shown, setShown] = useState(false)
  const [state, setState] = useState({ status: 'loading', list: [] })
  const pageId = page?.id

  useLayoutEffect(() => {
    if (!open) return
    const r = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(r)
  }, [open])
  useEffect(() => {
    if (open) return
    setShown(false)
    const t = setTimeout(onGone, 360)
    return () => clearTimeout(t)
  }, [open, onGone])

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [onClose])

  useEffect(() => {
    if (!pageId) return
    let live = true
    const session = getSessionVersions(pageId)
    store.listVersions(pageId).then(
      (saved) => {
        if (!live) return
        ensureFontsFor([...session, ...saved].map((v) => v.data))
        setState({ status: 'ready', list: [...session, ...saved] })
      },
      (e) => live && setState({ status: 'error', list: session, error: e.message || String(e) })
    )
    return () => {
      live = false
    }
  }, [store, pageId, getSessionVersions, refreshKey])

  // mới nhất trước; bỏ bản trùng với bản hiện tại hoặc trùng bản ngay trước nó
  const now = page ? JSON.stringify(pageData(page)) : ''
  const seen = new Set([now])
  const versions = [...state.list]
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
    .filter((v) => {
      const k = JSON.stringify(pageData(v.data))
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })

  return (
    <div className={`hp-layer ${shown ? 'is-open' : ''}`}>
      <div className="hp-scrim" onClick={onClose} />
      <aside className="hp-panel" role="dialog" aria-modal="true" aria-labelledby="hp-title">
        <header className="hp-head">
          <div>
            <h2 id="hp-title" className="hp-title">
              Lịch sử trang {pageNumber}
            </h2>
            <p className="hp-sub">Bản cũ tự lưu khi bạn sửa. Khôi phục xong vẫn bấm {undoKey} được.</p>
          </div>
          <button type="button" className="hp-close" onClick={onClose} aria-label="Đóng">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </header>

        <div className="hp-body">
          {page && (
            <div className="hp-row is-current">
              <Thumb data={page} />
              <div className="hp-row__text">
                <p className="hp-row__when">Bản hiện tại</p>
                <p className="hp-row__meta">Đang mở trong editor</p>
              </div>
            </div>
          )}

          {state.status === 'loading' && [0, 1, 2].map((i) => <div key={i} className="hp-row hp-row--skeleton" aria-hidden="true" />)}

          {state.status !== 'loading' &&
            versions.map((v) => (
              <div key={v.id} className="hp-row">
                <Thumb data={v.data} />
                <div className="hp-row__text">
                  <p className="hp-row__when">{whenLabel(v.at)}</p>
                  <p className="hp-row__meta">{v.session ? 'Trong lần mở này' : v.by ? `Sửa bởi ${v.by}` : 'Đã lưu'}</p>
                  <button type="button" className="hp-restore" disabled={readOnly} onClick={() => onRestore(v)}>
                    Khôi phục bản này
                  </button>
                </div>
              </div>
            ))}

          {state.status === 'ready' && versions.length === 0 && (
            <div className="hp-empty">
              <p className="hp-empty__title">Chưa có bản cũ nào</p>
              <p>Sửa trang này một lúc là bản trước đó sẽ hiện ở đây, mỗi vài phút một bản.</p>
            </div>
          )}

          {state.status === 'error' && (
            <div className="hp-error" role="alert">
              Không tải được bản cũ trên máy chủ: {state.error}
            </div>
          )}
        </div>

        {readOnly && <footer className="hp-foot">Người khác đang sửa trang này nên bạn chưa khôi phục được.</footer>}
      </aside>
    </div>
  )
}

function Thumb({ data }) {
  return (
    <span className="hp-thumb">
      <CanvasPage page={data} mode="edit" />
    </span>
  )
}

/** Vừa xong · 5 phút trước · Hôm nay 14:32 · Hôm qua 09:10 · 12/10 14:32 · 12/10/2025 14:32 */
function whenLabel(at) {
  const d = new Date(at)
  const diff = Date.now() - d.getTime()
  if (diff < 60_000) return 'Vừa xong'
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)} phút trước`
  const hm = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const day = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((day(new Date()) - day(d)) / 86_400_000)
  if (days === 0) return `Hôm nay ${hm}`
  if (days === 1) return `Hôm qua ${hm}`
  const dm = `${d.getDate()}/${d.getMonth() + 1}`
  return d.getFullYear() === new Date().getFullYear() ? `${dm} ${hm}` : `${dm}/${d.getFullYear()} ${hm}`
}
