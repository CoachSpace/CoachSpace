-- ============================================
-- CoachSpace MVP - Supabase SQL Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- PROJECTS TABLE
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  project_slug text unique not null,
  project_name text,
  project_description text,
  project_status text default 'In Progress',
  client_name text,
  client_specialty text,
  client_email text,
  client_phone text,
  start_date date,
  due_date date,
  welcome_message text,
  video_link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CHECKLIST ITEMS TABLE
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  label text not null,
  is_completed boolean default false,
  order_index integer default 0,
  created_at timestamptz default now()
);

-- ROADMAP ITEMS TABLE
create table if not exists roadmap_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  status text default 'Not Started',
  due_date date,
  order_index integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- UPDATES (TASKS) TABLE
create table if not exists updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  progress integer default 0 check (progress >= 0 and progress <= 100),
  status text default 'Not Started',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- COMMENTS TABLE
create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  update_id uuid references updates(id) on delete cascade,
  name text,
  comment text not null,
  created_at timestamptz default now()
);

-- RESOURCES TABLE
create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  type text default 'Link',
  url text,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- INDEXES for performance
-- ============================================
create index if not exists idx_projects_slug on projects(project_slug);
create index if not exists idx_checklist_project on checklist_items(project_id);
create index if not exists idx_roadmap_project on roadmap_items(project_id);
create index if not exists idx_updates_project on updates(project_id);
create index if not exists idx_comments_project on comments(project_id);
create index if not exists idx_comments_update on comments(update_id);
create index if not exists idx_resources_project on resources(project_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Enable RLS but allow all access for MVP
-- (No login required - link = access)
-- ============================================
alter table projects enable row level security;
alter table checklist_items enable row level security;
alter table roadmap_items enable row level security;
alter table updates enable row level security;
alter table comments enable row level security;
alter table resources enable row level security;

-- Allow public (anon) full access for MVP
-- (Anyone with the unique link can view/edit)
create policy "Public access for MVP" on projects for all using (true) with check (true);
create policy "Public access for MVP" on checklist_items for all using (true) with check (true);
create policy "Public access for MVP" on roadmap_items for all using (true) with check (true);
create policy "Public access for MVP" on updates for all using (true) with check (true);
create policy "Public access for MVP" on comments for all using (true) with check (true);
create policy "Public access for MVP" on resources for all using (true) with check (true);

-- ============================================
-- Auto-update updated_at timestamp trigger
-- ============================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at_projects before update on projects
  for each row execute function update_updated_at();

create trigger set_updated_at_roadmap before update on roadmap_items
  for each row execute function update_updated_at();

create trigger set_updated_at_updates before update on updates
  for each row execute function update_updated_at();

create trigger set_updated_at_resources before update on resources
  for each row execute function update_updated_at();
