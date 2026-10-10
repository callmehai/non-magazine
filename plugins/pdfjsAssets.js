import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const DIRS = ['cmaps', 'standard_fonts', 'wasm', 'iccs']
const PREFIX = 'pdfjs'

/**
 * Serves the data files pdf.js needs at runtime (CJK cmaps, standard fonts,
 * image-decoder wasm) under `pdfjs/` — from node_modules in dev, copied into
 * the bundle at build time. Without cmaps, Japanese text in PDFs whose fonts
 * are not embedded renders as blanks.
 */
export default function pdfjsAssets() {
  const root = path.dirname(require.resolve('pdfjs-dist/package.json'))

  return {
    name: 'pdfjs-assets',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent((req.url || '').split('?')[0])
        const m = url.match(new RegExp(`/${PREFIX}/(${DIRS.join('|')})/([^/]+)$`))
        if (!m) return next()
        const file = path.join(root, m[1], m[2])
        if (!fs.existsSync(file)) return next()
        if (file.endsWith('.wasm')) res.setHeader('Content-Type', 'application/wasm')
        fs.createReadStream(file).pipe(res)
      })
    },
    generateBundle() {
      for (const dir of DIRS) {
        const full = path.join(root, dir)
        if (!fs.existsSync(full)) continue
        for (const name of fs.readdirSync(full)) {
          if (name.startsWith('LICENSE')) continue
          this.emitFile({ type: 'asset', fileName: `${PREFIX}/${dir}/${name}`, source: fs.readFileSync(path.join(full, name)) })
        }
      }
    },
  }
}
