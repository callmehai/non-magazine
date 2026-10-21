import * as THREE from 'three'
import { MiniScene } from './miniScene.js'

/**
 * Ba lớp lá lợp nón tách rời theo chiều cao (trên cùng là lớp lá ngoài, giữa là mo nang, dưới là lớp lá trong).
 * Bấm (không kéo) vào một lớp → lớp đó sáng màu và nhô ra, hai lớp kia mờ đi. onSelect(i | null) báo cho giao diện.
 */
const R = 1
const H = 0.82
const GAP = 0.9

function texture(kind) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const g = c.getContext('2d')
  // u (ngang) = vòng quanh nón, v (dọc) = từ vành lên chóp
  if (kind === 'mo') {
    g.fillStyle = '#c4a072'
    g.fillRect(0, 0, 1024, 256)
    for (let i = 0; i < 2200; i++) {
      g.fillStyle = `rgba(${90 + Math.random() * 60},${60 + Math.random() * 40},30,${0.05 + Math.random() * 0.12})`
      g.fillRect(Math.random() * 1024, Math.random() * 256, 1 + Math.random() * 18, 1 + Math.random() * 2)
    }
  } else {
    g.fillStyle = kind === 'outer' ? '#efe4c8' : '#f3ead6'
    g.fillRect(0, 0, 1024, 256)
    // tàu lá chạy từ vành lên chóp, gân nhỏ
    for (let i = 0; i < 18; i++) {
      const x = (i / 18) * 1024
      g.fillStyle = 'rgba(150,120,70,0.10)'
      g.fillRect(x, 0, 2, 256)
      for (let j = 1; j < 9; j++) {
        g.fillStyle = 'rgba(160,130,80,0.06)'
        g.fillRect(x + (j * 1024) / 18 / 9, 0, 1, 256)
      }
    }
  }
  // đường khâu theo 16 vòng
  if (kind !== 'mo') {
    for (let k = 1; k < 16; k++) {
      g.fillStyle = kind === 'outer' ? 'rgba(255,255,255,0.55)' : 'rgba(140,110,70,0.25)'
      g.fillRect(0, 256 - (k / 16) * 256, 1024, 1.5)
    }
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = THREE.RepeatWrapping
  return t
}

function cone(scale) {
  const pts = []
  for (let i = 0; i <= 32; i++) {
    const t = i / 32
    pts.push(new THREE.Vector2(Math.max(0.0001, R * scale * (1 - t)), H * scale * t + Math.sin(Math.PI * t) * 0.01))
  }
  return new THREE.LatheGeometry(pts, 96)
}

export class LayersScene extends MiniScene {
  constructor(canvas, { colors, onSelect }) {
    super(canvas, {
      fov: 36,
      camera: [0, 1.3, 4.1],
      target: [0, 0.2, 0],
      autoRotate: 0.8,
      polar: [0.7, 1.45],
    })
    this.onSelect = onSelect
    this.colors = colors.map((c) => new THREE.Color(c))
    const s = this.scene
    s.add(new THREE.HemisphereLight('#fff6e4', '#6b4a2a', 1.3))
    const key = new THREE.DirectionalLight('#fff0d6', 1.8)
    key.position.set(2, 4, 3)
    const back = new THREE.DirectionalLight('#ffc27a', 0.9)
    back.position.set(-2, 1, -3)
    s.add(key, back)

    const kinds = ['outer', 'mo', 'inner']
    this.layers = kinds.map((kind, i) => {
      const m = new THREE.MeshStandardMaterial({
        map: texture(kind),
        roughness: kind === 'mo' ? 0.95 : 0.7,
        side: THREE.DoubleSide,
        transparent: true,
        emissive: this.colors[i],
        emissiveIntensity: 0,
      })
      const mesh = new THREE.Mesh(cone(1 - i * 0.045), m)
      mesh.userData.i = i
      mesh.userData.y = (1 - i) * GAP
      mesh.position.y = mesh.userData.y
      this.root.add(mesh)
      return mesh
    })
    this.root.rotation.x = 0.08
    this.root.position.y = -0.38
    this.sel = null
    this.hover = null

    // bấm chọn: chỉ tính là bấm khi con trỏ gần như không di chuyển (kéo là xoay)
    this.ray = new THREE.Raycaster()
    this.ptr = new THREE.Vector2()
    let down = null
    this.onDown = (e) => (down = [e.clientX, e.clientY])
    this.onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return
      const hit = this.pick(e)
      this.select(hit === this.sel ? null : hit)
    }
    this.onMove = (e) => {
      this.hover = this.pick(e)
      canvas.style.cursor = this.hover !== null ? 'pointer' : 'grab'
    }
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointermove', this.onMove)
  }

  pick(e) {
    const r = this.canvas.getBoundingClientRect()
    this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    this.ray.setFromCamera(this.ptr, this.camera)
    const hit = this.ray.intersectObjects(this.layers, false)[0]
    return hit ? hit.object.userData.i : null
  }

  select(i, notify = true) {
    this.sel = i
    if (notify) this.onSelect?.(i)
  }

  update(dt) {
    const k = 1 - Math.pow(0.0015, dt) // làm mượt theo thời gian
    this.layers.forEach((m, i) => {
      const on = this.sel === i
      const dim = this.sel !== null && !on
      const mat = m.material
      mat.emissiveIntensity += ((on ? 0.55 : this.hover === i ? 0.18 : 0) - mat.emissiveIntensity) * k
      mat.opacity += ((dim ? 0.28 : 1) - mat.opacity) * k
      mat.depthWrite = mat.opacity > 0.9
      const y = m.userData.y + (on ? (i === 0 ? 0.22 : i === 2 ? -0.22 : 0) : 0)
      m.position.y += (y - m.position.y) * k
      const sc = on ? 1.06 : 1
      m.scale.setScalar(m.scale.x + (sc - m.scale.x) * k)
    })
  }

  dispose() {
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointerup', this.onUp)
    this.canvas.removeEventListener('pointermove', this.onMove)
    super.dispose()
  }
}
