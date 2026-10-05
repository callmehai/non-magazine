import PageFrame from '../common/PageFrame.jsx'
import { textAnim } from '../../lib/anim.js'

/**
 * HTML tuỳ biến — viết thẳng HTML trong magazine.js (trường `html`).
 * Chỉ dùng nội dung do chính bạn viết (HTML được chèn nguyên văn).
 * Các class có sẵn: ch-stack, ch-eyebrow, ch-title, ch-words — xem pages.css.
 */
export default function CustomHtmlPage(props) {
  const { page } = props
  return (
    <PageFrame {...props} className="custom-html">
      <div className="custom-html__inner" data-anim-children={textAnim(page)} dangerouslySetInnerHTML={{ __html: page.html || '' }} />
    </PageFrame>
  )
}
