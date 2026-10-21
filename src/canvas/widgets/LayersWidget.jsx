import { useEffect, useRef, useState } from 'react'
import { useCanvasLang, plainText } from '../lang.js'
import { webglOK } from './webgl.js'

/**
 * Mô hình 3 lớp lá nón (mục 2.1.1): danh sách ba lớp bên trái, mô hình 3D tách lớp bên phải.
 * Bấm vào một lớp (trên mô hình hoặc trong danh sách) → lớp đó sáng màu riêng, hai lớp kia mờ đi.
 * el.items = [{ name: [vi, ja], note: [vi, ja] }] — sửa chữ trong dữ liệu trang, không cần sửa code.
 */
const COLORS = ['#d9962f', '#a95f3c', '#5f8a4a']
const L = {
  vi: { hint: 'Bấm vào một lớp lá để làm nổi bật', drag: 'Kéo để xoay' },
  ja: { hint: '層をクリックすると色で強調されます', drag: 'ドラッグで回転' },
}

export default function LayersWidget({ el, interactive, visible }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const items = el.items || []
  const [sel, setSel] = useState(null)
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const live = interactive && visible && webglOK

  useEffect(() => {
    if (!live) return
    let cancelled = false
    import('./layers3d.js').then(({ LayersScene }) => {
      if (cancelled || !canvasRef.current) return
      sceneRef.current = new LayersScene(canvasRef.current, {
        colors: COLORS,
        onSelect: setSel,
      })
    })
    return () => {
      cancelled = true
      sceneRef.current?.dispose()
      sceneRef.current = null
      setSel(null)
    }
  }, [live])

  const pick = (i) => {
    const next = sel === i ? null : i
    setSel(next)
    sceneRef.current?.select(next, false)
  }

  return (
    <div className={`cvw cvw-layers ${sel !== null ? 'has-sel' : ''}`} data-no-flip={interactive ? '' : undefined}>
      <ol className="cvw-layers__list">
        {items.map((it, i) => (
          <li key={i}>
            <button
              type="button"
              className={`cvw-layers__item ${sel === i ? 'is-on' : ''}`}
              style={{ '--c': COLORS[i] }}
              onClick={() => pick(i)}
              disabled={!interactive}
              aria-pressed={sel === i}
            >
              <span className="cvw-layers__no">{i + 1}</span>
              <span className="cvw-layers__txt">
                <b>{plainText(it.name[li] ?? it.name[0])}</b>
                <span>{plainText(it.note[li] ?? it.note[0])}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div className="cvw-layers__stage">
        {/* hình tĩnh: editor, ảnh thu nhỏ, máy không có WebGL */}
        {!live && (
          <svg className="cvw-layers__still" viewBox="0 0 200 200" aria-hidden="true">
            {[0, 1, 2].map((i) => {
              const y = 20 + i * 52
              const w = 150 - i * 8
              const x = 100 - w / 2
              return (
                <g key={i} style={{ opacity: sel === null || sel === i ? 1 : 0.3 }}>
                  <path
                    d={`M${x} ${y + 50} L100 ${y} L${x + w} ${y + 50} Z`}
                    fill={['#efe4c8', '#c4a072', '#f3ead6'][i]}
                    stroke={COLORS[i]}
                    strokeWidth="1.2"
                  />
                  <ellipse cx="100" cy={y + 50} rx={w / 2} ry="6" fill={['#efe4c8', '#c4a072', '#f3ead6'][i]} stroke={COLORS[i]} strokeWidth="1.2" />
                </g>
              )
            })}
          </svg>
        )}
        {live && <canvas ref={canvasRef} className="cvw-layers__gl" aria-label={L[lang].hint} />}
        {interactive && <span className="cvw-layers__hint">{webglOK ? `${L[lang].hint} · ${L[lang].drag}` : L[lang].hint}</span>}
      </div>
    </div>
  )
}
