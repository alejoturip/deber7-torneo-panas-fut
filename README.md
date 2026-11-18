# Torneo entre Panas

App móvil para llevar un torneo de fútbol entre amigos. Se pueden registrar los equipos, anotar los partidos con su marcador y ver la tabla de posiciones, que se calcula sola a partir de los resultados.

Autor: Rosmy Alejandro Fabara Vinueza, estudiante de Desarrollo de Software de la Escuela Politécnica Nacional.

## Funcionalidades

- CRUD de equipos: crear, ver, editar y eliminar equipos, cada uno con un color de camiseta.
- CRUD de partidos: registrar partidos entre dos equipos, con fecha opcional. Si el partido todavía no se juega se dejan los goles vacíos y se completan después.
- Tabla de posiciones: partidos jugados, ganados, empatados, perdidos, diferencia de goles y puntos (3 por victoria y 1 por empate).

## Tecnologías

- Expo (React Native) con Expo Router
- TypeScript
- Supabase como base de datos

## Uso de servidores MCP

Durante el desarrollo trabajé con un agente de IA dentro de Visual Studio Code al que le conecté dos servidores MCP:

- **Supabase MCP**: lo usé para crear las tablas `equipos` y `partidos`, configurar los permisos, cargar datos de prueba y revisar con consultas que la información se guardara bien.
- **Expo MCP**: lo usé para consultar la documentación de Expo, instalar librerías compatibles con la versión del SDK y probar la app en el emulador (capturas de pantalla y revisión de logs).

## Cómo ejecutarlo

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Copiar `.env.example` como `.env` y poner la URL y la clave publicable del proyecto de Supabase.

3. Iniciar la app:

   ```bash
   npx expo start
   ```

   Después se abre en el emulador de Android con la tecla `a`, o en el celular con Expo Go escaneando el código QR.

## Estructura

```
src/
  app/
    (tabs)/
      index.tsx       tabla de posiciones
      equipos.tsx     lista de equipos
      partidos.tsx    lista de partidos
    equipo/[id].tsx   formulario para crear o editar un equipo
    partido/[id].tsx  formulario para crear o editar un partido
  components/ui.tsx   botones, campos y estilos compartidos
  lib/
    supabase.ts       conexión con Supabase
    api.ts            consultas a las tablas
    posiciones.ts     cálculo de la tabla de posiciones
```
