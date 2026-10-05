import Icon from '../common/Icon.jsx'
import ZoomControls from './ZoomControls.jsx'
import FullscreenButton from './FullscreenButton.jsx'

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
}) {
  return (
    <nav className={`controls ${hidden ? 'is-hidden' : ''}`} aria-label="Điều khiển tạp chí">
      <div className="controls__progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
      <div className="controls__row">
        <button type="button" className="ctrl" onClick={onPrev} disabled={!canPrev} aria-label="Trang trước" title="Trang trước (←)">
          <Icon name="prev" />
        </button>
        <span className="controls__page" aria-live="polite" aria-atomic="true">
          <span className="sr-only">Trang </span>
          {pageLabel}
          <span className="controls__total"> / {total}</span>
        </span>
        <button type="button" className="ctrl" onClick={onNext} disabled={!canNext} aria-label="Trang sau" title="Trang sau (→)">
          <Icon name="next" />
        </button>

        <span className="controls__sep" aria-hidden="true" />
        <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onZoomReset} />
        <span className="controls__sep" aria-hidden="true" />

        <button
          type="button"
          className={`ctrl ${panelOpen ? 'is-on' : ''}`}
          onClick={onTogglePanel}
          aria-label="Mục lục và hình thu nhỏ"
          aria-expanded={panelOpen}
          aria-controls="thumb-panel"
          title="Mục lục (T)"
        >
          <Icon name="grid" />
        </button>
        <button
          type="button"
          className="ctrl"
          onClick={onToggleSound}
          aria-label={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
          aria-pressed={soundOn}
          title={soundOn ? 'Tắt âm thanh' : 'Bật âm thanh'}
        >
          <Icon name={soundOn ? 'soundOn' : 'soundOff'} />
        </button>
        <FullscreenButton isFullscreen={fullscreen.isFullscreen} onToggle={fullscreen.toggle} supported={fullscreen.supported} />
      </div>
    </nav>
  )
}
