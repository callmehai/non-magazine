import { useEffect, useRef, useState } from 'react'
import Icon from '../common/Icon.jsx'
import { t } from '../../lib/i18n.js'

export const ZOOM_LEVELS = [0.8, 1, 1.25, 1.5, 2]

/** Zoom: nút −/+, mức hiện tại, về 100%. Trên mobile gom vào một popover. */
export default function ZoomControls({ zoom, onZoomIn, onZoomOut, onReset }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const pct = Math.round(zoom * 100) + '%'
  const min = zoom <= ZOOM_LEVELS[0]
  const max = zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    window.addEventListener('pointerdown', close)
    return () => window.removeEventListener('pointerdown', close)
  }, [open])

  const group = (
    <>
      <button type="button" className="ctrl" onClick={onZoomOut} disabled={min} aria-label={t('zoomOut')} title={`${t('zoomOut')} (−)`}>
        <Icon name="zoomOut" />
      </button>
      <button type="button" className="ctrl ctrl--text" onClick={onReset} aria-label={t('zoomLevel', { pct })} title={`${t('zoomTo100')} (0)`}>
        {pct}
      </button>
      <button type="button" className="ctrl" onClick={onZoomIn} disabled={max} aria-label={t('zoomIn')} title={`${t('zoomIn')} (+)`}>
        <Icon name="zoomIn" />
      </button>
      <button type="button" className="ctrl" onClick={onReset} disabled={zoom === 1} aria-label={t('zoomReset')} title={t('zoomReset')}>
        <Icon name="reset" />
      </button>
    </>
  )

  return (
    <div className="zoom" ref={ref}>
      <div className="zoom__full" role="group" aria-label={t('zoom')}>
        {group}
      </div>
      <div className="zoom__compact">
        <button
          type="button"
          className={`ctrl ${zoom !== 1 ? 'is-on' : ''}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={`${t('zoom')} (${pct})`}
        >
          <Icon name="search" />
        </button>
        {open && (
          <div className="zoom__pop" role="group" aria-label={t('zoom')}>
            {group}
          </div>
        )}
      </div>
    </div>
  )
}
