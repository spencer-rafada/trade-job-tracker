alter table "public"."profiles" drop constraint "profiles_role_check";

alter table "public"."profiles" alter column "role" set default 'worker'::text;

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'foreman'::text, 'worker'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";


