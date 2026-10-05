import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createNonLa } from './createNonLa.js'

/** Trình xem nón 3D nhỏ đặt trong một trang tạp chí: kéo để xoay, tự quay chậm. */
export class HatViewer {
  constructor(canvas, { reducedMotion = false } = {}) {
    this.canvas = canvas
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    renderer.setClearColor(0x000000, 0)
    this.renderer = renderer

    const scene = new THREE.Scene()
    const pmrem = new THREE.PMREMGenerator(renderer)
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = this.envTex
    scene.environmentIntensity = 0.5
    pmrem.dispose()

    scene.add(new THREE.HemisphereLight('#fff4e0', '#6b4a2a', 0.9))
    const key = new THREE.DirectionalLight('#fff0d6', 2.2)
    key.position.set(2, 3.5, 2.5)
    const back = new THREE.DirectionalLight('#ffc27a', 1.6)
    back.position.set(-2.5, 1, -2.5)
    const under = new THREE.PointLight('#ffb070', 1.2, 6, 1.5)
    under.position.set(0, -1.2, 1)
    scene.add(key, back, under)

    this.hat = createNonLa({ textureSize: 1024, anisotropy: renderer.capabilities.getMaxAnisotropy() })
    this.hat.setRings(1)
    this.hat.setStrap(1)
    this.hat.group.position.y = -0.1
    scene.add(this.hat.group)

    // bóng mềm dưới nón
    const c = document.createElement('canvas')
    c.width = c.height = 128
    const g = c.getContext('2d')
    const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
    grad.addColorStop(0, 'rgba(60,40,20,0.45)')
    grad.addColorStop(1, 'rgba(60,40,20,0)')
    g.fillStyle = grad
    g.fillRect(0, 0, 128, 128)
    this.shadowTex = new THREE.CanvasTexture(c)
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.8, 2.8),
      new THREE.MeshBasicMaterial({ map: this.shadowTex, transparent: true, depthWrite: false })
    )
    shadow.rotation.x = -Math.PI / 2
    shadow.position.y = -0.72
    scene.add(shadow)
    this.shadow = shadow

    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 30)
    camera.position.set(0, 1.5, 3.6)
    this.camera = camera
    this.scene = scene

    const controls = new OrbitControls(camera, canvas)
    controls.enableZoom = false
    controls.enablePan = false
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.autoRotate = !reducedMotion
    controls.autoRotateSpeed = 1.2
    controls.minPolarAngle = 0.25
    controls.maxPolarAngle = 2.2
    controls.target.set(0, 0.05, 0)
    this.controls = controls

    this.resize = this.resize.bind(this)
    this.ro = new ResizeObserver(this.resize)
    this.ro.observe(canvas)
    this.resize()
    renderer.setAnimationLoop(() => {
      controls.update()
      this.hat.group.updateMatrixWorld(true)
      this.hat.setReveal(1)
      renderer.render(scene, camera)
    })
  }

  resize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    // nón luôn vừa khung dù khung hẹp
    this.camera.position.setLength(w / h < 1 ? 3.6 / (w / h) ** 0.8 : 3.6)
    this.camera.updateProjectionMatrix()
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.ro.disconnect()
    this.controls.dispose()
    this.hat.dispose()
    this.shadow.geometry.dispose()
    this.shadow.material.dispose()
    this.shadowTex.dispose()
    this.envTex.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
