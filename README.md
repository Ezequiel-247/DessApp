# DesApp (AcademiaPro)

Plataforma de gestión académica para estudiantes universitarios. Permite armar y seguir el plan de estudios de una carrera, controlar correlatividades, registrar el avance académico (materias regularizadas, aprobadas, finales) y organizar sesiones de estudio, además de un espacio social liviano (posts, comentarios, conexiones entre estudiantes) para coordinar con compañeros.

Proyecto desarrollado para la materia **Desarrollo de Aplicaciones** (Tecnicatura Universitaria).

## Funcionalidades principales

- **Planes de estudio**: carreras, materias, correlatividades y bloques (electivas, créditos, optativas).
- **Seguimiento académico**: registro de estado por materia (cursando, regular, aprobada) y de finales rendidos.
- **Planificador personalizado**: el estudiante arma su propio recorrido de cursada (custom study plan) respetando correlatividades.
- **Sesiones de estudio**: creación, inscripción y aprobación de encuentros de repaso entre estudiantes.
- **Comunidad**: posts, comentarios, votos, conexiones entre usuarios y notificaciones.
- **Administración**: gestión de institutos, carreras, materias, usuarios y configuración del sistema para el rol admin.

## Estructura del repositorio

Monorepo con dos proyectos independientes:

```
App/
├── backend/   # API REST - Node.js, Express, Sequelize, PostgreSQL
└── frontend/  # SPA - React, Vite, Tailwind CSS
```

Cada carpeta tiene su propio `README.md` con instrucciones detalladas de instalación, variables de entorno, testing y despliegue:

- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

## Levantar el proyecto en local (resumen)

1. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env   # completar credenciales de DB
   npm run db:prepare     # levanta Postgres (Docker) y carga datos de prueba
   npm run dev             # http://localhost:3001
   ```
2. **Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env   # VITE_API_URL apuntando al backend
   npm run dev              # http://localhost:3000
   ```

Ver los README de cada carpeta para detalle de credenciales de prueba, testing y documentación de la API (Swagger en `/api/docs`).

## Stack tecnológico

| | Backend | Frontend |
|---|---|---|
| Runtime | Node.js | - |
| Framework | Express | React |
| Build/Dev | nodemon | Vite |
| Estilos | - | Tailwind CSS |
| ORM/DB | Sequelize + PostgreSQL | - |
| Auth | JWT | - |
| Testing | Jest | Vitest + Testing Library + MSW |

## Despliegue

- **Backend**: pensado para Render (Web Service) — soporta `PORT` dinámico, SSL de base de datos gestionada (`DB_SSL`) y Cloudinary para almacenamiento persistente de imágenes.
- **Frontend**: SPA estática, servible en Render (Static Site) o Vercel — requiere configurar `VITE_API_URL` apuntando a la URL pública del backend.
