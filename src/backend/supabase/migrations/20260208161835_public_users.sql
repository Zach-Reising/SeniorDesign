create table if not exists public.users (
    id uuid not null primary key default gen_random_uuid(),
    auth_id uuid unique references auth.users(id), -- This is nullable so we can create a generic supabase user if needed for operations like cron jobs
    email text not null unique,
    first_name text,
    last_name text,
    role text not null default 'user',
    created_at timestamptz not null default (now() at time zone 'utc'::text),
    updated_at timestamptz not null default (now() at time zone 'utc'::text),
    active boolean not null default true
);

create or replace function public.sync_users_if_empty()
returns void as $$
begin
    if (select count(*) from public.users) = 0 and (select count(*) from auth.users) > 0 then
        insert into public.users (auth_id, email, created_at, updated_at)
        select id, email, created_at, updated_at from auth.users
        on conflict (auth_id) do nothing;
    end if;
end;
$$ language plpgsql security definer;

-- Trigger function to sync public.users with auth.users
create or replace function public.sync_auth_users()
returns trigger as $$
begin
    -- Handle insert or update operations
    if (TG_OP = 'INSERT') then
        insert into public.users (auth_id, email, created_at, updated_at)
        values (new.id, new.email, new.created_at, new.updated_at)
        on conflict (auth_id) do nothing;
        return new;
    elsif (TG_OP = 'UPDATE') then
        update public.users
        set email = new.email,
            updated_at = new.updated_at
        where auth_id = new.id;
        return new;
    elsif (TG_OP = 'DELETE') then
        update public.users
        set active = false,
            updated_at = (now() at time zone 'utc'::text)
        where auth_id = old.id;
        return old;
    end if;
end;
$$ language plpgsql security definer;

create trigger trg_sync_auth_users
after insert or update or delete on auth.users
for each row execute function public.sync_auth_users();


-- Immediately call this function when the migration is applied to make sure all users are caught
select public.sync_users_if_empty();

-- Drop the fucntion once it is finished
drop function if exists public.sync_users_if_empty();

-- Enable RLS on the users table
alter table public.users enable row level security;

-- Create a policy for the users table
create policy "Users can view their own data"
    on public.users
    for select
    to authenticated
    using ( auth.uid() = public.users.auth_id);

-- Create a policy for the users table
create policy "Users can update their own data"
    on public.users
    for update
    to authenticated
    using ( auth.uid() = public.users.auth_id);

-- Function to make sure a user can update their first and last name but nothing else
create or replace function protect_user_columns()
returns trigger as $$
begin
    if current_settings('role', true) = 'authenticated' then
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

create trigger protect_user_columns_trigger
before update on public.users
for each row execute function protect_user_columns();

-- Create an index on auth id for faster lookups
create index if not exists idx_users_auth_id
    on public.users
    using btree (auth_id);

-- Revoke permissions from authenticated role
revoke insert, delete, trigger, truncate, references on public.users from authenticated;

-- Revoke all permissions from anon role (anonymous) for security
revoke all privileges on all tables in schema public from anon;

-- Insert a generic user for system operations
insert into public.users (id, auth_id, email, role)
values (gen_random_uuid(), null, 'system@supa.base', 'admin');

-- Function to get User Id from auth.uid()
create or replace function public.get_user_id_from_auth()
returns uuid as $$
begin
    return coalesce(
        (select id from public.users where auth_id = auth.uid()),
        (select id from public.users where email = 'system@supa.base')
    );
end;
$$ language plpgsql set search_path = '';