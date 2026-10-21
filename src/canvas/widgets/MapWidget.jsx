import { useEffect, useRef, useState } from 'react'
import { useCanvasLang } from '../lang.js'
import map from './vnmap.json'
import { reducedMotion } from './webgl.js'
import { ensureFont } from '../fonts.js'

ensureFont('Patrick Hand')
ensureFont('Klee One')

/**
 * Bản đồ hành trình (mục 1.3): bản đồ Việt Nam chữ S (Natural Earth, bản theo quan điểm Việt Nam: có Hoàng Sa,
 * Trường Sa). Bấm vào → phóng tới Hà Nội, mặt bản đồ nghiêng như trải trên bàn, con đường Hoàn Kiếm → Nguyễn Trãi →
 * Hà Đông → quốc lộ 21B → Làng Chuông hiện dần, chiếc ô tô chở nón bật lên rồi lăn bánh (có khói), tới làng thì
 * ghim rơi xuống. Toạ độ trong vnmap.json là đơn vị bản đồ; xe, khói, nhãn nằm ở lớp trên (không nghiêng),
 * vị trí lấy theo điểm neo trong SVG đã nghiêng.
 */
const L = {
  vi: {
    country: 'VIỆT NAM',
    sea: 'Biển Đông',
    paracel: 'Quần đảo Hoàng Sa',
    spratly: 'Quần đảo Trường Sa',
    hanoi: 'Hà Nội',
    hadong: 'Hà Đông',
    chuong: 'Làng Chuông',
    hint: 'Bấm vào bản đồ: lên xe về Làng Chuông!',
    start: 'Xuất phát từ Hà Nội',
    arrived: 'Tới Làng Chuông rồi!',
    place: 'xã Phương Trung, thành phố Hà Nội — làng nghề nón lá hơn 300 năm',
    again: 'Đi lại',
    back: 'Toàn cảnh Việt Nam',
  },
  ja: {
    country: 'ベトナム',
    sea: '東海（ビエンドン）',
    paracel: 'ホアンサ諸島',
    spratly: 'チュオンサ諸島',
    hanoi: 'ハノイ',
    hadong: 'ハドン',
    chuong: 'チュオン村',
    hint: '地図をクリック：車でチュオン村へ出発！',
    start: 'ハノイから出発',
    arrived: 'チュオン村に到着！',
    place: 'ハノイ市フオンチュン社 — 300年以上続く笠の村',
    again: 'もう一度',
    back: 'ベトナム全図へ',
  },
}

const P = (lat, lon) => [(lon - map.lon0) * map.k * map.cl, (map.lat0 - lat) * map.k]
// đường đi thật: Hoàn Kiếm → Ngã Tư Sở → Nguyễn Trãi → Hà Đông → Ba La → quốc lộ 21B → Phương Trung
const ROUTE = [
  [21.0285, 105.8542],
  [21.0035, 105.8205],
  [20.99, 105.8],
  [20.9715, 105.777],
  [20.955, 105.759],
  [20.925, 105.765],
  [20.9, 105.769],
  [20.88, 105.772],
].map(([a, b]) => P(a, b))
const [HX, HY] = ROUTE[0]
const [CX, CY] = ROUTE.at(-1)
const [DX, DY] = ROUTE[3] // Hà Đông

/** đường cong mượt đi qua các điểm (Catmull-Rom → Bézier) */
function smooth(pts) {
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]
    const [p1, p2] = [pts[i], pts[i + 1]]
    const p3 = pts[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += `C${c1.join(',')} ${c2.join(',')} ${p2.join(',')}`
  }
  return d
}
const ROUTE_D = smooth(ROUTE)

// trang trí vùng ven đô: ruộng lúa, cây, nhà (vị trí cố định, giả ngẫu nhiên)
const rnd = (() => {
  let s = 7
  return () => (s = (s * 16807) % 2147483647) / 2147483647
})()
const FIELDS = Array.from({ length: 46 }, () => {
  const x = 217 + rnd() * 12
  const y = 145.5 + rnd() * 6.5
  return { x, y, w: 0.5 + rnd() * 0.7, h: 0.3 + rnd() * 0.4, r: rnd() * 40 - 20, c: rnd() > 0.5 ? '#b9d07c' : '#a7c56c' }
}).filter((f) => Math.abs(f.x - 221.9 - (f.y - 148.8) * -0.15) > 0.7)
const TREES = Array.from({ length: 34 }, () => ({ x: 216.5 + rnd() * 13, y: 141 + rnd() * 11, r: 0.12 + rnd() * 0.12 }))
const HOUSES = Array.from({ length: 26 }, (_, i) => {
  const near = i < 16 ? [HX - 1.2, HY + 0.2, 2.6] : [DX - 0.3, DY - 0.2, 1.4]
  return { x: near[0] + (rnd() - 0.5) * near[2], y: near[1] + (rnd() - 0.5) * near[2] * 0.7, w: 0.18 + rnd() * 0.14 }
})

const WORLD = { x: 360, y: 380, s: 660 }
const TRIP = { x: (HX + CX) / 2 + 0.3, y: (HY + CY) / 2 - 0.35, s: 9.4 }
const T_ZOOM = 1900
const T_ROAD = 900
const T_POP = 450
const T_DRIVE = 4600

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
const clamp01 = (v) => Math.min(1, Math.max(0, v))

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
  const [phase, setPhase] = useState('world') // world | trip | done | leaving
  const [k, setK] = useState({ tilt: 0, road: 0, near: 0 })
  const rootRef = useRef(null)
  const routeRef = useRef(null)
  const anchorRef = useRef(null)
  const fxRef = useRef(null)
  const carRef = useRef(null)
  const raf = useRef(0)

  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // rời trang thì về lại toàn cảnh (lần sau mở trang người đọc lại được bấm)
  useEffect(() => {
    if (visible) return
    cancelAnimationFrame(raf.current)
    setView(WORLD)
    setPhase('world')
    setK({ tilt: 0, road: 0, near: 0 })
  }, [visible])

  /** toạ độ (px trong khung phần tử) của một điểm bản đồ sau khi mặt bản đồ đã nghiêng */
  const screenOf = (x, y) => {
    const a = anchorRef.current
    const root = rootRef.current
    if (!a || !root) return null
    a.setAttribute('cx', x)
    a.setAttribute('cy', y)
    const r = a.getBoundingClientRect()
    const box = root.getBoundingClientRect()
    const sc = box.width / root.offsetWidth || 1
    return [(r.left + r.width / 2 - box.left) / sc, (r.top + r.height / 2 - box.top) / sc]
  }

  const puff = (x, y, dir) => {
    const fx = fxRef.current
    if (!fx) return
    const d = document.createElement('i')
    d.className = 'cvw-trip__puff'
    d.style.left = `${x}px`
    d.style.top = `${y}px`
    d.style.setProperty('--dx', `${-dir * (14 + Math.random() * 10)}px`)
    fx.appendChild(d)
    setTimeout(() => d.remove(), 1100)
  }

  /** chạy hành trình: (phóng tới Hà Nội) → nghiêng → đường hiện dần → xe bật lên → xe chạy có khói → tới làng */
  const runTrip = (withZoom) => {
    cancelAnimationFrame(raf.current)
    fxRef.current?.querySelectorAll('.cvw-trip__puff').forEach((n) => n.remove())
    setPhase('trip')
    const from = view
    const t0 = performance.now()
    const zoom = withZoom ? T_ZOOM : 0
    const len = routeRef.current?.getTotalLength() ?? 1
    let lastPuff = 0
    let dir = -1
    const car = carRef.current
    const frame = (now) => {
      const e = now - t0
      const kz = zoom ? clamp01(e / zoom) : 1
      if (zoom) setView(lerpView(from, TRIP, ease(kz)))
      const tilt = clamp01((e - zoom * 0.55) / 900)
      const road = clamp01((e - zoom - 200) / T_ROAD)
      setK({ tilt: easeInOut(tilt), road: easeInOut(road), near: clamp01((e - zoom * 0.5) / (zoom * 0.5 || 1)) })
      const tc = e - zoom - 200 - T_ROAD
      if (car && tc > 0) {
        const pop = clamp01(tc / T_POP)
        const drive = easeInOut(clamp01((tc - T_POP) / T_DRIVE))
        const pt = routeRef.current.getPointAtLength(drive * len)
        const ahead = routeRef.current.getPointAtLength(Math.min(len, drive * len + len * 0.02))
        const s0 = screenOf(pt.x, pt.y)
        const s1 = screenOf(ahead.x, ahead.y)
        if (s0 && s1) {
          if (Math.abs(s1[0] - s0[0]) > 0.4) dir = s1[0] > s0[0] ? 1 : -1
          const bounce = pop < 1 ? 1 + Math.sin(pop * Math.PI) * 0.35 : 1
          car.style.opacity = '1'
          car.style.transform = `translate(${s0[0]}px, ${s0[1]}px) translate(-50%, -88%) scale(${pop * bounce}) scaleX(${dir})`
          car.classList.toggle('is-driving', pop >= 1 && drive < 1)
          if (pop >= 1 && drive < 1 && now - lastPuff > 85) {
            lastPuff = now
            puff(s0[0] - dir * 0.07 * root().w, s0[1] - 0.014 * root().w, dir)
          }
          car.style.setProperty('--trail', drive)
        }
        routeRef.current.parentNode.style.setProperty('--done', drive)
        if (drive >= 1) {
          setPhase('done')
          return
        }
      }
      raf.current = requestAnimationFrame(frame)
    }
    const root = () => ({ w: rootRef.current?.offsetWidth ?? 500 })
    if (reducedMotion()) {
      setView(TRIP)
      setK({ tilt: 1, road: 1, near: 1 })
      setPhase('done')
      requestAnimationFrame(() => {
        const s = screenOf(CX, CY)
        if (car && s) {
          car.style.opacity = '1'
          car.style.transform = `translate(${s[0]}px, ${s[1]}px) translate(-50%, -88%) scaleX(-1)`
        }
      })
      return
    }
    raf.current = requestAnimationFrame(frame)
  }

  const go = () => {
    if (!interactive || phase !== 'world') return
    runTrip(true)
  }
  const again = (e) => {
    e.stopPropagation()
    if (carRef.current) carRef.current.style.opacity = '0'
    runTrip(false)
  }
  const back = (e) => {
    e.stopPropagation()
    cancelAnimationFrame(raf.current)
    if (carRef.current) carRef.current.style.opacity = '0'
    setPhase('leaving')
    const from = view
    const t0 = performance.now()
    const frame = (now) => {
      const kk = clamp01((now - t0) / 1500)
      setView(lerpView(from, WORLD, ease(kk)))
      setK({ tilt: 1 - clamp01(kk * 2), road: 1 - clamp01(kk * 3), near: 1 - kk })
      if (kk < 1) raf.current = requestAnimationFrame(frame)
      else setPhase('world')
    }
    raf.current = requestAnimationFrame(frame)
  }

  const vw = view.s * aspect
  const vb = `${view.x - vw / 2} ${view.y - view.s / 2} ${vw} ${view.s}`
  const u = view.s / el.h // đơn vị bản đồ trên 1pt của trang
  const z = WORLD.s / view.s
  const far = 1 - clamp01((z - 1.2) / 1.5)
  const near = k.near
  const label = (x, y, text, size, o = {}) => (
    <text
      x={x}
      y={y}
      fontSize={size * u}
      textAnchor={o.anchor ?? 'middle'}
      className={`cvw-map__label ${o.cls ?? ''}`}
      style={{ letterSpacing: o.track ? `${o.track * u}px` : undefined }}
    >
      {text}
    </text>
  )
  // nhãn trên lớp không nghiêng: vị trí đọc lại mỗi lần vẽ
  const [tags, setTags] = useState(null)
  useEffect(() => {
    if (phase === 'world' || phase === 'leaving' || k.road < 0.6) return setTags(null)
    setTags({ h: screenOf(HX, HY), d: screenOf(DX, DY), c: screenOf(CX, CY) })
  }, [phase, k.road, k.tilt, view.s])

  return (
    <div ref={rootRef} className={`cvw cvw-map cvw-trip is-${phase} ${interactive ? 'is-live' : ''}`} data-no-flip={interactive ? '' : undefined}>
      <div className="cvw-trip__stage" style={{ transform: k.tilt ? `perspective(900em) rotateX(${k.tilt * 32}deg) scale(${1 + k.tilt * 0.12})` : undefined }}>
        <svg className="cvw-map__svg" viewBox={vb} preserveAspectRatio="xMidYMid slice" onClick={go} role={interactive ? 'button' : 'img'} aria-label={t.hint}>
          <rect x={-200} y={-200} width={map.w + 400} height={map.h + 400} className="cvw-map__sea" />
          <path d={map.neighbors} className="cvw-map__nb" vectorEffect="non-scaling-stroke" />
          <path d={map.vn} className="cvw-map__vn" vectorEffect="non-scaling-stroke" />
          <path d={map.hanoi} className="cvw-map__hn" vectorEffect="non-scaling-stroke" style={{ opacity: 0.3 + near * 0.7 }} />
          <path d={map.rivers} className="cvw-map__river" vectorEffect="non-scaling-stroke" style={{ opacity: 0.4 + near * 0.6 }} />
          {map.islets.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={2.2 * u} className="cvw-map__islet" />
          ))}
          {/* toàn cảnh */}
          <g style={{ opacity: far }}>
            {label(352, 392, t.country, 17, { anchor: 'start', cls: 'is-country', track: 4 })}
            {label(470, 520, t.sea, 13, { cls: 'is-sea' })}
            {label(555, 300, t.paracel, 10.5, { cls: 'is-islands' })}
            {label(640, 585, t.spratly, 10.5, { cls: 'is-islands' })}
            <circle cx={CX} cy={CY} r={11 * u} className="cvw-map__pulse" />
            <circle cx={CX} cy={CY} r={4.5 * u} className="cvw-map__dot" />
          </g>
          {/* vùng ven đô khi đã phóng: ruộng, cây, nhà, hồ Gươm */}
          {near > 0 && (
            <g style={{ opacity: near }}>
              {FIELDS.map((f, i) => (
                <rect key={i} x={f.x} y={f.y} width={f.w} height={f.h} fill={f.c} transform={`rotate(${f.r} ${f.x} ${f.y})`} rx={0.05} />
              ))}
              {HOUSES.map((h, i) => (
                <g key={i} transform={`translate(${h.x} ${h.y})`}>
                  <rect width={h.w} height={h.w * 0.7} fill="#efe5d1" stroke="#a9502c" strokeWidth={0.03} />
                  <path d={`M${-0.03} 0 L${h.w / 2} ${-h.w * 0.45} L${h.w + 0.03} 0Z`} fill="#b2532e" />
                </g>
              ))}
              {TREES.map((c, i) => (
                <circle key={i} cx={c.x} cy={c.y} r={c.r} fill="#6f9550" opacity={0.85} />
              ))}
              <ellipse cx={HX - 0.12} cy={HY - 0.05} rx={0.16} ry={0.28} fill="#8fc0c9" stroke="#5f97a5" strokeWidth={0.03} />
            </g>
          )}
          {/* con đường: viền trắng, vạch giữa, đoạn xe đã đi tô màu */}
          <g className="cvw-trip__road" style={{ opacity: k.road ? 1 : 0, '--road': k.road }}>
            <path d={ROUTE_D} className="cvw-trip__casing" pathLength="1" strokeWidth={7 * u} />
            <path ref={routeRef} d={ROUTE_D} className="cvw-trip__lane" pathLength="1" strokeWidth={4 * u} />
            <path d={ROUTE_D} className="cvw-trip__done" pathLength="1" strokeWidth={2.2 * u} />
          </g>
          <circle ref={anchorRef} r={0.001} fill="none" />
        </svg>
      </div>

      {/* lớp trên: nhãn, xe, khói, ghim */}
      <div ref={fxRef} className="cvw-trip__fx" aria-hidden="true">
        {tags?.h && (
          <span className="cvw-trip__tag is-start" style={{ left: tags.h[0], top: tags.h[1] }}>
            {phase === 'done' ? t.hanoi : t.start}
          </span>
        )}
        {tags?.d && (
          <span className="cvw-trip__tag is-mid" style={{ left: tags.d[0], top: tags.d[1] }}>
            {t.hadong}
          </span>
        )}
        {phase === 'done' && tags?.c && (
          <span className="cvw-trip__pin" style={{ left: tags.c[0], top: tags.c[1] }}>
            <svg viewBox="-12 -32 24 34">
              <path d="M0 0 C -5 -9 -11 -13 -11 -21 A 11 11 0 1 1 11 -21 C 11 -13 5 -9 0 0 Z" />
              <circle cx={0} cy={-21} r={4.2} />
            </svg>
          </span>
        )}
        <div ref={carRef} className="cvw-trip__car" style={{ opacity: 0 }}>
          <Car />
        </div>
      </div>

      {interactive && phase === 'world' && <span className="cvw-chip cvw-map__hint">{t.hint}</span>}
      {phase === 'done' && (
        <div className="cvw-trip__card">
          <b>{t.arrived}</b>
          <span>{t.place}</span>
        </div>
      )}
      {(phase === 'done' || phase === 'trip') && (
        <div className="cvw-trip__btns">
          <button type="button" className="cvw-chip" onClick={back}>
            ← {t.back}
          </button>
          {phase === 'done' && (
            <button type="button" className="cvw-chip" onClick={again}>
              ↻ {t.again}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** ô tô nhỏ kiểu cổ, nóc chở chồng nón lá; bánh xe quay khi chạy */
function Car() {
  return (
    <svg viewBox="0 0 120 78" className="cvw-car">
      {/* chồng nón trên nóc */}
      <g className="cvw-car__hats">
        <path d="M40 22 L56 6 L72 22 Z" fill="#f6eedb" stroke="#b9a37a" strokeWidth="1" />
        <path d="M37 26 L56 10 L75 26 Z" fill="#f2e7cf" stroke="#b9a37a" strokeWidth="1" />
        <path d="M34 30 L56 13 L78 30 Z" fill="#fbf4e4" stroke="#a9502c" strokeWidth="1.2" />
        <rect x="32" y="29" width="48" height="3" rx="1.5" fill="#7a4a2a" />
      </g>
      {/* thân xe */}
      <path
        d="M10 58 C10 46 16 42 26 41 L34 32 C36 30 39 29 42 29 L74 29 C78 29 81 30 84 33 L94 42 C104 43 112 47 112 58 Z"
        fill="#f3e3c3"
        stroke="#6b4a2e"
        strokeWidth="2"
      />
      <path d="M38 34 L46 34 L46 42 L31 42 Z" fill="#cfe3e6" stroke="#6b4a2e" strokeWidth="1.4" />
      <path d="M50 34 L72 34 C75 34 77 35 79 37 L84 42 L50 42 Z" fill="#cfe3e6" stroke="#6b4a2e" strokeWidth="1.4" />
      <rect x="10" y="49" width="102" height="4" fill="#b23a24" />
      <circle cx="107" cy="50" r="2.6" fill="#ffe7a3" stroke="#6b4a2e" strokeWidth="1" />
      <rect x="4" y="54" width="8" height="3" rx="1.5" fill="#7d6a58" />
      {/* bánh */}
      {[32, 90].map((x) => (
        <g key={x} transform={`translate(${x} 60)`}>
          <circle r="11" fill="#3a2a20" />
          <g className="cvw-car__wheel">
            <circle r="5.5" fill="#e9dcc0" />
            <path d="M0 -5.5 V5.5 M-5.5 0 H5.5" stroke="#3a2a20" strokeWidth="1.6" />
          </g>
        </g>
      ))}
    </svg>
  )
}
