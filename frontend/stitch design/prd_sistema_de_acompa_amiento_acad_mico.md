# Sistema de Acompañamiento Académico Universitario

## 1. Introducción
Plataforma web integral para la gestión académica y social de estudiantes universitarios. El sistema permite a los estudiantes llevar un control riguroso de su progreso, planificar su futuro académico basándose en reglas de correlatividades y fomentar el aprendizaje colaborativo.

## 2. Roles y Funcionalidades

### A. Estudiante
*   **Gestión Académica:** Visualización de foja, estados de materias (aprobada, regular, pendiente).
*   **Planificación:** Selector de materias para cursar validando requisitos previos.
*   **Colaboración:** Repositorio de materiales (votos, tags) y creación/unión a sesiones de estudio (virtual/presencial).
*   **Social:** Perfil configurable (privacidad), red de contactos y feed de actividad.

### B. Administrador
*   **Estructura:** Definición de Carreras, Planes de Estudio y Materias con sus reglas de correlatividad.
*   **Control:** Gestión de usuarios y moderación de contenido reportado en el repositorio o sesiones.

## 3. Arquitectura de Pantallas

### Fase 1: Autenticación
*   **Login:** Credenciales y acceso.
*   **Registro:** Selección de universidad/carrera inicial.

### Fase 2: Estudiante (Core)
*   **Dashboard:** Widgets de porcentaje de avance, próximas sesiones de estudio y tareas.
*   **Progreso Académico:** Vista de grilla/lista de materias por cuatrimestre.
*   **Planificador:** Interfaz interactiva de "drag & drop" o selección para armar el cuatrimestre.
*   **Materiales:** Buscador de recursos filtrado por materia.
*   **Sesiones de Estudio:** Calendario y lista de grupos disponibles.

### Fase 3: Social y Perfil
*   **Mi Perfil:** Configuración de visibilidad de datos sensibles.
*   **Feed/Conexiones:** Muro de noticias académicas y buscador de compañeros.

### Fase 4: Administración
*   **Panel de Gestión:** Tablas CRUD para la configuración del sistema.