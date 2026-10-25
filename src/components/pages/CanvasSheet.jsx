import { useState } from 'react'
import CanvasPage, { LoadMode, luminance } from '../../canvas/CanvasPage.jsx'
import { t } from '../../lib/i18n.js'
import '../../canvas/canvas.css'

/** Trang dựng từ editor (dữ liệu JSON) trong flipbook: nội dung + số trang + bóng gáy sách */
export default function CanvasSheet({ page, index, total, side, visible, load, variant }) {
  const isThumb = variant === 'thumb'
  // ảnh chỉ tải khi trang đã gần trang đang đọc (load); tải rồi thì giữ, lật lui không tải lại
  const [near, setNear] = useState(load)
  if (load && !near) setNear(true)
  const tone = luminance(page.data.bg) < 140 ? 'light' : 'dark'
  return (
    <article className={`canvas-sheet side-${side}`} aria-label={t('pageOf', { n: index + 1, total })}>
      <LoadMode.Provider value={isThumb ? 'lazy' : near ? 'eager' : 'off'}>
        <CanvasPage page={page.data} mode={isThumb ? 'edit' : 'read'} visible={visible} side={side === 'left' ? 'left' : 'right'} />
      </LoadMode.Provider>
      {page.folio && !isThumb && (
        <span className={`cv-folio is-${tone}`} aria-hidden="true">
          {String(page.folio).padStart(2, '0')}
        </span>
      )}
      {!page.hard && !isThumb && <div className="page__gutter" aria-hidden="true" />}
    </article>
  )
}
