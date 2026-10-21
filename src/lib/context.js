import { createContext } from 'react'

/** Những thứ dùng chung cho mọi trang (lightbox, trạng thái âm thanh, chuyển động…) */
export const MagazineContext = createContext({
  openLightbox: null,
  reducedMotion: false,
  onPageAudioPlay: null,
  goToPage: null, // goToPage(i): lật tới trang i (0, 1, 2… theo thứ tự đọc) — link "#p12" trên trang canvas
})
