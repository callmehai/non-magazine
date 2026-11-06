import * as THREE from 'three'
import { MiniScene } from './miniScene.js'
import { reducedMotion } from './webgl.js'
import { asset } from '../../lib/assets.js'

/**
 * Ba lớp lá lợp nón tách rời theo chiều cao (trên cùng là lớp lá ngoài, giữa là mo nang, dưới là lớp lá trong).
 * Bấm (không kéo) vào một lớp → lớp đó sáng màu và nhô ra, hai lớp kia mờ đi. onSelect(i | null) báo cho giao diện.
 * Kéo = xoay chính chồng nón theo tay (đèn, camera đứng yên): nón tròn đều, nếu xoay camera thì chỉ thấy mảng sáng
 * tối trượt ngược chiều tay kéo → cảm giác xoay ngược.
 */
const R = 1
const H = 0.7 // cùng dáng thấp như nón 3D ở sảnh (HAT.H 0,72): nón thật không nhọn hoắt
const GAP = 0.72

function texture(kind) {
  const c = document.createElement('canvas')
  c.width = 1024
  c.height = 256
  const g = c.getContext('2d')
  // u (ngang) = vòng quanh nón, v (dọc) = từ vành lên chóp
  // góp ý: nhìn vào phải hình dung được hai lớp lá lụi kẹp lớp mo nang ở giữa → lá = từng tàu lá ngà có gân,
  // mo nang = bẹ mo nâu loang lổ, thớ dọc (như ảnh mo thật IMG_7938), khác hẳn màu và chất hai lớp lá
  let seed = kind === 'outer' ? 7 : kind === 'mo' ? 13 : 29
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  if (kind === 'mo') {
    g.fillStyle = '#9c7444'
    g.fillRect(0, 0, 1024, 256)
    // năm bẹ mo nối tiếp quanh nón, mép bẹ sẫm hơn
    for (let b = 0; b < 5; b++) {
      const x0 = (b / 5) * 1024
      const grd = g.createLinearGradient(x0, 0, x0 + 1024 / 5, 0)
      grd.addColorStop(0, 'rgba(70,45,20,0.35)')
      grd.addColorStop(0.15, 'rgba(190,150,95,0.25)')
      grd.addColorStop(0.85, 'rgba(170,130,80,0.15)')
      grd.addColorStop(1, 'rgba(70,45,20,0.4)')
      g.fillStyle = grd
      g.fillRect(x0, 0, 1024 / 5, 256)
    }
    // vết loang sẫm / sáng
    for (let i = 0; i < 90; i++) {
      const dark = rnd() < 0.6
      g.fillStyle = dark ? `rgba(60,38,18,${0.08 + rnd() * 0.18})` : `rgba(225,195,140,${0.06 + rnd() * 0.14})`
      g.beginPath()
      g.ellipse(rnd() * 1024, rnd() * 256, 8 + rnd() * 40, 3 + rnd() * 14, rnd() * 0.4, 0, Math.PI * 2)
      g.fill()
    }
    // thớ dọc mảnh
    for (let i = 0; i < 700; i++) {
      g.fillStyle = `rgba(${60 + rnd() * 50},${40 + rnd() * 30},20,${0.05 + rnd() * 0.12})`
      g.fillRect(rnd() * 1024, rnd() * 256, 1, 10 + rnd() * 70)
    }
  } else {
    g.fillStyle = kind === 'outer' ? '#efe6cc' : '#f4ecd8'
    g.fillRect(0, 0, 1024, 256)
    // từng tàu lá lụi chạy từ vành lên chóp, hơi lệch màu nhau, mép tàu có bóng, gân giữa rõ
    const n = 34
    for (let i = 0; i < n; i++) {
      const x = (i / n) * 1024
      const w = 1024 / n
      const t = rnd()
      g.fillStyle = `rgba(${200 + t * 40},${180 + t * 40},${130 + t * 50},0.35)`
      g.fillRect(x, 0, w, 256)
      g.fillStyle = 'rgba(120,95,55,0.28)'
      g.fillRect(x, 0, 1.5, 256)
      g.fillStyle = 'rgba(255,255,255,0.35)'
      g.fillRect(x + 2, 0, 1, 256)
      g.fillStyle = 'rgba(150,120,70,0.22)'
      g.fillRect(x + w / 2, 0, 1.2, 256)
      for (let j = 1; j < 5; j++) {
        g.fillStyle = 'rgba(160,130,80,0.08)'
        g.fillRect(x + (j * w) / 5, 0, 0.8, 256)
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

// mặt lớp bằng ảnh thật nhóm chụp (scripts/book/layer-tex.py: dải mặt nón trong ảnh "sau khi lợp", lặp quanh nón);
// góp ý: "3 lớp lá cho ảnh 3d thật" → vẽ tay ở trên chỉ là hình tạm trong lúc ảnh đang tải
const loader = new THREE.TextureLoader()
function photo(kind, mat, anisotropy) {
  loader.load(asset(`assets/book/fx/lop-${kind}.webp`), (t) => {
    t.colorSpace = THREE.SRGBColorSpace
    t.wrapS = THREE.RepeatWrapping
    t.anisotropy = anisotropy
    mat.map?.dispose()
    mat.map = t
    mat.needsUpdate = true
  })
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
      camera: [0, 1.45, 4.7],
      target: [0, 0.05, 0],
      autoRotate: 0,
      polar: [0.7, 1.45],
    })
    this.controls.enabled = false
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
        // mo nang sẫm hơn hai lớp lá lụi một chút: nhìn vào phải thấy ngay "hai lớp lá kẹp lớp mo ở giữa"
        color: kind === 'mo' ? '#d9b98f' : '#ffffff',
        side: THREE.DoubleSide,
        transparent: true,
        emissive: this.colors[i],
        emissiveIntensity: 0,
      })
      photo(kind, m, Math.min(8, this.renderer?.capabilities.getMaxAnisotropy?.() ?? 1))
      const mesh = new THREE.Mesh(cone(1 - i * 0.045), m)
      mesh.userData.i = i
      mesh.userData.y = (1 - i) * GAP
      mesh.position.y = mesh.userData.y
      this.root.add(mesh)
      return mesh
    })
    this.root.rotation.x = 0.08
    this.root.position.y = -0.3
    this.spin = 0
    this.tilt = 0
    this.auto = !reducedMotion()
    this.sel = null
    this.hover = null

    // bấm chọn: chỉ tính là bấm khi con trỏ gần như không di chuyển (kéo là xoay)
    this.ray = new THREE.Raycaster()
    this.ptr = new THREE.Vector2()
    let down = null
    let last = null
    this.dragging = false
    this.onDown = (e) => {
      down = last = [e.clientX, e.clientY]
      this.dragging = true
      canvas.setPointerCapture?.(e.pointerId)
    }
    this.onUp = (e) => {
      this.dragging = false
      if (!down) return
      const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6
      down = null
      if (moved) return
      const hit = this.pick(e)
      this.select(hit === this.sel ? null : hit)
    }
    this.onMove = (e) => {
      if (this.dragging && last) {
        // kéo sang phải → mặt trước nón chạy sang phải; kéo xuống → nghiêng chóp về phía người xem
        this.spin += (e.clientX - last[0]) * 0.012
        this.tilt = Math.min(0.55, Math.max(-0.35, this.tilt + (e.clientY - last[1]) * 0.006))
        last = [e.clientX, e.clientY]
        this.auto = false
        return
      }
      this.hover = this.pick(e)
      canvas.style.cursor = this.hover !== null ? 'var(--cursor-leaf-hand, pointer)' : 'grab'
    }
    canvas.addEventListener('pointerdown', this.onDown)
    canvas.addEventListener('pointerup', this.onUp)
    canvas.addEventListener('pointermove', this.onMove)
    canvas.addEventListener('pointercancel', this.onUp)
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
    if (this.auto) this.spin += dt * 0.35
    this.root.rotation.y = this.spin
    this.root.rotation.x = 0.08 + this.tilt
    this.layers.forEach((m, i) => {
      const on = this.sel === i
      const dim = this.sel !== null && !on
      const mat = m.material
      // lớp đang chọn chỉ ửng nhẹ màu lớp (giữ màu ảnh thật); hai lớp kia mờ hẳn — soát 05/11: tô sáng 0,55 làm mất màu
      // ảnh, lớp mờ 0,28 để lộ chóp lớp trong trông như có lớp thứ tư
      mat.emissiveIntensity += ((on ? 0.22 : this.hover === i ? 0.12 : 0) - mat.emissiveIntensity) * k
      mat.opacity += ((dim ? 0.14 : 1) - mat.opacity) * k
      mat.depthWrite = mat.opacity > 0.9
      const y = m.userData.y + (on ? (i === 0 ? 0.16 : i === 2 ? -0.16 : 0) : 0)
      m.position.y += (y - m.position.y) * k
      const sc = on ? 1.06 : 1
      m.scale.setScalar(m.scale.x + (sc - m.scale.x) * k)
    })
  }

  dispose() {
    this.canvas.removeEventListener('pointerdown', this.onDown)
    this.canvas.removeEventListener('pointerup', this.onUp)
    this.canvas.removeEventListener('pointermove', this.onMove)
    this.canvas.removeEventListener('pointercancel', this.onUp)
    super.dispose()
  }
}
