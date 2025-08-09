drop policy "Allow public appointment booking" on "public"."appointments";

drop policy "Allow public insert on appointments" on "public"."appointments";

drop policy "Service role can access all appointments" on "public"."appointments";

drop policy "Service role can do everything on appointments" on "public"."appointments";

alter table "public"."appointments" disable row level security;

create policy "Public can insert appointments"
on "public"."appointments"
as permissive
for insert
to anon, authenticated
with check (true);



