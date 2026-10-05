import { useEffect, useState } from 'react'

/**
 * Lớp chữ của màn mở đầu: "NÓN — Đang mở tạp chí..." đặt trên cảnh 3D.
 * Bấm/nhấn phím bất kỳ để bỏ qua.
 */
export default function LoadingIntro({ magazine, progress, leaving, onSkip }) {
  const [canSkip, setCanSkip] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setCanSkip(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={`intro ${leaving ? 'is-leaving' : ''}`} onClick={canSkip ? onSkip : undefined} role="status" aria-live="polite">
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
      <div className="intro__status">
        <span className="intro__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </span>
        <span>Đang mở tạp chí...</span>
      </div>
      {canSkip && !leaving && (
        <button
          type="button"
          className="intro__skip"
          onClick={(e) => {
            e.stopPropagation()
            onSkip()
          }}
        >
          Bỏ qua
        </button>
      )}
    </div>
  )
}
