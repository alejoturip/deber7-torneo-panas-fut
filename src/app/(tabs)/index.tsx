import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Boton, Camiseta, ErrorTexto, Escudo, Medalla, Vacio, estilos } from '@/components/ui';
import { listarEquipos, listarPartidos } from '@/lib/api';
import { tema } from '@/lib/colores';
import { calcularPosiciones } from '@/lib/posiciones';
import type { FilaPosicion } from '@/lib/tipos';

const columnas = ['PJ', 'G', 'E', 'P', 'DG'] as const;

// Evita que un nombre de equipo con <, > o & rompa el HTML impreso
function escaparHtml(texto: string) {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function armarHtml(filas: FilaPosicion[]) {
  const hoy = new Date().toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' });
  const cuerpo = filas
    .map(
      (f, i) => `
        <tr>
          <td>${i + 1}</td>
          <td class="equipo">${escaparHtml(f.equipo.nombre)}</td>
          <td>${f.pj}</td>
          <td>${f.g}</td>
          <td>${f.e}</td>
          <td>${f.p}</td>
          <td>${f.dg > 0 ? `+${f.dg}` : f.dg}</td>
          <td><b>${f.pts}</b></td>
        </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      @page { margin: 24px; }
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #1a1a1a; }
      h1 { margin: 0 0 4px; font-size: 26px; }
      .fecha { margin: 0 0 20px; color: #666; font-size: 14px; }
      table { width: 100%; border-collapse: collapse; font-size: 14px; }
      th, td { padding: 8px 6px; border-bottom: 1px solid #ddd; text-align: center; }
      th { background: #f1f5f0; font-size: 12px; }
      .equipo { text-align: left; }
    </style>
  </head>
  <body>
    <h1>Torneo entre Panas</h1>
    <p class="fecha">${hoy}</p>
    <table>
      <thead>
        <tr><th>#</th><th class="equipo">Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th></tr>
      </thead>
      <tbody>${cuerpo}</tbody>
    </table>
  </body>
</html>`;
}

export default function PosicionesScreen() {
  const [filas, setFilas] = useState<FilaPosicion[]>([]);
  const [jugados, setJugados] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imprimiendo, setImprimiendo] = useState(false);

  async function imprimir() {
    setImprimiendo(true);
    try {
      await Print.printAsync({ html: armarHtml(filas) });
    } catch {
      // En iOS printAsync falla si se cierra la ventana de impresión sin imprimir: no es un error real
    } finally {
      setImprimiendo(false);
    }
  }

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [equipos, partidos] = await Promise.all([listarEquipos(), listarPartidos()]);
      setFilas(calcularPosiciones(equipos, partidos));
      setJugados(partidos.filter((p) => p.goles_local !== null && p.goles_visitante !== null).length);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la tabla');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const lider = filas[0];
  const goles = filas.reduce((suma, f) => suma + f.gf, 0);

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={[estilos.contenido, { paddingBottom: 32 }]}
      refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={tema.verde} />}>
      <ErrorTexto texto={error} />

      {filas.length === 0 && !cargando ? (
        <Vacio texto="Todavía no hay equipos. Agrega uno en la pestaña Equipos." />
      ) : lider ? (
        <>
          <Animated.View entering={FadeInDown.duration(450)} style={s.heroe}>
            <LinearGradient
              colors={['#1B7F3B', '#2E9E55']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.heroeDegradado}>
              <View style={s.circulo} />
              <View style={[s.circulo, s.circuloChico]} />
              <Text style={s.heroeEtiqueta}>{jugados > 0 ? '🏆  LÍDER DEL TORNEO' : '⚽  TODAVÍA NO HAY LÍDER'}</Text>
              {jugados > 0 && (
                <View style={s.heroeFila}>
                  <Escudo nombre={lider.equipo.nombre} color={lider.equipo.color} tam={58} />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={s.heroeNombre}>
                      {lider.equipo.nombre}
                    </Text>
                    <Text style={s.heroeDetalle}>
                      {lider.g}G · {lider.e}E · {lider.p}P · DG {lider.dg > 0 ? `+${lider.dg}` : lider.dg}
                    </Text>
                  </View>
                  <View style={s.heroePuntos}>
                    <Text style={s.heroePuntosNumero}>{lider.pts}</Text>
                    <Text style={s.heroePuntosTexto}>PTS</Text>
                  </View>
                </View>
              )}
              <View style={s.heroePie}>
                <Text style={s.heroePieTexto}>{filas.length} equipos</Text>
                <Text style={s.heroePieTexto}>{jugados} partidos jugados</Text>
                <Text style={s.heroePieTexto}>{goles} goles</Text>
              </View>
            </LinearGradient>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).duration(450)} style={[estilos.tarjeta, { padding: 0, overflow: 'hidden' }]}>
            <View style={[s.fila, s.encabezado]}>
              <Text style={[s.pos, s.textoEncabezado]}>#</Text>
              <Text style={[s.equipo, s.textoEncabezado]}>Equipo</Text>
              {columnas.map((c) => (
                <Text key={c} style={[s.num, s.textoEncabezado]}>
                  {c}
                </Text>
              ))}
              <Text style={[s.ptsCol, s.textoEncabezado]}>Pts</Text>
            </View>

            {filas.map((f, i) => (
              <Animated.View
                key={f.equipo.id}
                entering={FadeInDown.delay(180 + i * 45).duration(380)}
                style={[s.fila, i === filas.length - 1 && { borderBottomWidth: 0 }, i === 0 && jugados > 0 && s.lider]}>
                <View style={s.pos}>
                  <Medalla posicion={i + 1} tam={24} />
                </View>
                <View style={[s.equipo, estilos.fila, { gap: 8 }]}>
                  <Camiseta color={f.equipo.color} tam={12} />
                  <Text numberOfLines={1} style={s.nombre}>
                    {f.equipo.nombre}
                  </Text>
                </View>
                <Text style={s.num}>{f.pj}</Text>
                <Text style={s.num}>{f.g}</Text>
                <Text style={s.num}>{f.e}</Text>
                <Text style={s.num}>{f.p}</Text>
                <Text style={[s.num, f.dg > 0 && { color: tema.verde }, f.dg < 0 && { color: tema.rojo }]}>
                  {f.dg > 0 ? `+${f.dg}` : f.dg}
                </Text>
                <View style={s.ptsCol}>
                  <View style={[s.ptsPildora, i === 0 && jugados > 0 && { backgroundColor: tema.verde }]}>
                    <Text style={[s.ptsTexto, i === 0 && jugados > 0 && { color: '#fff' }]}>{f.pts}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </Animated.View>

          <Text style={[estilos.subtitulo, { textAlign: 'center' }]}>
            Victoria 3 puntos · empate 1 · solo cuentan los partidos con marcador
          </Text>

          <Boton titulo="Imprimir tabla" onPress={imprimir} cargando={imprimiendo} />
        </>
      ) : null}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  heroe: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  heroeDegradado: {
    padding: 18,
    gap: 14,
  },
  // Círculos decorativos que recuerdan el círculo central de la cancha
  circulo: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.08)',
    right: -70,
    top: -80,
  },
  circuloChico: { width: 90, height: 90, borderRadius: 45, right: 0, top: -15 },
  heroeEtiqueta: { color: tema.oro, fontSize: 12, fontWeight: '800', letterSpacing: 1.2 },
  heroeFila: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroeNombre: { color: '#fff', fontSize: 22, fontWeight: '800' },
  heroeDetalle: { color: 'rgba(255,255,255,0.72)', fontSize: 13, marginTop: 3, fontWeight: '500' },
  heroePuntos: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  heroePuntosNumero: { color: '#fff', fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  heroePuntosTexto: { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  heroePie: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
    paddingTop: 12,
  },
  heroePieTexto: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontWeight: '600' },

  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: tema.borde,
  },
  encabezado: { backgroundColor: '#F4F7F2' },
  textoEncabezado: { fontWeight: '700', color: tema.textoSuave, fontSize: 11, letterSpacing: 0.4 },
  lider: { backgroundColor: '#F1F8F2' },
  pos: { width: 30, alignItems: 'center', textAlign: 'center' },
  equipo: { flex: 1 },
  nombre: { flexShrink: 1, color: tema.texto, fontSize: 15, fontWeight: '600' },
  num: { width: 28, textAlign: 'center', color: tema.texto, fontSize: 13, fontVariant: ['tabular-nums'] },
  ptsCol: { width: 40, alignItems: 'center', textAlign: 'center' },
  ptsPildora: {
    minWidth: 32,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: tema.verdeClaro,
    alignItems: 'center',
  },
  ptsTexto: { fontWeight: '800', color: tema.verdeOscuro, fontSize: 14, fontVariant: ['tabular-nums'] },
});
