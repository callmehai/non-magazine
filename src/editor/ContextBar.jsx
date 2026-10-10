import FontPicker from './FontPicker.jsx'
import { ColorButton, Popover, Stepper, Slider, NumberField, IconBtn, UploadButton } from './ui.jsx'
import { boldWeight } from '../canvas/fonts.js'

/**
 * Thanh công cụ ngay trên trang — đổi theo thứ đang chọn (giống Canva):
 * không chọn gì → nền trang · chữ → font/cỡ/màu… · ảnh → thay ảnh · nhiều phần tử → căn hàng.
 */
export default function ContextBar(props) {
  const { selection, readOnly } = props
  if (readOnly) return <div className="ed-ctx is-readonly">Chỉ xem — trang đang được người khác sửa</div>
  if (selection.length > 1) return <MultiBar {...props} />
  const el = selection[0]
  if (!el) return <PageBar {...props} />
  return (
    <div className="ed-ctx">
      {el.type === 'text' && <TextTools {...props} el={el} />}
      {el.type === 'shape' && <ShapeTools {...props} el={el} />}
      {el.type === 'line' && <LineTools {...props} el={el} />}
      {el.type === 'image' && <ImageTools {...props} el={el} />}
      {el.type === 'video' && <VideoTools {...props} el={el} />}
      {el.type === 'group' && <GroupTools {...props} el={el} />}
      <span className="ed-ctx__grow" />
      <CommonTools {...props} el={el} />
    </div>
  )
}

function PageBar({ page, pageNumber, docColors, onPageChange, onUpload }) {
  if (!page) return <div className="ed-ctx" />
  const side = pageNumber === 1 ? 'Bìa trước' : pageNumber % 2 === 0 ? 'Trang nằm bên phải' : 'Trang nằm bên trái'
  return (
    <div className="ed-ctx">
      <span className="ed-ctx__label">
        Trang {pageNumber} · {side}
      </span>
      <span className="ed-ctx__sep" />
      <span className="ed-ctx__text">Nền</span>
      <ColorButton value={page.bg} onChange={(bg) => onPageChange({ bg }, 'bg')} docColors={docColors} title="Màu nền trang" />
      <UploadButton accept="image/*" className="ed-cbtn" onFiles={async ([f]) => onPageChange({ bgImage: await onUpload(f, 'image') })}>
        {page.bgImage ? 'Đổi ảnh nền' : 'Ảnh nền'}
      </UploadButton>
      {page.bgImage && (
        <IconBtn onClick={() => onPageChange({ bgImage: null })} title="Bỏ ảnh nền">
          Bỏ ảnh nền
        </IconBtn>
      )}
      <span className="ed-ctx__sep" />
      <label className="ed-check">
        <input type="checkbox" checked={!page.hideNumber} onChange={(e) => onPageChange({ hideNumber: !e.target.checked })} />
        In số trang
      </label>
      <span className="ed-ctx__grow" />
      <span className="ed-ctx__hint">Bấm vào chữ / ảnh để sửa · kéo chuột trên vùng trống để chọn nhiều</span>
    </div>
  )
}

function TextTools({ el, onChange, docColors }) {
  const bold = (el.weight || 400) >= 600
  const nextAlign = { left: 'center', center: 'right', right: 'left' }[el.align || 'left']
  return (
    <>
      <FontPicker value={el.font} onChange={(font) => onChange({ font, weight: bold ? boldWeight(font) : 400 })} />
      <Stepper value={el.size} onChange={(size) => onChange({ size }, 'size')} min={4} max={400} title="Cỡ chữ" />
      <ColorButton value={el.color} onChange={(color) => onChange({ color }, 'color')} docColors={docColors} title="Màu chữ" icon={<b className="ed-a">A</b>} />
      <IconBtn on={bold} onClick={() => onChange({ weight: bold ? 400 : boldWeight(el.font) })} title="Đậm (⌘B)">
        <b>B</b>
      </IconBtn>
      <IconBtn on={!!el.italic} onClick={() => onChange({ italic: !el.italic })} title="Nghiêng (⌘I)">
        <i>I</i>
      </IconBtn>
      <IconBtn onClick={() => onChange({ align: nextAlign })} title={`Căn lề: ${alignName(el)}`}>
        <AlignIcon align={el.align || 'left'} vertical={el.vertical} />
      </IconBtn>
      <IconBtn on={!!el.vertical} onClick={() => onChange({ vertical: !el.vertical, w: el.h, h: el.w })} title={el.vertical ? 'Đổi sang chữ ngang' : 'Đổi sang chữ dọc 縦書き'}>
        <span className="ed-jp">縦</span>
      </IconBtn>
      <Popover title="Giãn cách" button={<SpacingIcon />}>
        <div className="ed-popform">
          <Slider label="Giãn dòng" value={el.lineHeight || 1.5} min={0.8} max={3} step={0.05} onChange={(v) => onChange({ lineHeight: v }, 'lh')} />
          <Slider label="Giãn chữ" value={el.tracking || 0} min={-2} max={20} step={0.5} onChange={(v) => onChange({ tracking: v }, 'tr')} />
          <Slider label="Cách đoạn" value={el.paraGap || 0} min={0} max={40} step={1} onChange={(v) => onChange({ paraGap: v }, 'pg')} />
        </div>
      </Popover>
      <Popover title="Gắn link" button={<span className={el.link ? 'ed-linked' : ''}>🔗</span>}>
        <div className="ed-popform">
          <label className="ed-field">
            Link (người đọc bấm vào chữ để mở)
            <input className="ed-input" type="url" placeholder="https://…" value={el.link || ''} onChange={(e) => onChange({ link: e.target.value || undefined }, 'link')} />
          </label>
        </div>
      </Popover>
    </>
  )
}

function ShapeTools({ el, onChange, docColors }) {
  return (
    <>
      <span className="ed-ctx__text">Màu</span>
      <ColorButton value={el.fill} onChange={(fill) => onChange({ fill }, 'fill')} docColors={docColors} allowNone title="Màu tô" />
      <span className="ed-ctx__text">Viền</span>
      <ColorButton value={el.stroke} onChange={(stroke) => onChange({ stroke, strokeWidth: el.strokeWidth || 2 }, 'stroke')} docColors={docColors} allowNone title="Màu viền" />
      {el.stroke && <Stepper value={el.strokeWidth || 1} onChange={(v) => onChange({ strokeWidth: v }, 'sw')} min={0.5} max={40} step={0.5} title="Độ dày viền" width={36} />}
      {el.shape === 'rect' && (
        <Popover title="Bo góc" button="Bo góc">
          <div className="ed-popform">
            <Slider label="Bo góc" value={el.radius || 0} min={0} max={Math.min(el.w, el.h) / 2} step={1} onChange={(v) => onChange({ radius: v }, 'radius')} />
          </div>
        </Popover>
      )}
    </>
  )
}

function LineTools({ el, onChange, docColors }) {
  return (
    <>
      <span className="ed-ctx__text">Màu</span>
      <ColorButton value={el.stroke} onChange={(stroke) => onChange({ stroke }, 'stroke')} docColors={docColors} title="Màu đường kẻ" />
      <span className="ed-ctx__text">Độ dày</span>
      <Stepper value={el.strokeWidth || 1} onChange={(v) => onChange({ strokeWidth: v }, 'sw')} min={0.25} max={40} step={0.5} width={36} />
    </>
  )
}

function ImageTools({ el, onChange, onUpload }) {
  return (
    <>
      <UploadButton accept="image/*" className="ed-cbtn" onFiles={async ([f]) => onChange({ src: await onUpload(f, 'image') })}>
        Thay ảnh
      </UploadButton>
      <IconBtn on={(el.fit || 'cover') === 'cover'} onClick={() => onChange({ fit: 'cover' })} title="Ảnh phủ kín khung (cắt bớt mép)">
        Phủ kín
      </IconBtn>
      <IconBtn on={el.fit === 'contain'} onClick={() => onChange({ fit: 'contain' })} title="Hiện trọn ảnh trong khung">
        Vừa khung
      </IconBtn>
      <span className="ed-ctx__hint">Mẹo: kéo ảnh từ mục Tải lên thả vào ảnh này để thay</span>
    </>
  )
}

function VideoTools({ el, onChange, onUpload, onPreviewVideo }) {
  return (
    <>
      {el.src && (
        <button type="button" className="ed-cbtn" onClick={() => onPreviewVideo(el.id)} title="Xem video (hoặc nhấp đúp vào video)">
          ▶ Xem video
        </button>
      )}
      <UploadButton
        accept="video/mp4,video/webm"
        className="ed-cbtn"
        onFiles={async ([f]) => {
          const item = await onUpload(f, 'video', true)
          onChange({ src: item.url, poster: item.poster || '' })
        }}
      >
        {el.src ? 'Thay video' : 'Tải video lên'}
      </UploadButton>
      <UploadButton accept="image/*" className="ed-cbtn" onFiles={async ([f]) => onChange({ poster: await onUpload(f, 'image') })}>
        {el.poster ? 'Tải ảnh bìa khác' : 'Tải ảnh bìa'}
      </UploadButton>
      <span className="ed-ctx__hint">Ảnh bìa: mở “Xem video”, dừng ở cảnh đẹp rồi chọn làm ảnh bìa</span>
    </>
  )
}

function CommonTools({ el, onChange, onLayer, onAlign, onDuplicate, onDelete }) {
  return (
    <>
      <Popover title="Độ trong suốt" button={<OpacityIcon />} align="right">
        <div className="ed-popform">
          <Slider label="Độ đậm" value={Math.round((el.opacity ?? 1) * 100)} min={0} max={100} step={1} suffix="%" onChange={(v) => onChange({ opacity: v / 100 }, 'op')} />
        </div>
      </Popover>
      <Popover title="Vị trí, lớp, căn chỉnh" button="Vị trí" align="right">
        <div className="ed-popform ed-popform--wide">
          <div className="ed-poplabel">Lớp</div>
          <div className="ed-btnrow">
            <button type="button" className="ed-btn" onClick={() => onLayer('front')}>
              Lên trên cùng
            </button>
            <button type="button" className="ed-btn" onClick={() => onLayer('up')}>
              Lên 1 lớp
            </button>
            <button type="button" className="ed-btn" onClick={() => onLayer('down')}>
              Xuống 1 lớp
            </button>
            <button type="button" className="ed-btn" onClick={() => onLayer('back')}>
              Xuống dưới cùng
            </button>
          </div>
          <div className="ed-poplabel">Căn theo trang</div>
          <AlignButtons onAlign={onAlign} />
          <div className="ed-poplabel">Kích thước chính xác (pt)</div>
          <div className="ed-grid2">
            <NumberField label="X" value={el.x} onChange={(x) => onChange({ x }, 'x')} />
            <NumberField label="Y" value={el.y} onChange={(y) => onChange({ y }, 'y')} />
            <NumberField label="Rộng" value={el.w} min={2} onChange={(w) => onChange({ w }, 'w')} />
            <NumberField label="Cao" value={el.h} min={2} onChange={(h) => onChange({ h }, 'h')} />
            <NumberField label="Xoay °" value={el.rot || 0} onChange={(rot) => onChange({ rot }, 'rot')} />
          </div>
        </div>
      </Popover>
      <IconBtn onClick={onDuplicate} title="Nhân bản (⌘D)">
        ⧉
      </IconBtn>
      <IconBtn onClick={onDelete} title="Xoá (Delete)" danger>
        🗑
      </IconBtn>
    </>
  )
}

function GroupTools({ el, onUngroup }) {
  return (
    <>
      <span className="ed-ctx__label">Nhóm</span>
      <button type="button" className="ed-cbtn" onClick={() => onUngroup(el.id)} title="Tách nhóm để sửa từng phần (⌘⇧G)">
        Rã nhóm
      </button>
      <span className="ed-ctx__hint">Nhấp đúp vào một phần để sửa riêng phần đó</span>
    </>
  )
}

function MultiBar({ selection, onAlign, onDuplicate, onDelete, onGroup }) {
  return (
    <div className="ed-ctx">
      <span className="ed-ctx__label">Đã chọn {selection.length} phần tử</span>
      <button type="button" className="ed-cbtn" onClick={onGroup} title="Gộp thành một nhóm để di chuyển cùng nhau (⌘G)">
        Nhóm lại
      </button>
      <span className="ed-ctx__sep" />
      <span className="ed-ctx__text">Căn hàng</span>
      <AlignButtons onAlign={onAlign} inline />
      <span className="ed-ctx__grow" />
      <IconBtn onClick={onDuplicate} title="Nhân bản (⌘D)">
        ⧉
      </IconBtn>
      <IconBtn onClick={onDelete} title="Xoá (Delete)" danger>
        🗑
      </IconBtn>
    </div>
  )
}

const ALIGNS = [
  ['left', 'Trái'],
  ['center', 'Giữa (ngang)'],
  ['right', 'Phải'],
  ['top', 'Trên'],
  ['middle', 'Giữa (dọc)'],
  ['bottom', 'Dưới'],
]

function AlignButtons({ onAlign, inline }) {
  return (
    <div className={inline ? 'ed-ctx__group' : 'ed-btnrow'}>
      {ALIGNS.map(([k, label]) => (
        <IconBtn key={k} onClick={() => onAlign(k)} title={`Căn ${label}`}>
          <AlignBoxIcon dir={k} />
        </IconBtn>
      ))}
    </div>
  )
}

/* ── icon nhỏ (SVG) ─────────────────────────────────── */
function AlignIcon({ align, vertical }) {
  const ws = [12, 16, 12]
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" style={vertical ? { transform: 'rotate(90deg)' } : undefined} aria-hidden="true">
      {ws.map((w, i) => (
        <rect key={i} x={align === 'right' ? 18 - w : align === 'center' ? (20 - w) / 2 : 2} y={4 + i * 5} width={w} height="2" rx="1" fill="currentColor" />
      ))}
    </svg>
  )
}

function AlignBoxIcon({ dir }) {
  const horiz = ['left', 'center', 'right'].includes(dir)
  const pos = { left: 3, center: 10, right: 17, top: 3, middle: 10, bottom: 17 }[dir]
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      {horiz ? (
        <>
          <line x1={pos} y1="2" x2={pos} y2="18" stroke="currentColor" strokeWidth="1.5" />
          <rect x={dir === 'left' ? 4 : dir === 'right' ? 6 : 5} y="5" width="10" height="4" rx="1" fill="currentColor" opacity=".7" />
          <rect x={dir === 'left' ? 4 : dir === 'right' ? 10 : 7} y="11" width="6" height="4" rx="1" fill="currentColor" opacity=".7" />
        </>
      ) : (
        <>
          <line x1="2" y1={pos} x2="18" y2={pos} stroke="currentColor" strokeWidth="1.5" />
          <rect y={dir === 'top' ? 4 : dir === 'bottom' ? 6 : 5} x="5" height="10" width="4" rx="1" fill="currentColor" opacity=".7" />
          <rect y={dir === 'top' ? 4 : dir === 'bottom' ? 10 : 7} x="11" height="6" width="4" rx="1" fill="currentColor" opacity=".7" />
        </>
      )}
    </svg>
  )
}

function SpacingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M3 4h14M3 10h14M3 16h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M17 6.5v7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  )
}

function OpacityIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
      <rect x="2" y="2" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2 18L18 2V18Z" fill="currentColor" opacity=".55" />
    </svg>
  )
}

const alignName = (el) =>
  ({ left: el.vertical ? 'trên' : 'trái', center: 'giữa', right: el.vertical ? 'dưới' : 'phải' })[el.align || 'left']
