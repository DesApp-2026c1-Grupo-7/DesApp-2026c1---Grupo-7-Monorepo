const REGULAR_YEARS = 2;
const MAX_INTENTOS_FINAL = 10;

const addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

const getVencimientoRegularidad = (fecha) => addYears(fecha, REGULAR_YEARS);

module.exports = { REGULAR_YEARS, MAX_INTENTOS_FINAL, addYears, getVencimientoRegularidad };
