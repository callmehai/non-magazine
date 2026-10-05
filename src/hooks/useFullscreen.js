import { useCallback, useEffect, useState } from 'react'

const fsElement = () => document.fullscreenElement || document.webkitFullscreenElement
export const fullscreenSupported = () =>
  typeof document !== 'undefined' && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled)

/** Fullscreen API (kèm tiền tố webkit cho Safari). Esc do trình duyệt tự xử lý. */
export function useFullscreen(targetRef) {
  const [isFullscreen, setIsFullscreen] = useState(() => !!fsElement())
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!error) return
    const t = setTimeout(() => setError(null), 4000)
    return () => clearTimeout(t)
  }, [error])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!fsElement())
    document.addEventListener('fullscreenchange', onChange)
    document.addEventListener('webkitfullscreenchange', onChange)
    return () => {
      document.removeEventListener('fullscreenchange', onChange)
      document.removeEventListener('webkitfullscreenchange', onChange)
    }
  }, [])

  const enter = useCallback(() => {
    const el = targetRef?.current || document.documentElement
    const req = el.requestFullscreen || el.webkitRequestFullscreen
    // trình duyệt có thể từ chối (chính sách, chế độ kiểm thử tự động…) → báo cho người xem biết
    return req?.call(el)?.catch?.(() => setError('Trình duyệt đang chặn chế độ toàn màn hình'))
  }, [targetRef])

  const exit = useCallback(() => {
    if (!fsElement()) return
    const fn = document.exitFullscreen || document.webkitExitFullscreen
    return fn?.call(document)?.catch?.(() => {})
  }, [])

  const toggle = useCallback(() => (fsElement() ? exit() : enter()), [enter, exit])

  return { isFullscreen, enter, exit, toggle, error, supported: fullscreenSupported() }
}
