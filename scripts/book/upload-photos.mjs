#!/usr/bin/env node
/**
 * Tải ảnh thật (đã chuyển sang .webp; video .mp4, ảnh động .gif) lên kho Supabase "book-assets/image/" rồi ghi
 * scripts/book/out/photos.json (mô tả khung → URL) cho build.mjs dùng.
 *   node scripts/book/upload-photos.mjs <thư mục .webp, cùng cấu trúc với thư mục Drive>
 * Tên file trên kho theo nội dung ảnh → chạy lại với ảnh không đổi chỉ ghi đè; ảnh đã chỉnh có URL mới.
 * Ảnh nên chỉnh trước (cắt, xoay, cân màu, tách nền nón): xem scripts/book/lift.swift.
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
  // mặc định ảnh .webp; video/ảnh động ghi rõ đuôi trong photos.mjs (vd. "video/trinh-dien.mp4")
  const known = rel.match(/\.(mp4|gif|webm|webp)$/)?.[0]
  const ext = known ?? '.webp'
  const file = path.join(dir, known ? rel : `${rel}.webp`)
  if (!fs.existsSync(file)) {
    console.warn(`⚠ thiếu ảnh: ${rel}`)
    continue
  }
  // tên theo nội dung file: ảnh chỉnh lại → URL mới (trình duyệt không giữ bản cũ trong cache)
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
  n++
}
fs.mkdirSync(path.join(here, 'out'), { recursive: true })
fs.writeFileSync(path.join(here, 'out', 'photos.json'), JSON.stringify(out, null, 1))
console.log(`Đã tải ${n}/${Object.keys(photos).length} ảnh → scripts/book/out/photos.json`)
