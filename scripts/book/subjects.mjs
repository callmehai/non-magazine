/**
 * Khung vật chính của từng ảnh trong sách (chiếc nón, người, đôi tay…) → scripts/book/subjects.json, dùng khi đặt khung ảnh:
 * khung cắt ảnh (cover) dời theo vật chính, ảnh chụp dọc không nhét vào khung ngang (góp ý: "muốn ảnh toàn cảnh nón").
 * Chạy lại khi thêm ảnh mới:  node scripts/book/build.mjs && node scripts/book/subjects.mjs && node scripts/book/build.mjs
 * Dùng Vision của macOS (scripts/book/subject.swift), không cần model.
 */
import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import { fileURLToPath } from 'url'

const here = path.dirname(fileURLToPath(import.meta.url))
const out = path.join(here, 'out')
const dir = path.join(out, 'subj-img')
const bin = path.join(out, 'subject')
fs.mkdirSync(dir, { recursive: true })
if (!fs.existsSync(bin)) execFileSync('swiftc', ['-O', path.join(here, 'subject.swift'), '-o', bin], { stdio: 'inherit' })

const book = JSON.parse(fs.readFileSync(path.join(out, 'book.json'), 'utf8'))
const srcs = new Set()
for (const p of book.pages) for (const e of p.elements ?? []) if (e.type === 'image') for (const s of [e.src, e.srcJa]) if (/^https?:.*\.(webp|jpe?g|png)$/i.test(s ?? '')) srcs.add(s)
// cả kho ảnh (out/photos.json), không chỉ ảnh đang có trong sách: ảnh kho được kéo vào lấp trang / ghép cặp cũng cần khung vật chính
const pf = path.join(out, 'photos.json')
if (fs.existsSync(pf)) for (const s of Object.values(JSON.parse(fs.readFileSync(pf, 'utf8')))) if (/^https?:.*\.(webp|jpe?g|png)$/i.test(s ?? '')) srcs.add(s)
const file = path.join(here, 'subjects.json')
const db = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {}
const todo = [...srcs].filter((s) => !db[path.basename(s)])
let k = 0
await Promise.all(Array.from({ length: 8 }, async () => {
  while (k < todo.length) {
    const s = todo[k++]
    const f = path.join(dir, path.basename(s))
    if (!fs.existsSync(f)) fs.writeFileSync(f, Buffer.from(await (await fetch(s)).arrayBuffer()))
  }
}))
if (todo.length) {
  const res = execFileSync(bin, todo.map((s) => path.join(dir, path.basename(s))), { encoding: 'utf8', maxBuffer: 1 << 24 })
  for (const line of res.trim().split('\n')) {
    const o = JSON.parse(line)
    db[path.basename(o.file)] = { a: o.a, ...(o.fg ? { fg: o.fg, fgA: o.fgArea } : {}), ...(o.sal ? { sal: o.sal } : {}) }
  }
}
const sorted = Object.fromEntries(Object.keys(db).sort().map((k) => [k, db[k]]))
fs.writeFileSync(file, JSON.stringify(sorted, null, 0).replace(/\},"/g, '},\n"') + '\n')
console.log(`${Object.keys(sorted).length} ảnh (${todo.length} mới) → ${path.relative(process.cwd(), file)}`)
