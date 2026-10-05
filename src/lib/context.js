import { createContext } from 'react'

/** Những thứ dùng chung cho mọi trang (lightbox, trạng thái âm thanh, chuyển động…) */
export const MagazineContext = createContext({
  openLightbox: null,
  reducedMotion: false,
  onPageAudioPlay: null,
})
