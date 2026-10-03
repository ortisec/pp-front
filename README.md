# Podemos Peru - Frontend

Aplicacion web (React + TypeScript + Vite + Tailwind CSS) para el registro y
visualizacion en tiempo real de resultados de elecciones regionales y
municipales del Peru.

## Requisitos

- Node.js 20+
- La API (`pp-api`) corriendo. En desarrollo el proxy apunta a
  `http://localhost:8477` (donde el compose publica la API).

## Desarrollo

```bash
npm install
npm run dev
```

La app queda en `http://localhost:5173`. Vite hace proxy de `/api`
(incluyendo WebSocket) hacia `http://localhost:8477`.

## Produccion

La URL de la API se configura con la variable `VITE_API_URL`.

Como el frontend se despliega en **Vercel** y la API en **EasyPanel** (dominios
distintos), se usa la URL absoluta de la API:

```
VITE_API_URL=https://iot-pp.p6eoke.easypanel.host/api/v1
```

En Vercel, define esta variable en **Settings > Environment Variables**
(entorno Production) o edita `.env.production` antes del build.

- `.env.production` (build de produccion): URL absoluta de la API.
- `.env` (desarrollo): dejalo vacio para usar el proxy de Vite.

Genera la build con:

```bash
npm run build
```

> Importante: en la API (EasyPanel) agrega el dominio de Vercel a
> `CORS_ORIGINS` para permitir las peticiones del frontend.

## Scripts

| Comando         | Descripcion                          |
| --------------- | ------------------------------------ |
| `npm run dev`   | Servidor de desarrollo con HMR       |
| `npm run build` | Compila TypeScript y genera `dist/`  |
| `npm run lint`  | Ejecuta oxlint                       |
| `npm run preview` | Sirve la build de produccion       |

## Roles

- **Administrador**: usuario y contrasena. Gestiona procesos electorales,
  geografia (provincias/distritos), locales, mesas, partidos, usuarios y
  asignaciones. Ve el dashboard completo.
- **Personero de mesa**: inicia sesion solo con su DNI. Registra votos de su
  mesa asignada.
- **Personero de local (coordinador)**: inicia sesion solo con su DNI. Registra
  votos de cualquier mesa de su local asignado.

## Estructura

```
src/
  api/         cliente HTTP y tipos
  auth/        contexto de autenticacion
  components/  UI reutilizable (modales, badges, graficos, formulario de votos)
  pages/       Login, Dashboard, Admin y vistas de personero
  pages/admin/ paneles del administrador
  ui/          estilos base compartidos
```
