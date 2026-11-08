import { useContext, useEffect, useState } from 'react'
import { useCanvasLang, parseRuby } from '../lang.js'
import { asset } from '../../lib/assets.js'
import { MagazineContext } from '../../lib/context.js'

/**
 * Dòng thời gian bấm được (trang nghệ nhân chương 3): thanh ngang có các mốc năm; bấm một mốc → vạch màu chạy tới mốc đó,
 * thẻ bên dưới hiện câu chuyện của người ấy (năm · vai trò · tên · tiểu sử). Nút ‹ › để đi lần lượt.
 * Dùng thay ảnh cho những nghệ nhân đã mất (góp ý của nhóm: không đưa ảnh người đã mất vào sách).
 * el.items = [{ year: [vi, ja], name: [vi, ja], role: [vi, ja], bio: [vi, ja], img?: url, cap?: [vi, ja] }], el.accent = màu chương.
 * Mốc có img (06/11: nhóm gửi ảnh ông Phạm Trần Canh): ảnh chân dung + chú thích thay hình nón vẽ ở chân thẻ.
 * Mốc có group: tên nhóm nghệ nhân ở đầu thẻ. Mốc có link (số trang in): nút "Đọc tiếp ở trang N" lật tới tiểu sử đầy đủ.
 */
const L = {
  vi: { hint: 'Bấm vào từng mốc năm để đọc', prev: 'Mốc trước', next: 'Mốc sau', more: (n) => `Đọc tiếp ở trang ${n}` },
  ja: { hint: '年をクリックすると物語が読めます', prev: '前へ', next: '次へ', more: (n) => `続きは${n}ページへ` },
}

function Ruby({ text }) {
  return parseRuby(String(text ?? '')).map((p, i) =>
    typeof p === 'string' ? (
      <span key={i}>{p}</span>
    ) : (
      <ruby key={i}>
        {p.base}
        <rt>{p.ruby}</rt>
      </ruby>
    )
  )
}

export default function TimelineWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const t = L[lang]
  const items = el.items || []
  const [i, setI] = useState(0)
  // 07/11 (anh Hải: "chuyển tab giật nhanh quá"): khung thẻ đứng yên, chỉ nội dung đổi — thẻ cũ mờ dần + trượt nhẹ ra,
  // thẻ mới mờ dần + trượt vào cùng lúc (trước: cả khung thẻ dựng lại, hiện từ trong suốt trong 0,5s → chớp)
  const [out, setOut] = useState(null) // { k: mốc vừa rời, dir: 1 tiến / -1 lùi }
  const [entering, setEntering] = useState(false) // thẻ mới đang mờ dần vào (giữ lớp is-in tới hết hiệu ứng)
  const [dir, setDir] = useState(1) // giữ hướng tới hết hiệu ứng vào (thẻ cũ xong trước thì hướng không đổi giữa chừng)
  const { goToPage } = useContext(MagazineContext)
  // tải trước ảnh các mốc: ảnh thẻ mới có sẵn khi mờ dần vào, không bật lên giữa chừng
  useEffect(() => {
    for (const x of items) if (x.img) new Image().src = x.img
  }, [items])
  if (!items.length) return null
  const n = items.length
  // mốc đầu / cuối lùi vào 15%: nhãn tên rộng 150em canh giữa mốc không tràn mép trang (07/11: "タ・トゥ・フオン" sát mép)
  const at = (k) => (n === 1 ? 50 : 15 + (70 * k) / (n - 1))
  const go = (k) => {
    if (!interactive) return
    const to = Math.max(0, Math.min(n - 1, k))
    if (to === i) return
    setOut({ k: i, dir: to > i ? 1 : -1 })
    setEntering(true)
    setDir(to > i ? 1 : -1)
    setI(to)
  }
  const body = (it, k, cls) => (
    <div
      className={`cvw-tl__body ${cls}`}
      key={cls === 'is-out' ? `out-${k}` : `cur-${k}`}
      aria-hidden={cls === 'is-out' ? true : undefined}
      onAnimationEnd={(e) => {
        if (e.target !== e.currentTarget) return
        if (cls === 'is-out') setOut(null)
        else setEntering(false)
      }}
    >
      {it.group && (
        <div className="cvw-tl__group">
          <Ruby text={it.group[li] ?? it.group[0]} />
        </div>
      )}
      <div className="cvw-tl__kicker">
        <span className="cvw-tl__big">{it.year[li] ?? it.year[0]}</span>
        <span className="cvw-tl__role">
          <Ruby text={it.role[li]} />
        </span>
      </div>
      <div className="cvw-tl__name">
        <Ruby text={it.name[li]} />
      </div>
      <div className="cvw-tl__bio">
        <Ruby text={it.bio[li]} />
      </div>
      {it.link && (
        <button
          type="button"
          className="cvw-tl__more"
          onClick={() => interactive && goToPage?.(it.link - 1)}
          tabIndex={interactive && cls !== 'is-out' ? 0 : -1}
        >
          {t.more(it.link)} →
        </button>
      )}
      {it.img ? (
        <figure className="cvw-tl__photo">
          <img src={it.img} alt={String(it.name[li] ?? '').replace(/\{([^|}]+)\|[^}]+\}/g, '$1')} style={it.fit === 'contain' ? { objectFit: 'contain', background: '#fff' } : undefined} />
          {it.cap && (
            <figcaption>
              <Ruby text={it.cap[li] ?? it.cap[0]} />
            </figcaption>
          )}
        </figure>
      ) : (
        <img className="cvw-tl__still" src={asset('assets/book/deco/still-non.svg')} alt="" />
      )}
    </div>
  )
  return (
    <div className={`cvw cvw-tl${lang === 'ja' ? ' is-ja' : ''}`} style={{ '--acc': el.accent || '#3f7676' }}>
      <div className="cvw-tl__hint">{t.hint}</div>
      <div className="cvw-tl__track">
        <div className="cvw-tl__line" />
        <div className="cvw-tl__fill" style={{ width: `${at(i)}%` }} />
        {items.map((x, k) => (
          <button
            key={k}
            type="button"
            className={`cvw-tl__node${k === i ? ' is-on' : ''}${k < i ? ' is-past' : ''}`}
            style={{ left: `${at(k)}%` }}
            onClick={() => go(k)}
            tabIndex={interactive ? 0 : -1}
            aria-pressed={k === i}
          >
            <span className="cvw-tl__year">{x.year[li] ?? x.year[0]}</span>
            {/* anh Hải 08/11 ("thanh này nhồi concept gì vào, đơn điệu"): mỗi mốc một chiếc nón — mốc chưa tới mới là khung
                nứa (các vòng), mốc đã qua đã lợp lá, mốc đang xem nón trắng có quai son: các thế hệ nối nhau làm nên chiếc nón */}
            <svg className="cvw-tl__dot" viewBox="0 0 36 24" aria-hidden="true">
              <path className="cvw-tl__leaf" d="M3 17 L18 7 L33 17 Q18 20.2 3 17 Z" />
              <g className="cvw-tl__rings">
                <path d="M7.6 14 Q18 15.8 28.4 14" />
                <path d="M11.6 11.3 Q18 12.5 24.4 11.3" />
                <path d="M15 9 Q18 9.6 21 9" />
                <path d="M18 7 L10 16.6 M18 7 L26 16.6" />
              </g>
              <path className="cvw-tl__cone" d="M3 17 L18 7 L33 17" />
              <ellipse className="cvw-tl__rim" cx="18" cy="17.4" rx="15.6" ry="2.3" />
              <path className="cvw-tl__quai" d="M9 18.6 Q18 24 27 18.6" />
              <circle className="cvw-tl__tip" cx="18" cy="6.6" r="1.3" />
            </svg>
            <span className="cvw-tl__who">
              {/* tên Nhật chỉ xuống dòng ở dấu ・ (không ngắt giữa "トゥ / イ") */}
              <Ruby text={String(x.short?.[li] ?? x.name[li]).replace(/・/g, '・\u200b')} />
            </span>
          </button>
        ))}
      </div>
      <div className="cvw-tl__card">
        <img className="cvw-tl__art" src={asset('assets/book/deco/vong-non.svg')} alt="" />
        <div className="cvw-tl__stage" style={{ '--dir': dir }}>
          {out && out.k !== i && body(items[out.k], out.k, 'is-out')}
          {body(items[i], i, entering ? 'is-in' : '')}
        </div>
        <div className="cvw-tl__nav">
          <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label={t.prev}>
            ‹
          </button>
          <span className="cvw-tl__count">
            {i + 1} / {n}
          </span>
          <button type="button" onClick={() => go(i + 1)} disabled={i === n - 1} aria-label={t.next}>
            ›
          </button>
        </div>
      </div>
    </div>
  )
}
