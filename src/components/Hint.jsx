import Icon from './common/Icon.jsx'
import { t } from '../lib/i18n.js'

export default function Hint({ show, touch }) {
  return (
    <div className={`hint ${show ? 'is-shown' : ''}`} aria-hidden={!show} role="note">
      <Icon name="hand" size={18} />
      {touch ? t('hintTouch') : t('hintMouse')}
    </div>
  )
}
