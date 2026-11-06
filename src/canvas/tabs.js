import { useSyncExternalStore } from 'react'

/**
 * Nhóm "thẻ" dùng chung giữa các trang: phần tử có el.tab = { set, i } chỉ hiện khi thẻ i của nhóm set đang chọn.
 * Ví dụ mục 2.1.2: trang trái là mô hình ba lớp, trang phải chồng sẵn ảnh + mô tả của cả ba lớp; bấm lớp nào ở
 * trang trái (hoặc nút số ở trang phải) thì trang phải hiện phần của lớp đó. Mặc định thẻ 0 (ảnh thu nhỏ, editor,
 * trang soát luôn thấy thẻ 0).
 */
const state = new Map()
const subs = new Set()

export function setTab(set, i) {
  if (state.get(set) === i) return
  state.set(set, i)
  subs.forEach((f) => f())
}

export const getTab = (set) => state.get(set) ?? 0

const subscribe = (f) => {
  subs.add(f)
  return () => subs.delete(f)
}

/** thẻ đang chọn của nhóm set (render lại khi đổi); set rỗng → luôn 0, không đăng ký */
export function useTab(set) {
  return useSyncExternalStore(subscribe, () => (set ? getTab(set) : 0))
}
