/**
 * ============================================================
 *  SÁCH TỪ FILE PDF — thiết kế trên Canva, web chỉ việc hiển thị.
 * ============================================================
 *
 * Cách cập nhật nội dung:
 *   1. Canva → Chia sẻ → Tải xuống → "PDF Tiêu chuẩn" (nhẹ hơn "PDF In").
 *   2. Đặt file vào public/assets/book/ (ghi đè file cũ, giữ nguyên tên).
 *   3. Push lên GitHub → web tự cập nhật sau ~1 phút.
 *
 * Không cần khai số trang hay khổ giấy: web tự đọc từ file PDF.
 * Link gắn trong Canva (chọn chữ/ảnh → Liên kết) tự bấm được trên web.
 *
 * Mở sách này: thêm ?book=pdf vào cuối địa chỉ trang web.
 */

const pdfBook = {
  // Ngôn ngữ giao diện (nút, gợi ý, mục lục): 'ja' | 'vi'
  lang: 'ja',
  title: 'ノン',
  subtitle: '頭上の物語',
  issue: '第1号 — 2026年秋',

  settings: {
    pdf: 'assets/book/sach-mau.pdf',

    // 'rtl' = lật từ phải sang trái kiểu sách Nhật (trang 1 nằm bên phải); 'ltr' = kiểu thường
    direction: 'rtl',

    // Web tự in số trang ở góc dưới phía mép ngoài (bìa không in) → trên Canva KHÔNG cần đánh số.
    pageNumbers: true,
    // Trang không muốn in số (ví dụ ảnh tràn trang): [6, 17]
    hidePageNumbersOn: [],

    flipDuration: 950,
    backgroundMusic: 'assets/audio/background.mp3',
    backgroundMusicTitle: 'Bèo dạt mây trôi',
    musicVolume: 0.5,
    enableSound: true,
    flipSound: 'assets/audio/page-flip.mp3',
    intro: true,
    background3D: true,
  },

  // Tên hiện trong mục lục (số trang → tên). Trang không khai thì hiện "Trang N".
  labels: {
    2: '目次',
    3: '第1章 — ノンの始まり',
    12: '映像 — 笠ができるまで',
    14: '第2章 — 笠づくりの村',
    23: '第3章 — 葉と竹と糸',
  },

  // Video / link đặt đè lên trang PDF. x, y, w, h tính bằng % khổ trang
  // (x = cách mép trái, y = cách mép trên). Trên Canva chừa sẵn một khung trống ở đúng chỗ đó.
  overlays: {
    12: [{ type: 'video', src: 'assets/videos/making-hat.mp4', x: 10, y: 30, w: 80, h: 45, title: '笠ができるまで' }],
  },
}

export default pdfBook
