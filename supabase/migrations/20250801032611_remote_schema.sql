create policy "Authenticated users can delete their profile picture"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))));


create policy "Authenticated users can read profile pictures"
on "storage"."objects"
as permissive
for select
to authenticated
using ((bucket_id = 'profile-pictures'::text));


create policy "Authenticated users can update their profile picture"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))))
with check (((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))));


create policy "Authenticated users can upload professional images"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'professional-images'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))));


create policy "Authenticated users can upload their profile picture"
on "storage"."objects"
as permissive
for insert
to authenticated
with check (((bucket_id = 'profile-pictures'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))));


create policy "Public can read profile pictures"
on "storage"."objects"
as permissive
for select
to anon
using ((bucket_id = 'profile-pictures'::text));


create policy "Public can view professional images"
on "storage"."objects"
as permissive
for select
to public
using ((bucket_id = 'professional-images'::text));


create policy "Users can delete their own professional images"
on "storage"."objects"
as permissive
for delete
to authenticated
using (((bucket_id = 'professional-images'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))));


create policy "Users can update their own professional images"
on "storage"."objects"
as permissive
for update
to authenticated
using (((bucket_id = 'professional-images'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))))
with check (((bucket_id = 'professional-images'::text) AND ((auth.uid())::text = split_part(name, '/'::text, 1))));



