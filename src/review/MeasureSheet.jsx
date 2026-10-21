import { useEffect, useMemo, useState } from 'react'
import { RubyText, textStyle } from '../canvas/CanvasPage.jsx'
import { ensureFont, ensureFontsFor } from '../canvas/fonts.js'
import { fontOf } from '../canvas/lang.js'
import { measureKey } from '../../scripts/book/measureKey.mjs'
import '../canvas/canvas.css'

const SRC = `${import.meta.env.BASE_URL}scripts/book/out/book.json`
const PX = 4 // 1pt của trang = 4px khi đo (đo ở cỡ lớn cho chính xác)

/**
 * Trang đo chữ (chỉ chạy dev): ?measure=1
 * Dựng từng khối chữ của bản build mới nhất y như khi đọc sách (cùng textStyle, cùng cách hiện phiên âm),
 * ở cả tiếng Việt và tiếng Nhật, đo chiều cao tự nhiên rồi gửi về /__book-measure → scripts/book/out/measure.json.
 * build.mjs dùng số đo này thay cho phép ước lượng chiều cao chữ. Kết quả cũng nằm ở window.__measure.
 */
export default function MeasureSheet() {
  const [items, setItems] = useState(null)
  const [status, setStatus] = useState('Đang tải bản build…')

  useEffect(() => {
    fetch(SRC, { cache: 'no-store' })
      .then((r) => r.json())
      .then(({ pages }) => {
        ensureFontsFor(pages)
        const seen = new Set()
        const list = []
        for (const p of pages)
          for (const el of p.elements || []) {
            if (el.type !== 'text' || el.vertical || !el.w) continue
            const k = keyOf(el)
            if (seen.has(k)) continue
            seen.add(k)
            list.push({ el, k })
          }
        setItems(list)
      })
  }, [])

  const fonts = useMemo(() => (items ? [...new Set(items.flatMap(({ el }) => [el.font, fontOf(el, 'ja')]))] : []), [items])

  useEffect(() => {
    if (!items) return
    let stop = false
    fonts.forEach((f) => f && ensureFont(f))
    ;(async () => {
      // chờ đủ font (kể cả font Nhật tải từ Google Fonts) rồi mới đo
      await Promise.all(fonts.flatMap((f) => (f ? [400, 700].map((w) => document.fonts.load(`${w} 16px "${f}"`, 'Aあ漢ệ')) : [])))
      await document.fonts.ready
      await new Promise((r) => setTimeout(r, 300))
      if (stop) return
      const out = {}
      for (const { el, k } of items) {
        const v = heightOf(`m-${k}-vi`)
        const j = el.ja ? heightOf(`m-${k}-ja`) : 0
        out[k] = [v, j]
        // builder có chỗ ước lượng tiêu đề không kèm độ đậm / giãn chữ → lưu thêm khoá thường (không ghi đè số đo đúng kiểu)
        for (const alt of [{ weight: 400 }, { tracking: 0 }, { weight: 400, tracking: 0 }]) {
          const ak = keyOf({ ...el, ...alt })
          if (!out[ak]) out[ak] = [v, j]
        }
      }
      window.__measure = out
      const res = await fetch('/__book-measure', { method: 'POST', body: JSON.stringify(out) })
      const info = await res.json().catch(() => ({}))
      setStatus(`Đã đo ${items.length} khối chữ, ghi ${info.added ?? '?'} khoá (tổng ${info.total ?? '?'})`)
      window.__measureDone = true
    })()
    return () => (stop = true)
  }, [items, fonts])

  if (!items) return <p style={{ padding: 24 }}>{status}</p>
  return (
    <main style={{ position: 'relative', padding: 24, background: '#fff', minHeight: '100vh' }}>
      <p id="measure-status" style={{ font: '14px sans-serif' }}>
        {status}
      </p>
      <div style={{ position: 'absolute', left: 0, top: 60, fontSize: `${PX}px`, visibility: 'hidden' }}>
        {items.map(({ el, k }) => (
          <div key={k}>
            <Block id={`m-${k}-vi`} el={el} lang="vi" />
            {el.ja && <Block id={`m-${k}-ja`} el={el} lang="ja" />}
          </div>
        ))}
      </div>
    </main>
  )
}

const keyOf = (el) =>
  measureKey({ text: el.text, ja: el.ja, w: el.w, size: el.size, jaSize: el.jaSize, lh: el.lineHeight || 1.5, paraGap: el.paraGap || 0, font: el.font, weight: el.weight || 400, tracking: el.tracking || 0 })

function Block({ id, el, lang }) {
  const text = lang === 'ja' ? el.ja : el.text
  return (
    <div id={id} style={{ width: `${el.w}em`, position: 'relative' }}>
      <div className="cv-text" style={{ ...textStyle(el, lang), height: 'auto' }} lang={lang}>
        {String(text ?? '')
          .split('\n')
          .map((p, i) => (
            <p key={i}>{p ? <RubyText text={p} /> : ' '}</p>
          ))}
      </div>
    </div>
  )
}

function heightOf(id) {
  const node = document.getElementById(id)?.firstChild
  if (!node) return 0
  return Math.round((node.getBoundingClientRect().height / PX) * 10) / 10
}
