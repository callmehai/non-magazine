import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PageFlip } from 'page-flip'

/** Các phần tử nằm trong trang nhưng không được kích hoạt lật trang khi bấm/kéo */
const NO_FLIP = 'a, button, input, select, textarea, label, video, audio, iframe, [data-no-flip]'

/**
 * Bọc thư viện StPageFlip cho React.
 *
 * Mỗi trang là một <div> tạo sẵn; React render nội dung vào đó bằng portal,
 * còn StPageFlip được toàn quyền di chuyển/biến đổi các div này.
 * Nhờ vậy React và thư viện không tranh nhau cây DOM.
 */
export function useFlipBook({ pages, settings, layout, zoomed, onFlipStart }) {
  const hostRef = useRef(null)
  const flipRef = useRef(null)
  const zoomedRef = useRef(zoomed)
  const onFlipStartRef = useRef(onFlipStart)
  const currentRef = useRef(0)
  const layoutRef = useRef(layout)
  layoutRef.current = layout
  const [current, setCurrent] = useState(0)
  const [flipState, setFlipState] = useState('read')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    zoomedRef.current = zoomed
    onFlipStartRef.current = onFlipStart
  })

  const [pageEls] = useState(() =>
    pages.map((page, i) => {
      const el = document.createElement('div')
      el.className = 'mag-sheet'
      el.dataset.index = String(i)
      el.dataset.density = page.type === 'cover' ? 'hard' : 'soft'
      return el
    })
  )

  // Chặn lật trang khi tương tác với video, nút, link, mô hình 3D…
  useEffect(() => {
    const stop = (e) => {
      const t = e.target
      if (t instanceof Element && t.closest(NO_FLIP)) e.stopPropagation()
      // khi đang zoom trên màn hình cảm ứng: để trình duyệt cuộn/pan thay vì lật trang
      else if (e.type === 'touchstart' && zoomedRef.current) e.stopPropagation()
    }
    pageEls.forEach((el) => {
      el.addEventListener('mousedown', stop)
      el.addEventListener('touchstart', stop, { passive: true })
    })
    return () =>
      pageEls.forEach((el) => {
        el.removeEventListener('mousedown', stop)
        el.removeEventListener('touchstart', stop)
      })
  }, [pageEls])

  useLayoutEffect(() => {
    const host = hostRef.current
    const root = document.createElement('div')
    root.className = 'book-root'
    host.appendChild(root)
    const L = layoutRef.current
    sizeRoot(root, L)

    const pf = new PageFlip(root, {
      width: settings.pageWidth,
      height: settings.pageHeight,
      size: 'stretch',
      minWidth: L.pageW * 0.75,
      maxWidth: 10000,
      minHeight: 50,
      maxHeight: 10000,
      autoSize: false,
      showCover: true,
      usePortrait: true,
      drawShadow: true,
      maxShadowOpacity: 0.45,
      flippingTime: settings.flipDuration ?? 950,
      mobileScrollSupport: true,
      swipeDistance: 24,
      showPageCorners: true,
      startPage: currentRef.current,
    })

    pf.on('flip', (e) => {
      currentRef.current = e.data
      setCurrent(e.data)
    })
    pf.on('changeState', (e) => {
      setFlipState(e.data)
      if (e.data === 'flipping') onFlipStartRef.current?.(pf)
    })
    pf.on('init', () => setReady(true))
    pf.loadFromHTML(pageEls)
    root.style.minWidth = '0'
    root.style.minHeight = '0'
    flipRef.current = pf

    return () => {
      flipRef.current = null
      // StPageFlip không tự dừng vòng lặp render khi destroy → vô hiệu hoá nó
      const render = pf.getRender()
      if (render) render.render = () => {}
      pf.destroy()
    }
    // khởi tạo một lần; kích thước được cập nhật ở effect bên dưới
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageEls])

  // Cập nhật kích thước sách khi màn hình đổi cỡ hoặc zoom
  useLayoutEffect(() => {
    const pf = flipRef.current
    if (!pf) return
    const root = hostRef.current?.querySelector('.book-root')
    if (!root) return
    sizeRoot(root, layout)
    // orientation do layout quyết định: block < minWidth*2 → 1 trang
    pf.getSettings().minWidth = layout.pageW * 0.75
    pf.update()
  }, [layout])

  const next = useCallback(() => flipRef.current?.flipNext('bottom'), [])
  const prev = useCallback(() => flipRef.current?.flipPrev('bottom'), [])
  const flipTo = useCallback((index) => {
    const pf = flipRef.current
    if (!pf) return
    const cur = pf.getCurrentPageIndex()
    if (index === cur) return
    // trang kề nhau thì lật có hiệu ứng, xa quá thì nhảy cho nhanh
    if (Math.abs(index - cur) <= 3) pf.flip(index, 'bottom')
    else pf.turnToPage(index)
  }, [])

  return { hostRef, pageEls, currentPage: current, flipState, ready, next, prev, flipTo, flipRef }
}

function sizeRoot(root, L) {
  root.style.width = L.bookW + 'px'
  root.style.height = L.pageH + 'px'
}
