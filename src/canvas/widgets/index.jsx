import { lazy, Suspense } from 'react'
import './widgets.css'

/**
 * Phần tử tương tác đặt trên trang canvas (el.type = "widget"), chọn theo el.kind:
 *  - "map": bản đồ Việt Nam chữ S, bấm vào thì phóng tới Làng Chuông và hiện mô hình 3D của làng
 *  - "layers": mô hình 3D ba lớp lá nón, bấm vào lớp nào thì lớp đó sáng màu
 *  - "postcard": bưu thiếp Làng Chuông — chọn ảnh + câu ca dao, tải về ảnh JPG
 *  - "tabs": hàng nút chọn thẻ — đổi phần nội dung đang hiện của một nhóm (vd. ảnh thật từng lớp lá, mục 2.1.2)
 *  - "timeline": dòng thời gian bấm được — mỗi mốc năm một câu chuyện (trang nghệ nhân chương 3)
 *  - "grove": lũy tre lớn dần, nón được làm dưới gốc tre (cặp trang Lưu ý) — chỉ là hình động, không bấm
 *  - "envelope": phong bì thư (Lời mở đầu) — bấm mở nắp, lá thư mang câu ca dao trượt ra
 *  - "rings": kéo 16 vòng nứa từ bó lên khuôn nón (2.1.1)
 *  - "rings2": cùng trò đó, trải trang đôi (khuôn nằm giữa gáy, hai phần tử L / R dùng chung trạng thái)
 *  - "toolbox": hộp đồ nghề (mở 2.2) — mở nắp, bấm từng món xem ảnh + lật tới trang của món đó
 *  - "lock": ảnh khoá — phủ ảnh phần thưởng của trò chơi ở trang bên, chơi xong thì mở
 *  - "sort": xếp lại các công đoạn làm nón (sau 2.3.2) — kéo thẻ, kiểm tra; đúng hết thì trang phải hiện nón hoàn thiện
 * Chế độ "edit" (editor, ảnh thu nhỏ) chỉ vẽ hình tĩnh; WebGL chỉ chạy khi trang đang mở ở chế độ đọc.
 */
const KINDS = {
  map: lazy(() => import('./MapWidget.jsx')),
  layers: lazy(() => import('./LayersWidget.jsx')),
  postcard: lazy(() => import('./PostcardWidget.jsx')),
  timeline: lazy(() => import('./TimelineWidget.jsx')),
  tabs: lazy(() => import('./TabsWidget.jsx')),
  grove: lazy(() => import('./GroveWidget.jsx')),
  envelope: lazy(() => import('./EnvelopeWidget.jsx')),
  rings: lazy(() => import('./RingsWidget.jsx')),
  rings2: lazy(() => import('./RingsSpreadWidget.jsx')),
  toolbox: lazy(() => import('./ToolboxWidget.jsx')),
  sort: lazy(() => import('./SortWidget.jsx')),
  lock: lazy(() => import('./LockWidget.jsx')),
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
