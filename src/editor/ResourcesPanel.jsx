import { useEffect, useState } from 'react'
import manifest from 'virtual:asset-manifest'
import { asset } from '../lib/assets.js'
import { makeZip } from '../lib/zip.js'
import { PAPERS, PAPER_BASE } from '../canvas/papers.js'
import { villageSvg, VILLAGE_SIZE } from '../components/Scene/VillageBackdrop.jsx'
import { DECO_GROUPS } from './LibraryPanels.jsx'

/**
 * Tab "Tài nguyên" của trang Biên tập (nhóm, họp 15/11: "trong trang edit admin thì có thêm tab tài nguyên, ở đó sẽ chứa
 * các cái như ảnh nền, tất cả các họa tiết…" — để nhóm dựng bản Canva và trình bày khi bảo vệ đồ án).
 * Tải về: ảnh sảnh lúc mới vào (cổng đình, giếng nước…), các nền giấy (đã ghép họa tiết, khổ A4 300 dpi, trang phải / trái),
 * mọi hình vẽ nét mảnh (SVG gốc để sửa, hoặc PNG nền trong suốt), hình dùng cho hiệu ứng. Tải lẻ từng cái hoặc cả gói .zip.
 */

const A4 = [595.28, 841.89] // pt — 1em của trang = 1pt
const PAGE_PX = 2480 // A4 ở 300 dpi
const PNG_W = 1600 // hình vẽ xuất PNG rộng 1600px

const NAMES = Object.fromEntries(DECO_GROUPS.flatMap(([, items]) => items.map(([p, label]) => [p, label])))
const EXTRA_NAMES = {
  'deco/bamboo.svg': 'Bụi tre',
  'deco/cloud.svg': 'Mây',
  'deco/dong-son.svg': 'Hoa văn trống đồng',
  'deco/lotus-pond.svg': 'Đầm sen',
  'deco/lotus.svg': 'Hoa sen',
  'deco/shade.svg': 'Bóng râm',
  'deco/still-non.svg': 'Nón (tĩnh vật)',
  'deco/toc-leaf.svg': 'Lá (mục lục)',
  'deco/toc-non.svg': 'Nón (mục lục)',
  'deco/vong-non-gold.svg': '16 vòng nón (vàng)',
  'journey/choi-w.svg': 'Chổi quét dầu (trắng)',
  'journey/left.svg': 'Đường hành trình (trái)',
  'journey/right.svg': 'Đường hành trình (phải)',
  'paper/tre.svg': 'Lá tre góc trang',
  'paper/khung.svg': 'Khung viền trang',
}
const FX_NAMES = {
  'fx/bong-tre.webp': 'Bóng nắng qua tre',
  'fx/lop-outer.webp': 'Lớp lá ngoài (mô hình 3 lớp)',
  'fx/lop-mo.webp': 'Lớp mo nang (mô hình 3 lớp)',
  'fx/lop-inner.webp': 'Lớp lá trong (mô hình 3 lớp)',
  'fx/lop-stack-outer.webp': 'Lớp ngoài, xếp chồng',
  'fx/lop-stack-mo.webp': 'Lớp mo, xếp chồng',
  'fx/lop-stack-inner.webp': 'Lớp trong, xếp chồng',
  'fx/mo-chuong-3.webp': 'Ảnh mở phần 3',
  'map/route-street.webp': 'Bản đồ đường phố (tuyến xe)',
}

const BOOK = 'assets/book/'
const inBook = (dir, ext) =>
  manifest
    .map((p) => p.replace(/^\.?\//, ''))
    .filter((p) => p.startsWith(BOOK + dir) && p.endsWith(ext))
    .map((p) => p.slice(BOOK.length))
    .sort()

/** mọi hình vẽ SVG: theo nhóm của bảng Thành phần, rồi các hình còn lại */
function motifGroups() {
  const all = [...inBook('deco/', '.svg'), ...inBook('journey/', '.svg'), ...inBook('paper/', '.svg')]
  const grouped = new Set(DECO_GROUPS.flatMap(([, items]) => items.map(([p]) => p)))
  const groups = DECO_GROUPS.map(([g, items]) => [g, items.map(([p]) => p).filter((p) => p.endsWith('.svg') && all.includes(p))]).filter(([, items]) => items.length)
  const rest = all.filter((p) => !grouped.has(p))
  if (rest.length) groups.push(['Họa tiết khác', rest])
  return groups
}
const fileName = (p) => p.split('/').pop()
const label = (p) => NAMES[p] || EXTRA_NAMES[p] || FX_NAMES[p] || fileName(p)

function save(blob, name) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}

const loadImg = (src) =>
  new Promise((ok, bad) => {
    const im = new Image()
    im.onload = () => ok(im)
    im.onerror = () => bad(new Error(`Không tải được ${src}`))
    im.src = src
  })

/** SVG (chữ) → ảnh có kích thước cố định (SVG chỉ có viewBox thì trình duyệt không biết cỡ thật để vẽ nét) */
async function svgImage(text, w) {
  const vb = text.match(/viewBox="([\d.\-\s,]+)"/)?.[1].split(/[\s,]+/).map(Number)
  const ratio = vb ? vb[2] / vb[3] : 1
  const h = Math.round(w / ratio)
  const sized = text.replace(/<svg\b([^>]*)>/, (m, attrs) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, '')} width="${w}" height="${h}">`)
  const url = URL.createObjectURL(new Blob([sized], { type: 'image/svg+xml' }))
  try {
    return { img: await loadImg(url), w, h }
  } finally {
    URL.revokeObjectURL(url)
  }
}

const getText = async (p) => (await fetch(asset(BOOK + p))).text()
const getBytes = async (p) => new Uint8Array(await (await fetch(asset(BOOK + p))).arrayBuffer())
const canvasBlob = (cv) => new Promise((ok) => cv.toBlob(ok, 'image/png'))
const blobBytes = async (b) => new Uint8Array(await b.arrayBuffer())

export async function svgToPng(p, w = PNG_W) {
  const { img, h } = await svgImage(await getText(p), w)
  const cv = Object.assign(document.createElement('canvas'), { width: w, height: h })
  cv.getContext('2d').drawImage(img, 0, 0, w, h)
  return canvasBlob(cv)
}

async function villagePng(scale = 2) {
  const [vw, vh] = VILLAGE_SIZE
  const { img } = await svgImage(villageSvg(), vw * scale)
  const cv = Object.assign(document.createElement('canvas'), { width: vw * scale, height: vh * scale })
  cv.getContext('2d').drawImage(img, 0, 0, vw * scale, vh * scale)
  return canvasBlob(cv)
}

/**
 * nền giấy ghép sẵn họa tiết, đúng vị trí như trong sách (canvas.css .cv-paper__deco.is-…), khổ A4.
 * side 'right' | 'left' (trang trái: họa tiết sang mép trái, lật đối xứng — trừ hình in mờ giữa trang và khung)
 */
export async function paperPng(paper, side = 'right', W = PAGE_PX) {
  const k = W / A4[0]
  const H = Math.round(A4[1] * k)
  const cv = Object.assign(document.createElement('canvas'), { width: W, height: H })
  const ctx = cv.getContext('2d')
  const base = await loadImg(asset(PAPER_BASE))
  const s = Math.max(W / base.naturalWidth, H / base.naturalHeight) // object-fit: cover
  ctx.drawImage(base, (W - base.naturalWidth * s) / 2, (H - base.naturalHeight * s) / 2, base.naturalWidth * s, base.naturalHeight * s)
  for (const layer of paper.layers) {
    const p = layer.src.replace(BOOK, '')
    const text = await getText(p)
    const POS = {
      top: { w: 150, op: 0.42, x: (w) => A4[0] + 26 - w, y: () => -20 },
      watermark: { w: 330, op: 0.12, x: (w) => (A4[0] - w) / 2, y: (h) => A4[1] - 70 - h, still: true },
      foot: { w: 120, op: 0.4, x: (w) => A4[0] - 38 - w, y: (h) => A4[1] - 52 - h },
      'foot-leaf': { w: 130, op: 0.32, x: (w) => A4[0] + 14 - w, y: (h) => A4[1] - 28 - h },
      frame: { w: A4[0], op: 1, x: () => 0, y: () => 0, still: true, full: true },
    }[layer.at]
    if (!POS) continue
    const { img, h: hPx } = await svgImage(text, Math.round(POS.w * k))
    const wPt = POS.w
    const hPt = POS.full ? A4[1] : hPx / k
    let x = POS.x(wPt)
    const y = POS.y(hPt)
    ctx.save()
    ctx.globalAlpha = POS.op
    if (side === 'left' && !POS.still) {
      x = A4[0] - x - wPt // sang mép trái
      ctx.translate((x + wPt) * k, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(img, 0, y * k, wPt * k, hPt * k)
    } else {
      ctx.drawImage(img, x * k, y * k, wPt * k, hPt * k)
    }
    ctx.restore()
  }
  return canvasBlob(cv)
}

function useObjectUrl(make, deps) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    let alive = true
    let u = null
    make()
      .then((b) => {
        if (!alive) return
        u = URL.createObjectURL(b)
        setUrl(u)
      })
      .catch(() => {})
    return () => {
      alive = false
      if (u) URL.revokeObjectURL(u)
    }
  }, deps)
  return url
}

function Item({ thumb, name, children }) {
  return (
    <div className="ed-res">
      <div className="ed-res__thumb">{thumb ? <img src={thumb} alt="" loading="lazy" draggable="false" /> : <span className="ed-muted">…</span>}</div>
      <div className="ed-res__name">{name}</div>
      <div className="ed-res__btns">{children}</div>
    </div>
  )
}

function Btn({ onClick, children }) {
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      className="ed-res__btn"
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await onClick()
        } catch (e) {
          alert(e.message || String(e))
        } finally {
          setBusy(false)
        }
      }}
    >
      {busy ? '…' : children}
    </button>
  )
}

function PaperItem({ paper }) {
  const thumb = useObjectUrl(() => paperPng(paper, 'right', 240), [paper.id])
  return (
    <Item thumb={thumb} name={paper.name}>
      <Btn onClick={async () => save(await paperPng(paper, 'right'), `nen-${paper.id}-trang-phai.png`)}>Trang phải</Btn>
      <Btn onClick={async () => save(await paperPng(paper, 'left'), `nen-${paper.id}-trang-trai.png`)}>Trang trái</Btn>
    </Item>
  )
}

export default function ResourcesPanel() {
  const [zipping, setZipping] = useState('')
  const village = useObjectUrl(() => villagePng(0.25), [])
  const groups = motifGroups()
  const fx = [...inBook('fx/', '.webp'), ...inBook('map/', '.webp')]

  const zipAll = async () => {
    const files = []
    const step = (s) => setZipping(s)
    try {
      step('Ảnh sảnh…')
      files.push({ name: 'anh-sanh/sanh-cong-dinh.svg', data: villageSvg() })
      files.push({ name: 'anh-sanh/sanh-cong-dinh.png', data: await blobBytes(await villagePng(2)) })
      for (const paper of PAPERS) {
        step(`Nền giấy: ${paper.name}…`)
        files.push({ name: `nen-giay/nen-${paper.id}-trang-phai.png`, data: await blobBytes(await paperPng(paper, 'right')) })
        files.push({ name: `nen-giay/nen-${paper.id}-trang-trai.png`, data: await blobBytes(await paperPng(paper, 'left')) })
      }
      files.push({ name: `nen-giay/giay-nga-goc.webp`, data: await getBytes(PAPER_BASE.replace(BOOK, '')) })
      for (const [g, items] of groups) {
        for (const p of items) {
          step(`Họa tiết: ${label(p)}…`)
          const base = `hoa-tiet/${g}/${label(p)}`
          files.push({ name: `${base}.svg`, data: await getText(p) })
          files.push({ name: `${base}.png`, data: await blobBytes(await svgToPng(p)) })
        }
      }
      for (const p of fx) {
        step(`Hình hiệu ứng: ${label(p)}…`)
        files.push({ name: `hinh-hieu-ung/${label(p)}.webp`, data: await getBytes(p) })
      }
      step('Đang gói…')
      save(makeZip(files), 'tai-nguyen-non-la-lang-chuong.zip')
    } catch (e) {
      alert(e.message || String(e))
    } finally {
      setZipping('')
    }
  }

  return (
    <>
      <h3 className="ed-panel__title">Tài nguyên</h3>
      <p className="ed-muted">
        Ảnh nền và hình vẽ sách đang dùng, để tải về dùng trong Canva. PNG nét cao (nền trong suốt với hình vẽ), SVG để phóng to không vỡ
        hoặc sửa màu.
      </p>
      <button type="button" className="ed-btn ed-btn--primary ed-res__all" disabled={!!zipping} onClick={zipAll}>
        {zipping || 'Tải tất cả (.zip)'}
      </button>

      <h4 className="ed-panel__sub">Ảnh sảnh lúc mới vào</h4>
      <div className="ed-res-grid is-wide">
        <Item thumb={village} name="Chiều sân đình Chuông: cổng đình, giếng nước, lũy tre, chồng nón (3200×1800)">
          <Btn onClick={async () => save(await villagePng(2), 'sanh-cong-dinh.png')}>PNG</Btn>
          <Btn onClick={async () => save(new Blob([villageSvg()], { type: 'image/svg+xml' }), 'sanh-cong-dinh.svg')}>SVG</Btn>
        </Item>
      </div>

      <h4 className="ed-panel__sub">Nền giấy (A4, 300 dpi)</h4>
      <div className="ed-res-grid">
        {PAPERS.map((p) => (
          <PaperItem key={p.id} paper={p} />
        ))}
      </div>

      {groups.map(([g, items]) => (
        <section key={g}>
          <h4 className="ed-panel__sub">Họa tiết: {g}</h4>
          <div className="ed-res-grid">
            {items.map((p) => (
              <Item key={p} thumb={asset(BOOK + p)} name={label(p)}>
                <Btn onClick={async () => save(await svgToPng(p), `${label(p)}.png`)}>PNG</Btn>
                <Btn onClick={async () => save(new Blob([await getText(p)], { type: 'image/svg+xml' }), fileName(p))}>SVG</Btn>
              </Item>
            ))}
          </div>
        </section>
      ))}

      <h4 className="ed-panel__sub">Hình dùng cho hiệu ứng</h4>
      <div className="ed-res-grid">
        {fx.map((p) => (
          <Item key={p} thumb={asset(BOOK + p)} name={label(p)}>
            <Btn onClick={async () => save(new Blob([await getBytes(p)], { type: 'image/webp' }), `${label(p)}.webp`)}>Tải</Btn>
          </Item>
        ))}
      </div>
    </>
  )
}
