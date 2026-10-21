import * as THREE from 'three'
import { MiniScene, easeOutBack } from './miniScene.js'

/**
 * Mô hình làng Chuông thu nhỏ (kiểu sa bàn) nổi lên trên ghim bản đồ:
 * cổng làng ở đầu đường, đình Chuông mái hai tầng giữa làng, nhà mái ngói, sân phơi nón trắng,
 * ao, cây đa, khóm tre và ruộng lúa bao quanh.
 */
const COL = {
  soil: '#8a6a45',
  grass: '#a5c27a',
  road: '#dcc79c',
  rice: ['#b9d178', '#a6c566', '#c8da8c', '#9cbf5e'],
  wall: '#efe5d1',
  wood: '#8a4b2a',
  tile: '#a9502c',
  tileDark: '#7a3b24',
  stucco: '#ddd0b3',
  hat: '#f5eddb',
  pond: '#78aaa8',
  leaf: '#5f8a3f',
  bamboo: '#7f9b4c',
  trunk: '#6b4a2e',
}

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...o })

function hipRoof(w, d, h, color) {
  // mái bốn mái: chóp 4 cạnh xoay 45°, kéo dãn theo hai chiều
  const g = new THREE.ConeGeometry(Math.SQRT1_2, h, 4, 1)
  g.rotateY(Math.PI / 4)
  g.scale(w, 1, d)
  const m = new THREE.Mesh(g, mat(color, { flatShading: true }))
  m.castShadow = true
  return m
}

function gableRoof(w, d, h, color) {
  // mái hai mái: lăng trụ tam giác nằm ngang
  const shape = new THREE.Shape([new THREE.Vector2(-d / 2, 0), new THREE.Vector2(d / 2, 0), new THREE.Vector2(0, h)])
  const g = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false })
  g.translate(0, 0, -w / 2)
  g.rotateY(Math.PI / 2)
  const m = new THREE.Mesh(g, mat(color, { flatShading: true }))
  m.castShadow = true
  return m
}

function box(w, h, d, color, y = h / 2) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color))
  m.position.y = y
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function house(x, z, yaw, s = 1) {
  const g = new THREE.Group()
  g.add(box(0.62, 0.32, 0.42, COL.wall))
  const r = gableRoof(0.74, 0.56, 0.26, COL.tile)
  r.position.y = 0.32
  g.add(r)
  g.position.set(x, 0, z)
  g.rotation.y = yaw
  g.scale.setScalar(s)
  return g
}

function dinh() {
  // đình Chuông: nền đá, thân gỗ sẫm, mái hai tầng, đầu đao cong
  const g = new THREE.Group()
  g.add(box(2.0, 0.1, 1.15, '#cfc3a8'))
  const body = box(1.62, 0.46, 0.8, COL.wood, 0.1 + 0.23)
  g.add(body)
  const r1 = hipRoof(2.1, 1.2, 0.42, COL.tileDark)
  r1.position.y = 0.56 + 0.21
  g.add(r1)
  const r2 = hipRoof(1.2, 0.62, 0.34, COL.tile)
  r2.position.y = 0.86 + 0.17
  g.add(r2)
  const tip = new THREE.ConeGeometry(0.05, 0.16, 6)
  for (const [x, z] of [
    [-1, -0.56],
    [1, -0.56],
    [-1, 0.56],
    [1, 0.56],
  ]) {
    const m = new THREE.Mesh(tip, mat(COL.tileDark))
    m.position.set(x * 1.0, 0.62, z * 1.02)
    m.rotation.z = -x * 0.6
    m.rotation.x = z * 0.6
    g.add(m)
  }
  g.position.set(0, 0, -0.55)
  return g
}

function gate() {
  // cổng làng: hai trụ, mái nhỏ ở giữa
  const g = new THREE.Group()
  for (const x of [-0.36, 0.36]) {
    const p = box(0.17, 0.72, 0.17, COL.stucco)
    p.position.x = x
    g.add(p)
  }
  const beam = box(0.98, 0.2, 0.22, COL.stucco, 0.74)
  g.add(beam)
  const r = hipRoof(1.12, 0.36, 0.2, COL.tileDark)
  r.position.y = 0.94
  g.add(r)
  g.position.set(0, 0, 2.35)
  return g
}

function tree(x, z, s = 1) {
  const g = new THREE.Group()
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.5, 8), mat(COL.trunk))
  trunk.position.y = 0.25
  trunk.castShadow = true
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), mat(COL.leaf, { flatShading: true }))
  crown.position.y = 0.72
  crown.scale.set(1.15, 0.8, 1.15)
  crown.castShadow = true
  g.add(trunk, crown)
  g.position.set(x, 0, z)
  g.scale.setScalar(s)
  return g
}

function bamboo(x, z, rand) {
  const g = new THREE.Group()
  const stem = new THREE.CylinderGeometry(0.018, 0.022, 1, 5)
  const leaf = new THREE.ConeGeometry(0.16, 0.42, 6)
  for (let i = 0; i < 6; i++) {
    const h = 0.7 + rand() * 0.45
    const a = rand() * Math.PI * 2
    const r = 0.04 + rand() * 0.12
    const s = new THREE.Mesh(stem, mat(COL.bamboo))
    s.scale.y = h
    s.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r)
    s.rotation.z = (rand() - 0.5) * 0.25
    const l = new THREE.Mesh(leaf, mat(COL.leaf, { flatShading: true }))
    l.position.set(s.position.x, h + 0.08, s.position.z)
    s.castShadow = l.castShadow = true
    g.add(s, l)
  }
  g.position.set(x, 0, z)
  return g
}

function rng(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class VillageScene extends MiniScene {
  constructor(canvas) {
    super(canvas, {
      fov: 28,
      camera: [0, 6.2, 9.4],
      target: [0, 0.35, 0],
      autoRotate: 0.7,
      polar: [0.55, 1.15],
      shadows: true,
    })
    const rand = rng(7)
    const s = this.scene
    s.add(new THREE.HemisphereLight('#fff7e8', '#5b4a32', 1.25))
    const sun = new THREE.DirectionalLight('#fff0d8', 2.1)
    sun.position.set(4, 7, 3)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, {
      left: -4,
      right: 4,
      top: 4,
      bottom: -4,
      near: 1,
      far: 20,
    })
    sun.shadow.bias = -0.002
    s.add(sun)

    const v = this.root
    // nền sa bàn: đất nâu, mặt cỏ
    const base = new THREE.Mesh(new THREE.CylinderGeometry(3.25, 3.05, 0.34, 72), [mat(COL.soil), mat(COL.grass), mat(COL.soil)])
    base.position.y = -0.17
    base.receiveShadow = true
    v.add(base)

    // ruộng lúa quanh làng (bỏ chừa đường vào cổng)
    const paddy = new THREE.BoxGeometry(1, 0.04, 1)
    for (const [r, n, dw] of [
      [2.42, 22, 0.42],
      [2.9, 26, 0.4],
    ]) {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + (r > 2.6 ? 0.12 : 0)
        if (Math.abs(Math.atan2(Math.sin(a - Math.PI / 2), Math.cos(a - Math.PI / 2))) < 0.2) continue
        const m = new THREE.Mesh(paddy, mat(COL.rice[(i + (r > 2.6 ? 1 : 0)) % 4]))
        m.scale.set(((2 * Math.PI * r) / n) * 0.9, 1, dw)
        m.position.set(Math.cos(a) * r, 0.02, Math.sin(a) * r)
        m.rotation.y = -a + Math.PI / 2
        m.receiveShadow = true
        v.add(m)
      }
    }
    // đường làng từ mép sa bàn vào sân đình
    const road = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 2.6), mat(COL.road))
    road.position.set(0, 0.011, 1.75)
    road.receiveShadow = true
    v.add(road)
    const yard = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.02, 40), mat(COL.road))
    yard.scale.z = 0.62
    yard.position.set(0, 0.011, 0.35)
    yard.receiveShadow = true
    v.add(yard)

    v.add(dinh(), gate())
    ;[
      [-1.45, 0.55, 0.4],
      [-1.55, -0.75, -0.3],
      [1.45, 0.5, -0.4],
      [1.55, -0.8, 0.3],
      [-0.95, 1.45, 0.1],
      [0.98, 1.45, -0.1],
      [-0.72, -1.65, 0],
      [0.75, -1.6, 0],
      [-1.95, -0.05, 1.4],
      [1.95, -0.05, -1.4],
    ].forEach(([x, z, yaw]) => v.add(house(x, z, yaw, 0.92 + rand() * 0.16)))

    // sân phơi nón: nón trắng xếp hàng trước nhà
    const hats = new THREE.InstancedMesh(new THREE.ConeGeometry(0.075, 0.055, 14, 1, true), mat(COL.hat, { side: THREE.DoubleSide, roughness: 0.6 }), 96)
    const m4 = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    let k = 0
    for (const [cx, cz, cols, rows] of [
      [-1.05, 0.62, 3, 3],
      [1.05, 0.58, 3, 3],
      [-0.42, 1.08, 2, 4],
      [-1.6, -1.25, 4, 2],
      [1.62, -1.32, 4, 2],
    ]) {
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          if (k >= 96) break
          q.setFromEuler(new THREE.Euler((rand() - 0.5) * 0.3, rand() * 6, (rand() - 0.5) * 0.3))
          m4.compose(new THREE.Vector3(cx + (i - (cols - 1) / 2) * 0.17, 0.03, cz + (j - (rows - 1) / 2) * 0.17), q, new THREE.Vector3(1, 1, 1))
          hats.setMatrixAt(k++, m4)
        }
    }
    hats.count = k
    hats.castShadow = true
    v.add(hats)

    // ao làng, cây đa đầu làng, khóm tre
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.03, 40), mat(COL.pond, { roughness: 0.25, metalness: 0.1 }))
    pond.scale.z = 0.7
    pond.position.set(1.2, 0.012, 2.0)
    v.add(pond)
    v.add(tree(-0.95, 2.1, 1.05), tree(-2.05, 1.05, 0.8), tree(2.1, 1.0, 0.75))
    ;[
      [-2.05, -1.2],
      [2.05, -1.3],
      [0, -2.1],
      [-1.3, -1.95],
      [1.35, -1.95],
    ].forEach(([x, z]) => v.add(bamboo(x, z, rand)))

    // nổi lên từ ghim bản đồ
    this.t0 = null
    v.scale.setScalar(0.001)
  }

  update(dt, t) {
    if (this.t0 === null) this.t0 = t
    const k = Math.min(1, (t - this.t0) / 0.9)
    this.root.scale.setScalar(Math.max(0.001, easeOutBack(k)))
    this.root.position.y = -0.5 * (1 - k)
  }
}
