drop policy "Admins can manage all jobs" on "public"."jobs";

drop policy "Admins can view all jobs" on "public"."jobs";

drop policy "Foremen can insert jobs for their crew" on "public"."jobs";

drop policy "Foremen can view their crew's jobs" on "public"."jobs";

alter table "public"."jobs" drop constraint "jobs_created_by_fkey";

alter table "public"."jobs" drop constraint "jobs_crew_id_fkey";

alter table "public"."jobs" drop constraint "jobs_pkey";

drop index if exists "public"."jobs_created_by_idx";

drop index if exists "public"."jobs_crew_id_idx";

drop index if exists "public"."jobs_date_idx";

drop index if exists "public"."jobs_pkey";

create table "public"."job_elevations" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "elevation_name" text not null,
    "yardage" numeric(10,2) not null,
    "rate" numeric(10,2) not null,
    "total" numeric(10,2) generated always as ((yardage * rate)) stored,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."job_elevations" enable row level security;

create table "public"."job_logs" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "elevation_id" uuid not null,
    "lot" text,
    "date_worked" date not null default CURRENT_DATE,
    "crew_id" uuid not null,
    "created_by" uuid not null,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."job_logs" enable row level security;

create table "public"."jobs_old" (
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


alter table "public"."jobs_old" enable row level security;

alter table "public"."jobs" drop column "created_by";

alter table "public"."jobs" drop column "crew_id";

alter table "public"."jobs" drop column "date";

alter table "public"."jobs" drop column "elevation";

alter table "public"."jobs" drop column "lot_address";

alter table "public"."jobs" drop column "notes";

-- Drop generated column first before dropping its dependencies
alter table "public"."jobs" drop column "total";

alter table "public"."jobs" drop column "rate";

alter table "public"."jobs" drop column "yardage";

alter table "public"."jobs" add column "active" boolean default true;

alter table "public"."jobs" alter column "created_at" drop not null;

alter table "public"."jobs" alter column "id" set default gen_random_uuid();

alter table "public"."jobs" alter column "updated_at" drop not null;

CREATE INDEX idx_job_elevations_job_id ON public.job_elevations USING btree (job_id);

CREATE INDEX idx_job_logs_created_by ON public.job_logs USING btree (created_by);

CREATE INDEX idx_job_logs_crew_id ON public.job_logs USING btree (crew_id);

CREATE INDEX idx_job_logs_date_worked ON public.job_logs USING btree (date_worked DESC);

CREATE INDEX idx_job_logs_elevation_id ON public.job_logs USING btree (elevation_id);

CREATE INDEX idx_job_logs_job_id ON public.job_logs USING btree (job_id);

CREATE INDEX idx_jobs_active ON public.jobs USING btree (active);

CREATE INDEX idx_jobs_job_name ON public.jobs USING btree (job_name);

CREATE UNIQUE INDEX job_elevations_job_id_elevation_name_key ON public.job_elevations USING btree (job_id, elevation_name);

CREATE UNIQUE INDEX job_elevations_pkey ON public.job_elevations USING btree (id);

CREATE UNIQUE INDEX job_logs_pkey ON public.job_logs USING btree (id);

CREATE UNIQUE INDEX jobs_pkey1 ON public.jobs USING btree (id);

CREATE INDEX jobs_created_by_idx ON public.jobs_old USING btree (created_by);

CREATE INDEX jobs_crew_id_idx ON public.jobs_old USING btree (crew_id);

CREATE INDEX jobs_date_idx ON public.jobs_old USING btree (date DESC);

CREATE UNIQUE INDEX jobs_pkey ON public.jobs_old USING btree (id);

alter table "public"."job_elevations" add constraint "job_elevations_pkey" PRIMARY KEY using index "job_elevations_pkey";

alter table "public"."job_logs" add constraint "job_logs_pkey" PRIMARY KEY using index "job_logs_pkey";

alter table "public"."jobs" add constraint "jobs_pkey1" PRIMARY KEY using index "jobs_pkey1";

alter table "public"."jobs_old" add constraint "jobs_pkey" PRIMARY KEY using index "jobs_pkey";

alter table "public"."job_elevations" add constraint "job_elevations_job_id_elevation_name_key" UNIQUE using index "job_elevations_job_id_elevation_name_key";

alter table "public"."job_elevations" add constraint "job_elevations_job_id_fkey" FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE not valid;

alter table "public"."job_elevations" validate constraint "job_elevations_job_id_fkey";

alter table "public"."job_elevations" add constraint "job_elevations_rate_check" CHECK ((rate > (0)::numeric)) not valid;

alter table "public"."job_elevations" validate constraint "job_elevations_rate_check";

alter table "public"."job_elevations" add constraint "job_elevations_yardage_check" CHECK ((yardage > (0)::numeric)) not valid;

alter table "public"."job_elevations" validate constraint "job_elevations_yardage_check";

alter table "public"."job_logs" add constraint "job_logs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) not valid;

alter table "public"."job_logs" validate constraint "job_logs_created_by_fkey";

alter table "public"."job_logs" add constraint "job_logs_crew_id_fkey" FOREIGN KEY (crew_id) REFERENCES crews(id) not valid;

alter table "public"."job_logs" validate constraint "job_logs_crew_id_fkey";

alter table "public"."job_logs" add constraint "job_logs_elevation_id_fkey" FOREIGN KEY (elevation_id) REFERENCES job_elevations(id) not valid;

alter table "public"."job_logs" validate constraint "job_logs_elevation_id_fkey";

alter table "public"."job_logs" add constraint "job_logs_job_id_fkey" FOREIGN KEY (job_id) REFERENCES jobs(id) not valid;

alter table "public"."job_logs" validate constraint "job_logs_job_id_fkey";

alter table "public"."jobs_old" add constraint "jobs_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE RESTRICT not valid;

alter table "public"."jobs_old" validate constraint "jobs_created_by_fkey";

alter table "public"."jobs_old" add constraint "jobs_crew_id_fkey" FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE RESTRICT not valid;

alter table "public"."jobs_old" validate constraint "jobs_crew_id_fkey";

grant delete on table "public"."job_elevations" to "anon";

grant insert on table "public"."job_elevations" to "anon";

grant references on table "public"."job_elevations" to "anon";

grant select on table "public"."job_elevations" to "anon";

grant trigger on table "public"."job_elevations" to "anon";

grant truncate on table "public"."job_elevations" to "anon";

grant update on table "public"."job_elevations" to "anon";

grant delete on table "public"."job_elevations" to "authenticated";

grant insert on table "public"."job_elevations" to "authenticated";

grant references on table "public"."job_elevations" to "authenticated";

grant select on table "public"."job_elevations" to "authenticated";

grant trigger on table "public"."job_elevations" to "authenticated";

grant truncate on table "public"."job_elevations" to "authenticated";

grant update on table "public"."job_elevations" to "authenticated";

grant delete on table "public"."job_elevations" to "service_role";

grant insert on table "public"."job_elevations" to "service_role";

grant references on table "public"."job_elevations" to "service_role";

grant select on table "public"."job_elevations" to "service_role";

grant trigger on table "public"."job_elevations" to "service_role";

grant truncate on table "public"."job_elevations" to "service_role";

grant update on table "public"."job_elevations" to "service_role";

grant delete on table "public"."job_logs" to "anon";

grant insert on table "public"."job_logs" to "anon";

grant references on table "public"."job_logs" to "anon";

grant select on table "public"."job_logs" to "anon";

grant trigger on table "public"."job_logs" to "anon";

grant truncate on table "public"."job_logs" to "anon";

grant update on table "public"."job_logs" to "anon";

grant delete on table "public"."job_logs" to "authenticated";

grant insert on table "public"."job_logs" to "authenticated";

grant references on table "public"."job_logs" to "authenticated";

grant select on table "public"."job_logs" to "authenticated";

grant trigger on table "public"."job_logs" to "authenticated";

grant truncate on table "public"."job_logs" to "authenticated";

grant update on table "public"."job_logs" to "authenticated";

grant delete on table "public"."job_logs" to "service_role";

grant insert on table "public"."job_logs" to "service_role";

grant references on table "public"."job_logs" to "service_role";

grant select on table "public"."job_logs" to "service_role";

grant trigger on table "public"."job_logs" to "service_role";

grant truncate on table "public"."job_logs" to "service_role";

grant update on table "public"."job_logs" to "service_role";

grant delete on table "public"."jobs_old" to "anon";

grant insert on table "public"."jobs_old" to "anon";

grant references on table "public"."jobs_old" to "anon";

grant select on table "public"."jobs_old" to "anon";

grant trigger on table "public"."jobs_old" to "anon";

grant truncate on table "public"."jobs_old" to "anon";

grant update on table "public"."jobs_old" to "anon";

grant delete on table "public"."jobs_old" to "authenticated";

grant insert on table "public"."jobs_old" to "authenticated";

grant references on table "public"."jobs_old" to "authenticated";

grant select on table "public"."jobs_old" to "authenticated";

grant trigger on table "public"."jobs_old" to "authenticated";

grant truncate on table "public"."jobs_old" to "authenticated";

grant update on table "public"."jobs_old" to "authenticated";

grant delete on table "public"."jobs_old" to "service_role";

grant insert on table "public"."jobs_old" to "service_role";

grant references on table "public"."jobs_old" to "service_role";

grant select on table "public"."jobs_old" to "service_role";

grant trigger on table "public"."jobs_old" to "service_role";

grant truncate on table "public"."jobs_old" to "service_role";

grant update on table "public"."jobs_old" to "service_role";

create policy "Admin full access to elevations"
on "public"."job_elevations"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Foreman and worker read elevations"
on "public"."job_elevations"
as permissive
for select
to public
using (true);


create policy "Admin delete job logs"
on "public"."job_logs"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Foreman create logs for own crew"
on "public"."job_logs"
as permissive
for insert
to public
with check ((crew_id IN ( SELECT profiles.crew_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))));


create policy "Users read own crew logs"
on "public"."job_logs"
as permissive
for select
to public
using (((crew_id IN ( SELECT profiles.crew_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))));


create policy "Admin full access to jobs"
on "public"."jobs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Foreman read active jobs"
on "public"."jobs"
as permissive
for select
to public
using ((active = true));


create policy "Admins can manage all jobs"
on "public"."jobs_old"
as permissive
for all
to public
using (is_admin());


create policy "Admins can view all jobs"
on "public"."jobs_old"
as permissive
for select
to public
using (is_admin());


create policy "Foremen can insert jobs for their crew"
on "public"."jobs_old"
as permissive
for insert
to public
with check ((get_my_crew_id() = crew_id));


create policy "Foremen can view their crew's jobs"
on "public"."jobs_old"
as permissive
for select
to public
using ((get_my_crew_id() = crew_id));



