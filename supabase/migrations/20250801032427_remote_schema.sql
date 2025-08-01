alter table "public"."appointments" drop column "appointment_type";

alter table "public"."profiles" add column "areas_of_practice" text[] default '{}'::text[];

alter table "public"."profiles" add column "certifications" text[] default '{}'::text[];

alter table "public"."profiles" add column "education" jsonb default '{}'::jsonb;

alter table "public"."profiles" add column "memberships" text[] default '{}'::text[];

alter table "public"."profiles" add column "personal_story" text default ''::text;

alter table "public"."profiles" add column "profile_picture" text default ''::text;

alter table "public"."profiles" add column "title" text not null default ''::text;

alter table "public"."user_invitations" add column "token" text not null default ''::text;


