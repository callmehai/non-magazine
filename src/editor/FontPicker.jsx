import { useEffect, useMemo, useRef, useState } from 'react'
import { FONT_LIST, FONT_GROUPS, ensureFont } from '../canvas/fonts.js'
import { fontStack } from '../canvas/CanvasPage.jsx'

const SAMPLE = { Latin: 'Aa Bb 123', default: 'あア亜 文字' }

/** Ô chọn font kiểu Canva: danh sách có xem trước bằng chính font đó, ô tìm kiếm, chia nhóm */
export default function FontPicker({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!open) return
    FONT_LIST.forEach((f) => ensureFont(f.family)) // xem trước: mỗi font chỉ tải vài chữ mẫu
    searchRef.current?.focus()
    const down = (e) => !ref.current?.contains(e.target) && setOpen(false)
    const key = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('pointerdown', down)
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('keydown', key)
    }
  }, [open])

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase()
    const out = new Map()
    for (const f of FONT_LIST) {
      if (term && !f.family.toLowerCase().includes(term) && !FONT_GROUPS[f.group].toLowerCase().includes(term)) continue
      if (!out.has(f.group)) out.set(f.group, [])
      out.get(f.group).push(f)
    }
    return out
  }, [q])

  return (
    <div className="ed-pop ed-fontpick" ref={ref}>
      <button type="button" className={`ed-cbtn ed-fontpick__btn ${open ? 'is-on' : ''}`} onClick={() => setOpen((o) => !o)} title="Font chữ">
        <span style={{ fontFamily: fontStack(value) }}>{value}</span>
        <span className="ed-caret">▾</span>
      </button>
      {open && (
        <div className="ed-pop__panel is-left ed-fontpick__panel">
          <input ref={searchRef} className="ed-input" placeholder="Tìm font…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="ed-fontpick__list">
            {[...groups].map(([g, fonts]) => (
              <div key={g}>
                <div className="ed-fontpick__group">{FONT_GROUPS[g]}</div>
                {fonts.map((f) => (
                  <button
                    key={f.family}
                    type="button"
                    className={`ed-fontpick__item ${f.family === value ? 'is-on' : ''}`}
                    onClick={() => {
                      onChange(f.family)
                      setOpen(false)
                    }}
                  >
                    <span className="ed-fontpick__name" style={{ fontFamily: fontStack(f.family) }}>
                      {f.family}
                    </span>
                    <span className="ed-fontpick__sample" style={{ fontFamily: fontStack(f.family) }}>
                      {SAMPLE[f.group] || SAMPLE.default}
                    </span>
                  </button>
                ))}
              </div>
            ))}
            {groups.size === 0 && <p className="ed-muted">Không tìm thấy font.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
