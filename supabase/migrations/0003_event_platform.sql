-- Run this once in the Supabase SQL Editor, after 0001/0002.
-- Adds a per-event platform (web / ios / android) so the same Events table
-- can carry either a dataLayer.push() snippet (web) or a native Firebase SDK
-- snippet (iOS/Android) tailored for app developers.
--
-- Purely additive: every existing row gets platform = 'web' automatically
-- (the column's default), so already-filled-in documentation is completely
-- unaffected - nothing is deleted, renamed or reinterpreted.

alter table structured_events
  add column if not exists platform text not null default 'web'
  check (platform in ('web', 'ios', 'android'));
