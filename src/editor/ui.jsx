import { useEffect, useRef, useState } from 'react'
import { PALETTE } from '../canvas/model.js'

/** Nút mở một khung nổi (popover) ngay bên dưới; bấm ra ngoài hoặc Esc để đóng */
export function Popover({ button, children, className = '', align = 'left', title }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const down = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const key = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
  }, [open])
  return (
    <div className={`ed-pop ${className}`} ref={ref}>
      <button type="button" className={`ed-cbtn ${open ? 'is-on' : ''}`} onClick={() => setOpen((o) => !o)} title={title} aria-expanded={open}>
        {button}
      </button>
      {open && <div className={`ed-pop__panel is-${align}`}>{typeof children === 'function' ? children(() => setOpen(false)) : children}</div>}
    </div>
  )
}

/** Ô màu: bảng màu của sách + màu đang dùng trong trang + màu tuỳ ý */
export function ColorButton({ value, onChange, docColors = [], allowNone, title = 'Màu', icon }) {
  const shown = value && value !== 'none' ? value : 'transparent'
  return (
    <Popover
      title={title}
      button={
        icon ? (
          <span className="ed-colorbtn">
            {icon}
            <i style={{ background: shown }} />
          </span>
        ) : (
          <span className={`ed-colordot ${!value ? 'is-none' : ''}`} style={{ background: shown }} />
        )
      }
    >
      <div className="ed-colorpop">
        <div className="ed-colorpop__label">Màu của sách</div>
        <Swatches colors={PALETTE} value={value} onChange={onChange} />
        {docColors.length > 0 && (
          <>
            <div className="ed-colorpop__label">Màu đang dùng trong trang</div>
            <Swatches colors={docColors} value={value} onChange={onChange} />
          </>
        )}
        <div className="ed-colorpop__row">
          <label className="ed-swatch is-custom" title="Chọn màu khác">
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000'} onChange={(e) => onChange(e.target.value)} />
          </label>
          <input
            className="ed-input ed-input--hex"
            value={value || ''}
            placeholder="#7d2f2a"
            onChange={(e) => /^#[0-9a-f]{6}$/i.test(e.target.value) && onChange(e.target.value)}
          />
          {allowNone && (
            <button type="button" className="ed-btn" onClick={() => onChange(null)}>
              Không màu
            </button>
          )}
        </div>
      </div>
    </Popover>
  )
}

function Swatches({ colors, value, onChange }) {
  return (
    <div className="ed-colors">
      {colors.map((c) => (
        <button key={c} type="button" className={`ed-swatch ${value === c ? 'is-on' : ''}`} style={{ background: c }} onClick={() => onChange(c)} title={c} aria-label={c} />
      ))}
    </div>
  )
}

/** Ô số có nút − / + (kiểu ô cỡ chữ của Canva) */
export function Stepper({ value, onChange, step = 1, min = 1, max = 999, title, width = 44 }) {
  const [draft, setDraft] = useState(null)
  const v = Math.round(value * 10) / 10
  const set = (n) => onChange(Math.min(max, Math.max(min, Math.round(n * 10) / 10)))
  return (
    <div className="ed-stepper" title={title}>
      <button type="button" onClick={() => set(v - step)} aria-label="Giảm">
        −
      </button>
      <input
        style={{ width }}
        value={draft ?? v}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          const n = parseFloat(draft)
          if (!Number.isNaN(n)) set(n)
          setDraft(null)
        }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      />
      <button type="button" onClick={() => set(v + step)} aria-label="Tăng">
        +
      </button>
    </div>
  )
}

/** Thanh trượt + số (độ mờ, giãn dòng…) */
export function Slider({ label, value, min, max, step, onChange, suffix = '' }) {
  return (
    <label className="ed-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output>
        {Math.round(value * 100) / 100}
        {suffix}
      </output>
    </label>
  )
}

export function NumberField({ label, value, onChange, min, max, step = 1 }) {
  return (
    <label className="ed-num">
      <span>{label}</span>
      <input
        type="number"
        value={Math.round((Number(value) || 0) * 10) / 10}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          if (!Number.isNaN(v)) onChange(Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v)))
        }}
      />
    </label>
  )
}

export function IconBtn({ on, onClick, title, children, disabled, danger }) {
  return (
    <button type="button" className={`ed-cbtn ${on ? 'is-on' : ''} ${danger ? 'is-danger' : ''}`} onClick={onClick} title={title} aria-label={title} aria-pressed={on} disabled={disabled}>
      {children}
    </button>
  )
}

export function UploadButton({ accept, onFiles, children, className = 'ed-btn', multiple }) {
  const ref = useRef(null)
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current.click()}>
        {children}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        hidden
        onChange={(e) => {
          const files = [...(e.target.files || [])]
          e.target.value = ''
          if (files.length) onFiles(files)
        }}
      />
    </>
  )
}

/** Màu đang dùng trong trang (chữ, nền, hình) — để chọn lại nhanh */
export function colorsOfPage(page) {
  const set = new Set()
  const walk = (els) =>
    els?.forEach((e) => {
      ;[e.color, e.fill, e.stroke].forEach((c) => c && /^#[0-9a-f]{6}$/i.test(c) && set.add(c.toLowerCase()))
      walk(e.children)
    })
  if (page?.bg) set.add(page.bg.toLowerCase())
  walk(page?.elements)
  return [...set].filter((c) => !PALETTE.includes(c)).slice(0, 12)
}
