import PageFrame from '../common/PageFrame.jsx'
import SmartImage from '../common/SmartImage.jsx'
import { textAnim, imageAnim, delay } from '../../lib/anim.js'

/** Ảnh lớn kiểu bảo tàng: ảnh + chú thích, có thể kèm tiêu đề ngắn. */
export default function ImagePage(props) {
  const { page, load } = props
  const a = textAnim(page)
  return (
    <PageFrame {...props}>
      <figure className="image-page">
        {page.title && (
          <h2 className="image-page__title" data-anim={a}>
            {page.title}
          </h2>
        )}
        <div className="image-page__frame" data-anim={imageAnim(page)} style={delay(0.08)}>
          <SmartImage src={page.image} alt={page.imageAlt || page.caption || page.title} fit={page.fit || 'cover'} load={load} parallax={page.animation === 'parallax'} />
        </div>
        {page.caption && (
          <figcaption data-anim={a} style={delay(0.3)}>
            {page.caption}
          </figcaption>
        )}
      </figure>
    </PageFrame>
  )
}
