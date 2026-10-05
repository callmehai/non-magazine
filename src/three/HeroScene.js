import * as THREE from 'three'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { createNonLa } from './createNonLa.js'
import { createDust } from './dust.js'

const clamp01 = (v) => Math.min(1, Math.max(0, v))
const range = (t, a, b) => clamp01((t - a) / (b - a))
const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)
const easeOut = (t) => 1 - Math.pow(1 - t, 3)

/** Mốc thời gian của màn mở đầu (giây) */
const T = { rings: [0.15, 1.5], leaf: [1.15, 2.75], strap: [2.45, 3.05], end: 3.2 }

/**
 * Cảnh nền 3D: chiếc nón lá tự "đan" khi mở trang (intro),
 * rồi lùi về làm nền chuyển động phía sau cuốn tạp chí (reading).
 */
export class HeroScene {
  constructor(canvas, { reducedMotion = false, onIntroDone } = {}) {
    this.canvas = canvas
    this.reducedMotion = reducedMotion
    this.onIntroDone = onIntroDone
    this.mobile = window.matchMedia('(max-width: 760px)').matches
    this.mode = 'intro'
    this.timer = new THREE.Timer()
    this.introTime = reducedMotion ? T.end : 0
    this.modeT = 0 // 0 = bố cục intro, 1 = bố cục đọc
    this.introDone = false
    this.pointer = new THREE.Vector2()
    this.pointerSmooth = new THREE.Vector2()

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.mobile ? 1.5 : 1.75))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.88
    renderer.localClippingEnabled = true
    renderer.setClearColor(0x000000, 0)
    this.renderer = renderer

    const scene = new THREE.Scene()
    this.scene = scene
    const pmrem = new THREE.PMREMGenerator(renderer)
    this.envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = this.envTex
    scene.environmentIntensity = 0.35
    pmrem.dispose()

    this.camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60)

    // ánh sáng: nắng chiều ấm + viền vàng phía sau + hắt sáng từ dưới
    scene.add(new THREE.HemisphereLight('#ffe9c4', '#2a1a10', 0.55))
    const key = new THREE.DirectionalLight('#ffe2b0', 2.4)
    key.position.set(2.5, 4, 3)
    const rimLight = new THREE.DirectionalLight('#ffc070', 2.8)
    rimLight.position.set(-3, 1.6, -3.5)
    const under = new THREE.PointLight('#ff9a58', 1.6, 8, 1.5)
    under.position.set(0, -1.6, 1.6)
    scene.add(key, rimLight, under)

    // nón chính + nón phụ (dùng chung geometry/material)
    this.hat = createNonLa({ textureSize: this.mobile ? 1024 : 2048, anisotropy: renderer.capabilities.getMaxAnisotropy() })
    this.hatPivot = new THREE.Group()
    // spin: góc xoay do người xem kéo chuột (để lật nón xem mặt trong)
    this.spin = new THREE.Group()
    this.spin.add(this.hat.group)
    this.hatPivot.add(this.spin)
    scene.add(this.hatPivot)
    this.drag = { active: false, id: null, x: 0, y: 0, rotX: 0, rotY: 0, vx: 0, vy: 0 }
    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    canvas.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)

    this.hat2 = this.hat.group.clone(true)
    this.hat2.traverse((o) => {
      if (o.material && o.material.clippingPlanes) {
        // nón phụ luôn lợp kín
        o.material = o.material.clone()
        o.material.clippingPlanes = []
      }
    })
    this.hat2Pivot = new THREE.Group()
    this.hat2Pivot.add(this.hat2)
    this.hat2Pivot.visible = false
    scene.add(this.hat2Pivot)

    // vũng sáng dưới nón + chùm sáng như trong bảo tàng
    this.pool = makePool()
    scene.add(this.pool)
    this.beam = makeBeam()
    scene.add(this.beam)

    this.dust = createDust(this.mobile ? 260 : 620)
    scene.add(this.dust.points)

    this.resize = this.resize.bind(this)
    this.tick = this.tick.bind(this)
    this.ro = new ResizeObserver(this.resize)
    this.ro.observe(canvas.parentElement || canvas)
    this.resize()

    if (reducedMotion) {
      this.applyIntro(T.end)
      this.finishIntro()
    }
    renderer.setAnimationLoop(this.tick)
  }

  resize() {
    const el = this.canvas.parentElement || this.canvas
    const w = el.clientWidth || window.innerWidth
    const h = el.clientHeight || window.innerHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.size = { w, h }
  }

  onPointerDown(e) {
    if (this.mode !== 'intro') return
    const d = this.drag
    d.active = true
    d.id = e.pointerId
    d.x = e.clientX
    d.y = e.clientY
    d.vx = d.vy = 0
    this.canvas.classList.add('is-dragging')
  }

  onPointerMove(e) {
    const d = this.drag
    if (!d.active || e.pointerId !== d.id) return
    const dx = (e.clientX - d.x) * 0.008
    const dy = (e.clientY - d.y) * 0.008
    d.x = e.clientX
    d.y = e.clientY
    d.rotY += dx
    // kéo lên → lật vành nón về phía người xem để thấy mặt trong
    d.rotX = THREE.MathUtils.clamp(d.rotX + dy, -2.9, 0.9)
    d.vx = dx
    d.vy = dy
  }

  onPointerUp(e) {
    const d = this.drag
    if (!d.active || (e.pointerId !== undefined && e.pointerId !== d.id)) return
    d.active = false
    this.canvas.classList.remove('is-dragging')
  }

  setPointer(x, y) {
    this.pointer.set(x, y)
  }

  setMode(mode) {
    this.mode = mode
    if (mode === 'reading') {
      if (!this.introDone) {
        this.applyIntro(T.end)
        this.finishIntro()
      }
      this.hat2Pivot.visible = true
    }
  }

  /** Chạy lại màn "đan nón" từ đầu (nút "Xem lại nón 3D") */
  replay() {
    this.mode = 'intro'
    this.introDone = false
    this.applyIntro(this.reducedMotion ? T.end : 0)
    if (this.reducedMotion) this.finishIntro()
  }

  finishIntro() {
    if (this.introDone) return
    this.introDone = true
    this.onIntroDone?.()
  }

  applyIntro(t) {
    this.introTime = t
    this.hat.setRings(easeOut(range(t, ...T.rings)))
    this.leafP = easeInOut(range(t, ...T.leaf))
    this.hat.setStrap(easeOut(range(t, ...T.strap)))
  }

  /** Vị trí khung hình tại độ sâu z để đặt nón vào góc màn hình */
  halfExtents(distance) {
    const halfH = Math.tan(THREE.MathUtils.degToRad(this.camera.fov / 2)) * distance
    return { halfH, halfW: halfH * this.camera.aspect }
  }

  tick(timestamp) {
    this.timer.update(timestamp)
    const dt = Math.min(this.timer.getDelta(), 0.05)
    const time = this.timer.getElapsed()
    const motion = this.reducedMotion ? 0 : 1

    if (!this.introDone) {
      this.applyIntro(this.introTime + dt)
      if (this.introTime >= T.end) this.finishIntro()
    }

    const target = this.mode === 'reading' ? 1 : 0
    const speed = this.reducedMotion ? 10 : 0.6
    this.modeT += Math.sign(target - this.modeT) * Math.min(Math.abs(target - this.modeT), dt * speed)
    const m = easeInOut(this.modeT)
    if (this.mode === 'intro' && this.modeT === 0) this.hat2Pivot.visible = false

    this.pointerSmooth.lerp(this.pointer, 1 - Math.pow(0.001, dt))

    // camera
    const cam = this.camera
    const introCam = new THREE.Vector3(0, 0.95, 3.4)
    const readCam = new THREE.Vector3(0, 0.25, 5)
    cam.position.lerpVectors(introCam, readCam, m)
    cam.position.x += this.pointerSmooth.x * 0.35 * motion
    cam.position.y += this.pointerSmooth.y * 0.22 * motion
    const look = new THREE.Vector3(0, THREE.MathUtils.lerp(0.12, 0.05, m), 0)
    cam.lookAt(look)

    // nón chính: giữa màn hình → góc trên bên trái
    const { halfH, halfW } = this.halfExtents(5 + 0.8)
    const narrow = this.camera.aspect < 0.9
    const readPos = narrow
      ? new THREE.Vector3(-halfW * 0.62, halfH * 0.78, -0.8)
      : new THREE.Vector3(-halfW * 0.8, halfH * 0.5, -0.8)
    const pivot = this.hatPivot
    pivot.position.lerpVectors(new THREE.Vector3(0, -0.02, 0), readPos, m)
    pivot.scale.setScalar(THREE.MathUtils.lerp(this.mobile ? 0.56 : 0.64, narrow ? 0.62 : 0.78, m))
    pivot.rotation.x = THREE.MathUtils.lerp(0.36, 0.5, m) + Math.sin(time * 0.6) * 0.03 * motion
    pivot.rotation.z = THREE.MathUtils.lerp(0.06, -0.28, m)
    pivot.position.y += Math.sin(time * 0.8) * 0.03 * motion
    this.hat.group.rotation.y += dt * (0.35 - 0.2 * m) * (motion || 0.0)
    if (!motion) this.hat.group.rotation.y = 0.6

    // nón phụ ở góc dưới bên phải
    const p2 = this.hat2Pivot
    const { halfH: h2, halfW: w2 } = this.halfExtents(5 + 2.2)
    p2.position.set(narrow ? w2 * 0.62 : w2 * 0.84, narrow ? -h2 * 0.8 : -h2 * 0.55, -2.2)
    p2.position.y += Math.sin(time * 0.7 + 1.3) * 0.05 * motion
    p2.scale.setScalar(easeOut(clamp01((m - 0.35) / 0.65)) * (narrow ? 0.55 : 0.72))
    p2.rotation.set(-0.35, 0, 0.42)
    this.hat2.rotation.y -= dt * 0.18 * motion

    // xoay theo tay người xem (có quán tính); vào chế độ đọc thì từ từ trả về
    const d = this.drag
    if (!d.active) {
      d.rotY += d.vx
      d.rotX = THREE.MathUtils.clamp(d.rotX + d.vy, -2.9, 0.9)
      const decay = Math.pow(0.04, dt)
      d.vx *= decay
      d.vy *= decay
      if (this.mode === 'reading') {
        const k = 1 - Math.pow(0.02, dt)
        d.rotX += (0 - d.rotX) * k
        d.rotY += (0 - d.rotY) * k
      }
    }
    this.spin.rotation.set(d.rotX, d.rotY, 0)

    pivot.updateMatrixWorld(true)
    this.hat.setReveal(this.leafP ?? 1)

    // vũng sáng + chùm sáng tắt dần khi vào chế độ đọc
    const glow = 1 - m
    this.pool.material.opacity = 0.55 * glow * clamp01(this.introTime / 0.8)
    this.pool.position.set(pivot.position.x, pivot.position.y - 0.5, pivot.position.z)
    this.pool.visible = glow > 0.01
    this.beam.material.uniforms.uOpacity.value = 0.22 * glow * clamp01(this.introTime / 1.2)
    this.beam.visible = glow > 0.01

    this.dust.update(time * motion, dt, THREE.MathUtils.lerp(0.9, 0.7, m))

    this.renderer.render(this.scene, cam)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.ro.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    this.hat.dispose()
    this.dust.dispose()
    this.pool.geometry.dispose()
    this.pool.material.dispose()
    this.beam.geometry.dispose()
    this.beam.material.dispose()
    this.envTex.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}

function makePool() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  grad.addColorStop(0, 'rgba(255,196,120,0.9)')
  grad.addColorStop(0.35, 'rgba(220,150,80,0.35)')
  grad.addColorStop(1, 'rgba(120,70,30,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 256, 256)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.6),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.position.y = -0.62
  return mesh
}

function makeBeam() {
  const geo = new THREE.CylinderGeometry(0.15, 1.5, 5, 48, 1, true)
  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uOpacity: { value: 0 }, uColor: { value: new THREE.Color('#ffcf8a') } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vView;
      void main() {
        float edge = pow(abs(dot(vN, vView)), 2.0);
        float fade = smoothstep(0.0, 0.45, vUv.y) * (1.0 - smoothstep(0.75, 1.0, vUv.y));
        gl_FragColor = vec4(uColor, edge * fade * uOpacity);
      }`,
  })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(0, 1.9, 0)
  return mesh
}
