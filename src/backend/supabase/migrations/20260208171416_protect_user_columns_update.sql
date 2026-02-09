-- Function to make sure a user can update their first and last name but nothing else
create or replace function protect_user_columns()
returns trigger as $$
begin
    if current_settings('role') = 'authenticated' then
        If OLD.email <> NEW.email or
            OLD.role <> NEW.role or
            OLD.active <> NEW.active or 
            OLD.auth_id <> NEW.auth_id then
            RAISE EXCEPTION 'You cannot modify these fields';
        end if;
    end if;
    NEW.updated_at = now() at time zone 'utc';
    return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_user_columns_trigger on public.users;

create trigger protect_user_columns_trigger
before update on public.users
for each row execute function public.protect_user_columns();