import PageFrame from '../common/PageFrame.jsx'
import SmartImage from '../common/SmartImage.jsx'
import RichText from '../common/RichText.jsx'
import { textAnim, delay } from '../../lib/anim.js'

/** Ảnh tràn trang, chữ đặt chồng lên ảnh (overlay: bottom | top | center). */
export default function FullImagePage(props) {
  const { page, load } = props
  const a = textAnim(page)
  const pos = page.overlay || 'bottom'
  return (
    <PageFrame {...props} className="full-image">
      <SmartImage className="full-image__bg" src={page.image} alt={page.imageAlt || page.title} fit="cover" load={load} parallax={page.animation === 'parallax'} />
      <div className={`full-image__shade shade-${pos}`} aria-hidden="true" />
      {(page.title || page.text) && (
        <div className={`full-image__text pos-${pos}`}>
          {page.kicker && (
            <p className="kicker" data-anim={a}>
              {page.kicker}
            </p>
          )}
          {page.title && (
            <h2 className="full-image__title" data-anim={a} style={delay(0.08)}>
              {page.title}
            </h2>
          )}
          <RichText text={page.text} anim={a} delay={0.2} />
        </div>
      )}
      {page.caption && <p className="full-image__caption">{page.caption}</p>}
    </PageFrame>
  )
}
