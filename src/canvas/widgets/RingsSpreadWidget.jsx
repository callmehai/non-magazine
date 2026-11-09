import { useEffect, useRef, useSyncExternalStore } from 'react'
import { useCanvasLang, plainText } from '../lang.js'
import { setTab } from '../tabs.js'
import Cta, { HAND } from './Cta.jsx'

/**
 * Trò kéo 16 vòng nứa lên khuôn — bản TRANG ĐÔI (Doc 09/11, tab "Bản sửa lần 2": "Trò chơi này làm trang đôi đc k em,
 * để cái khung ở giữa 2 trang, cái vành xếp ở góc trên bên phải, ẩn cả chú thích ảnh 61").
 * Mỗi trang sách cắt nội dung của riêng nó, nên trò chơi là HAI phần tử (el.part = 'L' trang trái, 'R' trang phải) cùng vẽ
 * một cảnh trong toạ độ cặp trang (trang phải lệch el.ox = bề ngang trang): khuôn nón đặt đúng gáy sách (mỗi trang thấy
 * một nửa), bó vòng ở góc trên trang phải. Trạng thái (vòng đã lên, vòng đang cầm) dùng chung qua kho nhỏ bên dưới, nên
 * vòng đang kéo vẽ liền qua gáy. Đủ 16 vòng → thẻ el.set = 1 (ảnh khung nón thật + chú thích ở trang phải mở khoá).
 * el.mold = { cx, ay, fw }, el.bundle = { bx, by, R } (toạ độ cặp trang, đơn vị pt), el.bar = true ở phần có thanh nút.
 */
const N = 16
const T = {
  vi: { hint: 'Kéo từng vòng nứa từ bó sang khuôn', tag: 'TRÒ CHƠI', count: (k) => `Đã lên ${k}/16 vòng`, done: 'Khung 16 vòng đã xong!', all: 'Lên hết vòng', reset: 'Làm lại', bundle: 'Bó vòng nứa', mold: 'Khuôn nón' },
  ja: { hint: '束からヌアの輪をドラッグして型に付けよう', tag: 'ミニゲーム', count: (k) => `${k}/16本の輪を付けました`, done: '16本の輪の骨組みが完成！', all: 'すべて付ける', reset: 'やり直す', bundle: 'ヌアの輪の束', mold: 'ノンラーの型' },
}

// kho dùng chung giữa hai nửa: { placed: Set, drag: { i, x, y, x0, y0, moved } | null } theo từng nhóm (el.set)
const store = new Map()
const subs = new Set()
const EMPTY = { placed: new Set(), drag: null }
const get = (k) => store.get(k) ?? EMPTY
const put = (k, v) => {
  store.set(k, { ...get(k), ...v })
  subs.forEach((f) => f())
}
const subscribe = (f) => {
  subs.add(f)
  return () => subs.delete(f)
}

export default function RingsSpreadWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const t = T[lang]
  const li = lang === 'ja' ? 1 : 0
  const key = el.set || 'rings'
  const st = useSyncExternalStore(subscribe, () => get(key))
  const placed = st.placed
  const drag = st.drag
  const svgRef = useRef(null)
  const acc = el.accent || '#5f7a3a'
  const ox = el.ox ?? 0
  const vx = ox + el.x
  const all = !interactive || placed.size === N
  const done = interactive && placed.size === N
  useEffect(() => {
    if (el.part === 'L' && el.set && interactive) setTab(el.set, done ? 1 : 0)
  }, [done, el.part, el.set, interactive])
  const has = (i) => !interactive || placed.has(i)

  const { cx, ay, fw } = el.mold
  const fH = Math.round((fw / 2) * 0.7)
  const slot = (i) => {
    const k = (i + 1) / N
    const rw = fw * k
    return { x: cx, y: ay + fH * k, rx: rw / 2, ry: Math.max(1.2, (rw * 0.1) / 2) }
  }
  const { bx, by, R } = el.bundle
  const br = (i) => (R * (i + 1)) / N

  const pt = (e) => {
    const m = svgRef.current?.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }
  const left = () => [...Array(N).keys()].filter((i) => !placed.has(i))
  const onDown = (e) => {
    if (!interactive) return
    const rest = left()
    if (!rest.length) return
    const p = pt(e)
    const d = Math.hypot(p.x - bx, p.y - by)
    if (d > R + 10) return
    const i = rest.reduce((a, b) => (Math.abs(br(b) - d) < Math.abs(br(a) - d) ? b : a), rest[0])
    try {
      e.target.setPointerCapture?.(e.pointerId)
    } catch {
      /* con trỏ không còn hoạt động (sự kiện giả lập) */
    }
    put(key, { drag: { i, x: p.x, y: p.y, x0: p.x, y0: p.y, moved: false } })
    e.preventDefault()
  }
  const onMove = (e) => {
    if (!drag) return
    const p = pt(e)
    put(key, { drag: { ...drag, x: p.x, y: p.y, moved: drag.moved || Math.hypot(p.x - drag.x0, p.y - drag.y0) > 4 } })
  }
  const onUp = (e) => {
    if (!drag) return
    const p = pt(e)
    const onMold = p.x > cx - fw / 2 - 30 && p.x < cx + fw / 2 + 30 && p.y > ay - 30 && p.y < ay + fH + 30
    // bấm (không kéo) → vòng nhỏ nhất còn lại lên khuôn; kéo thả vào khuôn → vòng đang cầm vào nấc của nó
    const next = new Set(placed)
    if (!drag.moved) next.add(left()[0])
    else if (onMold) next.add(drag.i)
    put(key, { placed: next, drag: null })
  }

  const gong = [...Array(8).keys()].map((k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    const s = slot(N - 1)
    return { x: cx + s.rx * Math.cos(a), y: s.y + s.ry * Math.sin(a), back: Math.sin(a) < 0 }
  })
  const label = (p) => plainText(p?.[li] ?? p?.[0] ?? '')
  const idle = interactive && placed.size === 0 && !drag
  const demo = slot(10)
  const rim = slot(N - 1)
  return (
    <div
      className={`cvw cvw-rings cvw-rings2 ${interactive ? 'is-live' : ''} ${all ? 'is-done' : ''} ${idle ? 'is-idle' : ''}`}
      data-no-flip={interactive && el.part === 'R' ? '' : undefined}
      style={{ '--acc': acc }}
    >
      <svg
        ref={svgRef}
        viewBox={`${vx} ${el.y} ${el.w} ${el.h}`}
        className="cvw-rings__svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => put(key, { drag: null })}
        role="img"
        aria-label={`${t.mold} · ${t.count(interactive ? placed.size : N)}`}
      >
        {gong
          .filter((g) => g.back)
          .map((g, k) => (
            <line key={`b${k}`} x1={cx} y1={ay} x2={g.x} y2={g.y} className="cvw-rings__gong is-back" />
          ))}
        {[...Array(N).keys()].map((i) => {
          const s = slot(i)
          const on = has(i)
          return (
            <g key={i} className={`cvw-rings__ring ${on ? 'is-on' : ''} ${i === N - 1 ? 'is-rim' : ''}`}>
              <ellipse cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} className="cvw-rings__notch" />
              {on && <ellipse cx={s.x} cy={s.y} rx={s.rx} ry={s.ry} className="cvw-rings__nua" />}
            </g>
          )
        })}
        {gong
          .filter((g) => !g.back)
          .map((g, k) => (
            <line key={`f${k}`} x1={cx} y1={ay} x2={g.x} y2={g.y} className="cvw-rings__gong" />
          ))}
        <ellipse cx={cx} cy={ay - 3} rx={5} ry={4} className="cvw-rings__tip" />
        {/* tên khuôn đứng bên trái vành (không đè lên gáy sách) */}
        <text x={cx - rim.rx - 10} y={rim.y + 4} className="cvw-rings__cap is-side">
          {t.mold}
        </text>
        {interactive && placed.size < N && (
          <g className="cvw-rings__bundle">
            {[...Array(N).keys()].map((i) =>
              placed.has(i) || drag?.i === i ? null : <circle key={i} cx={bx} cy={by} r={br(i)} className="cvw-rings__loop" />
            )}
            <circle cx={bx} cy={by} r={R + 10} className="cvw-rings__grab" />
            <text x={bx} y={by + R + 24} className="cvw-rings__cap">
              {t.bundle}
            </text>
          </g>
        )}
        {idle && (
          <g className="cvw-rings__demo" style={{ '--dx': `${bx - demo.x}px`, '--dy': `${by - demo.y}px` }}>
            <ellipse cx={demo.x} cy={demo.y} rx={demo.rx} ry={Math.max(3, demo.ry)} />
            <svg className="cvw-rings__hand" x={demo.x + demo.rx * 0.35} y={demo.y - 2} width="22" height="22" viewBox="0 0 24 24" overflow="visible">
              {HAND.props.children}
            </svg>
          </g>
        )}
        {drag?.moved && <ellipse cx={drag.x} cy={drag.y} rx={slot(drag.i).rx} ry={Math.max(3, slot(drag.i).ry)} className="cvw-rings__nua is-drag" />}
        {all && el.labels && (
          <>
            <text x={cx + 14} y={ay - 2} className="cvw-rings__lbl">
              {label(el.labels.apex)}
            </text>
            <text x={cx + rim.rx + 10} y={rim.y + 4} className="cvw-rings__lbl is-rim">
              {label(el.labels.rim)}
            </text>
          </>
        )}
      </svg>
      {interactive && el.bar && (
        <div className={`cvw-rings__bar ${el.barTop ? 'is-top' : ''}`} style={el.barW ? { right: 'auto', width: `${el.barW}em` } : undefined} data-no-flip="">
          {idle ? (
            <Cta tag={t.tag}>{t.hint}</Cta>
          ) : (
            <span className="cvw-rings__count" aria-live="polite">
              {placed.size === N ? t.done : placed.size ? t.count(placed.size) : t.hint}
            </span>
          )}
          {placed.size < N ? (
            <button type="button" className="cvw-rings__btn" onClick={() => put(key, { placed: new Set([...Array(N).keys()]) })}>
              {t.all}
            </button>
          ) : (
            <button type="button" className="cvw-rings__btn" onClick={() => put(key, { placed: new Set() })}>
              {t.reset}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
