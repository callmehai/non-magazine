---
name: verify-ui-in-browser
description: Kiểm tra một thay đổi của sách "Nón lá Làng Chuông" trên Chrome thật, rồi lập báo cáo HTML trên máy. Báo cáo có cặp ảnh Trước/Sau, khung đỏ đánh số đúng chỗ đổi, ảnh bấm vào để phóng to. Dùng sau mỗi vòng sửa (trước khi đẩy lên), khi soát Doc của bên thuê so với sách, và mỗi khi anh Hải nói "tạo html báo cáo", "báo cáo diff", "chạy lên xem". Báo cáo luôn là file HTML trên máy, mở bằng `open`. Không bao giờ đăng lên Claude Artifact hay link chia sẻ của agent.
---

# Kiểm tra trên trình duyệt và báo cáo HTML

Skill này chép từ skill cùng tên của TrustCabinet, sửa lại cho repo này: không có backend, sách dựng bằng `scripts/book/build.mjs`, nội dung sách nằm trên Supabase.

Hai file đi kèm:

- `pair.py`: ghép hai ảnh cạnh nhau, khoanh khung đỏ đánh số ở cả hai bên.
- `report.py`: đọc `manifest.json`, xuất một file `index.html` tự chứa, mở được khi không có mạng.

Cả hai cần Pillow. Python có Pillow trên máy này là `/usr/local/bin/python3`; python của Homebrew thì không có.

## Luật cứng

1. **Mỗi vòng sửa có một báo cáo HTML riêng**, gồm cặp ảnh Trước/Sau. Tóm tắt trong chat không thay được báo cáo.
2. **Báo cáo là file trên máy**, đặt ở `~/.playwright-e2e/reports/<tên-vòng>/index.html` (ngoài repo), rồi mở bằng `open …`.
   - Không đăng lên Claude Artifact, Codex share hay bất kỳ host nào của agent.
   - Anh Hải đã nhắc ngày 05/11 và 06/11: "ko dùng artifact, html local thôi".
3. **Mỗi cặp ảnh phải khoanh đỏ, đánh số mọi chỗ đổi.** Cặp ảnh không có khung thì không làm bằng chứng được, vì người đọc không biết nhìn vào đâu. Chú thích dưới cặp ảnh nói rõ từng khung: "Khung 1: …, khung 2: …".
4. **Chụp ở DPR 2.** Mọi ảnh trong báo cáo đều phải bấm vào phóng to được; `report.py` tự lo phần này. Trước khi giao, mở báo cáo, xem một cặp ở 100% xem có nét không.
5. **Không commit** ảnh chụp, báo cáo, `scripts/book/out/`.

## 1. Dựng và chạy sách

```bash
node scripts/book/build.mjs                 # → scripts/book/out/book.json
npx vite --port 5173 --strictPort           # chạy nền
```

- **Đo lại chữ** khi chữ đổi độ dài: mở `?measure=1`, chờ hiện "Đã đo", rồi dựng lại hai lần.
- **Trang soát** hiện từng trang một, dễ chụp: `http://localhost:5173/?review=1&lang=vi|ja&pw=480&cols=1`.
- **Đo tốc độ lật trang** trên bản build, không đo trên bản dev: `npx vite build --base ./`, rồi `npx vite preview --port 5176` và mở `http://localhost:5176/`.
- **Tắt vite** khi xong việc, vì máy nóng.

## 2. Trình duyệt

- Chỉ dùng Chrome thật của anh Hải (Profile 1) qua `chrome-devtools` MCP `--autoConnect`.
  - Không dùng `--isolated`, không dùng `isolatedContext`.
  - Chỉ điều khiển tab do mình mở hoặc anh chỉ định.
- Không dùng tool `emulate`, vì đã bị từ chối. Muốn xem cỡ điện thoại thì `resize_page` hoặc dùng `pw=` của trang soát.
- MCP không đọc được file trong scratchpad. Script chạy trong trang (`evaluate_script` với `filePath`) phải để trong `scripts/book/out/<vòng>/`.

## 3. Trước và Sau

**Bản "Trước"** là bản code cũ chạy song song:

```bash
rsync -a --delete --exclude node_modules --exclude .git --exclude scripts/book/out --exclude docs ./ ../non-before/
mkdir -p ../non-before/scripts/book/out
cp scripts/book/out/measure.json scripts/book/out/photos.json ../non-before/scripts/book/out/
ln -sfn "$PWD/node_modules" ../non-before/node_modules
# trong ../non-before: hoàn tác các sửa của vòng này (git diff / git show), rồi
(cd ../non-before && node scripts/book/build.mjs && npx vite --port 5175 --strictPort)   # chạy nền
```

Ảnh chụp màn hình anh Hải gửi kèm lời chê cũng dùng làm "Trước" được.

**Chụp ảnh:**
- Chụp hai bản trên cùng một trang soát, cùng `lang` và cùng `pw`.
- Một cặp ảnh là một cặp trang đôi.
- Nếu là hiệu ứng động, dừng Web Animations ở cùng một mốc thời gian rồi chụp. Các khung hình này đưa vào `shots`.

**Toạ độ khung đỏ:** lấy từ toạ độ phần tử trong `book.json` của từng bản, theo đơn vị pt. Đổi sang pixel ảnh bằng `S = 480 / 595.28 * 2`. Trang phải của cặp cộng thêm 960px.

Mẫu đầy đủ (cắt ảnh, tính khung, gọi `pair.py`) ở `book_pairs_example.py`. Chép nó vào `scripts/book/out/<vòng>/make.py` rồi sửa.

```bash
P=.claude/skills/verify-ui-in-browser
/usr/local/bin/python3 $P/pair.py before.png after.png out.png \
  --before-box x,y,w,h --after-box x,y,w,h        # khung i ứng với phần tử i ở hai bên
```

- **Khi không truyền khung**, `pair.py` tự tìm chỗ khác nhau bằng cách so từng điểm ảnh. Cách này chỉ đúng khi hai bản có cùng dữ liệu.
- **Đọc các khung nó in ra.** Nếu một khung bao cả trang thì nghĩa là trang bị đổ chữ lại.
- **Trang bị đổ chữ thì phải tìm nguyên nhân.** Thường do số ảnh đổi, làm độ rộng số chú thích "Ảnh 99/100" đổi theo, hoặc do bộ đếm `SIDE` trái/phải. Vì vậy luôn diff `book.json` cũ với mới trước khi đẩy.

## 4. Báo cáo soát Doc (không có Trước/Sau)

Khi so Doc của bên thuê với sách, mỗi cặp ghép hai ảnh: ảnh nhóm gắn trong Doc và ảnh sách đang dùng. Đây là hai ảnh khác nhau, không phải hai bản build, nên dùng `--no-boxes`: không vẽ khung và không so điểm ảnh. Nếu so điểm ảnh trên hai ảnh khác cỡ, `pair.py` sẽ lỗi.

Nên đưa hai ảnh về cùng chiều cao trước khi ghép, khoảng 560px. Ảnh nhóm gắn mà sách chưa có thì không cần ghép, đưa thẳng vào `shots`.

```bash
/usr/local/bin/python3 $P/pair.py doc.png sach.png out.png --labels "Nhóm gắn" "Sách" --no-boxes
```

Các tiêu đề mục trong manifest đổi qua `labels`, ví dụ:

```json
"labels": {
  "changes": "Nhóm đã thêm gì",
  "checks": "Đã soát",
  "pairs": "Ảnh nhóm gắn so với sách",
  "shots": "Ảnh mới",
  "asks": "Cần hỏi nhóm"
}
```

Chữ của bên thuê phải trích **nguyên văn**, không diễn lại.

Cách lấy Doc:
- Mở `/document/d/<id>/mobilebasic?tab=<tab>` bằng `evaluate_script` từ chính tab Doc.
- Lấy HTML thô về, rồi tách bằng `html.parser` của Python. Không dùng DOMParser, vì bị TrustedTypes chặn.
- Tải ảnh bằng `curl`.

## 5. Manifest và report.py

`~/.playwright-e2e/reports/<vòng>/manifest.json`. Đường dẫn ảnh tính tương đối so với manifest.

```json
{
  "title": "Nón lá · vòng 06/11",
  "eyebrow": "Nón lá Làng Chuông · vòng 06/11",
  "heading": "…", "lead": "…",
  "facts": ["124 trang", "Lật trang <b>60</b> khung/giây"],
  "changes": ["…", "<table>…</table>"],
  "checks": [["Kịch bản", "Kết quả, một hai dòng"]],
  "pairs": [["pairs/vi-62.png", "Tr. 62–63 (VI)", "Khung 1: …, khung 2: …"]],
  "shots": [["shots/live-1.png", "Lật trang tr. 30", "Ảnh này cho thấy gì"]],
  "asks": ["Việc còn chờ anh hoặc nhóm chốt"]
}
```

```bash
/usr/local/bin/python3 .claude/skills/verify-ui-in-browser/report.py ~/.playwright-e2e/reports/<vòng>/manifest.json
open ~/.playwright-e2e/reports/<vòng>/index.html
```

Sửa lại sau review thì dựng lại báo cáo, giữ nguyên tên thư mục vòng đó.

## 6. Cùng vòng đó

- **Review độc lập.** Một agent khác (`book-reviewer`) soát lại theo góp ý của bên thuê.
- **Đẩy lên gồm hai bước:**
  1. `git push origin main`, rồi chờ GitHub Pages chạy xong.
  2. `node scripts/book/push.mjs`, rồi thêm một dòng `publications`.
- **Trước bước 2**, kiểm tra bản nháp chưa bị ai sửa trong #/admin. Kết quả `max(version)` phải bằng 1.
