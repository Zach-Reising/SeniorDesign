alter table public.org
add column member_count integer not null default 0;

update public.org o
set member_count = counts.member_count
from (
  select org_id, count(*)::integer as member_count
  from public.org_membership
  group by org_id
) counts
where o.org_id = counts.org_id;

update public.org
set member_count = 0
where member_count is null;

create or replace function public.handle_org_membership_count()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        update public.org
        set member_count = member_count + 1
        where org_id = NEW.org_id;

        return new;
    end if;

    if tg_op = 'DELETE' then
        update public.org
        set member_count = member_count - 1
        where org_id = OLD.org_id;
    
        return old;
    end if;

    if tg_op = 'UPDATE' then
        if old.org_id is distinct from new.org_id then
            update public.org
            set member_count = greatest(member_count - 1, 0)
            where org_id = old.org_id;

            update public.org
            set member_count = member_count + 1
            where org_id = new.org_id;
        end if;

        return new;
    end if;

    return null;
end;
$$ language plpgsql security definer;

drop trigger if exists org_membership_count_trigger on public.org_membership;

create trigger org_membership_count_trigger
after insert or delete or update on public.org_membership
for each row execute function public.handle_org_membership_count();