import Icon from '../common/Icon.jsx'
import ZoomControls from './ZoomControls.jsx'
import FullscreenButton from './FullscreenButton.jsx'
import { t } from '../../lib/i18n.js'

/** Thanh điều khiển tối giản ở cuối màn hình. */
export default function Controls({
  pageLabel,
  total,
  progress,
  canPrev,
  canNext,
  onPrev,
  onNext,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  fullscreen,
  soundOn,
  onToggleSound,
  panelOpen,
  onTogglePanel,
  hidden,
  rtl,
}) {
  // sách lật kiểu Nhật: nút bên trái là "trang sau"
  const back = { onClick: onPrev, disabled: !canPrev, label: t('prevPage') }
  const fwd = { onClick: onNext, disabled: !canNext, label: t('nextPage') }
  const [left, right] = rtl ? [fwd, back] : [back, fwd]
  return (
    <nav className={`controls ${hidden ? 'is-hidden' : ''}`} aria-label={t('controls')}>
      <div className={`controls__progress ${rtl ? 'is-rtl' : ''}`} aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="controls__row">
        <button type="button" className="ctrl" onClick={left.onClick} disabled={left.disabled} aria-label={left.label} title={`${left.label} (←)`}>
          <Icon name="prev" />
        </button>
        <span className="controls__page" aria-live="polite" aria-atomic="true">
          <span className="sr-only">{t('page')}</span>
          {pageLabel}
          <span className="controls__total"> / {total}</span>
        </span>
        <button type="button" className="ctrl" onClick={right.onClick} disabled={right.disabled} aria-label={right.label} title={`${right.label} (→)`}>
          <Icon name="next" />
        </button>

        <span className="controls__sep" aria-hidden="true" />
        <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onZoomReset} />
        <span className="controls__sep" aria-hidden="true" />

        <button
          type="button"
          className={`ctrl ${panelOpen ? 'is-on' : ''}`}
          onClick={onTogglePanel}
          aria-label={t('tocAndThumbs')}
          aria-expanded={panelOpen}
          aria-controls="thumb-panel"
          title={`${t('toc')} (T)`}
        >
          <Icon name="grid" />
        </button>
        <button
          type="button"
          className="ctrl"
          onClick={onToggleSound}
          aria-label={soundOn ? t('soundOff') : t('soundOn')}
          aria-pressed={soundOn}
          title={soundOn ? t('soundOff') : t('soundOn')}
        >
          <Icon name={soundOn ? 'soundOn' : 'soundOff'} />
        </button>
        <FullscreenButton isFullscreen={fullscreen.isFullscreen} onToggle={fullscreen.toggle} supported={fullscreen.supported} />
      </div>
    </nav>
  )
}
