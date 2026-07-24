# DesApp Frontend

Frontend del proyecto DesApp desarrollado con React, Tailwind CSS y Vite.

## Requisitos Previos

- Node.js v20+ 
- npm v10+

## Variables De Entorno

El frontend usa una variable de entorno para apuntar al backend sin hardcodear URLs:

- `BACKEND_API_URL` - URL base del backend, por defecto `http://localhost:3001`

Creá un archivo `.env` en la raíz del frontend copiando el ejemplo:

```bash
cp .env.example .env
```

Si el backend corre en otro puerto o host, ajustá `BACKEND_API_URL` en ese archivo.

## Instalación

### 1. Clonar el repositorio
```bash
git clone https://github.com/DesApp-2026c1-Grupo-3/frontend.git
cd frontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```
Copiá el archivo de ejemplo y asegurate de que `VITE_API_URL` apunte al puerto donde corre tu backend (por defecto `http://localhost:3001`).


## Desarrollo

Para levantar el servidor de desarrollo en modo watch:

```bash
npm run dev
```

El servidor estará disponible en **`http://localhost:3000`**

Por defecto, el frontend enviará sus requests al backend definido en `BACKEND_API_URL`. Si no configuraste nada, usará `http://localhost:3001`.

### Levantar el backend para probar la integración

En el backend ejecutá:

```bash
npm run db:prepare
npm run dev
```

El backend queda en **`http://localhost:3001`** y expone las rutas bajo `/api`.

### Prueba manual recomendada

1. Levantá la base y el backend.
2. Levantá el frontend con `npm run dev`.
3. Abrí la UI en `http://localhost:3000`.
4. Verificá que los flujos que consumen API estén pegando contra el backend local configurado en `BACKEND_API_URL`.

## Build para Producción

```bash
npm run build
```

## Preview de Build

```bash
npm preview
```

## Testing

Las pruebas son 100% unitarias: **no requieren backend ni servidor activo**. Cada módulo se prueba en aislamiento con mocks de MSW.

### Correr todos los tests

```bash
npm test
```

### Correr en modo CI (una sola vez, sin modo watch)

Ideal para pipelines de integración continua o para verificar que todo pasa antes de hacer commit:

```bash
npm run test:run
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
├── setup.ts                  # Configura @testing-library/jest-dom globalmente
├── apis/                     # Tests de capa API (MSW intercepta fetch real)
│   ├── academicRecord.test.ts
│   ├── admin.test.ts
│   ├── career.test.ts
│   ├── connection.test.ts
│   ├── correlativity.test.ts
│   ├── finalExam.test.ts
│   ├── institute.test.ts
│   ├── material.test.ts
│   ├── notification.test.ts
│   ├── plan.test.ts
│   ├── planSubject.test.ts
│   ├── session.test.ts
│   ├── student.test.ts
│   ├── studentCareerEnrollment.test.ts
│   ├── subject.test.ts
│   └── user.test.ts
└── entities/                 # Tests de capa model (normalización / constantes)
    ├── academicRecord.test.ts
    ├── career.test.ts
    ├── connection.test.ts
    ├── correlativity.test.ts
    ├── finalExam.test.ts
    ├── institute.test.ts
    ├── material.test.ts
    ├── notification.test.ts
    ├── plan.test.ts
    ├── planSubject.test.ts
    ├── session.test.ts
    ├── student.test.ts
    ├── studentCareerEnrollment.test.ts
    ├── subject.test.ts
    └── user.test.ts
```

### Historial de cobertura por sprint

| Sprint | Fecha | Statements | Branches | Functions | Lines |
|--------|-------|-----------|----------|-----------|-------|
| Sprint 3 (baseline) | 2026-05-31 | 11.09% | 16.01% | 11.07% | 10.57% |

> La cobertura global baja se explica porque los tests de este sprint cubren únicamente la capa de entidades (models + API clients). Las features, páginas y widgets aún no tienen tests de componentes — queda identificado como gap para el próximo sprint.

> Al cerrar cada sprint, correr `npm run test:coverage`, tomar los valores de la fila `All files` y agregar una nueva fila a esta tabla.

## Lint

Para verificar errores de código en `src/`:

```bash
npm run lint
```

## Stack Tecnológico

- **React** 18.2.0 - UI framework
- **Tailwind CSS** 3.3.0 - Utility-first CSS
- **Vite** 5.0.0 - Build tool y dev server
- **ESLint** 8.54.0 - Linting

## Estructura del Proyecto

```
src/
├── App.jsx       - Componente principal
├── main.jsx      - Punto de entrada de la aplicación
└── index.css     - Estilos globales (Tailwind)
```

## Notas

- Asegúrate de tener Node.js correctamente instalado
- El servidor se abrirá automáticamente en el navegador
- Los cambios se reflejan en tiempo real durante el desarrollo
- Si necesitás cambiar el destino de API, modificá `BACKEND_API_URL` en `.env`
- El frontend habla con el backend a través de una URL base configurable, sin hardcodear `localhost:3001` en el código