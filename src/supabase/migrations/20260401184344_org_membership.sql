create or replace function public.get_my_organizations()
returns table (
    id uuid,
    name text,
    owner_email text,
    owner_first_name text,
    owner_last_name text,
    member_count bigint,
    created_at timestamptz
)
as $$
    select
        o.org_id as id,
        o.org_name as name,
        u.email as owner_email,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        o.member_count,
        o.created_at
    from public.org_membership om
    join public.org o
        on o.org_id = om.org_id
    left join public.users u
        on u.id = o.org_owner
    where om.user_id = public.get_user_id_from_auth()
    order by o.org_name asc;
$$
language sql security definer set search_path = public;

create or replace function public.get_all_organizations()
returns table (
    id uuid,
    name text,
    owner_email text,
    owner_first_name text,
    owner_last_name text,
    member_count bigint,
    created_at timestamptz
)
as $$
    select
        o.org_id as id,
        o.org_name as name,
        u.email as owner_email,
        u.first_name as owner_first_name,
        u.last_name as owner_last_name,
        o.member_count,
        o.created_at
    from public.org o
    left join public.users u
        on u.id = o.org_owner
    order by o.org_name asc;
$$
language sql security definer set search_path = public;

create or replace function public.get_org_members(p_org_id uuid)
returns table (
    email text,
    first_name text,
    last_name text,
    role text,
    joined_at timestamptz
)
as $$
    select
        u.email,
        u.first_name,
        u.last_name,
        om.role,
        om.joined_at
    from public.org_membership om
    left join public.users u
        on u.id = om.user_id
    where om.org_id = p_org_id
    order by om.joined_at asc;
$$ language sql security definer set search_path = public;

grant execute on function public.get_my_organizations() to authenticated;
grant execute on function public.get_all_organizations() to authenticated;
grant execute on function public.get_org_members(uuid) to authenticated;

