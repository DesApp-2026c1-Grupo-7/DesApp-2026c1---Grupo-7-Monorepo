const APPROVED_STATES = ['Aprobada', 'Promocion'];
const CORRELATIVA_STATES = [...APPROVED_STATES, 'Regular'];

function calcularEstadoGrade(nota) {
  if (nota === undefined || nota === null) return undefined;
  if (nota >= 1 && nota <= 3) return 'Desaprobado';
  if (nota > 3 && nota <= 6) return 'Regular';
  if (nota > 6 && nota <= 10) return 'Promocion';
  return undefined;
}

function calcularEstadoFinal(nota) {
  if (nota === undefined || nota === null) return undefined;
  if (nota >= 1 && nota <= 3) return 'Desaprobado';
  if (nota > 3 && nota <= 10) return 'Aprobado';
  return undefined;
}

module.exports = { calcularEstadoGrade, calcularEstadoFinal, APPROVED_STATES, CORRELATIVA_STATES };