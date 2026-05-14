-- ============================================================
-- BaseBuilder — Agent Memory Schema
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- conversations
-- ------------------------------------------------------------
create table if not exists conversations (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'New Conversation',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger conversations_updated_at
  before update on conversations
  for each row execute procedure update_updated_at();

-- ------------------------------------------------------------
-- messages
-- ------------------------------------------------------------
create table if not exists messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references conversations(id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  content          text not null,
  created_at       timestamptz not null default now()
);

-- Index for fast per-conversation message lookup
create index if not exists messages_conversation_id_idx
  on messages(conversation_id, created_at asc);

-- ============================================================
-- Row Level Security (optional — enable if using auth)
-- ============================================================
-- alter table conversations enable row level security;
-- alter table messages enable row level security;
