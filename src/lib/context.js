import { createContext } from 'react'

/** Những thứ dùng chung cho mọi trang (lightbox, trạng thái âm thanh, chuyển động…) */
export const MagazineContext = createContext({
  openLightbox: null,
  openReader: null, // openReader({ title, paras, lang }): khung "Đọc thêm" toàn văn một mục
  reducedMotion: false,
  onPageAudioPlay: null,
  onPageAudioStop: null, // video dừng / hết → nhạc nền chạy lại nếu do video mà dừng
  portrait: false, // sách đang hiện một trang (màn hẹp)
  nextPage: null, // lật sang trang kế (không ghi vào nút Quay lại)
  goToPage: null, // goToPage(i): lật tới trang i (0, 1, 2… theo thứ tự đọc) — link "#p12" trên trang canvas
})
