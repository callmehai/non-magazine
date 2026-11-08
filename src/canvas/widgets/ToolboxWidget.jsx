import { useContext, useState } from 'react'
import { useCanvasLang, plainText } from '../lang.js'
import { MagazineContext } from '../../lib/context.js'

/**
 * Hộp đồ nghề làm nón (mở mục 2.2 "Nguyên liệu và dụng cụ làm nón lá"; anh Hải 08/11: hiệu ứng mở hộp).
 * Đóng: nắp hộp gỗ có nhãn giấy; bấm → nắp nhấc lên, các món trong hộp lần lượt hiện ra (ảnh thật + tên như trong
 * sách). Bấm một món → ảnh to + tên + nút "Xem ở trang N" lật tới trang tả món đó. Chế độ không tương tác: hộp đóng.
 * el.items = [{ name: [vi, ja], src, group: 0 nguyên liệu | 1 dụng cụ, page }], el.title = [vi, ja], el.groups = [[vi, ja], [vi, ja]]
 */
const T = {
  vi: { open: 'Bấm để mở hộp', close: 'Đóng hộp', back: '‹ Về hộp', see: (n) => `Xem ở trang ${n} →`, pick: 'Bấm vào một món để xem kỹ' },
  ja: { open: 'クリックして箱を開ける', close: '箱を閉じる', back: '‹ 箱にもどる', see: (n) => `${n}ページで見る →`, pick: '道具をクリックすると詳しく見られます' },
}

export default function ToolboxWidget({ el, interactive }) {
  const lang = useCanvasLang() === 'ja' ? 'ja' : 'vi'
  const li = lang === 'ja' ? 1 : 0
  const t = T[lang]
  const [open, setOpen] = useState(false)
  const [cur, setCur] = useState(null)
  const { goToPage } = useContext(MagazineContext)
  const items = el.items || []
  const pick = (p) => plainText((p && (p[li] ?? p[0])) || '')
  const it = cur == null ? null : items[cur]
  return (
    <div className={`cvw cvw-box ${open ? 'is-open' : ''} ${lang === 'ja' ? 'is-ja' : ''}`} data-no-flip={interactive ? '' : undefined}>
      <div className="cvw-box__tray" aria-hidden={!open}>
        <ul className="cvw-box__grid">
          {items.map((x, k) => (
            <li key={k} style={{ '--k': k }}>
              <button type="button" className="cvw-box__item" onClick={() => setCur(k)} disabled={!interactive || !open} tabIndex={open ? 0 : -1}>
                <span className="cvw-box__ph">{x.src && <img src={x.src} alt="" loading="lazy" draggable="false" />}</span>
                <span className="cvw-box__nm">{pick(x.name)}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="cvw-box__foot">
          <span>{t.pick}</span>
          <button type="button" className="cvw-box__link" onClick={() => { setCur(null); setOpen(false) }} disabled={!interactive || !open} tabIndex={open ? 0 : -1}>
            {t.close}
          </button>
        </div>
        {it && (
          <div className="cvw-box__detail" role="dialog" aria-label={pick(it.name)}>
            <span className="cvw-box__big">{it.src && <img src={it.src} alt={pick(it.name)} draggable="false" />}</span>
            <span className="cvw-box__info">
              <span className="cvw-box__grp">{pick(el.groups?.[it.group])}</span>
              <span className="cvw-box__title">{pick(it.name)}</span>
              {/* anh Hải 08/11: "mở lại hộp / đến trang — cho 2 nút to ngang nhau" → hai nút cùng cỡ, một hàng */}
              <span className="cvw-box__acts">
                <button type="button" className="cvw-box__btn is-back" onClick={() => setCur(null)}>
                  {t.back}
                </button>
                {it.page && (
                  <button type="button" className="cvw-box__btn cvw-box__go" onClick={() => goToPage?.(it.page - 1)}>
                    {t.see(it.page)}
                  </button>
                )}
              </span>
            </span>
          </div>
        )}
      </div>
      <button type="button" className="cvw-box__lid" onClick={() => interactive && setOpen(true)} disabled={!interactive} aria-hidden={open} tabIndex={open ? -1 : 0} aria-label={`${pick(el.title)} — ${t.open}`}>
        <span className="cvw-box__label">
          <svg viewBox="0 0 60 30" aria-hidden="true">
            <path d="M4 26 Q30 22 56 26" fill="none" stroke="#a07a3c" strokeWidth="1.3" />
            <path d="M7 26 L30 5 L53 26" fill="#f4ead6" stroke="#a07a3c" strokeWidth="1.1" strokeLinejoin="round" />
            <circle cx="30" cy="4.6" r="1.5" fill="#a07a3c" />
          </svg>
          <span className="cvw-box__name">{pick(el.title)}</span>
          <span className="cvw-box__hint">{t.open}</span>
        </span>
        <span className="cvw-box__latch" aria-hidden="true" />
      </button>
    </div>
  )
}
