/**
 * Maps backend error messages to user-friendly Spanish messages
 */

export function mapErrorMessage(error: any, fieldType?: string): string {
  if (!error) return "Ocurrió un error. Por favor, intenta de nuevo.";

  const errorMessage = error.message || error.error || String(error);

  // Email-specific errors
  if (fieldType === "email") {
    if (errorMessage.includes("email") || errorMessage.includes("Ya existe")) {
      return "Este email ya está registrado en el sistema.";
    }
    if (errorMessage.includes("formato") || errorMessage.includes("válid")) {
      return "El email no tiene un formato válido.";
    }
  }

  // Legajo-specific errors
  if (fieldType === "legajo") {
    if (errorMessage.includes("legajo") || errorMessage.includes("Ya existe")) {
      return "Este número de matrícula ya está registrado.";
    }
  }

  // Enrollment-specific errors
  if (fieldType === "enrollment") {
    if (errorMessage.includes("not found") || errorMessage.includes("no existe")) {
      return "La inscripción no fue encontrada.";
    }
    if (errorMessage.includes("Active enrollment")) {
      return "No puedes tener más de una inscripción activa a la misma carrera.";
    }
    if (errorMessage.includes("delete")) {
      return "No se pudo eliminar la inscripción. Por favor, intenta de nuevo.";
    }
  }

  // Generic duplicate errors
  if (errorMessage.includes("Ya existe") || errorMessage.includes("Unique constraint")) {
    return "Este dato ya está registrado en el sistema.";
  }

  // Network/timeout errors
  if (errorMessage.includes("timeout") || errorMessage.includes("ECONNREFUSED")) {
    return "No se pudo conectar al servidor. Por favor, intenta de nuevo.";
  }

  // Default fallback
  return "No se pudieron guardar los cambios. Por favor, intenta de nuevo.";
}
