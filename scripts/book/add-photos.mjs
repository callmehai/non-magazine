#!/usr/bin/env node
/**
 * Thêm / đổi vài ảnh mà không cần cả thư mục ảnh gốc (thư mục .webp tạm có thể đã bị xoá):
 *   node scripts/book/add-photos.mjs <thư mục .webp, cùng cấu trúc đường dẫn trong photos.mjs>
 * - mục nào trong photos.mjs có file trong thư mục → tải lên kho Supabase, ghi URL vào scripts/book/out/photos.json;
 * - mục còn thiếu URL mà đường dẫn trùng một mục đã có URL (đổi tên chú thích) → dùng lại URL đó;
 * - các URL cũ trong photos.json giữ nguyên (khác upload-photos.mjs: script đó ghi lại toàn bộ file).
 * Cần SUPABASE_SERVICE_ROLE_KEY trong .env.local (chỉ dùng trên máy).
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
if (!dir) throw new Error('Cách dùng: node scripts/book/add-photos.mjs <thư mục ảnh .webp>')

const jsonPath = path.join(here, 'out', 'photos.json')
const out = fs.existsSync(jsonPath) ? JSON.parse(fs.readFileSync(jsonPath, 'utf8')) : {}
const byRel = {}
let up = 0
for (const [hint, rel] of Object.entries(photos)) {
  const known = rel.match(/\.(mp4|gif|webm|webp)$/)?.[0]
  const ext = known ?? '.webp'
  const file = path.join(dir, known ? rel : `${rel}.webp`)
  if (!fs.existsSync(file)) continue
  const body = fs.readFileSync(file)
  const type = { '.webp': 'image/webp', '.mp4': 'video/mp4', '.gif': 'image/gif', '.webm': 'video/webm' }[ext]
  const folder = type.startsWith('video') ? 'video' : 'image'
  const name = `${folder}/nl-${crypto.createHash('sha1').update(body).digest('hex').slice(0, 12)}${ext}`
  const res = await fetch(`${url}/storage/v1/object/book-assets/${name}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'x-upsert': 'true', 'Content-Type': type, 'Cache-Control': 'max-age=31536000' },
    body,
  })
  if (!res.ok) throw new Error(`${rel}: ${res.status} ${await res.text()}`)
  out[hint] = `${url}/storage/v1/object/public/book-assets/${name}`
  up++
}
for (const [hint, rel] of Object.entries(photos)) if (out[hint]) byRel[rel] ??= out[hint]
let alias = 0
for (const [hint, rel] of Object.entries(photos)) {
  if (out[hint] || !byRel[rel]) continue
  out[hint] = byRel[rel]
  alias++
}
const missing = Object.keys(photos).filter((h) => !out[h])
fs.writeFileSync(jsonPath, JSON.stringify(out, null, 1))
console.log(`Đã tải ${up} ảnh, dùng lại ${alias} URL theo đường dẫn → scripts/book/out/photos.json`)
if (missing.length) console.warn(`⚠ ${missing.length} mục chưa có ảnh:\n  ${missing.join('\n  ')}`)
