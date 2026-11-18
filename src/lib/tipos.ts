export type Equipo = {
  id: number;
  nombre: string;
  color: string | null;
  created_at: string;
};

export type Partido = {
  id: number;
  equipo_local_id: number;
  equipo_visitante_id: number;
  goles_local: number | null;
  goles_visitante: number | null;
  fecha: string | null;
  created_at: string;
};

export type FilaPosicion = {
  equipo: Equipo;
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};
