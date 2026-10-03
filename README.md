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

La URL de la API se configura con la variable `VITE_API_URL`:

- `.env.production` (build de produccion). Por defecto:
  ```
  VITE_API_URL=/api/v1
  ```
  Se usa cuando el front y la API comparten dominio (Nginx hace el proxy).
  Si la API vive en otro dominio:
  ```
  VITE_API_URL=https://api.tudominio.com/api/v1
  ```
- `.env` (desarrollo): dejalo vacio para usar el proxy de Vite.

Genera la build con:

```bash
npm run build
```

Sirve el contenido de `dist/` con Nginx (o el mismo Nginx que proxya `/api/`).

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
