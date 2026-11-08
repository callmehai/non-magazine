import { useState } from 'react'
import { useCanvasLang, plainText } from '../lang.js'
import Cta from './Cta.jsx'

/**
 * Ảnh khoá (anh Hải 08/11: "cái CTA … đang hơi mờ, và nên có hiệu ứng lock/khoá các kiểu vào trên cái ảnh bị ẩn đi cho
 * ngta dừng lại coi (cả CTA cũng cho vào cùng cái khoá luôn), cái khoá thì làm đẹp xíu cho hợp concept nhé").
 * Phủ kín ảnh phần thưởng của trò chơi ở trang bên (đặt el.tab = { set, i: 0 } → chơi xong, thẻ = 1, khối này mờ đi):
 *  - nền giấy ngà, mười sáu vòng tre đồng tâm nét mảnh toả từ ổ khoá, viền đường khâu nét đứt;
 *  - ổ khoá: quai là vòng nứa có đốt, thân là con dấu son (viền ngà) mang hình nón lá, lỗ khoá dưới vành nón;
 *  - dưới ổ khoá: dòng nhỏ "ẢNH ĐANG KHOÁ" + viên son mời chơi (Cta).
 * Khi mở khoá (thẻ chuyển 1): quai bật lên rồi cả khối mờ dần (canvas.css). Bấm vào ổ khoá: khoá lắc.
 * el.hint = [vi, ja] (lời mời trong viên son), el.label = [vi, ja] (dòng nhỏ trên viên)
 */
const LABEL = ['ẢNH ĐANG KHOÁ', '写真はロック中']

export default function LockWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const [shake, setShake] = useState(0)
  const W = el.w
  const H = el.h
  const pad = Math.min(112, H * 0.32)
  const block = pad * 1.2 + 64
  const cy = Math.max(pad * 0.7, (H - block) / 2 + pad * 0.62)
  const R = Math.hypot(W, H) * 0.62
  const pick = (p) => plainText((p && (p[li] ?? p[0])) || '')
  return (
    <div
      className={`cvw cvw-lock ${interactive ? 'is-live' : ''} ${lang === 'ja' ? 'is-ja' : ''}`}
      data-no-flip={interactive ? '' : undefined}
      onClick={interactive ? () => setShake((k) => k + 1) : undefined}
    >
      <svg className="cvw-lock__bg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true">
        <rect width={W} height={H} className="cvw-lock__paper" />
        {[...Array(16).keys()].map((i) => (
          <circle key={i} cx={W / 2} cy={cy} r={(R * (i + 1)) / 16} className={`cvw-lock__vong ${i === 15 ? 'is-rim' : ''}`} />
        ))}
        <rect x="9" y="9" width={W - 18} height={H - 18} rx="3" className="cvw-lock__khau" />
      </svg>
      <div className="cvw-lock__mid" style={{ top: `${cy - pad * 0.62}em` }}>
        <svg key={shake} className={`cvw-lock__pad ${shake ? 'is-shake' : ''}`} viewBox="0 0 100 120" style={{ width: `${pad}em`, height: `${pad * 1.2}em` }} role="img" aria-label={pick(el.label || LABEL)}>
          <g className="cvw-lock__shackle">
            <path d="M29 60 V38 a21 21 0 0 1 42 0 V60" className="cvw-lock__nua" />
            <path d="M29 60 V38 a21 21 0 0 1 42 0 V60" className="cvw-lock__nua-hi" />
            {/* đốt nứa */}
            {[
              [29, 46],
              [36, 22],
              [64, 22],
              [71, 46],
            ].map(([x, y], k) => (
              <circle key={k} cx={x} cy={y} r="2.1" className="cvw-lock__dot" />
            ))}
          </g>
          <rect x="12" y="54" width="76" height="62" rx="9" className="cvw-lock__body" />
          <rect x="17.5" y="59.5" width="65" height="51" rx="5.5" className="cvw-lock__frame" />
          {/* nón lá: thân, vành, núm chóp */}
          <path d="M50 67 L71 86.5 Q50 92 29 86.5 Z" className="cvw-lock__non" />
          {/* vòng nứa trên thân nón + vành cạp, cùng màu son của thân khoá */}
          <path d="M43.2 73.4 Q50 75 56.8 73.4" className="cvw-lock__vong-non" />
          <path d="M36.6 79.6 Q50 82.6 63.4 79.6" className="cvw-lock__vong-non" />
          <path d="M29 86.5 Q50 92 71 86.5" className="cvw-lock__rim" />
          <circle cx="50" cy="66.6" r="1.5" className="cvw-lock__non" />
          {/* lỗ khoá */}
          <circle cx="50" cy="99" r="3.4" className="cvw-lock__hole" />
          <path d="M48.3 100.5 L47.4 107 H52.6 L51.7 100.5 Z" className="cvw-lock__hole" />
        </svg>
        <span className="cvw-lock__label">{pick(el.label || LABEL)}</span>
        <Cta live={interactive}>{pick(el.hint)}</Cta>
      </div>
    </div>
  )
}
