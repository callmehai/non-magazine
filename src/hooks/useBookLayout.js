import { useEffect, useMemo, useState } from 'react'

/**
 * Tính kích thước trang sao cho cuốn sách vừa khung nhìn.
 * - Đủ rộng: hiển thị 2 trang (landscape). Hẹp: 1 trang (portrait).
 * - zoom nhân thêm vào kích thước "vừa khung" (100% = vừa màn hình).
 */
export function useBookLayout(stageRef, { pageWidth, pageHeight }, zoom) {
  const [box, setBox] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))

  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    // offsetWidth: không bị thanh cuộn (khi zoom) làm thay đổi kích thước "vừa khung"
    const ro = new ResizeObserver(() => setBox({ w: el.offsetWidth, h: el.offsetHeight }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [stageRef])

  return useMemo(() => {
    const ratio = pageWidth / pageHeight
    const { w, h } = box
    const small = w < 700
    const padX = small ? 12 : w < 1100 ? 72 : 96
    const padTop = small ? 58 : 40
    const padBottom = small ? 84 : 96
    const availW = Math.max(160, w - padX * 2)
    const availH = Math.max(200, h - padTop - padBottom)

    // thử 2 trang
    let pH = availH
    let pW = pH * ratio
    if (pW * 2 > availW) {
      pW = availW / 2
      pH = pW / ratio
    }
    let orientation = 'landscape'
    if (pW < 300 || w < 820 || w / h < 0.95) {
      orientation = 'portrait'
      pH = availH
      pW = pH * ratio
      if (pW > availW) {
        pW = availW
        pH = pW / ratio
      }
    }
    const pageW = Math.floor(pW * zoom)
    const pageH = Math.floor(pageW / ratio)
    return {
      orientation,
      pageW,
      pageH,
      bookW: orientation === 'landscape' ? pageW * 2 : pageW,
      padTop,
      padBottom,
      stageW: w,
      stageH: h,
    }
  }, [box, pageWidth, pageHeight, zoom])
}
