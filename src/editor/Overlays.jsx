import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/* ════════════════════════════════════════════════════════════
   Hộp xác nhận — thay window.confirm.
   const confirm = useConfirm() → await confirm({ tone, title, body, confirmLabel }) → true/false
   tone 'danger' (xoá: icon + nút đỏ mờ) | 'neutral' (xuất bản: icon xám, nút chính)
   ════════════════════════════════════════════════════════════ */
export function useConfirm() {
  const [state, setState] = useState(null) // { opts, resolve, open }
  const resolveRef = useRef(null)
  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolveRef.current = resolve
        setState({ opts, open: true })
      }),
    []
  )
  const close = useCallback((result) => {
    resolveRef.current?.(result)
    resolveRef.current = null
    setState((s) => s && { ...s, open: false })
  }, [])
  const gone = useCallback(() => setState(null), [])
  const node = state ? <ConfirmDialog {...state.opts} open={state.open} onClose={close} onGone={gone} /> : null
  return [confirm, node]
}

function ConfirmDialog({ open, tone = 'neutral', icon, title, body, note, confirmLabel, cancelLabel = 'Huỷ', onClose, onGone }) {
  const cancelRef = useRef(null)
  const [shown, setShown] = useState(false)

  // vào: gắn xong mới bật cờ để chạy chuyển động; ra: chờ chuyển động xong mới gỡ
  useLayoutEffect(() => {
    if (!open) return
    const r = requestAnimationFrame(() => setShown(true))
    cancelRef.current?.focus() // Enter không bấm nhầm nút xác nhận
    return () => cancelAnimationFrame(r)
  }, [open])
  useEffect(() => {
    if (open) return
    setShown(false)
    const t = setTimeout(onGone, 120)
    return () => clearTimeout(t)
  }, [open, onGone])

  useEffect(() => {
    const key = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose(false)
      }
    }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  }, [onClose])

  return (
    <div className={`ov-layer ${shown ? 'is-open' : ''}`}>
      <div className="ov-scrim" onClick={() => onClose(false)} />
      <div role="alertdialog" aria-modal="true" aria-labelledby="ov-confirm-title" aria-describedby="ov-confirm-desc" className="ov-dialog">
        <div className="ov-dialog__grid">
          <div className={`ov-dialog__icon is-${tone}`}>{icon || (tone === 'danger' ? <TrashIcon /> : <InfoIcon />)}</div>
          <h2 id="ov-confirm-title" className="ov-dialog__title">
            {title}
          </h2>
          <div id="ov-confirm-desc" className="ov-dialog__body">
            {body}
            {note && <div className="ov-dialog__note">{note}</div>}
          </div>
        </div>
        <div className="ov-dialog__actions">
          <button ref={cancelRef} type="button" className="ov-btn ov-btn--secondary" onClick={() => onClose(false)}>
            {cancelLabel}
          </button>
          <button type="button" className={`ov-btn ${tone === 'danger' ? 'ov-btn--danger' : 'ov-btn--primary'}`} onClick={() => onClose(true)}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Toast — đáy giữa màn, tối đa 3 cái.
   const [toast, toaster] = useToasts()
   toast.show({ type: 'success'|'info'|'error'|'loading', title, desc, action: { label, onClick }, duration })
   → id ; toast.update(id, patch) ; toast.dismiss(id)
   Báo xong việc: tự tắt ~4s, không nút đóng. Báo lỗi: không tự tắt, có nút đóng.
   ════════════════════════════════════════════════════════════ */
export function useToasts() {
  const [items, setItems] = useState([])
  const timers = useRef(new Map())
  const seq = useRef(0)

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current.get(id))
    timers.current.delete(id)
    setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setItems((list) => list.filter((t) => t.id !== id)), 220)
  }, [])

  const arm = useCallback(
    (t) => {
      clearTimeout(timers.current.get(t.id))
      const ms = t.duration ?? (t.type === 'error' || t.type === 'loading' ? 0 : t.action ? 6000 : 4000)
      if (ms) timers.current.set(t.id, setTimeout(() => dismiss(t.id), ms))
    },
    [dismiss]
  )

  const show = useCallback(
    (t) => {
      const id = ++seq.current
      const item = { type: 'success', ...t, id }
      setItems((list) => [...list.filter((x) => !x.leaving).slice(-2), item])
      arm(item)
      return id
    },
    [arm]
  )

  const update = useCallback(
    (id, patch) => {
      setItems((list) =>
        list.map((t) => {
          if (t.id !== id) return t
          const next = { ...t, ...patch }
          arm(next)
          return next
        })
      )
    },
    [arm]
  )

  const api = useRef(null)
  useLayoutEffect(() => {
    api.current = { show, update, dismiss }
  })
  const [stable] = useState(() => ({
    show: (t) => api.current.show(t),
    update: (id, p) => api.current.update(id, p),
    dismiss: (id) => api.current.dismiss(id),
  }))

  const node = (
    <section className="ov-toasts" aria-live="polite" aria-label="Thông báo">
      {items.map((t) => (
        <Toast key={t.id} t={t} onClose={() => dismiss(t.id)} />
      ))}
    </section>
  )
  return [stable, node]
}

function Toast({ t, onClose }) {
  const [shown, setShown] = useState(false)
  useLayoutEffect(() => {
    const r = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(r)
  }, [])
  return (
    <div className={`ov-toast ${shown && !t.leaving ? 'is-in' : ''}`} role={t.type === 'error' ? 'alert' : undefined}>
      <span className={`ov-toast__icon is-${t.type}`}>
        {t.type === 'error' ? <AlertIcon /> : t.type === 'loading' ? <Spinner /> : t.type === 'info' ? <InfoIcon /> : <CheckIcon />}
      </span>
      <div className="ov-toast__text">
        <p className={t.desc ? 'is-strong' : ''}>{t.title}</p>
        {t.desc && <p className="ov-toast__desc">{t.desc}</p>}
      </div>
      {(t.action || t.type === 'error') && (
        <div className="ov-toast__actions">
          {t.action && (
            <button
              type="button"
              className="ov-toast__btn"
              onClick={() => {
                t.action.onClick()
                onClose()
              }}
            >
              {t.action.label}
            </button>
          )}
          {t.type === 'error' && (
            <button type="button" className="ov-toast__close" onClick={onClose} aria-label="Đóng">
              <XIcon />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── icon (nét kiểu lucide) ─────────────────────────────── */
const svg = (children, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
)
export const TrashIcon = () =>
  svg(
    <>
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M10 11v6M14 11v6" />
    </>
  )
export const GlobeIcon = () =>
  svg(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  )
const InfoIcon = () =>
  svg(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  )
const CheckIcon = () =>
  svg(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </>
  )
const AlertIcon = () =>
  svg(
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4M12 16h.01" />
    </>
  )
const XIcon = () => svg(<path d="M18 6 6 18M6 6l12 12" />, 16)
const Spinner = () => <span className="ov-spinner" aria-hidden="true" />
