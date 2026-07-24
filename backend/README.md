# DesApp Backend

Backend del proyecto DesApp desarrollado con Node.js, Express, Sequelize y PostgreSQL.

## Requisitos Previos

- Node.js v20+ 
- npm v10+
- Docker y Docker Compose (para usar la BD en contenedor)
- PostgreSQL 12+ (opcional si usas BD local)
- Postman (opcional para probar los endpoints)

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/DesApp-2026c1-Grupo-3/backend.git
cd backend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```
Actualizá las credenciales de la base de datos y, muy importante, la variable `FRONTEND_URL` (por defecto `http://localhost:3000`) para que el backend acepte las peticiones de tu React local.

## Desarrollo

### Opción 1: Usar Docker para la Base de Datos (Recomendado)

#### Levantar PostgreSQL en Docker

```bash
npm run db:up
```

Esto levantará:
- **PostgreSQL 15** en el puerto `5432`
- Base de datos: `desapp_db`
- Usuario: `postgres`
- Contraseña: `password`

#### Verificar que Docker está ejecutándose

```bash
npm run db:logs
```

Debe mostrar el contenedor `desapp_db` con estado `Up`.

#### Detener la base de datos

```bash
npm run db:down
```

#### Eliminar volúmenes (datos) de la BD

```bash
npm run db:reset
```

### Opción 2: Usar PostgreSQL Local

Si tienes PostgreSQL instalado localmente, actualiza las credenciales en `.env` según tu configuración local.

### Levantar el servidor

Una vez que tienes la BD lista (Docker o local), inicia el servidor de desarrollo:

```bash
npm run dev
```

El servidor estará disponible en **`http://localhost:3001`**

Al iniciar, el backend ejecuta `sequelize.sync()` y crea automáticamente las tablas que falten en PostgreSQL.

> Si agregaste nuevas columnas en modelos (por ejemplo `connections.invitation_token` y `connections.target_email`), conviene correr `npm run db:prepare` para regenerar la estructura y datos de ejemplo de forma consistente.

### Cargar datos semilla

Para cargar datos de prueba en cualquier PostgreSQL configurado en `.env`:

```bash
npm run db:seed
```

El seed es idempotente: si lo ejecutas varias veces, no duplica registros porque usa búsquedas por claves únicas lógicas antes de crear datos.
La carga ahora está dividida por modelo y cubre usuarios, estudiantes, institutos, carreras, planes, materias, correlatividades, comisiones (courses), horarios, registros académicos, finales, materiales, votos y configuraciones del sistema.
Este comando requiere que la base ya esté levantada; si acabas de ejecutar `npm run db:down`, usa `npm run db:up` o `npm run db:prepare`.

### Preparar la base completa

Si querés levantar la BD y cargar los datos de prueba en un solo paso:

```bash
npm run db:prepare
```

Ese comando recrea la BD desde cero con `db:reset` y luego ejecuta `db:seed`, así los IDs de ejemplo quedan consistentes con la colección de Postman.

### Verificar que está funcionando

```bash
curl http://localhost:3001/api/health
```

Debe devolver:
```json
{"status": "OK", "message": "Server is running"}
```

## Documentacion API (Swagger/OpenAPI)

Con el backend en ejecucion, puedes acceder a:

- Swagger UI: `http://localhost:3001/api/docs`
- OpenAPI JSON: `http://localhost:3001/api/openapi.json`

La documentacion actual cubre de forma amplia los recursos del backend (auth, users, admins, students, careers, institutes, subjects, plans, plan-subjects, bloques de plan, custom-study-plans, academic-records, final-exams, activities, activity-records, material, votes, posts, comments, connections, notifications, sessions, reports, report-reasons, novelties, uploads, system-config, study-sessions e instance-subjects).

## Producción

```bash
npm start
```

## Lint

Para verificar errores de código:

```bash
npm run lint
```

## Testing

Las pruebas son 100% unitarias: **no requieren base de datos ni servidor activo**. Cada módulo se prueba en aislamiento con mocks de Jest.

### Correr todos los tests

```bash
npm test
```

### Correr en modo CI (secuencial, sin workers paralelos)

Ideal para pipelines de integración continua o para depurar fallos:

```bash
npm run test:ci
```

### Generar reporte de cobertura

Produce un resumen en consola y un reporte HTML navegable en `coverage/`:

```bash
npm run test:coverage
```

El reporte HTML se abre en `coverage/index.html` y permite ver línea por línea qué código está cubierto.

> La carpeta `coverage/` está en `.gitignore` y no se commitea.

### Estructura de los tests

```
tests/
├── mocks/
│   └── mockData.js          # Datos de prueba compartidos por todos los tests
├── setup.js                 # Bootstrap global: variables de entorno de test
├── authController.test.js
├── userController.test.js
├── ...                      # Un archivo por módulo (controller / middleware)
└── materialVoteHooks.test.js
```

### Historial de cobertura por sprint

| Sprint | Fecha | Statements | Branches | Functions | Lines |
|--------|-------|-----------|----------|-----------|-------|
| Sprint 3 (baseline) | 2026-05-31 | 71.64% | 82.26% | 96.23% | 71.88% |

> Al cerrar cada sprint, correr `npm run test:coverage`, tomar los valores de la fila `All files` y agregar una nueva fila a esta tabla.

## CI/CD (Integración y Despliegue Continuo)

El proyecto utiliza **GitHub Actions** para automatizar el ciclo de vida de desarrollo.

### Backend (Render)
- **CI**: En cada Pull Request o Push a `main`, se ejecutan automáticamente `npm run lint` y `npm test`.
- **CD**: Si las pruebas pasan y el cambio es en `main`, se dispara un Webhook que notifica a Render para iniciar el despliegue.
- **Configuración requerida**: En el repositorio de GitHub, ir a `Settings > Secrets and variables > Actions` y agregar `RENDER_DEPLOY_HOOK` con la URL proporcionada por Render.
  1. Ir a la pestaña **Settings** del repositorio en GitHub.
  2. En el menú lateral izquierdo, buscar la sección **Security**.
  3. Hacer clic en **Secrets and variables** > **Actions**.
  4. Clic en el botón **New repository secret**.
  5. Nombre: `RENDER_DEPLOY_HOOK` | Valor: (La URL del Deploy Hook de Render).

### Frontend (Vercel) - Proximamente
- Se integra directamente con el repositorio de GitHub.
- Vercel detecta cambios en `main`, ejecuta el build y disponibiliza la URL de producción.

### Variables de Entorno en Producción
Asegúrate de configurar las siguientes variables en el dashboard de la plataforma cloud:
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`.
- `JWT_SECRET` (Clave fuerte para producción).
- `NODE_ENV=production`.

### Verificación del Despliegue en la Nube
Una vez que la pipeline de GitHub Actions termine exitosamente (check verde), podés verificar el estado del servidor en producción accediendo a:
`https://tu-url-de-render.onrender.com/api/health`

También podés monitorear los logs en tiempo real desde el dashboard de Render para asegurar que la conexión a PostgreSQL sea exitosa y que el servidor esté escuchando peticiones.

## Stack Tecnológico

- **Node.js** 20+ - Runtime
- **Express** 4.18.0 - Web framework
- **Sequelize** 6.35.0 - ORM
- **PostgreSQL** - Base de datos relacional
- **Helmet** 7.1.0 - Seguridad HTTP
- **CORS** 2.8.5 - Manejo de CORS
- **dotenv** 16.3.1 - Gestión de variables de entorno
- **bcryptjs** 2.4.3 - Encriptación de contraseñas
- **jsonwebtoken** 9.0.2 - Gestión de sesiones (JWT)
- **Nodemon** 3.0.1 - Dev server con hot reload

### Testing

- **Jest** 30.3.0 - Framework de tests unitarios, runner y assertions
- **jest-circus** (incluido en Jest) - Runner por defecto desde Jest 27+

## Estructura del Proyecto

```
src/
├── index.js              - Punto de entrada del servidor
└── config/
    └── database.js       - Configuración de Sequelize y PostgreSQL
```

## Variables de Entorno

Revisa `.env.example` para ver todas las variables disponibles:

- `DB_HOST` - Host de PostgreSQL (default: localhost)
- `DB_PORT` - Puerto de PostgreSQL (default: 5432)
- `DB_NAME` - Nombre de la base de datos
- `DB_USER` - Usuario de PostgreSQL
- `DB_PASSWORD` - Contraseña de PostgreSQL
- `JWT_SECRET` - Clave secreta para firmar tokens (default: your-secret-key)
- `JWT_EXPIRES_IN` - Tiempo de expiración del token (default: 24h)
- `PORT` - Puerto del servidor (default: 3001)
- `FRONTEND_URL` - URL base del frontend para construir links de invitación (default: http://localhost:3000)
- `SMTP_HOST` - Host SMTP para envío de emails (sin default)
- `SMTP_PORT` - Puerto SMTP (default: 587)
- `SMTP_SECURE` - `true` para TLS implícito (default: false)
- `SMTP_USER` - Usuario SMTP
- `SMTP_PASS` - Password/App password SMTP
- `SMTP_FROM` - Remitente usado por el backend

## Probando los Endpoints

### Usando Postman

#### Importar la colección

1. Abre **Postman**
2. Haz clic en **Import**
3. Selecciona el archivo `DesApp.postman_collection.json` en la raíz del proyecto
4. La colección se cargará con todos los endpoints organizados por recurso

#### Variables de entorno en Postman

La colección usa la variable `base_url` que por defecto es `http://localhost:3001`. 
Si necesitas cambiar el host o puerto, edita la variable en Postman:

1. Ve a la pestaña de **Variables** de la colección
2. Actualiza `base_url` según tu configuración
3. Guarda los cambios

#### Endpoints disponibles

- **Auth**: Registro (`/api/auth/register`), Login (`/api/auth/login`) y Perfil (`/api/auth/me`)
- **Careers**: CRUD completo para carreras (`/api/careers`)
- **Academic Records**: CRUD para registros académicos (`/api/academic-records`)
- **Institutes**: CRUD para institutos (`/api/institutes`)
- **Study Sessions**: CRUD, solicitudes de inscripción, y aprobaciones (`/api/study-sessions`)

#### Credenciales de Prueba (Seed)

Si ejecutaste `npm run db:seed`, podés usar estos usuarios:

| Email | Password | Rol |
|-------|----------|-----|
| `admin@example.com` | `admin` | `ADMIN` |
| `student1@example.com` | `password` | `STUDENT` |
| `student2@example.com` | `password` | `STUDENT` |
| `student3@example.com` | `password` | `STUDENT` |
| `student4@example.com` | `password` | `STUDENT` |
| `student5@example.com` | `password` | `STUDENT` |
| `student6@example.com` | `password` | `STUDENT` |
| `student7@example.com` | `password` | `STUDENT` |
| `student8@example.com` | `password` | `STUDENT` |
| `student9@example.com` | `password` | `STUDENT` |
| `student10@example.com` | `password` | `STUDENT` |


### Usando cURL

Ejemplo para obtener todas las carreras:

```bash
curl -X GET http://localhost:3001/api/careers
```

Ejemplo para login (obteniendo el token):

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin"
  }'
```


## Notas

- El servidor se inicia sin problemas aunque no haya BD configurada
- Para conectar a BD, configura las variables en `.env`
- El `docker-compose.yml` utiliza las variables de entorno del archivo `.env`
- Los datos en Docker se persisten en un volumen `postgres_data` incluso si detiene el contenedor
- La imagen de PostgreSQL se fijó en la versión 15 para ser compatible con el volumen existente
- Para levantar la BD usa `npm run db:up`
- Si cambias `DB_PASSWORD` o `DB_USER`, usa `npm run db:reset` para recrear el volumen con esas credenciales
- Para ver logs usa `npm run db:logs`
- Las requests de `academicRecord` requieren que existan `User`, `Student`, `StudyPlan` y `PlanSubject` creados previamente
- Todos los cambios en `src/` se reflejan automáticamente en desarrollo gracias a nodemon
- Si SMTP no está configurado, el backend no rompe el flujo de invitaciones: omite el envío real de email y deja un warning en logs