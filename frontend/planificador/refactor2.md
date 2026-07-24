# Plan de Revisión Post-Refactor

Prioridad: de más importante (impacto directo al estudiante) a menos importante (admin tools).

---

## Fase 1 — My Progress (CRÍTICO)

**Pages:** `MyProgressPage`
**Hooks:** `useMyProgress`
**Services:** `progressService.ts`
**Componentes:** `ProgressOverviewCard`, `ProgressRing`, `YearAccordion`, `PendingFinalsSection`

**Qué revisar:**
- El card de progreso muestra `completedUnits / totalUnits` correctamente vs el dato del backend
- El ring de progreso refleja `progress_percentage` real
- El desglose por año renderiza materias y bloques (`is_block: true`) sin errores
- Bloques UNAHUR muestran icono `school`, "-" en nota/créd
- Bloques Electivos muestran icono `category`
- Bloques Crédito (año null) aparecen al final
- `PendingFinalsSection` no se rompió (no se tocó en F1-F6 pero verificar)
- `ConditionsGrid` no se usa, no hay que revisarlo salvo que quieras agregarlo

**Observaciones:**
```
```

## Fase 2 — Academic Record (ALTA)

**Pages:** `AcademicRecordPage`
**Componentes:** formularios de registro, tabla, exportación Excel

**Qué revisar:**
- Formulario de alta de registro académico: campos correctos, validaciones
- Tabla de registros: todas las columnas presentes, orden, paginación
- Exportación a Excel: datos correctos, formato
- No se tocó en F1-F6 pero puede haber efectos colaterales por cambios en modelos/seeders

**Observaciones:**
```
Eliminar el boton: registrar examen final (en el header). Conservar el boton de agregar registro.
modificar el boton agregar registro para que me habra un modal y no lo que hace actualmente.
al boton de agregar registro, debo modificarlo para que el estilo sea el mismo que el boton de "crear nueva" de la pagina myplanner. Mismo estilo y tamaños.



```

### Implementación
```



```
---

## Fase 3 — Planner (MEDIA)

**Pages:** `MyPlannerPage`
**Hooks:** `usePlanner`
**Services:** `planningAlgorithm.ts`, `editEngine.ts`, `planManagerService.ts`
**Simulator:** `simulatorService.ts`, `simulator/model`

**Qué revisar:**
- Planificador genera plan sin errores (no debería, solo se eliminaron campos)
- Movimiento de materias (drag / moveSubject) funciona
- Simulador "¿Qué pasa si?" se ejecuta sin crash
- Las materias disponibles se muestran correctamente
- No se perdieron datos visuales por la eliminación de `is_elective`/`term_type` (no se usaban en render, pero verificar)

**Observaciones:**
```

```

### Implementación
```

```

### Implementado
```

```

---

## Fase 4 — Study Plan Page (ADMIN) (BAJA)

**Pages:** `PlansPage` (Admin)

**Qué revisar:**
- Creador/editor de plan: inputs correctos (name, career, status)
- Secciones de bloques (UNAHUR, Electivos, Créditos) cargan correctamente
- CRUD de cada bloque funciona (crear/eliminar)
- No hay referencias rotas a `PlanRequirementsSection` o `StudyPlanRequirement`
- `PlanRequirementsSection` ya no existe en disco — si algo lo intenta importar, falla en build

**Observaciones:**
```

```

### Implementación
```

```

### Implementado
```

```

---

## Fase 5 — Subjects Page (ADMIN) (BAJA)

**Pages:** `SubjectsPage` (Admin)

**Qué revisar:**
- CRUD de materias funciona (crear, editar, eliminar)
- Campos: code, name, credits, year, semester, is_unahur — todos presentes
- No hay referencias legacy a `is_elective`/`term_type`
- PENDIENTE: proponer componentes nuevos para mejorar la UX (el usuario lo pidió para esta fase específicamente)

**Observaciones:**
```

```

### Implementación
```

```

### Implementado
```

```
