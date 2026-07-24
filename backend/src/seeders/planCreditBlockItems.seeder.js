const { PlanCreditBlockItem } = require('../models');
const { seedRows } = require('./helpers');

async function seedPlanCreditBlockItems(creditBlocks, activities, transaction) {
  const blockIdByName = new Map(creditBlocks.map((block) => [block.name, block.id]));
  const activityIdByName = new Map(activities.map((activity) => [activity.name, activity.id]));

  const baseRows = [
    { id_credit_block: creditBlocks[0].id, id_activity: activities[0].id, credits: 2 },
    { id_credit_block: creditBlocks[0].id, id_activity: activities[1].id, credits: 1 },
    { id_credit_block: creditBlocks[0].id, id_activity: activities[2].id, credits: 1 },
    { id_credit_block: creditBlocks[1].id, id_activity: activities[3].id, credits: 3 },
    { id_credit_block: creditBlocks[1].id, id_activity: activities[4].id, credits: 2 },
    { id_credit_block: creditBlocks[1].id, id_activity: activities[5].id, credits: 2 },
    { id_credit_block: creditBlocks[2].id, id_activity: activities[6].id, credits: 4 },
    { id_credit_block: creditBlocks[2].id, id_activity: activities[7].id, credits: 2 },
    { id_credit_block: creditBlocks[2].id, id_activity: activities[8].id, credits: 2 },
    { id_credit_block: creditBlocks[3].id, id_activity: activities[9].id, credits: 2 },
    { id_credit_block: creditBlocks[3].id, id_activity: activities[10].id, credits: 1 },
    { id_credit_block: creditBlocks[3].id, id_activity: activities[11].id, credits: 3 },
    { id_credit_block: creditBlocks[3].id, id_activity: activities[12].id, credits: 2 },
    { id_credit_block: creditBlocks[3].id, id_activity: activities[13].id, credits: 1 },
  ];

  const tupTemplates = [
    { block_name: 'TUP - Integración Curricular', activity_name: 'Desarrollo de Aplicaciones, en UNAHUR (CR012_033)', credits: 4 },
    { block_name: 'TUP - Integración Curricular', activity_name: 'Desarrollo de Práctica Profesional Supervisada (PPS) (CR011_033)', credits: 4 },
    { block_name: 'TUP - Integración Curricular', activity_name: 'Proyecto Integrador (CR030_033)', credits: 4 },
    { block_name: 'TUP - Integración Curricular', activity_name: 'ACA: Jornadas de la Industria 1ra Participación - Día 1 (CR_ITI_12)', credits: 1 },
    { block_name: 'TUP - Integración Curricular', activity_name: 'ACA: Jornadas de la Industria 1ra Participación - Día 2 (CR_ITI_13)', credits: 1 },
    { block_name: 'TUP - Integración Curricular', activity_name: 'Exposición en Jornadas - 1ra Participación (CR_ITI_14)', credits: 2 },

    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Participación como asistente en Jornadas / Workshops / Congresos (CR002)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Talleres Especiales (más de 32hs) (CR004)', credits: 2 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Talleres especiales - Taller de Github (CR003)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Participación en Competencias Estudiantiles - Rally Innovación 2023 (CR015)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Talleres Especiales - Gestión de Firewall (CR014)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Talleres especiales - Taller de Gestión de la seguridad informática (CR013)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Participación como asistente en Jornadas / Workshops / Congresos - (Evento de 1 día presencial) (CR017)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Talleres Especiales - Curso de Iniciación al Mundo Laboral (CR018)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Participación en Proyectos Abiertos (CR021)', credits: 2 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Intercambios estudiantiles presenciales y/o virtuales (CR023)', credits: 2 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Formación Profesional (CR024)', credits: 2 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Cursadas Voluntarias en otras Universidades (CR026)', credits: 2 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Taller de Procesamiento digital de imágenes (CR027)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Participación en competencias estudiantiles (CR029)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Formación Profesional (Segunda Participación) (CR024b)', credits: 2 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Rally Latinoamericano de Innovación - 1ra participación (CR_ITI_001)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Rally Latinoamericano de Innovación - 2da participación (CR_ITI_001b)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Curso Enlaces Inalámbricos Fijos (CR036)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Curso Introducción al Cómputo Paralelo (CR038)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Curso Oracle SQL & PL SQL (CR034)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Curso Project Management (CR033)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Curso Redes Móviles Celulares (CR035)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Curso Redes de Fibra Óptica (CR037)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Curso Introducción a UML (CR039)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Charlas con Graduados (al menos 4 charlas) (CR046)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Creación y Animación de Personajes 2D-Del boceto al Sprite Sheet (CR042)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Cómo hacer videojuegos sin volverse loco: Gestión, Diseño y Validación de Usuario (CR041)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'De wollok a Java (CR055)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Del Prototipo al Portfolio Profesional (CR044)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Diseño Narrativo de Personajes: Cómo comenzar un relato (CR043)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Git (CR053)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'GraphQL en Springboot (CR054)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Lenguajes educativos para aprender a programar (CR052)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'PIA Taller 1 (CR047)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'PIA Taller 2 (CR048)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'PIA Taller 3 (CR049)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Presentación de nuevos planes de las carreras de informática (CR040)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Principios básicos de la Seguridad de la Información y la Ciberseguridad (CR057)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Taller Introductorio de Integrales (CR050)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Taller de Introducción al procesamiento digital de Imágenes (CR051)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Taller de programación (CR056)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Taller de robótica (CR045)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Taller de uso de herramientas para el procesamiento de datos (CR059)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Vibe Coding (CR058)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Construcción de un CV (CR061)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'De la Idea al Código (CR062)', credits: 1 },
    { block_name: 'TUP - Formativas Académicas y Profesionales', activity_name: 'Taller de informática (CR060)', credits: 1 },

    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'Talleres culturales (CR007)', credits: 1 },
    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'Talleres deportivos (CR006)', credits: 1 },
    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'Voluntariados (CR005)', credits: 1 },
    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'UNAHUR@TIC #1 - Encuentro de Informática (CR019)', credits: 1 },
    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'UNAHUR@TIC #1 - Encuentro de Informática (medio día) (CR020)', credits: 1 },
    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'Taller de eSport (CR022)', credits: 1 },
    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'UNAHUR@TIC - Encuentro de Informática (segunda participación) (CR028)', credits: 1 },
    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'Actividades de Perspectiva de Género (12hs) (CR031)', credits: 1 },
    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'UNAHUR@TIC - Encuentro de Informática (tercera participación) (CR028b)', credits: 1 },
    { block_name: 'TUP - Sociales, Culturales y Deportivas', activity_name: 'Actividades de Biblioteca (CR032)', credits: 1 },

    { block_name: 'TUP - Docencia e Investigación', activity_name: 'Colaboración en materias (CR010)', credits: 1 },
    { block_name: 'TUP - Docencia e Investigación', activity_name: 'Participación como Estudiante Asistente (CR009)', credits: 1 },
    { block_name: 'TUP - Docencia e Investigación', activity_name: 'Participación en el programa Un estudiantes/Un compañero/a (CR008)', credits: 1 },
    { block_name: 'TUP - Docencia e Investigación', activity_name: 'Asistencia Técnica a grupos de Investigación de la Universidad (CR016_033)', credits: 1 },
    { block_name: 'TUP - Docencia e Investigación', activity_name: 'Participación en actividades de difusión académica (CR025)', credits: 1 },
    { block_name: 'TUP - Docencia e Investigación', activity_name: 'Participación en actividades de difusión académica (2da participación) (CR025b)', credits: 1 },
    { block_name: 'TUP - Docencia e Investigación', activity_name: 'Python Day (CR_ITI_002)', credits: 1 },
    { block_name: 'TUP - Docencia e Investigación', activity_name: 'Computación Cuántica (CR_ITI_010)', credits: 1 },
    { block_name: 'TUP - Docencia e Investigación', activity_name: 'Python Day (Segunda Participación) (CR_ITI_002b)', credits: 1 },
  ];

  const tupRows = tupTemplates.map((template) => ({
    id_credit_block: blockIdByName.get(template.block_name),
    id_activity: activityIdByName.get(template.activity_name),
    credits: template.credits,
  }));

  const rows = [...baseRows, ...tupRows];

  const invalid = rows.find((row) => !row.id_credit_block || !row.id_activity);
  if (invalid) {
    throw new Error('No se pudo resolver bloque o actividad en planCreditBlockItems.seeder');
  }

  return seedRows(PlanCreditBlockItem, rows, ['id_credit_block', 'id_activity'], transaction);
}

module.exports = seedPlanCreditBlockItems;
