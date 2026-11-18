# Base de datos

La app usa dos tablas en Supabase.

## equipos

| Columna    | Tipo        | Notas                              |
|------------|-------------|------------------------------------|
| id         | bigint      | Llave primaria, se genera sola     |
| nombre     | text        | Obligatorio y sin repetirse        |
| color      | text        | Color de camiseta en hexadecimal   |
| created_at | timestamptz | Por defecto la fecha actual        |

## partidos

| Columna             | Tipo        | Notas                                              |
|---------------------|-------------|----------------------------------------------------|
| id                  | bigint      | Llave primaria, se genera sola                     |
| equipo_local_id     | bigint      | Referencia a equipos(id), se borra en cascada      |
| equipo_visitante_id | bigint      | Referencia a equipos(id), se borra en cascada      |
| goles_local         | integer     | Puede ser nulo si el partido no se ha jugado       |
| goles_visitante     | integer     | Puede ser nulo si el partido no se ha jugado       |
| fecha               | date        | Opcional                                           |
| created_at          | timestamptz | Por defecto la fecha actual                        |

Reglas:

- El equipo local y el visitante no pueden ser el mismo.
- Los goles no pueden ser negativos.

## Permisos

La app no tiene inicio de sesión, así que las dos tablas tienen RLS activado con políticas que permiten leer, insertar, actualizar y borrar al rol `anon`. Esto está bien para un proyecto de clase, pero en una app real habría que agregar usuarios y restringir los permisos.
