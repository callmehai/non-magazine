import { useEffect, useMemo, useRef } from 'react'

/**
 * Cảnh nền sảnh: "Chiều sân đình Chuông" (xem .claude/skills/van-hoa-non-la).
 * Người xem đứng trên sân gạch nhìn về cổng đình Chuông (tam quan hai tầng: ba cửa vòm, gác mái ngói đầu đao,
 * hai cột trụ — vẽ theo ảnh thật) lúc chiều muộn. Nắng hắt qua cửa vòm thành quầng sáng sau chiếc nón 3D.
 * Hai bên: lũy tre xa, bụi tre gần đung đưa, giếng làng, cây cổ thụ, bó lá lụi và chồng nón bày trên sân (phiên chợ).
 * Bảng màu hoàng hôn hổ phách theo moodboard của nhóm (Espresso / Ember / Gold / Malibu).
 *
 * Mọi lớp vẽ bằng code (SVG, ngẫu nhiên có hạt giống cố định) trong một khung 1600×900, cắt theo màn hình
 * (xMidYMax slice). Rê chuột → các lớp lệch nhau theo độ sâu (parallax). Lúc đọc sách: cảnh tối và mờ đi làm nền.
 */
const VW = 1600
const VH = 900
const HORIZON = 640 // chân cổng đình, mép xa của sân
const VP = { x: 800, y: 600 } // điểm tụ của sân gạch

const C = {
  espresso: '#351904',
  ember: '#8b3a00',
  gold: '#e08e00',
  malibu: '#ffecb8',
  far: '#6a3210', // lũy tre xa: chìm trong sương chiều
  gate: '#2a1307',
  dark: '#1c0d05',
  rim: '#f6c46e', // viền nắng hắt ngược
}

function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const f = (v) => Math.round(v * 10) / 10

/** lá tre thuôn dài: gốc (x, y), hướng a (radian), dài L, nửa bề ngang W */
function leaf(x, y, a, L, W) {
  const c = Math.cos(a)
  const s = Math.sin(a)
  const tx = x + c * L
  const ty = y + s * L
  const mx = x + c * L * 0.38
  const my = y + s * L * 0.38
  return `M${f(x)} ${f(y)}Q${f(mx - s * W * 1.7)} ${f(my + c * W * 1.7)} ${f(tx)} ${f(ty)}Q${f(mx + s * W * 1.7)} ${f(my - c * W * 1.7)} ${f(x)} ${f(y)}Z`
}

/**
 * Một cây tre: thân thuôn cong vồng về ngọn (đường bậc hai), đốt tre, các nhánh lá ở nửa trên.
 * Trả về { body, nodes, leaves } là chuỗi path để gộp nhiều cây vào một <path>.
 */
function culm(r, x0, y0, h, lean, w0, k = 1) {
  const p1 = { x: x0 + lean * 0.08, y: y0 - h * 0.86 }
  const p2 = { x: x0 + lean, y: y0 - h + Math.abs(lean) * 0.18 }
  const at = (t) => {
    const u = 1 - t
    return {
      x: u * u * x0 + 2 * u * t * p1.x + t * t * p2.x,
      y: u * u * y0 + 2 * u * t * p1.y + t * t * p2.y,
      dx: 2 * u * (p1.x - x0) + 2 * t * (p2.x - p1.x),
      dy: 2 * u * (p1.y - y0) + 2 * t * (p2.y - p1.y),
    }
  }
  const N = 26
  const L = []
  const R = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    const p = at(t)
    const len = Math.hypot(p.dx, p.dy) || 1
    const w = w0 * (1 - t * 0.78)
    L.push([p.x - (p.dy / len) * -w, p.y + (p.dx / len) * -w])
    R.push([p.x + (p.dy / len) * -w, p.y - (p.dx / len) * -w])
  }
  const body =
    'M' +
    L.map(([x, y]) => `${f(x)} ${f(y)}`).join('L') +
    'L' +
    R.reverse()
      .map(([x, y]) => `${f(x)} ${f(y)}`)
      .join('L') +
    'Z'
  // đốt tre: vạch ngang ngắn, thưa dần lên ngọn
  let nodes = ''
  for (let t = 0.07; t < 0.8; t += 0.075 + t * 0.02) {
    const p = at(t)
    const len = Math.hypot(p.dx, p.dy) || 1
    const w = w0 * (1 - t * 0.78) * 1.25
    nodes += `M${f(p.x - (p.dy / len) * w)} ${f(p.y + (p.dx / len) * w)}L${f(p.x + (p.dy / len) * w)} ${f(p.y - (p.dx / len) * w)}`
  }
  // nhánh + chùm lá: nửa trên thân, xen hai bên, lá rủ xuống
  let leaves = ''
  let side = r() < 0.5 ? -1 : 1
  for (let t = 0.42; t <= 1.0001; t += 0.06 + r() * 0.05) {
    const p = at(Math.min(t, 1))
    side = -side
    const tw = (18 + r() * 26) * k
    const ang = Math.atan2(p.dy, p.dx) + side * (0.9 + r() * 0.5)
    const bx = p.x + Math.cos(ang) * tw
    const by = p.y + Math.sin(ang) * tw
    leaves += `M${f(p.x)} ${f(p.y)}L${f(bx)} ${f(by)}`
    const n = 3 + Math.floor(r() * 4)
    for (let j = 0; j < n; j++) {
      // lá tre rủ: hướng xuống, xoè quanh đầu nhánh
      const a = Math.PI / 2 + side * (0.25 + j * 0.32) + (r() - 0.5) * 0.5
      leaves += leaf(bx, by, a, (16 + r() * 12) * k, (2.1 + r() * 0.9) * k)
    }
  }
  return { body, nodes, leaves, tip: p2 }
}

/** lũy tre xa: dải bụi tre dày dọc chân trời */
function farBamboo() {
  const r = rng(7)
  let body = ''
  let leaves = ''
  for (let x = -40; x < VW + 40; x += 9 + r() * 10) {
    const h = 110 + r() * 150 + Math.sin(x / 140) * 30
    const c = culm(r, x, HORIZON + 4, h, (r() - 0.45) * 90, 2.2, 0.55)
    body += c.body
    leaves += c.leaves
  }
  return { body, leaves }
}

/** bụi tre gần ở mép trái: từng cây một nhóm riêng để đung đưa lệch nhịp */
function nearBamboo() {
  const r = rng(21)
  const out = []
  const bases = [-30, 10, 38, 66, 92, 128, 168, 200]
  bases.forEach((x, i) => {
    const h = 720 + r() * 260
    const lean = 160 + r() * 260 - i * 6
    out.push({ ...culm(r, x, VH + 30, h, lean, 9 - i * 0.35, 1.6), x, delay: -r() * 6, dur: 6 + r() * 4 })
  })
  return out
}

/** cây cổ thụ bên phải: thân + tán lá nhiều khối tròn, mép lá lởm chởm */
function bigTree() {
  const r = rng(33)
  let crown = ''
  const blobs = [
    [1460, 120, 150],
    [1330, 90, 120],
    [1560, 230, 130],
    [1220, 150, 95],
    [1400, 250, 120],
    [1600, 80, 140],
    [1290, 230, 80],
    [1500, 330, 90],
  ]
  for (const [cx, cy, rr] of blobs) {
    crown += `M${cx - rr} ${cy}a${rr} ${rr * 0.86} 0 1 0 ${rr * 2} 0a${rr} ${rr * 0.86} 0 1 0 ${-rr * 2} 0Z`
    // lá lởm chởm quanh mép khối
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2
      const x = cx + Math.cos(a) * rr * 0.98
      const y = cy + Math.sin(a) * rr * 0.84
      crown += leaf(x, y, a + (r() - 0.5), 14 + r() * 12, 4 + r() * 2)
    }
  }
  const trunk =
    'M1478 700C1470 560 1488 470 1450 360C1440 330 1420 300 1400 280L1418 274C1446 300 1468 330 1480 352C1488 300 1510 260 1540 236L1552 248C1520 284 1508 330 1506 380C1510 480 1504 580 1512 700Z'
  return { crown, trunk }
}

/** cổng đình Chuông (tam quan hai tầng) — toạ độ gốc tại tâm chân cổng, đơn vị px */
function gate() {
  const arch = (cx, hw, spring, bottom) => `M${cx - hw} ${bottom}V${spring}A${hw} ${hw} 0 0 1 ${cx + hw} ${spring}V${bottom}Z`
  const solid = [
    'M-196 0H196V-12H-196Z', // bậc nền
    'M-170 -12H170V-104H-170Z', // tầng dưới xây gạch
    'M-180 -104H180V-118H-180Z', // gờ
    'M-112 -118H112V-140H-112Z', // lan can tầng trên
    'M-86 -140H86V-168H-86Z', // gác
    // mái: dốc thoải, đầu đao cong vút và cuộn lên ở hai góc (kiểu đình Bắc Bộ, không phải mái thẳng)
    'M-150 -214Q-140 -182-108 -170L108 -170Q140 -182 150 -214Q146 -200 134 -196Q120 -192 106 -194L76 -208L-76 -208L-106 -194Q-120 -192-134 -196Q-146 -200-150 -214Z',
    'M-80 -208H80V-216H-80Z', // bờ nóc
    'M-80 -212q-12 0-16 -14q8 6 16 4Z M80 -212q12 0 16 -14q-8 6-16 4Z', // đầu kìm cong
    'M-6 -216h12v-8h-12Z M0 -236a8 8 0 1 0 0.01 0Z', // mặt nguyệt giữa nóc
    // hai cột trụ biểu sát hai đầu khối tam quan, chỉ nhô hơn gờ một chút: thân vuông, đầu cột hình lồng đèn, chóp
    'M-196 -12h20v-122h-20Z M-200 -134h28v-22h-28Z M-203 -156h34l-6 -7h-22Z M-190 -163h8v-10h-8Z',
    'M176 -12h20v-122h-20Z M172 -134h28v-22h-28Z M169 -156h34l-6 -7h-22Z M182 -163h8v-10h-8Z',
  ].join('')
  const glow = [arch(0, 30, -50, -12), arch(-106, 20, -42, -12), arch(106, 20, -42, -12)].join('')
  // ngói mũi hài: vạch dọc mảnh trên mái + vạch lan can + hai bức hoành phi
  let detail = ''
  for (let x = -100; x <= 100; x += 7) detail += `M${x} -205L${f(x * 1.04)} -172`
  for (let x = -104; x <= 104; x += 13) detail += `M${x} -120V-138`
  detail += 'M-74 -64h26v28h-26Z M48 -64h26v28h-26Z M-170 -60H170'
  const rim =
    'M-150 -214Q-146 -200-134 -196Q-120 -192-106 -194L-76 -208H76L106 -194Q120 -192 134 -196Q146 -200 150 -214 M-80 -216H80 M-203 -156h34 M169 -156h34'
  return { solid, glow, detail, rim }
}

/** sân gạch phối cảnh: mạch gạch tụ về điểm xa, hàng gạch dày dần về phía gần */
function floor() {
  let lines = ''
  for (let i = -26; i <= 26; i++) {
    const xb = VP.x + i * 92
    // chỉ vẽ từ chân trời trở xuống
    const t = (HORIZON - VP.y) / (VH - VP.y)
    lines += `M${f(VP.x + (xb - VP.x) * t)} ${HORIZON}L${f(xb)} ${VH}`
  }
  for (let i = 1; i <= 16; i++) {
    const y = HORIZON + (VH - HORIZON) * Math.pow(i / 16, 1.9)
    lines += `M0 ${f(y)}H${VW}`
  }
  return lines
}

/** giếng làng: thành gạch tròn thấp, cột tre và gàu múc */
function well(cx = 360, y = 724) {
  const rx = 60
  const ry = 14
  const h = 52
  return {
    // thân giếng gạch tròn + hai cột tre + xà ngang
    solid: `M${cx - rx} ${y}v-${h}a${rx} ${ry} 0 0 1 ${rx * 2} 0v${h}a${rx} ${ry} 0 0 1 ${-rx * 2} 0Z M${cx - rx + 6} ${y - h - 74}h7v74h-7Z M${cx + rx - 13} ${y - h - 74}h7v74h-7Z M${cx - rx + 2} ${y - h - 80}h${rx * 2 - 4}v7h${-(rx * 2 - 4)}Z`,
    mouth: `M${cx - rx + 7} ${y - h}a${rx - 7} ${ry - 3} 0 0 1 ${(rx - 7) * 2} 0a${rx - 7} ${ry - 3} 0 0 1 ${-(rx - 7) * 2} 0Z`,
    rim: `M${cx - rx} ${y - h}a${rx} ${ry} 0 0 1 ${rx * 2} 0 M${cx - rx + 2} ${y - h - 80}h${rx * 2 - 4}`,
    pulley: `M${cx + 10} ${y - h - 70}m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0`,
    rope: `M${cx + 3} ${y - h - 70}V${y - h - 26}`,
    bucket: `M${cx - 6} ${y - h - 26}h18l-3 15h-12Z`,
    bricks: Array.from({ length: 6 }, (_, i) => `M${cx - rx} ${y - h + 8 + i * 8}a${rx} ${ry} 0 0 0 ${rx * 2} 0`).join(''),
  }
}

/**
 * chồng nón trắng xếp lồng vào nhau như ở chợ Chuông: chỉ thấy chóp chiếc trên cùng (dáng thấp, không nhọn),
 * bên dưới là các vành cạp nâu đỏ chồng sát nhau
 */
function hatStack(x, y, n, rx) {
  const ry = rx * 0.22
  const gap = rx * 0.11
  const topY = y - (n - 1) * gap
  const h = rx * 0.62
  // khối: chóp trên cùng + thân chồng (hai mép thẳng, đáy cong theo vành dưới cùng)
  const body = `M${x - rx} ${topY}L${x} ${topY - h}L${x + rx} ${topY}V${y}a${rx} ${ry} 0 0 1 ${-rx * 2} 0Z`
  let rings = ''
  for (let i = 0; i < n; i++) rings += `M${x - rx} ${y - i * gap}a${rx} ${ry} 0 0 0 ${rx * 2} 0`
  // nửa trái chóp hứng nắng chiều (sáng hơn), núm chóp tròn
  const lit = `M${x} ${topY - h}L${x - rx} ${topY}a${rx} ${ry} 0 0 0 ${rx} ${ry}Z`
  const knob = `M${x - 3} ${topY - h + 1}a3 3 0 1 0 6 0a3 3 0 1 0 -6 0`
  return { body, rings, lit, knob }
}

/** gói một lớp SVG thành ảnh data URL: trình duyệt raster một lần, sau đó chỉ dịch / nghiêng ảnh trên GPU (không vẽ lại) */
const toImg = (inner) =>
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMax slice">${inner}</svg>`)

/** 4 lớp ảnh theo độ sâu: nền trời + lũy tre xa / sân + cổng đình / cây, giếng, chồng nón / bụi tre gần */
function useLayers() {
  return useMemo(() => {
    const s = {
      far: farBamboo(),
      near: nearBamboo(),
      tree: bigTree(),
      g: gate(),
      w: well(),
      // chồng nón bày bán trên sân như phiên chợ Chuông: gần thì to, xa thì nhỏ
      stacks: [hatStack(1150, 742, 5, 34), hatStack(1250, 764, 7, 44), hatStack(1372, 790, 6, 54)],
      floor: floor(),
    }
    const back = `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#140904"/><stop offset=".38" stop-color="${C.espresso}"/><stop offset=".6" stop-color="#6e2d06"/><stop offset=".71" stop-color="#c0650e"/><stop offset=".72" stop-color="#5e260a"/><stop offset="1" stop-color="#1f0d05"/></linearGradient>
<radialGradient id="sun" cx="800" cy="540" r="560" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${C.malibu}" stop-opacity=".95"/><stop offset=".16" stop-color="#f7b54a" stop-opacity=".75"/><stop offset=".45" stop-color="${C.gold}" stop-opacity=".28"/><stop offset="1" stop-color="${C.ember}" stop-opacity="0"/></radialGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9973a" stop-opacity="0"/><stop offset=".7" stop-color="#e9973a" stop-opacity=".38"/><stop offset="1" stop-color="#e9973a" stop-opacity=".12"/></linearGradient>
</defs>
<rect width="${VW}" height="${VH}" fill="url(#sky)"/><rect width="${VW}" height="${VH}" fill="url(#sun)"/>
<path d="${s.far.body}" fill="${C.far}"/><path d="${s.far.leaves}" fill="${C.far}" stroke="${C.far}" stroke-width=".6"/>
<rect y="${HORIZON - 150}" width="${VW}" height="160" fill="url(#haze)"/>`
    const yard = `<defs>
<linearGradient id="fl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8a3f12"/><stop offset=".35" stop-color="#5a240a"/><stop offset="1" stop-color="#220e05"/></linearGradient>
<radialGradient id="pool" cx="800" cy="700" r="420" gradientUnits="userSpaceOnUse" gradientTransform="translate(800 700) scale(1 .32) translate(-800 -700)"><stop offset="0" stop-color="#ffc56a" stop-opacity=".5"/><stop offset="1" stop-color="#ffc56a" stop-opacity="0"/></radialGradient>
</defs>
<rect y="${HORIZON}" width="${VW}" height="${VH - HORIZON}" fill="url(#fl)"/><rect y="${HORIZON}" width="${VW}" height="${VH - HORIZON}" fill="url(#pool)"/>
<path d="${s.floor}" stroke="#1a0a03" stroke-opacity=".38" stroke-width="1.2" fill="none"/>
<g transform="translate(1236 ${HORIZON + 2}) scale(1.06)">
<path d="${s.g.solid}" fill="${C.gate}" fill-rule="evenodd"/>
<path d="${s.g.glow}" fill="#ffcf7a" opacity=".85"/>
<path d="${s.g.detail}" stroke="#5c2c10" stroke-width=".8" fill="none"/>
<path d="${s.g.rim}" stroke="${C.rim}" stroke-opacity=".75" stroke-width="1.1" fill="none" stroke-linecap="round"/>
</g>`
    const mid =
      `<path d="${s.tree.trunk}" fill="${C.dark}"/><path d="${s.tree.crown}" fill="${C.dark}"/>
<path d="${s.w.solid}" fill="#241005"/><path d="${s.w.mouth}" fill="#0e0602"/>
<path d="${s.w.bricks}" stroke="#4a220c" stroke-width="1" fill="none"/>
<path d="${s.w.rim + s.w.rope + s.w.pulley}" stroke="${C.rim}" stroke-opacity=".5" stroke-width="1.2" fill="none"/>
<path d="${s.w.bucket}" fill="#3a1b09"/>` +
      s.stacks
        .map(
          (st) =>
            `<path d="${st.body}" fill="#a88c62"/><path d="${st.lit}" fill="#e3cf9f" opacity=".75"/><path d="${st.rings}" stroke="#6e2a14" stroke-width="1.6" fill="none"/><path d="${st.knob}" fill="#f3e6c6"/>`
        )
        .join('')
    const near = s.near
      .map(
        (c) =>
          `<path d="${c.body}" fill="#170a04"/><path d="${c.nodes}" stroke="#3c1d0b" stroke-width="2"/><path d="${c.leaves}" fill="#1d0c05" stroke="#1d0c05" stroke-width="1.2"/>`
      )
      .join('')
    return [
      { d: 0.1, src: toImg(back) },
      { d: 0.32, src: toImg(yard) },
      { d: 0.58, src: toImg(mid) },
      { d: 1, src: toImg(near), cls: 'is-near' },
    ]
  }, [])
}

/** lá tre rơi (nhẹ, thưa) */
const FALLING = Array.from({ length: 9 }, (_, i) => {
  const r = rng(90 + i)
  return { left: 4 + r() * 92, delay: -r() * 18, dur: 14 + r() * 10, size: 14 + r() * 10, drift: (r() - 0.5) * 160, spin: r() < 0.5 ? -1 : 1 }
})
const LEAF =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 12"><path d="${leaf(2, 6, 0, 36, 4)}" fill="#d9a54e"/></svg>`)

/**
 * active: đang ở sảnh. Lúc đọc sách cảnh đứng yên (không parallax, không lá rơi) để GPU nghỉ.
 */
export default function VillageBackdrop({ reducedMotion, active = true }) {
  const layers = useLayers()
  const ref = useRef(null)

  // parallax theo chuột: --px, --py trong [-1, 1], làm mượt bằng rAF; chỉ chạy ở sảnh
  useEffect(() => {
    if (reducedMotion || !active) return
    const el = ref.current
    let tx = 0
    let ty = 0
    let x = Number(el.style.getPropertyValue('--px')) || 0
    let y = Number(el.style.getPropertyValue('--py')) || 0
    let raf = 0
    const tick = () => {
      x += (tx - x) * 0.08
      y += (ty - y) * 0.08
      el.style.setProperty('--px', x.toFixed(3))
      el.style.setProperty('--py', y.toFixed(3))
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.002 ? requestAnimationFrame(tick) : 0
    }
    const onMove = (e) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1
      ty = (e.clientY / window.innerHeight) * 2 - 1
      if (!raf) raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [reducedMotion, active])

  return (
    <div ref={ref} className="village" aria-hidden="true">
      {layers.map((l, i) => (
        <div key={i} className={`village__layer ${l.cls ?? ''}`} style={{ '--d': l.d }}>
          <img src={l.src} alt="" decoding="async" draggable="false" />
        </div>
      ))}
      {!reducedMotion && active && (
        <div className="village__leaves">
          {FALLING.map((l, i) => (
            <img
              key={i}
              src={LEAF}
              alt=""
              style={{
                left: `${l.left}%`,
                width: l.size,
                animationDelay: `${l.delay}s`,
                animationDuration: `${l.dur}s`,
                '--drift': `${l.drift}px`,
                '--spin': l.spin,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
