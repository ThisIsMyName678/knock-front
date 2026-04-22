-- Contacts + permissions (Supabase). Run in SQL editor or via Supabase CLI.
-- Adjust auth/tenant columns to match your org model.

create extension if not exists "pgcrypto";

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid,
  owner_user_id uuid,
  contact_kind text not null check (contact_kind in ('role_holder', 'tenant_buyer')),
  nickname text not null default '',
  display_name text not null,
  phone text not null,
  email text,
  notes text,
  link_kind text not null check (link_kind in ('asset', 'project')),
  link_id text not null,
  link_label text not null,
  has_user_in_system boolean not null default false,
  invite_token text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contacts_link_idx on public.contacts (link_kind, link_id);
create index if not exists contacts_org_idx on public.contacts (organization_id);
create index if not exists contacts_invite_idx on public.contacts (invite_token) where invite_token is not null;

create table if not exists public.contact_permissions (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete cascade,
  scope text not null check (scope in ('project', 'asset')),
  scope_id text not null,
  module_key text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  unique (contact_id, scope, scope_id, module_key)
);

create index if not exists contact_permissions_contact_idx on public.contact_permissions (contact_id);
create index if not exists contact_permissions_scope_idx on public.contact_permissions (scope, scope_id);

comment on table public.contacts is 'Role holders and tenants/buyers linked to an asset or project.';
comment on table public.contact_permissions is 'Per-module CRUD flags; duplicate rows per asset when expanding project defaults.';
