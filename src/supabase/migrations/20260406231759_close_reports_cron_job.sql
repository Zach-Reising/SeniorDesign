create or replace function public.close_expired_reports_from_org_plan()
returns void
as $$
begin
    update public.reports r
    set status = 'closed'
    from (
        select distinct unnest(o.locations) as report_id
        from public.org_plan o
        where o.end_time <= now()
            and coalesce(array_length(o.locations, 1), 0) > 0
    ) expired
    where r.report_id = expired.report_id
    and r.status is distinct from 'closed';
end;
$$
language plpgsql security definer set search_path = public;

revoke all on function public.close_expired_reports_from_org_plan() from public;
grant execute on function public.close_expired_reports_from_org_plan() to postgres;

select cron.schedule(
    'close-expired-reports-from-org-plan',
    '*/5 * * * *',
    $$select public.close_expired_reports_from_org_plan();$$
);