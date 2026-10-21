import * as THREE from 'three'

/**
 * Kích thước nón (đơn vị scene): bán kính vành và chiều cao chóp.
 * Nón Chuông: vành ~41cm, cao ~18–19cm → chóp khá dốc, thành thẳng.
 */
export const HAT = { R: 1, H: 0.86, RINGS: 16 }

let cachedTextures = null

/**
 * Texture vẽ bằng canvas theo ảnh nón Chuông thật (canvas y = 0 là đỉnh chóp, y = h là vành):
 * Theo mô tả trong sách (chương 2): khung 16 vòng nứa cách đều (vòng 16 là vòng cạp), lợp 3 lớp — lá lụi
 * (17–18 tàu) / mo nang (5 tàu) / lá lụi, khâu bằng sợi cước vào từng vòng, cạp bọc sợi liếc, chỉ nhôi màu
 * trong lòng nón để buộc quai, ngoài cùng quét dầu bóng.
 *  - ngoài: 18 tàu lá trắng ngà nhiều gân nhỏ, bóng mo thấp thoáng, 15 đường khâu cước trắng, núm chóp, cạp nâu đỏ
 *  - trong: lá sáng màu, vòng nứa nổi rõ, bông chỉ đỏ giữa chóp, hai mảng chỉ nhôi đỏ – xanh
 */
function makeTextures(size = 2048) {
  if (cachedTextures) return cachedTextures
  const w = size
  const h = size / 2
  const k = size / 2048 // tỉ lệ nét vẽ theo cỡ texture
  const rand = mulberry32(11)
  const canvas = () => {
    const el = document.createElement('canvas')
    el.width = w
    el.height = h
    return [el, el.getContext('2d')]
  }
  const [color, c] = canvas()
  const [bump, b] = canvas()
  const [inside, n] = canvas()

  // ── nền: trắng ngà, đầm hơn một chút về phía vành
  const base = c.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#efe4c9')
  base.addColorStop(0.45, '#e4d3aa')
  base.addColorStop(1, '#d6bf8d')
  c.fillStyle = base
  c.fillRect(0, 0, w, h)
  b.fillStyle = '#808080'
  b.fillRect(0, 0, w, h)
  const inBase = n.createLinearGradient(0, 0, 0, h)
  inBase.addColorStop(0, '#f1e7d0')
  inBase.addColorStop(1, '#e6d6b2')
  n.fillStyle = inBase
  n.fillRect(0, 0, w, h)

  // ── lá lụi: mỗi lớp 17–18 tàu lá xếp chồng quanh khung (theo nội dung sách, mục 2.3 bước 4).
  // Mỗi tàu lá rộng, nhiều gân nhỏ song song chạy từ chóp xuống vành; mép tàu này đè lên tàu kia.
  const leaves = 18
  const lw = w / leaves
  for (let i = 0; i < leaves; i++) {
    const x0 = i * lw + (rand() - 0.5) * lw * 0.25
    const tone = (rand() - 0.5) * 2
    c.fillStyle = tone > 0 ? `rgba(255,253,244,${tone * 0.18})` : `rgba(196,160,98,${-tone * 0.14})`
    c.fillRect(x0, 0, lw * 1.08, h)
    n.fillStyle = tone > 0 ? `rgba(255,252,242,${tone * 0.12})` : `rgba(170,140,90,${-tone * 0.06})`
    n.fillRect(x0, 0, lw * 1.08, h)
    // gân lá: dày, mảnh, gần như song song (tàu lá đã được là phẳng)
    for (let x = x0; x < x0 + lw * 1.08; x += (3.2 + rand() * 2.6) * k) {
      const strong = rand() < 0.18
      c.fillStyle = strong ? `rgba(135,100,52,${0.14 + rand() * 0.1})` : `rgba(150,118,68,${0.06 + rand() * 0.06})`
      c.fillRect(x, 0, (strong ? 1 : 0.6) * k, h)
      if (rand() < 0.35) {
        c.fillStyle = `rgba(255,255,250,${0.12 + rand() * 0.15})`
        c.fillRect(x + 1.2 * k, 0, 0.8 * k, h)
      }
      if (rand() < 0.3) {
        n.fillStyle = `rgba(150,120,72,${0.04 + rand() * 0.04})`
        n.fillRect(x, 0, 0.6 * k, h)
      }
    }
    // mép tàu lá đè lên tàu bên cạnh: một vệt bóng + một vệt sáng
    const edge = x0 + lw * 1.08
    c.fillStyle = 'rgba(110,82,42,0.28)'
    c.fillRect(edge - 1.6 * k, 0, 1.6 * k, h)
    c.fillStyle = 'rgba(255,255,250,0.45)'
    c.fillRect(edge - 3 * k, 0, 1.2 * k, h)
    n.fillStyle = 'rgba(140,110,65,0.16)'
    n.fillRect(edge - 1.2 * k, 0, 1.2 * k, h)
    b.fillStyle = '#5c5c5c'
    b.fillRect(edge - 1.6 * k, 0, 1.6 * k, h)
    b.fillStyle = '#a8a8a8'
    b.fillRect(edge - 3.2 * k, 0, 1.6 * k, h)
  }
  // lớp giữa: 5 tàu mo nang vàng óng, thấp thoáng sau lá lụi mỏng
  for (let i = 0; i < 5; i++) {
    const x = (i / 5) * w + rand() * (w / 10)
    const mg = c.createLinearGradient(x, 0, x + w / 5, 0)
    mg.addColorStop(0, 'rgba(205,165,90,0)')
    mg.addColorStop(0.5, 'rgba(205,165,90,0.07)')
    mg.addColorStop(1, 'rgba(205,165,90,0)')
    c.fillStyle = mg
    c.fillRect(x, h * 0.05, w / 5, h * 0.95)
  }
  // thớ lá ngắn, rất nhẹ
  for (let i = 0; i < 1800; i++) {
    const x = rand() * w
    const y = rand() * h
    c.strokeStyle = rand() > 0.5 ? `rgba(140,108,60,${0.04 + rand() * 0.05})` : `rgba(255,253,244,${0.06 + rand() * 0.08})`
    c.lineWidth = (0.5 + rand() * 0.6) * k
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + (rand() - 0.5) * 2, y + (20 + rand() * 120) * k)
    c.stroke()
  }

  // ── 15 vòng nứa + đường khâu sợi cước (vòng 16 là vòng cạp)
  for (let ring = 1; ring < HAT.RINGS; ring++) {
    const f = ring / HAT.RINGS
    const y = f * h
    // gờ nan nổi dưới lá
    c.fillStyle = 'rgba(255,253,246,0.4)'
    c.fillRect(0, y - 3.5 * k, w, 1.6 * k)
    c.fillStyle = 'rgba(120,90,48,0.2)'
    c.fillRect(0, y + 1.5 * k, w, 2 * k)
    const g = b.createLinearGradient(0, y - 5 * k, 0, y + 5 * k)
    g.addColorStop(0, '#808080')
    g.addColorStop(0.5, '#d8d8d8')
    g.addColorStop(1, '#808080')
    b.fillStyle = g
    b.fillRect(0, y - 5 * k, w, 10 * k)
    // mặt trong: nan tre lộ rõ
    n.fillStyle = 'rgba(196,164,108,0.55)'
    n.fillRect(0, y - 2 * k, w, 3.2 * k)
    n.fillStyle = 'rgba(255,250,236,0.5)'
    n.fillRect(0, y - 3 * k, w, 1 * k)
    // mũi khâu: khoảng cách thật đều nhau → trên texture giãn ra ở vòng nhỏ gần chóp
    // sợi cước khâu lá vào vòng: mũi đều tăm tắp (khoảng cách thật như nhau trên mọi vòng)
    const step = (8 * k) / Math.max(f, 0.12)
    const len = Math.min(step * 0.7, 7 * k)
    for (let x = (ring * 3.7 * k) % step; x < w; x += step) {
      c.fillStyle = 'rgba(95,72,40,0.12)'
      c.fillRect(x + 0.5 * k, y + 0.6 * k, len, 1 * k)
      c.fillStyle = 'rgba(255,255,255,0.82)'
      c.fillRect(x, y - 1 * k, len, 1.5 * k)
      b.fillStyle = '#ffffff'
      b.fillRect(x, y - 1.2 * k, len, 1.9 * k)
      n.fillStyle = 'rgba(250,248,240,0.7)'
      n.fillRect(x, y - 0.8 * k, 1.4 * k, 3 * k)
    }
  }

  // ── núm chóp trắng (ngoài) và bông chỉ đỏ (trong)
  const tip = 0.045 * h
  const tg = c.createLinearGradient(0, 0, 0, tip)
  tg.addColorStop(0, '#fbf8f1')
  tg.addColorStop(0.85, '#f3ecdc')
  tg.addColorStop(1, 'rgba(243,236,220,0)')
  c.fillStyle = tg
  c.fillRect(0, 0, w, tip)
  for (let x = 0; x < w; x += 6 * k) {
    c.fillStyle = 'rgba(170,150,110,0.25)'
    c.fillRect(x, 0, 1 * k, tip * 0.8)
  }
  n.fillStyle = '#b3241d'
  n.fillRect(0, 0, w, 0.045 * h)
  n.fillStyle = '#d63a2c'
  n.fillRect(0, 0.012 * h, w, 0.008 * h)
  n.fillStyle = '#e8d9b6'
  n.fillRect(0, 0.026 * h, w, 0.004 * h)
  for (let x = 0; x < w; x += 9 * k) {
    n.fillStyle = 'rgba(200,40,30,0.85)'
    n.fillRect(x, 0.045 * h, 2 * k, 0.02 * h)
  }

  // ── vành cạp: khâu bọc bằng sợi liếc (vỏ nâu sẫm, bóng) — trên nón thật ánh nâu đỏ
  const rimY = h * 0.986
  c.fillStyle = '#6b2418'
  c.fillRect(0, rimY, w, h - rimY)
  n.fillStyle = '#6b2418'
  n.fillRect(0, rimY, w, h - rimY)
  for (let x = 0; x < w; x += 4 * k) {
    c.strokeStyle = 'rgba(190,105,70,0.55)'
    c.lineWidth = 1.2 * k
    c.beginPath()
    c.moveTo(x, rimY)
    c.lineTo(x + 3 * k, h)
    c.stroke()
  }

  // ── chỉ nhôi trong lòng nón: hai mảng phẳng đối nhau, dài theo vòng nón, sát phía vành (theo ảnh nón cô dâu nhóm gửi):
  // chỉ đỏ căng chéo giữa hai vòng nan thành lưới mắt cáo, hai đầu thưa dần; giữa mảng là dải chỉ xanh xen trắng đan chéo
  const nhoi = (cx) => {
    const y1 = h * (9.5 / 16)
    const y2 = h * (13.5 / 16)
    const half = w * 0.055
    // u: -1..1 dọc theo vòng nón, v: 0 (phía chóp)..1 (phía vành)
    const at = (u, v) => [cx + u * half, y1 + v * (y2 - y1)]
    const thread = (u0, u1, color, width) => {
      n.strokeStyle = color
      n.lineWidth = width * k
      n.beginPath()
      n.moveTo(...at(u0, 0))
      n.lineTo(...at(u1, 1))
      n.stroke()
    }
    const red = () => `rgb(${215 + rand() * 25},${38 + rand() * 24},${40 + rand() * 16})`
    const lean = 0.9
    for (const side of [-1, 1]) {
      for (let u = 0.12; u < 0.8; u += 0.045) {
        const p = side * u
        thread(p, p + side * lean, red(), 2.4)
        thread(p + side * lean, p, red(), 2.4)
      }
    }
    for (let u = -0.42; u <= -0.08; u += 0.04) {
      thread(u, u + lean * 0.55, '#2234b8', 2.6)
      thread(u + lean * 0.55, u, '#2234b8', 2.6)
      thread(u + 0.02, u + 0.02 + lean * 0.55, 'rgba(255,250,240,0.9)', 1.4)
    }
  }
  nhoi(w * 0.25)
  nhoi(w * 0.75)

  const tex = (el, srgb) => {
    const t = new THREE.CanvasTexture(el)
    if (srgb) t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.RepeatWrapping
    return t
  }
  cachedTextures = { map: tex(color, true), bumpMap: tex(bump, false), insideMap: tex(inside, true) }
  return cachedTextures
}

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** quai nón: dải lụa dẹt (không phải ống tròn), mặt dải quay vào trong; twist = độ xoắn nhẹ ở giữa dải (radian) */
function ribbonGeometry(curve, width, segments, twist = 0) {
  const pos = []
  const uv = []
  const idx = []
  const z = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const p = curve.getPointAt(t)
    const tan = curve.getTangentAt(t)
    const side = z
      .clone()
      .sub(tan.clone().multiplyScalar(tan.dot(z)))
      .normalize()
      .applyAxisAngle(tan, Math.sin(Math.PI * t) * twist)
      .multiplyScalar(width / 2)
    pos.push(p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z)
    uv.push(t, 0, t, 1)
    if (i < segments) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

/**
 * Tạo một chiếc nón lá Làng Chuông 3D hoàn toàn bằng code.
 * Trả về group + các bộ phận để làm hiệu ứng "đan nón" (vòng nan → lợp lá → quai).
 */
export function createNonLa({ textureSize = 2048, anisotropy = 4 } = {}) {
  const { R, H, RINGS } = HAT
  const { map, bumpMap, insideMap } = makeTextures(textureSize)
  map.anisotropy = anisotropy
  insideMap.anisotropy = anisotropy

  const group = new THREE.Group()
  group.name = 'non-la'

  // mặt nón: thành thẳng, phồng rất nhẹ ở giữa (lá căng trên 16 vòng nan)
  const pts = []
  const N = 48
  for (let i = 0; i <= N; i++) {
    const t = i / N // 0 = vành, 1 = đỉnh
    const r = Math.max(0.0001, R * (1 - t))
    const y = H * t + Math.sin(Math.PI * t) * 0.012
    pts.push(new THREE.Vector2(r, y))
  }
  const surface = new THREE.LatheGeometry(pts, 192)

  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 10)
  // lớp dầu bóng quét ngoài cùng (bước 8): màng trong suốt, bóng nhẹ
  const outerMat = new THREE.MeshPhysicalMaterial({
    map,
    bumpMap,
    bumpScale: 1.6,
    roughness: 0.62,
    metalness: 0,
    clearcoat: 0.35,
    clearcoatRoughness: 0.45,
    // lá lụi hơi trong: ánh sáng lọt qua làm nón sáng dịu, không xỉn
    emissive: new THREE.Color('#6b5530'),
    emissiveMap: map,
    emissiveIntensity: 0.1,
    side: THREE.FrontSide,
    clippingPlanes: [clipPlane],
  })
  const innerMat = new THREE.MeshStandardMaterial({
    map: insideMap,
    color: new THREE.Color('#e9dcc0'),
    roughness: 0.85,
    emissive: new THREE.Color('#3a2a14'),
    emissiveMap: insideMap,
    emissiveIntensity: 0.16,
    side: THREE.BackSide,
    clippingPlanes: [clipPlane],
  })
  const outer = new THREE.Mesh(surface, outerMat)
  const inner = new THREE.Mesh(surface, innerMat)
  group.add(outer, inner)

  // vòng nan nứa (ngay dưới lớp lá — thấy rõ từ trong lòng nón)
  const bambooMat = new THREE.MeshStandardMaterial({ color: '#d2b98a', roughness: 0.5, transparent: true })
  const rings = []
  for (let k = 1; k < RINGS; k++) {
    const f = k / RINGS
    const r = R * f - 0.012
    const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.max(0.01, r), 0.0055, 6, 140), bambooMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = H * (1 - f) - 0.007
    ring.userData.order = k
    rings.push(ring)
    group.add(ring)
  }

  // vòng cạp (vòng thứ 16): vòng nứa to, khâu bọc sợi liếc nâu sẫm bóng
  const rimMat = new THREE.MeshStandardMaterial({ color: '#6b2418', roughness: 0.38 })
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.011, 10, 240), rimMat)
  rim.rotation.x = Math.PI / 2
  rings.push(rim)
  group.add(rim)

  // núm chóp bọc lá trắng
  const tipMat = new THREE.MeshStandardMaterial({ color: '#f7f2e6', roughness: 0.6, transparent: true })
  const tip = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.7, 1), tipMat)
  tip.position.y = H - 0.018
  rings.unshift(tip)
  group.add(tip)

  // quai nón: dải lụa buộc vào hai mảng chỉ nhôi
  // buộc vào giữa mảng chỉ nhôi (vòng 11,5/16 tính từ chóp)
  const ay = H * (1 - 0.72)
  const ax = R * 0.72 - 0.03
  // dải lụa rủ mềm: ra khỏi mảng nhôi gần như thẳng xuống rồi võng thành hình chữ U, hơi lệch một bên
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-ax, ay, 0),
    new THREE.Vector3(-ax * 0.97, ay - 0.2, 0.02),
    new THREE.Vector3(-ax * 0.84, ay - 0.48, 0.06),
    new THREE.Vector3(-ax * 0.52, ay - 0.74, 0.11),
    new THREE.Vector3(-ax * 0.04, ay - 0.84, 0.14),
    new THREE.Vector3(ax * 0.46, ay - 0.76, 0.12),
    new THREE.Vector3(ax * 0.82, ay - 0.5, 0.07),
    new THREE.Vector3(ax * 0.97, ay - 0.21, 0.02),
    new THREE.Vector3(ax, ay, 0),
  ])
  const strapMat = new THREE.MeshPhysicalMaterial({
    color: '#a3313c',
    roughness: 0.55,
    sheen: 1,
    sheenRoughness: 0.4,
    sheenColor: new THREE.Color('#f0a0a8'),
    side: THREE.DoubleSide,
    transparent: true,
  })
  const strap = new THREE.Mesh(ribbonGeometry(curve, 0.038, 160, 0.5), strapMat)
  group.add(strap)

  const localPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 10)

  return {
    group,
    rings,
    strap,
    /**
     * p = 0 → chưa lợp lá, p = 1 → lợp kín. Lá được phủ từ đỉnh xuống vành.
     * Gọi sau khi group.matrixWorld đã cập nhật.
     */
    setReveal(p) {
      const y = H + 0.04 - (H + 0.1) * p
      localPlane.normal.set(0, 1, 0)
      localPlane.constant = p >= 1 ? 10 : -y
      clipPlane.copy(localPlane).applyMatrix4(group.matrixWorld)
    },
    setRings(p) {
      // p 0..1: các vòng nan lần lượt xuất hiện từ đỉnh xuống
      const n = rings.length
      rings.forEach((ring, i) => {
        const local = THREE.MathUtils.clamp(p * (n + 3) - i, 0, 1)
        const e = 1 - Math.pow(1 - local, 3)
        ring.visible = local > 0
        ring.scale.setScalar(0.75 + 0.25 * e)
      })
      bambooMat.opacity = Math.min(1, p * 3)
    },
    setStrap(p) {
      strap.visible = p > 0
      strapMat.opacity = p
    },
    dispose() {
      group.traverse((o) => {
        if (o.geometry) o.geometry.dispose()
      })
      ;[outerMat, innerMat, bambooMat, rimMat, tipMat, strapMat].forEach((m) => m.dispose())
    },
  }
}
