import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { tema } from '@/lib/colores';

export function Boton({
  titulo,
  onPress,
  tipo = 'principal',
  cargando = false,
}: {
  titulo: string;
  onPress: () => void;
  tipo?: 'principal' | 'peligro' | 'secundario';
  cargando?: boolean;
}) {
  const fondo = tipo === 'principal' ? tema.verde : tipo === 'peligro' ? tema.rojo : tema.tarjeta;
  const colorTexto = tipo === 'secundario' ? tema.texto : '#fff';
  return (
    <Pressable
      onPress={onPress}
      disabled={cargando}
      style={({ pressed }) => [
        estilos.boton,
        { backgroundColor: fondo, opacity: pressed || cargando ? 0.7 : 1 },
        tipo === 'secundario' && estilos.botonSecundario,
      ]}>
      {cargando ? (
        <ActivityIndicator color={colorTexto} />
      ) : (
        <Text style={[estilos.botonTexto, { color: colorTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

export function Campo({ etiqueta, ...props }: { etiqueta: string } & TextInputProps) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.etiqueta}>{etiqueta}</Text>
      <TextInput placeholderTextColor={tema.textoSuave} style={estilos.input} {...props} />
    </View>
  );
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return <Text style={estilos.etiqueta}>{children}</Text>;
}

export function Vacio({ texto }: { texto: string }) {
  return <Text style={estilos.vacio}>{texto}</Text>;
}

export function ErrorTexto({ texto }: { texto: string | null }) {
  if (!texto) return null;
  return <Text style={estilos.error}>{texto}</Text>;
}

export function Camiseta({ color, tam = 14 }: { color: string | null; tam?: number }) {
  return (
    <View
      style={{
        width: tam,
        height: tam,
        borderRadius: tam / 2,
        backgroundColor: color ?? tema.borde,
      }}
    />
  );
}

function iniciales(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[1][0]).toUpperCase();
}

// Escudo del equipo: cuadro redondeado con su color y sus iniciales
export function Escudo({ nombre, color, tam = 40 }: { nombre: string; color: string | null; tam?: number }) {
  return (
    <View
      style={{
        width: tam,
        height: tam,
        borderRadius: tam * 0.32,
        backgroundColor: color ?? tema.plata,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.55)',
      }}>
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: tam * 0.38, letterSpacing: 0.5 }}>
        {iniciales(nombre)}
      </Text>
    </View>
  );
}

// Número de posición; los tres primeros llevan color de medalla
export function Medalla({ posicion, tam = 26 }: { posicion: number; tam?: number }) {
  const fondo = posicion === 1 ? tema.oro : posicion === 2 ? tema.plata : posicion === 3 ? tema.bronce : 'transparent';
  const podio = posicion <= 3;
  return (
    <View
      style={{
        width: tam,
        height: tam,
        borderRadius: tam / 2,
        backgroundColor: fondo,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text style={{ fontSize: tam * 0.48, fontWeight: '800', color: podio ? '#fff' : tema.textoSuave }}>
        {posicion}
      </Text>
    </View>
  );
}

export const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: tema.fondo },
  contenido: { padding: 16, gap: 12 },
  tarjeta: {
    backgroundColor: tema.tarjeta,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: tema.borde,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  titulo: { fontSize: 16, fontWeight: '600', color: tema.texto },
  subtitulo: { fontSize: 13, color: tema.textoSuave },
  boton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonSecundario: { borderWidth: 1, borderColor: tema.borde },
  botonTexto: { fontSize: 16, fontWeight: '600' },
  campo: { gap: 6 },
  etiqueta: { fontSize: 14, fontWeight: '600', color: tema.texto },
  input: {
    backgroundColor: tema.tarjeta,
    borderWidth: 1,
    borderColor: tema.borde,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: tema.texto,
  },
  vacio: { textAlign: 'center', color: tema.textoSuave, marginTop: 40, fontSize: 15 },
  error: { color: tema.rojo, fontSize: 14 },
  flotante: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    backgroundColor: tema.verde,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  flotanteTexto: { color: '#fff', fontSize: 28, lineHeight: 30 },
});
