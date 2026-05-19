-- ============================================
-- Run this in Supabase SQL Editor
-- ADDITIONS for file upload support
-- ============================================

-- Add file upload columns to resources table
alter table resources add column if not exists file_url text;
alter table resources add column if not exists file_name text;

-- ============================================
-- SUPABASE STORAGE SETUP
-- Do this in Supabase Dashboard UI:
-- ============================================
-- 1. Go to Storage in the left sidebar
-- 2. Click "New bucket"
-- 3. Name it exactly: resources
-- 4. Check "Public bucket" checkbox (so files are accessible via URL)
-- 5. Click Save
--
-- Then run this SQL to set storage permissions:
-- ============================================

insert into storage.buckets (id, name, public)
values ('resources', 'resources', true)
on conflict (id) do nothing;

-- Allow anyone to upload and view files (MVP - no auth)
create policy "Public upload" on storage.objects
  for insert with check (bucket_id = 'resources');

create policy "Public read" on storage.objects
  for select using (bucket_id = 'resources');

create policy "Public delete" on storage.objects
  for delete using (bucket_id = 'resources');
