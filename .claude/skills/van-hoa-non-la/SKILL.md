---
name: van-hoa-non-la
description: Bối cảnh văn hoá Việt (nón lá, Làng Chuông, tre, làng Bắc Bộ, nghệ thuật dân gian) và luật thiết kế rút ra từ đó cho flipbook "Nón lá Làng Chuông". Dùng TRƯỚC khi vẽ, chọn màu, chọn ảnh, viết chú thích, làm sảnh (lobby), trang mở chương, họa tiết, hoặc bất cứ khi nào cần quyết định "cái này có đúng chất Việt / đúng Làng Chuông không".
---

# Văn hoá nón lá Làng Chuông — luật cho thiết kế

Bên thuê (người Việt) chê bản cũ "không có concept, không mang tính dân tộc". Lý do: hình ảnh chung chung kiểu "châu Á", không bám vào vật thật của Làng Chuông. File này là phần đã kiểm; chi tiết, nguồn, độ tin cậy nằm ở:

- `docs/van-hoa/01-van-hoa.md`: nón lá, Làng Chuông, tre, cảnh làng Bắc Bộ, ca dao, góc nhìn Nhật.
- `docs/van-hoa/02-nghe-thuat.md`: Đông Hồ, Oger, sơn mài, ảnh PD/CC0 dùng được, Lune, thơ trích được.
- `docs/van-hoa/03-san-pham-thi-truong.md`: thương hiệu, website, thẩm mỹ Nhật, font, 3 concept lobby.

Đọc mục liên quan trước khi khẳng định một sự thật lịch sử hay trích một câu thơ.

## 1. Concept xuyên suốt: "Ba lớp lá, mười sáu vòng tre"

Lấy chính cấu tạo nón Chuông làm hệ thống thiết kế, không lấy motif "châu Á" rời rạc.

- **16 vòng tre**: vòng tròn đồng tâm cho loader, số trang, tiến trình 8 bước, khung ảnh tròn. Lưới này gợi mặt trống đồng mà không chép trống.
- **3 lớp**: nền giấy (lá trong), khung, ảnh, đường kẻ nâu (mo nang), chữ (lá ngoài).
- **Đường khâu**: nét đứt mảnh làm đường phân cách và viền khung. Đây là chữ ký riêng của sách.
- **Nhôi chỉ màu**: điểm nhấn đỏ son duy nhất, như chỗ buộc quai. Dùng cho bookmark, con dấu, nút.

Năm chữ của nón Chuông: *chắc, khỏe, bền, thanh, đẹp*.

## 2. Cảnh và vật thật của Làng Chuông (ưu tiên hơn biểu tượng chung)

- **Chợ nón phiên**: họp các ngày 4, 10, 14, 20, 24, 30 âm lịch, từ 4–5 giờ sáng ở sân đình. Nón trắng xếp thành chồng dài, người bán mặc áo nâu.
- **Lá lụi phơi trắng trên đê sông Đáy.** Là lá bằng lưỡi cày gang cũ. Ba thế hệ ngồi hiên khâu nón ("tre già măng mọc").
- **Đình Chuông**:
  - mái ngói mũi hài hai tầng, đầu đao cong;
  - sân gạch đỏ, nghi môn;
  - hội tháng Ba có cờ người, thổi cơm thi.
  - Chưa có nguồn xác nhận đình có giếng hay cây đa. Khi vẽ, gọi chung là "giếng làng" hoặc "lũy tre làng", đừng ghi "giếng đình Chuông".
- **Làng hôm nay vẫn sống**: có OCOP, nón lụa, du khách, hàng xuất sang Nhật. Đừng dựng làng "cổ tích" xoá hiện tại.

## 3. Dáng nón đúng

- Nón Chuông thành thẳng, góc đỉnh khoảng 100°, có núm chóp tròn bọc lá trắng, vành cạp nâu đỏ, quai lụa buộc vào hai mảng chỉ nhôi.
- Bên thuê chê hình cũ "nhọn quá" (2026-10-25). Vì vậy:
  - hình 2D cao ≤ 0,68 × bán kính vành (`scripts/book/deco.py`, hàm `non()`);
  - nón 3D cao 0,78 (`src/three/createNonLa.js`, `HAT.H`).
- Nón Bắc Bộ xưa là **nón ba tầm, nón thúng quai thao** (vành rộng, đỉnh bằng). Nón chóp chỉ phổ biến ở miền Bắc từ khoảng thập niên 1940. "Quai thao" là dây tơ của làng Đơ Thao.
- Nón bài thơ soi thấy thơ là **nón Huế**, không phải nón Chuông. Đừng ghép Huế (Thiên Mụ, áo dài trắng nữ sinh, sông Hương) vào Làng Chuông.

## 4. Màu

| Vai | Hex | Ghi chú |
|---|---|---|
| Nền sách (giấy ngà / lá nón) | `#F4EDE0`, `#EFE7D3`, `#F4E3C3` (giấy điệp) | Nhóm yêu cầu: nền ngà xuyên suốt |
| Mực chữ | `#2A1F17` hoặc `#4E3426` (nâu gỗ lim) | Tránh đen tuyền |
| Tiêu đề | nâu nhạt `#8B7355`, `#CDAA7D` | Ý của Minh Ánh |
| Họa tiết thiên nhiên | xanh tre `#5F7A3A`, `#9BCD9B`; xanh lũy tre đậm `#36502C` | |
| Nhấn | đỏ son `#A8382B` (một điểm), vàng hoa hoè `#D6A23A` | |
| Sảnh / nền web (tối) | Espresso `#351904`, Ember `#8B3A00`, Gold `#E08E00`, Malibu `#FFECB8` | Moodboard Khánh Huyền: hoàng hôn hổ phách |

- Tỉ lệ màu theo Khánh Linh: 70% nền sáng, 20% màu chủ đạo (xanh), 10% nhấn (nâu đất).
- Nhóm muốn mỗi chương một màu nhấn riêng.
- Mỗi trang tối đa 1 nền, 1 nhấn chính, 1 màu nét, như tranh Đông Hồ chỉ có 4–5 ván màu.
- **Cấm**: đỏ cờ `#DA251D` + vàng sao tràn trang; đỏ + vàng kim kiểu Tàu; gradient xanh đậm chung chung.

## 5. Ngữ pháp hình ảnh mượn từ nghệ thuật Việt

- **Họa đồ Henri Oger (1909, PD)** cho hình dụng cụ và công đoạn: nét mực đều 0,75–1pt, đánh số, chú thích dọc, con dấu đỏ nhỏ.
- **Đông Hồ** (chỉ lấy tinh thần, không chép tranh cụ thể):
  - mảng màu phẳng, viền đen;
  - màu tự nhiên: đen than lá tre, đỏ son, vàng hoè, chàm;
  - giấy điệp có ánh nhũ, in lệch ván 1–2px.
  - Không có tranh Đông Hồ cổ nào vẽ nón, nên hình nón phải tự vẽ.
- **Sơn mài** cho bìa và trang mở chương: then đen, son, vàng thếp thành nét mảnh, vỏ trứng.
- **Lune (Làng Tôi, À Ố)**: chỉ một chất liệu tre cũng đủ dựng cả câu chuyện. Cho nắng xuyên qua tre (học VTN).
- **nonviet.net** ("Nón Việt – Chạm Sắc": nón Chuông + lụa Vạn Phúc + sơn mài Hạ Thái), nhóm gửi làm tham khảo:
  - màu nước sen và nón;
  - tiêu đề Cormorant, nhấn bằng chữ viết tay (Dancing Script);
  - đường kẻ có bông sen ở giữa.
- Cặp trang đối nhau như **câu đối**: trái là ảnh thật, phải là minh họa cùng chủ đề.

## 6. Tre và cảnh làng

- Tre là **lũy tre Bắc Bộ**: bụi dày, thân có đốt, ngọn cong vồng, làm bờ rào làng. Không vẽ cành trúc thủy mặc kiểu Tàu.
- Bộ "cây đa – giếng nước – sân đình" gợi quê hương. Dùng làm cảnh nền, không dùng làm logo.
- Sen chỉ đặt ở ao đình. Trống đồng chỉ ở phần lịch sử. Đừng rải hai motif này khắp nơi.

## 7. Chữ và câu trích

- **Câu đã kiểm**:
  - "Muốn ăn cơm trắng cá trê / Muốn đội nón tốt thì về làng Chuông" (ca dao; có dị bản "cá mè");
  - "Mồng mười đi chợ Chuông chơi / Xem đánh cờ người, xem thổi cơm thi";
  - "Qua đình ngả nón trông đình / Đình bao nhiêu ngói thương mình bấy nhiêu";
  - "Tre già măng mọc".
- **Thép Mới, "Cây tre Việt Nam"**: mới kiểm được câu mở đầu và câu "Tre, anh hùng lao động! Tre, anh hùng chiến đấu!". "Tre xanh, xanh tự bao giờ" là thơ **Nguyễn Duy**.
- **Không bịa** ca dao, quan họ hay chữ Hán Nôm. Không ghi tác giả "Chiếc nón bài thơ" hay "Bài ca nón lá" khi chưa kiểm.
- **Lục bát**: câu lục thụt 2em, câu bát sát lề. Có thể đặt thành cột dọc màu son, kèm con dấu "ca dao".
- **Font**:
  - VI: Be Vietnam Pro (người Việt thiết kế), Playfair, Cormorant (đều có dấu).
  - JA: Noto Serif JP / Hina Mincho (có cả dấu Việt cho tên riêng).
  - Shippori Mincho, Zen Old Mincho, Klee One **không có tiếng Việt**.
  - Không dùng font giả bút lông Tàu.

## 8. Bản tiếng Nhật

- Gọi là **ノンラー（笠）** hoặc "ノン（すげ笠）" như JICA. Không gọi "帽子", không gọi "竹の帽子": lá là lá lụi, tre chỉ làm khung.
- Không Nhật hoá hình ảnh. Chỉ đổi cách dàn: nhiều khoảng trống, mincho, tiêu đề có thể viết dọc.
- Điểm chạm cảm xúc với người Nhật:
  - 菅笠 cũng khâu tay trên khung tre, và việc khâu là của phụ nữ;
  - truyện 笠地蔵: nón là sự che chở;
  - cặp 笠/傘 ứng với cặp nón (liền chị) / ô (liền anh) trong quan họ;
  - 24 tiết khí dùng chung cho cả Việt và Nhật.

## 9. Sự thật dễ sai

- Hình trên trống đồng Ngọc Lũ là người đội **mũ lông chim**. Chỉ được nói "được cho là tiền thân" (văn bản của nhóm đã viết thận trọng như vậy). Không viết "2500 TCN".
- "Tiến vua / cung đình Huế" không có sử liệu. Tuổi nghề có nhiều số khác nhau (300, 400 năm…), nên giữ đúng chữ trong văn bản của nhóm.
- Ảnh tranh của Nguyễn Phan Chánh, Mai Trung Thứ, Nguyễn Gia Trí, Bùi Xuân Phái… còn bản quyền, không đưa vào sách. Ảnh PD/CC0 dùng được (ghi nguồn) liệt kê ở `02-nghe-thuat.md` mục G: Salles 1896, Rue des Chapeaux, Léon Busy, Dieulefils, Oger.

## 10. Ý của nhóm (Doc "ND + HT - Nón lá đã sửa", tab "Yêu cầu hình thức")

Luôn mở lại link sống trước mỗi lần làm, vì nhóm sửa liên tục.

- **Chung**: phong cách tạp chí. Họa tiết tre, sen, nón ở góc trang hoặc in mờ giữa trang. Chỉ nét mảnh. Họa tiết nối hai trang của một cặp. Ảnh khung vuông hoặc chữ nhật ngang.
- **Nền**: nền web tối, nền sách sáng. Tiêu đề chương serif, số chương thật to.
- **Bố cục**: xen kẽ trang ảnh lớn, trang kể chuyện, trang thông tin.
- **Moodboard từng người**:
  - Minh Ánh: nét cọ cam, sen nét mảnh mờ 40%, mục lục có nón.
  - Thu Nguyệt: spread tạp chí với số mục 3.1 to.
  - Khánh Huyền: hoàng hôn hổ phách, poster "Làng Chuông" có câu ca dao, dải lụa vàng.
  - Khánh Linh: ngà, xanh, nâu; minh họa 3 lớp lá.
- **Nhạc**: chưa làm. Nếu thêm sau thì nhẹ, mang âm hưởng Việt.

## Kiểm trước khi giao

Hỏi từng chi tiết trên trang: "cái này có ở Làng Chuông / Bắc Bộ không?". Nếu chỉ là "châu Á chung chung", gắn sai vùng (Huế, Hội An, Trung Hoa), hoặc là sự thật chưa kiểm, thì bỏ hoặc sửa.
