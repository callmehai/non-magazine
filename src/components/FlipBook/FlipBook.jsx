import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import FlipBookPage from './FlipBookPage.jsx'

/** Các trang đang nằm trên mặt sách (1 hoặc 2 trang) */
export function visiblePages(current, orientation, count) {
  if (orientation === 'portrait') return [current]
  if (current === 0) return [0]
  if (current === count - 1 && count % 2 === 0) return [current]
  return [current, current + 1].filter((i) => i < count)
}

/** Vị trí so le của trang trong cặp trang (để vẽ bóng gáy sách) */
function sideOf(index, orientation, count) {
  if (orientation === 'portrait') return 'single'
  if (index === 0) return 'right'
  if (index === count - 1 && count % 2 === 0) return 'left'
  return index % 2 === 1 ? 'left' : 'right'
}

/**
 * Cuốn sách: một host div cho StPageFlip + nội dung từng trang render bằng portal.
 * `book` là kết quả của useFlipBook().
 */
export default function FlipBook({ book, magazine, layout, entered, zoomed }) {
  const { pages } = magazine
  const count = pages.length
  const { hostRef, pageEls, currentPage: current, flipState } = book
  const turning = flipState !== 'read'

  const visible = useMemo(() => visiblePages(current, layout.orientation, count), [current, layout.orientation, count])

  // Trang đã từng xuất hiện giữ nguyên trạng thái (hiệu ứng chỉ chạy một lần)
  const [revealed, setRevealed] = useState(() => new Set())
  useEffect(() => {
    if (!entered) return
    const next = new Set(visible)
    if (turning) for (let i = visible[0] - 2; i <= visible[visible.length - 1] + 2; i++) next.add(i)
    setRevealed((prev) => {
      let changed = false
      next.forEach((i) => {
        if (i >= 0 && i < count && !prev.has(i)) changed = true
      })
      if (!changed) return prev
      const merged = new Set(prev)
      next.forEach((i) => i >= 0 && i < count && merged.add(i))
      return merged
    })
  }, [visible, turning, entered, count])

  // Bìa trước/sau đứng một mình → dời sách vào giữa màn hình
  let offset = 0
  if (layout.orientation === 'landscape') {
    const alone = visible.length === 1
    if (alone && current === 0) offset = -layout.pageW / 2
    else if (alone && current === count - 1) offset = layout.pageW / 2
    if (flipState === 'flipping' && (current === 0 || current === count - 1)) offset = 0
  }

  const loadFrom = visible[0] - 3
  const loadTo = visible[visible.length - 1] + 4

  return (
    <div
      className={`book ${entered ? 'is-entered' : ''} ${zoomed ? 'is-zoomed' : ''} orientation-${layout.orientation}`}
      style={{
        '--pw': layout.pageW,
        '--ph': layout.pageH,
        width: layout.bookW,
        height: layout.pageH,
      }}
    >
      <div className="book__shift" style={{ transform: offset ? `translate3d(${offset}px,0,0)` : undefined }}>
        <div className="book__shadow" aria-hidden="true" data-alone={visible.length === 1 ? (current === 0 ? 'right' : 'left') : undefined} />
        <div ref={hostRef} className="book__host" />
      </div>
      {pageEls.map((el, i) =>
        createPortal(
          <FlipBookPage
            page={pages[i]}
            index={i}
            total={count}
            side={sideOf(i, layout.orientation, count)}
            visible={visible.includes(i)}
            revealed={revealed.has(i)}
            load={i >= loadFrom && i <= loadTo}
            runningHead={magazine.runningHead}
          />,
          el,
          pages[i].id ?? i
        )
      )}
    </div>
  )
}
