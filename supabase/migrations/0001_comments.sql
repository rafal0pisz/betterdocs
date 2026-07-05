-- Run this once in the Supabase SQL Editor for this project.
-- Adds threaded, text-anchored comments on documents (admin + client portal).
--
-- Named "document_comments" (not "comments") because this project already has an
-- unrelated, unused "comments" table with a different schema (entity_type/entity_id,
-- author_id, is_resolved) — kept untouched in case it's earmarked for something else.

create table if not exists document_comments (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  parent_id uuid references document_comments(id) on delete cascade,
  author_type text not null check (author_type in ('admin', 'portal')),
  author_name text not null,
  quote text,
  quote_prefix text,
  quote_suffix text,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists document_comments_document_id_idx on document_comments(document_id);
create index if not exists document_comments_parent_id_idx on document_comments(parent_id);

alter table document_comments enable row level security;

create policy "document_comments_public_select" on document_comments for select using (true);
create policy "document_comments_public_insert" on document_comments for insert with check (true);
