create policy "Users can leave organizations by deleting their own membership"
on public.org_membership
for delete
to authenticated
using (
    user_id = public.get_user_id_from_auth()
);