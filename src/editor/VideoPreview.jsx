import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { asset } from '../lib/assets.js'

/**
 * Xem video ngay trong editor (nhấp đúp vào video hoặc nút "Xem video").
 * Dừng ở cảnh đẹp rồi bấm "Dùng khung hình này làm ảnh bìa".
 */
export default function VideoPreview({ open, el, readOnly, onSetPoster, onClose, onGone }) {
  const [shown, setShown] = useState(false)
  const [busy, setBusy] = useState(false)
  const videoRef = useRef(null)
  const closeRef = useRef(null)

  useLayoutEffect(() => {
    if (!open) return
    const r = requestAnimationFrame(() => setShown(true))
    closeRef.current?.focus()
    return () => cancelAnimationFrame(r)
  }, [open])
  useEffect(() => {
    if (open) return
    setShown(false)
    videoRef.current?.pause()
    const t = setTimeout(onGone, 120)
    return () => clearTimeout(t)
  }, [open, onGone])

  useEffect(() => {
    const key = (e) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    window.addEventListener('keydown', key, true)
    return () => window.removeEventListener('keydown', key, true)
  }, [onClose])

  const usePoster = async () => {
    setBusy(true)
    try {
      await onSetPoster(videoRef.current)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`ov-layer ${shown ? 'is-open' : ''}`}>
      <div className="ov-scrim" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="vp-title" className="ov-dialog vp-dialog">
        <h2 id="vp-title" className="ov-dialog__title">
          Xem video
        </h2>
        <video
          ref={videoRef}
          className="vp-video"
          src={asset(el.src)}
          poster={el.poster ? asset(el.poster) : undefined}
          crossOrigin="anonymous"
          controls
          autoPlay
          playsInline
        />
        <div className="vp-foot">
          <p className="vp-hint">{readOnly ? 'Người khác đang sửa trang này nên bạn chỉ xem được.' : 'Muốn đổi ảnh bìa: dừng video ở cảnh đẹp rồi bấm nút bên phải.'}</p>
          <div className="ov-dialog__actions vp-actions">
            {!readOnly && (
              <button type="button" className="ov-btn ov-btn--secondary" onClick={usePoster} disabled={busy}>
                {busy ? 'Đang lưu ảnh bìa…' : 'Dùng khung hình này làm ảnh bìa'}
              </button>
            )}
            <button ref={closeRef} type="button" className="ov-btn ov-btn--primary" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
