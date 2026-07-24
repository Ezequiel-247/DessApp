# Seeders — Guía de implementación

## Orden de trabajo

1. **Fase 1: Computación** — subjects + planSubjects + blocks + correlativities
2. **Fase 2: Ambiente** — extender arrays con datos de Ambiente
3. **Fase 3: Cursos, records, actividades** — courses, academicRecords, extracurriculars

---

## 1. Subjects (catálogo compartido)

42 materias, índice global. Las UNAHUR se listan al final.

| idx | Código | Nombre | UNAHUR |
|-----|--------|--------|--------|
| 0 | MAT-101 | Matemática I | No |
| 1 | PROG-101 | Programación I | No |
| 2 | ORG-101 | Organización de Computadoras | No |
| 3 | MAT-102 | Matemática II | No |
| 4 | PROG-102 | Programación II | No |
| 5 | AED-201 | Algoritmos y Estructuras de Datos | No |
| 6 | BD-201 | Bases de Datos | No |
| 7 | SO-202 | Sistemas Operativos | No |
| 8 | IS-301 | Ingeniería de Software | No |
| 9 | RED-302 | Redes de Computadoras | No |
| 10 | PF-402 | Proyecto Final Computación | No |
| 11 | ECOM-01 | Inteligencia Artificial Aplicada | No |
| 12 | ECOM-02 | Ciberseguridad | No |
| 13 | ECOM-03 | Desarrollo Web Avanzado | No |
| 14 | ECOM-04 | Computación en la Nube | No |
| 15 | ECOM-05 | Sistemas Embebidos | No |
| 16 | QUI-101 | Química General | No |
| 17 | BIO-101 | Biología General | No |
| 18 | QUI-102 | Química Orgánica | No |
| 19 | ECO-201 | Ecología General | No |
| 20 | EST-201 | Estadística | No |
| 21 | MIC-202 | Microbiología Ambiental | No |
| 22 | OPE-301 | Operaciones Unitarias | No |
| 23 | SIG-302 | Sistemas de Información Geográfica | No |
| 24 | CON-401 | Contaminación Ambiental | No |
| 25 | TPF-501 | Taller de Proyecto Final Ambiental | No |
| 26 | PF-502 | Proyecto Final Ambiental | No |
| 27 | EAMB-01 | Evaluación de Impacto Ambiental | No |
| 28 | EAMB-02 | Gestión de Residuos Urbanos | No |
| 29 | EAMB-03 | Energías Renovables | No |
| 30 | EAMB-04 | Tratamiento de Efluentes | No |
| 31 | UNA-01 | Ética Profesional | Sí |
| 32 | UNA-02 | Nuevos Entornos Digitales | Sí |
| 33 | UNA-03 | Problemática Ambiental Contemporánea | Sí |
| 34 | UNA-04 | Taller de Comunicación Oral y Escrita | Sí |

---

## 2. PlanSubjects (índice global)

32 registros: 15 Computación (0–14) + 17 Ambiente (15–31).
Misma estructura que antes: `{ plan_index, subject_index, suggested_year, suggested_term, weekly_hours, credits }`.

### FASE 1: Computación (plan_index=0, 15 registros)

| ps_idx | subj_idx | Materia | Año | T | Hs | Cr |
|--------|----------|---------|-----|---|----|----|
| 0 | 0 | MAT-101 | 1 | 1 | 6 | 6 |
| 1 | 1 | PROG-101 | 1 | 1 | 4 | 4 |
| 2 | 2 | ORG-101 | 1 | 1 | 4 | 4 |
| 3 | 3 | MAT-102 | 1 | 2 | 6 | 6 |
| 4 | 4 | PROG-102 | 1 | 2 | 4 | 4 |
| 5 | 5 | AED-201 | 2 | 1 | 4 | 4 |
| 6 | 6 | BD-201 | 2 | 1 | 4 | 4 |
| 7 | 7 | SO-202 | 2 | 2 | 4 | 4 |
| 8 | 8 | IS-301 | 3 | 1 | 4 | 4 |
| 9 | 9 | RED-302 | 3 | 2 | 4 | 4 |
| 10 | 10 | PF-402 | 4 | 2 | 6 | 8 |
| 11 | 31 | UNA-01 | 4 | 1 | 2 | 2 |
| 12 | 32 | UNA-02 | 4 | 1 | 2 | 2 |
| 13 | 33 | UNA-03 | 4 | 2 | 2 | 2 |
| 14 | 34 | UNA-04 | 4 | 2 | 2 | 2 |

### FASE 2: Ambiente (plan_index=1, 17 registros, ps_idx 15–31)

| ps_idx | subj_idx | Materia | Año | T | Hs | Cr |
|--------|----------|---------|-----|---|----|----|
| 15 | 0 | MAT-101 | 1 | 1 | 6 | 6 |
| 16 | 16 | QUI-101 | 1 | 1 | 4 | 4 |
| 17 | 17 | BIO-101 | 1 | 1 | 4 | 4 |
| 18 | 3 | MAT-102 | 1 | 2 | 6 | 6 |
| 19 | 18 | QUI-102 | 1 | 2 | 4 | 4 |
| 20 | 19 | ECO-201 | 2 | 1 | 4 | 4 |
| 21 | 20 | EST-201 | 2 | 1 | 4 | 4 |
| 22 | 21 | MIC-202 | 2 | 2 | 4 | 4 |
| 23 | 22 | OPE-301 | 3 | 1 | 6 | 6 |
| 24 | 23 | SIG-302 | 3 | 2 | 4 | 4 |
| 25 | 24 | CON-401 | 4 | 1 | 4 | 4 |
| 26 | 25 | TPF-501 | 5 | 1 | 4 | 4 |
| 27 | 26 | PF-502 | 5 | 2 | 6 | 8 |
| 28 | 31 | UNA-01 | 4 | 1 | 2 | 2 |
| 29 | 32 | UNA-02 | 4 | 2 | 2 | 2 |
| 30 | 33 | UNA-03 | 5 | 1 | 2 | 2 |
| 31 | 34 | UNA-04 | 5 | 2 | 2 | 2 |

---

## 3. Bloques UNAHUR

### Computación (1 bloque)
| id_study_plan | suggested_year | suggested_term | sort_order |
|---|---|---|---|
| studyPlans[0].id | 4 | null | 1 |

### Ambiente (2 bloques)
| id_study_plan | suggested_year | suggested_term | sort_order |
|---|---|---|---|
| studyPlans[1].id | 4 | null | 1 |
| studyPlans[1].id | 5 | null | 2 |

---

## 4. Bloques electivos

### Computación (2 bloques)

**Bloque 1:** min_required=1, pool=[ECOM-01, ECOM-02] (subjects[11], subjects[12])
**Bloque 2:** min_required=2, pool=[ECOM-03, ECOM-04, ECOM-05] (subjects[13], subjects[14], subjects[15])

### Ambiente (1 bloque)

**Bloque Único:** min_required=2, pool=[EAMB-01, EAMB-02, EAMB-03, EAMB-04] (subjects[27..30])

---

## 5. Bloques de créditos

### Computación (3 bloques)

| Bloque | min_credits | max_credits | Actividades |
|--------|-------------|-------------|-------------|
| 1 | 3 | 6 | Taller Robótica (2), Seminario Linux (1), Jornadas Computación (1) |
| 2 | 4 | 8 | Curso Python Avanzado (3), Hackathon (2), Taller Empleabilidad (2) |
| 3 | 5 | 10 | Pasantía Investigación (4), Configuración Servidores (2), Seminario IA (2) |

### Ambiente (1 bloque)

| Bloque | min_credits | max_credits | Actividades |
|--------|-------------|-------------|-------------|
| Único | 5 | 10 | Voluntariado Reforestación (2), Taller Reciclaje (1), Curso Energías Limpias (3), Seminario Cambio Climático (2), Conferencia Biodiversidad (1) |

---

## 6. Correlatividades

### Computación (ps_idx 0–14)

```js
{ main: 3,  required: 0, type: 'regularidad' },  // MAT-102 ← MAT-101
{ main: 4,  required: 1, type: 'aprobacion' },    // PROG-102 ← PROG-101
{ main: 5,  required: 4, type: 'aprobacion' },    // AED-201 ← PROG-102
{ main: 7,  required: 2, type: 'regularidad' },   // SO-202 ← ORG-101
{ main: 8,  required: 5, type: 'aprobacion' },    // IS-301 ← AED-201
{ main: 9,  required: 7, type: 'finalizada' },    // RED-302 ← SO-202
{ main: 10, required: 8, type: 'finalizada' },    // PF-402 ← IS-301
```

### Ambiente (ps_idx 15–31)

```js
{ main: 18, required: 15, type: 'regularidad' },  // MAT-102 ← MAT-101
{ main: 19, required: 16, type: 'aprobacion' },   // QUI-102 ← QUI-101
{ main: 20, required: 17, type: 'regularidad' },  // ECO-201 ← BIO-101
{ main: 22, required: 19, type: 'aprobacion' },   // MIC-202 ← QUI-102
{ main: 23, required: 18, type: 'aprobacion' },   // OPE-301 ← MAT-102
{ main: 25, required: 20, type: 'finalizada' },   // CON-401 ← ECO-201
{ main: 26, required: 25, type: 'regularidad' },  // TPF-501 ← CON-401
{ main: 27, required: 26, type: 'aprobacion' },   // PF-502 ← TPF-501
```
