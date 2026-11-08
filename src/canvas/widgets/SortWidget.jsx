import { useRef, useState } from 'react'
import { useCanvasLang, plainText } from '../lang.js'
import { setTab } from '../tabs.js'
import Cta from './Cta.jsx'

/**
 * Xếp lại các công đoạn (cặp trang sau mục 2.3.2; anh Hải 08/11: tương tác kéo thả, sắp xếp).
 * Các thẻ công đoạn bị xáo; người đọc kéo thẻ lên / xuống (hoặc bấm hai thẻ để đổi chỗ) rồi bấm "Kiểm tra".
 * Thẻ đúng chỗ viền xanh, sai chỗ viền son. Xếp đúng hết → thẻ el.set chuyển sang 1: trang phải hiện chiếc nón hoàn thiện.
 * el.steps = [{ no, name: [vi, ja], sub: [vi, ja], src }] theo đúng thứ tự (no: 0 = khâu hoàn thiện, không mang số bước), el.set = tên nhóm thẻ, el.accent = màu chương
 */
const T = {
  vi: { hint: 'Kéo thẻ lên xuống, hoặc bấm hai thẻ để đổi chỗ', tag: 'TRÒ CHƠI', cta: 'Kéo thẻ để xếp lại', check: 'Kiểm tra', again: 'Xáo lại', ok: (k, n) => `Đúng ${k}/${n} thẻ — thử tiếp nhé!`, done: 'Chính xác! Chiếc nón đã hoàn thiện.', step: 'Bước', fin: 'Hoàn thiện' },
  ja: { hint: 'カードを上下にドラッグ、または二枚をクリックして入れ替え', tag: 'ミニゲーム', cta: 'カードを並べ替えよう', check: '答え合わせ', again: 'シャッフル', ok: (k, n) => `${n}枚中${k}枚正解 — もう一度！`, done: '正解！ノンラーが完成しました。', step: '工程', fin: '仕上げ' },
}
// xáo cố định (ảnh thu nhỏ / trang soát luôn giống nhau), không bao giờ trùng thứ tự đúng
const shuffle = (n, seed = 7) => {
  const a = [...Array(n).keys()]
  let s = seed
  for (let i = n - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.every((v, i) => v === i) ? a.reverse() : a
}

export default function SortWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const t = T[lang]
  const steps = el.steps || []
  const n = steps.length
  const [order, setOrder] = useState(() => shuffle(n))
  const [drag, setDrag] = useState(null) // { from, y0, dy, moved }
  const [sel, setSel] = useState(null)
  const [checked, setChecked] = useState(false)
  const [seed, setSeed] = useState(7)
  const [touched, setTouched] = useState(false) // chưa chạm: thẻ đầu nhích mời kéo, viên "TRÒ CHƠI"
  const boxRef = useRef(null)
  const BAR = 40
  const rowH = (el.h - BAR) / n
  const done = checked && order.every((v, i) => v === i)
  const right = order.filter((v, i) => v === i).length
  const pick = (p) => plainText((p && (p[li] ?? p[0])) || '')
  const scale = () => {
    const r = boxRef.current?.getBoundingClientRect()
    return r ? r.height / el.h : 1
  }
  const target = () => (drag ? Math.max(0, Math.min(n - 1, Math.round(drag.from + drag.dy / rowH))) : null)
  const posOf = (p) => {
    if (!drag || !drag.moved) return p
    const to = target()
    if (p === drag.from) return p
    if (drag.from < to && p > drag.from && p <= to) return p - 1
    if (drag.from > to && p < drag.from && p >= to) return p + 1
    return p
  }
  const onDown = (e, p) => {
    if (!interactive || done) return
    setTouched(true)
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ from: p, y0: e.clientY, dy: 0, moved: false })
  }
  const onMove = (e) => {
    if (!drag) return
    const dy = (e.clientY - drag.y0) / scale()
    setDrag((d) => d && { ...d, dy, moved: d.moved || Math.abs(dy) > 5 })
  }
  const onUp = () => {
    if (!drag) return
    if (drag.moved) {
      const to = target()
      const o = [...order]
      const [v] = o.splice(drag.from, 1)
      o.splice(to, 0, v)
      setOrder(o)
      setSel(null)
      setChecked(false)
    } else if (sel == null) setSel(drag.from)
    else if (sel === drag.from) setSel(null)
    else {
      const o = [...order]
      ;[o[sel], o[drag.from]] = [o[drag.from], o[sel]]
      setOrder(o)
      setSel(null)
      setChecked(false)
    }
    setDrag(null)
  }
  const check = () => {
    setChecked(true)
    setSel(null)
    if (order.every((v, i) => v === i)) setTab(el.set, 1)
  }
  const again = () => {
    const s = seed + 11
    setSeed(s)
    setOrder(shuffle(n, s))
    setChecked(false)
    setSel(null)
    setTab(el.set, 0)
  }
  return (
    <div ref={boxRef} className={`cvw cvw-sort ${done ? 'is-done' : ''} ${lang === 'ja' ? 'is-ja' : ''} ${interactive && !touched && !checked ? 'is-idle' : ''}`} data-no-flip={interactive ? '' : undefined} style={{ '--acc': el.accent || '#5f7a3a' }}>
      <ol className="cvw-sort__list" style={{ height: `${n * rowH}em` }}>
        {order.map((v, p) => {
          const s = steps[v]
          const isDrag = drag?.moved && drag.from === p
          const top = isDrag ? p * rowH + drag.dy : posOf(p) * rowH
          const state = checked ? (v === p ? 'is-right' : 'is-wrong') : ''
          return (
            <li
              key={v}
              className={`cvw-sort__card ${state} ${isDrag ? 'is-drag' : ''} ${sel === p ? 'is-sel' : ''}`}
              style={{ top: `${top}em`, height: `${rowH - 6}em` }}
              onPointerDown={(e) => onDown(e, p)}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={() => setDrag(null)}
              aria-label={`${p + 1}. ${pick(s.name)}`}
            >
              <span className="cvw-sort__pos">{p + 1}</span>
              <span className="cvw-sort__ph">{s.src && <img src={s.src} alt="" draggable="false" loading="lazy" />}</span>
              <span className="cvw-sort__txt">
                <b>{pick(s.name)}</b>
                <span>{pick(s.sub)}</span>
              </span>
              {checked && v === p && (
                <span className="cvw-sort__no">
                  {s.no ? `${t.step} ${s.no}` : t.fin}
                </span>
              )}
              <span className="cvw-sort__grip" aria-hidden="true">
                ⋮⋮
              </span>
            </li>
          )
        })}
      </ol>
      <div className="cvw-sort__bar">
        {interactive && !touched && !checked ? (
          <Cta tag={t.tag}>{t.cta}</Cta>
        ) : (
          <span className="cvw-sort__msg" aria-live="polite">
            {done ? t.done : checked ? t.ok(right, n) : t.hint}
          </span>
        )}
        {interactive && (
          <span className="cvw-sort__btns">
            <button type="button" className="cvw-sort__btn" onClick={again}>
              {t.again}
            </button>
            {!done && (
              <button type="button" className="cvw-sort__btn is-main" onClick={check}>
                {t.check}
              </button>
            )}
          </span>
        )}
      </div>
    </div>
  )
}
