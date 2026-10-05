import PageFrame from '../common/PageFrame.jsx'
import SmartImage from '../common/SmartImage.jsx'
import { textAnim, delay } from '../../lib/anim.js'

export default function CoverPage(props) {
  const { page, load } = props
  const a = textAnim(page)
  const lines = Array.isArray(page.text) ? page.text : page.text ? [page.text] : []

  if (page.variant === 'back') {
    return (
      <PageFrame {...props} className="cover cover--back">
        <div className="cover__frame" aria-hidden="true" />
        <div className="cover__inner">
          <p className="cover__mark foil" data-anim={a} style={delay(0.05)}>
            {page.title}
          </p>
          <h2 className="cover__motto" data-anim={a} style={delay(0.15)}>
            {page.subtitle}
          </h2>
          <span className="cover__rule" aria-hidden="true" data-anim={a} style={delay(0.25)} />
          <div className="cover__lines">
            {lines.map((l, i) => (
              <p key={i} data-anim={a} style={delay(0.35 + i * 0.15)}>
                {l}
              </p>
            ))}
          </div>
          {page.footer && (
            <p className="cover__end" data-anim={a} style={delay(0.9)}>
              {page.footer}
            </p>
          )}
        </div>
      </PageFrame>
    )
  }

  return (
    <PageFrame {...props} className="cover cover--front">
      <div className="cover__frame" aria-hidden="true" />
      <div className="cover__inner">
        {page.kicker && <p className="cover__issue">{page.kicker}</p>}
        {page.image && (
          <div className="cover__art">
            <SmartImage src={page.image} alt={page.imageAlt} fit="contain" load={load} />
          </div>
        )}
        <h1 className="cover__title foil">{page.title}</h1>
        {page.subtitle && <p className="cover__subtitle">{page.subtitle}</p>}
        <span className="cover__rule" aria-hidden="true" />
        {lines.map((l, i) => (
          <p className="cover__tagline" key={i}>
            {l}
          </p>
        ))}
      </div>
    </PageFrame>
  )
}
