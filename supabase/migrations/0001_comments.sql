-- Run this once in the Supabase SQL Editor for this project.
-- Adds threaded, text-anchored comments on documents (admin + client portal).

create table if not exists comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  parent_id uuid references comments(id) on delete cascade,
  author_type text not null check (author_type in ('admin', 'portal')),
  author_name text not null,
  quote text,
  quote_prefix text,
  quote_suffix text,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_document_id_idx on comments(document_id);
create index if not exists comments_parent_id_idx on comments(parent_id);

alter table comments enable row level security;

create policy "comments_public_select" on comments for select using (true);
create policy "comments_public_insert" on comments for insert with check (true);
