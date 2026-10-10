import Icon from '../common/Icon.jsx'
import { t } from '../../lib/i18n.js'

export default function FullscreenButton({ isFullscreen, onToggle, supported }) {
  if (!supported) return null
  return (
    <button
      type="button"
      className="ctrl"
      onClick={onToggle}
      aria-label={isFullscreen ? t('exitFullscreen') : t('fullscreen')}
      aria-pressed={isFullscreen}
      title={isFullscreen ? `${t('exitFullscreen')} (Esc)` : `${t('fullscreen')} (F)`}
    >
      <Icon name={isFullscreen ? 'exitFullscreen' : 'fullscreen'} />
    </button>
  )
}
