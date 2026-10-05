import * as THREE from 'three'

/** Kích thước nón (đơn vị scene): bán kính vành và chiều cao chóp */
export const HAT = { R: 1, H: 0.74, RINGS: 16 }

let cachedTextures = null

/** Vẽ texture lá nón trên canvas: dải lá, thớ lá, vòng nan nổi và mũi khâu. */
function makeTextures(size = 2048) {
  if (cachedTextures) return cachedTextures
  const w = size
  const h = size / 2
  const rand = mulberry32(7)

  const color = document.createElement('canvas')
  color.width = w
  color.height = h
  const c = color.getContext('2d')

  const bump = document.createElement('canvas')
  bump.width = w
  bump.height = h
  const b = bump.getContext('2d')

  // canvas y = 0 là đỉnh chóp, y = h là vành
  const base = c.createLinearGradient(0, 0, 0, h)
  base.addColorStop(0, '#ead9b0')
  base.addColorStop(0.55, '#dcc493')
  base.addColorStop(1, '#c6a66d')
  c.fillStyle = base
  c.fillRect(0, 0, w, h)
  b.fillStyle = '#808080'
  b.fillRect(0, 0, w, h)

  // các dải lá xếp dọc từ đỉnh xuống vành
  const strips = 84
  const sw = w / strips
  for (let i = 0; i < strips; i++) {
    const x = i * sw
    const tone = (rand() - 0.5) * 22
    c.fillStyle = `rgba(${tone > 0 ? '255,250,235' : '120,90,40'},${Math.abs(tone) / 160})`
    c.fillRect(x, 0, sw, h)
    // mép lá chồng lên nhau
    c.fillStyle = 'rgba(110,80,40,0.16)'
    c.fillRect(x + sw - 1.5, 0, 1.5, h)
    c.fillStyle = 'rgba(255,252,240,0.22)'
    c.fillRect(x, 0, 1, h)
    b.fillStyle = '#5a5a5a'
    b.fillRect(x + sw - 1.5, 0, 1.5, h)
  }

  // thớ lá
  for (let i = 0; i < 2600; i++) {
    const x = rand() * w
    const y = rand() * h
    const len = 30 + rand() * 220
    const dark = rand() > 0.45
    c.strokeStyle = dark ? `rgba(120,88,45,${0.05 + rand() * 0.08})` : `rgba(255,250,236,${0.06 + rand() * 0.1})`
    c.lineWidth = 0.6 + rand() * 0.8
    c.beginPath()
    c.moveTo(x, y)
    c.lineTo(x + (rand() - 0.5) * 3, y + len)
    c.stroke()
  }

  // đốm nắng / vết thời gian rất nhẹ
  for (let i = 0; i < 70; i++) {
    const x = rand() * w
    const y = rand() * h
    const r = 20 + rand() * 90
    const g = c.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(150,110,55,0.07)')
    g.addColorStop(1, 'rgba(150,110,55,0)')
    c.fillStyle = g
    c.fillRect(x - r, y - r, r * 2, r * 2)
  }

  // vòng nan nổi dưới lớp lá + mũi khâu
  for (let k = 1; k <= HAT.RINGS; k++) {
    const y = (k / HAT.RINGS) * h
    c.fillStyle = 'rgba(255,250,235,0.35)'
    c.fillRect(0, y - 4, w, 2)
    c.fillStyle = 'rgba(95,68,32,0.28)'
    c.fillRect(0, y + 1, w, 2.5)
    const bg = b.createLinearGradient(0, y - 6, 0, y + 6)
    bg.addColorStop(0, '#808080')
    bg.addColorStop(0.5, '#e8e8e8')
    bg.addColorStop(1, '#808080')
    b.fillStyle = bg
    b.fillRect(0, y - 6, w, 12)

    const step = 9 + (k % 3)
    for (let x = rand() * step; x < w; x += step) {
      c.fillStyle = 'rgba(250,244,228,0.75)'
      c.fillRect(x, y - 1.5, 4, 2)
      c.fillStyle = 'rgba(90,65,30,0.25)'
      c.fillRect(x, y + 0.5, 4, 1)
      b.fillStyle = '#ffffff'
      b.fillRect(x, y - 1.5, 4, 2)
    }
  }

  const map = new THREE.CanvasTexture(color)
  map.colorSpace = THREE.SRGBColorSpace
  map.wrapS = THREE.RepeatWrapping
  const bumpMap = new THREE.CanvasTexture(bump)
  bumpMap.wrapS = THREE.RepeatWrapping
  cachedTextures = { map, bumpMap }
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

/**
 * Tạo một chiếc nón lá 3D hoàn toàn bằng code.
 * Trả về group + các bộ phận để làm hiệu ứng "đan nón" (vòng nan → lợp lá → quai).
 */
export function createNonLa({ textureSize = 2048, anisotropy = 4 } = {}) {
  const { R, H, RINGS } = HAT
  const { map, bumpMap } = makeTextures(textureSize)
  map.anisotropy = anisotropy

  const group = new THREE.Group()
  group.name = 'non-la'

  // mặt nón: profile từ vành (dưới) lên đỉnh, hơi phồng nhẹ
  const pts = []
  const N = 40
  for (let i = 0; i <= N; i++) {
    const t = i / N // 0 = vành, 1 = đỉnh
    const r = Math.max(0.0001, R * (1 - t))
    const y = H * t + Math.sin(Math.PI * t) * 0.025
    pts.push(new THREE.Vector2(r, y))
  }
  const surface = new THREE.LatheGeometry(pts, 160)

  const clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 10)
  const outerMat = new THREE.MeshStandardMaterial({
    map,
    bumpMap,
    bumpScale: 2.2,
    roughness: 0.82,
    metalness: 0,
    emissive: new THREE.Color('#5a4120'),
    emissiveMap: map,
    emissiveIntensity: 0.07,
    side: THREE.FrontSide,
    clippingPlanes: [clipPlane],
  })
  const innerMat = new THREE.MeshStandardMaterial({
    map,
    color: new THREE.Color('#c4ab7c'),
    roughness: 0.92,
    emissive: new THREE.Color('#2e2110'),
    emissiveMap: map,
    emissiveIntensity: 0.12,
    side: THREE.BackSide,
    clippingPlanes: [clipPlane],
  })
  const outer = new THREE.Mesh(surface, outerMat)
  const inner = new THREE.Mesh(surface, innerMat)
  group.add(outer, inner)

  // vòng nan tre (nằm ngay dưới lớp lá — nhìn thấy từ bên trong nón)
  const bambooMat = new THREE.MeshStandardMaterial({ color: '#a8844f', roughness: 0.55, transparent: true })
  const rings = []
  for (let k = 1; k < RINGS; k++) {
    const f = k / RINGS
    const r = R * f - 0.014
    const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.max(0.01, r), 0.0065, 6, 120), bambooMat)
    ring.rotation.x = Math.PI / 2
    ring.position.y = H * (1 - f) - 0.008
    ring.userData.order = k
    rings.push(ring)
    group.add(ring)
  }

  // vành nón
  const rimMat = new THREE.MeshStandardMaterial({ color: '#8b6a3c', roughness: 0.5 })
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.02, 12, 220), rimMat)
  rim.rotation.x = Math.PI / 2
  rings.push(rim)
  group.add(rim)

  // quai nón (lụa)
  const ay = H * (1 - 0.62)
  const ax = R * 0.62 - 0.03
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-ax, ay, 0),
    new THREE.Vector3(-ax * 0.86, ay - 0.32, 0.06),
    new THREE.Vector3(-ax * 0.5, ay - 0.66, 0.12),
    new THREE.Vector3(0, ay - 0.8, 0.15),
    new THREE.Vector3(ax * 0.5, ay - 0.66, 0.12),
    new THREE.Vector3(ax * 0.86, ay - 0.32, 0.06),
    new THREE.Vector3(ax, ay, 0),
  ])
  const strapMat = new THREE.MeshStandardMaterial({
    color: '#8e2f2a',
    roughness: 0.38,
    metalness: 0.05,
    transparent: true,
  })
  const strap = new THREE.Mesh(new THREE.TubeGeometry(curve, 90, 0.011, 8, false), strapMat)
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
      ;[outerMat, innerMat, bambooMat, rimMat, strapMat].forEach((m) => m.dispose())
    },
  }
}
