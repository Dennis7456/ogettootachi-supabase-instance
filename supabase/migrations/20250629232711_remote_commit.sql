-- drop policy "Admins can insert documents" on "public"."documents";

-- drop policy "Admins can update documents" on "public"."documents";

-- drop policy "Service role can insert profiles" on "public"."profiles";

-- drop policy "Service role can view profiles" on "public"."profiles";

-- drop policy "Users can insert their own profile" on "public"."profiles";

drop function if exists "public"."create_user_profile"(user_id uuid, first_name text, last_name text, user_role text);

alter table "public"."profiles" drop column "first_name";

alter table "public"."profiles" drop column "last_name";

alter table "public"."profiles" add column "full_name" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', 'user');
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_rls_enabled(table_name text)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_tables 
    WHERE tablename = table_name 
    AND rowsecurity = true
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_vector_extension()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'vector'
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_document_processing()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Only process if embedding is null
  IF NEW.embedding IS NULL THEN
    RAISE LOG 'Document processing triggered for ID: %, Content: %', NEW.id, LEFT(NEW.content, 100);
    INSERT INTO document_processing_queue (document_id, content, created_at)
    VALUES (NEW.id, NEW.content, NOW())
    ON CONFLICT (document_id) DO UPDATE SET
      content = EXCLUDED.content,
      created_at = NOW(),
      processed = false;
  END IF;
  RETURN NEW;
END;
$function$
;

create policy "Authenticated users can insert documents"
on "public"."documents"
as permissive
for insert
to public
with check ((auth.role() = 'authenticated'::text));


create policy "Authenticated users can update documents"
on "public"."documents"
as permissive
for update
to public
using ((auth.role() = 'authenticated'::text));



