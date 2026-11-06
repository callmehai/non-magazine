import { useState } from 'react'
import { useCanvasLang, parseRuby } from '../lang.js'
import { asset } from '../../lib/assets.js'

/**
 * Dòng thời gian bấm được (trang nghệ nhân chương 3): thanh ngang có các mốc năm; bấm một mốc → vạch màu chạy tới mốc đó,
 * thẻ bên dưới hiện câu chuyện của người ấy (năm · vai trò · tên · tiểu sử). Nút ‹ › để đi lần lượt.
 * Dùng thay ảnh cho những nghệ nhân đã mất (góp ý của nhóm: không đưa ảnh người đã mất vào sách).
 * el.items = [{ year: [vi, ja], name: [vi, ja], role: [vi, ja], bio: [vi, ja] }], el.accent = màu chương.
 */
const L = {
  vi: { hint: 'Bấm vào từng mốc năm để đọc', prev: 'Mốc trước', next: 'Mốc sau' },
  ja: { hint: '年をクリックすると物語が読めます', prev: '前へ', next: '次へ' },
}

function Ruby({ text }) {
  return parseRuby(String(text ?? '')).map((p, i) =>
    typeof p === 'string' ? (
      <span key={i}>{p}</span>
    ) : (
      <ruby key={i}>
        {p.base}
        <rt>{p.ruby}</rt>
      </ruby>
    )
  )
}

export default function TimelineWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const t = L[lang]
  const items = el.items || []
  const [i, setI] = useState(0)
  if (!items.length) return null
  const n = items.length
  const at = (k) => (n === 1 ? 50 : 8 + (84 * k) / (n - 1))
  const go = (k) => interactive && setI(Math.max(0, Math.min(n - 1, k)))
  const it = items[i]
  return (
    <div className={`cvw cvw-tl${lang === 'ja' ? ' is-ja' : ''}`} style={{ '--acc': el.accent || '#3f7676' }}>
      <div className="cvw-tl__hint">{t.hint}</div>
      <div className="cvw-tl__track">
        <div className="cvw-tl__line" />
        <div className="cvw-tl__fill" style={{ width: `${at(i)}%` }} />
        {items.map((x, k) => (
          <button
            key={k}
            type="button"
            className={`cvw-tl__node${k === i ? ' is-on' : ''}${k < i ? ' is-past' : ''}`}
            style={{ left: `${at(k)}%` }}
            onClick={() => go(k)}
            tabIndex={interactive ? 0 : -1}
            aria-pressed={k === i}
          >
            <span className="cvw-tl__year">{x.year[li] ?? x.year[0]}</span>
            <span className="cvw-tl__dot" />
            <span className="cvw-tl__who">
              <Ruby text={x.short?.[li] ?? x.name[li]} />
            </span>
          </button>
        ))}
      </div>
      <div className="cvw-tl__card" key={i}>
        <img className="cvw-tl__art" src={asset('assets/book/deco/vong-non.svg')} alt="" />
        <div className="cvw-tl__kicker">
          <span className="cvw-tl__big">{it.year[li] ?? it.year[0]}</span>
          <span className="cvw-tl__role">
            <Ruby text={it.role[li]} />
          </span>
        </div>
        <div className="cvw-tl__name">
          <Ruby text={it.name[li]} />
        </div>
        <div className="cvw-tl__bio">
          <Ruby text={it.bio[li]} />
        </div>
        <img className="cvw-tl__still" src={asset('assets/book/deco/still-non.svg')} alt="" />
        <div className="cvw-tl__nav">
          <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label={t.prev}>
            ‹
          </button>
          <span className="cvw-tl__count">
            {i + 1} / {n}
          </span>
          <button type="button" onClick={() => go(i + 1)} disabled={i === n - 1} aria-label={t.next}>
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
