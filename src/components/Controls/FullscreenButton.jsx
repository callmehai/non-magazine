import Icon from '../common/Icon.jsx'

export default function FullscreenButton({ isFullscreen, onToggle, supported }) {
  if (!supported) return null
  return (
    <button
      type="button"
      className="ctrl"
      onClick={onToggle}
      aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
      aria-pressed={isFullscreen}
      title={isFullscreen ? 'Thoát toàn màn hình (Esc)' : 'Toàn màn hình (F)'}
    >
      <Icon name={isFullscreen ? 'exitFullscreen' : 'fullscreen'} />
    </button>
  )
}
