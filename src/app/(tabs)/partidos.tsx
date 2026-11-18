import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { RejillaDispersa } from '@/components/RejillaDispersa';
import { Camiseta, ErrorTexto, Vacio, estilos } from '@/components/ui';
import { listarEquipos, listarPartidos } from '@/lib/api';
import { tema } from '@/lib/colores';
import type { Equipo, Partido } from '@/lib/tipos';

type Filtro = 'todos' | 'jugados' | 'pendientes';

const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: 'todos', texto: 'Todos' },
  { valor: 'jugados', texto: 'Jugados' },
  { valor: 'pendientes', texto: 'Pendientes' },
];

const ALTO_TARJETA = 136;

const estaJugado = (p: Partido) => p.goles_local !== null && p.goles_visitante !== null;

function cuantos(n: number) {
  return n === 1 ? '1 partido' : `${n} partidos`;
}

export default function PartidosScreen() {
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [equipos, setEquipos] = useState<Map<number, Equipo>>(new Map());
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [listaEquipos, listaPartidos] = await Promise.all([listarEquipos(), listarPartidos()]);
      setEquipos(new Map(listaEquipos.map((e) => [e.id, e])));
      setPartidos(listaPartidos);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los partidos');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  const jugados = partidos.filter(estaJugado).length;
  const pendientes = partidos.length - jugados;
  const pasaFiltro = (p: Partido) =>
    filtro === 'todos' ? true : filtro === 'jugados' ? estaJugado(p) : !estaJugado(p);
  const mostrados = filtro === 'todos' ? partidos.length : filtro === 'jugados' ? jugados : pendientes;

  const elegir = (f: Filtro) => {
    if (f === filtro) return;
    setFiltro(f);
    const n = f === 'todos' ? partidos.length : f === 'jugados' ? jugados : pendientes;
    if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(`Mostrando ${cuantos(n)}`);
  };

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        contentContainerStyle={[estilos.contenido, { paddingBottom: 110 }]}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={cargar} tintColor={tema.verde} />}>
        <ErrorTexto texto={error} />

        {partidos.length === 0 && !cargando ? (
          <Vacio texto="No hay partidos registrados. Toca + para agregar uno." />
        ) : (
          <>
            <View style={s.resumen}>
              <Dato numero={partidos.length} texto="Total" />
              <View style={s.separador} />
              <Dato numero={jugados} texto="Jugados" />
              <View style={s.separador} />
              <Dato numero={pendientes} texto="Pendientes" />
            </View>

            <View style={s.filtros}>
              {FILTROS.map((f) => (
                <BotonFiltro key={f.valor} texto={f.texto} activo={filtro === f.valor} onPress={() => elegir(f.valor)} />
              ))}
            </View>

            <Text style={s.contador} accessibilityLiveRegion="polite">
              Mostrando {cuantos(mostrados)}
            </Text>

            <RejillaDispersa
              items={partidos}
              clave={(p) => String(p.id)}
              visible={pasaFiltro}
              altoItem={ALTO_TARJETA}
              renderItem={(p) => (
                <TarjetaPartido
                  partido={p}
                  local={equipos.get(p.equipo_local_id)}
                  visita={equipos.get(p.equipo_visitante_id)}
                />
              )}
            />

            {mostrados === 0 && (
              <Vacio texto={filtro === 'jugados' ? 'Aún no se ha jugado ningún partido.' : 'No quedan partidos pendientes.'} />
            )}
          </>
        )}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar partido"
        onPress={() => router.push({ pathname: '/partido/[id]', params: { id: 'nuevo' } })}
        style={estilos.flotante}>
        <Text style={estilos.flotanteTexto}>+</Text>
      </Pressable>
    </View>
  );
}

function Dato({ numero, texto }: { numero: number; texto: string }) {
  return (
    <View style={s.dato}>
      <Text style={s.datoNumero}>{numero}</Text>
      <Text style={s.datoTexto}>{texto}</Text>
    </View>
  );
}

function BotonFiltro({ texto, activo, onPress }: { texto: string; activo: boolean; onPress: () => void }) {
  const [enfocado, setEnfocado] = useState(false);
  return (
    <Pressable
      accessibilityRole="button"
      aria-selected={activo}
      accessibilityState={{ selected: activo }}
      onPress={onPress}
      onFocus={() => setEnfocado(true)}
      onBlur={() => setEnfocado(false)}
      style={({ pressed }) => [
        s.filtro,
        activo && s.filtroActivo,
        enfocado && s.filtroEnfocado,
        pressed && !activo && { backgroundColor: '#D3EBDB' },
      ]}>
      <Text style={[s.filtroTexto, activo && s.filtroTextoActivo]}>{texto}</Text>
    </Pressable>
  );
}

function TarjetaPartido({ partido, local, visita }: { partido: Partido; local?: Equipo; visita?: Equipo }) {
  const jugado = estaJugado(partido);
  const gl = partido.goles_local ?? 0;
  const gv = partido.goles_visitante ?? 0;
  const nombreLocal = local?.nombre ?? '?';
  const nombreVisita = visita?.nombre ?? '?';
  const etiqueta = jugado
    ? `${nombreLocal} ${gl}, ${nombreVisita} ${gv}`
    : `${nombreLocal} contra ${nombreVisita}, pendiente`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={() => router.push({ pathname: '/partido/[id]', params: { id: String(partido.id) } })}
      style={({ pressed }) => [s.tarjeta, pressed && { opacity: 0.85 }]}>
      <View style={s.franja}>
        <View style={{ flex: 1, backgroundColor: local?.color ?? tema.borde }} />
        <View style={{ flex: 1, backgroundColor: visita?.color ?? tema.borde }} />
      </View>

      <View style={s.cuerpo}>
        <View style={s.meta}>
          <Text numberOfLines={1} style={s.fecha}>
            {partido.fecha ?? 'Sin fecha'}
          </Text>
          <View style={[s.estado, jugado ? s.estadoJugado : s.estadoPendiente]}>
            <Text style={[s.estadoTexto, { color: jugado ? tema.verde : '#9A6B00' }]}>
              {jugado ? 'FINAL' : 'POR JUGAR'}
            </Text>
          </View>
        </View>

        <FilaEquipo equipo={local} goles={jugado ? gl : null} gana={jugado && gl > gv} />
        <FilaEquipo equipo={visita} goles={jugado ? gv : null} gana={jugado && gv > gl} />
      </View>
    </Pressable>
  );
}

function FilaEquipo({ equipo, goles, gana }: { equipo?: Equipo; goles: number | null; gana: boolean }) {
  return (
    <View style={s.filaEquipo}>
      <Camiseta color={equipo?.color ?? null} tam={12} />
      <Text numberOfLines={1} style={[s.nombre, gana && s.nombreGana]}>
        {equipo?.nombre ?? '?'}
      </Text>
      <Text style={[s.goles, goles === null && s.golesVacio, gana && { color: tema.verde }]}>
        {goles === null ? '–' : goles}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  resumen: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: tema.verde,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  dato: { flex: 1, alignItems: 'center' },
  datoNumero: { color: '#fff', fontSize: 26, fontWeight: '800', fontVariant: ['tabular-nums'] },
  datoTexto: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginTop: 2 },
  separador: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.2)' },

  filtros: {
    flexDirection: 'row',
    backgroundColor: tema.verdeClaro,
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  filtro: { flex: 1, paddingVertical: 9, borderRadius: 999, alignItems: 'center' },
  filtroActivo: {
    backgroundColor: tema.tarjeta,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  filtroEnfocado: { outlineWidth: 2, outlineColor: tema.verde, outlineStyle: 'solid', outlineOffset: 1 },
  filtroTexto: { fontSize: 14, fontWeight: '600', color: tema.textoSuave },
  filtroTextoActivo: { color: tema.verde },
  contador: { fontSize: 13, color: tema.textoSuave, marginTop: -2 },

  tarjeta: {
    flex: 1,
    backgroundColor: tema.tarjeta,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tema.borde,
  },
  franja: { flexDirection: 'row', height: 5 },
  cuerpo: { flex: 1, padding: 12, gap: 8, justifyContent: 'space-between' },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  fecha: { flexShrink: 1, fontSize: 12, color: tema.textoSuave, fontWeight: '500' },
  estado: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  estadoJugado: { backgroundColor: tema.verdeClaro },
  estadoPendiente: { backgroundColor: '#FFF4D6' },
  estadoTexto: { fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  filaEquipo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nombre: { flex: 1, fontSize: 14, fontWeight: '500', color: tema.texto },
  nombreGana: { fontWeight: '700' },
  goles: { fontSize: 20, fontWeight: '800', color: tema.texto, minWidth: 18, textAlign: 'right', fontVariant: ['tabular-nums'] },
  golesVacio: { color: tema.borde },
});
