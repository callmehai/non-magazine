import PageFrame from '../common/PageFrame.jsx'
import SmartImage from '../common/SmartImage.jsx'
import RichText, { inline } from '../common/RichText.jsx'
import { textAnim, delay } from '../../lib/anim.js'

export default function QuotePage(props) {
  const { page, load } = props
  const a = textAnim(page)
  return (
    <PageFrame {...props} className="quote-page">
      {page.image && <SmartImage className="quote-page__watermark" src={page.image} alt="" fit="contain" load={load} />}
      <div className="quote-page__inner">
        {page.kicker && (
          <p className="kicker" data-anim={a}>
            {page.kicker}
          </p>
        )}
        {page.title && (
          <h2 className="quote-page__title" data-anim={a} style={delay(0.06)}>
            {page.title}
          </h2>
        )}
        <span className="quote-page__mark" aria-hidden="true" data-anim={a} style={delay(0.12)}>
          “
        </span>
        <blockquote className="quote-page__quote" data-anim={a} style={delay(0.2)}>
          {inline(page.quote)}
        </blockquote>
        {page.author && (
          <p className="quote-page__author" data-anim={a} style={delay(0.35)}>
            — {page.author}
          </p>
        )}
        <span className="cover__rule" aria-hidden="true" data-anim={a} style={delay(0.4)} />
        <div className="quote-page__text">
          <RichText text={page.text} anim={a} delay={0.5} />
        </div>
      </div>
    </PageFrame>
  )
}
