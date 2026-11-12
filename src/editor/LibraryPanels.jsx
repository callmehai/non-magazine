import { asset } from '../lib/assets.js'
import { newElement } from '../canvas/model.js'
import { Slider } from './ui.jsx'

/**
 * Hai bảng kiểu Canva cho trang Biên tập (nhóm 12/11: "code thêm giúp chị mấy cái animation vào web em code nhé, thành phần
 * gì gì đó nựa / mà nó có trong flipbook nhé / em dùng hiệu ứng nào em nạp vô, hay hình nào em nạp vô giúp chị"):
 * - Thành phần: đúng các hình vẽ sách đang dùng (public/assets/book/deco, journey, fx) — bấm hoặc kéo vào trang.
 * - Chuyển động: đúng các hiệu ứng sách đang dùng (el.anim của CanvasPage + el.spin) — gán cho phần tử đang chọn.
 */

/** [đường dẫn, tên, tỉ lệ rộng/cao] — tỉ lệ theo viewBox của file SVG */
const DECO_GROUPS = [
  [
    'Nón lá',
    [
      ['deco/non.svg', 'Nón lá', 300 / 260],
      ['deco/non-line.svg', 'Nón nét mảnh', 320 / 170],
      ['deco/non-vanh-rong.svg', 'Nón vành rộng', 320 / 170],
      ['deco/bia-non.svg', 'Nón quai đỏ', 600 / 350],
      ['deco/khung-non.svg', 'Khung nón', 240 / 140],
      ['deco/vong-non.svg', '16 vòng nón', 1],
      ['deco/m-chong-non.svg', 'Chồng nón', 240 / 150],
      ['deco/m-non-ngua.svg', 'Nón ngửa', 210 / 116],
      ['deco/m-vong-nua.svg', 'Vòng nứa', 210 / 132],
      ['deco/la-ba-lop.svg', 'Ba lớp lá', 240 / 170],
    ],
  ],
  [
    'Tre, sen, cây cỏ',
    [
      ['deco/tre-mang.svg', 'Tre và măng', 1],
      ['deco/m-canh-tre.svg', 'Cành tre', 220 / 160],
      ['deco/m-la-tre.svg', 'Lá tre rơi', 200 / 120],
      ['deco/leaf-sprig.svg', 'Cành lá', 1],
      ['deco/sen-goc.svg', 'Sen góc trang', 280 / 240],
      ['deco/sen-canh.svg', 'Cành sen', 260 / 420],
      ['deco/hoa-dai.svg', 'Hoa dại', 220 / 320],
      ['deco/co-hoa.svg', 'Cỏ hoa', 280 / 92],
      ['deco/m-bo-la.svg', 'Bó lá', 200 / 160],
      ['deco/m-chuon-chuon.svg', 'Chuồn chuồn', 200 / 166],
    ],
  ],
  [
    'Làng và nghề',
    [
      ['deco/m-mai-dinh.svg', 'Mái đình', 260 / 130],
      ['deco/m-kim-chi.svg', 'Kim chỉ', 200 / 142],
      ['deco/tool-re-la.svg', 'Rẽ lá', 1],
      ['deco/tool-la-la.svg', 'Là lá', 1],
      ['deco/tool-but-vong.svg', 'Bứt vòng', 1],
      ['deco/tool-quay-non.svg', 'Quay nón', 1],
      ['deco/tool-khau-non.svg', 'Khâu nón', 1],
      ['deco/tool-nuc-non.svg', 'Nức nón', 1],
      ['deco/tool-luon-nhoi.svg', 'Luồn nhôi', 1],
      ['deco/tool-quang-dau.svg', 'Quang dầu', 1],
      ['journey/choi.svg', 'Chổi quét dầu', 1],
    ],
  ],
  ['Nền', [['fx/bong-tre.webp', 'Bóng nắng qua tre', 1100 / 558]]],
]

/** phần tử ảnh vẽ (không bấm phóng to như ảnh chụp: tên "Hình vẽ" — xem zoomable() trong CanvasPage) */
function decoElement([path, label, ratio]) {
  const w = ratio >= 1 ? 180 : 180 * ratio
  const h = w / ratio
  const el = newElement('image', { src: `assets/book/${path}`, w, h })
  return { ...el, fit: 'contain', name: 'Hình vẽ', alt: label }
}

export function ElementsPanel({ onAdd, dragData }) {
  return (
    <>
      <h3 className="ed-panel__title">Thành phần</h3>
      <p className="ed-muted">Hình vẽ đang dùng trong sách. Bấm để thêm vào trang hoặc kéo thả vào chỗ muốn đặt.</p>
      {DECO_GROUPS.map(([group, items]) => (
        <section key={group}>
          <h4 className="ed-panel__sub">{group}</h4>
          <div className="ed-decos">
            {items.map((it) => (
              <button
                key={it[0]}
                type="button"
                className="ed-deco"
                title={it[1]}
                draggable
                onDragStart={(e) => dragData(e, { kind: 'element', el: decoElement(it) })}
                onClick={() => onAdd(decoElement(it))}
              >
                <img src={asset(`assets/book/${it[0]}`)} alt="" draggable="false" loading="lazy" />
                <span>{it[1]}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

/** Hiệu ứng xuất hiện sách đang dùng — kind khớp canvas.css (.cv-page.is-play .cv-el[data-anim=…]) */
const EFFECTS = [
  { kind: 'fade', label: 'Lướt vào', note: 'trượt từ trái, rõ dần', dur: 0.6, ease: 'cubic-bezier(0.2, 0.7, 0.2, 1)' },
  { kind: 'pop', label: 'Bật ra', note: 'phóng từ nhỏ, nảy nhẹ', dur: 0.4, ease: 'cubic-bezier(0.3, 1.6, 0.5, 1)' },
  { kind: 'stand', label: 'Dựng đứng', note: 'gập lên như sách pop-up', dur: 1.1, ease: 'cubic-bezier(0.25, 1.35, 0.45, 1)', origin: '50% 100%' },
  { kind: 'grow', label: 'Hiện từ trên xuống', note: 'như nét vẽ dần', dur: 1.1, ease: 'linear' },
  { kind: 'grow-up', label: 'Mọc từ dưới lên', note: 'như cây mọc', dur: 1.1, ease: 'linear' },
]
const effectOf = (kind) => EFFECTS.find((e) => e.kind === kind)

/** chạy thử hiệu ứng ngay trên trang đang sửa (editor không chạy el.anim — chỉ sách mới chạy khi lật tới) */
function playOnStage(els) {
  for (const el of els) {
    const fx = el.anim && effectOf(el.anim.kind)
    if (!fx) continue
    const node = document.querySelector(`.ed-stage .cv-el[data-id="${CSS.escape(el.id)}"]`)
    if (!node) continue
    node.style.animation = 'none'
    void node.offsetWidth
    node.style.transformOrigin = fx.origin || ''
    node.style.animation = `cv-anim-${fx.kind} ${el.anim.dur ?? fx.dur}s ${fx.ease} ${el.anim.delay ?? 0}s both`
    node.addEventListener(
      'animationend',
      () => {
        node.style.animation = ''
        node.style.transformOrigin = ''
      },
      { once: true }
    )
  }
}

const round1 = (n) => Math.round(n * 100) / 100

export function MotionPanel({ selection, onChange, onUpdateMany }) {
  if (!selection.length) {
    return (
      <>
        <h3 className="ed-panel__title">Chuyển động</h3>
        <p className="ed-muted">Chọn chữ, ảnh hoặc hình trên trang (giữ Shift để chọn nhiều) rồi chọn hiệu ứng. Hiệu ứng chạy mỗi lần người đọc lật tới trang.</p>
        <EffectGrid current={null} onPick={null} />
      </>
    )
  }
  const kinds = [...new Set(selection.map((e) => e.anim?.kind || ''))]
  const current = kinds.length === 1 ? kinds[0] : null
  const first = selection.find((e) => e.anim) || selection[0]
  // thanh "Bắt đầu sau" = lúc phần tử sớm nhất hiện ra (kéo thanh thì cả nhóm dời theo)
  const starts = selection.filter((e) => e.anim).map((e) => e.anim.delay ?? 0)
  const delay = starts.length ? Math.min(...starts) : 0
  const dur = first.anim?.dur ?? effectOf(current)?.dur ?? 0.6
  const images = selection.filter((e) => e.type === 'image')
  const ids = selection.map((e) => e.id).join()
  const spinning = images.length > 0 && images.every((e) => e.spin)

  const pick = (kind) => {
    if (!kind) {
      onChange({ anim: undefined }, 'anim:none')
      return
    }
    const fx = effectOf(kind)
    // mỗi phần tử giữ độ trễ riêng (đã xếp "lần lượt"), chỉ đổi kiểu + thời lượng mặc định của kiểu đó
    const patches = Object.fromEntries(selection.map((e) => [e.id, { anim: { kind, delay: e.anim?.delay ?? 0, dur: fx.dur } }]))
    onUpdateMany(patches, `${ids}:anim:${kind}`)
    requestAnimationFrame(() => playOnStage(selection.map((e) => ({ ...e, anim: patches[e.id].anim }))))
  }
  // thời lượng: như nhau cho cả nhóm; bắt đầu sau: dời cả nhóm cùng một khoảng (giữ thứ tự "Hiện lần lượt")
  const setAll = (field, v) => {
    const shift = field === 'delay' ? v - delay : 0
    const val = (e) => (field === 'delay' ? Math.max(0, round1((e.anim.delay ?? 0) + shift)) : v)
    const patches = Object.fromEntries(selection.filter((e) => e.anim).map((e) => [e.id, { anim: { ...e.anim, [field]: val(e) } }]))
    onUpdateMany(patches, `${ids}:anim-${field}`)
  }
  // lần lượt: theo thứ tự trên trang (trên xuống, trái sang), mỗi phần tử chậm hơn phần trước 0,3 giây
  const stagger = () => {
    const order = [...selection].filter((e) => e.anim).sort((a, b) => a.y - b.y || a.x - b.x)
    const patches = Object.fromEntries(order.map((e, i) => [e.id, { anim: { ...e.anim, delay: round1(delay + i * 0.3) } }]))
    onUpdateMany(patches, `${ids}:anim-stagger`)
    requestAnimationFrame(() => playOnStage(order.map((e) => ({ ...e, anim: patches[e.id].anim }))))
  }

  // xoay chậm chỉ ghi vào ảnh (chữ, hình khối không có xoay)
  const setSpin = (v, key) => onUpdateMany(Object.fromEntries(images.map((e) => [e.id, { spin: v }])), `${ids}:${key}`)

  return (
    <>
      <h3 className="ed-panel__title">Chuyển động</h3>
      <p className="ed-muted">
        {selection.length > 1 ? `${selection.length} phần tử đang chọn. ` : ''}Hiệu ứng chạy mỗi lần người đọc lật tới trang. Bấm một kiểu để gán và xem thử ngay trên trang.
      </p>
      <EffectGrid current={current} onPick={pick} />
      {current && (
        <div className="ed-motion">
          <Slider label="Bắt đầu sau" value={delay} min={0} max={5} step={0.1} suffix=" giây" onChange={(v) => setAll('delay', v)} />
          <Slider label="Thời lượng" value={dur} min={0.2} max={3} step={0.1} suffix=" giây" onChange={(v) => setAll('dur', v)} />
          <div className="ed-btnrow">
            <button type="button" className="ed-btn" onClick={() => playOnStage(selection)}>
              ▶ Xem thử
            </button>
            {selection.length > 1 && (
              <button type="button" className="ed-btn" onClick={stagger} title="Phần tử trên trước, dưới sau, mỗi cái chậm hơn 0,3 giây">
                Hiện lần lượt
              </button>
            )}
          </div>
        </div>
      )}
      {images.length > 0 && (
        <>
          <h4 className="ed-panel__sub">Chuyển động liên tục</h4>
          <label className="ed-check">
            <input type="checkbox" checked={spinning} onChange={(e) => setSpin(e.target.checked ? 90 : undefined, 'spin')} />
            Xoay chậm mãi
          </label>
          {spinning && (
            <Slider label="Một vòng" value={images[0].spin} min={10} max={240} step={5} suffix=" giây" onChange={(v) => setSpin(v, 'spin-s')} />
          )}
        </>
      )}
    </>
  )
}

function EffectGrid({ current, onPick }) {
  const items = [{ kind: '', label: 'Không', note: 'hiện sẵn' }, ...EFFECTS]
  return (
    <div className="ed-fxgrid">
      {items.map((fx) => (
        <button
          key={fx.kind || 'none'}
          type="button"
          className={`ed-fx ${current === fx.kind ? 'is-on' : ''}`}
          disabled={!onPick}
          onClick={() => onPick?.(fx.kind)}
          title={fx.note}
        >
          <span className="ed-fx__demo" data-k={fx.kind || undefined} style={fx.kind ? { '--fx-dur': `${fx.dur}s`, '--fx-ease': fx.ease } : null}>
            <img src={asset('assets/book/deco/non.svg')} alt="" draggable="false" />
          </span>
          <b>{fx.label}</b>
          <small>{fx.note}</small>
        </button>
      ))}
    </div>
  )
}
