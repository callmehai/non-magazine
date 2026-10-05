/**
 * ============================================================
 *  NỘI DUNG TẠP CHÍ — file DUY NHẤT cần sửa để thay nội dung.
 * ============================================================
 *
 * Đường dẫn ảnh/video/audio tính từ thư mục `public/`:
 *   "assets/images/cover.jpg"  →  public/assets/images/cover.jpg
 * (có thể viết có hoặc không có dấu "/" ở đầu; link http(s) cũng dùng được)
 *
 * Các loại trang (type):
 *   cover | article | image | full-image | gallery | video | audio |
 *   quote | split | custom-html | model3d
 *
 * Trường dùng chung cho mọi trang (đều không bắt buộc):
 *   background       ảnh nền cả trang
 *   backgroundColor  màu nền, ví dụ "#2a1d15"
 *   theme            "light" (chữ tối, mặc định) | "dark" (chữ sáng)
 *   animation        "fade-in" | "fade-up" | "scale" | "slide" | "parallax" | "none"
 *   kicker           dòng nhỏ phía trên tiêu đề
 *   title, subtitle, text (chuỗi hoặc mảng đoạn văn), caption, links
 *   chrome           false để ẩn header/số trang của trang đó
 *
 * Trong `text`, bọc chữ bằng **hai dấu sao** để in đậm, *một dấu sao* để in nghiêng.
 *
 * Xem README.md (mục "Thêm trang mới") để biết đầy đủ các trường của từng loại.
 */

const magazine = {
  title: 'NÓN',
  subtitle: 'Dấu ấn trên đỉnh đầu',
  // Dòng chữ nhỏ ở đầu mỗi trang (running header)
  runningHead: 'NÓN — Dấu ấn trên đỉnh đầu',
  issue: 'Số 01 — Thu 2026',

  settings: {
    // Kích thước "gốc" của một trang — chỉ dùng để lấy tỉ lệ khung trang.
    // Sách luôn tự co giãn theo màn hình.
    pageWidth: 720,
    pageHeight: 1020,

    // Thời gian lật một trang (ms)
    flipDuration: 950,

    // Nhạc nền. Nếu file chưa tồn tại, tạp chí tự phát một bản nhạc
    // nền tổng hợp nhẹ nhàng (đàn tranh/ngũ cung) bằng Web Audio.
    backgroundMusic: 'assets/audio/background.mp3',
    backgroundMusicTitle: 'Nhạc nền',
    musicVolume: 0.5,

    // Bật âm thanh (tiếng lật trang + nhạc nền) ngay từ đầu.
    // Trình duyệt chặn tự phát, nên người xem sẽ được mời bấm một lần để bật.
    enableSound: true,

    // Âm thanh lật trang riêng (để trống = dùng tiếng giấy tổng hợp sẵn)
    flipSound: 'assets/audio/page-flip.mp3',

    // Hiệu ứng mở đầu 3D (chiếc nón tự đan). false = vào thẳng bìa.
    intro: true,

    // Cảnh 3D chuyển động phía sau cuốn sách
    background3D: true,
  },

  pages: [
    // ─────────────────────────────── 1. BÌA
    {
      id: 'cover',
      type: 'cover',
      kicker: 'Số 01 — Thu 2026',
      title: 'NÓN',
      subtitle: 'Dấu ấn trên đỉnh đầu',
      text: 'Từ vật dụng đời thường đến biểu tượng văn hóa và thời trang.',
      image: 'assets/images/non-la-lineart.svg',
      imageAlt: 'Hình vẽ nét chiếc nón lá',
      // background: 'assets/images/cover.jpg',   // ảnh bìa thật (tuỳ chọn)
    },

    // ─────────────────────────────── 2
    {
      id: 'mot-vat-nho',
      type: 'article',
      layout: 'text',
      dropCap: true,
      kicker: '01 — Mở đầu',
      title: 'Nón — một vật nhỏ, một câu chuyện lớn',
      text: [
        'Nón xuất hiện trong đời sống con người từ rất lâu, trước hết để che nắng, che mưa và bảo vệ cơ thể. Nhưng theo thời gian, chiếc nón vượt ra khỏi chức năng ban đầu.',
        'Một chiếc nón có thể kể câu chuyện về nơi một người sinh ra, nền văn hóa họ thuộc về, nghề nghiệp họ theo đuổi hay đơn giản là phong cách mà họ lựa chọn.',
      ],
      highlight: 'Nón không chỉ nằm trên đầu. Nó mang theo một phần câu chuyện của người đội.',
      animation: 'fade-up',
    },

    // ─────────────────────────────── 3
    {
      id: 'tu-nhu-cau',
      type: 'article',
      layout: 'image-top',
      kicker: '02 — Lịch sử',
      title: 'Từ nhu cầu đến biểu tượng',
      image: 'assets/images/materials.svg',
      imageAlt: 'Lá, nan tre và cuộn chỉ — vật liệu làm nón',
      caption: 'Lá cây, sợi thực vật, tre — những vật liệu đầu tiên.',
      text: [
        'Những dạng mũ, nón nguyên thủy được tạo ra từ những vật liệu có sẵn trong tự nhiên như lá cây, sợi thực vật, da và vải. Khi xã hội phát triển, hình dáng và chất liệu của nón ngày càng đa dạng.',
        'Nón dần xuất hiện trong:',
      ],
      list: ['Đời sống thường ngày', 'Lao động', 'Nghi lễ', 'Quân đội', 'Tôn giáo', 'Thời trang'],
      animation: 'fade-up',
    },

    // ─────────────────────────────── 4
    {
      id: 'non-viet',
      type: 'full-image',
      theme: 'dark',
      image: 'assets/images/non-la-sunset.svg',
      imageAlt: 'Chiếc nón lá trên cánh đồng lúc hoàng hôn',
      kicker: '03 — Việt Nam',
      title: 'Nón Việt — biểu tượng quen thuộc',
      text: [
        'Nhắc đến nón Việt Nam, hình ảnh đầu tiên xuất hiện trong tâm trí nhiều người là nón lá.',
        'Hình dáng đơn giản, vật liệu mộc mạc nhưng nón lá đã trở thành một trong những hình ảnh dễ nhận biết nhất khi nói về Việt Nam.',
      ],
      overlay: 'bottom', // "bottom" | "top" | "center"
      animation: 'parallax',
    },

    // ─────────────────────────────── 5 — trang 3D tương tác
    {
      id: 'non-la',
      type: 'model3d',
      kicker: '04 — Chất liệu',
      title: 'Nón lá — giữa mộc mạc và tinh tế',
      text: [
        'Nón lá thường được làm từ những vật liệu tự nhiên như lá và tre. Các nan tre tạo thành bộ khung, sau đó những lớp lá được xếp và khâu lại thành hình chóp đặc trưng.',
        'Điều thú vị nằm ở sự cân bằng:',
      ],
      words: ['Nhẹ', 'Bền', 'Thoáng', 'Tiện dụng'],
      // Ảnh tĩnh hiển thị khi trang chưa mở / trong thumbnail / máy không hỗ trợ WebGL
      image: 'assets/images/non-la-lineart.svg',
      imageAlt: 'Mô hình 3D chiếc nón lá',
      caption: 'Kéo để xoay chiếc nón',
      animation: 'fade-up',
    },

    // ─────────────────────────────── 6
    {
      id: 'quy-trinh',
      type: 'article',
      layout: 'steps',
      kicker: '05 — Thủ công',
      title: 'Một chiếc nón được tạo ra như thế nào?',
      steps: [
        { title: 'Chọn lá', text: 'Lá non được phơi, là phẳng cho trắng và mềm.' },
        { title: 'Chuẩn bị nan', text: 'Tre chẻ mỏng, vót tròn đều thành từng vòng.' },
        { title: 'Tạo khuôn', text: 'Các vòng nan xếp lên khuôn theo hình chóp.' },
        { title: 'Lợp lá', text: 'Từng lớp lá được xếp chồng, phủ kín khung.' },
        { title: 'Khâu hoàn thiện', text: 'Mũi chỉ nhỏ, đều tay giữ lá vào từng vòng nan.' },
      ],
      text: 'Mỗi chiếc nón là kết quả của rất nhiều thao tác thủ công nhỏ.',
      animation: 'slide',
    },

    // ─────────────────────────────── 7
    {
      id: 'moi-vung-dat',
      type: 'gallery',
      kicker: '06 — Thế giới',
      title: 'Mỗi vùng đất, một kiểu nón',
      text: 'Không có một chiếc nón duy nhất đại diện cho mọi nền văn hóa. Từ nón lá Việt Nam, mũ rộng vành, beret, fedora cho đến những loại mũ truyền thống của nhiều quốc gia, mỗi kiểu dáng đều phản ánh một nhu cầu và một câu chuyện riêng.',
      images: [
        { src: 'assets/images/hat-non-la.svg', alt: 'Nón lá', caption: 'Nón lá — Việt Nam' },
        { src: 'assets/images/hat-wide-brim.svg', alt: 'Mũ rộng vành', caption: 'Mũ rộng vành' },
        { src: 'assets/images/hat-beret.svg', alt: 'Mũ beret', caption: 'Beret — Pháp' },
        { src: 'assets/images/hat-fedora.svg', alt: 'Mũ fedora', caption: 'Fedora' },
      ],
      columns: 2,
      animation: 'scale',
    },

    // ─────────────────────────────── 8
    {
      id: 'thoi-trang',
      type: 'split',
      kicker: '07 — Thời trang',
      title: 'Khi nón trở thành thời trang',
      text: 'Trong thời trang hiện đại, nón không còn đơn thuần là phụ kiện phụ trợ. Một chiếc nón có thể thay đổi hoàn toàn cảm giác của một bộ trang phục.',
      image: 'assets/images/fashion-still.svg',
      imageAlt: 'Tĩnh vật: hộp mũ, fedora và beret',
      words: ['Minimal', 'Vintage', 'Streetwear', 'Classic'],
      animation: 'fade-up',
    },

    // ─────────────────────────────── 9
    {
      id: 'chuyen-dong',
      type: 'video',
      kicker: '08 — Thước phim',
      title: 'Nón trong chuyển động',
      video: 'assets/videos/making-hat.mp4',
      poster: 'assets/images/video-poster.svg',
      caption: 'Từ vòng nan đầu tiên đến mũi khâu cuối cùng.',
      autoplay: false,
      muted: true,
      loop: false,
      controls: true,
      animation: 'fade-in',
    },

    // ─────────────────────────────── 10
    {
      id: 'khong-chi-la',
      type: 'quote',
      kicker: '09 — Suy ngẫm',
      title: 'Không chỉ là một món đồ',
      quote: 'Có những vật dụng trở nên đặc biệt không phải vì chúng đắt tiền. Chúng đặc biệt vì chúng xuất hiện đủ lâu trong cuộc sống của con người.',
      text: 'Một chiếc nón có thể đi cùng người nông dân ngoài đồng, người bán hàng trên phố, người nghệ nhân trong xưởng hay một cô gái trong tà áo dài.',
      image: 'assets/images/non-la-topview.svg',
      animation: 'fade-in',
    },

    // ─────────────────────────────── 11 — HTML tuỳ biến
    {
      id: 'hien-dai',
      type: 'custom-html',
      animation: 'fade-up',
      html: `
        <div class="ch-stack">
          <p class="ch-eyebrow">10 — Hôm nay</p>
          <h2 class="ch-title">Từ truyền thống<br/><em>đến hiện đại</em></h2>
          <p>Ngày nay, nón tiếp tục thay đổi.</p>
          <ul class="ch-words">
            <li>Chất liệu mới.</li>
            <li>Kiểu dáng mới.</li>
            <li>Công nghệ mới.</li>
          </ul>
          <p>Nhưng ý tưởng cơ bản vẫn còn đó:</p>
          <blockquote>Một vật thể nhỏ có khả năng thể hiện con người đang đội nó.</blockquote>
        </div>
      `,
    },

    // ─────────────────────────────── 12. BÌA SAU
    {
      id: 'back-cover',
      type: 'cover',
      variant: 'back',
      title: 'NÓN',
      subtitle: 'More than something you wear.',
      text: [
        'Một chiếc nón có thể che nắng.',
        'Một chiếc nón có thể hoàn thiện một bộ đồ.',
        'Nhưng đôi khi, nó còn có thể kể một câu chuyện.',
      ],
      footer: 'The End',
    },
  ],
}

export default magazine
