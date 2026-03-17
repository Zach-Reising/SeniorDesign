create table if not exists public.org (
    org_id uuid primary key default gen_random_uuid(),
    org_owner uuid not null references public.users(id),
    created_by uuid not null references public.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.org_membership (
    org_id uuid not null references public.org(org_id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    role text not null,
    joined_at timestamptz not null default now(),
    permission_updated_at timestamptz not null default now(),
    primary key (org_id, user_id)
);

alter table public.org enable row level security;

revoke all on table public.org from public;
revoke all on table public.org from anon;

Create policy "Allow authenticated users to access organizations"
on public.org
for select
to authenticated
using (true);


alter table public.org_membership enable row level security;

revoke all on table public.org_membership from public;
revoke all on table public.org_membership from anon;

Create policy "Allow org members to access their membership"
on public.org_membership
for select
to authenticated
using (
    org_id in (
        select org_id 
        from public.org_memberships
        where user_id = public.users.id
    )
);