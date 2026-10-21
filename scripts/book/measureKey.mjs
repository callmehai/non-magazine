// Khoá của một khối chữ khi đo chiều cao thật: dùng chung cho build.mjs (Node) và trang đo ?measure=1 (trình duyệt).
// Hai bên phải ra cùng một khoá cho cùng chữ + cùng kiểu chữ + cùng bề rộng.

const RUBY_MIN = 12
const stripRuby = (s) => String(s ?? '').replace(/\{([^{}|]+)\|[^{}]+\}/g, '$1')
const r1 = (n) => Math.round(n * 100) / 100

export function measureKey({ text, ja, w, size, jaSize, lh, paraGap = 0, font, weight = 400, tracking = 0 }) {
  const small = size < RUBY_MIN
  const vi = small ? stripRuby(text) : String(text ?? '')
  const jp = ja ? (small ? stripRuby(ja) : String(ja)) : ''
  const raw = [vi, jp, r1(w), size, jaSize ?? size, lh, paraGap, font, weight, tracking].join('\u0001')
  // FNV-1a 53 bit
  let h1 = 0x811c9dc5
  let h2 = 0x01000193
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 16777619)
    h2 = Math.imul(h2 ^ c, 2246822519)
  }
  return ((h2 >>> 0) * 2097152 + (h1 >>> 11)).toString(36)
}
