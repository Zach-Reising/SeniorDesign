create table if not exists public.locations (
    l_id uuid primary key default gen_random_uuid(),
    l_name text null
);

create table if not exists public.org_plan (
    org_plan_id uuid primary key default gen_random_uuid(),
    org_id uuid not null references public.org(org_id) on delete cascade,
    plan_name text null,
    title text not null,
    description text not null,
    public boolean not null default false,
    draft boolean not null default true,
    start_time timestamptz null,
    end_time timestamptz null,
    locations uuid[] null,
    created_by uuid not null references public.users(id),
    updated_by uuid not null references public.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.reports (
    r_id uuid not null primary key default gen_random_uuid(),
    location_id uuid not null references public.locations(l_id) on delete cascade,
    title text not null,
    description text not null,
    created_by uuid not null references public.users(id),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists images (
    i_id uuid not null primary key default gen_random_uuid(),
    report_id uuid not null references public.reports(r_id) on delete cascade,
    img bytea not null,
    created_by uuid not null references public.users(id),
    created_at timestamptz not null default now()
);

alter table public.locations enable row level security;
alter table public.org_plan enable row level security;
alter table public.reports enable row level security;
alter table public.images enable row level security;

revoke all on table public.locations from public;
revoke all on table public.org_plan from public;
revoke all on table public.reports from public;
revoke all on table public.images from public;

revoke all on table public.locations from anon;
revoke all on table public.org_plan from anon;
revoke all on table public.reports from anon;
revoke all on table public.images from anon;

create policy "Allow authenticated users to access locations"
on public.locations
for select
to authenticated
using (true);

create policy "Allow org members to access their plans"
on public.org_plan
for select
to authenticated
using (
    exists (
        select 1
        from public.org_plan op
        join public.org_membership om on op.org_id = om.org_id
        where om.user_id = public.get_user_id_from_auth()
          and op.org_plan_id = public.org_plan.org_plan_id
    )
);

create policy "Allow users to access reports"
on public.reports
for select
to authenticated
using (true);

create policy "Allow users to access images"
on public.images
for select
to authenticated
using (true);
