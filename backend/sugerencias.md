# Prompt para generar materias de Ingeniería Ambiental

Copiar y pegar esto en ChatGPT, Claude o cualquier IA:

---

## Contexto

Tengo un sistema universitario con dos carreras:

1. **Lic. en Cs. de la Computación** — ya tiene su plan de estudios completo
2. **Ingeniería Ambiental** — **NO tiene materias asignadas**, necesito diseñar su plan

## Catálogo de materias existentes (puedo reusar estas)

| # | Materia | Código | ¿Obligatoria UNAHUR? |
|---|---------|--------|----------------------|
| 1 | Matematica I | MAT-101 | No |
| 2 | Programacion I | PROG-101 | No |
| 3 | Algoritmos y Estructuras de Datos | ALGO-201 | No |
| 4 | Base de Datos I | BD-201 | No |
| 5 | Arquitectura de Computadoras | ARQ-101 | No |
| 6 | Fisica General | FIS-101 | No |
| 7 | Estadistica Aplicada | EST-201 | No |
| 8 | Etica Profesional | ETI-301 | **Sí** |
| 9 | Inglés I | ING-101 | No |
| 10 | Gestion de Proyectos | GP-301 | No |
| 11 | Nuevos Entornos | NE-302 | **Sí** |
| 12 | Inteligencia Artificial I | IA-401 | No |
| 13 | Arquitectura de Sistemas | ARS-402 | No |
| 14 | Inglés II | ING-201 | No |
| 15 | Matematica II | MAT-102 | No |
| 16 | Programacion II | PROG-102 | No |
| 17 | Sistemas Operativos | SO-202 | No |
| 18 | Redes de Computadoras | RED-301 | No |
| 19 | Ingenieria de Software | IS-302 | No |
| 20 | Proyecto Final | PF-402 | No |

## Lo que necesito

### 1. Materias nuevas para Ingeniería Ambiental

Proponé materias nuevas típicas de una carrera de Ingeniería Ambiental (Química, Biología, Ecología, Hidrología, Impacto Ambiental, Energías Renovables, Legislación Ambiental, etc.).

De cada una decime: **nombre**, **código** (siglas + número), y si es **obligatoria UNAHUR** (debe haber al menos 2 materias UNAHUR nuevas).

### 2. Plan de estudios: ¿qué materia va en cada cuatrimestre?

La carrera dura **5 años = 10 cuatrimestres**. Decime qué materias cursar en cada cuatrimestre, incluyendo tanto las existentes que reutilices como las nuevas.

De cada materia en el plan decime:
- Nombre de la materia
- Año (1 a 5)
- Cuatrimestre (1 o 2)
- Horas semanales estimadas
- Créditos
- Si es electiva u obligatoria
- Si es cuatrimestral o anual

**Reglas sugeridas:**
- Años 1-2: materias básicas (Matemática, Física, Química, Biología, etc.)
- Años 3-4: materias específicas ambientales
- Año 5: electivas, proyecto final
- ~4 a 6 materias por cuatrimestre
- Máximo 3 electivas en toda la carrera

### 3. Correlatividades (prerrequisitos entre materias)

Decime qué materias son requisito de cuáles. Por ejemplo: "Química II requiere Química I aprobada", "Hidrología requiere Física aprobada".

Para cada relación decime:
- **Materia destino** (la que necesita el requisito)
- **Materia requerida** (la que se debe haber cursado)
- **Tipo de requisito**:
  - `regularidad` → alcanza con tenerla regularizada
  - `aprobación` → hay que tenerla aprobada
  - `finalizada` → hay que tenerla aprobada con final rendido

## Formato de respuesta esperado

**1. Nuevas materias:**
```
- Quimica General (QMI-101) - No UNAHUR
- Ecologia General (ECO-201) - Sí UNAHUR
- ...
```

**2. Plan de estudios por cuatrimestre:**
```
Año 1 - Cuatrimestre 1:
  - Matematica I (6 hrs/sem, 6 créditos, obligatoria, cuatrimestral)
  - Fisica General (6 hrs/sem, 6 créditos, obligatoria, cuatrimestral)
  - Quimica General (6 hrs/sem, 6 créditos, obligatoria, cuatrimestral)
  - ...

Año 1 - Cuatrimestre 2:
  - Matematica II (6 hrs/sem, 6 créditos, obligatoria, cuatrimestral)
  - ...
```

**3. Correlatividades (referir a las materias por su nombre):**
```
- Matematica II requiere Matematica I (regularidad)
- Quimica II requiere Quimica General (aprobación)
- ...
```

---

**IMPORTANTE:** Debe ser un plan realista para una Ingeniería Ambiental en universidad argentina. Respetar correlatividades lógicas.
