-- Run this once in the Supabase SQL Editor, after 0001_comments.sql.
-- Adds editing/deleting of comments, and a per-browser id for portal
-- visitors (who have no accounts) so they can be matched to "their own"
-- comments client-side.

alter table document_comments add column if not exists author_client_id uuid;

create policy "document_comments_public_update" on document_comments for update using (true) with check (true);
create policy "document_comments_public_delete" on document_comments for delete using (true);
