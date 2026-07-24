markdown_content = """# Especificación Técnica: Algoritmo de Proyección de Planes de Cursada

Este documento detalla el diseño, las reglas de negocio y la implementación conceptual del algoritmo de proyección para la aplicación de asistencia estudiantil. El objetivo principal es delegar la lógica de cálculo al Frontend para eliminar la dependencia de múltiples *fetches* al Backend, permitiendo una recalculación interactiva e inmediata cuando el alumno modifique sus parámetros (como el límite de horas semanales).

---

## 1. Contexto y Arquitectura del Flujo

El sistema funciona bajo un esquema de **contrato de datos simplificado**:
1. **El Backend** envía el plan de estudios "limpio" (filtrando materias aprobadas) junto con la matriz o árbol de correlatividades de las materias pendientes.
2. **El Frontend** recibe estos datos y, según la preferencia de horas semanales cargada por el usuario (`limitHours`), ejecuta este algoritmo de manera local para renderizar la proyección completa en milisegundos.

---

## 2. Fase 1: Preparación y Ordenamiento Jerárquico

Antes de intentar ubicar cualquier materia en el calendario, es crítico procesar el listado para evitar conflictos de dependencia (por ejemplo, intentar asignar una materia avanzada antes que su correlativa inicial).

### Paso 1: Filtrado de Historial
* Se excluyen del universo de cálculo todas las materias que el alumno ya haya finalizado o promocionado. Solo se proyecta el camino restante.

### Paso 2: Cálculo del Peso de Desbloqueo (Prioridad)
* Para cada materia pendiente, se calcula recursivamente cuántas materias posteriores dependen de ella (su grado de salida). Una materia que desbloquea 5 materias de años superiores tiene mayor "peso" que una que no desbloquea ninguna.

### Paso 3: Ordenamiento Topológico (Jerarquía Inviolable)
* Se aplica un **Ordenamiento Topológico** sobre el grafo de correlatividades. Esto garantiza que ninguna materia aparezca en la lista de iteración antes que sus correlativas.
* **Criterio de Desempate:** Si dos materias pertenecen al mismo nivel jerárquico y no dependen entre sí, se posiciona primero aquella que tenga mayor **Peso de Desbloqueo** (calculado en el Paso 2).

---

## 3. Fase 2: El Bucle de Asignación Cronológica

Con la lista perfectamente ordenada, el algoritmo recorre secuencialmente cada materia utilizando una estrategia *Greedy* (ambiciosa): busca ubicar la materia en el primer hueco temporal válido y disponible.

### Paso 4: Determinar el Punto de Partida Temporal
Para la materia actual bajo evaluación:
* **Si NO tiene correlativas:** El punto de partida de búsqueda es el primer cuatrimestre del año actual (`C1` del `Año Actual`).
* **Si TIENE correlativas:** Se inspecciona el plan en construcción para localizar en qué período quedó ubicada la **última de sus correlativas** (la más lejana en el tiempo). El punto de partida para la materia actual será obligatoriamente el **cuatrimestre inmediatamente posterior** a ese período.

### Paso 5: Validación de Techo Horario y Asignación
Una vez definido el punto de partida, se inicia un bucle de simulación temporal:
1. Se evalúa el período actual (Año X, Cuatrimestre Y).
2. Se calcula la carga horaria acumulada: `Horas de materias ya asignadas en este período + Horas semanales de la materia actual`.
3. **Condición de Éxito:** Si la suma **no supera** el `limitHours` del alumno, la materia se asigna formalmente a este período y se avanza a la siguiente materia de la lista (volviendo al Paso 4).
4. **Condición de Reclazo:** Si la suma **supera** el `limitHours`, la materia no cabe. El algoritmo avanza cronológicamente al siguiente período (`C1` -> `C2` dentro del mismo año, o `C2` -> `C1` del año siguiente) y vuelve a repetir el Paso 5 en este nuevo espacio.

---

## 4. Reglas de Oro (Restricciones Inviolables)

> ⚠️ **Regla 1: Correlatividad Temporal Absoluta** > Ninguna materia puede cursarse en forma simultánea ni previa a sus correlativas directas. Siempre requiere un salto mínimo de un cuatrimestre (`+1 Cuatrimestre`).

> ⚠️ **Regla 2: Techo Horario Inflexible** > La sumatoria de `weeklyhours` de todas las materias alojadas en un mismo cuatrimestre jamás puede exceder el valor de `limitHours` parametrizado por el alumno.

> ⚠️ **Regla 3: Inmutabilidad del Pasado en Cascada** > El algoritmo procesa en un único sentido hacia el futuro. Una vez que una materia de alta prioridad es fijada en un cuatrimestre, su posición es inmutable. Las materias subsiguientes deben adaptarse a los espacios remanentes o desplazarse a cuatrimestres futuros.

---

## 5. Ejemplificación del Algoritmo en Código (Alto Nivel)

A continuación se presenta un pseudocódigo estructurado en JavaScript de alta fidelidad para ilustrar cómo se traducen estas palabras a funciones lógicas:

// Simulación de los límites del alumno
const limitHours = 20; 

// Función auxiliar para avanzar el período cronológicamente
const obtenerSiguientePeriodo = (cuatrimestre, año) => {
  if (cuatrimestre === 'c1') {
    return { cuatrimestre: 'c2', año };
  } else {
    return { cuatrimestre: 'c1', año: año + 1 };
  }
};

const encontrarMejorCuatrimestre = (materia, plan, cuatrimestreInicial = 'c1', añoInicial = 2026) => {
  // Validación de seguridad obligatoria
  if (materia.weeklyhours > limitHours) {
    throw new Error(`La materia ${materia.name} supera el límite de horas permitidas por el alumno.`);
  }

  let cuatrimestre = cuatrimestreInicial;
  let año = añoInicial;

  while (true) {
    const horasActuales = plan.horasTotalesCuatrimestre(año, cuatrimestre);
    
    // Si entra en el cupo horario, encontramos el lugar
    if (materia.weeklyhours + horasActuales <= limitHours) {
      return { cuatrimestre, año };
    }
    
    // Si no entra, saltamos al siguiente cuatrimestre/año
    const siguiente = obtenerSiguientePeriodo(cuatrimestre, año);
    cuatrimestre = siguiente.cuatrimestre;
    año = siguiente.año;
  }
};

const proyectarPlanEstudios = (materiasOrdenadasTopologicamente, planInicial) => {
  let plan = { ...planInicial }; // Estructura para ir guardando las materias asignadas

  materiasOrdenadasTopologicamente.forEach(materia => {
    if (materia.correlativities.length === 0) {
      // Caso 1: No tiene correlativas, va lo antes posible
      const ubicacionIdeal = encontrarMejorCuatrimestre(materia, plan);
      plan.colocarMateriaEnPlan(materia, ubicacionIdeal.cuatrimestre, ubicacionIdeal.año);
    } else {
      // Caso 2: Tiene correlativas
      // Obtenemos el año y cuatrimestre de la correlativa que quedó más lejos en el futuro
      const ultimaCorrelativa = plan.añoYCuatrimestreDeLaUltimaCorrelativaUbicada(materia);
      
      // La nueva materia obligatoriamente debe ir como mínimo en el cuatrimestre SIGUIENTE al de su última correlativa
      const primerPeriodoValido = obtenerSiguientePeriodo(ultimaCorrelativa.cuatrimestre, ultimaCorrelativa.año);
      
      const ubicacionIdeal = encontrarMejorCuatrimestre(
        materia, 
        plan, 
        primerPeriodoValido.cuatrimestre, 
        primerPeriodoValido.año
      );
      
      plan.colocarMateriaEnPlan(materia, ubicacionIdeal.cuatrimestre, ubicacionIdeal.año);
    }
  });

  return plan;
};

--------------------------------------------------


Especificación Técnica: Algoritmo de Edición de Planes (Efecto Cascada)
El algoritmo de edición se activa cuando el usuario altera el orden del plan mediante Drag and Drop. A diferencia de la creación inicial (que es puramente matemática), la edición es un proceso híbrido que debe respetar las decisiones manuales del alumno y resolver los conflictos académicos en cadena.

1. Ciclo de Vida del Evento (Optimización de Rendimiento)
Para garantizar una interfaz fluida (60 FPS) y evitar bloqueos en el navegador, el algoritmo se distribuye estrictamente en los siguientes eventos del Frontend:

onDragStart (Inicio): Se almacena el ID de la materia seleccionada.

onDragOver (Durante el arrastre): No se ejecuta el algoritmo. Solo se actualiza el estilo CSS del cuatrimestre sobre el que flota el mouse (cambio de color o borde punteado).

onDrop / onDragEnd (Al soltar): Se limpia la interfaz visual y se ejecuta el algoritmo una única vez. El plan completo se recalcula en ~2 milisegundos y se actualiza el estado global de la aplicación.

2. Análisis de Casos y Resolución del Algoritmo
A continuación se detalla cómo responde el motor lógico ante cada escenario posible en la grilla:

Caso 1: Materia independiente en cuatrimestre con espacio disponible
Situación: El alumno mueve una materia (sin correlativas pendientes ni posteriores afectadas) a un cuatrimestre que tiene horas semanales libres de sobra.

Resolución:

Se asigna la materia al cuatrimestre de destino.

No se requiere ninguna acción en cascada. El resto del plan queda intacto.

Caso 2: Materia independiente en cuatrimestre que SUPERA el límite horario
Situación: El alumno suelta una materia en un cuatrimestre, pero la suma de horas de ese período supera el limitHours configurado.

Resolución:

Se fuerza la posición de la materia movida.

El algoritmo detecta el exceso de horas en ese cuatrimestre.

Busca la materia de menor peso (la que menos materias desbloquee) dentro de ese período.

Desplaza esa materia de menor prioridad al cuatrimestre siguiente (C+1).

Se dispara el Efecto Cascada: el algoritmo evalúa el cuatrimestre C+1 con esta nueva materia insertada. Si este también se satura, repite el proceso hacia el futuro (C+2, C+3...) hasta que todo quede estabilizado bajo el límite horario.

Caso 3: Violación de Correlatividades hacia adelante (Requisito al futuro)
Situación: El usuario mueve una materia al futuro, quedando posicionada después de una materia avanzada que depende de ella (Ej: Mueve Programación I al año 2027, pero Programación II estaba en el 2026).

Resolución:

Se fija la materia movida (Programación I) en su nueva posición del 2027.

El sistema escanea el plan y detecta que Programación II rompió la Regla de Oro 1 (está en el pasado o presente de su requisito).

Automáticamente, el sistema quita la planificación de Programación II (y de toda su descendencia directa como Programación III o Base de Datos) y las envía a una "bolsa temporal de reacomodo".

Se ejecuta el bucle de proyección desde el cuatrimestre de Programación I hacia adelante, ubicando a Programación II en el primer cuatrimestre disponible posterior que cumpla con el límite horario.

Caso 4: Violación de Correlatividades + Superación de Límite Horario
Situación: El usuario mueve un requisito al futuro (Caso 3) y, además, el cuatrimestre donde lo soltó se pasa del límite de horas permitidas (Caso 2).

Resolución:

Se procesa primero la resolución de correlatividades del Caso 3 (se extraen del pasado las materias dependientes y se mandan a la bolsa de reacomodo). Esto muchas veces libera horas en los cuatrimestres previos de forma automática.

Si después de limpiar las correlatividades, el cuatrimestre destino sigue superando las horas, se aplica el Caso 2: se toma la materia de menor prioridad de ese período y se la empuja al cuatrimestre siguiente.

Se corre la cascada general hacia el futuro ordenando tanto las materias empujadas por horas como las penalizadas por correlatividades.

Caso 5: Violación de Correlatividades hacia atrás (Materia avanzada al pasado)
Situación: El usuario arrastra una materia avanzada (Proyecto Final) a los primeros cuatrimestres del plan, quedando por detrás de sus propios requisitos.

Resolución (Efecto Cascada Inverso):

El algoritmo evalúa si existe espacio físico y temporal en los cuatrimestres previos para adelantar todos los requisitos de esa materia.

Subcaso A (Éxito): Si los requisitos entran en los cuatrimestres anteriores respetando el límite de horas, el algoritmo los empuja hacia atrás.

Subcaso B (Bloqueo Estricto - Error): Si no hay cuatrimestres previos suficientes (ej: querés meter Proyecto Final en el Cuatrimestre 1) el movimiento es matemáticamente imposible. El sistema cancela el Drop, devuelve la materia a su posición original y muestra un Toast informativo: "Movimiento inválido: Esta materia requiere cursadas previas que no pueden reacomodarse".

3. Estructura Lógica de la Función de Edición (Pseudocódigo)
JavaScript
export const procesarMovimientoMateria = (planActual, materiaId, periodoDestino) => {
  // 1. Clonar el plano para no mutar el estado directamente (Inmutabilidad)
  let nuevoPlan = cloneDeep(planActual);
  
  // 2. Obtener la materia a mover y fijar su nueva posición
  let materia = nuevoPlan.buscarMateria(materiaId);
  materia.año = periodoDestino.año;
  materia.cuatrimestre = periodoDestino.cuatrimestre;

  // 3. VALIDACIÓN 1: Correlatividades hacia atrás (Caso 5)
  if (!nuevoPlan.verificarRequisitosEnElPasado(materia)) {
    const exitoInverso = intentarCascadaInversa(nuevoPlan, materia);
    if (!exitoInverso) {
      throw new Error("Imposible reacomodar los requisitos previos en el tiempo disponible.");
    }
  }

  // 4. VALIDACIÓN 2: Romper correlatividades que quedaron en el pasado (Caso 3)
  const materiasAfectadas = nuevoPlan.obtenerHijosCorrelativosEnPasadoOIgual(materia);
  materiasAfectadas.forEach(m => {
    nuevoPlan.removerPlanificacion(m.id); // Se desplanifican para ir a la cascada
  });

  // Bolsa de materias que perdieron su lugar y deben ser reubicadas
  let bolsaReacomodo = [...materiasAfectadas];

  // 5. VALIDACIÓN 3: Control de horas en el cuatrimestre destino (Caso 2)
  let añoEvaluacion = periodoDestino.año;
  let cuatEvaluacion = periodoDestino.cuatrimestre;

  while (nuevoPlan.calcularHorasPeriodo(añoEvaluacion, cuatEvaluacion) > CONFIG.limitHours) {
    const materiasDelPeriodo = nuevoPlan.obtenerMateriasDelPeriodo(añoEvaluacion, cuatEvaluacion);

    // Ordenar por prioridad (la que menos desbloquea primero)
    materiasDelPeriodo.sort((a, b) => a.pesoDesbloqueo - b.pesoDesbloqueo);
    const materiaAPatear = materiasDelPeriodo[0];

    nuevoPlan.removerPlanificacion(materiaAPatear.id);
    bolsaReacomodo.push(materiaAPatear);
  }

  // 6. FASE FINAL: Ejecutar algoritmo de proyección original para la bolsa de reacomodo
  // Procesa desde el periodoDestino + 1 hacia el futuro
  nuevoPlan = ejecutarAlgoritmoProyeccionBase(bolsaReacomodo, nuevoPlan, avanzarPeriodo(periodoDestino));

  return nuevoPlan;
};



