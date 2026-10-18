#!/usr/bin/env node
/**
 * Đưa sách vừa dựng (scripts/book/out/book.json) vào bản nháp của sách "non" trên Supabase.
 * Trang cũ KHÔNG bị xoá hẳn: chỉ đánh dấu deleted_at (khôi phục được bằng SQL). Người đọc chưa thấy gì
 * cho tới khi admin bấm "Xuất bản" trong editor.
 *   node scripts/supabase/../book/push.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const env = { ...process.env }
for (const line of fs.readFileSync(path.join(root, '.env.local'), 'utf8').split('\n')) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*?))\s*(?:#.*)?$/)
  if (m) env[m[1]] = m[2] ?? m[3] ?? m[4]
}
if (env.SUPABASE_DB_URL?.includes('[YOUR-PASSWORD]') && env.SUPABASE_DB_PASSWORD) {
  env.SUPABASE_DB_URL = env.SUPABASE_DB_URL.replace('[YOUR-PASSWORD]', encodeURIComponent(env.SUPABASE_DB_PASSWORD))
}

const { pages } = JSON.parse(fs.readFileSync(path.join(here, 'out', 'book.json'), 'utf8'))
const db = new pg.Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
await db.connect()
try {
  await db.query('begin')
  const { rows } = await db.query("select id from public.books where slug = 'non'")
  if (!rows[0]) throw new Error('Không thấy sách "non"')
  const bookId = rows[0].id
  const archived = await db.query('update public.pages set deleted_at = now() where book_id = $1 and deleted_at is null', [bookId])
  for (const [i, p] of pages.entries()) {
    await db.query('insert into public.pages (book_id, position, data) values ($1, $2, $3)', [bookId, (i + 1) * 1000, p])
  }
  await db.query('commit')
  console.log(`Đã cất ${archived.rowCount} trang cũ, thêm ${pages.length} trang mới vào bản nháp.`)
} catch (e) {
  await db.query('rollback')
  throw e
} finally {
  await db.end()
}
