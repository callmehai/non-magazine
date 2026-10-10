import { memo, useEffect, useRef, useState } from 'react'
import CanvasPage from '../canvas/CanvasPage.jsx'

/** Dải trang ở dưới (giống Canva): bấm để mở, kéo để đổi thứ tự, rê chuột để nhân bản/xoá. */
export default function PageStrip({ pages, currentId, holders, myKey, onOpen, onAddClick, onDuplicate, onDelete, onMove }) {
  const [dragId, setDragId] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const listRef = useRef(null)

  useEffect(() => {
    listRef.current?.querySelector('.is-current')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' })
  }, [currentId])

  return (
    <div className="ed-strip">
      <ol className="ed-strip__list" ref={listRef}>
        {pages.map((p, i) => {
          const holder = holders.get(p.id)
          const other = holder && holder.key !== myKey
          return (
            <li
              key={p.id}
              className={`ed-sthumb ${p.id === currentId ? 'is-current' : ''} ${overIdx === i ? 'is-over' : ''} ${dragId === p.id ? 'is-dragging' : ''}`}
              draggable
              onDragStart={(e) => {
                setDragId(p.id)
                e.dataTransfer.effectAllowed = 'move'
              }}
              onDragOver={(e) => {
                if (!dragId) return
                e.preventDefault()
                setOverIdx(i)
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (dragId) onMove(dragId, i)
                setDragId(null)
                setOverIdx(null)
              }}
              onDragEnd={() => {
                setDragId(null)
                setOverIdx(null)
              }}
            >
              <button type="button" className="ed-sthumb__btn" onClick={() => onOpen(p.id)} title={`Trang ${i + 1}`}>
                <Thumb page={p} />
              </button>
              <span className="ed-sthumb__no">
                {i + 1}
                <em>{i === 0 ? ' · bìa' : i === pages.length - 1 ? ' · bìa sau' : i % 2 === 1 ? ' · phải' : ' · trái'}</em>
              </span>
              {holder && (
                <span className="ed-sthumb__who" style={{ '--c': colorOf(holder.user?.id || holder.key) }} title={`${holder.user?.name} đang ở trang này`}>
                  {initials(holder.user?.name)}
                </span>
              )}
              <div className="ed-sthumb__actions">
                <button type="button" onClick={() => onDuplicate(p.id)} title="Nhân bản trang">
                  ⧉
                </button>
                <button type="button" onClick={() => onDelete(p.id)} title="Xoá trang" disabled={other}>
                  🗑
                </button>
              </div>
            </li>
          )
        })}
        <li className="ed-sthumb ed-sthumb--add">
          <button type="button" onClick={onAddClick} title="Thêm trang">
            +
          </button>
        </li>
      </ol>
    </div>
  )
}

const Thumb = memo(function Thumb({ page }) {
  return (
    <span className="ed-sthumb__page">
      <CanvasPage page={page} mode="edit" />
    </span>
  )
})

const COLORS = ['#c0392b', '#2e86de', '#27ae60', '#8e44ad', '#d35400', '#16a085', '#b8955a', '#e84393']
export function colorOf(key = '') {
  let h = 0
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

export function initials(name = '?') {
  // chỉ lấy chữ cái đầu của 2 từ đầu tiên (bỏ ngoặc, số, ký hiệu)
  const words = name.split(/\s+/).filter((w) => /^\p{L}/u.test(w))
  return (words.slice(0, 2).map((w) => w[0]).join('') || '?').toUpperCase()
}
