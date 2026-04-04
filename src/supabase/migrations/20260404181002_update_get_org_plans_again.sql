create or replace function public.get_org_plans(p_org_id uuid)
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
language sql
security definer
set search_path = public
as $$
    with me as (
        select public.get_user_id_from_auth() as user_id
    ),
    visible_plans as (
        select op.*
        from public.org_plan op
        cross join me
        where op.org_id = p_org_id
          and (
              (
                  op.draft is true
                  and me.user_id is not null
                  and op.created_by = me.user_id
              )
              or
              (
                  coalesce(op.draft, false) is false
                  and (
                      op.public is true
                      or (
                          me.user_id is not null
                          and exists (
                              select 1
                              from public.org_membership om
                              where om.org_id = op.org_id
                                and om.user_id = me.user_id
                          )
                      )
                  )
              )
          )
    )
    select
        op.org_plan_id,
        op.org_id,
        op.plan_name,
        op.title,
        op.description,
        op.public,
        op.draft,
        op.start_time,
        op.end_time,

        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'l_id', r.report_id,
                        'l_name', r.name,
                        'latitude', rv.latitude,
                        'longitude', rv.longitude,
                        'severity', r.severity,
                        'report_type', r.report_type,
                        'status', r.status
                    )
                    order by r.name
                )
                from unnest(coalesce(op.locations, '{}'::uuid[])) as loc(report_id)
                join public.reports r
                    on r.report_id = loc.report_id
                left join public.reports_view rv
                    on rv.report_id = r.report_id
            ),
            '[]'::jsonb
        ) as locations,

        jsonb_build_object(
            'id', cu.id,
            'email', cu.email,
            'first_name', cu.first_name,
            'last_name', cu.last_name
        ) as created_by,

        jsonb_build_object(
            'id', uu.id,
            'email', uu.email,
            'first_name', uu.first_name,
            'last_name', uu.last_name
        ) as updated_by,

        op.created_at,
        op.updated_at
    from visible_plans op
    left join public.users cu
        on cu.id = op.created_by
    left join public.users uu
        on uu.id = op.updated_by
    order by op.start_time asc;
$$;