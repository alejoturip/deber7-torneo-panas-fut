-- Tablas equipos y partidos (ver docs/base-de-datos.md)

create table public.equipos (
  id bigint generated always as identity primary key,
  nombre text not null unique,
  color text,
  created_at timestamptz not null default now()
);

create table public.partidos (
  id bigint generated always as identity primary key,
  equipo_local_id bigint not null references public.equipos (id) on delete cascade,
  equipo_visitante_id bigint not null references public.equipos (id) on delete cascade,
  goles_local integer check (goles_local >= 0),
  goles_visitante integer check (goles_visitante >= 0),
  fecha date,
  created_at timestamptz not null default now(),
  constraint partidos_equipos_distintos check (equipo_local_id <> equipo_visitante_id)
);

create index partidos_equipo_local_id_idx on public.partidos (equipo_local_id);
create index partidos_equipo_visitante_id_idx on public.partidos (equipo_visitante_id);

-- RLS: la app no tiene login, así que el rol anon tiene acceso completo.
alter table public.equipos enable row level security;
alter table public.partidos enable row level security;

create policy "anon select equipos" on public.equipos for select to anon using (true);
create policy "anon insert equipos" on public.equipos for insert to anon with check (true);
create policy "anon update equipos" on public.equipos for update to anon using (true) with check (true);
create policy "anon delete equipos" on public.equipos for delete to anon using (true);

create policy "anon select partidos" on public.partidos for select to anon using (true);
create policy "anon insert partidos" on public.partidos for insert to anon with check (true);
create policy "anon update partidos" on public.partidos for update to anon using (true) with check (true);
create policy "anon delete partidos" on public.partidos for delete to anon using (true);
