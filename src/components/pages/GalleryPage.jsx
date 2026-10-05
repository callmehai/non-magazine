import { useContext } from 'react'
import PageFrame from '../common/PageFrame.jsx'
import SmartImage from '../common/SmartImage.jsx'
import RichText from '../common/RichText.jsx'
import { MagazineContext } from '../../lib/context.js'
import { textAnim, imageAnim, delay } from '../../lib/anim.js'

export default function GalleryPage(props) {
  const { page, load, variant } = props
  const { openLightbox } = useContext(MagazineContext)
  const a = textAnim(page)
  const images = page.images || []
  return (
    <PageFrame {...props}>
      <div className="gallery">
        <div className="gallery__head">
          {page.kicker && (
            <p className="kicker" data-anim={a}>
              {page.kicker}
            </p>
          )}
          <h2 className="article__title" data-anim={a} style={delay(0.06)}>
            {page.title}
          </h2>
        </div>
        <ul className="gallery__grid" style={{ '--cols': page.columns || 2 }}>
          {images.map((img, i) => (
            <li key={i} data-anim={imageAnim(page)} style={delay(0.15 + i * 0.09)}>
              <button
                type="button"
                className="gallery__item"
                tabIndex={variant === 'thumb' ? -1 : 0}
                onClick={() => openLightbox?.(images, i)}
                aria-label={`Phóng to ảnh: ${img.caption || img.alt || i + 1}`}
              >
                <SmartImage src={img.src} alt={img.alt || img.caption} fit={img.fit || 'cover'} load={load} />
              </button>
              {img.caption && <span className="gallery__caption">{img.caption}</span>}
            </li>
          ))}
        </ul>
        <div className="gallery__text">
          <RichText text={page.text} anim={a} delay={0.5} />
        </div>
      </div>
    </PageFrame>
  )
}
