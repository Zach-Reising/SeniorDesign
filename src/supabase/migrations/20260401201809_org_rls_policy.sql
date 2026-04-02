create policy "authenticated users can create orgs"
on public.org
for insert
to authenticated
with check (get_user_id_from_auth() = org_owner);