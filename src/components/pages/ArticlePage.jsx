import PageFrame from '../common/PageFrame.jsx'
import SmartImage from '../common/SmartImage.jsx'
import RichText, { inline } from '../common/RichText.jsx'
import Links from './Links.jsx'
import { textAnim, imageAnim, delay } from '../../lib/anim.js'

export default function ArticlePage(props) {
  const { page, load } = props
  const layout = page.layout || (page.image ? 'image-top' : 'text')
  const a = textAnim(page)
  const figure = page.image && (
    <figure className="article__figure" data-anim={imageAnim(page)} style={delay(0.1)}>
      <SmartImage src={page.image} alt={page.imageAlt || page.title} fit={page.imageFit || 'cover'} load={load} parallax={page.animation === 'parallax'} />
      {page.caption && <figcaption>{page.caption}</figcaption>}
    </figure>
  )
  const isSteps = layout === 'steps' || (page.steps && !page.text)

  return (
    <PageFrame {...props}>
      <div className={`article article--${layout}`}>
        {(layout === 'image-top' || layout === 'image-left') && figure}
        <div className="article__content">
          {page.kicker && (
            <p className="kicker" data-anim={a}>
              {page.kicker}
            </p>
          )}
          <h2 className="article__title" data-anim={a} style={delay(0.06)}>
            {page.title}
          </h2>
          {page.subtitle && (
            <p className="lead" data-anim={a} style={delay(0.12)}>
              {page.subtitle}
            </p>
          )}

          {!isSteps && (
            <div className={`article__text ${page.dropCap ? 'has-dropcap' : ''}`}>
              <RichText text={page.text} anim={a} delay={0.16} />
            </div>
          )}

          {page.list && (
            <ul className="article__list">
              {page.list.map((item, i) => (
                <li key={i} data-anim={a} style={delay(0.3 + i * 0.06)}>
                  <span className="article__list-no">{String(i + 1).padStart(2, '0')}</span>
                  {inline(item)}
                </li>
              ))}
            </ul>
          )}

          {page.steps && (
            <ol className="steps">
              {page.steps.map((s, i) => (
                <li key={i} data-anim={a} style={delay(0.15 + i * 0.1)}>
                  <span className="steps__no">{String(i + 1).padStart(2, '0')}</span>
                  <span className="steps__body">
                    <strong>{s.title}</strong>
                    {s.text && <span>{s.text}</span>}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {isSteps && page.text && (
            <div className="article__outro">
              <RichText text={page.text} anim={a} delay={0.75} />
            </div>
          )}

          {page.highlight && (
            <blockquote className="pull" data-anim={a} style={delay(0.45)}>
              {inline(page.highlight)}
            </blockquote>
          )}
          <Links links={page.links} anim={a} />
        </div>
        {(layout === 'image-bottom' || layout === 'image-right') && figure}
      </div>
    </PageFrame>
  )
}
