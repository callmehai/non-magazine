import { useEffect, useMemo, useRef, useState } from 'react'
import { useCanvasLang, plainText } from '../lang.js'
import { ensureFont } from '../fonts.js'

/**
 * Phong bì thư gửi bạn đọc (trang đối diện mục lục). Anh Hải 08/11: "nhiều cái tương tác hơn — mở hộp, mở phong bì…",
 * rồi "thư xấu vãi … làm thô vl, dành nhiều effort vào" và "2 câu ca dao ??? ai cần đọc lắm vậy" → vẽ lại từng lớp,
 * trang chỉ còn một câu ca dao (trong lá thư).
 *
 * Mặt sau phong bì giấy kraft: túi (hai vạt bên + vạt dưới có đường khâu — chữ ký của sách), nắp có đường khâu, con dấu
 * sáp son dập hình nón kẹp hai lá tre khô. Bấm → dấu bật ra, nắp gập lên (lật 2D: co theo trục dọc rồi mở mặt trong —
 * mặt trong lót giấy in 16 vòng tre), phong bì hạ xuống, lá thư giấy dó trượt lên rồi đáp ra phía trước để đọc.
 * Bấm lần nữa: thư cất vào, nắp đóng, dấu gắn lại. Chế độ không tương tác (ảnh thu nhỏ, trang soát): phong bì đóng.
 * el.letter = [vi, ja] (xuống dòng bằng \n), el.sign = [vi, ja], el.to = [vi, ja], el.from = [vi, ja]
 */
const L = {
  vi: { open: 'Bấm để mở thư', close: 'Bấm để cất thư' },
  ja: { open: 'クリックして手紙を開く', close: 'クリックして手紙をしまう' },
}

// mép giấy dó xơ: răng nhỏ không đều dọc bốn cạnh (cố định theo seed — ảnh thu nhỏ lần nào cũng giống nhau)
function deckle(seed = 5, n = 34, amp = 1.6) {
  let s = seed
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280) * amp
  const pts = []
  for (let i = 0; i <= n; i++) pts.push(`${((i / n) * 100).toFixed(2)}% ${rnd().toFixed(2)}em`)
  for (let i = 1; i <= n * 0.7; i++) pts.push(`calc(100% - ${rnd().toFixed(2)}em) ${((i / (n * 0.7)) * 100).toFixed(2)}%`)
  for (let i = n - 1; i >= 0; i--) pts.push(`${((i / n) * 100).toFixed(2)}% calc(100% - ${rnd().toFixed(2)}em)`)
  for (let i = Math.floor(n * 0.7) - 1; i >= 1; i--) pts.push(`${rnd().toFixed(2)}em ${((i / (n * 0.7)) * 100).toFixed(2)}%`)
  return `polygon(${pts.join(', ')})`
}

// mép sáp loang: vòng tròn răng mềm không đều (đường cong qua trung điểm)
function waxPath(r, seed = 11, k = 13) {
  let s = seed
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280
  const p = [...Array(k).keys()].map((i) => {
    const a = (i / k) * Math.PI * 2
    const rr = r * (0.93 + rnd() * 0.1)
    return [rr * Math.cos(a), rr * Math.sin(a)]
  })
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  let d = `M${m(p[k - 1], p[0]).map((v) => v.toFixed(2)).join(' ')}`
  for (let i = 0; i < k; i++) {
    const q = m(p[i], p[(i + 1) % k])
    d += ` Q${p[i][0].toFixed(2)} ${p[i][1].toFixed(2)} ${q[0].toFixed(2)} ${q[1].toFixed(2)}`
  }
  return d + 'Z'
}

export default function EnvelopeWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const t = L[lang]
  const [st, setSt] = useState('closed') // closed | open | closing
  const timer = useRef(0)
  useEffect(() => {
    ensureFont('Dancing Script')
    ensureFont('Cormorant Garamond')
    return () => clearTimeout(timer.current)
  }, [])
  const pick = (p) => plainText((p && (p[li] ?? p[0])) || '')
  const lines = pick(el.letter).split('\n')

  // ── hình học (đơn vị em = pt của trang)
  const W = el.w
  const H = el.h
  const ew = Math.min(W * 0.9, 470)
  const k = ew / 392 // tỉ lệ chi tiết (dấu sáp, đường khâu) theo bề ngang phong bì
  const eh = Math.round(ew * 0.63)
  const cx = ew / 2
  const lw = ew * 0.84
  const lh = eh * 0.86
  const ltop = eh * 0.08
  const closedY = (H - eh) / 2 - 18
  const openY = H - eh - 52
  const up = -(ltop + lh + 8)
  // đáp xuống: đầu thư che mũi nắp đã mở, hai bên vẫn thấy nắp lót vòng tre
  const land = up + lh * 0.28
  const fh = eh * 0.66 // nắp: sâu 2/3 thân
  const ids = useMemo(() => `env${Math.random().toString(36).slice(2, 7)}`, [])
  const clip = useMemo(() => deckle(), [])
  const wax = useMemo(() => waxPath(23), [])

  const flapD = (y0, dir) => {
    // nắp tam giác đầu bo tròn: dir = 1 (đóng, chĩa xuống) | -1 (mở, chĩa lên)
    const tip = y0 + dir * fh
    const sh = y0 + dir * (fh - 9)
    return `M0 ${y0} L${ew} ${y0} L${cx + 20} ${sh} Q${cx} ${tip + dir * 2} ${cx - 20} ${sh} Z`
  }
  const toggle = () => {
    if (!interactive) return
    clearTimeout(timer.current)
    if (st === 'open') {
      setSt('closing')
      timer.current = setTimeout(() => setSt('closed'), 2000)
    } else setSt('open')
  }
  const open = st === 'open'
  return (
    <div
      className={`cvw cvw-env ${open ? 'is-open' : ''} ${st === 'closing' ? 'is-closing' : ''} ${lang === 'ja' ? 'is-ja' : ''}`}
      data-no-flip={interactive ? '' : undefined}
      style={{ '--k': k, '--drop': `${openY - closedY}em`, '--up': `${up}em`, '--land': `${land}em` }}
    >
      <button type="button" className="cvw-env__hit" onClick={toggle} disabled={!interactive} aria-expanded={open} aria-label={open ? t.close : t.open}>
        <span className="cvw-env__env" style={{ left: `${(W - ew) / 2}em`, top: `${closedY}em`, width: `${ew}em`, height: `${eh}em` }}>
          <span className="cvw-env__lift">
            {/* nắp đã mở: mặt trong lót giấy in vòng tre, nằm sau lá thư */}
            <span className="cvw-env__flapin" style={{ top: `${-fh - 2}em`, height: `${fh + 2}em` }} aria-hidden="true">
              <svg viewBox={`0 ${-fh - 2} ${ew} ${fh + 2}`}>
                <defs>
                  <clipPath id={`${ids}-fi`}>
                    <path d={flapD(0, -1)} />
                  </clipPath>
                  <linearGradient id={`${ids}-gi`} x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0" stopColor="#e6d3ab" />
                    <stop offset="1" stopColor="#f1e4c7" />
                  </linearGradient>
                </defs>
                <path d={flapD(0, -1)} fill={`url(#${ids}-gi)`} />
                <g clipPath={`url(#${ids}-fi)`} fill="none" stroke="#b08a4e" strokeWidth="0.6" opacity="0.45">
                  {[...Array(16).keys()].map((k) => (
                    <ellipse key={k} cx={cx} cy={0} rx={(k + 1) * (ew / 30)} ry={(k + 1) * (fh / 15)} />
                  ))}
                </g>
                <path d={flapD(0, -1)} fill="none" stroke="#b8975f" strokeWidth="0.8" />
              </svg>
            </span>
            {/* lòng phong bì */}
            <span className="cvw-env__back" aria-hidden="true">
              <svg viewBox={`0 0 ${ew} ${eh}`}>
                <defs>
                  <linearGradient id={`${ids}-gb`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#b8945c" />
                    <stop offset="0.45" stopColor="#ccab76" />
                    <stop offset="1" stopColor="#d6b884" />
                  </linearGradient>
                </defs>
                <rect width={ew} height={eh} rx="4" fill={`url(#${ids}-gb)`} />
              </svg>
            </span>
            {/* lá thư giấy dó */}
            <span className="cvw-env__sheet" style={{ left: `${(ew - lw) / 2}em`, top: `${ltop}em`, width: `${lw}em`, height: `${lh}em` }}>
              <span className="cvw-env__paper" style={{ clipPath: clip }}>
                <svg className="cvw-env__mark" viewBox="0 0 60 26" aria-hidden="true">
                  <path d="M6 22 Q30 19 54 22" fill="none" stroke="#a88a5c" strokeWidth="1" />
                  <path d="M9 21 L30 5 L51 21" fill="none" stroke="#a88a5c" strokeWidth="0.9" strokeLinejoin="round" />
                  <circle cx="30" cy="4.6" r="1.4" fill="#a88a5c" />
                </svg>
                <span className="cvw-env__verse">
                  {lines.map((s, i) => (
                    <span key={i} className={i % 2 === 0 && lang === 'vi' ? 'is-luc' : ''}>
                      {s}
                    </span>
                  ))}
                </span>
                <span className="cvw-env__foot">
                  <span className="cvw-env__sign">{pick(el.sign)}</span>
                  <span className="cvw-env__chop" aria-hidden="true">
                    <span>
                      {(lang === 'ja' ? ['チュオン村', 'の', 'ノンラー'] : ['NÓN LÁ', 'LÀNG', 'CHUÔNG']).map((w, i) => (
                        <span key={i}>{w}</span>
                      ))}
                    </span>
                  </span>
                </span>
              </span>
            </span>
            {/* túi phong bì: hai vạt bên + vạt dưới (đè lên lá thư khi thư còn trong phong bì) */}
            <span className="cvw-env__pocket" aria-hidden="true">
              <svg viewBox={`0 0 ${ew} ${eh}`}>
                <defs>
                  <linearGradient id={`${ids}-gs`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#dcc093" />
                    <stop offset="0.5" stopColor="#e4cc9f" />
                    <stop offset="1" stopColor="#d8bb8b" />
                  </linearGradient>
                  <linearGradient id={`${ids}-gd`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#ead6ae" />
                    <stop offset="1" stopColor="#dfc496" />
                  </linearGradient>
                  <filter id={`${ids}-fib`} x="0" y="0" width="100%" height="100%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.9 0.25" numOctaves="2" seed="4" />
                    <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.3  0 0 0 0 0.12  0 0 0 0.9 -0.42" />
                  </filter>
                  <clipPath id={`${ids}-pk`}>
                    <path d={`M0 4 Q0 0 3 0.6 L${cx - 16} ${eh * 0.5} Q${cx} ${eh * 0.58} ${cx + 16} ${eh * 0.5} L${ew - 3} 0.6 Q${ew} 0 ${ew} 4 L${ew} ${eh - 4} Q${ew} ${eh} ${ew - 4} ${eh} L4 ${eh} Q0 ${eh} 0 ${eh - 4} Z`} />
                  </clipPath>
                </defs>
                <g clipPath={`url(#${ids}-pk)`}>
                  <rect width={ew} height={eh} fill={`url(#${ids}-gs)`} />
                  {/* vạt dưới: bóng mép rồi mặt vạt */}
                  <path d={`M-2 ${eh + 2} L${cx - 22} ${eh * 0.47 + 2.5} Q${cx} ${eh * 0.38 + 2.5} ${cx + 22} ${eh * 0.47 + 2.5} L${ew + 2} ${eh + 2} Z`} fill="rgba(90,60,25,0.16)" />
                  <path d={`M-2 ${eh + 2} L${cx - 22} ${eh * 0.47} Q${cx} ${eh * 0.38} ${cx + 22} ${eh * 0.47} L${ew + 2} ${eh + 2} Z`} fill={`url(#${ids}-gd)`} />
                  <path
                    d={`M14 ${eh} L${cx - 20} ${eh * 0.47 + 9} Q${cx} ${eh * 0.39 + 9} ${cx + 20} ${eh * 0.47 + 9} L${ew - 14} ${eh}`}
                    fill="none"
                    stroke="#9c7a45"
                    strokeWidth="0.8"
                    strokeDasharray="3.2 2.6"
                    opacity="0.6"
                  />
                  <rect width={ew} height={eh} filter={`url(#${ids}-fib)`} opacity="0.5" />
                </g>
              </svg>
              <span className="cvw-env__to">{pick(el.to)}</span>
              <span className="cvw-env__from">{pick(el.from)}</span>
            </span>
            {/* nắp đóng: mặt ngoài, đường khâu chạy dọc ba mép */}
            <span className="cvw-env__flap" style={{ height: `${fh + 4}em` }} aria-hidden="true">
              <svg viewBox={`0 0 ${ew} ${fh + 4}`}>
                <defs>
                  <linearGradient id={`${ids}-gf`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#e2c99b" />
                    <stop offset="1" stopColor="#ecdab5" />
                  </linearGradient>
                </defs>
                <path d={flapD(0, 1)} transform="translate(0 2.6)" fill="rgba(80,50,20,0.1)" />
                <path d={flapD(0, 1)} transform="translate(0 1.2)" fill="rgba(80,50,20,0.14)" />
                <path d={flapD(0, 1)} fill={`url(#${ids}-gf)`} />
                <path d={flapD(0, 1)} transform={`translate(${cx} ${fh * 0.3}) scale(0.86) translate(${-cx} ${-fh * 0.3})`} fill="none" stroke="#9c7a45" strokeWidth="0.93" strokeDasharray="3.7 3" opacity="0.6" />
              </svg>
            </span>
            {/* con dấu sáp kẹp lá tre khô */}
            <span className="cvw-env__seal" style={{ left: `${cx}em`, top: `${fh - 8 * k}em`, width: `${80 * k}em`, height: `${80 * k}em` }} aria-hidden="true">
              <svg viewBox="-34 -34 68 68">
                <defs>
                  <radialGradient id={`${ids}-gw`} cx="0.38" cy="0.32" r="0.75">
                    <stop offset="0" stopColor="#cf5b45" />
                    <stop offset="0.55" stopColor="#a8382b" />
                    <stop offset="1" stopColor="#7e2219" />
                  </radialGradient>
                </defs>
                <path d="M-6 -4 C -14 -12, -24 -18, -33 -19 C -26 -12, -16 -6, -6 -1 Z" fill="#c3cc9c" stroke="#7d8a55" strokeWidth="0.6" />
                <path d="M-8 -6 L -31 -18.5" stroke="#7d8a55" strokeWidth="0.4" opacity="0.7" />
                <path d="M5 4 C 14 9, 22 16, 28 25 C 19 21, 11 14, 4 8 Z" fill="#b5c08c" stroke="#7d8a55" strokeWidth="0.6" />
                <path d="M3 4 L 31 12" stroke="#a7b07d" strokeWidth="1.1" strokeLinecap="round" />
                <path d={wax} transform="translate(0.8 1.6)" fill="rgba(70,20,10,0.25)" />
                <path d={wax} fill={`url(#${ids}-gw)`} />
                <circle r="16.5" fill="none" stroke="#7a2118" strokeWidth="1.6" opacity="0.55" />
                <circle r="16.5" fill="none" stroke="#e98c73" strokeWidth="0.5" opacity="0.45" transform="translate(-0.5 -0.6)" />
                <g fill="none" stroke="#f3d6c4" strokeWidth="1.05" strokeLinejoin="round" strokeLinecap="round" opacity="0.88">
                  <path d="M-10 0.5 Q0 -1.6 10 0.5" />
                  <path d="M-8.4 -0.2 L0 -9.5 L8.4 -0.2" />
                  <path d="M-4.4 -4.8 Q0 -5.5 4.4 -4.8" strokeWidth="0.6" opacity="0.7" />
                </g>
                <circle cy="-9.8" r="0.9" fill="#f3d6c4" opacity="0.88" />
                <ellipse cx="-7" cy="-11" rx="5" ry="2.2" fill="#fff" opacity="0.16" transform="rotate(-30 -7 -11)" />
              </svg>
            </span>
          </span>
          <span className="cvw-env__hint" style={{ top: `${eh + 18}em` }}>
            <span>{open ? t.close : t.open}</span>
          </span>
        </span>
      </button>
    </div>
  )
}
