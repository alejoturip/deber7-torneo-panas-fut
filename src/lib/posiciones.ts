import type { Equipo, FilaPosicion, Partido } from './tipos';

// Victoria 3 puntos, empate 1, derrota 0.
// Solo cuentan los partidos que ya tienen marcador.
export function calcularPosiciones(equipos: Equipo[], partidos: Partido[]): FilaPosicion[] {
  const filas = new Map<number, FilaPosicion>();
  for (const equipo of equipos) {
    filas.set(equipo.id, { equipo, pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0 });
  }

  for (const partido of partidos) {
    if (partido.goles_local === null || partido.goles_visitante === null) continue;
    const local = filas.get(partido.equipo_local_id);
    const visita = filas.get(partido.equipo_visitante_id);
    if (!local || !visita) continue;

    sumarResultado(local, partido.goles_local, partido.goles_visitante);
    sumarResultado(visita, partido.goles_visitante, partido.goles_local);
  }

  return [...filas.values()].sort(
    (a, b) =>
      b.pts - a.pts ||
      b.dg - a.dg ||
      b.gf - a.gf ||
      a.equipo.nombre.localeCompare(b.equipo.nombre),
  );
}

function sumarResultado(fila: FilaPosicion, aFavor: number, enContra: number) {
  fila.pj += 1;
  fila.gf += aFavor;
  fila.gc += enContra;
  fila.dg = fila.gf - fila.gc;
  if (aFavor > enContra) {
    fila.g += 1;
    fila.pts += 3;
  } else if (aFavor === enContra) {
    fila.e += 1;
    fila.pts += 1;
  } else {
    fila.p += 1;
  }
}
