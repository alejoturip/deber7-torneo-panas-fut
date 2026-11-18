import { supabase } from './supabase';
import type { Equipo, Partido } from './tipos';

// ---------- Equipos ----------

export async function listarEquipos(): Promise<Equipo[]> {
  const { data, error } = await supabase.from('equipos').select('*').order('nombre');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function obtenerEquipo(id: number): Promise<Equipo> {
  const { data, error } = await supabase.from('equipos').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function crearEquipo(datos: { nombre: string; color: string | null }) {
  const { error } = await supabase.from('equipos').insert(datos);
  if (error) throw new Error(error.message);
}

export async function actualizarEquipo(id: number, datos: { nombre: string; color: string | null }) {
  const { error } = await supabase.from('equipos').update(datos).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function eliminarEquipo(id: number) {
  const { error } = await supabase.from('equipos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---------- Partidos ----------

export type DatosPartido = {
  equipo_local_id: number;
  equipo_visitante_id: number;
  goles_local: number | null;
  goles_visitante: number | null;
  fecha: string | null;
};

export async function listarPartidos(): Promise<Partido[]> {
  const { data, error } = await supabase
    .from('partidos')
    .select('*')
    .order('fecha', { ascending: false, nullsFirst: true })
    .order('id', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function obtenerPartido(id: number): Promise<Partido> {
  const { data, error } = await supabase.from('partidos').select('*').eq('id', id).single();
  if (error) throw new Error(error.message);
  return data;
}

export async function crearPartido(datos: DatosPartido) {
  const { error } = await supabase.from('partidos').insert(datos);
  if (error) throw new Error(error.message);
}

export async function actualizarPartido(id: number, datos: DatosPartido) {
  const { error } = await supabase.from('partidos').update(datos).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function eliminarPartido(id: number) {
  const { error } = await supabase.from('partidos').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
