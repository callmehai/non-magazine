import { createContext, lazy, memo, Suspense, useContext, useEffect, useMemo, useState } from 'react'
import { MagazineContext } from '../lib/context.js'
import { asset } from '../lib/assets.js'
import { PAGE_W, PAGE_H } from './model.js'
import { useCanvasLang, textOf, fontOf, sizeOf, hasLang, parseRuby, plainText } from './lang.js'
import { t } from '../lib/i18n.js'
import { PAPER_BASE, paperOf } from './papers.js'

// bản đồ, mô hình 3D… chỉ tải khi trang có phần tử tương tác
const Widget = lazy(() => import('./widgets/index.jsx'))

// ảnh bấm để xem lớn (chế độ đọc; trừ ảnh tràn ngang trang như bìa, ảnh mở chương): cả trang dùng chung một danh sách để ← → chuyển ảnh trong lightbox
const ZoomList = createContext(null)
const zoomable = (el) =>
  el.type === 'image' && !!el.src && el.name !== 'Họa tiết' && !/logo/i.test(`${el.name} ${el.hint}`) && el.w < PAGE_W * 0.95 && el.w * el.h < PAGE_W * PAGE_H * 0.8
const captionOf = (el, lang) => {
  const c = plainText(lang === 'ja' ? el.hintJa || el.hint : el.hint)
  return /^GIF\b/.test(c) ? '' : c
}

/**
 * Vẽ một trang "canvas" (dữ liệu JSON do editor tạo) — dùng chung cho editor và flipbook.
 *
 * Toạ độ, cỡ chữ… tính bằng point của trang A4 (PAGE_W × PAGE_H).
 * Khung ngoài đặt font-size = 1pt theo tỉ lệ màn hình (biến CSS --pw = bề rộng trang tính bằng px),
 * nên mọi thứ bên trong dùng đơn vị em là tự co giãn.
 *
 * mode: "read" (flipbook — link, video chạy được) | "edit" (editor — chỉ hiển thị)
 * renderEl(el, node): editor bọc thêm vùng chọn quanh từng phần tử
 * side: "left" | "right" — mẫu nền (page.paper) đặt họa tiết ở mép ngoài trang
 * el.anim = { kind: "fade" | "grow", delay, dur } (giây): mỗi lần trang được lật tới, phần tử chạy hiệu ứng
 * xuất hiện (chỉ ở chế độ đọc; editor và ảnh thu nhỏ luôn hiện đủ)
 */
function CanvasPage({ page, mode = 'read', renderEl, visible, side = 'right' }) {
  const paper = paperOf(page.paper)
  const animated = mode === 'read' && (page.elements || []).some((el) => el.anim)
  // run tăng mỗi lần trang hiện ra → phần tử có hiệu ứng được dựng lại để chạy lại từ đầu
  const [run, setRun] = useState(0)
  useEffect(() => {
    if (animated && visible) setRun((r) => r + 1)
  }, [animated, visible])
  const animCls = animated ? (run ? ' is-play' : ' is-wait') : ''
  const lang = useCanvasLang()
  const zoom = useMemo(
    () =>
      mode === 'read' ? (page.elements || []).filter(zoomable).map((el) => ({ id: el.id, src: el.src, alt: el.alt, caption: captionOf(el, lang) })) : null,
    [page.elements, mode, lang]
  )
  return (
    <ZoomList.Provider value={zoom}>
      <div className={`cv-page is-${side}${animCls}`} style={{ background: page.bg || '#ffffff' }}>
        {paper && (
          <div className="cv-paper" aria-hidden="true">
            <img className="cv-paper__base" src={asset(PAPER_BASE)} alt="" draggable="false" />
            {paper.layers.map((l) => (
              <img key={l.at} className={`cv-paper__deco is-${l.at}`} src={asset(l.src)} alt="" draggable="false" />
            ))}
          </div>
        )}
        {page.bgImage && <img className="cv-page__bg" src={asset(page.bgImage)} alt="" draggable="false" />}
        {(page.elements || []).map((el) => {
          const node = <Element key={animated && el.anim ? `${el.id}:${run}` : el.id} el={el} mode={mode} visible={visible} />
          return renderEl ? renderEl(el, node) : node
        })}
      </div>
    </ZoomList.Provider>
  )
}

export default memo(CanvasPage)

export function boxStyle(el) {
  return {
    left: `${el.x}em`,
    top: `${el.y}em`,
    width: `${el.w}em`,
    height: `${el.h}em`,
    transform: el.rot ? `rotate(${el.rot}deg)` : undefined,
    opacity: el.opacity ?? undefined,
  }
}

export function Element({ el, mode, visible }) {
  const anim =
    el.anim && mode === 'read'
      ? {
          '--anim-delay': `${el.anim.delay ?? 0}s`,
          '--anim-dur': `${el.anim.dur ?? 0.6}s`,
        }
      : null
  return (
    <div
      className={`cv-el cv-el--${el.type}`}
      data-id={el.id}
      data-anim={anim ? el.anim.kind : undefined}
      style={anim ? { ...boxStyle(el), ...anim } : boxStyle(el)}
    >
      <ElementBody el={el} mode={mode} visible={visible} />
    </div>
  )
}

function ElementBody({ el, mode, visible }) {
  switch (el.type) {
    case 'text':
      return <TextBody el={el} mode={mode} />
    case 'shape':
      return (
        <PageLink el={el} mode={mode} className="cv-link--row">
          <ShapeBody el={el} />
        </PageLink>
      )
    case 'line':
      return <LineBody el={el} />
    case 'image':
      return el.src ? <ImageBody el={el} /> : <PhotoPlaceholder el={el} />
    case 'video':
      return <VideoBody el={el} mode={mode} visible={visible} />
    case 'widget':
      return (
        <Suspense fallback={null}>
          <Widget el={el} mode={mode} visible={visible} />
        </Suspense>
      )
    case 'group':
      return (
        <div
          className="cv-group"
          style={{
            width: `${el.bw}em`,
            height: `${el.bh}em`,
            transform: `scale(${el.w / el.bw}, ${el.h / el.bh})`,
          }}
        >
          {el.children.map((c, i) => (
            <Element key={c.id || i} el={c} mode={mode} visible={visible} />
          ))}
        </div>
      )
    default:
      return null
  }
}

export function textStyle(el, lang = 'vi') {
  const size = sizeOf(el, lang)
  return {
    fontFamily: fontStack(fontOf(el, lang)),
    fontWeight: el.weight || 400,
    fontStyle: el.italic ? 'italic' : 'normal',
    fontSize: `${size}em`,
    color: el.color,
    textAlign: el.align || 'left',
    lineHeight: el.lineHeight || 1.5,
    letterSpacing: el.tracking ? `${el.tracking / size}em` : undefined,
    writingMode: el.vertical ? 'vertical-rl' : undefined,
    '--para-gap': `${(el.paraGap || 0) / size}em`,
  }
}

function TextBody({ el, mode }) {
  const lang = useCanvasLang()
  const paras = String(textOf(el, lang)).split('\n')
  // editor đang xem tiếng Nhật mà khối này chưa dịch → hiện mờ bản tiếng Việt để biết còn thiếu
  const missing = mode === 'edit' && !hasLang(el, lang)
  const shown = missing ? 'vi' : lang
  const body = (
    <div className={`cv-text ${el.vertical ? 'is-vertical' : ''} ${missing ? 'is-missing' : ''}`} style={textStyle(el, shown)} lang={shown}>
      {paras.map((p, i) => (
        <p key={i}>{p ? <RubyText text={p} /> : '\u00a0'}</p>
      ))}
    </div>
  )
  if (isPageLink(el.link)) {
    return (
      <PageLink el={el} mode={mode}>
        {body}
      </PageLink>
    )
  }
  if (el.link && mode === 'read') {
    return (
      <a className="cv-link" href={el.link} target="_blank" rel="noreferrer">
        {body}
      </a>
    )
  }
  return body
}

const isPageLink = (link) => /^#p\d+$/.test(link || '')

/** link trong sách: "#p12" = lật tới trang 12 (số trang in trên sách) — dòng mục lục, dải công đoạn… */
function PageLink({ el, mode, className = '', children }) {
  const { goToPage } = useContext(MagazineContext)
  if (mode !== 'read' || !goToPage || !isPageLink(el.link)) return children
  return (
    <a
      className={`cv-link cv-link--page ${className}`}
      href={el.link}
      aria-label={el.alt || undefined}
      onClick={(e) => {
        e.preventDefault()
        goToPage(Number(el.link.slice(2)) - 1)
      }}
    >
      {children}
    </a>
  )
}

/** ảnh; ở chế độ đọc bấm vào thì mở lightbox (khung phóng to) */
function ImageBody({ el }) {
  const list = useContext(ZoomList)
  const { openLightbox } = useContext(MagazineContext)
  const img = <img className="cv-img" src={asset(el.src)} alt={el.alt || ''} draggable="false" style={{ objectFit: el.fit || 'cover' }} />
  const i = list ? list.findIndex((z) => z.id === el.id) : -1
  if (i < 0 || !openLightbox) return img
  return (
    <button type="button" className="cv-zoom" onClick={() => openLightbox(list, i)} aria-label={list[i].caption || t('zoomImage')} title={t('zoomImage')}>
      {img}
    </button>
  )
}

/** Khung ảnh tạm: ghi rõ cần ảnh gì (el.hint / el.hintJa) để nhóm kéo ảnh thật vào thay */
function PhotoPlaceholder({ el }) {
  const lang = useCanvasLang()
  const hint = (lang === 'ja' && el.hintJa) || el.hint
  return (
    <div className="cv-placeholder cv-placeholder--photo">
      <svg className="cv-placeholder__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <circle cx="12" cy="12.5" r="3.4" />
        <path d="M8.5 6l1.4-2h4.2l1.4 2" />
      </svg>
      {hint ? <span className="cv-placeholder__hint">{lang === 'ja' && el.hintJa ? <RubyText text={hint} /> : hint}</span> : <span className="cv-placeholder__hint">画像</span>}
    </div>
  )
}

/** {漢字|かんじ} → chữ có phiên âm; cách đọc chỉ hiện khi rê chuột / chạm (canvas.css) */
function RubyText({ text }) {
  const parts = parseRuby(text)
  if (parts.length === 1 && typeof parts[0] === 'string') return text
  return parts.map((p, i) =>
    typeof p === 'string' ? (
      p
    ) : (
      <ruby key={i} tabIndex={0} data-rt={p.ruby}>
        {p.base}
        <rp>(</rp>
        <rt>{p.ruby}</rt>
        <rp>)</rp>
      </ruby>
    )
  )
}

function ShapeBody({ el }) {
  const { w, h } = el
  const sw = el.stroke ? el.strokeWidth || 1 : 0
  const common = {
    fill: el.fill || 'none',
    stroke: el.stroke || 'none',
    strokeWidth: sw,
  }
  let shape
  if (el.shape === 'ellipse') shape = <ellipse cx={w / 2} cy={h / 2} rx={w / 2} ry={h / 2} {...common} />
  else if (el.shape === 'triangle') shape = <polygon points={`0,${h} ${w / 2},0 ${w},${h}`} {...common} />
  else shape = <rect x="0" y="0" width={w} height={h} rx={el.radius || 0} {...common} />
  return (
    <svg className="cv-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      {shape}
    </svg>
  )
}

function LineBody({ el }) {
  const { w, h } = el
  return (
    <svg className="cv-svg" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <line x1={el.x1 * w} y1={el.y1 * h} x2={el.x2 * w} y2={el.y2 * h} stroke={el.stroke} strokeWidth={el.strokeWidth || 1} />
    </svg>
  )
}

/** chưa có ảnh bìa → để trình duyệt hiện một khung hình đầu video (#t=…) thay cho khung đen */
const firstFrame = (src) => (src.startsWith('data:') ? src : `${src}#t=0.5`)

function VideoBody({ el, mode, visible }) {
  if (mode !== 'read' || !el.src) {
    // editor: chỉ hiển thị (bấm/kéo để chọn); xem video bằng nhấp đúp hoặc nút "Xem video"
    return (
      <div className="cv-video-ph">
        {el.poster ? (
          <img src={asset(el.poster)} alt="" draggable="false" />
        ) : (
          el.src && <video src={firstFrame(asset(el.src))} preload="metadata" muted playsInline tabIndex={-1} />
        )}
        <span className="cv-video-ph__icon" aria-hidden="true" />
      </div>
    )
  }
  return (
    <video
      className="cv-video"
      src={el.poster ? asset(el.src) : firstFrame(asset(el.src))}
      poster={el.poster ? asset(el.poster) : undefined}
      preload={el.poster ? 'none' : 'metadata'}
      playsInline
      controls
      ref={(v) => {
        if (v && !visible) v.pause()
      }}
    />
  )
}

const STACKS = {
  'Noto Sans JP': "'Noto Sans JP', 'Hiragino Kaku Gothic ProN', sans-serif",
  'Noto Serif JP': "'Noto Serif JP', 'Hiragino Mincho ProN', serif",
  'Playfair Display': "'Playfair Display', 'Noto Serif JP', serif",
  'Be Vietnam Pro': "'Be Vietnam Pro', 'Noto Sans JP', sans-serif",
}

export function fontStack(name) {
  return STACKS[name] || `'${name}', 'Noto Sans JP', sans-serif`
}

/** Độ sáng của màu nền (0–255) — để chọn màu số trang */
export function luminance(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || '')
  if (!m) return 255
  const n = parseInt(m[1], 16)
  return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)
}

export { PAGE_W, PAGE_H }
