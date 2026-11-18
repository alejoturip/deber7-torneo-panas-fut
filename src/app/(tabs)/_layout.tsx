import { Tabs } from 'expo-router/tabs';
import { Text } from 'react-native';

import { tema } from '@/lib/colores';

function Icono({ emoji, activo }: { emoji: string; activo: boolean }) {
  return <Text style={{ fontSize: 20, opacity: activo ? 1 : 0.5 }}>{emoji}</Text>;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: tema.verde },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '800' },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: tema.fondo },
        tabBarActiveTintColor: tema.verde,
        tabBarInactiveTintColor: tema.textoSuave,
        tabBarLabelStyle: { fontWeight: '700', fontSize: 11 },
        tabBarStyle: { backgroundColor: tema.tarjeta, borderTopColor: tema.borde },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Posiciones',
          tabBarIcon: ({ focused }) => <Icono emoji="🏆" activo={focused} />,
        }}
      />
      <Tabs.Screen
        name="equipos"
        options={{
          title: 'Equipos',
          tabBarIcon: ({ focused }) => <Icono emoji="👕" activo={focused} />,
        }}
      />
      <Tabs.Screen
        name="partidos"
        options={{
          title: 'Partidos',
          tabBarIcon: ({ focused }) => <Icono emoji="⚽" activo={focused} />,
        }}
      />
    </Tabs>
  );
}
