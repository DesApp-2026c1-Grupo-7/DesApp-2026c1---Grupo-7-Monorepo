const xlsx = require('xlsx');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');
const { createAcademicEvent } = require('../utils/academicEvents');
const { getPlanSubjectsForUser } = require('./grade.controller');

const VALID_ESTADOS = ['PENDIENTE', 'INSCRIPTO', 'INSCRIPTA', 'CURSANDO', 'REGULAR', 'APROBADA', 'APROBADO', 'LIBRE', 'PROMOCION'];

const normalizeKey = (key) => key.toString().trim().toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const parseRowsFromWorkbook = (buffer) => {
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  return xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
};

const normalizeImportRow = async (raw, idx) => {
  const r = {};
  for (const k of Object.keys(raw)) {
    r[normalizeKey(k)] = raw[k];
  }

  const codigo = (r.codigo || r.codigo_materia || r.cod || '').toString().trim().toUpperCase();
  let estado = (r.estado || '').toString().trim();
  const nota = r.nota !== '' && r.nota !== undefined ? Number(r.nota) : undefined;
  const cuatrimestre = r.cuatrimestre !== '' && r.cuatrimestre !== undefined ? Number(r.cuatrimestre) : undefined;
  const anioCursada = r.anio !== undefined && r.anio !== '' ? Number(r.anio) :
    (r.ano !== undefined && r.ano !== '' ? Number(r.ano) : undefined);
  const errores = [];

  if (!codigo) {
    errores.push('Falta codigo de materia');
  }

  // Normalización de estado: pasar a uppercase para comparar y manejar variaciones
  const estadoUpper = estado.toUpperCase();
  if (!VALID_ESTADOS.includes(estadoUpper)) {
    errores.push(`Estado invalido: "${estado}"`);
  } else {
    // Mapeo de variaciones a los estados oficiales del modelo
    if (['APROBADO', 'APROBADA'].includes(estadoUpper)) estado = 'Aprobada';
    if (['INSCRIPTO', 'INSCRIPTA'].includes(estadoUpper)) estado = 'Inscripto';
    if (estadoUpper === 'PENDIENTE') estado = 'Pendiente';
    if (estadoUpper === 'CURSANDO') estado = 'Cursando';
    if (estadoUpper === 'REGULAR') estado = 'Regular';
    if (estadoUpper === 'LIBRE') estado = 'Libre';
    if (estadoUpper === 'PROMOCION') estado = 'Promocion';
  }
  if (nota !== undefined && (Number.isNaN(nota) || nota < 0 || nota > 10)) errores.push('Nota invalida');
  if (cuatrimestre !== undefined && ![0, 1, 2].includes(cuatrimestre)) errores.push('Cuatrimestre invalido');

  const subject = codigo ? await Subject.findOne({ codigo }) : null;
  if (codigo && !subject) errores.push(`Materia con codigo ${codigo} no existe`);

  return {
    fila: idx + 2,
    codigo,
    materiaId: subject?._id,
    materiaNombre: subject?.nombre,
    estado,
    nota,
    cuatrimestre,
    anioCursada,
    errores
  };
};

const buildPreview = async (rows) => {
  const preview = [];
  for (const [idx, raw] of rows.entries()) {
    preview.push(await normalizeImportRow(raw, idx));
  }
  return preview;
};

const persistPreview = async (userId, preview, res) => {
  const procesados = [];
  const errores = [];

  const APPROVED_STATES = ['Aprobada', 'Promocion'];

  // Obtenemos aprobadas actuales para validar correlativas
  const currentGrades = await Grade.find({ estudiante: userId });
  const approvedIds = new Set(
    currentGrades.filter(g => APPROVED_STATES.includes(g.estado)).map(g => g.materia.toString())
  );

  // Obtenemos materias del plan para validar correlativas
  const { materias: planSubjects } = await getPlanSubjectsForUser(userId);
  const planMap = new Map(planSubjects.map(ps => [ps._id.toString(), ps]));

  for (const row of preview) {
    if (row.errores?.length > 0 || !row.materiaId) {
      errores.push({ fila: row.fila, motivo: (row.errores || ['Fila invalida']).join('; ') });
      continue;
    }

    // Validación estricta de correlativas en el import
    if (APPROVED_STATES.includes(row.estado)) {
      const subjectInPlan = planMap.get(row.materiaId.toString());
      if (subjectInPlan && subjectInPlan.correlativas.length > 0) {
        const hasAll = subjectInPlan.correlativas.every(c => approvedIds.has(c._id.toString()));
        if (!hasAll) {
          errores.push({ 
            fila: row.fila, 
            motivo: `Correlativas no cumplidas para ${subjectInPlan.nombre}` 
          });
          continue;
        }
      }
      approvedIds.add(row.materiaId.toString());
    }

    const update = { estado: row.estado, fecha: Date.now() };
    if (!Number.isNaN(row.nota) && row.nota !== undefined) update.nota = row.nota;
    if (!Number.isNaN(row.cuatrimestre) && row.cuatrimestre !== undefined) update.cuatrimestre = row.cuatrimestre;
    if (!Number.isNaN(row.anioCursada) && row.anioCursada !== undefined) update.anioCursada = row.anioCursada;

    const grade = await Grade.findOneAndUpdate(
      { estudiante: userId, materia: row.materiaId },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('materia');

    if (grade && grade.materia) {
      await createAcademicEvent(userId, row.estado, grade.materia.nombre);
    }
    procesados.push({ codigo: row.codigo, estado: grade.estado });
  }

  res.json({
    mensaje: `Importacion completada: ${procesados.length} registros, ${errores.length} errores`,
    procesados,
    errores
  });
};

const previewSituationExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'Falta el archivo Excel (campo "file")' });
    }

    const rows = parseRowsFromWorkbook(req.file.buffer);
    if (rows.length === 0) {
      return res.status(400).json({ mensaje: 'El archivo no tiene filas' });
    }

    const preview = await buildPreview(rows);
    res.json({
      mensaje: `Preview generado: ${preview.length} filas`,
      preview,
      errores: preview.filter((r) => r.errores.length > 0)
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar preview', error: error.message });
  }
};

const confirmSituationExcel = async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ mensaje: 'records debe ser un array' });
    }
    return persistPreview(req.user.id, records, res);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al confirmar importacion', error: error.message });
  }
};

const importSituationExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'Falta el archivo Excel (campo "file")' });
    }

    const rows = parseRowsFromWorkbook(req.file.buffer);
    if (rows.length === 0) {
      return res.status(400).json({ mensaje: 'El archivo no tiene filas' });
    }

    const preview = await buildPreview(rows);
    return persistPreview(req.user.id, preview, res);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al procesar archivo Excel', error: error.message });
  }
};

module.exports = {
  importSituationExcel,
  previewSituationExcel,
  confirmSituationExcel
};
