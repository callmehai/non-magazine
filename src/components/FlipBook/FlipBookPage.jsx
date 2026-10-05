import { memo } from 'react'
import CoverPage from '../pages/CoverPage.jsx'
import ArticlePage from '../pages/ArticlePage.jsx'
import ImagePage from '../pages/ImagePage.jsx'
import FullImagePage from '../pages/FullImagePage.jsx'
import GalleryPage from '../pages/GalleryPage.jsx'
import VideoPage from '../pages/VideoPage.jsx'
import AudioPage from '../pages/AudioPage.jsx'
import QuotePage from '../pages/QuotePage.jsx'
import SplitPage from '../pages/SplitPage.jsx'
import CustomHtmlPage from '../pages/CustomHtmlPage.jsx'
import Model3DPage from '../pages/Model3DPage.jsx'

/** type trong magazine.js → component. Thêm loại trang mới: thêm một dòng ở đây. */
export const PAGE_TYPES = {
  cover: CoverPage,
  article: ArticlePage,
  image: ImagePage,
  'full-image': FullImagePage,
  gallery: GalleryPage,
  video: VideoPage,
  audio: AudioPage,
  quote: QuotePage,
  split: SplitPage,
  'custom-html': CustomHtmlPage,
  model3d: Model3DPage,
}

const warned = new Set()

/**
 * Một trang của tạp chí.
 * revealed: đã đến lượt chạy hiệu ứng xuất hiện · visible: đang nằm trên mặt sách
 * load: đủ gần để tải ảnh · variant: "book" | "thumb"
 */
function FlipBookPage({ page, revealed, variant = 'book', ...rest }) {
  let Component = PAGE_TYPES[page.type]
  if (!Component) {
    if (import.meta.env.DEV && !warned.has(page.type)) {
      warned.add(page.type)
      console.warn(`[magazine] Loại trang "${page.type}" không tồn tại — hiển thị như "article".`)
    }
    Component = ArticlePage
  }
  return (
    <div className={`sheet-content ${revealed || variant === 'thumb' ? 'is-revealed' : ''} ${variant === 'thumb' ? 'is-static' : ''}`}>
      <Component page={page} variant={variant} {...rest} />
    </div>
  )
}

export default memo(FlipBookPage)
