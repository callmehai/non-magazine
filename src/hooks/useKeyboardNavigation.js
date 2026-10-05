import { useEffect, useRef } from 'react'

const isTyping = (el) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

/**
 * Phím tắt:
 *  ← trang trước · → / Space trang sau · F fullscreen · Esc thoát fullscreen/đóng panel
 *  + / − zoom · 0 về 100% · Home / End trang đầu/cuối · T mục lục
 */
export function useKeyboardNavigation(handlers, enabled = true) {
  const ref = useRef(handlers)
  useEffect(() => {
    ref.current = handlers
  })

  useEffect(() => {
    if (!enabled) return
    const onKey = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target
      if (isTyping(target)) return
      const h = ref.current
      // Space trên nút/video: để phần tử đó tự xử lý
      const onControl = target instanceof HTMLElement && target.closest('button, a, video, audio, [role="slider"]')
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          if (target instanceof HTMLInputElement) return
          e.preventDefault()
          h.next?.()
          break
        case 'ArrowLeft':
        case 'PageUp':
          e.preventDefault()
          h.prev?.()
          break
        case ' ':
          if (onControl) return
          e.preventDefault()
          if (e.shiftKey) h.prev?.()
          else h.next?.()
          break
        case 'Home':
          e.preventDefault()
          h.first?.()
          break
        case 'End':
          e.preventDefault()
          h.last?.()
          break
        case 'f':
        case 'F':
          e.preventDefault()
          h.fullscreen?.()
          break
        case 't':
        case 'T':
          h.thumbnails?.()
          break
        case '+':
        case '=':
          h.zoomIn?.()
          break
        case '-':
        case '_':
          h.zoomOut?.()
          break
        case '0':
          h.zoomReset?.()
          break
        case 'Escape':
          h.escape?.()
          break
        default:
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled])
}
