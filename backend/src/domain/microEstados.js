'use strict';

const MICRO_ESTADOS = {
  FINALIZADA: 'FINALIZADA',
  REGULARIZADA: 'REGULARIZADA',
  EN_CURSO: 'EN_CURSO',
  FALTANTE: 'FALTANTE',
  EQUIVALENCIA: 'EQUIVALENCIA',
  VENCIDA: 'VENCIDA',
};

function calcularMicroEstado(record) {
  if (!record) return MICRO_ESTADOS.FALTANTE;

  if (record.status === 'equivalencia') return MICRO_ESTADOS.EQUIVALENCIA;
  if (record.status === 'aprobado') return MICRO_ESTADOS.FINALIZADA;

  if (record.status === 'pendiente') {
    const finalExams = record.final_exams || [];
    const hasApprovedFinal = finalExams.some((fe) => fe.status === 'aprobado');
    if (hasApprovedFinal) return MICRO_ESTADOS.FINALIZADA;

    const grade = parseFloat(record.grade);
    if (!isNaN(grade) && grade > 3 && grade < 7) {
      if (record.regularity_expires_at) {
        const expiresAt = new Date(record.regularity_expires_at);
        const today = new Date(new Date().toDateString());
        if (expiresAt >= today) {
          return MICRO_ESTADOS.REGULARIZADA;
        }
        return MICRO_ESTADOS.VENCIDA;
      }
    }
  }

  if (record.status === 'enrolled') return MICRO_ESTADOS.EN_CURSO;
  if (record.status === 'desaprobado') return MICRO_ESTADOS.FALTANTE;

  return MICRO_ESTADOS.FALTANTE;
}

module.exports = { calcularMicroEstado, MICRO_ESTADOS };
