import fs from 'node:fs'
import path from 'node:path'

/**
 * Chỉ khi chạy dev: trang đo chữ (?measure=1) gửi chiều cao thật của từng khối chữ (đo trên trình duyệt, đúng font,
 * cả tiếng Việt lẫn tiếng Nhật) về POST /__book-measure → ghi scripts/book/out/measure.json cho build.mjs dùng
 * thay cho phép ước lượng. Bản build lên web không có endpoint này.
 */
export default function bookMeasure() {
  return {
    name: 'book-measure',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__book-measure', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end()
        }
        let body = ''
        req.on('data', (c) => (body += c))
        req.on('end', () => {
          try {
            const incoming = JSON.parse(body)
            const file = path.join(server.config.root, 'scripts/book/out/measure.json')
            const prev = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
            const merged = { ...prev, ...incoming }
            fs.writeFileSync(file, JSON.stringify(merged))
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify({ added: Object.keys(incoming).length, total: Object.keys(merged).length }))
          } catch (err) {
            res.statusCode = 400
            res.end(String(err))
          }
        })
      })
    },
  }
}
