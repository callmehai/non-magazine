import { useCanvasLang, plainText } from '../lang.js'
import { setTab, useTab } from '../tabs.js'

/**
 * Hàng chọn thẻ (el.set, src/canvas/tabs.js): bấm mục nào thì các phần tử el.tab = { set, i } của thẻ đó hiện ra.
 * Mục 2.1.2: ba lớp lá ở đầu trang ảnh thật (cùng nhóm với mô hình 3D ở trang trái) — đọc một trang (màn hẹp) vẫn
 * chuyển được lớp mà không cần mô hình.
 * Kiểu theo concept sách ("đường khâu" nét đứt): ba nút như ba mũi khâu trên một sợi chỉ, số 01 · 02 · 03 chữ Playfair,
 * tên lớp hai dòng; lớp đang chọn: mũi khâu tô màu lớp, số đậm màu lớp, gạch chân liền màu lớp.
 * el.items = [{ name: [vi, ja], color }]
 */
// "Lớp lá lụi (lớp trong)" → "Lớp lá lụi" / "(lớp trong)" (chữ giữ nguyên, chỉ xuống dòng trước ngoặc)
const split = (s) => {
  const k = s.search(/[（(]/)
  return k > 0 ? [s.slice(0, k).trim(), s.slice(k)] : [s, '']
}

export default function TabsWidget({ el, interactive }) {
  const li = useCanvasLang() === 'ja' ? 1 : 0
  const cur = useTab(el.set)
  return (
    <div className="cvw cvw-tabs" role="tablist" data-no-flip={interactive ? '' : undefined}>
      {(el.items || []).map((it, i) => {
        const [a, b] = split(plainText(it.name[li] ?? it.name[0]))
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={cur === i}
            className={`cvw-tabs__btn ${cur === i ? 'is-on' : ''}`}
            style={{ '--c': it.color }}
            onClick={() => setTab(el.set, i)}
            disabled={!interactive}
          >
            <span className="cvw-tabs__dot" aria-hidden="true" />
            <span className="cvw-tabs__no">{String(i + 1).padStart(2, '0')}</span>
            <span className="cvw-tabs__name">
              <b>{a}</b>
              {b && <span>{b}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
