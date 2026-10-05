# Thư mục assets

Mọi file đặt ở đây được phục vụ nguyên trạng. Trong `src/content/magazine.js`,
đường dẫn viết **tính từ `public/`**, ví dụ `assets/images/cover.jpg`.

```
public/assets/
├── images/   ảnh: .jpg .jpeg .png .webp .svg
├── videos/   video: .mp4 (H.264 để chạy được trên mọi trình duyệt)
├── audio/    âm thanh: .mp3 (nhạc nền, âm thanh riêng từng trang, tiếng lật trang)
└── fonts/    font tự host (tuỳ chọn, xem README chính — mục "Đổi font")
```

## Các file tạp chí đang tìm tới

| File | Dùng ở đâu | Nếu chưa có |
|---|---|---|
| `audio/background.mp3` | nhạc nền (`settings.backgroundMusic`) | phát nhạc ngũ cung tổng hợp sẵn |
| `audio/page-flip.mp3` | tiếng lật trang (`settings.flipSound`) | dùng tiếng giấy tổng hợp sẵn |
| `videos/making-hat.mp4` | trang 9 — video (đang là video demo: cảnh 3D nón tự đan) | hiện khung "Thước phim đang được hoàn thiện" |

Chỉ cần **chép file đúng tên vào đúng thư mục** — không phải sửa code.
Muốn dùng tên khác thì sửa đường dẫn tương ứng trong `magazine.js`.

## Ảnh minh hoạ có sẵn (`images/*.svg`)

Là hình vẽ minh hoạ để bản demo không bị trống. Thay bằng ảnh thật bất cứ lúc nào:
chép ảnh vào `images/` rồi đổi trường `image` / `images` / `poster` trong `magazine.js`.

## Mẹo dung lượng

- Ảnh: rộng 1400–2000px là đủ, nén sang `.webp` hoặc `.jpg` chất lượng ~80.
- Video: 1080p, H.264, dưới ~20MB (GitHub chặn file trên 100MB).
- Nhạc nền: `.mp3` 128kbps.
