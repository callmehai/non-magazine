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
 *
 * Sách lật kiểu Nhật (settings.direction = 'rtl'): StPageFlip chỉ biết lật trái → phải,
 * nên các trang được đưa vào thư viện theo thứ tự ngược (bìa trước nằm cuối, mở ở mép trái).
 * Mọi số trang đi ra khỏi hook này (currentPage, flipTo…) vẫn là số trang "đọc" 0, 1, 2…
 */
export function useFlipBook({ pages, settings, layout, zoomed, onFlipStart }) {
  const hostRef = useRef(null)
  const flipRef = useRef(null)
  const zoomedRef = useRef(zoomed)
  const onFlipStartRef = useRef(onFlipStart)
  const currentRef = useRef(0)
  const layoutRef = useRef(layout)
  const redrawRef = useRef(0) // số khung hình còn phải vẽ lại sau một thay đổi
  const wakeRef = useRef(null) // đánh thức vòng lặp render đang ngủ
  layoutRef.current = layout
  const [current, setCurrent] = useState(0)
  const [flipState, setFlipState] = useState('read')
  // hướng lật đang chạy theo thứ tự đọc: 'next' | 'prev' (để dời sách vào giữa ngay trong lúc lật bìa)
  const [flipDir, setFlipDir] = useState(null)
  const [ready, setReady] = useState(false)
  const rtl = settings.direction === 'rtl'
  const count = pages.length

  useEffect(() => {
    zoomedRef.current = zoomed
    onFlipStartRef.current = onFlipStart
  })

  const [pageEls] = useState(() =>
    pages.map((page, i) => {
      const el = document.createElement('div')
      el.className = 'mag-sheet'
      el.dataset.index = String(i)
      el.dataset.density = (page.type === 'cover' || page.hard) && !page.soft ? 'hard' : 'soft'
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
      maxShadowOpacity: 0.6,
      flippingTime: settings.flipDuration ?? 950,
      mobileScrollSupport: true,
      swipeDistance: 24,
      showPageCorners: true,
      startPage: rtl ? count - 1 - currentRef.current : currentRef.current,
    })

    pf.on('flip', (e) => {
      const page = rtl ? fromPhysical(e.data, pf.getOrientation(), count) : e.data
      currentRef.current = page
      setCurrent(page)
    })
    pf.on('changeState', (e) => {
      if (e.data === 'flipping' || e.data === 'user_fold') {
        const back = pf.getFlipController().getCalculation()?.getDirection() === 1 // FlipDirection.BACK
        setFlipDir(back !== rtl ? 'prev' : 'next')
      } else if (e.data === 'read') setFlipDir(null)
      setFlipState(e.data)
      if (e.data === 'flipping') onFlipStartRef.current?.(pf)
    })
    pf.on('init', () => setReady(true))
    const order = rtl ? [...pageEls].reverse() : pageEls
    pf.loadFromHTML(order)
    // vùng "góc trang" mặc định của StPageFlip rộng 1/5 đường chéo (~200px): rê chuột vào là mép giấy cuộn lên theo chuột,
    // che mất nút "Đọc thêm", thẻ chương… và bấm không được → thu còn ~1/14 đường chéo, và không cuộn khi chuột đang ở trên nút/link
    // (bộ điều khiển lật chỉ có sau loadFromHTML)
    {
      const fc = pf.getFlipController()
      let lastEl = null
      const onPointer = (e) => (lastEl = e.target)
      root.addEventListener('pointermove', onPointer, { passive: true })
      fc.isPointOnCorners = function (t) {
        if (lastEl?.closest?.('a, button, [role="button"], [data-link], video, input')) return false
        const r = this.getBoundsRect()
        const s = Math.hypot(r.pageWidth, r.height) / 14
        const b = this.render.convertToBook(t)
        return b.x > 0 && b.y > 0 && b.x < r.width && b.y < r.height && (b.x < s || b.x > r.width - s) && (b.y < s || b.y > r.height - s)
      }
    }
    // showCover khiến StPageFlip ép bìa trước/sau thành "bìa cứng" (xoay phẳng như cánh cửa);
    // trang nào được yêu cầu mềm thì trả lại mềm để lật cong như giấy
    order.forEach((el, i) => {
      if (el.dataset.density === 'soft') pf.getPage(i)?.setDensity('soft')
    })
    // StPageFlip vẽ lại cả 66 trang ở mọi khung hình kể cả khi sách nằm yên (gán lại style từng trang)
    // → chỉ vẽ khi đang lật / rê góc, hoặc vài khung ngay sau một thay đổi
    const render = pf.getRender()
    const drawFrame = render.drawFrame.bind(render)
    render.drawFrame = () => {
      if (pf.getState() !== 'read' || render.animation || redrawRef.current > 0) {
        drawFrame()
        clipUnderCover(pf, render)
        if (redrawRef.current > 0) redrawRef.current--
      }
    }
    // Vòng lặp render của StPageFlip chạy requestAnimationFrame mãi mãi, kể cả khi sách nằm yên → trình duyệt dựng khung
    // hình 60–120 lần/giây cho không (đo ở bản build: ~15% CPU lúc chỉ ngồi đọc). Thay bằng vòng lặp của mình: sách yên
    // ~20 khung thì ngủ hẳn, có thao tác (rê/chạm, lật, đổi cỡ) thì thức dậy.
    const SLEEP = Symbol('flip-sleep')
    const swallow = (e) => e.error === SLEEP && e.preventDefault()
    window.addEventListener('error', swallow)
    const renderOnce = render.render.bind(render)
    let sleeping = false
    let idle = 0
    let alive = true
    const step = (t) => {
      if (!alive) return
      renderOnce(t)
      const busy = pf.getState() !== 'read' || render.animation || redrawRef.current > 0
      idle = busy ? 0 : idle + 1
      if (idle > 20) sleeping = true
      else requestAnimationFrame(step)
    }
    const wake = () => {
      idle = 0
      if (sleeping && alive) {
        sleeping = false
        requestAnimationFrame(step)
      }
    }
    // vòng lặp gốc chết ở khung kế tiếp (ném SLEEP, đã chặn báo lỗi); từ đây chỉ còn vòng lặp step
    render.render = () => {
      render.render = () => {}
      throw SLEEP
    }
    requestAnimationFrame(step)
    const startAnimation = render.startAnimation.bind(render)
    render.startAnimation = (...a) => {
      wake()
      return startAnimation(...a)
    }
    ;['pointerdown', 'pointermove', 'touchstart', 'wheel'].forEach((ev) => root.addEventListener(ev, wake, { passive: true }))
    wakeRef.current = wake
    const touch = () => {
      redrawRef.current = 4
      wake()
    }
    touch()
    pf.on('flip', touch)
    pf.on('changeState', touch)
    pf.on('changeOrientation', touch)
    pf.on('init', touch)
    root.style.minWidth = '0'
    root.style.minHeight = '0'
    flipRef.current = pf

    return () => {
      flipRef.current = null
      alive = false
      wakeRef.current = null
      window.removeEventListener('error', swallow)
      // StPageFlip không tự dừng vòng lặp render khi destroy → vô hiệu hoá nó
      const r = pf.getRender()
      if (r) r.render = () => {}
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
    redrawRef.current = 4
    wakeRef.current?.()
  }, [layout])

  // rtl: trang sau nằm bên trái → lật ngược lại về phía phải
  const next = useCallback(() => (rtl ? flipRef.current?.flipPrev('bottom') : flipRef.current?.flipNext('bottom')), [rtl])
  const prev = useCallback(() => (rtl ? flipRef.current?.flipNext('bottom') : flipRef.current?.flipPrev('bottom')), [rtl])
  const flipTo = useCallback(
    (index) => {
      const pf = flipRef.current
      if (!pf) return
      const cur = currentRef.current
      if (index === cur) return
      const target = rtl ? count - 1 - index : index
      // trang kề nhau thì lật có hiệu ứng, xa quá thì nhảy cho nhanh
      if (Math.abs(index - cur) <= 3) pf.flip(target, 'bottom')
      else {
        redrawRef.current = 4
        wakeRef.current?.()
        pf.turnToPage(target)
      }
    },
    [rtl, count]
  )

  return { hostRef, pageEls, currentPage: current, flipState, flipDir, ready, next, prev, flipTo, flipRef, rtl }
}

/**
 * rtl: trang StPageFlip đang báo (trang trái của cặp, theo thứ tự vật lý) → trang "đọc" đầu tiên đang mở.
 * Cặp trang vật lý (p, p+1) chứa trang đọc (n-2-p, n-1-p); trang đứng một mình chỉ là n-1-p.
 */
function fromPhysical(p, orientation, n) {
  const paired = orientation === 'landscape' && p !== 0 && p !== n - 1
  return paired ? n - 2 - p : n - 1 - p
}

/**
 * Lỗi của StPageFlip khi lật tờ bìa đứng một mình (đóng bìa trước / mở bìa sau): "trang bên dưới" chính là
 * tờ đang lật, nên trang tĩnh cùng phía (trang lót) không bị che ở phần tờ bìa vừa nhấc lên → trông như hai tờ.
 * Cắt bỏ phần đó khỏi trang tĩnh (path evenodd = cả trang trừ vùng đã nhấc).
 */
function clipUnderCover(pf, render) {
  const flipping = render.flippingPage
  if (!flipping || flipping !== render.bottomPage || pf.getOrientation() !== 'landscape') return
  const back = render.direction === 1 // FlipDirection.BACK
  const page = back ? render.leftPage : render.rightPage
  const area = pf.getFlipController().getCalculation()?.getBottomClipArea()
  if (!page || !area) return
  const { pageWidth: w, height: h } = render.getRect()
  const pts = area.filter(Boolean).map((p) => `${(back ? w - p.x : p.x).toFixed(1)} ${p.y.toFixed(1)}`)
  if (pts.length < 3) return
  const d = `M0 0 H${w} V${h} H0 Z M${pts.join(' L')} Z`
  const el = page.getElement()
  el.style.clipPath = `path(evenodd, '${d}')`
}

function sizeRoot(root, L) {
  root.style.width = L.bookW + 'px'
  root.style.height = L.pageH + 'px'
}
