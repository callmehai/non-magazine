/**
 * Âm thanh tổng hợp bằng Web Audio — không cần file nào:
 *  - tiếng giấy khi lật trang
 *  - nhạc nền ngũ cung nhẹ (dùng khi chưa có file nhạc nền)
 * AudioContext chỉ được tạo/resume sau thao tác của người dùng (đúng autoplay policy).
 */

let ctx = null
let noise = null

export function getAudioContext() {
  if (ctx) return ctx
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  // tạo AudioContext trước khi người dùng thao tác sẽ bị chặn (và Chrome báo warning)
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null
  ctx = new AC()
  return ctx
}

function noiseBuffer(c) {
  if (noise) return noise
  const len = c.sampleRate * 1.2
  noise = c.createBuffer(1, len, c.sampleRate)
  const data = noise.getChannelData(0)
  // pink-ish noise: bớt chói hơn white noise
  let b0 = 0, b1 = 0, b2 = 0
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1
    b0 = 0.99765 * b0 + w * 0.099046
    b1 = 0.963 * b1 + w * 0.2965164
    b2 = 0.57 * b2 + w * 1.0526913
    data[i] = (b0 + b1 + b2 + w * 0.1848) * 0.2
  }
  return noise
}

/** Tiếng giấy sột soạt khi lật trang. `hard` = bìa cứng, thêm tiếng "bộp" trầm. */
export function playFlipSound({ hard = false, volume = 0.6 } = {}) {
  const c = getAudioContext()
  if (!c) return
  if (c.state === 'suspended') c.resume().catch(() => {})
  const t = c.currentTime + 0.01
  const dur = hard ? 0.55 : 0.48

  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  src.playbackRate.value = 0.9 + Math.random() * 0.2

  const band = c.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = 0.8
  band.frequency.setValueAtTime(700, t)
  band.frequency.exponentialRampToValueAtTime(3400, t + dur * 0.4)
  band.frequency.exponentialRampToValueAtTime(1200, t + dur)

  const high = c.createBiquadFilter()
  high.type = 'highpass'
  high.frequency.value = 280

  // biên độ "lạo xạo": đường cong ngẫu nhiên trên nền envelope
  const env = c.createGain()
  const steps = 48
  const curve = new Float32Array(steps)
  for (let i = 0; i < steps; i++) {
    const p = i / (steps - 1)
    const shape = Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.25)), 1.6)
    curve[i] = Math.max(0.0001, shape * (0.65 + Math.random() * 0.35) * volume * 0.55)
  }
  env.gain.setValueAtTime(0.0001, t)
  env.gain.setValueCurveAtTime(curve, t, dur)

  src.connect(band).connect(high).connect(env).connect(c.destination)
  src.start(t)
  src.stop(t + dur + 0.05)

  if (hard) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(110, t + dur * 0.75)
    o.frequency.exponentialRampToValueAtTime(48, t + dur * 0.75 + 0.18)
    g.gain.setValueAtTime(0.0001, t + dur * 0.75)
    g.gain.exponentialRampToValueAtTime(0.28 * volume, t + dur * 0.75 + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.75 + 0.25)
    o.connect(g).connect(c.destination)
    o.start(t + dur * 0.75)
    o.stop(t + dur * 0.75 + 0.3)
  }
}

function impulse(c, seconds = 3.2, decay = 2.6) {
  const len = c.sampleRate * seconds
  const buf = c.createBuffer(2, len, c.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

// Ngũ cung (D – F – G – A – C) qua hai quãng tám
const SCALE = [293.66, 349.23, 392.0, 440.0, 523.25, 587.33, 698.46, 783.99]

/**
 * Nhạc nền tổng hợp: một nền drone trầm + những tiếng gảy như đàn tranh,
 * thỉnh thoảng có luyến cao độ kiểu đàn bầu.
 */
export function createAmbient() {
  let master = null
  let nodes = []
  let timer = null
  let volume = 0.5

  const gainFor = (v) => v * 0.32

  function pluck(when) {
    const c = ctx
    const f = SCALE[Math.floor(Math.random() * SCALE.length)]
    const o1 = c.createOscillator()
    const o2 = c.createOscillator()
    const g = c.createGain()
    const lp = c.createBiquadFilter()
    o1.type = 'triangle'
    o2.type = 'sine'
    o1.frequency.setValueAtTime(f, when)
    o2.frequency.setValueAtTime(f * 2, when)
    if (Math.random() < 0.3) {
      // luyến nhẹ
      const bend = f * (Math.random() < 0.5 ? 1.06 : 0.95)
      o1.frequency.setValueAtTime(f, when + 0.35)
      o1.frequency.linearRampToValueAtTime(bend, when + 0.9)
      o2.frequency.setValueAtTime(f * 2, when + 0.35)
      o2.frequency.linearRampToValueAtTime(bend * 2, when + 0.9)
    }
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(2600, when)
    lp.frequency.exponentialRampToValueAtTime(700, when + 2)
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(0.2, when + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, when + 3.2)
    const g2 = c.createGain()
    g2.gain.value = 0.25
    o1.connect(lp)
    o2.connect(g2).connect(lp)
    lp.connect(g).connect(master)
    o1.start(when)
    o2.start(when)
    o1.stop(when + 3.4)
    o2.stop(when + 3.4)
  }

  function schedule() {
    if (!master) return
    const now = ctx.currentTime
    pluck(now + 0.05)
    if (Math.random() < 0.35) pluck(now + 0.32 + Math.random() * 0.2)
    timer = setTimeout(schedule, 1700 + Math.random() * 2600)
  }

  return {
    async start() {
      const c = getAudioContext()
      if (!c) throw new Error('Audio chưa được phép (cần người dùng bấm) hoặc không được hỗ trợ')
      // chưa có thao tác người dùng thì resume() treo mãi → giới hạn thời gian chờ
      if (c.state === 'suspended') await Promise.race([c.resume(), new Promise((r) => setTimeout(r, 300))])
      if (c.state !== 'running') throw new Error('Audio bị chặn')
      if (master) return
      master = c.createGain()
      master.gain.setValueAtTime(0.0001, c.currentTime)
      master.gain.exponentialRampToValueAtTime(Math.max(0.0001, gainFor(volume)), c.currentTime + 2.5)

      const verb = c.createConvolver()
      verb.buffer = impulse(c)
      const wet = c.createGain()
      wet.gain.value = 0.55
      const out = c.createGain()
      master.connect(out)
      master.connect(verb).connect(wet).connect(out)
      out.connect(c.destination)

      // drone
      const lp = c.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 420
      const dg = c.createGain()
      dg.gain.value = 0.07
      const lfo = c.createOscillator()
      const lfoGain = c.createGain()
      lfo.frequency.value = 0.07
      lfoGain.gain.value = 0.03
      lfo.connect(lfoGain).connect(dg.gain)
      const drones = [73.42, 110.0, 146.83].map((f, i) => {
        const o = c.createOscillator()
        o.type = 'sine'
        o.frequency.value = f
        o.detune.value = (i - 1) * 4
        o.connect(lp)
        o.start()
        return o
      })
      lp.connect(dg).connect(master)
      lfo.start()
      nodes = [...drones, lfo, out]
      timer = setTimeout(schedule, 900)
    },
    stop() {
      if (!master) return
      clearTimeout(timer)
      const c = ctx
      const m = master
      const ns = nodes
      master = null
      nodes = []
      m.gain.cancelScheduledValues(c.currentTime)
      m.gain.setValueAtTime(Math.max(0.0001, m.gain.value), c.currentTime)
      m.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.6)
      setTimeout(() => {
        ns.forEach((n) => {
          try {
            n.stop?.()
            n.disconnect()
          } catch {
            /* đã dừng */
          }
        })
      }, 700)
    },
    setVolume(v) {
      volume = v
      if (master) master.gain.setTargetAtTime(Math.max(0.0001, gainFor(v)), ctx.currentTime, 0.15)
    },
  }
}
