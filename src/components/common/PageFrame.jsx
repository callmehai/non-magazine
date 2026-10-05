import { asset } from '../../lib/assets.js'

/**
 * Khung chung của một trang: nền giấy, bóng gáy sách, header chạy và số trang.
 */
export default function PageFrame({ page, index, total, side, runningHead, className = '', children }) {
  const theme = (page.theme || (page.type === 'cover' ? 'dark' : 'light')) === 'dark' ? 'dark' : 'light'
  const style = {}
  if (page.backgroundColor) style.backgroundColor = page.backgroundColor
  if (page.background) style.backgroundImage = `url("${asset(page.background)}")`
  const showChrome = page.chrome !== false && page.type !== 'cover'

  return (
    <article
      className={`page page--${page.type} theme-${theme} side-${side} ${page.background ? 'has-bg' : ''} ${className}`}
      style={style}
      aria-label={`Trang ${index + 1} trên ${total}${page.title ? ': ' + page.title : ''}`}
    >
      <div className="page__grain" aria-hidden="true" />
      {showChrome && (
        <header className="page__head" aria-hidden="true">
          <span>{runningHead}</span>
        </header>
      )}
      <div className="page__body">{children}</div>
      {showChrome && (
        <footer className="page__folio" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </footer>
      )}
      <div className="page__gutter" aria-hidden="true" />
    </article>
  )
}
