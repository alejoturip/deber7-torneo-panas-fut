import { useEffect, useRef, useState, type ReactNode } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// Transición "dispersar y reagrupar": 1000 ms en total.
// 0 → 0.36 (360 ms): las tarjetas que salen se alejan del centro y se desvanecen.
// 0.36 → 1 (640 ms): las tarjetas del nuevo filtro vuelven desde la dispersión a su lugar.
const DURACION = 1000;
const SALIDA = 0.36;
const EMPUJE = 0.7; // 70 % del vector desde el centro de la colección
const ESCALA_MIN = 0.72;

type Hueco = { x: number; y: number };
type Plan = {
  viejo: Record<string, Hueco>;
  nuevo: Record<string, Hueco>;
  centroViejo: { x: number; y: number };
  centroNuevo: { x: number; y: number };
  altoViejo: number;
  altoNuevo: number;
  anchoItem: number;
  altoItem: number;
};

const PLAN_VACIO: Plan = {
  viejo: {},
  nuevo: {},
  centroViejo: { x: 0, y: 0 },
  centroNuevo: { x: 0, y: 0 },
  altoViejo: 0,
  altoNuevo: 0,
  anchoItem: 0,
  altoItem: 0,
};

function easeOut(t: number) {
  'worklet';
  return 1 - (1 - t) ** 3;
}

function columnasPara(ancho: number) {
  if (ancho >= 900) return { cols: 4, gap: 18 };
  if (ancho >= 600) return { cols: 3, gap: 18 };
  return { cols: 2, gap: 10 };
}

function distribuir(claves: string[], ancho: number, altoItem: number) {
  const { cols, gap } = columnasPara(ancho);
  const anchoItem = (ancho - gap * (cols - 1)) / cols;
  const huecos: Record<string, Hueco> = {};
  claves.forEach((k, i) => {
    huecos[k] = { x: (i % cols) * (anchoItem + gap), y: Math.floor(i / cols) * (altoItem + gap) };
  });
  const filas = Math.ceil(claves.length / cols);
  const alto = filas > 0 ? filas * altoItem + (filas - 1) * gap : 0;
  return { huecos, alto, anchoItem, centro: { x: ancho / 2, y: alto / 2 } };
}

type Props<T> = {
  items: T[];
  clave: (item: T) => string;
  visible: (item: T) => boolean;
  altoItem: number;
  renderItem: (item: T) => ReactNode;
};

export function RejillaDispersa<T>({ items, clave, visible, altoItem, renderItem }: Props<T>) {
  const reducirMovimiento = useReducedMotion();
  const t = useSharedValue(1);
  const plan = useSharedValue<Plan>(PLAN_VACIO);
  const [ancho, setAncho] = useState(0);
  const [montados, setMontados] = useState<Set<string>>(new Set());
  const ultimo = useRef({ ancho: 0, visibles: '', token: 0, listo: false });

  const visibles = items.filter(visible).map(clave);
  const firmaVisibles = visibles.join('|');
  const firmaItems = items.map(clave).join('|');

  useEffect(() => {
    if (ancho <= 0) return;
    const previo = ultimo.current;
    const destino = distribuir(visibles, ancho, altoItem);
    const token = previo.token + 1;
    const animar =
      !reducirMovimiento && previo.listo && previo.ancho === ancho && previo.visibles !== firmaVisibles;
    ultimo.current = { ancho, visibles: firmaVisibles, token, listo: true };

    // Solo la selección más reciente puede terminar: se cancela lo que esté en curso.
    cancelAnimation(t);

    if (!animar) {
      plan.value = {
        viejo: destino.huecos,
        nuevo: destino.huecos,
        centroViejo: destino.centro,
        centroNuevo: destino.centro,
        altoViejo: destino.alto,
        altoNuevo: destino.alto,
        anchoItem: destino.anchoItem,
        altoItem,
      };
      t.value = 1;
      setMontados(new Set(visibles));
      return;
    }

    // Continuar desde lo que se ve ahora mismo, sin saltos.
    const actual = plan.value;
    const tv = t.value;
    let origen: Pick<Plan, 'viejo' | 'centroViejo' | 'altoViejo'>;
    let inicio: number;
    if (tv < SALIDA) {
      origen = { viejo: actual.viejo, centroViejo: actual.centroViejo, altoViejo: actual.altoViejo };
      inicio = tv;
    } else {
      origen = { viejo: actual.nuevo, centroViejo: actual.centroNuevo, altoViejo: actual.altoNuevo };
      const disperso = tv < 1 ? 1 - easeOut((tv - SALIDA) / (1 - SALIDA)) : 0;
      inicio = SALIDA * (1 - Math.cbrt(1 - disperso));
    }

    plan.value = {
      ...origen,
      nuevo: destino.huecos,
      centroNuevo: destino.centro,
      altoNuevo: destino.alto,
      anchoItem: destino.anchoItem,
      altoItem,
    };
    setMontados(new Set([...Object.keys(origen.viejo), ...visibles]));

    const terminar = (tk: number) => {
      if (ultimo.current.token === tk) setMontados(new Set(visibles));
    };
    t.value = inicio;
    t.value = withTiming(1, { duration: (1 - inicio) * DURACION, easing: Easing.linear }, (fin) => {
      if (fin) scheduleOnRN(terminar, token);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ancho, firmaVisibles, firmaItems, altoItem, reducirMovimiento]);

  // Al salir de la pantalla no queda ninguna animación viva.
  useEffect(() => () => cancelAnimation(t), [t]);

  const estiloContenedor = useAnimatedStyle(() => ({
    height: t.value < SALIDA ? plan.value.altoViejo : plan.value.altoNuevo,
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    if (w !== ancho) setAncho(w);
  };

  return (
    <View onLayout={onLayout}>
      <Animated.View style={estiloContenedor}>
        {items.map((item, orden) => {
          const k = clave(item);
          if (!montados.has(k)) return null;
          return (
            <Celda key={k} id={k} orden={orden} t={t} plan={plan}>
              {renderItem(item)}
            </Celda>
          );
        })}
      </Animated.View>
    </View>
  );
}

function Celda({
  id,
  orden,
  t,
  plan,
  children,
}: {
  id: string;
  orden: number;
  t: SharedValue<number>;
  plan: SharedValue<Plan>;
  children: ReactNode;
}) {
  // Giro determinista: alterna el sentido y va de 10 a 14 grados.
  const giro = (orden % 2 === 0 ? 1 : -1) * (10 + ((orden * 3) % 5));

  const estilo = useAnimatedStyle(() => {
    const p = plan.value;
    const tv = t.value;
    const saliendo = tv < SALIDA;
    const hueco = saliendo ? p.viejo[id] : p.nuevo[id];
    if (!hueco) {
      return {
        left: -10000,
        top: 0,
        width: p.anchoItem,
        height: p.altoItem,
        opacity: 0,
        transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '0deg' }, { scale: 1 }],
      };
    }
    const d = saliendo ? easeOut(tv / SALIDA) : 1 - easeOut((tv - SALIDA) / (1 - SALIDA));
    const c = saliendo ? p.centroViejo : p.centroNuevo;
    const vx = hueco.x + p.anchoItem / 2 - c.x;
    const vy = hueco.y + p.altoItem / 2 - c.y;
    return {
      left: hueco.x,
      top: hueco.y,
      width: p.anchoItem,
      height: p.altoItem,
      opacity: 1 - d,
      transform: [
        { translateX: vx * EMPUJE * d },
        { translateY: vy * EMPUJE * d },
        { rotate: `${giro * d}deg` },
        { scale: 1 - (1 - ESCALA_MIN) * d },
      ],
    };
  });

  return <Animated.View style={[{ position: 'absolute' }, estilo]}>{children}</Animated.View>;
}
