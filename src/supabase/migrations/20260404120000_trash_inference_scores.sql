alter table if exists public.images
  add column if not exists inference_status text not null default 'pending',
  add column if not exists trash_coverage double precision,
  add column if not exists trash_instances integer,
  add column if not exists inference_error text,
  add column if not exists processed_at timestamptz;

do $$
begin
  if to_regclass('public.images') is not null then
    update public.images
    set inference_status = 'pending'
    where inference_status is null;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'images_inference_status_check'
  ) then
    alter table public.images
      add constraint images_inference_status_check
      check (inference_status in ('pending', 'processing', 'completed', 'failed'));
  end if;
end;
$$;

create index if not exists images_inference_status_created_at_idx
  on public.images(inference_status, created_at);

alter table if exists public.reports
  add column if not exists avg_trash_coverage double precision,
  add column if not exists avg_trash_instances double precision,
  add column if not exists scored_image_count integer not null default 0,
  add column if not exists trash_coverage_rank integer,
  add column if not exists trash_instances_rank integer,
  add column if not exists trash_updated_at timestamptz;
