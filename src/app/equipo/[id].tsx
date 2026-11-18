import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { Boton, Campo, ErrorTexto, Escudo, Etiqueta, estilos } from '@/components/ui';
import { actualizarEquipo, crearEquipo, eliminarEquipo, obtenerEquipo } from '@/lib/api';
import { coloresEquipo, tema } from '@/lib/colores';

export default function EquipoForm() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const esNuevo = id === 'nuevo';

  const [nombre, setNombre] = useState('');
  const [color, setColor] = useState<string | null>(coloresEquipo[0]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (esNuevo) return;
    obtenerEquipo(Number(id))
      .then((e) => {
        setNombre(e.nombre);
        setColor(e.color);
      })
      .catch((e: Error) => setError(e.message));
  }, [id, esNuevo]);

  async function guardar() {
    if (!nombre.trim()) {
      setError('Escribe el nombre del equipo');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      const datos = { nombre: nombre.trim(), color };
      if (esNuevo) await crearEquipo(datos);
      else await actualizarEquipo(Number(id), datos);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar');
    } finally {
      setGuardando(false);
    }
  }

  function confirmarEliminar() {
    Alert.alert('Eliminar equipo', `Se borrará ${nombre} y todos sus partidos. ¿Seguro?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await eliminarEquipo(Number(id));
            router.back();
          } catch (e) {
            setError(e instanceof Error ? e.message : 'No se pudo eliminar');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={estilos.pantalla} contentContainerStyle={[estilos.contenido, { gap: 18 }]}>
      <Stack.Screen options={{ title: esNuevo ? 'Nuevo equipo' : 'Editar equipo' }} />

      <View style={[estilos.tarjeta, { alignItems: 'center', gap: 10, paddingVertical: 20 }]}>
        <Escudo nombre={nombre || '?'} color={color} tam={72} />
        <Text numberOfLines={1} style={[estilos.titulo, { fontSize: 18 }, !nombre && { color: tema.textoSuave }]}>
          {nombre.trim() || 'Tu equipo'}
        </Text>
      </View>

      <Campo
        etiqueta="Nombre"
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Los Galácticos"
        autoFocus={esNuevo}
      />

      <View style={{ gap: 8 }}>
        <Etiqueta>Color de camiseta</Etiqueta>
        <View style={[estilos.fila, { flexWrap: 'wrap' }]}>
          {coloresEquipo.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: c,
                borderWidth: color === c ? 3 : 0,
                borderColor: tema.texto,
              }}
            />
          ))}
        </View>
      </View>

      <ErrorTexto texto={error} />

      <Boton titulo={esNuevo ? 'Crear equipo' : 'Guardar cambios'} onPress={guardar} cargando={guardando} />
      {!esNuevo && <Boton titulo="Eliminar equipo" tipo="peligro" onPress={confirmarEliminar} />}
    </ScrollView>
  );
}
