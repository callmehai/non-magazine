#!/usr/bin/env node
/**
 * Cài đặt Supabase cho editor sách — chạy lại nhiều lần vẫn an toàn.
 *
 *   npm run supabase:setup -- --admin hai:"Trần Việt Hải" --editors an:"Nguyễn An",binh,chi
 *
 * 1. Tạo bảng, quyền, hàm, realtime, bucket ảnh (schema.sql) — cần SUPABASE_DB_URL
 * 2. Tạo tài khoản (mật khẩu ngẫu nhiên) — cần SUPABASE_SERVICE_ROLE_KEY
 *    Tài khoản đã có thì giữ nguyên mật khẩu (thêm --reset-passwords để đặt lại).
 *    Tên đăng nhập + mật khẩu ghi ra scripts/supabase/accounts.local (không bị commit).
 * 3. Tạo sách "non" với 18 trang mẫu nếu sách chưa có trang nào.
 *
 * Đọc biến từ .env.local: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_DB_URL
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { createClient } from '@supabase/supabase-js'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

// ── .env.local
const env = { ...process.env }
const envFile = path.join(root, '.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    // giá trị trong nháy giữ nguyên (mật khẩu có thể chứa #); không nháy thì # là ghi chú
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|(.*?))\s*(?:#.*)?$/)
    if (m) env[m[1]] = m[2] ?? m[3] ?? m[4]
  }
}
// URI copy từ Supabase có chỗ [YOUR-PASSWORD] → điền mật khẩu (mã hoá ký tự đặc biệt như ? # @)
if (env.SUPABASE_DB_URL?.includes('[YOUR-PASSWORD]') && env.SUPABASE_DB_PASSWORD) {
  env.SUPABASE_DB_URL = env.SUPABASE_DB_URL.replace('[YOUR-PASSWORD]', encodeURIComponent(env.SUPABASE_DB_PASSWORD))
}
for (const k of ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_DB_URL']) {
  if (!env[k]) {
    console.error(`Thiếu ${k} trong .env.local`)
    process.exit(1)
  }
}

// ── tham số
const args = process.argv.slice(2)
const arg = (name) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : undefined
}
const parseUsers = (s) =>
  (s || '')
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const [u, ...rest] = x.split(':')
      const username = u.trim().toLowerCase()
      return { username, name: rest.join(':').trim().replace(/^["']|["']$/g, '') || username }
    })
const accounts = [
  ...parseUsers(arg('admin') || 'admin').map((a) => ({ ...a, role: 'admin' })),
  ...parseUsers(arg('editors') || 'editor1,editor2,editor3,editor4,editor5').map((a) => ({ ...a, role: 'editor' })),
]
const resetPasswords = args.includes('--reset-passwords')

const toEmail = (username) => `${username}@non-magazine.app` // giống src/canvas/store/supabaseStore.js
const password = () => {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from(crypto.randomBytes(12), (b) => abc[b % abc.length]).join('')
}

// ── 1. schema
console.log('1/3  Tạo bảng, quyền, realtime, bucket…')
const db = new pg.Client({ connectionString: env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } })
await db.connect()
await db.query(fs.readFileSync(path.join(here, 'schema.sql'), 'utf8'))

// ── 2. tài khoản
console.log('2/3  Tạo tài khoản…')
const admin = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const existing = new Map()
for (let page = 1; ; page++) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
  if (error) throw error
  data.users.forEach((u) => existing.set(u.email, u))
  if (data.users.length < 200) break
}
const out = []
for (const a of accounts) {
  const email = toEmail(a.username)
  let user = existing.get(email)
  let pw = null
  if (!user) {
    pw = password()
    const { data, error } = await admin.auth.admin.createUser({ email, password: pw, email_confirm: true, user_metadata: { name: a.name } })
    if (error) throw new Error(`${a.username}: ${error.message}`)
    user = data.user
  } else if (resetPasswords) {
    pw = password()
    const { error } = await admin.auth.admin.updateUserById(user.id, { password: pw })
    if (error) throw error
  }
  await db.query(
    `insert into public.profiles (id, username, display_name, role) values ($1, $2, $3, $4)
     on conflict (id) do update set username = excluded.username, display_name = excluded.display_name, role = excluded.role`,
    [user.id, a.username, a.name, a.role]
  )
  out.push({ ...a, password: pw })
  console.log(`     ${a.role.padEnd(6)} ${a.username.padEnd(14)} ${pw ? 'mật khẩu mới' : '(giữ mật khẩu cũ)'}`)
}

const accFile = path.join(here, 'accounts.local')
const prev = fs.existsSync(accFile) ? fs.readFileSync(accFile, 'utf8') : ''
const lines = out
  .filter((a) => a.password)
  .map((a) => `${a.role}\t${a.username}\t${a.password}\t${a.name}`)
if (lines.length) {
  fs.writeFileSync(accFile, (prev ? prev.trimEnd() + '\n' : 'vai trò\ttên đăng nhập\tmật khẩu\ttên hiển thị\n') + lines.join('\n') + '\n')
  console.log(`     → mật khẩu ghi trong ${path.relative(root, accFile)}`)
}

// ── 3. sách + trang mẫu
console.log('3/3  Sách và trang mẫu…')
const tpl = JSON.parse(fs.readFileSync(path.join(root, 'src/canvas/templatePages.json'), 'utf8'))
const { rows } = await db.query(
  `insert into public.books (slug, title) values ('non', 'ノン — 頭上の物語')
   on conflict (slug) do update set slug = excluded.slug returning id`
)
const bookId = rows[0].id
const { rows: cnt } = await db.query('select count(*)::int as n from public.pages where book_id = $1 and deleted_at is null', [bookId])
if (cnt[0].n === 0) {
  const withIds = (el) => ({ ...el, id: crypto.randomUUID(), ...(el.children ? { children: el.children.map(withIds) } : {}) })
  for (const [i, p] of tpl.pages.entries()) {
    const data = { bg: p.bg, bgImage: null, template: p.template, hideNumber: false, elements: p.elements.map(withIds) }
    await db.query('insert into public.pages (book_id, position, data) values ($1, $2, $3)', [bookId, (i + 1) * 1000, data])
  }
  console.log(`     đã tạo ${tpl.pages.length} trang mẫu`)
} else {
  console.log(`     sách đã có ${cnt[0].n} trang — giữ nguyên`)
}

await db.end()
console.log('\nXong. Chạy `npm run dev` rồi mở http://localhost:5180/#/admin')
