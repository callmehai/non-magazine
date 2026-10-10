import { memo } from 'react'
import { asset } from '../lib/assets.js'
import { PAGE_W, PAGE_H } from './model.js'

/**
 * Vẽ một trang "canvas" (dữ liệu JSON do editor tạo) — dùng chung cho editor và flipbook.
 *
 * Toạ độ, cỡ chữ… tính bằng point của trang A4 (PAGE_W × PAGE_H).
 * Khung ngoài đặt font-size = 1pt theo tỉ lệ màn hình (biến CSS --pw = bề rộng trang tính bằng px),
 * nên mọi thứ bên trong dùng đơn vị em là tự co giãn.
 *
 * mode: "read" (flipbook — link, video chạy được) | "edit" (editor — chỉ hiển thị)
 * renderEl(el, node): editor bọc thêm vùng chọn quanh từng phần tử
 */
function CanvasPage({ page, mode = 'read', renderEl, visible }) {
  return (
    <div className="cv-page" style={{ background: page.bg || '#ffffff' }}>
      {page.bgImage && <img className="cv-page__bg" src={asset(page.bgImage)} alt="" draggable="false" />}
      {(page.elements || []).map((el) => {
        const node = <Element key={el.id} el={el} mode={mode} visible={visible} />
        return renderEl ? renderEl(el, node) : node
      })}
    </div>
  )
}

export default memo(CanvasPage)

export function boxStyle(el) {
  return {
    left: `${el.x}em`,
    top: `${el.y}em`,
    width: `${el.w}em`,
    height: `${el.h}em`,
    transform: el.rot ? `rotate(${el.rot}deg)` : undefined,
    opacity: el.opacity ?? undefined,
  }
}

export function Element({ el, mode, visible }) {
  return (
    <div className={`cv-el cv-el--${el.type}`} data-id={el.id} style={boxStyle(el)}>
      <ElementBody el={el} mode={mode} visible={visible} />
    </div>
  )
}

function ElementBody({ el, mode, visible }) {
  switch (el.type) {
    case 'text':
      return <TextBody el={el} mode={mode} />
    case 'shape':
      return <ShapeBody el={el} />
    case 'line':
      return <LineBody el={el} />
    case 'image':
      return el.src ? (
        <img className="cv-img" src={asset(el.src)} alt={el.alt || ''} draggable="false" style={{ objectFit: el.fit || 'cover' }} />
      ) : (
        <div className="cv-placeholder">画像</div>
      )
    case 'video':
      return <VideoBody el={el} mode={mode} visible={visible} />
    case 'group':
      return (
        <div
          className="cv-group"
          style={{
            width: `${el.bw}em`,
            height: `${el.bh}em`,
            transform: `scale(${el.w / el.bw}, ${el.h / el.bh})`,
          }}
        >
          {el.children.map((c, i) => (
            <Element key={c.id || i} el={c} mode={mode} visible={visible} />
          ))}
        </div>
      )
    default:
      return null
  }
}

export function textStyle(el) {
  return {
    fontFamily: fontStack(el.font),
    fontWeight: el.weight || 400,
    fontStyle: el.italic ? 'italic' : 'normal',
    fontSize: `${el.size}em`,
    color: el.color,
    textAlign: el.align || 'left',
    lineHeight: el.lineHeight || 1.5,
    letterSpacing: el.tracking ? `${el.tracking / el.size}em` : undefined,
    writingMode: el.vertical ? 'vertical-rl' : undefined,
    '--para-gap': `${(el.paraGap || 0) / el.size}em`,
  }
}

function TextBody({ el, mode }) {
  const paras = String(el.text ?? '').split('\n')
  const body = (
    <div className={`cv-text ${el.vertical ? 'is-vertical' : ''}`} style={textStyle(el)}>
      {paras.map((p, i) => (
        <p key={i}>{p || ' '}</p>
      ))}
    </div>
  )
  if (el.link && mode === 'read') {
    return (
      <a className="cv-link" href={el.link} target="_blank" rel="noreferrer">
        {body}
      </a>
    )
  }
  return body
}

function ShapeBody({ el }) {
  const { w, h } = el
  const sw = el.stroke ? el.strokeWidth || 1 : 0
  const common = { fill: el.fill || 'none', stroke: el.stroke || 'none', strokeWidth: sw }
  let shape
  if (el.shape === 'ellipse') shape = <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...common} />
  else if (el.shape === 'triangle') shape = <polygon points={`0,${h} ${w / 2},0 ${w},${h}`} {...common} />
  else shape = <rect x="0" y="0" width={w} height={h} rx={el.radius || 0} {...common} />
  return (
    <svg className="cv-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {shape}
    </svg>
  )
}

function LineBody({ el }) {
  const { w, h } = el
  return (
    <svg className="cv-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1={el.x1 * w} y1={el.y1 * h} x2={el.x2 * w} y2={el.y2 * h} stroke={el.stroke} strokeWidth={el.strokeWidth || 1} />
    </svg>
  )
}

function VideoBody({ el, mode, visible }) {
  if (mode !== 'read' || !el.src) {
    return (
      <div className="cv-video-ph">
        {el.poster && <img src={asset(el.poster)} alt="" draggable="false" />}
        <span className="cv-video-ph__icon" aria-hidden="true" />
      </div>
    )
  }
  return (
    <video
      className="cv-video"
      src={asset(el.src)}
      poster={el.poster ? asset(el.poster) : undefined}
      preload="none"
      playsInline
      controls
      ref={(v) => {
        if (v && !visible) v.pause()
      }}
    />
  )
}

const STACKS = {
  'Noto Sans JP': "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
  'Noto Serif JP': "'Noto Serif JP', 'Hiragino Mincho ProN', serif",
  'Playfair Display': "'Playfair Display', 'Noto Serif JP', serif",
  'Be Vietnam Pro': "'Be Vietnam Pro', 'Noto Sans JP', sans-serif",
}

export function fontStack(name) {
  return STACKS[name] || `'${name}', 'Noto Sans JP', sans-serif`
}

/** Độ sáng của màu nền (0–255) — để chọn màu số trang */
export function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return 255
  const n = parseInt(m[1], 16)
  return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
}

export { PAGE_W, PAGE_H }
