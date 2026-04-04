create or replace function public.create_org_plan(
    p_org_id uuid,
    p_plan_name text,
    p_title text,
    p_description text,
    p_public boolean,
    p_draft boolean,
    p_start_time timestamptz,
    p_end_time timestamptz,
    p_report_ids uuid[]
)
returns table (
    org_plan_id uuid,
    org_id uuid,
    plan_name text,
    title text,
    description text,
    public boolean,
    draft boolean,
    start_time timestamptz,
    end_time timestamptz,
    locations jsonb,
    created_by jsonb,
    updated_by jsonb,
    created_at timestamptz,
    updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid;
    v_org_plan_id uuid;
begin
    v_user_id := public.get_user_id_from_auth();

    if v_user_id is null then
        raise exception 'User must be authenticated';
    end if;

    if not exists (
        select 1
        from public.org_membership om
        where om.org_id = p_org_id
          and om.user_id = v_user_id
          and lower(om.role) in ('owner', 'admin')
    ) then
        raise exception 'Only owners or admins can create plans';
    end if;

    if coalesce(trim(p_plan_name), '') = '' then
        raise exception 'Plan name is required';
    end if;

    if coalesce(trim(p_title), '') = '' then
        raise exception 'Title is required';
    end if;

    if p_start_time is null or p_end_time is null then
        raise exception 'Start and end times are required';
    end if;

    if p_start_time >= p_end_time then
        raise exception 'Start time must be before end time';
    end if;

    insert into public.org_plan (
        org_id,
        plan_name,
        title,
        description,
        public,
        draft,
        start_time,
        end_time,
        locations,
        created_by,
        updated_by
    )
    values (
        p_org_id,
        trim(p_plan_name),
        trim(p_title),
        coalesce(trim(p_description), ''),
        coalesce(p_public, false),
        coalesce(p_draft, false),
        p_start_time,
        p_end_time,
        coalesce(p_report_ids, '{}'::uuid[]),
        v_user_id,
        v_user_id
    )
    returning public.org_plan.org_plan_id
    into v_org_plan_id;

    return query
    select *
    from public.get_org_plans(p_org_id) as gp
    where gp.org_plan_id = v_org_plan_id;
end;
$$;