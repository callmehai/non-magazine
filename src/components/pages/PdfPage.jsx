import { useEffect, useRef, useState } from 'react'
import { asset } from '../../lib/assets.js'
import { pdfLinks } from '../../lib/pdfLinks.js'
import { t } from '../../lib/i18n.js'

const MAX_PIXELS = 16e6

/**
 * Một trang của file PDF (xuất từ Canva/PowerPoint), vẽ bằng pdf.js lên canvas.
 * - Chỉ vẽ khi trang ở gần trang đang mở (`load`) → sách 100 trang vẫn nhẹ; trang xa thì giải phóng.
 * - Vẽ lại theo kích thước thật trên màn hình → zoom vẫn nét.
 * - `page.overlays`: video/link đặt đè lên trang, toạ độ tính bằng % khổ trang.
 * - `page.folio`: số trang web tự in ở góc dưới phía mép ngoài; màu sáng/tối theo nền chỗ đó.
 */
export default function PdfPage({ page, index, total, side, load, visible, variant }) {
  const isThumb = variant === 'thumb'
  const boxRef = useRef(null)
  const canvasHostRef = useRef(null)
  const [width, setWidth] = useState(0)
  const [inView, setInView] = useState(!isThumb)
  const [drawn, setDrawn] = useState(false)
  const [links, setLinks] = useState([])
  const [folioTone, setFolioTone] = useState('dark')

  useEffect(() => {
    const el = boxRef.current
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)))
    ro.observe(el)
    let io
    if (isThumb) {
      io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: '300px' })
      io.observe(el)
    }
    return () => {
      ro.disconnect()
      io?.disconnect()
    }
  }, [isThumb])

  const blank = !page.pdfPage
  const shouldDraw = !blank && (isThumb ? inView : load) && width > 0

  useEffect(() => {
    const host = canvasHostRef.current
    if (!shouldDraw) {
      // trang đã xa: trả bộ nhớ canvas
      host.replaceChildren()
      setDrawn(false)
      return
    }
    let task = null
    let cancelled = false
    // vẽ lần đầu ngay; đổi cỡ (zoom/resize) thì đợi một nhịp cho đỡ vẽ dồn
    const timer = setTimeout(
      async () => {
        const pdfPage = await page.doc.getPage(page.pdfPage)
        if (cancelled) return
        const base = pdfPage.getViewport({ scale: 1 })
        const dpr = Math.min(window.devicePixelRatio || 1, isThumb ? 1.5 : 2.5)
        let scale = (width * dpr) / base.width
        const area = base.width * base.height * scale * scale
        if (area > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / area)
        const viewport = pdfPage.getViewport({ scale })
        const canvas = document.createElement('canvas')
        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)
        task = pdfPage.render({ canvas, viewport })
        try {
          await task.promise
        } catch {
          return // bị huỷ do lật sang trang khác / đổi cỡ
        }
        if (cancelled) return
        host.replaceChildren(canvas)
        setDrawn(true)
        if (page.folio && !isThumb) setFolioTone(toneAt(canvas, side))
        if (!isThumb) pdfLinks(pdfPage).then((l) => !cancelled && setLinks(l), () => {})
      },
      host.firstChild ? 140 : 0
    )
    return () => {
      cancelled = true
      clearTimeout(timer)
      task?.cancel()
    }
  }, [shouldDraw, width, page.doc, page.pdfPage, page.folio, isThumb, side])

  const overlays = isThumb ? [] : [...links, ...page.overlays]

  return (
    <article ref={boxRef} className={`pdf-page side-${side} ${drawn ? 'is-drawn' : ''}`} aria-label={t('pageOf', { n: index + 1, total })}>
      <div ref={canvasHostRef} className="pdf-page__canvas" />
      {!drawn && !blank && (
        <span className="pdf-page__loading" aria-hidden="true">
          {index + 1}
        </span>
      )}
      {overlays.map((o, i) => (
        <Overlay key={i} item={o} visible={visible} />
      ))}
      {page.folio && !isThumb && (
        <span className={`pdf-page__folio is-${folioTone}`} aria-hidden="true">
          {String(page.folio).padStart(2, '0')}
        </span>
      )}
      {!page.hard && !isThumb && <div className="page__gutter" aria-hidden="true" />}
    </article>
  )
}

/** Nền ở góc đặt số trang sáng hay tối → chọn màu chữ tương phản */
function toneAt(canvas, side) {
  try {
    const { width: w, height: h } = canvas
    const sw = Math.max(1, Math.round(w * 0.12))
    const sh = Math.max(1, Math.round(h * 0.05))
    const x = side === 'left' ? Math.round(w * 0.03) : w - sw - Math.round(w * 0.03)
    const data = canvas.getContext('2d').getImageData(x, h - sh - Math.round(h * 0.01), sw, sh).data
    let sum = 0
    for (let i = 0; i < data.length; i += 4) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]
    return sum / (data.length / 4) < 140 ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

function Overlay({ item, visible }) {
  const style = { left: `${item.x}%`, top: `${item.y}%`, width: `${item.w}%`, height: `${item.h}%` }
  if (item.type === 'link') {
    return <a className="pdf-overlay pdf-overlay--link" style={style} href={item.href} target="_blank" rel="noreferrer" aria-label={item.title || item.href} title={item.title || item.href} />
  }
  if (item.type === 'video') return <OverlayVideo item={item} style={style} visible={visible} />
  return null
}

function OverlayVideo({ item, style, visible }) {
  const ref = useRef(null)
  useEffect(() => {
    const v = ref.current
    if (!v) return
    if (!visible) v.pause()
    else if (item.autoplay) v.play().catch(() => {})
  }, [visible, item.autoplay])

  return (
    <div className="pdf-overlay pdf-overlay--video" style={style}>
      <video
        ref={ref}
        src={asset(item.src)}
        poster={item.poster ? asset(item.poster) : undefined}
        preload="none"
        playsInline
        muted={item.muted ?? true}
        loop={!!item.loop}
        controls={item.controls ?? true}
        aria-label={item.title}
      />
    </div>
  )
}
