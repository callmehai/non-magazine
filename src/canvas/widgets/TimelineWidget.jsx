import { useContext, useState } from 'react'
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
  const { goToPage } = useContext(MagazineContext)
  if (!items.length) return null
  const n = items.length
  // mốc đầu / cuối lùi vào 15%: nhãn tên rộng 150em canh giữa mốc không tràn mép trang (07/11: "タ・トゥ・フオン" sát mép)
  const at = (k) => (n === 1 ? 50 : 15 + (70 * k) / (n - 1))
  const go = (k) => interactive && setI(Math.max(0, Math.min(n - 1, k)))
  const it = items[i]
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
            <span className="cvw-tl__dot" />
            <span className="cvw-tl__who">
              {/* tên Nhật chỉ xuống dòng ở dấu ・ (không ngắt giữa "トゥ / イ") */}
              <Ruby text={String(x.short?.[li] ?? x.name[li]).replace(/・/g, '・\u200b')} />
            </span>
          </button>
        ))}
      </div>
      <div className="cvw-tl__card" key={i}>
        <img className="cvw-tl__art" src={asset('assets/book/deco/vong-non.svg')} alt="" />
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
            tabIndex={interactive ? 0 : -1}
          >
            {t.more(it.link)} →
          </button>
        )}
        {it.img ? (
          <figure className="cvw-tl__photo">
            <img src={it.img} alt={String(it.name[li] ?? '').replace(/\{([^|}]+)\|[^}]+\}/g, '$1')} loading="lazy" style={it.fit === 'contain' ? { objectFit: 'contain', background: '#fff' } : undefined} />
            {it.cap && (
              <figcaption>
                <Ruby text={it.cap[li] ?? it.cap[0]} />
              </figcaption>
            )}
          </figure>
        ) : (
          <img className="cvw-tl__still" src={asset('assets/book/deco/still-non.svg')} alt="" />
        )}
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
