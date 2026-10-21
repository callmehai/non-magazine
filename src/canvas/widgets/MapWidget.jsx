import { useEffect, useMemo, useRef, useState } from 'react'
import { useCanvasLang } from '../lang.js'
import { asset } from '../../lib/assets.js'
import { ensureFont } from '../fonts.js'
import map from './vnmap.json'
import trip from './route.json'
import { reducedMotion } from './webgl.js'

ensureFont('Patrick Hand')
ensureFont('Klee One')

/**
 * Bản đồ hành trình (mục 1.3), kiểu video "travel map":
 *  1. bản đồ Việt Nam chữ S (Natural Earth, bản theo quan điểm Việt Nam: có Hoàng Sa, Trường Sa)
 *  2. bấm vào → phóng tới Hà Nội, chuyển sang bản đồ đường phố sáng màu kiểu Google Maps / TravelBoast
 *     (vẽ sẵn từ dữ liệu OpenStreetMap: đường, sông hồ, công viên; tên quận huyện đặt theo ngôn ngữ đang xem)
 *  3. ghim điểm đi (Hồ Hoàn Kiếm) và điểm đến (Làng Chuông); camera sà xuống chiếc ô tô chở nón (nhìn từ trên)
 *  4. xe lăn bánh theo tuyến đường thật (OSRM / OpenStreetMap, qua Nguyễn Trãi – Hà Đông – QL21B), có khói,
 *     camera bám theo xe, vạch đỏ vẽ dần sau xe, đồng hồ đếm quãng đường tới 30,2 km (Google Maps)
 *  5. tới nơi: camera lùi ra thấy cả tuyến, ghim rơi xuống, thẻ ghi chú
 * route.json: hệ px của bản đồ nền (route-street.webp vẽ ở 1,5 lần hệ px này), tuyến đường + điểm mốc theo px của ảnh, nw/se = kinh vĩ độ hai góc.
 */
// tên vùng in trên bản đồ: [kinh độ, vĩ độ, tiếng Việt, tiếng Nhật]
const AREAS = [
  [105.8, 21.032, 'CẦU GIẤY', 'カウザイ'],
  [105.828, 21.017, 'ĐỐNG ĐA', 'ドンダー'],
  [105.806, 20.995, 'THANH XUÂN', 'タインスアン'],
  [105.853, 20.976, 'HOÀNG MAI', 'ホアンマイ'],
  [105.76, 21.015, 'NAM TỪ LIÊM', 'ナムトゥリエム'],
  [105.835, 20.925, 'THANH TRÌ', 'タインチー'],
  [105.79, 20.865, 'THANH OAI', 'タインオアイ'],
  [105.878, 21.005, 'Sông Hồng', 'ホン川'],
]
const L = {
  vi: {
    country: 'VIỆT NAM',
    sea: 'Biển Đông',
    paracel: 'Quần đảo Hoàng Sa',
    spratly: 'Quần đảo Trường Sa',
    hint: 'Bấm vào bản đồ: lên xe về Làng Chuông!',
    from: 'Hồ Hoàn Kiếm, Hà Nội',
    mid: 'Hà Đông',
    to: 'Làng Chuông',
    arrived: 'Tới Làng Chuông rồi!',
    trip: (km) => `${km} km · khoảng 53 phút đi ô tô theo QL21B`,
    place: 'xã Phương Trung, thành phố Hà Nội',
    km: 'km',
    again: 'Đi lại',
    back: 'Toàn cảnh Việt Nam',
    credit: 'Bản đồ: © OpenStreetMap contributors · Tuyến đường: OSRM · Quãng đường: Google Maps',
    areas: AREAS.map((a) => a[2]),
  },
  ja: {
    country: 'ベトナム',
    sea: '東海（ビエンドン）',
    paracel: 'ホアンサ諸島',
    spratly: 'チュオンサ諸島',
    hint: '地図をクリック：車でチュオン村へ出発！',
    from: 'ホアンキエム湖（ハノイ）',
    mid: 'ハドン',
    to: 'チュオン村',
    arrived: 'チュオン村に到着！',
    trip: (km) => `${km} km・国道21B号線経由で車で約53分`,
    place: 'ハノイ市フオンチュン社',
    km: 'km',
    again: 'もう一度',
    back: 'ベトナム全図へ',
    credit: '地図：© OpenStreetMap contributors・ルート：OSRM・距離：Google Maps',
    areas: AREAS.map((a) => a[3]),
  },
}

// ── bản đồ chữ S (đơn vị bản đồ của vnmap.json)
const P = (lat, lon) => [(lon - map.lon0) * map.k * map.cl, (map.lat0 - lat) * map.k]
const [HX, HY] = P(21.0287, 105.8521)
const WORLD = { x: 360, y: 380, s: 660 }
// vùng ảnh vệ tinh trên bản đồ chữ S (để phóng tới đúng chỗ rồi chuyển cảnh)
const SAT_NW = P(trip.nw[1], trip.nw[0])
const SAT_SE = P(trip.se[1], trip.se[0])
const SAT_VIEW = { x: (SAT_NW[0] + SAT_SE[0]) / 2, y: (SAT_NW[1] + SAT_SE[1]) / 2, s: (SAT_SE[1] - SAT_NW[1]) * 0.95 }

// ── tuyến đường trên ảnh vệ tinh (px của ảnh)
const R = trip.route
const SEG = R.slice(1).map((p, i) => Math.hypot(p[0] - R[i][0], p[1] - R[i][1]))
const LEN = SEG.reduce((a, b) => a + b, 0)
function at(d) {
  let i = 0
  while (i < SEG.length - 1 && d > SEG[i]) d -= SEG[i++]
  const k = Math.min(1, d / (SEG[i] || 1))
  const [a, b] = [R[i], R[i + 1]]
  return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, ang: (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI }
}
const merY = (lat) => Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360))
const geo = (lon, lat) => [
  ((lon - trip.nw[0]) / (trip.se[0] - trip.nw[0])) * trip.w,
  ((merY(trip.nw[1]) - merY(lat)) / (merY(trip.nw[1]) - merY(trip.se[1]))) * trip.h,
]
const AREA_PX = AREAS.map(([lon, lat]) => geo(lon, lat))
// hướng xe: nhìn trước / sau một đoạn trên tuyến cho mượt (không giật ở mỗi khúc gấp)
function heading(d) {
  const a = at(Math.max(0, d - 22))
  const b = at(Math.min(LEN, d + 22))
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
}
const PARK = LEN - 70 // xe dừng ngay trước ghim Làng Chuông (không đè lên ghim / nhãn)
const BOX = (() => {
  const xs = R.map((p) => p[0])
  const ys = R.map((p) => p[1])
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }
})()

const T_ZOOM = 1700
const T_FADE = 700
const T_PINS = 900
const T_DIVE = 1800
const T_POP = 450
const T_DRIVE = 16000 // xe đi chậm, camera ở xa (góp ý: nhanh quá, chóng mặt)
const T_OUT = 1800

const clamp01 = (v) => Math.min(1, Math.max(0, v))
/** khung nhìn luôn nằm trong ảnh nền (không lộ mép trống khi camera bám xe ở gần rìa bản đồ) */
function inside(v, { w, h }) {
  const s = Math.max(v.s, w / trip.w, h / trip.h)
  const hx = w / 2 / s
  const hy = h / 2 / s
  return { x: Math.min(trip.w - hx, Math.max(hx, v.x)), y: Math.min(trip.h - hy, Math.max(hy, v.y)), s }
}
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)

/** nội suy phóng to quanh một điểm: điểm đích trôi đều trên màn hình trong lúc khung nhìn co lại */
function lerpView(a, b, t) {
  const s = Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * t)
  const k = a.s === b.s ? t : (1 / s - 1 / a.s) / (1 / b.s - 1 / a.s)
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, s }
}

const IDLE = { phase: 'world', sat: 0, cam: null, pins: 0, pop: 0, drive: 0, end: 0 }

export default function MapWidget({ el, interactive, visible }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const t = L[lang]
  const aspect = el.w / el.h
  const rootRef = useRef(null)
  const fxRef = useRef(null)
  const raf = useRef(0)
  const [size, setSize] = useState({ w: 500, h: 400 })
  const [view, setView] = useState(WORLD) // khung nhìn bản đồ chữ S
  const [st, setSt] = useState(IDLE)

  useEffect(() => {
    const node = rootRef.current
    if (!node) return
    const ro = new ResizeObserver(() => setSize({ w: node.offsetWidth, h: node.offsetHeight }))
    ro.observe(node)
    return () => ro.disconnect()
  }, [])
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  // rời trang thì về lại toàn cảnh (lần sau mở trang người đọc lại được bấm)
  useEffect(() => {
    if (visible) return
    cancelAnimationFrame(raf.current)
    setView(WORLD)
    setSt(IDLE)
  }, [visible])

  // camera trên ảnh vệ tinh: khung vừa cả tuyến, và khung bám xe (gần hơn); tính theo cỡ khung hiện tại
  const sizeRef = useRef(size)
  sizeRef.current = size
  const fitOf = ({ w, h }) => {
    // vừa cả tuyến trong khung, chừa lề (px màn hình) cho ghim + nhãn ở trên, nút ở góc, chữ nguồn ở dưới;
    // bản đồ nền luôn phủ kín khung (không lộ mép)
    const top = 84
    const bot = 40
    const side = 40
    const s = Math.min((w - 2 * side) / (BOX.x1 - BOX.x0), (h - top - bot) / (BOX.y1 - BOX.y0)) || 0.1
    return inside({ x: (BOX.x0 + BOX.x1) / 2, y: (BOX.y0 + BOX.y1) / 2 - (top - bot) / 2 / s, s }, { w, h })
  }
  const fit = useMemo(() => fitOf(size), [size])

  const puff = (x, y) => {
    const fx = fxRef.current
    if (!fx) return
    const d = document.createElement('i')
    d.className = 'cvw-trip__puff'
    d.style.left = `${x}px`
    d.style.top = `${y}px`
    fx.appendChild(d)
    setTimeout(() => d.remove(), 1200)
  }

  const run = (fromWorld) => {
    cancelAnimationFrame(raf.current)
    fxRef.current?.querySelectorAll('.cvw-trip__puff').forEach((n) => n.remove())
    if (reducedMotion()) {
      setView(SAT_VIEW)
      setSt({ phase: 'done', sat: 1, cam: null, pins: 1, pop: 1, drive: 1, end: 1 })
      return
    }
    const v0 = view
    const t0 = performance.now()
    const tz = fromWorld ? T_ZOOM : 0
    let lastPuff = 0
    const frame = (now) => {
      const e = now - t0
      if (tz) setView(lerpView(v0, SAT_VIEW, ease(clamp01(e / tz))))
      const sat = fromWorld ? clamp01((e - tz + 250) / T_FADE) : 1
      const e1 = e - tz - (fromWorld ? T_FADE * 0.6 : 0)
      const pins = clamp01(e1 / 400)
      const e2 = e1 - T_PINS
      const dive = easeInOut(clamp01(e2 / T_DIVE))
      const e3 = e2 - T_DIVE
      const pop = clamp01(e3 / T_POP)
      const drive = easeInOut(clamp01((e3 - T_POP) / T_DRIVE))
      const e4 = e3 - T_POP - T_DRIVE
      const out = easeInOut(clamp01(e4 / T_OUT))
      const car = at(drive * PARK)
      const sz = sizeRef.current
      const fit = fitOf(sz)
      const follow = fit.s * 1.8
      // camera: khung toàn tuyến → sà xuống xe → bám xe → lùi ra khung toàn tuyến
      const near = { x: car.x, y: car.y, s: follow }
      const cam = inside(e4 > 0 ? lerpView(near, fit, out) : e3 > 0 ? near : lerpView(fit, near, dive), sz)
      if (drive > 0 && drive < 1 && now - lastPuff > 70) {
        lastPuff = now
        const backA = ((heading(drive * PARK) + 180) * Math.PI) / 180
        puff((car.x - cam.x) * cam.s + sz.w / 2 + Math.cos(backA) * 16, (car.y - cam.y) * cam.s + sz.h / 2 + Math.sin(backA) * 16)
      }
      const done = e4 >= T_OUT
      setSt({ phase: done ? 'done' : 'trip', sat, cam: done ? null : cam, pins, pop, drive, end: clamp01(e4 / 500) })
      if (!done) raf.current = requestAnimationFrame(frame)
    }
    raf.current = requestAnimationFrame(frame)
  }

  const go = () => interactive && visible && st.phase === 'world' && run(true)
  const again = (e) => {
    e.stopPropagation()
    run(false)
  }
  const back = (e) => {
    e.stopPropagation()
    cancelAnimationFrame(raf.current)
    const t0 = performance.now()
    const frame = (now) => {
      const k = clamp01((now - t0) / 1500)
      setView(lerpView(SAT_VIEW, WORLD, ease(k)))
      setSt((s) => ({ ...s, phase: k < 1 ? 'leaving' : 'world', sat: 1 - clamp01(k * 3) }))
      if (k < 1) raf.current = requestAnimationFrame(frame)
      else setSt(IDLE)
    }
    raf.current = requestAnimationFrame(frame)
  }

  // ── bản đồ chữ S
  const vw = view.s * aspect
  const vb = `${view.x - vw / 2} ${view.y - view.s / 2} ${vw} ${view.s}`
  const u = view.s / el.h
  const far = 1 - clamp01((WORLD.s / view.s - 1.2) / 1.5)
  const label = (x, y, text, sz, o = {}) => (
    <text
      x={x}
      y={y}
      fontSize={sz * u}
      textAnchor={o.anchor ?? 'middle'}
      className={`cvw-map__label ${o.cls ?? ''}`}
      style={{ letterSpacing: o.track ? `${o.track * u}px` : undefined }}
    >
      {text}
    </text>
  )

  // ── ảnh vệ tinh
  const cam = st.cam ?? fit
  const sat = st.sat
  const toScr = (x, y) => [(x - cam.x) * cam.s + size.w / 2, (y - cam.y) * cam.s + size.h / 2]
  const car = at(st.drive * PARK)
  const carAng = heading(st.drive * PARK)
  const carScr = toScr(car.x, car.y)
  const [fx, fy] = toScr(...trip.places.hanoi)
  const [mx, my] = toScr(...trip.places.hadong)
  const [tx, ty] = toScr(...trip.places.chuong)
  const dec = (v) => (lang === 'vi' ? v.replace('.', ',') : v)
  const pathD = 'M' + R.map((p) => p.join(',')).join('L')

  return (
    <div ref={rootRef} className={`cvw cvw-map cvw-trip is-${st.phase} ${interactive ? 'is-live' : ''}`} data-no-flip={interactive ? '' : undefined}>
      <svg
        className="cvw-map__svg"
        viewBox={vb}
        preserveAspectRatio="xMidYMid slice"
        onClick={go}
        role={interactive ? 'button' : 'img'}
        aria-label={t.hint}
        style={{ opacity: 1 - sat }}
      >
        <rect x={-200} y={-200} width={map.w + 400} height={map.h + 400} className="cvw-map__sea" />
        <path d={map.neighbors} className="cvw-map__nb" vectorEffect="non-scaling-stroke" />
        <path d={map.vn} className="cvw-map__vn" vectorEffect="non-scaling-stroke" />
        <path d={map.hanoi} className="cvw-map__hn" vectorEffect="non-scaling-stroke" />
        <path d={map.rivers} className="cvw-map__river" vectorEffect="non-scaling-stroke" />
        {map.islets.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={2.2 * u} className="cvw-map__islet" />
        ))}
        <g style={{ opacity: far }}>
          {label(352, 392, t.country, 17, { anchor: 'start', cls: 'is-country', track: 4 })}
          {label(470, 520, t.sea, 13, { cls: 'is-sea' })}
          {label(555, 300, t.paracel, 10.5, { cls: 'is-islands' })}
          {label(612, 585, t.spratly, 10.5, { cls: 'is-islands' })}
          <circle cx={HX} cy={HY} r={11 * u} className="cvw-map__pulse" />
          <circle cx={HX} cy={HY} r={4.5 * u} className="cvw-map__dot" />
        </g>
      </svg>

      {sat > 0 && (
        <div className="cvw-sat" style={{ opacity: sat }}>
          <div
            className="cvw-sat__world"
            style={{ width: trip.w, height: trip.h, transform: `translate(${size.w / 2 - cam.x * cam.s}px, ${size.h / 2 - cam.y * cam.s}px) scale(${cam.s})` }}
          >
            <img src={asset('assets/book/map/route-street.webp')} alt="" draggable="false" />
            <svg viewBox={`0 0 ${trip.w} ${trip.h}`} className="cvw-sat__route">
              {AREA_PX.map(([x, y], i) => (
                <text key={i} x={x} y={y} className={`cvw-sat__area ${i === AREAS.length - 1 ? 'is-water' : ''}`} fontSize={Math.max(9, size.w / 40) / cam.s}>
                  {t.areas[i]}
                </text>
              ))}
              <path d={pathD} className="cvw-sat__ghost" strokeWidth={5 / cam.s} />
              <path d={pathD} className="cvw-sat__line" strokeWidth={6 / cam.s} style={{ strokeDasharray: LEN, strokeDashoffset: LEN - (st.phase === 'done' ? LEN : st.drive * PARK) }} />
            </svg>
          </div>
          <div ref={fxRef} className="cvw-trip__fx" aria-hidden="true">
            <Pin x={fx} y={fy} show={st.pins} kind="from" text={t.from} />
            <Pin x={tx} y={ty} show={st.pins} kind="to" text={t.to} />
            {st.drive > 0.2 && st.phase === 'trip' && (
              <span className="cvw-trip__tag" style={{ left: mx, top: my }}>
                {t.mid}
              </span>
            )}
            {st.pop > 0 && (
              <div
                className="cvw-trip__car"
                style={{
                  transform: `translate(${carScr[0]}px, ${carScr[1]}px) rotate(${carAng + 90}deg) scale(${st.pop < 1 ? st.pop * (1 + Math.sin(st.pop * Math.PI) * 0.4) : 1})`,
                }}
              >
                <CarTop />
              </div>
            )}
          </div>
          {st.pop > 0 && st.phase !== 'done' && (
            <div className="cvw-trip__km">
              <b>{dec((trip.km * st.drive).toFixed(1))}</b> {t.km}
            </div>
          )}
          <span className="cvw-trip__credit">{t.credit}</span>
        </div>
      )}

      {interactive && st.phase === 'world' && <span className="cvw-chip cvw-map__hint">{t.hint}</span>}
      {st.phase === 'done' && (
        <div
          className="cvw-trip__card"
          style={{
            // thẻ "tới nơi" gắn ngay cạnh ghim Làng Chuông (cuối tuyến), không trôi giữa bản đồ
            left: tx < size.w / 2 ? tx + 62 : undefined,
            right: tx < size.w / 2 ? undefined : size.w - tx + 62,
            top: Math.min(size.h - 30, Math.max(70, ty - 18)),
            maxWidth: Math.max(140, (tx < size.w / 2 ? size.w - tx : tx) - 74),
          }}
        >
          <b>{t.arrived}</b>
          <span>{t.trip(dec(String(trip.km)))}</span>
          <span>{t.place}</span>
        </div>
      )}
      {(st.phase === 'done' || st.phase === 'trip') && (
        <div className="cvw-trip__btns">
          <button type="button" className="cvw-chip" onClick={back}>
            ← {t.back}
          </button>
          {st.phase === 'done' && (
            <button type="button" className="cvw-chip" onClick={again}>
              ↻ {t.again}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** ghim điểm đi / điểm đến + nhãn viết tay */
function Pin({ x, y, show, kind, text }) {
  if (!show) return null
  return (
    <span className={`cvw-pin is-${kind}`} style={{ left: x, top: y, opacity: show }}>
      <svg viewBox="-12 -32 24 34">
        <path d="M0 0 C -5 -9 -11 -13 -11 -21 A 11 11 0 1 1 11 -21 C 11 -13 5 -9 0 0 Z" />
        <circle cx={0} cy={-21} r={4.2} />
      </svg>
      <em>{text}</em>
    </span>
  )
}

/** ô tô nhìn từ trên xuống (đầu xe hướng lên), trên nóc một chiếc nón lá */
function CarTop() {
  return (
    <svg viewBox="-20 -34 40 68" className="cvw-cartop">
      <ellipse cx="0" cy="3" rx="17" ry="31" fill="rgba(0,0,0,.28)" />
      {[
        [-14, -19],
        [14, -19],
        [-14, 18],
        [14, 18],
      ].map(([x, y]) => (
        <rect key={`${x}${y}`} x={x - 3} y={y - 6} width="6" height="12" rx="2" fill="#2b2118" />
      ))}
      <rect x="-13" y="-31" width="26" height="62" rx="11" fill="#f3e3c3" stroke="#6b4a2e" strokeWidth="1.6" />
      <rect x="-13" y="-31" width="26" height="9" rx="6" fill="#b23a24" />
      <path d="M-10 -18 Q0 -23 10 -18 L9 -10 L-9 -10 Z" fill="#9cc7d3" stroke="#6b4a2e" strokeWidth="1" />
      <path d="M-9 17 L9 17 L10 23 Q0 26 -10 23 Z" fill="#9cc7d3" stroke="#6b4a2e" strokeWidth="1" />
      {/* nón lá trên nóc: vòng tròn đồng tâm, chóp ở giữa */}
      <circle cx="0" cy="3" r="11.5" fill="#fbf4e4" stroke="#b9a37a" strokeWidth="1" />
      <circle cx="0" cy="3" r="8" fill="none" stroke="#d9c7a0" strokeWidth=".8" />
      <circle cx="0" cy="3" r="4.5" fill="none" stroke="#d9c7a0" strokeWidth=".8" />
      <circle cx="0" cy="3" r="1.4" fill="#a9502c" />
      <circle cx="-8" cy="-29" r="2" fill="#ffe7a3" />
      <circle cx="8" cy="-29" r="2" fill="#ffe7a3" />
    </svg>
  )
}
