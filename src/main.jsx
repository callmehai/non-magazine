import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Font tự host (có đầy đủ tiếng Việt)
import '@fontsource/playfair-display/400.css'
import '@fontsource/playfair-display/600.css'
import '@fontsource/playfair-display/700.css'
import '@fontsource/playfair-display/400-italic.css'
import '@fontsource/cormorant-garamond/400-italic.css'
import '@fontsource/cormorant-garamond/500-italic.css'
import '@fontsource/be-vietnam-pro/300.css'
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'

import './styles/theme.css'
import './styles/global.css'
import './styles/book.css'
import './styles/pages.css'
import './styles/ui.css'
import App from './App.jsx'
import { setLang, t } from './lib/i18n.js'
import magazine from './content/magazine.js'
import pdfBook from './content/pdfBook.js'
import canvasBook from './content/canvasBook.js'

const root = createRoot(document.getElementById('root'))
const render = (book) =>
  root.render(
    <StrictMode>
      <App magazine={book} />
    </StrictMode>
  )

const params = new URLSearchParams(location.search)
const bookParam = params.get('book')

// #/admin → editor (đăng nhập, sửa sách) · ?book=pdf → sách từ file PDF
// ?book=<tên sách> → sách làm bằng editor · mặc định là tạp chí NÓN
if (/^#\/?admin/.test(location.hash)) { // #/admin hoặc gõ thiếu dấu / (#admin)
  setLang('vi')
  document.title = 'Biên tập — ノン'
  import('./editor/EditorApp.jsx').then(({ default: EditorApp }) =>
    root.render(
      <StrictMode>
        <EditorApp />
      </StrictMode>
    )
  )
} else if (bookParam && bookParam !== 'pdf') {
  setLang(canvasBook.lang)
  document.title = `${canvasBook.title} — ${canvasBook.subtitle}`
  root.render(<p className="boot-msg">{t('bootLoading')}</p>)
  import('./lib/canvasBook.js')
    .then(({ loadCanvasBook }) => loadCanvasBook(canvasBook, bookParam, { draft: params.get('draft') === '1' }))
    .then(render, (err) => {
      console.error(err)
      root.render(<p className="boot-msg">{err.message || String(err)}</p>)
    })
} else if (bookParam === 'pdf') {
  setLang(pdfBook.lang)
  root.render(<p className="boot-msg">{t('bootLoading')}</p>)
  import('./lib/pdf.js')
    .then(({ loadPdfBook }) => loadPdfBook(pdfBook))
    .then(render, (err) => {
      console.error(err)
      root.render(
        <p className="boot-msg">{t('bootError', { file: pdfBook.settings.pdf })}</p>
      )
    })
} else {
  setLang(magazine.lang)
  render(magazine)
}
