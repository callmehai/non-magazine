import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { reducedMotion } from './webgl.js'

/**
 * Khung WebGL nhỏ đặt trong trang sách: nền trong suốt, kéo để xoay (không zoom, không kéo lệch),
 * tự quay chậm; chỉ vẽ khi khung còn trên màn hình. Lớp con dựng vật thể vào this.root.
 */
export class MiniScene {
  constructor(canvas, { fov = 30, camera = [0, 5, 8], target = [0, 0, 0], autoRotate = 0.6, polar = [0.4, 1.2], shadows = false } = {}) {
    this.canvas = canvas
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.setClearColor(0x000000, 0)
    renderer.shadowMap.enabled = shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer = renderer

    this.scene = new THREE.Scene()
    this.root = new THREE.Group()
    this.scene.add(this.root)
    this.camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 100)
    this.camera.position.set(...camera)

    const controls = new OrbitControls(this.camera, canvas)
    controls.target.set(...target)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minPolarAngle = polar[0]
    controls.maxPolarAngle = polar[1]
    controls.autoRotate = autoRotate > 0 && !reducedMotion()
    controls.autoRotateSpeed = autoRotate
    controls.update()
    this.controls = controls

    this.clock = new THREE.Clock()
    this.onScreen = true
    this.io = new IntersectionObserver(([e]) => (this.onScreen = e.isIntersecting))
    this.io.observe(canvas)
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(canvas)
    this.resize()
    this.loop = this.loop.bind(this)
    this.raf = requestAnimationFrame(this.loop)
  }

  resize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }

  /** lớp con ghi đè: cập nhật theo thời gian (dt giây, t giây từ lúc tạo) */
  update() {}

  loop() {
    this.raf = requestAnimationFrame(this.loop)
    const dt = Math.min(this.clock.getDelta(), 0.05)
    if (!this.onScreen || document.hidden) return
    this.update(dt, this.clock.elapsedTime)
    this.controls.update()
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this.raf)
    this.io.disconnect()
    this.ro.disconnect()
    this.controls.dispose()
    this.scene.traverse((o) => {
      o.geometry?.dispose()
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      mats.forEach((m) => {
        m.map?.dispose()
        m.dispose()
      })
    })
    this.renderer.dispose()
  }
}

export const easeOutBack = (t) => {
  const c = 1.5
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2)
}
