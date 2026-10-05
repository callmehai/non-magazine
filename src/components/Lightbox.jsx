import { useCallback, useEffect, useMemo, useRef } from 'react'
import Icon from './common/Icon.jsx'
import { asset } from '../lib/assets.js'

/** Xem ảnh gallery cỡ lớn. ← → để chuyển ảnh, Esc để đóng. */
export default function Lightbox({ state, onChange, onClose }) {
  const closeRef = useRef(null)
  const open = !!state
  const images = useMemo(() => state?.images || [], [state])
  const index = state?.index || 0
  const img = images[index]

  const go = useCallback(
    (d) => onChange({ images, index: (index + d + images.length) % images.length }),
    [images, index, onChange]
  )

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else return
      e.preventDefault()
      e.stopImmediatePropagation()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      prevFocus?.focus?.({ preventScroll: true })
    }
  }, [open, go, onClose])

  if (!open || !img) return null
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={img.caption || img.alt || 'Ảnh'} onClick={onClose}>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={asset(img.src)} alt={img.alt || img.caption || ''} />
        {img.caption && <figcaption>{img.caption}</figcaption>}
      </figure>
      <button ref={closeRef} type="button" className="ctrl lightbox__close" onClick={onClose} aria-label="Đóng ảnh">
        <Icon name="close" />
      </button>
      {images.length > 1 && (
        <>
          <button type="button" className="ctrl lightbox__nav is-prev" onClick={(e) => (e.stopPropagation(), go(-1))} aria-label="Ảnh trước">
            <Icon name="prev" />
          </button>
          <button type="button" className="ctrl lightbox__nav is-next" onClick={(e) => (e.stopPropagation(), go(1))} aria-label="Ảnh sau">
            <Icon name="next" />
          </button>
        </>
      )}
    </div>
  )
}
