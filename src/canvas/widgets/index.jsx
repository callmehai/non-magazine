import { lazy, Suspense } from 'react'
import './widgets.css'

/**
 * Phần tử tương tác đặt trên trang canvas (el.type = "widget"), chọn theo el.kind:
 *  - "map": bản đồ Việt Nam chữ S, bấm vào thì phóng tới Làng Chuông và hiện mô hình 3D của làng
 *  - "layers": mô hình 3D ba lớp lá nón, bấm vào lớp nào thì lớp đó sáng màu
 * Chế độ "edit" (editor, ảnh thu nhỏ) chỉ vẽ hình tĩnh; WebGL chỉ chạy khi trang đang mở ở chế độ đọc.
 */
const KINDS = {
  map: lazy(() => import('./MapWidget.jsx')),
  layers: lazy(() => import('./LayersWidget.jsx')),
}

export default function Widget({ el, mode, visible }) {
  const Kind = KINDS[el.kind]
  if (!Kind) return null
  return (
    <Suspense fallback={<div className="cvw cvw--loading" />}>
      <Kind el={el} interactive={mode === 'read'} visible={visible} />
    </Suspense>
  )
}
