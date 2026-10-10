import { useState } from 'react'
import CanvasPage, { fontStack } from '../canvas/CanvasPage.jsx'
import { TEMPLATE_KINDS, newElement } from '../canvas/model.js'
import { ensureFont } from '../canvas/fonts.js'
import { UploadButton } from './ui.jsx'

export const DND_TYPE = 'application/x-non-editor'

/** Kiểu chữ có sẵn — bấm hoặc kéo vào trang */
const TEXT_PRESETS = [
  { label: 'Thêm tiêu đề', sample: '見出しを入力', el: { text: '見出しを入力', font: 'Noto Serif JP', weight: 700, size: 30, w: 360, h: 50, lineHeight: 1.3 } },
  { label: 'Thêm tiêu đề phụ', sample: '小見出し', el: { text: '小見出しを入力', font: 'Noto Serif JP', weight: 700, size: 18, w: 300, h: 32, lineHeight: 1.4 } },
  { label: 'Thêm đoạn văn', sample: '本文テキスト', el: { text: '本文をここに入力します。', font: 'Noto Sans JP', weight: 400, size: 10.5, w: 300, h: 80, lineHeight: 1.85 } },
  { label: 'Chú thích nhỏ', sample: 'キャプション', el: { text: 'キャプション', font: 'Noto Sans JP', weight: 400, size: 8, w: 200, h: 16, color: '#5e4d3d' } },
  { label: 'Tiêu đề dọc', sample: '縦の見出し', el: { text: '縦の見出し', font: 'Noto Serif JP', weight: 700, size: 34, w: 60, h: 300, vertical: true, lineHeight: 1.3 } },
  { label: 'Đoạn văn dọc', sample: '縦書きの本文', el: { text: '縦書きの本文をここに入力します。', font: 'Noto Serif JP', weight: 400, size: 11.5, w: 200, h: 340, vertical: true, lineHeight: 1.8 } },
]
const STYLE_PRESETS = [
  { sample: 'ノンの物語', el: { text: 'ノンの物語', font: 'Zen Maru Gothic', weight: 700, size: 30, w: 320, h: 48, color: '#7d2f2a' } },
  { sample: '笠の村', el: { text: '笠の村', font: 'Dela Gothic One', weight: 400, size: 36, w: 260, h: 56, color: '#3b2a1e' } },
  { sample: 'てがき', el: { text: 'てがきのメモ', font: 'Yomogi', weight: 400, size: 20, w: 260, h: 34, color: '#5e4d3d' } },
  { sample: 'NÓN', el: { text: 'NÓN', font: 'Playfair Display', weight: 400, size: 64, w: 300, h: 90, tracking: 12, color: '#2a1f17', align: 'center' } },
  { sample: 'Chapter One', el: { text: 'Chapter One', font: 'Playfair Display', weight: 400, italic: true, size: 26, w: 300, h: 40, color: '#b8955a' } },
  { sample: '明朝の見出し', el: { text: '明朝の見出し', font: 'Shippori Mincho', weight: 700, size: 28, w: 320, h: 46 } },
]

const SHAPES = [
  ['rect', 'Chữ nhật'],
  ['ellipse', 'Tròn'],
  ['triangle', 'Tam giác'],
  ['line', 'Đường kẻ'],
]

const TABS = [
  ['templates', 'Mẫu', '▤'],
  ['text', 'Chữ', 'T'],
  ['uploads', 'Tải lên', '⇪'],
  ['shapes', 'Hình', '◆'],
]

export default function SidePanel({ tab, onTab, uploads, onAddPage, onAddElement, onAddAsset, onUploadFiles, uploading }) {
  return (
    <div className={`ed-side ${tab ? 'is-open' : ''}`}>
      <nav className="ed-rail">
        {TABS.map(([k, label, icon]) => (
          <button key={k} type="button" className={`ed-rail__btn ${tab === k ? 'is-on' : ''}`} onClick={() => onTab(tab === k ? null : k)}>
            <span className="ed-rail__icon">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
      {tab && (
        <div className="ed-panel">
          {tab === 'templates' && <Templates onAddPage={onAddPage} />}
          {tab === 'text' && <TextPanel onAdd={onAddElement} />}
          {tab === 'uploads' && <Uploads uploads={uploads} onAdd={onAddAsset} onUploadFiles={onUploadFiles} uploading={uploading} />}
          {tab === 'shapes' && <Shapes onAdd={onAddElement} />}
          <button type="button" className="ed-panel__close" onClick={() => onTab(null)} title="Thu gọn">
            ‹
          </button>
        </div>
      )}
    </div>
  )
}

function dragData(e, payload) {
  e.dataTransfer.setData(DND_TYPE, JSON.stringify(payload))
  e.dataTransfer.effectAllowed = 'copy'
}

function Templates({ onAddPage }) {
  return (
    <>
      <h3 className="ed-panel__title">Mẫu trang</h3>
      <p className="ed-muted">Bấm để thêm một trang theo mẫu, ngay sau trang đang mở.</p>
      <div className="ed-tplgrid">
        <button type="button" className="ed-tpl" onClick={() => onAddPage(null)}>
          <span className="ed-tpl__thumb" style={{ background: '#f4ede0' }} />
          <span>Trang trống</span>
        </button>
        {TEMPLATE_KINDS.map((t) => (
          <button type="button" key={t.template} className="ed-tpl" onClick={() => onAddPage(t)}>
            <span className="ed-tpl__thumb">
              <CanvasPage page={t} mode="edit" />
            </span>
            <span>{t.templateName}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function TextPanel({ onAdd }) {
  STYLE_PRESETS.forEach((p) => ensureFont(p.el.font))
  const make = (p) => ({ ...newElement(p.el.vertical ? 'vtext' : 'text'), color: '#2a1f17', align: 'left', ...p.el, name: undefined })
  return (
    <>
      <h3 className="ed-panel__title">Chữ</h3>
      <p className="ed-muted">Bấm để thêm vào giữa trang, hoặc kéo thả vào chỗ muốn đặt.</p>
      <div className="ed-presets">
        {TEXT_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`ed-preset ${p.el.vertical ? 'is-vertical' : ''}`}
            draggable
            onDragStart={(e) => dragData(e, { kind: 'element', el: make(p) })}
            onClick={() => onAdd(make(p))}
          >
            <span className="ed-preset__sample" style={{ fontFamily: fontStack(p.el.font), fontWeight: p.el.weight, fontSize: Math.min(26, Math.max(13, p.el.size * 0.8)) }}>
              {p.sample}
            </span>
            <span className="ed-preset__label">{p.label}</span>
          </button>
        ))}
      </div>
      <h4 className="ed-panel__sub">Kiểu chữ trang trí</h4>
      <div className="ed-stylegrid">
        {STYLE_PRESETS.map((p) => (
          <button key={p.sample} type="button" className="ed-style" draggable onDragStart={(e) => dragData(e, { kind: 'element', el: make(p) })} onClick={() => onAdd(make(p))}>
            <span style={{ fontFamily: fontStack(p.el.font), fontWeight: p.el.weight, fontStyle: p.el.italic ? 'italic' : 'normal', color: p.el.color }}>{p.sample}</span>
          </button>
        ))}
      </div>
    </>
  )
}

function Uploads({ uploads, onAdd, onUploadFiles, uploading }) {
  const [over, setOver] = useState(false)
  return (
    <>
      <h3 className="ed-panel__title">Tải lên</h3>
      <UploadButton accept="image/*,video/mp4,video/webm" multiple className="ed-btn ed-btn--primary ed-btn--block" onFiles={onUploadFiles}>
        {uploading ? `Đang tải lên ${uploading} tệp…` : 'Tải ảnh / video lên'}
      </UploadButton>
      <div
        className={`ed-drop ${over ? 'is-over' : ''}`}
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes('Files')) {
            e.preventDefault()
            setOver(true)
          }
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          const files = [...e.dataTransfer.files]
          if (files.length) onUploadFiles(files)
        }}
      >
        Hoặc kéo ảnh từ máy tính thả vào đây — hoặc thả thẳng lên trang
      </div>
      <p className="ed-muted">Ảnh đã tải lên dùng chung cho cả nhóm. Bấm để thêm vào trang, kéo thả vào trang hoặc thả lên một ảnh có sẵn để thay ảnh đó.</p>
      <div className="ed-uploads">
        {uploads.map((u) => (
          <button
            key={u.url}
            type="button"
            className="ed-upload"
            draggable
            onDragStart={(e) => dragData(e, { kind: 'asset', asset: u })}
            onClick={() => onAdd(u)}
            title={u.name}
          >
            {u.type === 'video' ? (
              <>
                <video src={u.url} muted preload="metadata" />
                <span className="ed-upload__badge">▶ video</span>
              </>
            ) : (
              <img src={u.url} alt={u.name} loading="lazy" draggable="false" />
            )}
          </button>
        ))}
        {uploads.length === 0 && <p className="ed-muted">Chưa có ảnh nào.</p>}
      </div>
    </>
  )
}

function Shapes({ onAdd }) {
  return (
    <>
      <h3 className="ed-panel__title">Hình</h3>
      <div className="ed-shapes">
        {SHAPES.map(([k, label]) => (
          <button key={k} type="button" className="ed-shape" draggable onDragStart={(e) => dragData(e, { kind: 'element', el: newElement(k) })} onClick={() => onAdd(newElement(k))}>
            <svg viewBox="0 0 40 40" aria-hidden="true">
              {k === 'rect' && <rect x="4" y="8" width="32" height="24" fill="#b8955a" />}
              {k === 'ellipse' && <circle cx="20" cy="20" r="15" fill="#b8955a" />}
              {k === 'triangle' && <polygon points="4,34 20,6 36,34" fill="#b8955a" />}
              {k === 'line' && <line x1="4" y1="20" x2="36" y2="20" stroke="#2a1f17" strokeWidth="2" />}
            </svg>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </>
  )
}
