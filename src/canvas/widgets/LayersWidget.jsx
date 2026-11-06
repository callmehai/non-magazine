import { useContext, useState } from 'react'
import { useCanvasLang, plainText } from '../lang.js'
import { asset } from '../../lib/assets.js'
import { setTab, useTab } from '../tabs.js'
import { MagazineContext } from '../../lib/context.js'

/**
 * Mô hình 3 lớp lá nón (mục 2.1.2): danh sách ba lớp bên trái, ba lớp tách rời xếp tầng bên phải.
 * Anh Hải 05/11: "bên trái mặc định như này, khỏi 3d đi cho nhẹ trang, defaut chọn layer 1 luôn" → không chạy WebGL;
 * ba lớp là ba ảnh tĩnh nền trong suốt chụp từ mô hình 3D cũ (mặt lớp là ảnh thật nhóm chụp — scripts/book/layer-tex.py,
 * chụp lại bằng scripts/book/layer-stack.browser.js), chồng đúng chỗ.
 * Bấm vào một lớp (trên hình hoặc trong danh sách) → lớp đó rõ + nhô nhẹ, hai lớp kia mờ đi; mặc định lớp 1.
 * el.items = [{ name: [vi, ja], kind: 'inner' | 'mo' | 'outer' }] (thứ tự Doc: trong → mo nang → ngoài)
 * el.tabSet: nhóm thẻ (src/canvas/tabs.js) của trang bên cạnh — bấm lớp thứ i thì trang bên hiện ảnh thật + mô tả lớp
 * đó; bấm hàng chọn ở trang bên thì hình bên này cũng sáng lớp tương ứng (cùng một trạng thái, không lệch nhau).
 */
const COLOR = { outer: '#d9962f', mo: '#a95f3c', inner: '#5f8a4a' }
// xếp từ trên xuống như khi tách lớp nón ra: lớp ngoài trên cùng, mo nang giữa, lớp trong dưới cùng.
// band = dải chiều cao (tỉ lệ khung ảnh) phần lớp đó lộ ra → vùng bấm của lớp, không chồng lên nhau
const STACK = [
  { kind: 'outer', band: [0, 0.43] },
  { kind: 'mo', band: [0.43, 0.73] },
  { kind: 'inner', band: [0.73, 1] },
]
const L = {
  vi: 'Bấm vào một lớp để xem ảnh thật',
  ja: '層をクリックすると実物の画像が見られます',
}
const L_PORTRAIT = {
  vi: 'Chạm một lớp để xem ảnh thật ở trang sau →',
  ja: '層をタップすると次のページで実物の画像へ →',
}

export default function LayersWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const items = el.items || []
  const tab = useTab(el.tabSet)
  const [own, setOwn] = useState(0) // không có trang bên (tabSet) thì tự giữ lớp đang chọn
  const cur = el.tabSet ? tab : own
  const { portrait, nextPage } = useContext(MagazineContext)
  // review lần 2 (điện thoại): sách hiện một trang thì chạm lớp ở tr. 52 không thấy gì đổi (ảnh lớp ở tr. 53) → lật sang luôn
  const pick = (i) => {
    if (el.tabSet) {
      setTab(el.tabSet, i)
      if (portrait) nextPage?.()
    } else setOwn(i)
  }
  const kindOf = (i) => items[i]?.kind
  const sel = kindOf(cur)
  const idxOf = (kind) => items.findIndex((it) => it.kind === kind)

  return (
    <div className="cvw cvw-layers has-sel" data-no-flip={interactive ? '' : undefined}>
      {/* danh sách xếp cùng chiều hình (ngoài trên cùng … trong dưới cùng); số 1 · 2 · 3 giữ thứ tự Doc */}
      <ol className="cvw-layers__list">
        {STACK.map(({ kind }) => {
          const i = idxOf(kind)
          if (i < 0) return null
          const it = items[i]
          return (
            <li key={kind}>
              <button
                type="button"
                className={`cvw-layers__item ${sel === kind ? 'is-on' : ''}`}
                style={{ '--c': COLOR[kind] }}
                onClick={() => pick(i)}
                disabled={!interactive}
                aria-pressed={sel === kind}
              >
                <span className="cvw-layers__no">{i + 1}</span>
                <span className="cvw-layers__txt">
                  {(() => {
                    // "Lớp lá lụi (lớp ngoài)" → "Lớp lá lụi" / "(lớp ngoài)": chữ giữ nguyên, chỉ xuống dòng trước ngoặc
                    const s = plainText(it.name[li] ?? it.name[0])
                    const k = s.search(/[（(]/)
                    return k > 0 ? (
                      <>
                        <b>{s.slice(0, k).trim()}</b>
                        <small>{s.slice(k)}</small>
                      </>
                    ) : (
                      <b>{s}</b>
                    )
                  })()}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      <div className="cvw-layers__stage">
        <div className="cvw-layers__stack">
          {[...STACK].reverse().map(({ kind }) => (
            <img
              key={kind}
              className={`cvw-layers__img ${sel === kind ? 'is-on' : ''}`}
              style={{ '--c': COLOR[kind] }}
              src={asset(`assets/book/fx/lop-stack-${kind}.webp`)}
              alt=""
              draggable="false"
            />
          ))}
          {interactive &&
            STACK.map(({ kind, band }) => {
              const i = idxOf(kind)
              if (i < 0) return null
              return (
                <button
                  key={kind}
                  type="button"
                  className="cvw-layers__hit"
                  style={{ top: `${band[0] * 100}%`, height: `${(band[1] - band[0]) * 100}%` }}
                  onClick={() => pick(i)}
                  aria-label={plainText(items[i].name[li] ?? items[i].name[0])}
                />
              )
            })}
        </div>
        {interactive && <span className="cvw-layers__hint">{(portrait && el.tabSet ? L_PORTRAIT : L)[lang]}</span>}
      </div>
    </div>
  )
}
