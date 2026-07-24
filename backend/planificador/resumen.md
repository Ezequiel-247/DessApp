# Year Breakdown — Documentación para Frontend

Endpoint: `GET /api/students/:id/academic-year-breakdown`

## Nuevos campos en bloques

### Bloques UNAHUR y Electivos (`block_type: "unahur" | "elective"`)

Se agregó `pool_subjects[]` en cada bloque. Cada elemento contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `subject_id` | number | ID de la materia |
| `subject_name` | string | Nombre de la materia |
| `classification` | string | Estado actual de la materia (`finalizada`, `equivalencia`, `regularizada`, `en_curso`, `faltante`) |
| `grade` | string\|null | Nota del registro académico |
| `status` | string\|null | Status del registro académico (`aprobado`, `equivalencia`, `pendiente`, `enrolled`, etc.) |
| `credits` | number\|null | Créditos de la materia |
| `available` | boolean | Si la materia está disponible para cursar (correlativas cumplidas) |
| `prerequisites` | array | Lista de correlativas (misma estructura que en subjects regulares) |
| `consumed` | boolean | **Solo para UNAHUR**: si la materia ya fue ocupada por un bloque UNAHUR anterior finalizado |

**Consumed**: Si un bloque UNAHUR se completa con una materia, esa materia se marca como `consumed: true` en los bloques siguientes. Visualmente se puede mostrar como "ya utilizada" pero no desaparece del pool. Para electivas, aplica la misma lógica si dos bloques electivos comparten materias en su pool.

### Bloques Crédito (`block_type: "credit"`)

Se agregó `activities[]` en cada bloque. Cada elemento contiene:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | number | ID de la actividad extracurricular |
| `name` | string | Nombre de la actividad |
| `credits` | number | Créditos que otorga |
| `approved` | boolean | Si está aprobada |

### Nueva classification: `equivalencia`

Ahora los subjects pueden tener `classification: "equivalencia"`. Se cuentan igual que `finalizada` en los totales del año (suman en `finalizadas`), pero el frontend puede mostrar un ícono o etiqueta distinta para distinguirlas.
