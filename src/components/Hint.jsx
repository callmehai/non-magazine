import Icon from './common/Icon.jsx'
import { t } from '../lib/i18n.js'

/** side = bề rộng một trang (px): sách đang mở bìa ở giữa màn rộng → dòng nhắc nằm cạnh trái bìa, không đè mép dưới bìa */
export default function Hint({ show, touch, side = 0 }) {
  return (
    <div className={`hint ${show ? 'is-shown' : ''} ${side ? 'is-side' : ''}`} style={side ? { '--pw': `${side}px` } : undefined} aria-hidden={!show} role="note">
      <Icon name="hand" size={18} />
      {touch ? t('hintTouch') : t('hintMouse')}
    </div>
  )
}
