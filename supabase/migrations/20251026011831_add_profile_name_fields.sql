alter table "public"."profiles" drop column "full_name";

alter table "public"."profiles" add column "first_name" text;

alter table "public"."profiles" add column "last_name" text;

alter table "public"."profiles" add column "phone_number" text;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone_number', NULL)
  );
  RETURN NEW;
END;
$function$
;

create policy "Users can update own profile fields"
on "public"."profiles"
as permissive
for update
to authenticated
using ((auth.uid() = id))
with check ((auth.uid() = id));



