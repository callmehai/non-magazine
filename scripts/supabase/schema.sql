-- ============================================================
--  Database cho editor sách (#/admin). Chạy lại nhiều lần vẫn an toàn.
--  Chạy bằng: npm run supabase:setup   (scripts/supabase/setup.mjs)
-- ============================================================

-- ── người dùng: hồ sơ gắn với tài khoản Supabase Auth
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null,
  display_name text not null,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);

-- ── trang: data = { bg, bgImage, template, hideNumber, elements[] }
create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  position double precision not null,
  data jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id),
  deleted_at timestamptz
);
create index if not exists pages_book_position on public.pages (book_id, position);

-- ── lịch sử: bản cũ của trang (tối đa ~1 bản / 5 phút / trang) — người biên tập xem và khôi phục trong editor
create table if not exists public.page_versions (
  id bigserial primary key,
  page_id uuid not null,
  book_id uuid not null,
  data jsonb not null,
  version integer not null,
  saved_at timestamptz not null default now(),
  saved_by uuid
);
create index if not exists page_versions_page on public.page_versions (page_id, saved_at desc);

-- ── bản đã xuất bản: người đọc chỉ thấy bản mới nhất ở đây
create table if not exists public.publications (
  id bigserial primary key,
  book_id uuid not null references public.books (id) on delete cascade,
  pages jsonb not null,
  published_at timestamptz not null default now(),
  published_by uuid
);
create index if not exists publications_book on public.publications (book_id, published_at desc);

-- ── quyền
create or replace function public.is_editor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid())
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

alter table public.profiles enable row level security;
alter table public.books enable row level security;
alter table public.pages enable row level security;
alter table public.page_versions enable row level security;
alter table public.publications enable row level security;

drop policy if exists "profiles: editors read" on public.profiles;
create policy "profiles: editors read" on public.profiles for select to authenticated using (public.is_editor());

drop policy if exists "books: everyone reads" on public.books;
create policy "books: everyone reads" on public.books for select to anon, authenticated using (true);
drop policy if exists "books: admin writes" on public.books;
create policy "books: admin writes" on public.books for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- bản nháp: chỉ người biên tập đọc/sửa
drop policy if exists "pages: editors read" on public.pages;
create policy "pages: editors read" on public.pages for select to authenticated using (public.is_editor());
drop policy if exists "pages: editors insert" on public.pages;
create policy "pages: editors insert" on public.pages for insert to authenticated with check (public.is_editor());
drop policy if exists "pages: editors update" on public.pages;
create policy "pages: editors update" on public.pages for update to authenticated using (public.is_editor()) with check (public.is_editor());

drop policy if exists "page_versions: admin reads" on public.page_versions;
drop policy if exists "page_versions: editors read" on public.page_versions;
create policy "page_versions: editors read" on public.page_versions for select to authenticated using (public.is_editor());

drop policy if exists "publications: everyone reads" on public.publications;
create policy "publications: everyone reads" on public.publications for select to anon, authenticated using (true);

-- ── lưu trang có kiểm tra phiên bản: ai lưu đè lên bản cũ hơn sẽ nhận lỗi "conflict"
create or replace function public.save_page(p_id uuid, p_data jsonb, p_version integer) returns integer
language plpgsql security invoker set search_path = public as $$
declare
  v integer;
begin
  update pages
     set data = p_data, version = version + 1, updated_at = now(), updated_by = auth.uid()
   where id = p_id and deleted_at is null and (p_version is null or version = p_version)
  returning version into v;
  if v is null then
    raise exception 'conflict' using errcode = 'P0001';
  end if;
  return v;
end
$$;

-- ── ghi lịch sử khi nội dung trang đổi (gộp: tối đa 1 bản / 5 phút / trang)
create or replace function public.pages_history() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.data is distinct from new.data and not exists (
    select 1 from page_versions where page_id = old.id and saved_at > now() - interval '5 minutes'
  ) then
    insert into page_versions (page_id, book_id, data, version, saved_by)
    values (old.id, old.book_id, old.data, old.version, old.updated_by);
  end if;
  return new;
end
$$;
drop trigger if exists pages_history on public.pages;
create trigger pages_history before update on public.pages for each row execute function public.pages_history();

-- ── xuất bản (chỉ admin): chụp toàn bộ trang hiện tại thành một bản cho người đọc
create or replace function public.publish_book(p_book uuid) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare
  t timestamptz;
begin
  if not public.is_admin() then
    raise exception 'Chỉ admin được xuất bản';
  end if;
  insert into publications (book_id, pages, published_by)
  select p_book,
         coalesce(jsonb_agg(jsonb_build_object('id', id, 'position', position, 'version', version, 'data', data) order by position), '[]'::jsonb),
         auth.uid()
    from pages where book_id = p_book and deleted_at is null
  returning published_at into t;
  return t;
end
$$;

-- ── realtime: gửi thay đổi của bảng pages cho các editor đang mở
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'pages') then
    alter publication supabase_realtime add table public.pages;
  end if;
end
$$;

-- ── lưu ảnh/video: bucket công khai (ai cũng xem được), chỉ editor được tải lên
insert into storage.buckets (id, name, public, file_size_limit)
values ('book-assets', 'book-assets', true, 52428800)
on conflict (id) do update set public = true;

drop policy if exists "book-assets: editors list" on storage.objects;
create policy "book-assets: editors list" on storage.objects for select to authenticated
  using (bucket_id = 'book-assets' and public.is_editor());

drop policy if exists "book-assets: editors upload" on storage.objects;
create policy "book-assets: editors upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'book-assets' and public.is_editor());
