create or replace function public.update_org_plan(
    p_org_plan_id uuid,
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
    v_org_id uuid;
    v_created_by uuid;
    v_draft boolean;
begin
    v_user_id := public.get_user_id_from_auth();

    if v_user_id is null then
        raise exception 'User must be authenticated';
    end if;

    select
        op.org_id,
        op.created_by,
        op.draft
    into
        v_org_id,
        v_created_by,
        v_draft
    from public.org_plan op
    where op.org_plan_id = p_org_plan_id;

    if v_org_id is null then
        raise exception 'Plan not found';
    end if;

    if not (
        (
            coalesce(v_draft, false) is true
            and v_created_by = v_user_id
        )
        or exists (
            select 1
            from public.org_membership om
            where om.org_id = v_org_id
              and om.user_id = v_user_id
              and lower(om.role) in ('owner', 'admin')
        )
    ) then
        raise exception 'You do not have permission to edit this plan';
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

    update public.org_plan
    set
        plan_name = trim(p_plan_name),
        title = trim(p_title),
        description = coalesce(trim(p_description), ''),
        public = coalesce(p_public, false),
        draft = coalesce(p_draft, false),
        start_time = p_start_time,
        end_time = p_end_time,
        locations = coalesce(p_report_ids, '{}'::uuid[]),
        updated_by = v_user_id,
        updated_at = now()
    where public.org_plan.org_plan_id = p_org_plan_id;

    return query
    select *
    from public.get_org_plan(v_org_id) as gp
    where gp.org_plan_id = p_org_plan_id;
end;
$$;