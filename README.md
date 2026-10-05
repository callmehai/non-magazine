# NÓN — Dấu ấn trên đỉnh đầu

Tạp chí kỹ thuật số dạng flipbook: lật trang như sách thật, nền 3D (three.js) với chiếc nón lá
được dựng hoàn toàn bằng code, video, âm thanh, mục lục thu nhỏ, zoom, toàn màn hình.

- React + Vite, không backend, không database
- Lật trang: [StPageFlip](https://github.com/Nodlik/StPageFlip) (`page-flip`)
- 3D: [three.js](https://threejs.org)
- Font tự host, đủ dấu tiếng Việt: Playfair Display, Cormorant Garamond, Be Vietnam Pro

---

## 1. Chạy project

Cần Node.js ≥ 20.19.

```bash
npm install
npm run dev
```

Mở http://localhost:5173.

## 2. Thêm ảnh

1. Chép ảnh vào `public/assets/images/` (jpg, jpeg, png, webp, svg).
2. Trong `src/content/magazine.js`, trỏ tới ảnh đó:

```js
{ type: 'image', image: 'assets/images/non-hue.jpg', imageAlt: 'Nón bài thơ Huế', caption: 'Nón bài thơ — Huế' }
```

Ảnh tự lazy-load theo trang. Ảnh lỗi/thiếu sẽ hiện khung placeholder, không vỡ layout.
`imageAlt` là mô tả cho trình đọc màn hình — nên điền.

## 3. Thêm video

1. Chép `.mp4` vào `public/assets/videos/`.
2. Trang video trong `magazine.js`:

```js
{
  type: 'video',
  title: 'Nón trong chuyển động',
  video: 'assets/videos/making-hat.mp4',
  poster: 'assets/images/video-poster.svg', // ảnh hiện trước khi bấm play
  autoplay: false, // true = tự phát khi lật tới trang (bắt buộc kèm muted: true)
  muted: true,
  loop: false,
  controls: true,
}
```

Video không tải trước, tự dừng khi lật sang trang khác. Chưa có file → hiện khung "Thước phim
đang được hoàn thiện".

## 4. Thêm audio

**Âm thanh riêng cho một trang:**

```js
{
  type: 'audio',
  title: 'Tiếng hò xứ Huế',
  text: 'Một đoạn hò mái nhì…',
  audio: 'assets/audio/ho-hue.mp3',
  image: 'assets/images/song-huong.jpg', // ảnh tròn phía trên (tuỳ chọn)
}
```

Trang audio có play/pause, thanh tua, âm lượng, tắt tiếng; khi phát thì nhạc nền tự dừng.

## 5. Thêm trang mới

**Muốn thêm một trang mới, chỉ cần thêm object vào `src/content/magazine.js`** (mảng `pages`).
Thứ tự trong mảng là thứ tự trang. Ví dụ chèn một bài viết:

```js
{
  id: 'non-bai-tho',          // tên riêng, không trùng
  type: 'article',
  layout: 'image-top',        // text | image-top | image-bottom | image-left | image-right | steps
  kicker: '11 — Huế',
  title: 'Nón bài thơ',
  text: [
    'Đoạn văn thứ nhất. Viết **đậm** hoặc *nghiêng* như thế này.',
    'Đoạn văn thứ hai.',
  ],
  image: 'assets/images/non-bai-tho.jpg',
  caption: 'Soi nón lên nắng mới thấy bài thơ.',
  highlight: 'Một câu trích nổi bật (tuỳ chọn).',
  links: [{ label: 'Đọc thêm', href: 'https://vi.wikipedia.org/wiki/Nón_lá' }],
  animation: 'fade-up',
}
```

> Bìa trước và bìa sau là trang `type: 'cover'` đầu và cuối mảng. Để bìa sau đứng một mình như
> sách thật, tổng số trang nên là **số chẵn**.

### Các loại trang

| `type` | Dùng cho | Trường chính |
|---|---|---|
| `cover` | bìa (thêm `variant: 'back'` cho bìa sau) | `title`, `subtitle`, `text`, `kicker`, `image`, `background`, `footer` |
| `article` | bài viết | `layout`, `kicker`, `title`, `subtitle`, `text`, `list`, `steps`, `image`, `caption`, `highlight`, `dropCap`, `links` |
| `image` | ảnh lớn + chú thích | `image`, `caption`, `title`, `fit` (`cover`/`contain`) |
| `full-image` | ảnh tràn trang, chữ đè lên | `image`, `title`, `text`, `overlay` (`bottom`/`top`/`center`), `theme: 'dark'` |
| `gallery` | lưới ảnh, bấm để phóng to | `images: [{ src, alt, caption }]`, `columns`, `title`, `text` |
| `video` | video | `video`, `poster`, `autoplay`, `muted`, `loop`, `controls`, `caption` |
| `audio` | âm thanh riêng | `audio`, `title`, `text`, `image`, `loop` |
| `quote` | trích dẫn lớn | `quote`, `author`, `title`, `text`, `image` (in mờ phía sau) |
| `split` | nửa ảnh nửa chữ | `image`, `imagePosition` (`top`/`bottom`/`left`/`right`), `title`, `text`, `words` |
| `custom-html` | tự viết HTML | `html` (chuỗi HTML; dùng các class `ch-stack`, `ch-eyebrow`, `ch-title`, `ch-words`) |
| `model3d` | nón lá 3D xoay được | `title`, `text`, `words`, `image` (ảnh tĩnh dự phòng), `caption` |

Trường dùng chung cho mọi trang: `background` (ảnh nền), `backgroundColor`, `theme` (`light`/`dark`),
`animation`, `chrome: false` (ẩn dòng tiêu đề nhỏ và số trang), `thumbnailLabel` (tên trong mục lục).

> `custom-html` chèn HTML nguyên văn — chỉ dán HTML do chính bạn viết.

**Thêm một loại trang hoàn toàn mới:** tạo component trong `src/components/pages/`, rồi thêm
một dòng vào `PAGE_TYPES` ở `src/components/FlipBook/FlipBookPage.jsx`.

## 6. Đổi màu

Toàn bộ màu nằm trong `src/styles/theme.css`:

```css
--ivory: #f4ede0;   /* màu giấy */
--ink:   #2a1f17;   /* chữ */
--brown: #3b2a1e;   /* nâu đậm: tiêu đề */
--gold:  #b8955a;   /* vàng trầm: điểm nhấn */
--bg-1 / --bg-2 / --bg-3   /* nền phía sau cuốn sách */
```

Màu riêng một trang: `backgroundColor: '#2a1d15', theme: 'dark'` trong `magazine.js`.

## 7. Đổi font

1. Cài font từ [Fontsource](https://fontsource.org) (nhớ chọn font có hỗ trợ `vietnamese`), ví dụ
   `npm install @fontsource/lora`.
2. Import trong `src/main.jsx`: `import '@fontsource/lora/400.css'`.
3. Đổi biến trong `src/styles/theme.css`: `--font-serif: 'Lora', serif;`

Dùng file font riêng: chép `.woff2` vào `public/assets/fonts/`, khai báo `@font-face` trong
`theme.css` với `src: url('/assets/fonts/ten-font.woff2')`, rồi đổi biến như trên.

## 8. Đổi animation

- Từng trang: trường `animation` trong `magazine.js`:
  `fade-in` · `fade-up` · `scale` · `slide` · `parallax` (ảnh trôi nhẹ theo chuột) · `none`.
- Tốc độ/khoảng cách chung: `--anim-duration`, `--anim-distance`, `--ease` trong `theme.css`.
- Tốc độ lật trang: `settings.flipDuration` (ms).
- Màn mở đầu 3D: `settings.intro: false` để vào thẳng bìa; `settings.background3D: false` để tắt cảnh 3D.
- Người dùng bật *Reduce motion* trong hệ điều hành sẽ tự động được giảm/tắt hiệu ứng.

## 9. Đổi nhạc nền

Chép file vào `public/assets/audio/background.mp3` — xong. Hoặc trỏ tới file khác:

```js
settings: {
  backgroundMusic: 'assets/audio/nhac-cua-toi.mp3',
  backgroundMusicTitle: 'Tên bài hát',
  musicVolume: 0.5,
  enableSound: true,  // false = mặc định tắt tiếng
}
```

Chưa có file thì tạp chí phát một bản nhạc ngũ cung tổng hợp bằng Web Audio. Trình duyệt chặn
tự phát âm thanh, nên người xem sẽ thấy nút **"Nhấn để bật âm thanh"** — không có cách lách hợp lệ.
Tiếng lật trang riêng: đặt file ở `assets/audio/page-flip.mp3`.

## 10. Build & deploy

```bash
npm run build     # tạo thư mục dist/
npm run preview   # xem thử bản build
```

`dist/` là web tĩnh, deploy được miễn phí ở bất kỳ đâu (`base: './'` nên chạy được cả trong thư mục con).

- **GitHub Pages** (đã cấu hình sẵn): mỗi lần `git push` lên nhánh `main`, workflow
  `.github/workflows/deploy.yml` tự build và đăng. Lần đầu: vào repo → *Settings → Pages* →
  *Source: GitHub Actions* (nếu chưa tự bật).
- **Vercel / Netlify / Cloudflare Pages**: import repo, build command `npm run build`,
  output directory `dist`.

---

## Phím tắt

| Phím | Tác dụng |
|---|---|
| ← / → | trang trước / sau |
| Space (Shift+Space) | trang sau (trước) |
| Home / End | bìa trước / bìa sau |
| F | toàn màn hình · Esc thoát |
| + / − / 0 | phóng to / thu nhỏ / về 100% (hoặc Ctrl + lăn chuột) |
| T | mục lục |

## Cấu trúc

```
src/
├── content/magazine.js        ← NỘI DUNG (chỉ cần sửa file này)
├── App.jsx                    nối các phần lại với nhau
├── components/
│   ├── FlipBook/              cuốn sách + bộ chọn loại trang
│   ├── pages/                 Cover, Article, Image, FullImage, Gallery, Video, Audio, Quote, Split, CustomHtml, Model3D
│   ├── Controls/              thanh điều khiển, zoom, fullscreen
│   ├── ThumbnailPanel/        mục lục thu nhỏ
│   ├── AudioPlayer/           nhạc nền + trình phát trong trang
│   ├── Intro/ Scene/          màn mở đầu và cảnh 3D phía sau
│   └── common/                ảnh, icon, khung trang
├── hooks/                     useFlipBook, useFullscreen, useKeyboardNavigation, useAudio, …
├── three/                     nón lá 3D dựng bằng code, bụi nắng, trình xem 3D
├── lib/                       đường dẫn asset, âm thanh tổng hợp
└── styles/                    theme.css (màu, font, chuyển động) + CSS từng phần
public/assets/                 ảnh, video, audio, font — xem public/assets/README.md
```
