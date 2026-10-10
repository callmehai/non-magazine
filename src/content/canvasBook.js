/**
 * Sách làm bằng editor trên web (#/admin) — nội dung nằm trong database, không sửa ở đây.
 * File này chỉ chứa phần cài đặt chung: ngôn ngữ giao diện, chiều lật, nhạc nền…
 * Mở sách: thêm ?book=non vào cuối địa chỉ trang web.
 */
const canvasBook = {
  lang: 'ja',
  title: 'ノン',
  subtitle: '頭上の物語',
  issue: '第1号 — 2026年秋',

  settings: {
    // 'rtl' = lật từ phải sang trái kiểu sách Nhật
    direction: 'rtl',
    flipDuration: 950,
    backgroundMusic: 'assets/audio/background.mp3',
    backgroundMusicTitle: 'Bèo dạt mây trôi',
    musicVolume: 0.5,
    enableSound: true,
    flipSound: 'assets/audio/page-flip.mp3',
    intro: true,
    background3D: true,
  },
}

export default canvasBook
