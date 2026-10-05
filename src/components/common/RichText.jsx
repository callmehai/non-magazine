import { Fragment } from 'react'

/** **đậm** và *nghiêng* trong một đoạn văn — đủ cho biên tập, không cần markdown parser. */
function inline(text) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}>{p.slice(1, -1)}</em>
    return <Fragment key={i}>{p}</Fragment>
  })
}

export default function RichText({ text, className = '', anim, delay = 0 }) {
  if (!text) return null
  const paras = Array.isArray(text) ? text : [text]
  return paras.map((p, i) => (
    <p key={i} className={className} data-anim={anim} style={{ '--d': delay + i * 0.08 + 's' }}>
      {inline(p)}
    </p>
  ))
}

export { inline }
