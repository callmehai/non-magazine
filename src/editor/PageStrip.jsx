import { memo, useEffect, useRef, useState } from 'react'
import CanvasPage, { LoadMode } from '../canvas/CanvasPage.jsx'
import { pageSide } from '../canvas/model.js'
import canvasBook from '../content/canvasBook.js'

const BOOK_DIRECTION = canvasBook.settings.direction
const SIDE_LABEL = { cover: ' · bìa', back: ' · bìa sau', left: ' · trái', right: ' · phải' }

/** Dải trang ở dưới (giống Canva): bấm để mở, kéo để đổi thứ tự, rê chuột để nhân bản/xoá. */
export default function PageStrip({ pages, currentId, holders, myKey, readOnly, onOpen, onAddClick, onDuplicate, onDelete, onMove }) {
  const [dragId, setDragId] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const listRef = useRef(null)
  const lastMove = useRef(0)

  useEffect(() => {
    // lật dồn dập (giữ phím mũi tên): nhảy thẳng tới, không chồng nhiều lần cuộn mượt lên nhau → dải trang không giật
    const now = performance.now()
    const quick = now - lastMove.current < 400
    lastMove.current = now
    listRef.current?.querySelector('.is-current')?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: quick ? 'auto' : 'smooth' })
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
              draggable={!readOnly}
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
              {/* không dùng <button>: trong trang có widget chứa nút (mô hình 3 lớp…) → nút lồng nút là HTML sai */}
              <div
                role="button"
                tabIndex={0}
                className="ed-sthumb__btn"
                onClick={() => onOpen(p.id)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter' && e.key !== ' ') return
                  e.preventDefault()
                  onOpen(p.id)
                }}
                title={`Trang ${i + 1}`}
              >
                <Thumb page={p} />
              </div>
              <span className="ed-sthumb__no">
                {i + 1}
                <em>{SIDE_LABEL[pageSide(i + 1, pages.length, BOOK_DIRECTION)]}</em>
              </span>
              {holder && (
                <span className="ed-sthumb__who" style={{ '--c': colorOf(holder.user?.id || holder.key) }} title={`${holder.user?.name} đang ở trang này`}>
                  {initials(holder.user?.name)}
                </span>
              )}
              {!readOnly && (
                <div className="ed-sthumb__actions">
                  <button type="button" onClick={() => onDuplicate(p.id)} title="Nhân bản trang">
                    ⧉
                  </button>
                  <button type="button" onClick={() => onDelete(p.id)} title="Xoá trang" disabled={other}>
                    🗑
                  </button>
                </div>
              )}
            </li>
          )
        })}
        {!readOnly && (
          <li className="ed-sthumb ed-sthumb--add">
            <button type="button" onClick={onAddClick} title="Thêm trang">
              +
            </button>
          </li>
        )}
      </ol>
    </div>
  )
}

/** chỉ dựng trang khi ô sắp cuộn vào tầm nhìn (rời xa thì gỡ → trình duyệt nhả ảnh); ảnh dùng bản thu nhỏ (canvas/thumbs.js) */
const Thumb = memo(function Thumb({ page }) {
  const ref = useRef(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') return setNear(true)
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '0px 800px' })
    io.observe(node)
    return () => io.disconnect()
  }, [])
  return (
    <span ref={ref} className="ed-sthumb__page">
      {near && (
        <LoadMode.Provider value="thumb">
          <CanvasPage page={page} mode="edit" />
        </LoadMode.Provider>
      )}
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
