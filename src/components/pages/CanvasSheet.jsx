import CanvasPage, { luminance } from '../../canvas/CanvasPage.jsx'
import { t } from '../../lib/i18n.js'
import '../../canvas/canvas.css'

/** Trang dựng từ editor (dữ liệu JSON) trong flipbook: nội dung + số trang + bóng gáy sách */
export default function CanvasSheet({ page, index, total, side, visible, variant }) {
  const isThumb = variant === 'thumb'
  const tone = luminance(page.data.bg) < 140 ? 'light' : 'dark'
  return (
    <article className={`canvas-sheet side-${side}`} aria-label={t('pageOf', { n: index + 1, total })}>
      <CanvasPage page={page.data} mode={isThumb ? 'edit' : 'read'} visible={visible} />
      {page.folio && !isThumb && (
        <span className={`cv-folio is-${tone}`} aria-hidden="true">
          {String(page.folio).padStart(2, '0')}
        </span>
      )}
      {!page.hard && !isThumb && <div className="page__gutter" aria-hidden="true" />}
    </article>
  )
}
