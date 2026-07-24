# Plan de implementación — MyPlanner

## Objetivo

Evolucionar el planificador para que la experiencia sea más realista, menos restrictiva y más alineada con el flujo académico del estudiante.

## Principios guía

- Respetar correlatividades y límites de carga horaria.
- Priorizar el mejor reacomodo posible antes que bloquear la edición.
- Separar claramente materias, eventos y bloques genéricos.
- Mantener una arquitectura que permita crecer sin reescribir todo el motor.

## Fases recomendadas

### Fase 1 — Corregir la base semántica del planner

Objetivo: que el planner deje de tratar estados ambiguos como si fueran equivalentes.

Acciones:
- Ajustar la lógica de clasificación para que:
  - las materias finalizadas no entren en la proyección,
  - las materias regularizadas no se planifiquen como “a cursar”,
  - y los finales pendientes se traten como un evento separado.

Impacto:
- Evita que el planificador muestre materias que ya fueron cursadas o que solo requieren final.

### Fase 2 — Introducir eventos de finales pendientes

Objetivo: representar lo que el alumno debe rendir, sin ocupar carga horaria.

Acciones:
- Añadir un concepto de evento de tipo `final_exam`.
- Vincularlo al registro académico y a la fecha de vencimiento.
- Mostrarlo en el semestre como un elemento visual distinto.

Impacto:
- El planner refleja mejor la realidad del alumno y sus compromisos próximos.

### Fase 3 — Hacer el modelo del planner más expresivo

Objetivo: que el planner pueda representar más que materias obligatorias.

Acciones:
- Ampliar el modelo con:
  - materias ancladas,
  - tipo de elemento,
  - y eventualmente bloques genéricos.

Impacto:
- El motor de edición podrá diferenciar mejor entre una materia fija, un bloque genérico o un evento.

### Fase 4 — Incorporar bloques UNAHUR y electivos como cards genéricas

Objetivo: que el planner pueda mostrar esos elementos sin exigir una materia concreta de entrada.

Acciones:
- Representar cada bloque como una card genérica.
- Usar una estimación conservadora de horas.
- Mostrar el bloque en la proyección sin forzar una decisión inmediata del alumno.

Impacto:
- La experiencia se vuelve más flexible y menos rígida.

### Fase 5 — Integrar el flujo de Excel con la proyección

Objetivo: que la importación de notas afecte al planner.

Acciones:
- Hacer que la importación de Excel actualice el estado del planner.
- Recalcular la proyección a partir de los datos ya validados.

Impacto:
- El planner deja de ser un flujo aislado y se vuelve consistente con la fuente de verdad del alumno.

### Fase 6 — Refinar la edición con reglas más didácticas

Objetivo: que el usuario experimente menos bloqueos y más ayuda.

Acciones:
- Dejar que el algoritmo intente el mejor reacomodo posible.
- Respetar correlatividades, horas y contexto del plan.
- Mostrar mensajes claros cuando se ajuste algo automáticamente.

Impacto:
- La edición se vuelve más intuitiva y menos frustrante.

## Orden recomendado

1. Estados y clasificación.
2. Eventos de finales.
3. Modelo ampliado.
4. Bloques genéricos.
5. Integración con Excel.
6. Refinamiento del motor de edición.

## Criterio de cierre de una etapa

Una etapa se considera lista cuando:
- el planner muestra el comportamiento esperado,
- no rompe la generación ni la edición anterior,
- y se puede validar con ejemplos reales.

## Nota

Este plan está pensado como una evolución incremental. No conviene intentar resolver todo de golpe, porque eso mezcla lógica de negocio con cambios estructurales y puede volver el sistema más frágil.
