create table "public"."trades" (
    "id" uuid not null default uuid_generate_v4(),
    "trade_name" text not null,
    "department_id" text,
    "description" text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."trades" enable row level security;

alter table "public"."crews" add column "trade_id" uuid;

CREATE INDEX idx_crews_trade_id ON public.crews USING btree (trade_id);

CREATE INDEX idx_trades_trade_name ON public.trades USING btree (trade_name);

CREATE UNIQUE INDEX trades_pkey ON public.trades USING btree (id);

CREATE UNIQUE INDEX trades_trade_name_key ON public.trades USING btree (trade_name);

alter table "public"."trades" add constraint "trades_pkey" PRIMARY KEY using index "trades_pkey";

alter table "public"."crews" add constraint "crews_trade_id_fkey" FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE RESTRICT not valid;

alter table "public"."crews" validate constraint "crews_trade_id_fkey";

alter table "public"."trades" add constraint "trades_trade_name_key" UNIQUE using index "trades_trade_name_key";

grant delete on table "public"."trades" to "anon";

grant insert on table "public"."trades" to "anon";

grant references on table "public"."trades" to "anon";

grant select on table "public"."trades" to "anon";

grant trigger on table "public"."trades" to "anon";

grant truncate on table "public"."trades" to "anon";

grant update on table "public"."trades" to "anon";

grant delete on table "public"."trades" to "authenticated";

grant insert on table "public"."trades" to "authenticated";

grant references on table "public"."trades" to "authenticated";

grant select on table "public"."trades" to "authenticated";

grant trigger on table "public"."trades" to "authenticated";

grant truncate on table "public"."trades" to "authenticated";

grant update on table "public"."trades" to "authenticated";

grant delete on table "public"."trades" to "service_role";

grant insert on table "public"."trades" to "service_role";

grant references on table "public"."trades" to "service_role";

grant select on table "public"."trades" to "service_role";

grant trigger on table "public"."trades" to "service_role";

grant truncate on table "public"."trades" to "service_role";

grant update on table "public"."trades" to "service_role";

create policy "Admins can manage all trades"
on "public"."trades"
as permissive
for all
to authenticated
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))));


create policy "All authenticated users can view trades"
on "public"."trades"
as permissive
for select
to authenticated
using (true);



