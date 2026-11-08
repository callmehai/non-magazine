import { useState } from 'react'
import { useCanvasLang, plainText } from '../lang.js'

/**
 * Phong bì thư (Lời mở đầu, anh Hải 08/11: "nhiều cái tương tác hơn — mở hộp, mở phong bì, kéo thả, sắp xếp"):
 * bấm phong bì → nắp lật lên, lá thư trượt ra mang câu ca dao về làng Chuông; bấm lần nữa thì thư cất vào.
 * Đối với tấm bưu thiếp ở cuối sách: sách mở bằng một lá thư mời về làng, gấp lại bằng tấm thiếp gửi đi.
 * el.letter = [vi, ja] (xuống dòng bằng \n), el.sign = [vi, ja], el.to = [vi, ja], el.from = [vi, ja]
 */
const L = {
  vi: { open: 'Bấm để mở thư', close: 'Bấm để cất thư' },
  ja: { open: 'クリックして手紙を開く', close: 'クリックして手紙をしまう' },
}

export default function EnvelopeWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const [open, setOpen] = useState(false)
  const pick = (p) => plainText((p && (p[li] ?? p[0])) || '')
  const lines = pick(el.letter).split('\n')
  return (
    <div className={`cvw cvw-env ${open ? 'is-open' : ''} ${lang === 'ja' ? 'is-ja' : ''}`} data-no-flip={interactive ? '' : undefined}>
      <button
        type="button"
        className="cvw-env__hit"
        onClick={() => interactive && setOpen((v) => !v)}
        disabled={!interactive}
        aria-expanded={open}
        aria-label={open ? L[lang].close : L[lang].open}
      >
        <span className="cvw-env__back" aria-hidden="true" />
        <span className="cvw-env__letter">
          <span className="cvw-env__verse">
            {lines.map((s, i) => (
              <span key={i} className={i % 2 === 0 && lang === 'vi' ? 'is-luc' : ''}>
                {s}
              </span>
            ))}
          </span>
          <span className="cvw-env__sign">{pick(el.sign)}</span>
        </span>
        <span className="cvw-env__front" aria-hidden="true">
          <span className="cvw-env__to">{pick(el.to)}</span>
          <span className="cvw-env__from">{pick(el.from)}</span>
          <span className="cvw-env__stamp">
            <svg viewBox="0 0 60 70" aria-hidden="true">
              <path d="M8 44 Q30 41 52 44" fill="none" stroke="#b08a4e" strokeWidth="1.4" />
              <path d="M10 44 L30 22 L50 44" fill="#f4ead6" stroke="#b08a4e" strokeWidth="1.2" strokeLinejoin="round" />
              <circle cx="30" cy="21.5" r="1.6" fill="#b08a4e" />
              <path d="M17 37 L30 22 M43 37 L30 22 M23 41 L30 22 M37 41 L30 22" stroke="#b08a4e" strokeWidth="0.5" opacity="0.6" />
              <text x="30" y="60" textAnchor="middle">2026</text>
            </svg>
          </span>
        </span>
        <span className="cvw-env__flap" aria-hidden="true">
          <span className="cvw-env__seal">
            <span>
              {lang === 'ja' ? 'チュオン村' : 'NÓN LÁ'}
              <br />
              {lang === 'ja' ? 'ノンラー' : 'LÀNG CHUÔNG'}
            </span>
          </span>
        </span>
        <span className="cvw-env__hint">{open ? L[lang].close : L[lang].open}</span>
      </button>
    </div>
  )
}
