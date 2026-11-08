import { useEffect, useRef, useState } from 'react'
import { useCanvasLang, plainText } from '../lang.js'
import { setTab } from '../tabs.js'

/**
 * Kéo vòng nứa lên khuôn (mục 2.1.1 "Cấu trúc khung 16 vòng"; anh Hải 08/11: thêm tương tác kéo thả).
 * Trái: khuôn nón (8 gọng tụ ở chóp); phải: bó 16 vòng nứa nhìn từ trên xuống (vòng lồng nhau, to nhỏ khác nhau).
 * Người đọc nắm một vòng trong bó (bấm gần vòng nào thì cầm vòng đó), kéo sang khuôn rồi thả: vòng tự vào đúng
 * nấc của nó theo cỡ (vòng nhỏ gần chóp, vòng lớn nhất là vòng cạp). Bấm vào bó (không kéo) cũng đưa một vòng lên.
 * Đủ 16 vòng → hiện nhãn "Chóp nón" / "Vòng cạp (vòng 16)" như sơ đồ cũ. Chế độ không tương tác (ảnh thu nhỏ, trang
 * soát): vẽ sẵn khung đủ 16 vòng.
 * el.labels = { apex: [vi, ja], rim: [vi, ja] }, el.accent = màu chương
 */
const N = 16
const T = {
  vi: { hint: 'Kéo từng vòng nứa từ bó sang khuôn', count: (k) => `Đã lên ${k}/16 vòng`, done: 'Khung 16 vòng đã xong!', all: 'Lên hết vòng', reset: 'Làm lại', bundle: 'Bó vòng nứa', mold: 'Khuôn nón' },
  ja: { hint: '束からヌアの輪をドラッグして型に付けよう', count: (k) => `${k}/16本の輪を付けました`, done: '16本の輪の骨組みが完成！', all: 'すべて付ける', reset: 'やり直す', bundle: 'ヌアの輪の束', mold: 'ノンラーの型' },
}

export default function RingsWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const t = T[lang]
  const li = lang === 'ja' ? 1 : 0
  const W = el.w
  const H = el.h
  const acc = el.accent || '#5f7a3a'
  const svgRef = useRef(null)
  const [placed, setPlaced] = useState(() => new Set())
  const [drag, setDrag] = useState(null) // { i, x, y, moved }
  const all = !interactive || placed.size === N
  // anh Hải 08/11: "có thể xem xét cho chơi xong mới hiện ảnh" — đủ 16 vòng → thẻ el.set = 1: ảnh khung nón thật ở trang
  // bên cạnh hiện ra (đang phủ giấy mờ); làm lại → phủ lại
  const done = interactive && placed.size === N
  useEffect(() => {
    if (el.set && interactive) setTab(el.set, done ? 1 : 0)
  }, [done, el.set, interactive])
  const has = (i) => !interactive || placed.has(i)

  // khuôn: chóp (cx, ay), vành rộng fw, cao fH — dáng thấp như nón thật (cao ≈ 0,7 × bán kính vành)
  const fw = Math.min(300, W * 0.6)
  const fH = Math.round((fw / 2) * 0.7)
  const cx = 24 + fw / 2
  const ay = 34
  const slot = (i) => {
    const k = (i + 1) / N
    const rw = fw * k
    return { x: cx, y: ay + fH * k, rx: rw / 2, ry: Math.max(1.2, (rw * 0.1) / 2) }
  }
  // bó vòng: tâm (bx, by), bán kính vòng i
  const R = Math.min(64, (W - fw - 60) / 2 - 6)
  const bx = W - R - 22
  const by = ay + fH / 2 - 6
  const br = (i) => (R * (i + 1)) / N

  const pt = (e) => {
    const s = svgRef.current
    const m = s.getScreenCTM()
    if (!m) return { x: 0, y: 0 }
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }
  const left = () => [...Array(N).keys()].filter((i) => !placed.has(i))
  const put = (i) => setPlaced((s) => new Set(s).add(i))
  const onDown = (e) => {
    if (!interactive) return
    const rest = left()
    if (!rest.length) return
    const p = pt(e)
    const d = Math.hypot(p.x - bx, p.y - by)
    if (d > R + 10) return
    // cầm vòng gần chỗ bấm nhất (theo bán kính)
    const i = rest.reduce((a, b) => (Math.abs(br(b) - d) < Math.abs(br(a) - d) ? b : a), rest[0])
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setDrag({ i, x: p.x, y: p.y, x0: p.x, y0: p.y, moved: false })
    e.preventDefault()
  }
  const onMove = (e) => {
    if (!drag) return
    const p = pt(e)
    setDrag((d) => d && { ...d, x: p.x, y: p.y, moved: d.moved || Math.hypot(p.x - d.x0, p.y - d.y0) > 4 })
  }
  const onUp = (e) => {
    if (!drag) return
    const p = pt(e)
    const onMold = p.x > cx - fw / 2 - 30 && p.x < cx + fw / 2 + 30 && p.y > ay - 30 && p.y < ay + fH + 30
    // bấm (không kéo) → vòng nhỏ nhất còn lại lên khuôn; kéo thả vào khuôn → vòng đang cầm vào nấc của nó
    if (!drag.moved) put(left()[0])
    else if (onMold) put(drag.i)
    setDrag(null)
  }

  const gong = [...Array(8).keys()].map((k) => {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    const s = slot(N - 1)
    return { x: cx + s.rx * Math.cos(a), y: s.y + s.ry * Math.sin(a), back: Math.sin(a) < 0 }
  })
  const label = (p) => plainText(p?.[li] ?? p?.[0] ?? '')
  return (
    <div className={`cvw cvw-rings ${all ? 'is-done' : ''}`} data-no-flip={interactive ? '' : undefined} style={{ '--acc': acc }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="cvw-rings__svg"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => setDrag(null)}
        role="img"
        aria-label={`${t.mold} · ${t.count(interactive ? placed.size : N)}`}
      >
        {/* khuôn: gọng sau mờ, gọng trước đậm; núm chóp */}
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
        {interactive && (
          <text x={cx} y={ay + fH + 26} className="cvw-rings__cap">
            {t.mold}
          </text>
        )}
        {/* bó vòng nứa (nhìn từ trên) */}
        {interactive && placed.size < N && (
          <g className="cvw-rings__bundle">
            {[...Array(N).keys()].map((i) =>
              placed.has(i) || drag?.i === i ? null : <circle key={i} cx={bx} cy={by} r={br(i)} className="cvw-rings__loop" />
            )}
            <circle cx={bx} cy={by} r={R + 10} className="cvw-rings__grab" />
            <text x={bx} y={by + R + 17} className="cvw-rings__cap">
              {t.bundle}
            </text>
          </g>
        )}
        {/* vòng đang kéo: đúng cỡ của nó trên khuôn */}
        {drag?.moved && <ellipse cx={drag.x} cy={drag.y} rx={slot(drag.i).rx} ry={Math.max(3, slot(drag.i).ry)} className="cvw-rings__nua is-drag" />}
        {all && el.labels && (
          <>
            <text x={cx + 14} y={ay - 2} className="cvw-rings__lbl">
              {label(el.labels.apex)}
            </text>
            <text x={cx + fw / 2 + 10} y={ay + fH + 4} className="cvw-rings__lbl is-rim">
              {label(el.labels.rim)}
            </text>
          </>
        )}
      </svg>
      {interactive && (
        <div className="cvw-rings__bar">
          <span className="cvw-rings__count" aria-live="polite">
            {placed.size === N ? t.done : placed.size ? t.count(placed.size) : t.hint}
          </span>
          {placed.size < N ? (
            <button type="button" className="cvw-rings__btn" onClick={() => setPlaced(new Set([...Array(N).keys()]))}>
              {t.all}
            </button>
          ) : (
            <button type="button" className="cvw-rings__btn" onClick={() => setPlaced(new Set())}>
              {t.reset}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
