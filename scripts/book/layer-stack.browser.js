// Chụp mô hình 3 lớp lá (src/canvas/widgets/layers3d.js) thành 3 ảnh tĩnh nền trong suốt cho mục 2.1.2.
// Anh Hải 05/11: "bên trái mặc định như này, khỏi 3d đi cho nhẹ trang" → trang sách không chạy WebGL nữa, chỉ xếp chồng
// 3 ảnh này (src/canvas/widgets/LayersWidget.jsx).
//
// Cách chạy lại (khi đổi ảnh mặt lớp bằng scripts/book/layer-tex.py):
//   1. npx vite, mở http://localhost:5173/?review=1 trong Chrome
//   2. dán hàm dưới vào DevTools Console → nó trả về { l0, l1, l2 } (data URL PNG: lớp ngoài, mo nang, lớp trong)
//   3. cắt cả ba theo cùng khung (40, 180, 860, 1170) rồi lưu public/assets/book/fx/lop-stack-{outer,mo,inner}.webp
//      (WebP giữ nền trong suốt, quality 82) — cùng khung để ba ảnh chồng lên nhau đúng chỗ
async function renderLayerStack() {
  const { LayersScene } = await import('/src/canvas/widgets/layers3d.js')
  const box = document.createElement('div')
  box.style.cssText = 'position:fixed;left:0;top:0;width:450px;height:600px;z-index:99999'
  const c = document.createElement('canvas')
  c.style.cssText = 'width:450px;height:600px;display:block'
  box.appendChild(c)
  document.body.appendChild(box)
  const s = new LayersScene(c, { colors: ['#d9962f', '#a95f3c', '#5f8a4a'], onSelect() {} })
  s.auto = false
  s.renderer.setPixelRatio(2)
  s.resize()
  await new Promise((r) => setTimeout(r, 4000)) // chờ ảnh mặt lớp tải xong
  cancelAnimationFrame(s.raf)
  s.spin = 0.55
  for (let k = 0; k < 120; k++) s.update(0.05)
  const shot = () => {
    s.renderer.render(s.scene, s.camera)
    return c.toDataURL('image/png')
  }
  const out = {}
  s.layers.forEach((m, i) => {
    s.layers.forEach((o, j) => (o.visible = i === j))
    out['l' + i] = shot()
  })
  s.dispose()
  box.remove()
  return out
}
renderLayerStack()
