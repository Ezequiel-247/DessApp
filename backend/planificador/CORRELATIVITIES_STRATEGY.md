# Estrategia Óptima de Correlatividades para Seeders

## 📌 Problema Actual

El planificador implementado (MyPlanner Fases 1-6) **valida correlatividades en cada movimiento de materia**. Sin embargo:

- ❌ Muchas materias NO tienen correlatividades definidas
- ❌ Esto permite movimientos no realistas (ej: Bases de Datos sin prerequisitos)
- ❌ La falta de datos hace que W0 aparezca frecuentemente
- ❌ El sistema no refleja la estructura académica real
- ❌ Movimientos "mágicos" sin validación pedagógica

---

## 🎯 Objetivo

Definir un **mapeo completo y coherente de correlatividades** que:

1. ✅ Refleje dependencias académicas reales
2. ✅ Prevenga movimientos imposibles en el planificador
3. ✅ Permita al algoritmo generar planes realistas
4. ✅ Facilite cascadas inteligentes cuando se mueve una materia
5. ✅ Mejore UX: usuario ve clara la secuencia de aprendizaje

---

## 📊 Análisis de Correlatividades Actuales

### Plan 0: Ingeniería en Computación

**Definidas (7 correlatividades):**
```
MAT-102        ← MAT-101 (regularidad)
PROG-102       ← PROG-101 (aprobacion)
AED-201        ← PROG-102 (aprobacion)
SO-202         ← ORG-101 (regularidad)
IS-301         ← AED-201 (aprobacion)
RED-302        ← SO-202 (finalizada)
PF-402         ← IS-301 (finalizada)
```

**Electivas Computación (requieren bases):**
```
ECOM-01/02/03/04/05  ← MAT-101 + PROG-101 (regularidad)
```

**FALTANTES o DÉBILES:**
- ❌ `ORG-101` → sin prerequisitos (debería requerir MAT-101)
- ❌ `BD-201` → sin prerequisitos NI dependientes (CRÍTICO)
- ❌ `SO-202` → solo requiere ORG-101 (debería requerir AED-201)
- ❌ NO hay cadena completa hacia proyecto final

### Plan 1: Ingeniería Ambiental

**Definidas (8 correlatividades):**
```
MAT-102        ← MAT-101 (regularidad)
QUI-102        ← QUI-101 (aprobacion)
ECO-201        ← BIO-101 (regularidad)
MIC-202        ← QUI-102 (aprobacion)
OPE-301        ← MAT-102 (aprobacion)
CON-401        ← ECO-201 (finalizada)
TPF-501        ← CON-401 (regularidad)
PF-502         ← TPF-501 (aprobacion)
```

**FALTANTES:**
- ❌ Materias intermedias sin requisitos claros
- ❌ SIG-302 (Sistemas de Información Geográfica) sin correlativas
- ✅ Mejor estructurada que Plan 0

---

## 💡 Propuesta: Estructura Ideal

### Principios Fundamentales

1. **Cadenas Lógicas**: Cada materia debe tener un camino claro
2. **Múltiples Prereqs**: Materias avanzadas requieren varias bases
3. **Tipos Variados**: Usar `regularidad`, `aprobacion`, `finalizada` según contexto
4. **Evitar Ciclos**: No permitir dependencias circulares

### Mapeo Propuesto por Carrera

---

## 📋 PLAN 0: Ingeniería en Computación (Revisado)

### Rama 1: Matemática & Fundamentos

```
Año 1, C1:
  ├─ MAT-101 (0 prereqs) → base de todo
  │  ├─ → requiere MAT-101: [MAT-102, PROG-101, ORG-101]
  │
  ├─ PROG-101 (0 prereqs)
  │  ├─ regularidad → PROG-102
  │  ├─ regularidad → AED-201 (indirectamente vía PROG-102)
  │
  └─ ORG-101 (0 prereqs)
     ├─ regularidad → SO-202

Año 1, C2:
  ├─ MAT-102
  │  └─ regularidad → MAT-101 ✓ DEFINIDA
  │
  ├─ PROG-102
  │  └─ aprobacion → PROG-101 ✓ DEFINIDA
  │
  └─ [Materia-X: Algebra/Discreta]
     └─ regularidad → MAT-101
```

### Rama 2: Core CS

```
Año 2, C1:
  ├─ AED-201 (Algoritmos y Estructuras)
  │  ├─ aprobacion → PROG-102 ✓ DEFINIDA
  │  └─ aprobacion → MAT-102 [AGREGAR]
  │
  ├─ BD-201 (Bases de Datos) ← CRÍTICA
  │  ├─ aprobacion → PROG-102 [AGREGAR]
  │  └─ aprobacion → AED-201 [AGREGAR]
  │
  └─ SO-202 (Sistemas Operativos)
     ├─ regularidad → ORG-101 ✓ DEFINIDA
     ├─ aprobacion → AED-201 [AGREGAR]
     └─ aprobacion → PROG-102 [AGREGAR]

Año 2, C2:
  └─ [Materia-Y: Compiladores/Lenguajes]
     ├─ aprobacion → AED-201
     └─ aprobacion → PROG-102
```

### Rama 3: Especialización

```
Año 3, C1:
  ├─ IS-301 (Ingeniería de Software)
  │  ├─ aprobacion → AED-201 ✓ DEFINIDA
  │  └─ finalizada → BD-201 [AGREGAR]
  │
  └─ RED-302 (Redes)
     ├─ finalizada → SO-202 ✓ DEFINIDA
     ├─ aprobacion → AED-201 [AGREGAR]
     └─ aprobacion → ORG-101 [AGREGAR]

Año 3, C2:
  └─ [Electivas Intermedias]
     └─ aprobacion → AED-201
```

### Rama 4: Integración Final

```
Año 4, C2:
  └─ PF-402 (Proyecto Final)
     ├─ finalizada → IS-301 ✓ DEFINIDA
     ├─ finalizada → RED-302 [AGREGAR]
     ├─ finalizada → BD-201 [AGREGAR]
     └─ regularidad → SO-202 [AGREGAR]

Año 4, C1 (Electivas):
  ├─ ECOM-01/02/03/04/05
  │  ├─ regularidad → MAT-101 ✓ DEFINIDA
  │  └─ regularidad → PROG-101 ✓ DEFINIDA
```

---

## 📋 PLAN 1: Ingeniería Ambiental (Revisado)

### Rama 1: Ciencias Básicas

```
Año 1, C1:
  ├─ MAT-101 (0 prereqs)
  │  └─ regularidad → [MAT-102, QUI-101]
  │
  ├─ QUI-101 (0 prereqs)
  │  ├─ aprobacion → QUI-102
  │  └─ regularidad → MIC-202 (indirectamente vía QUI-102)
  │
  └─ BIO-101 (0 prereqs)
     └─ regularidad → ECO-201

Año 1, C2:
  ├─ MAT-102
  │  └─ regularidad → MAT-101 ✓ DEFINIDA
  │
  ├─ QUI-102
  │  └─ aprobacion → QUI-101 ✓ DEFINIDA
  │
  └─ EST-201 (Estadística)
     └─ regularidad → MAT-101 [AGREGAR]
```

### Rama 2: Ciencias Ambientales

```
Año 2, C1:
  ├─ ECO-201 (Ecología General)
  │  ├─ regularidad → BIO-101 ✓ DEFINIDA
  │  └─ aprobacion → QUI-102 [AGREGAR]
  │
  ├─ OPE-301 (Operaciones Unitarias)
  │  ├─ aprobacion → MAT-102 ✓ DEFINIDA
  │  └─ aprobacion → QUI-102 [AGREGAR]
  │
  └─ MIC-202 (Microbiología)
     ├─ aprobacion → QUI-102 ✓ DEFINIDA
     └─ regularidad → BIO-101 [AGREGAR]

Año 2, C2:
  └─ SIG-302 (Sistemas de Información Geográfica)
     ├─ regularidad → MAT-101 [AGREGAR]
     └─ regularidad → ECO-201 [AGREGAR]
```

### Rama 3: Especialización Ambiental

```
Año 3, C1:
  └─ CON-401 (Contaminación Ambiental)
     ├─ finalizada → ECO-201 ✓ DEFINIDA
     ├─ finalizada → OPE-301 [AGREGAR]
     └─ finalizada → MIC-202 [AGREGAR]

Año 3, C2:
  └─ [Electivas Ambiente]
     └─ aprobacion → ECO-201
```

### Rama 4: Proyecto Integrador

```
Año 5, C1:
  ├─ TPF-501 (Taller Proyecto Final)
  │  └─ regularidad → CON-401 ✓ DEFINIDA
  │
  ├─ EAMB-01/02/03/04 (Electivas)
  │  └─ regularidad → ECO-201 [AGREGAR]
  │
  └─ Optativa

Año 5, C2:
  └─ PF-502 (Proyecto Final Ambiental)
     ├─ aprobacion → TPF-501 ✓ DEFINIDA
     ├─ finalizada → CON-401 [AGREGAR]
     ├─ finalizada → OPE-301 [AGREGAR]
     └─ finalizada → MIC-202 [AGREGAR]
```

---

## 📊 Resumen de Cambios Propuestos

### Plan 0: Ingeniería en Computación

| Materia Destino | Prerequisito | Tipo | Estado | Motivo |
|-----------------|--------------|------|--------|--------|
| ORG-101 | MAT-101 | regularidad | **[AGREGAR]** | Base teórica |
| BD-201 | PROG-102 | aprobacion | **[AGREGAR]** | Debe saber programar |
| BD-201 | AED-201 | aprobacion | **[AGREGAR]** | Necesita estructuras de datos |
| AED-201 | MAT-102 | aprobacion | **[AGREGAR]** | Base matemática |
| SO-202 | AED-201 | aprobacion | **[AGREGAR]** | Necesita algoritmos |
| SO-202 | PROG-102 | aprobacion | **[AGREGAR]** | Implementación |
| IS-301 | BD-201 | finalizada | **[AGREGAR]** | Crítico: datos en proyectos |
| RED-302 | AED-201 | aprobacion | **[AGREGAR]** | Análisis de protocolos |
| RED-302 | ORG-101 | aprobacion | **[AGREGAR]** | Arquitectura de redes |
| PF-402 | RED-302 | finalizada | **[AGREGAR]** | Integración completa |
| PF-402 | BD-201 | finalizada | **[AGREGAR]** | Integración completa |
| PF-402 | SO-202 | regularidad | **[AGREGAR]** | Integración completa |

**Total agregadas**: 12 correlatividades → Total Plan 0: 19 (7 + 12)

---

### Plan 1: Ingeniería Ambiental

| Materia Destino | Prerequisito | Tipo | Estado | Motivo |
|-----------------|--------------|------|--------|--------|
| EST-201 | MAT-101 | regularidad | **[AGREGAR]** | Base matemática |
| ECO-201 | QUI-102 | aprobacion | **[AGREGAR]** | Comprensión química |
| OPE-301 | QUI-102 | aprobacion | **[AGREGAR]** | Procesos químicos |
| MIC-202 | BIO-101 | regularidad | **[AGREGAR]** | Base biológica |
| SIG-302 | MAT-101 | regularidad | **[AGREGAR]** | Análisis espacial |
| SIG-302 | ECO-201 | regularidad | **[AGREGAR]** | Aplicaciones ambientales |
| CON-401 | OPE-301 | finalizada | **[AGREGAR]** | Procesos de remediación |
| CON-401 | MIC-202 | finalizada | **[AGREGAR]** | Biorremediación |
| PF-502 | CON-401 | finalizada | **[AGREGAR]** | Integración completa |
| PF-502 | OPE-301 | finalizada | **[AGREGAR]** | Integración completa |
| PF-502 | MIC-202 | finalizada | **[AGREGAR]** | Integración completa |
| EAMB-01/02/03/04 | ECO-201 | regularidad | **[AGREGAR]** | Electivas especializadas |

**Total agregadas**: 12 correlatividades → Total Plan 1: 20 (8 + 12)

---

## 🎯 Beneficios para MyPlanner

### Actual (Con huecos)
```
Usuario mueve BD-201 a semestre 1 → ❌ NO HAY VALIDACIÓN
El algoritmo no ve correlatividades → Movimiento libre
Plan resultante: No realista pero "válido" según código
```

### Propuesto (Completo)
```
Usuario intenta mover BD-201 a semestre 1 → ✅ VALIDA
El algoritmo ve:
  - BD-201 requiere PROG-102 (aprobacion)
  - BD-201 requiere AED-201 (aprobacion)
Resultado: Se rechaza o se mueven en cascada esos prereqs
Plan resultante: Académicamente realista
```

### Impacto en Features Implementadas

| Feature | Mejora |
|---------|--------|
| **Clasificación (Fase 1)** | Mejor distingue entre faltante/enrolled |
| **Finales (Fase 2)** | Finales más relevantes si prereqs están completos |
| **Tipado (Fase 3)** | Bloques genéricos se asignan más inteligentemente |
| **Excel (Fase 5)** | Importación respeta estructura real |
| **Feedback (Fase 6)** | Cascadas tienen sentido pedagógico |

---

## 📝 Plan de Implementación

### Fase 1: Validación Interna (Equipo Dev)
1. Revisar correlatividades propuestas con coordinadores académicos
2. Verificar que no haya ciclos (DFS para validar DAG)
3. Documentar lógica de cada correlatividad

### Fase 2: Actualizar Seeder
```javascript
// backend/src/seeders/correlativities.seeder.js
const correlativityTemplates = [
  // Computación - EXISTENTES
  { main: 3, required: 0, type: 'regularidad' },
  { main: 4, required: 1, type: 'aprobacion' },
  // ... (7 existentes)
  
  // Computación - NUEVAS [AGREGAR]
  { main: 2, required: 0, type: 'regularidad' }, // ORG-101 ← MAT-101
  { main: 6, required: 4, type: 'aprobacion' },  // BD-201 ← PROG-102
  { main: 6, required: 5, type: 'aprobacion' },  // BD-201 ← AED-201
  // ... (12 nuevas)
];
```

### Fase 3: Reseed Database
```bash
# Reseed solo correlativities
npm run seed:reset --only=correlativities
```

### Fase 4: Test Planificador
```bash
# Verificar que movimientos respetan nuevas correlatividadescss
npm test -- src/features/myPlanner/customPlan/services/editEngine.test.ts
```

---

## ⚠️ Consideraciones Especiales

### 1. Tipos de Correlativity
Usar según contexto:

- **`regularidad`**: Simplemente estar cursando/regularizado
- **`aprobacion`**: Debe estar aprobado (con nota)
- **`finalizada`**: Debe estar completamente finalizado (examen final)

```javascript
// Ejemplo:
// PROG-102 requiere aprobacion de PROG-101 (no basta regularidad)
{ main: 4, required: 1, type: 'aprobacion' }

// Pero MAT-102 solo requiere regularidad de MAT-101
{ main: 3, required: 0, type: 'regularidad' }
```

### 2. Evitar Bloqueos Excesivos
- ❌ NO requerir 5+ prerequisitos para una materia
- ✅ Requerir solo los esenciales (máx 2-3)
- ❌ NO crear cadenas muy largas (máx 4 pasos)

### 3. Validación Técnica
Antes de insertar, validar:

```sql
-- Verificar ciclos (debe retornar 0 filas)
SELECT COUNT(*) FROM correlativity c1
WHERE EXISTS (
  SELECT 1 FROM correlativity c2
  WHERE c2.id_plan_subject_target = c1.id_required_plan_subject
  AND c2.id_required_plan_subject = c1.id_plan_subject_target
);
```

### 4. Documento Vivo
Este documento debe actualizarse cuando:
- Se agreguen nuevas materias
- Se cambien flujos académicos
- Coordinadores indiquen nuevos requisitos

---

## 🚀 Siguiente Paso

**Propuesta para Reunión**:

> "Tenemos definidas solo 15 correlatividades de 40+ materias. Propongo estructurar una cadena pedagógica completa (19 para Computación, 20 para Ambiental) que:
> 1. Refleje requisitos académicos reales
> 2. Mejore el planificador (evitar movimientos imposibles)
> 3. Facilite cascadas inteligentes
> 4. Sea documentada y mantenible
>
> Ver: `CORRELATIVITIES_STRATEGY.md` para detalles y mapeo propuesto"

---

**Creado**: 2026-07-01
**Estado**: Propuesta para discussión  
**Impacto**: MyPlanner Fases 1-6 funcionarán mejor con esto en lugar
