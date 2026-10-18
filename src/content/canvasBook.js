/**
 * Sách làm bằng editor trên web (#/admin) — nội dung nằm trong database, không sửa ở đây.
 * File này chỉ chứa phần cài đặt chung: ngôn ngữ giao diện, chiều lật, nhạc nền…
 * Đây là sách mở ra ở địa chỉ gốc của trang web (bản đã xuất bản; thêm ?draft=1 để xem bản nháp).
 */
const canvasBook = {
  slug: 'non', // tên sách trong database
  // Song ngữ: người đọc bấm VI / 日本語 ở góc trên phải. Mặc định tiếng Việt (người đọc chủ yếu là người Việt).
  // Mỗi khối chữ có bản tiếng Việt (text) và tiếng Nhật (ja); khối chưa dịch thì hiện tiếng Việt.
  lang: 'vi',
  languages: ['vi', 'ja'],
  title: 'Nón lá Làng Chuông',
  subtitle: 'Nét đẹp truyền thống Việt Nam',
  issue: 'Đồ án tốt nghiệp · ĐH FPT Hà Nội · 2026',
  translations: {
    ja: {
      title: 'チュオン村のノンラー',
      subtitle: 'ベトナムの伝統美',
      issue: 'FPT大学ハノイ校 卒業制作 · 2026',
    },
  },

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
