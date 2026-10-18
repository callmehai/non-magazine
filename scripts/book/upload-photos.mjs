#!/usr/bin/env node
/**
 * Tải ảnh thật (đã chuyển sang .webp) lên kho Supabase "book-assets/image/" rồi ghi
 * scripts/book/out/photos.json (mô tả khung → URL) cho build.mjs dùng.
 *   node scripts/book/upload-photos.mjs <thư mục .webp, cùng cấu trúc với thư mục Drive>
 * Tên file trên kho cố định theo đường dẫn ảnh → chạy lại chỉ ghi đè, không sinh file trùng.
 * Cần SUPABASE_SERVICE_ROLE_KEY trong .env.local (chỉ dùng trên máy, không bao giờ đưa lên web).
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { photos } from './photos.mjs'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const env = { ...process.env }
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*?))\s*(?:#.*)?$/)
  if (m) env[m[1]] = m[2] ?? m[3] ?? m[4]
}
const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) throw new Error('Thiếu VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY trong .env.local')

const dir = process.argv[2]
if (!dir) throw new Error('Cách dùng: node scripts/book/upload-photos.mjs <thư mục ảnh .webp>')

const out = {}
let n = 0
for (const [hint, rel] of Object.entries(photos)) {
  const file = path.join(dir, `${rel}.webp`)
  if (!fs.existsSync(file)) {
    console.warn(`⚠ thiếu ảnh: ${rel}`)
    continue
  }
  const name = `image/nl-${crypto.createHash('sha1').update(rel).digest('hex').slice(0, 12)}.webp`
  const res = await fetch(`${url}/storage/v1/object/book-assets/${name}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'x-upsert': 'true', 'Content-Type': 'image/webp', 'Cache-Control': 'max-age=31536000' },
    body: fs.readFileSync(file),
  })
  if (!res.ok) throw new Error(`${rel}: ${res.status} ${await res.text()}`)
  out[hint] = `${url}/storage/v1/object/public/book-assets/${name}`
  n++
}
fs.mkdirSync(path.join(here, 'out'), { recursive: true })
fs.writeFileSync(path.join(here, 'out', 'photos.json'), JSON.stringify(out, null, 1))
console.log(`Đã tải ${n}/${Object.keys(photos).length} ảnh → scripts/book/out/photos.json`)
