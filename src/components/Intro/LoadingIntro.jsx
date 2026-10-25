import { useEffect, useRef } from 'react'
import Icon from '../common/Icon.jsx'
import { t } from '../../lib/i18n.js'

/**
 * Màn mở đầu: chữ "NÓN" trên cảnh 3D chiếc nón tự đan.
 * Luôn chạy hết hiệu ứng; khi xong mới hiện nút "Mở tạp chí".
 */
export default function LoadingIntro({ magazine, progress, ready, bowing, leaving, onOpen }) {
  const btnRef = useRef(null)
  // tên dài (vd. "Nón lá Làng Chuông"): chữ nhỏ hơn, xuống dòng theo từ — không tách giữa từ
  const long = [...magazine.title].length > 8
  let start = 0
  const words = magazine.title.split(/\s+/).map((text) => {
    const w = { text, start }
    start += [...text].length
    return w
  })

  useEffect(() => {
    if (ready) btnRef.current?.focus({ preventScroll: true })
  }, [ready])

  return (
    <div className={`intro ${bowing ? 'is-bowing' : ''} ${leaving ? 'is-leaving' : ''} ${ready ? 'is-ready' : ''}`}>
      {/* key theo tên: đổi ngôn ngữ thì cả tên lẫn dòng phụ cùng chạy lại hiệu ứng hiện chữ */}
      <div className="intro__text" key={`${magazine.title}|${magazine.subtitle}`}>
        <p className="intro__kicker">{t('introKicker')}</p>
        <h1 className={`intro__title ${long ? 'is-long' : ''}`} aria-label={magazine.title}>
          {words.map((w, wi) => (
            <span key={wi} className="intro__word" aria-hidden="true">
              {[...w.text].map((ch, i) => (
                <span key={i} className="intro__char" style={{ '--i': w.start + i }}>
                  {ch}
                </span>
              ))}
            </span>
          ))}
        </h1>
        <p className="intro__subtitle">{magazine.subtitle}</p>
      </div>

      {/* câu ca dao về nón Chuông (moodboard Khánh Huyền) + ghi chú cảnh nền là minh họa */}
      <figure className="intro__cadao">
        <blockquote>{t('introCadao')}</blockquote>
        <figcaption>{t('introCadaoBy')}</figcaption>
      </figure>
      <p className="intro__scene">{t('introScene')}</p>

      <div className="intro__foot" role="status" aria-live="polite">
        {bowing || leaving ? (
          // nón ngả chào cổng đình: câu ca dao thay chỗ nút
          <figure className="intro__bow">
            <blockquote>{t('bowCadao')}</blockquote>
            <figcaption>{t('introCadaoBy')}</figcaption>
          </figure>
        ) : ready ? (
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
