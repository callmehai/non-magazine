import { useEffect, useState } from 'react'

/** true khi người dùng không tương tác trong `ms` mili-giây. */
export function useIdle(ms = 3200, paused = false) {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    if (paused) {
      setIdle(false)
      return
    }
    let timer
    const wake = () => {
      setIdle(false)
      clearTimeout(timer)
      timer = setTimeout(() => setIdle(true), ms)
    }
    const events = ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart']
    events.forEach((ev) => window.addEventListener(ev, wake, { passive: true }))
    wake()
    return () => {
      clearTimeout(timer)
      events.forEach((ev) => window.removeEventListener(ev, wake))
    }
  }, [ms, paused])
  return idle
}
