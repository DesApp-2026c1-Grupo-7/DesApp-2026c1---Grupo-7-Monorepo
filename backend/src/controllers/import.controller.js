const xlsx = require('xlsx');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');
const { createAcademicEvent } = require('../utils/academicEvents');
const { getPlanSubjectsForUser } = require('./grade.controller');
const { calcularEstadoGrade, CORRELATIVA_STATES } = require('../utils/gradeState');

const VALID_ESTADOS = ['PENDIENTE', 'INSCRIPTO', 'INSCRIPTA', 'CURSANDO', 'REGULAR', 'APROBADA', 'APROBADO', 'DESAPROBADO', 'LIBRE', 'PROMOCION'];

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
  const rawEstado = (r.estado || '').toString().trim();
  const nota = r.nota !== '' && r.nota !== undefined ? Number(r.nota) : undefined;
  const cuatrimestre = r.cuatrimestre !== '' && r.cuatrimestre !== undefined ? Number(r.cuatrimestre) : undefined;
  const anioCursada = r.anio !== undefined && r.anio !== '' ? Number(r.anio) :
    (r.ano !== undefined && r.ano !== '' ? Number(r.ano) : undefined);
  const errores = [];

  if (!codigo) {
    errores.push('Falta codigo de materia');
  }

  // El estado se calcula desde la nota si está presente, o se toma del Excel (backward compat)
  // Si no hay nota ni estado, se asume Cursando.
  let estado;
  if (nota !== undefined) {
    if (Number.isNaN(nota) || nota < 1 || nota > 10) {
      errores.push('Nota invalida (debe ser 1-10)');
    } else {
      estado = calcularEstadoGrade(nota);
    }
  } else if (rawEstado) {
    const estadoUpper = rawEstado.toUpperCase();
    if (!VALID_ESTADOS.includes(estadoUpper)) {
      errores.push(`Estado invalido: "${rawEstado}"`);
    } else {
      if (['APROBADO', 'APROBADA'].includes(estadoUpper)) estado = 'Aprobada';
      if (['INSCRIPTO', 'INSCRIPTA'].includes(estadoUpper)) estado = 'Cursando';
      if (estadoUpper === 'PENDIENTE') estado = 'Pendiente';
      if (estadoUpper === 'CURSANDO') estado = 'Cursando';
      if (estadoUpper === 'REGULAR') estado = 'Regular';
      if (estadoUpper === 'DESAPROBADO') estado = 'Desaprobado';
      if (estadoUpper === 'LIBRE') estado = 'Libre';
      if (estadoUpper === 'PROMOCION') estado = 'Promocion';
    }
  } else {
    estado = 'Cursando';
  }
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

const validateCorrelativasEnPreview = async (preview, userId) => {
  const currentGrades = await Grade.find({ estudiante: userId });
  const approvedIds = new Set(
    currentGrades.filter(g => CORRELATIVA_STATES.includes(g.estado)).map(g => g.materia.toString())
  );

  const { materias: planSubjects } = await getPlanSubjectsForUser(userId);
  const planMap = new Map(planSubjects.map(ps => [ps._id.toString(), ps]));

  for (const row of preview) {
    if (row.errores?.length > 0 || !row.materiaId) continue;

    const estadoCalculado = row.nota !== undefined && row.nota !== null ? calcularEstadoGrade(row.nota) : row.estado;

    if (['Cursando', ...CORRELATIVA_STATES].includes(estadoCalculado)) {
      const subjectInPlan = planMap.get(row.materiaId.toString());
      if (subjectInPlan && subjectInPlan.correlativas.length > 0) {
        const hasAll = subjectInPlan.correlativas.every(c => approvedIds.has(c._id.toString()));
        if (!hasAll) {
          row.errores.push(`Correlativas no cumplidas para ${subjectInPlan.nombre}`);
        }
      }
      if (CORRELATIVA_STATES.includes(estadoCalculado)) {
        approvedIds.add(row.materiaId.toString());
      }
    }
  }

  return preview;
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

  // Obtenemos aprobadas actuales para validar correlativas
  const currentGrades = await Grade.find({ estudiante: userId });
  const approvedIds = new Set(
    currentGrades.filter(g => CORRELATIVA_STATES.includes(g.estado)).map(g => g.materia.toString())
  );

  // Obtenemos materias del plan para validar correlativas
  const { materias: planSubjects } = await getPlanSubjectsForUser(userId);
  const planMap = new Map(planSubjects.map(ps => [ps._id.toString(), ps]));

    for (const row of preview) {
      if (row.errores?.length > 0 || !row.materiaId) {
        errores.push({ fila: row.fila, motivo: (row.errores || ['Fila invalida']).join('; ') });
        continue;
      }

      const estadoCalculado = row.nota !== undefined && row.nota !== null ? calcularEstadoGrade(row.nota) : row.estado;

      // Validación estricta de correlativas en el import
      if (['Cursando', ...CORRELATIVA_STATES].includes(estadoCalculado)) {
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
        if (CORRELATIVA_STATES.includes(estadoCalculado)) {
          approvedIds.add(row.materiaId.toString());
        }
      }

      const update = { estado: estadoCalculado, fecha: Date.now() };
      if (!Number.isNaN(row.nota) && row.nota !== undefined) update.nota = row.nota;
      if (!Number.isNaN(row.cuatrimestre) && row.cuatrimestre !== undefined) update.cuatrimestre = row.cuatrimestre;
      if (!Number.isNaN(row.anioCursada) && row.anioCursada !== undefined) update.anioCursada = row.anioCursada;

      const grade = await Grade.findOneAndUpdate(
        { estudiante: userId, materia: row.materiaId },
        update,
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      ).populate('materia');

      if (grade && grade.materia) {
        await createAcademicEvent(userId, estadoCalculado, grade.materia.nombre);
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

    let preview = await buildPreview(rows);
    preview = await validateCorrelativasEnPreview(preview, req.user.id);
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
