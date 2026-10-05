import * as THREE from 'three'

/** Bụi vàng lơ lửng trong ánh nắng — một draw call, chuyển động trong shader. */
export function createDust(count = 500) {
  const geo = new THREE.BufferGeometry()
  const pos = new Float32Array(count * 3)
  const seed = new Float32Array(count * 3) // phase, scale, speed
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 12
    pos[i * 3 + 1] = (Math.random() - 0.5) * 7
    pos[i * 3 + 2] = (Math.random() - 0.5) * 6 - 0.5
    seed[i * 3] = Math.random() * Math.PI * 2
    seed[i * 3 + 1] = 0.4 + Math.random() * 1.2
    seed[i * 3 + 2] = 0.03 + Math.random() * 0.08
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3))

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
      uColor: { value: new THREE.Color('#ffd58f') },
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uPixelRatio;
      attribute vec3 aSeed;
      varying float vTwinkle;
      void main() {
        vec3 p = position;
        float t = uTime * aSeed.z;
        p.y = mod(p.y + t * 6.0 + 3.5, 7.0) - 3.5;
        p.x += sin(uTime * 0.25 + aSeed.x) * 0.25;
        p.z += cos(uTime * 0.2 + aSeed.x * 1.3) * 0.2;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = aSeed.y * 9.0 * uPixelRatio / -mv.z;
        vTwinkle = 0.55 + 0.45 * sin(uTime * 1.5 + aSeed.x * 7.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uOpacity;
      uniform vec3 uColor;
      varying float vTwinkle;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d);
        gl_FragColor = vec4(uColor, a * a * uOpacity * vTwinkle);
      }`,
  })

  const points = new THREE.Points(geo, mat)
  points.frustumCulled = false

  return {
    points,
    update(time, dt, targetOpacity) {
      mat.uniforms.uTime.value = time
      const u = mat.uniforms.uOpacity
      u.value += (targetOpacity - u.value) * Math.min(1, (dt || 0.016) * 1.5)
    },
    dispose() {
      geo.dispose()
      mat.dispose()
    },
  }
}
