import { useEffect, useRef, useState } from 'react'
import { useCanvasLang, plainText } from '../lang.js'
import { asset } from '../../lib/assets.js'

/**
 * Bưu thiếp Làng Chuông (trang cuối sách): người đọc chọn một ảnh + một câu ca dao, xem trước tấm bưu thiếp
 * rồi tải về (ảnh JPG) để gửi bạn bè. Xem trước và ảnh tải về vẽ chung một hàm → tải về đúng như đang thấy.
 * el.photos = [{ src, cap: [vi, ja], pos: [x, y] }], el.verses = [[vi, ja]] — sửa trong dữ liệu trang.
 */
const CARD = { w: 1200, h: 1650 }
const L = {
  vi: {
    photo: 'Chọn ảnh',
    verse: 'Chọn câu ca dao',
    save: 'Tải bưu thiếp',
    size: 'Ảnh JPG 1200 × 1650',
    stamp: 'VIỆT NAM',
    foot: 'NÓN LÁ LÀNG CHUÔNG · THANH OAI, HÀ NỘI',
    by: '— Ca dao —',
    // góp ý 04/11: đối tượng chính là NÓN LÁ Làng Chuông, không phải Làng Chuông
    seal: ['NÓN LÁ', 'LÀNG', 'CHUÔNG'],
    file: 'buu-thiep-lang-chuong.jpg',
  },
  ja: {
    photo: '画の選択',
    verse: 'カーザオの選択',
    save: '絵はがきを保存',
    size: 'JPG画像 1200 × 1650',
    stamp: 'ベトナム',
    foot: 'チュオン村のノンラー',
    by: '― カーザオ ―',
    seal: ['チュオン村', 'の', 'ノンラー'],
    file: 'chuong-village-postcard.jpg',
  },
}

const cache = new Map()
function loadImage(src) {
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((resolve) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = src
      })
    )
  }
  return cache.get(src)
}

const FONTS = { vi: ['56px "Dancing Script"', '600 26px "Be Vietnam Pro"', '700 26px "Playfair Display"'], ja: ['40px "Noto Serif JP"', '500 22px "Noto Sans JP"', '700 24px "Shippori Mincho"'] }

async function drawCard(canvas, { photo, verse, lang }) {
  const t = L[lang]
  await Promise.all([...FONTS[lang], 'italic 26px "Cormorant Garamond"'].map((f) => document.fonts?.load(f).catch(() => {})))
  const [img, hat] = await Promise.all([loadImage(photo.src), loadImage(asset('assets/book/deco/bia-non.svg'))])
  const g = canvas.getContext('2d')
  const { w, h } = CARD
  canvas.width = w
  canvas.height = h

  // giấy ngà + đường khâu
  const bg = g.createRadialGradient(w / 2, h * 0.45, 200, w / 2, h / 2, h * 0.75)
  bg.addColorStop(0, '#f8f2e6')
  bg.addColorStop(1, '#efe4cf')
  g.fillStyle = bg
  g.fillRect(0, 0, w, h)
  g.save()
  g.strokeStyle = 'rgba(160, 122, 60, 0.55)'
  g.lineWidth = 3
  g.setLineDash([12, 9])
  g.strokeRect(30, 30, w - 60, h - 60)
  g.restore()

  // ảnh (cắt theo khung, giữ tâm theo pos)
  // Doc "sửa thêm 2" (27/11): "bưu thiếp hơi mờ logo, chữ hơi bé (chị phải zoom 200% mới thấy)" → ảnh thấp lại một chút,
  // câu ca dao / chân thiếp / tem / con dấu son đều to và đậm hơn (thiếp hiện trên trang chỉ ~1/4 cỡ thật)
  const box = { x: 70, y: 70, w: w - 140, h: 990 }
  g.fillStyle = '#d9cdb4'
  g.fillRect(box.x, box.y, box.w, box.h)
  if (img) {
    const s = Math.max(box.w / img.naturalWidth, box.h / img.naturalHeight)
    const sw = box.w / s
    const sh = box.h / s
    const [px, py] = photo.pos || [50, 50]
    g.drawImage(img, ((img.naturalWidth - sw) * px) / 100, ((img.naturalHeight - sh) * py) / 100, sw, sh, box.x, box.y, box.w, box.h)
  }
  g.strokeStyle = 'rgba(42, 31, 23, 0.25)'
  g.lineWidth = 2
  g.strokeRect(box.x, box.y, box.w, box.h)

  // tem: giấy trắng răng cưa, hình nón nét vàng như bìa sách
  const stamp = document.createElement('canvas')
  stamp.width = 250
  stamp.height = 300
  const sg = stamp.getContext('2d')
  sg.fillStyle = '#fbf7ee'
  sg.fillRect(0, 0, 250, 300)
  sg.globalCompositeOperation = 'destination-out'
  const hole = (x, y) => {
    sg.beginPath()
    sg.arc(x, y, 6, 0, Math.PI * 2)
    sg.fill()
  }
  for (let x = 0; x <= 250; x += 17.86) [0, 300].forEach((y) => hole(x, y))
  for (let y = 0; y <= 300; y += 18.75) [0, 250].forEach((x) => hole(x, y))
  sg.globalCompositeOperation = 'source-over'
  sg.fillStyle = '#f1e3c4'
  sg.fillRect(20, 20, 210, 260)
  sg.strokeStyle = '#a8382b'
  sg.lineWidth = 3
  sg.strokeRect(20, 20, 210, 260)
  // hình nón nét vàng mảnh → vẽ hai lần (đậm hơn), to hơn
  if (hat) [0, 1].forEach(() => sg.drawImage(hat, 26, 92, 198, 116))
  sg.fillStyle = '#a8382b'
  sg.textAlign = 'center'
  // soát bằng mắt 28/11: chữ tem / ca dao / con dấu vẫn quá nhỏ khi thiếp hiện trên trang (~1/4 cỡ thật) → to thêm lần nữa
  sg.font = lang === 'ja' ? '700 46px "Noto Sans JP"' : '700 34px "Be Vietnam Pro"'
  sg.fillText(t.stamp, 125, lang === 'ja' ? 76 : 72)
  sg.font = '700 48px "Playfair Display"'
  sg.fillText('2026', 125, 266)
  g.save()
  g.translate(w - 200, 170)
  g.rotate(0.05)
  g.shadowColor = 'rgba(30, 15, 5, 0.35)'
  g.shadowBlur = 14
  g.shadowOffsetY = 4
  g.drawImage(stamp, -125, -150)
  g.restore()

  // câu ca dao (lục bát: câu lục thụt vào, câu bát sát lề; chữ Nhật không nghiêng)
  g.fillStyle = '#4e3426'
  g.textAlign = 'left'
  const vx = 76 // thẳng lề ảnh (70) → dòng ca dao dài nhất vẫn một dòng mà chữ to hơn
  const maxW = w - 2 * vx
  const fontAt = (z) => FONTS[lang][0].replace(/\d+px/, `${z}px`)
  // Zalo 28/11: "câu thơ không được xuống dòng như kia, mỗi câu 1 dòng" → không ngắt thêm sau "、", cả bài co một cỡ chữ
  // cho dòng dài nhất vừa khung
  const lines = plainText(verse[lang === 'ja' ? 1 : 0] ?? verse[0]).split('\n')
  const indentOf = (i) => (lang !== 'ja' && i % 2 === 0 && lines.length > 1 ? 60 : 0)
  let size = lang === 'ja' ? 54 : 64
  g.font = fontAt(size)
  while (lines.some((ln, i) => g.measureText(ln).width > maxW - indentOf(i)) && size > 24) g.font = fontAt((size -= 1))
  const lh = Math.round(size * (lang === 'ja' ? 1.5 : 1.3))
  lines.forEach((ln, i) => g.fillText(ln, vx + indentOf(i), 1150 + i * lh))
  g.font = lang === 'ja' ? '700 42px "Noto Sans JP"' : 'italic 46px "Cormorant Garamond", serif'
  g.fillStyle = '#6e4f24'
  g.fillText(t.by, vx + (lang === 'ja' ? 0 : 60), 1150 + lines.length * lh + 6)

  // chân thiếp + con dấu son
  const s = 240
  const sx = w - 70 - s
  const sy = h - 70 - s
  // dòng chân thiếp dừng trước con dấu (dấu to hơn từ 28/11 → bản Việt dài bị dấu che mất "HÀ NỘI"): co chữ cho vừa
  let fz = lang === 'ja' ? 40 : 34
  const footFont = () => (lang === 'ja' ? `700 ${fz}px "Noto Sans JP"` : `700 ${fz}px "Be Vietnam Pro"`)
  g.font = footFont()
  g.fillStyle = '#6b5236'
  if (g.letterSpacing !== undefined) g.letterSpacing = lang === 'ja' ? '2px' : '5px'
  const room = sx - vx - 30
  if (g.letterSpacing !== undefined && lang !== 'ja') for (let ls = 5; ls > 1 && g.measureText(t.foot).width > room; ) g.letterSpacing = `${--ls}px`
  while (g.measureText(t.foot).width > room && fz > 20) g.font = footFont((fz -= 1))
  g.fillText(t.foot, vx, h - 92)
  if (g.letterSpacing !== undefined) g.letterSpacing = '0px'
  g.fillStyle = '#a8382b'
  g.fillRect(sx, sy, s, s)
  g.strokeStyle = '#f6e9d6'
  g.lineWidth = 3
  g.strokeRect(sx + 10, sy + 10, s - 20, s - 20)
  g.fillStyle = '#f6e9d6'
  g.textAlign = 'center'
  // chữ dấu co lại cho vừa lòng dấu
  let fs = 60
  const sealFont = () => FONTS[lang][2].replace(/\d+px/, `${fs}px`)
  g.font = sealFont()
  while (Math.max(...t.seal.map((x) => g.measureText(x).width)) > s - 36 && fs > 20) {
    fs -= 1
    g.font = sealFont()
  }
  const n = t.seal.length
  const sealLh = fs + 8
  t.seal.forEach((x, i) => g.fillText(x, sx + s / 2, sy + s / 2 + fs / 2.8 + (i - (n - 1) / 2) * sealLh))
}

export default function PostcardWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const t = L[lang]
  const photos = el.photos || []
  const verses = el.verses || []
  const [pi, setPi] = useState(0)
  const [vi, setVi] = useState(0)
  const [busy, setBusy] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current || !photos[pi] || !verses[vi]) return
    drawCard(ref.current, { photo: photos[pi], verse: verses[vi], lang })
  }, [pi, vi, lang, photos, verses])

  const save = () => {
    const c = ref.current
    if (!c || busy) return
    setBusy(true)
    try {
      c.toBlob(
        (blob) => {
          setBusy(false)
          if (!blob) return
          const a = document.createElement('a')
          a.href = URL.createObjectURL(blob)
          a.download = t.file
          a.click()
          setTimeout(() => URL.revokeObjectURL(a.href), 4000)
        },
        'image/jpeg',
        0.92
      )
    } catch {
      setBusy(false) // ảnh không cho đọc lại (CORS) → không tải được, xem trước vẫn hiện
    }
  }

  return (
    <div className="cvw cvw-pc" data-no-flip={interactive ? '' : undefined}>
      <canvas ref={ref} className="cvw-pc__card" width={CARD.w} height={CARD.h} aria-label={plainText(verses[vi]?.[li] ?? '')} />
      <div className="cvw-pc__side">
        <p className="cvw-pc__label">{t.photo}</p>
        <div className="cvw-pc__thumbs">
          {photos.map((ph, i) => (
            <button
              key={i}
              type="button"
              className={`cvw-pc__thumb ${i === pi ? 'is-on' : ''}`}
              onClick={() => setPi(i)}
              disabled={!interactive}
              aria-pressed={i === pi}
              title={plainText(ph.cap?.[li] ?? '')}
            >
              <img src={ph.src} alt={plainText(ph.cap?.[li] ?? '')} style={{ objectPosition: `${(ph.pos || [50, 50])[0]}% ${(ph.pos || [50, 50])[1]}%` }} />
            </button>
          ))}
        </div>
        <p className="cvw-pc__label">{t.verse}</p>
        {/* Zalo 28/11: cột bên quá hẹp → câu ca dao trong nút bị ngắt giữa câu; thiếp to hơn, chọn câu bằng nút số, câu hiện trọn
            từng dòng trên thiếp */}
        <div className="cvw-pc__verses">
          {verses.map((v, i) => (
            <button
              key={i}
              type="button"
              className={`cvw-pc__verse ${i === vi ? 'is-on' : ''}`}
              onClick={() => setVi(i)}
              disabled={!interactive}
              aria-pressed={i === vi}
              aria-label={plainText(v[li] ?? v[0]).replace(/\n/g, ' ')}
              title={plainText(v[li] ?? v[0]).replace(/\n/g, ' / ')}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button type="button" className="cvw-pc__save" onClick={save} disabled={!interactive || busy}>
          {t.save}
        </button>
        <p className="cvw-pc__size">{t.size}</p>
      </div>
    </div>
  )
}
