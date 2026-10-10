import { useEffect, useRef } from 'react'
import Icon from '../common/Icon.jsx'
import { t } from '../../lib/i18n.js'

/**
 * Màn mở đầu: chữ "NÓN" trên cảnh 3D chiếc nón tự đan.
 * Luôn chạy hết hiệu ứng; khi xong mới hiện nút "Mở tạp chí".
 */
export default function LoadingIntro({ magazine, progress, ready, leaving, onOpen }) {
  const btnRef = useRef(null)

  useEffect(() => {
    if (ready) btnRef.current?.focus({ preventScroll: true })
  }, [ready])

  return (
    <div className={`intro ${leaving ? 'is-leaving' : ''} ${ready ? 'is-ready' : ''}`}>
      <div className="intro__text">
        <h1 className="intro__title" aria-label={magazine.title}>
          {[...magazine.title].map((ch, i) => (
            <span key={i} style={{ '--i': i }} aria-hidden="true">
              {ch}
            </span>
          ))}
        </h1>
        <p className="intro__subtitle">{magazine.subtitle}</p>
      </div>

      <div className="intro__foot" role="status" aria-live="polite">
        {ready ? (
          <>
            <button ref={btnRef} type="button" className="intro__open" onClick={onOpen} disabled={leaving}>
              <span>{t('openBook')}</span>
              <Icon name="next" size={18} />
            </button>
            <p className="intro__drag" aria-hidden="true">
              <Icon name="rotate" size={14} /> {t('introDrag')}
            </p>
          </>
        ) : (
          <div className="intro__status">
            <span className="intro__bar" aria-hidden="true">
              <span style={{ transform: `scaleX(${progress})` }} />
            </span>
            <span>{t('introLoading')}</span>
          </div>
        )}
      </div>
    </div>
  )
}
