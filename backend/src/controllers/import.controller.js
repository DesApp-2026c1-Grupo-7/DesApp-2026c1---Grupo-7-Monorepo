const xlsx = require('xlsx');
const Subject = require('../models/Subject');
const Grade = require('../models/Grade');

/**
 * Importa la situación académica desde un archivo Excel.
 * Columnas esperadas (case-insensitive, podemos aceptar varios alias):
 *   - codigo / código / codigo_materia
 *   - nombre / materia (opcional, sólo informativo)
 *   - estado (Aprobada, Regular, Cursando, Inscripto, Libre, Promocion, Pendiente)
 *   - nota (opcional, número 0-10)
 *   - cuatrimestre (opcional, 0/1/2)
 *   - anio / año / año_cursada (opcional)
 */
const importSituationExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ mensaje: 'Falta el archivo Excel (campo "file")' });
    }
    const userId = req.user.id;

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (rows.length === 0) {
      return res.status(400).json({ mensaje: 'El archivo no tiene filas' });
    }

    const procesados = [];
    const errores = [];

    for (const [idx, raw] of rows.entries()) {
      // Normalizar keys (sin tildes, lowercase)
      const r = {};
      for (const k of Object.keys(raw)) {
        const norm = k.toString().trim().toLowerCase()
          .normalize('NFD').replace(/[̀-ͯ]/g, '');
        r[norm] = raw[k];
      }

      const codigo = (r['codigo'] || r['codigo_materia'] || r['cod'] || '').toString().trim().toUpperCase();
      const estado = (r['estado'] || '').toString().trim();
      const nota = r['nota'] !== '' ? Number(r['nota']) : undefined;
      const cuatri = r['cuatrimestre'] !== '' ? Number(r['cuatrimestre']) : undefined;
      const anioCursada = r['anio'] !== undefined && r['anio'] !== '' ? Number(r['anio']) :
        (r['ano'] !== undefined && r['ano'] !== '' ? Number(r['ano']) : undefined);

      if (!codigo) {
        errores.push({ fila: idx + 2, motivo: 'Falta código de materia' });
        continue;
      }
      const validos = ['Pendiente', 'Inscripto', 'Cursando', 'Regular', 'Aprobada', 'Libre', 'Promocion'];
      if (!validos.includes(estado)) {
        errores.push({ fila: idx + 2, motivo: `Estado inválido: "${estado}"` });
        continue;
      }

      const subject = await Subject.findOne({ codigo });
      if (!subject) {
        errores.push({ fila: idx + 2, motivo: `Materia con código ${codigo} no existe` });
        continue;
      }

      const update = { estado, fecha: Date.now() };
      if (!Number.isNaN(nota) && nota !== undefined) update.nota = nota;
      if (!Number.isNaN(cuatri) && cuatri !== undefined) update.cuatrimestre = cuatri;
      if (!Number.isNaN(anioCursada) && anioCursada !== undefined) update.anioCursada = anioCursada;

      const grade = await Grade.findOneAndUpdate(
        { estudiante: userId, materia: subject._id },
        update,
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      procesados.push({ codigo, estado: grade.estado });
    }

    res.json({
      mensaje: `Importación completada: ${procesados.length} registros, ${errores.length} errores`,
      procesados,
      errores
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al procesar archivo Excel', error: error.message });
  }
};

module.exports = { importSituationExcel };
