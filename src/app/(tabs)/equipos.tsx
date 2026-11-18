import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ErrorTexto, Escudo, Medalla, Vacio, estilos } from '@/components/ui';
import { listarEquipos, listarPartidos } from '@/lib/api';
import { tema } from '@/lib/colores';
import { calcularPosiciones } from '@/lib/posiciones';
import type { FilaPosicion } from '@/lib/tipos';

type EquipoConDatos = FilaPosicion & { posicion: number };

export default function EquiposScreen() {
  const [equipos, setEquipos] = useState<EquipoConDatos[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { width } = useWindowDimensions();
  const columnas = width >= 900 ? 4 : width >= 600 ? 3 : 2;
  const separacion = columnas === 2 ? 10 : 18;
  const anchoTarjeta = (width - 32 - separacion * (columnas - 1)) / columnas;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista, partidos] = await Promise.all([listarEquipos(), listarPartidos()]);
      const tabla = calcularPosiciones(lista, partidos);
      const posicion = new Map(tabla.map((f, i) => [f.equipo.id, i + 1]));
      // Se mantiene el orden original de la lista de equipos
      const porId = new Map(tabla.map((f) => [f.equipo.id, f]));
      setEquipos(
        lista.flatMap((e) => {
          const f = porId.get(e.id);
          return f ? [{ ...f, posicion: posicion.get(e.id) ?? 0 }] : [];
        }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los equipos');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar]),
  );

  return (
    <View style={estilos.pantalla}>
      <FlatList
        key={columnas}
        data={equipos}
        numColumns={columnas}
        keyExtractor={(e) => String(e.equipo.id)}
        contentContainerStyle={[estilos.contenido, { paddingBottom: 110 }]}
        columnWrapperStyle={{ gap: separacion }}
        refreshing={cargando}
        onRefresh={cargar}
        ListHeaderComponent={
          <>
            <ErrorTexto texto={error} />
            {equipos.length > 0 && (
              <Text style={s.contador}>
                {equipos.length === 1 ? '1 equipo inscrito' : `${equipos.length} equipos inscritos`}
              </Text>
            )}
          </>
        }
        ListEmptyComponent={cargando ? undefined : <Vacio texto="No hay equipos todavía. Toca + para crear el primero." />}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(index * 50).duration(380)} style={{ width: anchoTarjeta }}>
            <TarjetaEquipo datos={item} />
          </Animated.View>
        )}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Agregar equipo"
        onPress={() => router.push({ pathname: '/equipo/[id]', params: { id: 'nuevo' } })}
        style={estilos.flotante}>
        <Text style={estilos.flotanteTexto}>+</Text>
      </Pressable>
    </View>
  );
}

function TarjetaEquipo({ datos }: { datos: EquipoConDatos }) {
  const { equipo, posicion, pj, pts, g } = datos;
  const color = equipo.color ?? tema.plata;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${equipo.nombre}, puesto ${posicion}, ${pts} puntos`}
      onPress={() => router.push({ pathname: '/equipo/[id]', params: { id: String(equipo.id) } })}
      style={({ pressed }) => [s.tarjeta, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}>
      <View style={[s.cabecera, { backgroundColor: color }]}>
        {/* Franjas diagonales tipo camiseta */}
        <View style={[s.franja, { left: 18 }]} />
        <View style={[s.franja, { left: 62 }]} />
        <View style={[s.franja, { left: 106 }]} />
        <View style={s.medalla}>
          <Medalla posicion={posicion} tam={24} />
        </View>
      </View>

      <View style={s.escudo}>
        <Escudo nombre={equipo.nombre} color={color} tam={52} />
      </View>

      <View style={s.cuerpo}>
        <Text numberOfLines={1} style={s.nombre}>
          {equipo.nombre}
        </Text>
        <View style={s.stats}>
          <Stat valor={pts} texto="PTS" destacado />
          <Stat valor={pj} texto="PJ" />
          <Stat valor={g} texto="G" />
        </View>
      </View>
    </Pressable>
  );
}

function Stat({ valor, texto, destacado = false }: { valor: number; texto: string; destacado?: boolean }) {
  return (
    <View style={s.stat}>
      <Text style={[s.statValor, destacado && { color: tema.verde }]}>{valor}</Text>
      <Text style={s.statTexto}>{texto}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  contador: { fontSize: 13, color: tema.textoSuave, marginBottom: 2 },
  tarjeta: {
    backgroundColor: tema.tarjeta,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: tema.borde,
  },
  cabecera: { height: 64, overflow: 'hidden' },
  franja: {
    position: 'absolute',
    top: -20,
    width: 18,
    height: 120,
    backgroundColor: 'rgba(255,255,255,0.13)',
    transform: [{ rotate: '25deg' }],
  },
  medalla: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 14,
    padding: 1,
  },
  escudo: { marginTop: -28, alignItems: 'center' },
  cuerpo: { padding: 12, paddingTop: 8, gap: 10, alignItems: 'center' },
  nombre: { fontSize: 15, fontWeight: '700', color: tema.texto, textAlign: 'center' },
  stats: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    backgroundColor: '#F4F7F2',
    borderRadius: 12,
    paddingVertical: 6,
  },
  stat: { flex: 1, alignItems: 'center' },
  statValor: { fontSize: 16, fontWeight: '800', color: tema.texto, fontVariant: ['tabular-nums'] },
  statTexto: { fontSize: 10, fontWeight: '700', color: tema.textoSuave, letterSpacing: 0.5 },
});
