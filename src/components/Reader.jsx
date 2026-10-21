import { useEffect, useRef } from 'react'
import Icon from './common/Icon.jsx'
import { t } from '../lib/i18n.js'
import { asset } from '../lib/assets.js'

/**
 * "Đọc thêm": toàn văn một mục trong khung giấy ngà (trang sách chỉ để đoạn tóm tắt cho đỡ dày chữ).
 * state = { title, paras: [string], lang }. Esc / bấm ra ngoài để đóng.
 */
export default function Reader({ state, onClose }) {
  const closeRef = useRef(null)
  const open = !!state

  useEffect(() => {
    if (!open) return
    const prevFocus = document.activeElement
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopImmediatePropagation()
      onClose()
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      prevFocus?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="reader" role="dialog" aria-modal="true" aria-label={state.title} onClick={onClose}>
      <article className="reader__sheet" lang={state.lang} style={{ backgroundImage: `url(${asset('assets/book/paper/giay.webp')})` }} onClick={(e) => e.stopPropagation()}>
        <img className="reader__deco" src={asset('assets/book/deco/non.svg')} alt="" aria-hidden="true" />
        <h2 className="reader__title">{state.title}</h2>
        <div className="reader__body">
          {state.paras.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </article>
      <button ref={closeRef} type="button" className="ctrl reader__close" onClick={onClose} aria-label={t('closeReader')}>
        <Icon name="close" />
      </button>
    </div>
  )
}
