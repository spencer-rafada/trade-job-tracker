create table "public"."hours" (
    "id" uuid not null default uuid_generate_v4(),
    "worker_id" uuid not null,
    "date_worked" date not null,
    "hours_worked" numeric not null,
    "notes" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."hours" enable row level security;

CREATE UNIQUE INDEX hours_pkey ON public.hours USING btree (id);

CREATE INDEX idx_hours_date_worked ON public.hours USING btree (date_worked);

CREATE INDEX idx_hours_worker_date ON public.hours USING btree (worker_id, date_worked);

CREATE INDEX idx_hours_worker_id ON public.hours USING btree (worker_id);

alter table "public"."hours" add constraint "hours_pkey" PRIMARY KEY using index "hours_pkey";

alter table "public"."hours" add constraint "hours_hours_worked_check" CHECK ((hours_worked > (0)::numeric)) not valid;

alter table "public"."hours" validate constraint "hours_hours_worked_check";

alter table "public"."hours" add constraint "hours_worker_id_fkey" FOREIGN KEY (worker_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."hours" validate constraint "hours_worker_id_fkey";

grant delete on table "public"."hours" to "anon";

grant insert on table "public"."hours" to "anon";

grant references on table "public"."hours" to "anon";

grant select on table "public"."hours" to "anon";

grant trigger on table "public"."hours" to "anon";

grant truncate on table "public"."hours" to "anon";

grant update on table "public"."hours" to "anon";

grant delete on table "public"."hours" to "authenticated";

grant insert on table "public"."hours" to "authenticated";

grant references on table "public"."hours" to "authenticated";

grant select on table "public"."hours" to "authenticated";

grant trigger on table "public"."hours" to "authenticated";

grant truncate on table "public"."hours" to "authenticated";

grant update on table "public"."hours" to "authenticated";

grant delete on table "public"."hours" to "service_role";

grant insert on table "public"."hours" to "service_role";

grant references on table "public"."hours" to "service_role";

grant select on table "public"."hours" to "service_role";

grant trigger on table "public"."hours" to "service_role";

grant truncate on table "public"."hours" to "service_role";

grant update on table "public"."hours" to "service_role";

create policy "Admins can manage all hours"
on "public"."hours"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "Foremen can view their crew members hours"
on "public"."hours"
as permissive
for select
to authenticated
using ((EXISTS ( SELECT 1
   FROM (profiles p
     JOIN profiles worker ON ((worker.id = hours.worker_id)))
  WHERE ((p.id = auth.uid()) AND (p.role = 'foreman'::text) AND (p.crew_id IS NOT NULL) AND (p.crew_id = worker.crew_id)))));


create policy "Workers can delete their own hours"
on "public"."hours"
as permissive
for delete
to authenticated
using ((auth.uid() = worker_id));


create policy "Workers can insert their own hours"
on "public"."hours"
as permissive
for insert
to authenticated
with check ((auth.uid() = worker_id));


create policy "Workers can update their own hours"
on "public"."hours"
as permissive
for update
to authenticated
using ((auth.uid() = worker_id))
with check ((auth.uid() = worker_id));


create policy "Workers can view their own hours"
on "public"."hours"
as permissive
for select
to authenticated
using ((auth.uid() = worker_id));



