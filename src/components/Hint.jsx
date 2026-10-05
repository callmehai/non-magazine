import Icon from './common/Icon.jsx'

export default function Hint({ show, touch }) {
  return (
    <div className={`hint ${show ? 'is-shown' : ''}`} aria-hidden={!show} role="note">
      <Icon name="hand" size={18} />
      {touch ? 'Chạm hoặc vuốt để lật trang' : 'Click hoặc kéo để lật trang'}
    </div>
  )
}
