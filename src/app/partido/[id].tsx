import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Boton, Camiseta, Campo, ErrorTexto, Etiqueta, Vacio, estilos } from '@/components/ui';
import {
  actualizarPartido,
  crearPartido,
  eliminarPartido,
  listarEquipos,
  obtenerPartido,
} from '@/lib/api';
import { tema } from '@/lib/colores';
import type { Equipo } from '@/lib/tipos';

export default function PartidoForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const esNuevo = id === 'nuevo';

  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [localId, setLocalId] = useState<number | null>(null);
  const [visitaId, setVisitaId] = useState<number | null>(null);
  const [golesLocal, setGolesLocal] = useState('');
  const [golesVisita, setGolesVisita] = useState('');
  const [fecha, setFecha] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listarEquipos().then(setEquipos).catch((e: Error) => setError(e.message));
    if (esNuevo) return;
    obtenerPartido(Number(id))
      .then((p) => {
        setLocalId(p.equipo_local_id);
        setVisitaId(p.equipo_visitante_id);
        setGolesLocal(p.goles_local?.toString() ?? '');
        setGolesVisita(p.goles_visitante?.toString() ?? '');
        setFecha(p.fecha ?? '');
      })
      .catch((e: Error) => setError(e.message));
  }, [id, esNuevo]);

  function leerGoles(texto: string): number | null | 'error' {
    if (texto.trim() === '') return null;
    const n = Number(texto);
    return Number.isInteger(n) && n >= 0 ? n : 'error';
  }

  async function guardar() {
    if (localId === null || visitaId === null) {
      setError('Escoge el equipo local y el visitante');
      return;
    }
    if (localId === visitaId) {
      setError('Un equipo no puede jugar contra sí mismo');
      return;
    }
    const gl = leerGoles(golesLocal);
    const gv = leerGoles(golesVisita);
    if (gl === 'error' || gv === 'error') {
      setError('Los goles deben ser números enteros desde 0');
      return;
    }
    if ((gl === null) !== (gv === null)) {
      setError('Llena los goles de los dos equipos, o deja ambos vacíos si el partido no se ha jugado');
      return;
    }
    if (fecha && !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      setError('La fecha debe tener el formato AAAA-MM-DD');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      const datos = {
        equipo_local_id: localId,
        equipo_visitante_id: visitaId,
        goles_local: gl,
        goles_visitante: gv,
        fecha: fecha || null,
      };
      if (esNuevo) await crearPartido(datos);
      else await actualizarPartido(Number(id), datos);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  function confirmarEliminar() {
    Alert.alert('Eliminar partido', '¿Seguro que quieres borrar este partido?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarPartido(Number(id));
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo eliminar');
          }
        },
      },
    ]);
  }

  if (equipos.length > 0 && equipos.length < 2) {
    return (
      <View style={estilos.pantalla}>
        <Vacio texto="Necesitas al menos dos equipos para registrar un partido." />
      </View>
    );
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={[estilos.contenido, { gap: 18 }]}>
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo partido' : 'Editar partido' }} />

      <SelectorEquipo titulo="Equipo local" equipos={equipos} valor={localId} onCambiar={setLocalId} />
      <SelectorEquipo titulo="Equipo visitante" equipos={equipos} valor={visitaId} onCambiar={setVisitaId} />

      <View style={[estilos.fila, { gap: 12 }]}>
        <View style={{ flex: 1 }}>
          <Campo
            etiqueta="Goles local"
            value={golesLocal}
            onChangeText={setGolesLocal}
            keyboardType="number-pad"
            placeholder="-"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Campo
            etiqueta="Goles visitante"
            value={golesVisita}
            onChangeText={setGolesVisita}
            keyboardType="number-pad"
            placeholder="-"
          />
        </View>
      </View>
      <Text style={estilos.subtitulo}>Deja los goles vacíos si el partido todavía no se juega.</Text>

      <Campo etiqueta="Fecha (opcional)" value={fecha} onChangeText={setFecha} placeholder="2026-11-20" />

      <ErrorTexto texto={error} />

      <Boton titulo={esNuevo ? 'Registrar partido' : 'Guardar cambios'} onPress={guardar} cargando={guardando} />
      {!esNuevo && <Boton titulo="Eliminar partido" tipo="peligro" onPress={confirmarEliminar} />}
    </ScrollView>
  );
}

function SelectorEquipo({
  titulo,
  equipos,
  valor,
  onCambiar,
}: {
  titulo: string;
  equipos: Equipo[];
  valor: number | null;
  onCambiar: (id: number) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Etiqueta>{titulo}</Etiqueta>
      <View style={s.opciones}>
        {equipos.map((e) => {
          const activo = e.id === valor;
          return (
            <Pressable key={e.id} onPress={() => onCambiar(e.id)} style={[s.chip, activo && s.chipActivo]}>
              <Camiseta color={e.color} tam={12} />
              <Text style={[s.chipTexto, activo && { color: '#fff' }]}>{e.nombre}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  opciones: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: tema.borde,
    backgroundColor: tema.tarjeta,
  },
  chipActivo: { backgroundColor: tema.verde, borderColor: tema.verde },
  chipTexto: { color: tema.texto, fontSize: 14 },
});
