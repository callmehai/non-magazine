/**
 * Mẫu nền trang (page.paper): giấy ngà có vân + họa tiết nét mảnh theo góp ý hình thức của nhóm
 * (nền trắng ngà xuyên suốt, họa tiết tre / sen / nón ở góc trang hoặc in mờ giữa trang).
 * Họa tiết đặt ở mép ngoài trang: trang bên trái tự lật đối xứng để hai trang đối diện ăn khớp.
 * Vị trí từng lớp viết trong canvas.css (.cv-paper__deco.is-…), đơn vị em = 1pt của trang A4.
 */
export const PAPER_BASE = 'assets/book/paper/giay.webp'

export const PAPERS = [
  { id: 'giay', name: 'Giấy ngà trơn', layers: [] },
  { id: 'tre', name: 'Lá tre ở góc', layers: [{ src: 'assets/book/paper/tre.svg', at: 'top' }] },
  { id: 'sen', name: 'Hoa sen in mờ', layers: [{ src: 'assets/book/deco/lotus.svg', at: 'watermark' }] },
  {
    id: 'non',
    name: 'Nón và lá ở chân trang',
    layers: [
      { src: 'assets/book/deco/leaf-sprig.svg', at: 'foot-leaf' },
      { src: 'assets/book/deco/non-line.svg', at: 'foot' },
    ],
  },
  { id: 'khung', name: 'Khung viền mảnh', layers: [{ src: 'assets/book/paper/khung.svg', at: 'frame' }] },
]

export const paperOf = (id) => PAPERS.find((p) => p.id === id) || null
