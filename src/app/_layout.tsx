import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { tema } from '@/lib/colores';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: tema.verde },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: tema.fondo },
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="equipo/[id]" options={{ title: 'Equipo', presentation: 'modal' }} />
        <Stack.Screen name="partido/[id]" options={{ title: 'Partido', presentation: 'modal' }} />
      </Stack>
    </>
  );
}
