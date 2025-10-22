create table "public"."crews" (
    "id" uuid not null default uuid_generate_v4(),
    "name" text not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."crews" enable row level security;

create table "public"."jobs" (
    "id" uuid not null default uuid_generate_v4(),
    "date" date not null default CURRENT_DATE,
    "job_name" text not null,
    "elevation" text,
    "lot_address" text,
    "yardage" numeric(10,2) not null,
    "rate" numeric(10,2) not null,
    "total" numeric(10,2) generated always as ((yardage * rate)) stored,
    "crew_id" uuid not null,
    "created_by" uuid not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."jobs" enable row level security;

create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "role" text not null default 'foreman'::text,
    "crew_id" uuid,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."profiles" enable row level security;

CREATE UNIQUE INDEX crews_name_key ON public.crews USING btree (name);

CREATE UNIQUE INDEX crews_pkey ON public.crews USING btree (id);

CREATE INDEX jobs_created_by_idx ON public.jobs USING btree (created_by);

CREATE INDEX jobs_crew_id_idx ON public.jobs USING btree (crew_id);

CREATE INDEX jobs_date_idx ON public.jobs USING btree (date DESC);

CREATE UNIQUE INDEX jobs_pkey ON public.jobs USING btree (id);

CREATE INDEX profiles_crew_id_idx ON public.profiles USING btree (crew_id);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."crews" add constraint "crews_pkey" PRIMARY KEY using index "crews_pkey";

alter table "public"."jobs" add constraint "jobs_pkey" PRIMARY KEY using index "jobs_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."crews" add constraint "crews_name_key" UNIQUE using index "crews_name_key";

alter table "public"."jobs" add constraint "jobs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."jobs" validate constraint "jobs_created_by_fkey";

alter table "public"."jobs" add constraint "jobs_crew_id_fkey" FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE RESTRICT not valid;

alter table "public"."jobs" validate constraint "jobs_crew_id_fkey";

alter table "public"."profiles" add constraint "profiles_crew_id_fkey" FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE SET NULL not valid;

alter table "public"."profiles" validate constraint "profiles_crew_id_fkey";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_role_check" CHECK ((role = ANY (ARRAY['admin'::text, 'foreman'::text]))) not valid;

alter table "public"."profiles" validate constraint "profiles_role_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.fn_get_my_crew()
 RETURNS crews
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ BEGIN RETURN (
    SELECT c.*
    FROM public.crews c
      INNER JOIN public.profiles p ON p.crew_id = c.id
    WHERE p.id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.fn_get_my_profile()
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$ BEGIN RETURN (
    SELECT *
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_crew_id()
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT crew_id
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN (
    SELECT role = 'admin'
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$function$
;

grant delete on table "public"."crews" to "anon";

grant insert on table "public"."crews" to "anon";

grant references on table "public"."crews" to "anon";

grant select on table "public"."crews" to "anon";

grant trigger on table "public"."crews" to "anon";

grant truncate on table "public"."crews" to "anon";

grant update on table "public"."crews" to "anon";

grant delete on table "public"."crews" to "authenticated";

grant insert on table "public"."crews" to "authenticated";

grant references on table "public"."crews" to "authenticated";

grant select on table "public"."crews" to "authenticated";

grant trigger on table "public"."crews" to "authenticated";

grant truncate on table "public"."crews" to "authenticated";

grant update on table "public"."crews" to "authenticated";

grant delete on table "public"."crews" to "service_role";

grant insert on table "public"."crews" to "service_role";

grant references on table "public"."crews" to "service_role";

grant select on table "public"."crews" to "service_role";

grant trigger on table "public"."crews" to "service_role";

grant truncate on table "public"."crews" to "service_role";

grant update on table "public"."crews" to "service_role";

grant delete on table "public"."jobs" to "anon";

grant insert on table "public"."jobs" to "anon";

grant references on table "public"."jobs" to "anon";

grant select on table "public"."jobs" to "anon";

grant trigger on table "public"."jobs" to "anon";

grant truncate on table "public"."jobs" to "anon";

grant update on table "public"."jobs" to "anon";

grant delete on table "public"."jobs" to "authenticated";

grant insert on table "public"."jobs" to "authenticated";

grant references on table "public"."jobs" to "authenticated";

grant select on table "public"."jobs" to "authenticated";

grant trigger on table "public"."jobs" to "authenticated";

grant truncate on table "public"."jobs" to "authenticated";

grant update on table "public"."jobs" to "authenticated";

grant delete on table "public"."jobs" to "service_role";

grant insert on table "public"."jobs" to "service_role";

grant references on table "public"."jobs" to "service_role";

grant select on table "public"."jobs" to "service_role";

grant trigger on table "public"."jobs" to "service_role";

grant truncate on table "public"."jobs" to "service_role";

grant update on table "public"."jobs" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

create policy "Admins can manage crews"
on "public"."crews"
as permissive
for all
to public
using (is_admin());


create policy "Admins can view all crews"
on "public"."crews"
as permissive
for select
to public
using (is_admin());


create policy "Foremen can view their own crew"
on "public"."crews"
as permissive
for select
to public
using ((get_my_crew_id() = id));


create policy "Admins can manage all jobs"
on "public"."jobs"
as permissive
for all
to public
using (is_admin());


create policy "Admins can view all jobs"
on "public"."jobs"
as permissive
for select
to public
using (is_admin());


create policy "Foremen can insert jobs for their crew"
on "public"."jobs"
as permissive
for insert
to public
with check ((get_my_crew_id() = crew_id));


create policy "Foremen can view their crew's jobs"
on "public"."jobs"
as permissive
for select
to public
using ((get_my_crew_id() = crew_id));


create policy "Admins can manage profiles"
on "public"."profiles"
as permissive
for all
to public
using (is_admin());


create policy "Admins can view all profiles"
on "public"."profiles"
as permissive
for select
to public
using (is_admin());


create policy "Users can view own profile"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


-- =====================================================
-- TRIGGER: Auto-create profile on user signup
-- =====================================================

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

