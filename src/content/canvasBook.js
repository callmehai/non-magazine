/**
 * Sách làm bằng editor trên web (#/admin) — nội dung nằm trong database, không sửa ở đây.
 * File này chỉ chứa phần cài đặt chung: ngôn ngữ giao diện, chiều lật, nhạc nền…
 * Đây là sách mở ra ở địa chỉ gốc của trang web (bản đã xuất bản; thêm ?draft=1 để xem bản nháp).
 */
const canvasBook = {
  slug: 'non', // tên sách trong database
  lang: 'vi', // giao diện trang đọc (nút, mục lục): người đọc chủ yếu là người Việt
  title: 'ノン',
  subtitle: '頭上の物語',
  issue: '第1号 — 2026年秋',

  settings: {
    // 'ltr' = lật trái → phải kiểu sách Việt · 'rtl' = phải → trái kiểu sách Nhật
    direction: 'ltr',
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
