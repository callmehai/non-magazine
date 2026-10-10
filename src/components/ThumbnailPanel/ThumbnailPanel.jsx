import { useEffect, useRef } from 'react'
import FlipBookPage from '../FlipBook/FlipBookPage.jsx'
import Icon from '../common/Icon.jsx'
import { t } from '../../lib/i18n.js'

/**
 * Mục lục + hình thu nhỏ. Desktop: ngăn kéo bên trái. Mobile: bottom sheet.
 * Hình thu nhỏ là chính các trang thật, thu nhỏ bằng cỡ chữ (mọi kích thước trong trang tính bằng em).
 */
export default function ThumbnailPanel({ open, magazine, visible, onSelect, onClose, rtl }) {
  const listRef = useRef(null)
  const { pages } = magazine

  useEffect(() => {
    if (!open) return
    const active = listRef.current?.querySelector('[aria-current="true"]') || listRef.current?.querySelector('button')
    active?.focus({ preventScroll: true })
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [open])

  return (
    <>
      <div className={`panel-scrim ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside id="thumb-panel" className={`thumbs ${open ? 'is-open' : ''}`} aria-label={t('toc')} aria-hidden={!open} inert={!open}>
        <div className="thumbs__head">
          <div>
            <p className="thumbs__eyebrow">{t('toc')}</p>
            <p className="thumbs__title">
              {magazine.title} <em>{magazine.subtitle}</em>
            </p>
          </div>
          <button type="button" className="ctrl" onClick={onClose} aria-label={t('closeToc')}>
            <Icon name="close" />
          </button>
        </div>
        {/* sách kiểu Nhật: hình thu nhỏ xếp từ phải sang trái */}
        <ol className="thumbs__grid" ref={listRef} dir={rtl ? 'rtl' : undefined}>
          {pages.map((page, i) => {
            const isCurrent = visible.includes(i)
            return (
              <li key={page.id ?? i} className={`thumb ${isCurrent ? 'is-current' : ''}`}>
                <div className="thumb__preview" inert aria-hidden="true">
                  {open && <FlipBookPage page={page} index={i} total={pages.length} side="single" variant="thumb" visible={false} load runningHead={magazine.runningHead} />}
                </div>
                <button type="button" className="thumb__hit" onClick={() => onSelect(i)} aria-current={isCurrent ? 'true' : undefined}>
                  <span className="thumb__no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="thumb__label">{labelOf(page, i)}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </aside>
    </>
  )
}

function labelOf(page, i) {
  if (page.thumbnailLabel) return page.thumbnailLabel
  if (page.type === 'cover') return page.variant === 'back' ? t('backCover') : t('cover')
  if (page.title) return page.title
  if (page.type === 'custom-html') {
    const m = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/i.exec(page.html || '')
    if (m) return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }
  return t('pageN', { n: i + 1 })
}
