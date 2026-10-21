import { useEffect, useMemo, useState } from 'react'
import CanvasPage, { PAGE_W, PAGE_H } from '../canvas/CanvasPage.jsx'
import { CanvasLang } from '../canvas/lang.js'
import { MagazineContext } from '../lib/context.js'
import { ensureFontsFor } from '../canvas/fonts.js'
import { measurePage, spreadIssues } from './measure.js'
import { setLang } from '../lib/i18n.js'
import '../canvas/canvas.css'
import './review.css'

const QS = new URLSearchParams(location.search)
const PW = Number(QS.get('pw')) || 520 // bề rộng một trang trên trang soát (px); ?pw=440&cols=2 để xem 2 pair mỗi hàng
// ?file=book-review.json → soát một bản chụp cố định (agent soát trong khi bản build chính vẫn đang được sửa)
const SRC = `${import.meta.env.BASE_URL}scripts/book/out/${new URLSearchParams(location.search).get('file') || 'book.json'}`
const CTX = { openLightbox: null, reducedMotion: true, onPageAudioPlay: null, goToPage: null }

/**
 * Trang soát (chỉ chạy dev): ?review=1&lang=vi|ja
 * Xếp mọi cặp trang (pair) của bản build mới nhất theo chiều dọc, đo thật trên trình duyệt từng trang
 * (độ phủ nội dung, dải trống, chữ tràn khung, chữ đè, đoạn văn bị cắt sang trang) và ghi lỗi ngay dưới mỗi pair.
 * Kết quả đo cũng nằm ở window.__review để agent review / script đọc.
 */
export default function ReviewSheet({ lang }) {
  // nhãn giao diện (nút "Đọc thêm"…) theo đúng ngôn ngữ đang soát, như trang đọc thật — đặt trước khi vẽ trang
  setLang(lang)
  const [pages, setPages] = useState(null)
  const [report, setReport] = useState(null)
  useEffect(() => {
    document.title = `Soát sách · ${lang.toUpperCase()}`
  }, [lang])
  useEffect(() => {
    fetch(SRC, { cache: 'no-store' })
      .then((r) => r.json())
      .then(({ pages }) => {
        ensureFontsFor(pages)
        setPages(pages)
      })
  }, [])
  // pair: bìa đứng một mình, sau đó (2,3), (4,5)… — trang chẵn bên trái
  const pairs = useMemo(() => {
    if (!pages) return []
    const out = [[null, 1]]
    for (let n = 2; n <= pages.length; n += 2) out.push([n, n + 1 <= pages.length ? n + 1 : null])
    return out
  }, [pages])

  useEffect(() => {
    if (!pages) return
    let stop = false
    // chờ font + ảnh tải xong rồi mới đo
    const imgs = [...document.querySelectorAll('.rv img')]
    Promise.all([document.fonts.ready, ...imgs.map((i) => (i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))))]).then(() => {
      if (stop) return
      const byPage = {}
      document.querySelectorAll('.rv-page[data-n]').forEach((node) => (byPage[node.dataset.n] = measurePage(node.querySelector('.cv-page'), PAGE_W, PAGE_H)))
      const list = pairs.map(([l, r]) => ({ pair: [l, r].filter(Boolean).join('–'), left: l && byPage[l], right: r && byPage[r], issues: spreadIssues(l && byPage[l], r && byPage[r]) }))
      window.__review = { lang, pages: pages.length, pairs: list }
      setReport(list)
    })
    return () => (stop = true)
  }, [pages, pairs, lang])

  if (!pages) return <p className="rv-msg">Đang tải scripts/book/out/book.json…</p>
  const bad = report?.filter((p) => p.issues.length).length
  return (
    <CanvasLang.Provider value={lang}>
      <MagazineContext.Provider value={CTX}>
        <main className="rv" style={{ '--pw': PW, gridTemplateColumns: `repeat(${Number(QS.get('cols')) || 1}, auto)` }}>
          <header className="rv-head" style={{ gridColumn: '1 / -1' }}>
            <b>Soát từng pair · {lang.toUpperCase()}</b> · {pages.length} trang · {report ? `${bad}/${report.length} pair có lỗi` : 'đang đo…'}
          </header>
          {pairs.map(([l, r], i) => (
            <section key={i} className="rv-pair" id={`pair-${l ?? r}`} data-pair={[l, r].filter(Boolean).join('-')}>
              <div className="rv-spread">
                <Slot n={l} pages={pages} side="left" />
                <Slot n={r} pages={pages} side="right" />
              </div>
              {report && <Issues items={report[i].issues} />}
            </section>
          ))}
        </main>
      </MagazineContext.Provider>
    </CanvasLang.Provider>
  )
}

function Slot({ n, pages, side }) {
  if (!n) return <div className="rv-page is-empty" />
  return (
    <div className="rv-page" data-n={n} style={{ height: (PW * PAGE_H) / PAGE_W }}>
      <CanvasPage page={pages[n - 1]} mode="read" visible={false} side={side} />
      <span className="rv-no">{n}</span>
    </div>
  )
}

function Issues({ items }) {
  if (!items.length) return <p className="rv-ok">Không thấy lỗi đo được</p>
  return (
    <ul className="rv-issues">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  )
}
