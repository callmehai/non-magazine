import { useState } from 'react'
import Icon from '../common/Icon.jsx'
import ZoomControls from './ZoomControls.jsx'
import FullscreenButton from './FullscreenButton.jsx'
import { t } from '../../lib/i18n.js'

/** Thanh điều khiển tối giản ở cuối màn hình. */
export default function Controls({
  pageLabel,
  total,
  onGoTo,
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
        <span className="controls__page">
          <PageInput label={pageLabel} total={total} onGoTo={onGoTo} />
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

/** Ô số trang: bình thường hiện trang đang mở ("2–3"); bấm vào gõ số trang rồi Enter để nhảy tới, Esc để thôi */
function PageInput({ label, total, onGoTo }) {
  const [draft, setDraft] = useState(null) // null = không gõ, đang hiện số trang hiện tại
  const go = () => {
    const n = parseInt(draft, 10)
    if (n >= 1 && n <= total) onGoTo(n - 1)
    setDraft(null)
  }
  return (
    <input
      className="controls__input"
      type="text"
      inputMode="numeric"
      value={draft ?? label}
      placeholder={label}
      size={Math.max(3, String(draft ?? label).length)}
      aria-label={t('goToPage')}
      title={t('goToPage')}
      onFocus={(e) => {
        setDraft('')
        e.target.select()
      }}
      onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          go()
          e.currentTarget.blur()
        } else if (e.key === 'Escape') {
          setDraft(null)
          e.currentTarget.blur()
        }
      }}
      onBlur={() => setDraft(null)}
    />
  )
}
