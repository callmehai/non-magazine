import { useEffect, useRef, useState } from 'react'
import { useCanvasLang } from '../lang.js'
import map from './vnmap.json'
import { webglOK } from './webgl.js'

/**
 * Bản đồ Việt Nam chữ S (dữ liệu Natural Earth, bản theo quan điểm Việt Nam: có Hoàng Sa, Trường Sa).
 * Bấm vào bản đồ → khung nhìn phóng dần tới Hà Nội, cắm ghim Làng Chuông, mô hình 3D của làng nổi lên trên ghim.
 * Toạ độ trong vnmap.json là đơn vị bản đồ (scripts tạo: lon/lat → x/y), chữ và ghim vẽ theo cỡ point của trang
 * nên không phình to khi phóng.
 */
const L = {
  vi: {
    country: 'VIỆT NAM',
    sea: 'Biển Đông',
    paracel: 'Quần đảo Hoàng Sa',
    spratly: 'Quần đảo Trường Sa',
    hanoi: 'Hà Nội',
    chuong: 'Làng Chuông',
    hint: 'Bấm vào bản đồ để đến Làng Chuông',
    back: 'Toàn cảnh Việt Nam',
    place: 'xã Phương Trung, thành phố Hà Nội',
    drag: 'Kéo để xoay mô hình',
  },
  ja: {
    country: 'ベトナム',
    sea: '東海（ビエンドン）',
    paracel: 'ホアンサ諸島',
    spratly: 'チュオンサ諸島',
    hanoi: 'ハノイ',
    chuong: 'チュオン村',
    hint: '地図をクリックしてチュオン村へ',
    back: 'ベトナム全図へ',
    place: 'ハノイ市フオンチュン社',
    drag: 'ドラッグで模型を回転',
  },
}

const [HX, HY] = map.places.hanoi
const [CX, CY] = map.places.chuong
// khung nhìn: tâm + chiều cao (đơn vị bản đồ); chiều ngang theo tỉ lệ khung phần tử
const WORLD = { x: 360, y: 380, s: 660 }
const ZOOM_S = 62
const ZOOMED = { x: CX + 1.5, y: CY - ZOOM_S * 0.31, s: ZOOM_S } // ghim làng nằm giữa, gần đáy khung
const DUR = 1900

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** nội suy phóng to quanh một điểm: điểm đích trôi đều trên màn hình trong lúc khung nhìn co lại */
function lerpView(a, b, t) {
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t)
  const k = a.s === b.s ? t : (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s)
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, s }
}

export default function MapWidget({ el, interactive, visible }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const t = L[lang]
  const aspect = el.w / el.h
  const [view, setView] = useState(WORLD)
  const [phase, setPhase] = useState('world') // world | zooming | village | leaving
  const raf = useRef(0)

  const fly = (to, done) => {
    cancelAnimationFrame(raf.current)
    const from = view
    const t0 = performance.now()
    const step = (now) => {
      const k = Math.min(1, (now - t0) / DUR)
      setView(lerpView(from, to, ease(k)))
      if (k < 1) raf.current = requestAnimationFrame(step)
      else done()
    }
    raf.current = requestAnimationFrame(step)
  }
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // rời trang thì về lại toàn cảnh (lần sau mở trang người đọc lại được bấm)
  useEffect(() => {
    if (visible) return
    cancelAnimationFrame(raf.current)
    setView(WORLD)
    setPhase('world')
  }, [visible])

  const go = () => {
    if (!interactive || phase !== 'world') return
    setPhase('zooming')
    fly(ZOOMED, () => setPhase('village'))
  }
  const back = (e) => {
    e.stopPropagation()
    setPhase('leaving')
    fly(WORLD, () => setPhase('world'))
  }

  const vw = view.s * aspect
  const vb = `${view.x - vw / 2} ${view.y - view.s / 2} ${vw} ${view.s}`
  const u = view.s / el.h // đơn vị bản đồ trên 1pt của trang
  const z = WORLD.s / view.s // độ phóng
  const near = Math.min(1, Math.max(0, (z - 2.5) / 4)) // 0 → 1 khi đã phóng gần Hà Nội
  const far = 1 - Math.min(1, Math.max(0, (z - 1.2) / 1.5))
  const label = (x, y, text, size, o = {}) => (
    <text
      x={x}
      y={y}
      fontSize={size * u}
      textAnchor={o.anchor ?? 'middle'}
      className={`cvw-map__label ${o.cls ?? ''}`}
      style={{
        opacity: o.opacity ?? 1,
        letterSpacing: o.track ? `${o.track * u}px` : undefined,
      }}
    >
      {text}
    </text>
  )
  // vị trí ghim làng trên khung (%) — mô hình 3D đặt đáy ngay trên ghim
  const pinX = ((CX - (view.x - vw / 2)) / vw) * 100
  const pinY = ((CY - (view.y - view.s / 2)) / view.s) * 100

  return (
    <div className={`cvw cvw-map is-${phase} ${interactive ? 'is-live' : ''}`} data-no-flip={interactive ? '' : undefined}>
      <svg className="cvw-map__svg" viewBox={vb} preserveAspectRatio="xMidYMid slice" onClick={go} role={interactive ? 'button' : 'img'} aria-label={t.hint}>
        <rect x={-200} y={-200} width={map.w + 400} height={map.h + 400} className="cvw-map__sea" />
        <path d={map.neighbors} className="cvw-map__nb" vectorEffect="non-scaling-stroke" />
        <path d={map.vn} className="cvw-map__vn" vectorEffect="non-scaling-stroke" />
        <path d={map.hanoi} className="cvw-map__hn" vectorEffect="non-scaling-stroke" style={{ opacity: 0.25 + near * 0.75 }} />
        <path d={map.rivers} className="cvw-map__river" vectorEffect="non-scaling-stroke" style={{ opacity: 0.35 + near * 0.65 }} />
        {map.islets.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.2 * u} className="cvw-map__islet" />
        ))}
        {/* toàn cảnh */}
        <g style={{ opacity: far }}>
          {label(352, 392, t.country, 17, {
            anchor: 'start', cls: 'is-country', track: 4 })}
          {label(470, 520, t.sea, 13, { cls: 'is-sea' })}
          {label(555, 300, t.paracel, 10.5, { cls: 'is-islands' })}
          {label(640, 585, t.spratly, 10.5, { cls: 'is-islands' })}
          <circle cx={CX} cy={CY} r={11 * u} className="cvw-map__pulse" />
          <circle cx={CX} cy={CY} r={4.5 * u} className="cvw-map__dot" />
          {label(CX + 9 * u, CY - 7 * u, t.chuong, 11.5, {
            anchor: 'start',
            cls: 'is-chuong',
          })}
        </g>
        {/* đã phóng tới Hà Nội */}
        <g style={{ opacity: near }}>
          <line x1={HX} y1={HY} x2={CX} y2={CY} className="cvw-map__leg" vectorEffect="non-scaling-stroke" />
          <circle cx={HX} cy={HY} r={4 * u} className="cvw-map__city" />
          {label(HX + 8 * u, HY + 3.5 * u, t.hanoi, 12, {
            anchor: 'start',
            cls: 'is-city',
          })}
          <g transform={`translate(${CX} ${CY}) scale(${u})`} className="cvw-map__pin">
            <path d="M0 0 C -4 -7 -9 -11 -9 -17 A 9 9 0 1 1 9 -17 C 9 -11 4 -7 0 0 Z" />
            <circle cx={0} cy={-17} r={3.4} />
          </g>
        </g>
      </svg>

      {interactive && phase === 'world' && (
        <span className="cvw-chip cvw-map__hint" aria-hidden="true">
          {t.hint}
        </span>
      )}
      {phase === 'village' && (
        <>
          <Village3D
            visible={visible}
            style={{
              left: `${pinX - 40}%`,
              width: '80%',
              top: `${pinY - 70}%`,
              height: '68%',
            }}
          />
          <div className="cvw-map__card">
            <b>{t.chuong}</b>
            <span>{t.place}</span>
            {webglOK && <em>{t.drag}</em>}
          </div>
          <button type="button" className="cvw-chip cvw-map__back" onClick={back}>
            ← {t.back}
          </button>
        </>
      )}
    </div>
  )
}

/** khung WebGL của mô hình làng: tạo cảnh khi hiện, huỷ khi rời trang */
function Village3D({ visible, style }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!visible || !webglOK) return
    let scene
    let cancelled = false
    import('./village3d.js').then(({ VillageScene }) => {
      if (!cancelled && ref.current) scene = new VillageScene(ref.current)
    })
    return () => {
      cancelled = true
      scene?.dispose()
    }
  }, [visible])
  if (!webglOK) return null
  return <canvas ref={ref} className="cvw-map__village" style={style} />
}
