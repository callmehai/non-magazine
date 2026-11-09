import { useEffect, useRef, useState } from 'react'
import CanvasPage, { LoadMode, luminance } from '../../canvas/CanvasPage.jsx'
import { t } from '../../lib/i18n.js'
import '../../canvas/canvas.css'

/** Trang dựng từ editor (dữ liệu JSON) trong flipbook: nội dung + số trang + bóng gáy sách */
export default function CanvasSheet({ page, index, total, side, visible, load, warm, variant }) {
  const isThumb = variant === 'thumb'
  // ảnh chỉ tải khi trang đã gần trang đang đọc (load); tải rồi thì giữ, lật lui không tải lại
  const [near, setNear] = useState(load)
  if (load && !near) setNear(true)
  // tải nền (FlipBook): trang còn xa nhưng đã tới lượt → chỉ tải ảnh trước; giữ luôn khi đã bật
  const [warmed, setWarmed] = useState(warm)
  if (warm && !warmed) setWarmed(true)
  const tone = luminance(page.data.bg) < 140 ? 'light' : 'dark'
  // review lần 2 (tr. 66, lần đầu mở, ảnh chưa có trong cache): Chrome vẽ dở tấm trang — cắt ngang, mảng trắng — tới khi rê
  // chuột mới vẽ lại. Ảnh của trang giải mã xong thì ép vẽ lại cả tấm một lần (đổi lớp vẽ rồi trả về sau hai khung hình)
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!visible || isThumb || !el) return
    let alive = true
    const imgs = [...el.querySelectorAll('img')]
    Promise.all(imgs.map((i) => i.decode?.().catch(() => {}))).then(() => {
      if (!alive) return
      el.style.transform = 'translateZ(0)'
      requestAnimationFrame(() => requestAnimationFrame(() => alive && (el.style.transform = '')))
    })
    return () => {
      alive = false
    }
  }, [visible, isThumb, near])
  return (
    <article ref={ref} className={`canvas-sheet side-${side}`} aria-label={t('pageOf', { n: index + 1, total })}>
      <LoadMode.Provider value={isThumb ? 'lazy' : near ? 'eager' : warmed ? 'warm' : 'off'}>
        <CanvasPage page={page.data} mode={isThumb ? 'edit' : 'read'} visible={visible} side={side === 'left' ? 'left' : 'right'} />
      </LoadMode.Provider>
      {page.folio && !isThumb && (
        <span className={`cv-folio is-${tone}`} aria-hidden="true">
          {String(page.folio).padStart(2, '0')}
        </span>
      )}
      {!page.hard && !isThumb && <div className="page__gutter" aria-hidden="true" />}
    </article>
  )
}
