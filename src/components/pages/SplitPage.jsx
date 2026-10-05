import PageFrame from '../common/PageFrame.jsx'
import SmartImage from '../common/SmartImage.jsx'
import RichText from '../common/RichText.jsx'
import { textAnim, imageAnim, delay } from '../../lib/anim.js'

/** Trang chia đôi: một nửa ảnh, một nửa chữ (imagePosition: top | bottom | left | right). */
export default function SplitPage(props) {
  const { page, load } = props
  const a = textAnim(page)
  const pos = page.imagePosition || 'top'
  return (
    <PageFrame {...props} className={`split split--${pos}`}>
      <div className="split__media" data-anim={imageAnim(page)}>
        <SmartImage src={page.image} alt={page.imageAlt || page.title} fit={page.imageFit || 'cover'} load={load} parallax={page.animation === 'parallax'} />
      </div>
      <div className="split__content">
        {page.kicker && (
          <p className="kicker" data-anim={a} style={delay(0.1)}>
            {page.kicker}
          </p>
        )}
        <h2 className="article__title" data-anim={a} style={delay(0.15)}>
          {page.title}
        </h2>
        <RichText text={page.text} anim={a} delay={0.25} />
        {page.words && (
          <ul className="split__words">
            {page.words.map((w, i) => (
              <li key={w} data-anim={a} style={delay(0.4 + i * 0.1)}>
                {w}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageFrame>
  )
}
