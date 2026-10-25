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
    seal: ['LÀNG', 'CHUÔNG'],
    file: 'buu-thiep-lang-chuong.jpg',
  },
  ja: {
    photo: '写真をえらぶ',
    verse: 'カーザオをえらぶ',
    save: '絵はがきを保存',
    size: 'JPG画像 1200 × 1650',
    stamp: 'ベトナム',
    foot: 'チュオン村のノンラー・ハノイ',
    by: '― ベトナムの民謡（カーザオ）―',
    seal: ['チュオン', '村'],
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
  const box = { x: 70, y: 70, w: w - 140, h: 1110 }
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
  stamp.width = 210
  stamp.height = 250
  const sg = stamp.getContext('2d')
  sg.fillStyle = '#fbf7ee'
  sg.fillRect(0, 0, 210, 250)
  sg.globalCompositeOperation = 'destination-out'
  const hole = (x, y) => {
    sg.beginPath()
    sg.arc(x, y, 6, 0, Math.PI * 2)
    sg.fill()
  }
  for (let x = 0; x <= 210; x += 17.5) [0, 250].forEach((y) => hole(x, y))
  for (let y = 0; y <= 250; y += 17.86) [0, 210].forEach((x) => hole(x, y))
  sg.globalCompositeOperation = 'source-over'
  sg.fillStyle = '#f1e3c4'
  sg.fillRect(20, 20, 170, 210)
  sg.strokeStyle = '#a8382b'
  sg.lineWidth = 2
  sg.strokeRect(20, 20, 170, 210)
  if (hat) sg.drawImage(hat, 28, 82, 154, 90)
  sg.fillStyle = '#a8382b'
  sg.textAlign = 'center'
  sg.font = lang === 'ja' ? '500 22px "Noto Sans JP"' : '600 20px "Be Vietnam Pro"'
  sg.fillText(t.stamp, 105, 58)
  sg.font = '700 24px "Playfair Display"'
  sg.fillText('2026', 105, 212)
  g.save()
  g.translate(w - 190, 150)
  g.rotate(0.05)
  g.shadowColor = 'rgba(30, 15, 5, 0.35)'
  g.shadowBlur = 14
  g.shadowOffsetY = 4
  g.drawImage(stamp, -105, -125)
  g.restore()

  // câu ca dao (lục bát: câu lục thụt vào, câu bát sát lề; chữ Nhật không nghiêng)
  const lines = plainText(verse[lang === 'ja' ? 1 : 0] ?? verse[0]).split('\n')
  g.fillStyle = '#4e3426'
  g.textAlign = 'left'
  g.font = FONTS[lang][0]
  const vx = 120
  const lh = lang === 'ja' ? 64 : 74
  lines.forEach((ln, i) => {
    const indent = lang !== 'ja' && i % 2 === 0 && lines.length > 1 ? 60 : 0
    let size = lang === 'ja' ? 40 : 56
    g.font = FONTS[lang][0].replace(/\d+px/, `${size}px`)
    while (g.measureText(ln).width > w - 2 * vx - indent - 150 && size > 28) {
      size -= 2
      g.font = FONTS[lang][0].replace(/\d+px/, `${size}px`)
    }
    g.fillText(ln, vx + indent, 1268 + i * lh)
  })
  g.font = lang === 'ja' ? '500 20px "Noto Sans JP"' : 'italic 26px "Cormorant Garamond", serif'
  g.fillStyle = '#a07a3c'
  g.fillText(t.by, vx + (lang === 'ja' ? 0 : 60), 1268 + lines.length * lh + 2)

  // chân thiếp + con dấu son
  g.font = FONTS[lang][1]
  g.fillStyle = '#8b7355'
  if (g.letterSpacing !== undefined) g.letterSpacing = lang === 'ja' ? '2px' : '5px'
  g.fillText(t.foot, vx, h - 78)
  if (g.letterSpacing !== undefined) g.letterSpacing = '0px'
  const s = 124
  const sx = w - 70 - s
  const sy = h - 70 - s
  g.fillStyle = '#a8382b'
  g.fillRect(sx, sy, s, s)
  g.strokeStyle = '#f6e9d6'
  g.lineWidth = 2
  g.strokeRect(sx + 8, sy + 8, s - 16, s - 16)
  g.fillStyle = '#f6e9d6'
  g.textAlign = 'center'
  // chữ dấu co lại cho vừa lòng dấu
  let fs = 24
  const sealFont = () => FONTS[lang][2].replace(/\d+px/, `${fs}px`)
  g.font = sealFont()
  while (Math.max(...t.seal.map((x) => g.measureText(x).width)) > s - 30 && fs > 14) {
    fs -= 1
    g.font = sealFont()
  }
  g.fillText(t.seal[0], sx + s / 2, sy + s / 2 - 6)
  g.fillText(t.seal[1], sx + s / 2, sy + s / 2 + fs + 2)
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
        <div className="cvw-pc__verses">
          {verses.map((v, i) => (
            <button key={i} type="button" className={`cvw-pc__verse ${i === vi ? 'is-on' : ''}`} onClick={() => setVi(i)} disabled={!interactive} aria-pressed={i === vi}>
              {plainText(v[li] ?? v[0]).split('\n')[0]}…
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
