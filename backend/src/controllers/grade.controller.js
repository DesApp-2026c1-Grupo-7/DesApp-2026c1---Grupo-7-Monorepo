const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const CreditActivity = require('../models/CreditActivity');
const AcademicOffer = require('../models/AcademicOffer');
const SavedStudyPlan = require('../models/SavedStudyPlan');

const sortBySubjectPosition = (items) => [...items].sort((a, b) => {
  const materiaA = a.materia || {};
  const materiaB = b.materia || {};
  return (materiaA.anio || 0) - (materiaB.anio || 0) ||
    (materiaA.cuatrimestre || 0) - (materiaB.cuatrimestre || 0) ||
    (materiaA.nombre || '').localeCompare(materiaB.nombre || '');
});

const APPROVED_STATES = ['Aprobada', 'Promocion'];
const REGULAR_YEARS = 2;

const addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

const getPlanSubjectsForUser = async (userId) => {
  const user = await User.findById(userId).populate('planEstudio').populate('carrera');
  if (user?.planEstudio) {
    const plan = await StudyPlan.findById(user.planEstudio).populate('materias');
    const materias = await Subject.find({ _id: { $in: plan.materias.map((m) => m._id) } })
      .populate('correlativas');
    return { user, plan, materias };
  }

  const filter = user?.carrera ? { carrera: user.carrera._id } : {};
  const materias = await Subject.find(filter).populate('correlativas');
  return { user, plan: null, materias };
};

const getUnlockedSubjects = (materias, approvedIds, blockedIds = new Set()) => materias
  .filter((m) => !approvedIds.has(m._id.toString()))
  .filter((m) => !blockedIds.has(m._id.toString()))
  .filter((m) => (m.correlativas || []).every((c) => approvedIds.has(c._id.toString())));

// =====================================================
// SITUACION ACADEMICA
// =====================================================

const getStudentSituation = async (req, res) => {
  try {
    const userId = req.user.id;
    const situation = await Grade.find({ estudiante: userId })
      .populate('materia');

    res.json(sortBySubjectPosition(situation));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener situación académica', error: error.message });
  }
};

const updateGrade = async (req, res) => {
  try {
    const { materiaId, estado, nota, cuatrimestre, anioCursada } = req.body;
    const userId = req.user.id;

    const update = {
      estado,
      nota,
      fecha: Date.now()
    };
    if (cuatrimestre !== undefined) update.cuatrimestre = cuatrimestre;
    if (anioCursada !== undefined) update.anioCursada = anioCursada;

    const grade = await Grade.findOneAndUpdate(
      { estudiante: userId, materia: materiaId },
      update,
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('materia');

    res.json({ mensaje: 'Situación actualizada', grade });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al actualizar situación', error: error.message });
  }
};

// Carga masiva (manual desde el front, lista de materias)
const bulkLoadSituation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { records } = req.body; // [{ materiaId, estado, nota, cuatrimestre, anioCursada }]

    if (!Array.isArray(records)) {
      return res.status(400).json({ mensaje: 'records debe ser un array' });
    }

    const results = [];
    for (const r of records) {
      const grade = await Grade.findOneAndUpdate(
        { estudiante: userId, materia: r.materiaId },
        {
          estado: r.estado,
          nota: r.nota,
          cuatrimestre: r.cuatrimestre,
          anioCursada: r.anioCursada,
          fecha: Date.now()
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      results.push(grade);
    }

    res.json({ mensaje: `${results.length} registros cargados`, registros: results });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error en la carga masiva', error: error.message });
  }
};

// =====================================================
// INSCRIPCIONES (a principio y final del cuatri)
// =====================================================

const inscribirseACursada = async (req, res) => {
  try {
    const userId = req.user.id;
    const { materiaId, cuatrimestre, anioCursada } = req.body;

    const subject = await Subject.findById(materiaId);
    if (!subject) {
      return res.status(404).json({ mensaje: 'Materia no encontrada' });
    }

    // Verificar correlativas
    if (subject.correlativas && subject.correlativas.length > 0) {
      const aprobadas = await Grade.find({
        estudiante: userId,
        materia: { $in: subject.correlativas },
        estado: { $in: ['Aprobada', 'Promocion'] }
      });
      if (aprobadas.length < subject.correlativas.length) {
        return res.status(400).json({ mensaje: 'No cumple correlativas para inscribirse' });
      }
    }

    const grade = await Grade.findOneAndUpdate(
      { estudiante: userId, materia: materiaId },
      {
        estado: 'Inscripto',
        cuatrimestre,
        anioCursada,
        fecha: Date.now()
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).populate('materia');

    res.json({ mensaje: 'Inscripción a cursada registrada', grade });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al inscribirse', error: error.message });
  }
};

const cerrarCuatrimestre = async (req, res) => {
  try {
    const userId = req.user.id;
    const { materiaId, estado, nota } = req.body;

    if (!['Regular', 'Aprobada', 'Libre', 'Promocion'].includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado inválido para cierre de cuatrimestre' });
    }

    const grade = await Grade.findOneAndUpdate(
      { estudiante: userId, materia: materiaId },
      { estado, nota, fecha: Date.now() },
      { new: true, runValidators: true }
    ).populate('materia');

    if (!grade) {
      return res.status(404).json({ mensaje: 'No estaba inscripto a esa materia' });
    }

    res.json({ mensaje: 'Cuatrimestre cerrado', grade });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al cerrar cuatrimestre', error: error.message });
  }
};

const getInscripcionesActivas = async (req, res) => {
  try {
    const userId = req.user.id;
    const inscripciones = await Grade.find({
      estudiante: userId,
      estado: { $in: ['Inscripto', 'Cursando'] }
    }).populate('materia');
    res.json(inscripciones);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener inscripciones', error: error.message });
  }
};

// =====================================================
// ASISTENTE ACADEMICO
// =====================================================

const getMateriasDisponibles = async (req, res) => {
  try {
    const userId = req.user.id;
    const { materias } = await getPlanSubjectsForUser(userId);

    // Materias ya aprobadas/promocionadas
    const grades = await Grade.find({ estudiante: userId });
    const aprobadasIds = new Set(
      grades.filter((g) => APPROVED_STATES.includes(g.estado))
        .map((g) => g.materia.toString())
    );
    const yaInscriptaIds = new Set(
      grades.filter((g) => ['Inscripto', 'Cursando', 'Regular'].includes(g.estado))
        .map((g) => g.materia.toString())
    );

    let disponibles = getUnlockedSubjects(materias, aprobadasIds, yaInscriptaIds);

    const { anio, cuatrimestre, soloOferta } = req.query;
    if (soloOferta === 'true' && anio && cuatrimestre !== undefined) {
      const offer = await AcademicOffer.findOne({
        anio: Number(anio),
        cuatrimestre: Number(cuatrimestre)
      });
      const offeredIds = new Set((offer?.materias || []).map((id) => id.toString()));
      disponibles = disponibles.filter((m) => offeredIds.has(m._id.toString()));
    }

    res.json(disponibles);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener materias disponibles', error: error.message });
  }
};

const getProyeccionCursada = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('planEstudio');

    let materias = [];
    if (user && user.planEstudio) {
      const plan = await StudyPlan.findById(user.planEstudio).populate('materias');
      materias = plan.materias;
    } else {
      materias = await Subject.find();
    }

    const grades = await Grade.find({ estudiante: userId });
    const aprobadasIds = new Set(
      grades.filter((g) => ['Aprobada', 'Promocion'].includes(g.estado))
        .map((g) => g.materia.toString())
    );

    // Agrupar materias pendientes por año
    const proyeccion = {};
    for (const m of materias) {
      if (aprobadasIds.has(m._id.toString())) continue;
      const key = `Año ${m.anio} - ${m.cuatrimestre === 0 ? 'Anual' : `Cuat ${m.cuatrimestre}`}`;
      if (!proyeccion[key]) proyeccion[key] = [];
      proyeccion[key].push({
        _id: m._id,
        nombre: m.nombre,
        codigo: m.codigo,
        anio: m.anio,
        cuatrimestre: m.cuatrimestre,
        creditos: m.creditos
      });
    }

    res.json(proyeccion);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener proyección', error: error.message });
  }
};

const getAvanceCarrera = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('planEstudio').populate('carrera');

    const grades = await Grade.find({ estudiante: userId }).populate('materia');

    let totalMaterias = 0;
    let creditosNecesarios = 0;
    let materiasUnahurRequeridas = 0;
    let nivelInglesRequerido = 'B1';
    let materiasDelPlanOCarreraIds = [];

    if (user && user.planEstudio) {
      const plan = await StudyPlan.findById(user.planEstudio);
      totalMaterias = plan.materias.length;
      creditosNecesarios = plan.creditosNecesarios;
      materiasUnahurRequeridas = plan.materiasUnahurRequeridas;
      nivelInglesRequerido = plan.nivelInglesRequerido;
      materiasDelPlanOCarreraIds = plan.materias.map((id) => id.toString());
    } else if (user && user.carrera) {
      totalMaterias = user.carrera.cantidadMaterias;
      creditosNecesarios = user.carrera.creditosNecesarios;
      nivelInglesRequerido = user.carrera.nivelInglesRequerido;
      const materiasCarrera = await Subject.find({ carrera: user.carrera._id }).select('_id');
      materiasDelPlanOCarreraIds = materiasCarrera.map((m) => m._id.toString());
    }

    const actividades = await CreditActivity.find({ estudiante: userId });
    const creditosActividades = actividades.reduce((sum, a) => sum + a.creditos, 0);

    const planSet = new Set(materiasDelPlanOCarreraIds);
    const gradesDelPlan = planSet.size > 0
      ? grades.filter((g) => g.materia && planSet.has(g.materia._id.toString()))
      : grades;

    const aprobadas = gradesDelPlan.filter((g) => APPROVED_STATES.includes(g.estado));
    const regularizadas = gradesDelPlan.filter((g) => g.estado === 'Regular');
    const cursando = gradesDelPlan.filter((g) => ['Inscripto', 'Cursando'].includes(g.estado));

    const creditosMateriasAprobadas = aprobadas.reduce(
      (sum, g) => sum + (g.materia?.creditos || 0),
      0
    );
    const creditosAprobados = creditosMateriasAprobadas + creditosActividades;
    const creditosOptativasAprobados = aprobadas
      .filter((g) => g.materia?.esOptativa)
      .reduce((sum, g) => sum + (g.materia?.creditos || 0), 0);

    const materiasUnahurFilter = {
      esUnahur: true,
      _id: { $nin: aprobadas.map((g) => g.materia._id) }
    };
    if (materiasDelPlanOCarreraIds.length > 0) {
      materiasUnahurFilter._id = {
        $in: materiasDelPlanOCarreraIds,
        $nin: aprobadas.map((g) => g.materia._id)
      };
    }
    const materiasUnahurFaltantes = await Subject.countDocuments(materiasUnahurFilter);

    // Avance por año
    const avancePorAnio = {};
    const materiasBase = materiasDelPlanOCarreraIds.length > 0
      ? await Subject.find({ _id: { $in: materiasDelPlanOCarreraIds } }).select('_id anio')
      : [];
    for (const materia of materiasBase) {
      const anio = materia.anio;
      if (!avancePorAnio[anio]) {
        avancePorAnio[anio] = { aprobadas: 0, regulares: 0, cursando: 0, total: 0 };
      }
      avancePorAnio[anio].total++;
    }
    for (const g of gradesDelPlan) {
      if (!g.materia) continue;
      const anio = g.materia.anio;
      if (!avancePorAnio[anio]) {
        avancePorAnio[anio] = { aprobadas: 0, regulares: 0, cursando: 0, total: 0 };
      }
      if (['Aprobada', 'Promocion'].includes(g.estado)) avancePorAnio[anio].aprobadas++;
      else if (g.estado === 'Regular') avancePorAnio[anio].regulares++;
      else if (['Inscripto', 'Cursando'].includes(g.estado)) avancePorAnio[anio].cursando++;
    }

    res.json({
      totalMaterias,
      aprobadas: aprobadas.length,
      regularizadas: regularizadas.length,
      cursando: cursando.length,
      pendientes: Math.max(0, totalMaterias - aprobadas.length - regularizadas.length - cursando.length),
      creditosAprobados,
      creditosMateriasAprobadas,
      creditosActividades,
      creditosNecesarios,
      creditosOptativasAprobados,
      materiasUnahurRequeridas,
      nivelInglesRequerido,
      materiasUnahurFaltantes,
      avancePorAnio,
      porcentajeAvance: totalMaterias > 0 ? Math.round((aprobadas.length / totalMaterias) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calcular avance', error: error.message });
  }
};

const getRendimientoPlan = async (req, res) => {
  try {
    const { user, plan, materias } = await getPlanSubjectsForUser(req.user.id);
    const grades = await Grade.find({ estudiante: req.user.id }).populate('materia');
    const planSubjects = materias || [];
    const currentYear = Number(req.query.anio || new Date().getFullYear());
    const startYear = Number(req.query.anioInicio || Math.min(currentYear, 2024));
    const elapsedAcademicYears = Math.max(1, currentYear - startYear + 1);
    const expectedSubjects = planSubjects.filter((m) => m.anio <= elapsedAcademicYears);
    const expectedIds = new Set(expectedSubjects.map((m) => m._id.toString()));
    const approved = grades.filter((g) =>
      g.materia &&
      expectedIds.has(g.materia._id.toString()) &&
      APPROVED_STATES.includes(g.estado)
    );

    const esperado = expectedSubjects.length;
    const aprobado = approved.length;
    const diferencia = aprobado - esperado;
    const estado = diferencia >= 0 ? 'al-dia' : diferencia >= -2 ? 'leve-desvio' : 'atrasado';

    res.json({
      carrera: user?.carrera?.nombre || null,
      plan: plan?.nombre || null,
      anioInicio: startYear,
      anioActual: currentYear,
      aniosTranscurridos: elapsedAcademicYears,
      materiasEsperadasAprobadas: esperado,
      materiasAprobadasEsperadas: aprobado,
      diferencia,
      estado,
      porcentajeCumplimiento: esperado > 0 ? Math.round((aprobado / esperado) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al comparar rendimiento con el plan', error: error.message });
  }
};

const listCreditActivities = async (req, res) => {
  try {
    const actividades = await CreditActivity.find({ estudiante: req.user.id }).sort({ fecha: -1 });
    res.json(actividades);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar actividades con creditos', error: error.message });
  }
};

const createCreditActivity = async (req, res) => {
  try {
    const { nombre, descripcion, creditos, fecha } = req.body;
    const actividad = await CreditActivity.create({
      estudiante: req.user.id,
      nombre,
      descripcion,
      creditos,
      fecha: fecha || Date.now()
    });
    res.status(201).json({ mensaje: 'Actividad con creditos registrada', actividad });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al registrar actividad con creditos', error: error.message });
  }
};

const getQuePasaSi = async (req, res) => {
  try {
    const { materias = [] } = req.body;
    const materiasSimuladas = Array.isArray(materias) ? materias : [];
    const { materias: planSubjects } = await getPlanSubjectsForUser(req.user.id);
    const grades = await Grade.find({ estudiante: req.user.id });

    const approvedIds = new Set(
      grades.filter((g) => APPROVED_STATES.includes(g.estado)).map((g) => g.materia.toString())
    );
    const blockedBefore = new Set(
      grades.filter((g) => ['Inscripto', 'Cursando', 'Regular'].includes(g.estado))
        .map((g) => g.materia.toString())
    );

    const disponiblesActuales = getUnlockedSubjects(planSubjects, approvedIds, blockedBefore);
    materiasSimuladas.forEach((id) => approvedIds.add(id.toString()));

    const blockedAfter = new Set(
      [...blockedBefore].filter((id) => !approvedIds.has(id))
    );
    const disponiblesSimuladas = getUnlockedSubjects(planSubjects, approvedIds, blockedAfter);
    const actualesIds = new Set(disponiblesActuales.map((m) => m._id.toString()));
    const desbloqueadas = disponiblesSimuladas.filter((m) => !actualesIds.has(m._id.toString()));

    res.json({ disponiblesActuales, disponiblesSimuladas, desbloqueadas });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al simular escenario', error: error.message });
  }
};

const getPlanificador = async (req, res) => {
  try {
    const horasPorSemana = Math.max(1, Number(req.query.horasPorSemana || 12));
    const { materias: planSubjects } = await getPlanSubjectsForUser(req.user.id);
    const grades = await Grade.find({ estudiante: req.user.id });
    const approvedIds = new Set(
      grades.filter((g) => APPROVED_STATES.includes(g.estado)).map((g) => g.materia.toString())
    );

    const pending = new Map(
      planSubjects
        .filter((m) => !approvedIds.has(m._id.toString()))
        .map((m) => [m._id.toString(), m])
    );
    const periodos = [];
    let anio = new Date().getFullYear();
    let cuatrimestre = 1;
    let guard = 0;

    while (pending.size > 0 && guard < 30) {
      guard++;
      const disponibles = [...pending.values()]
        .filter((m) => (m.correlativas || []).every((c) => approvedIds.has(c._id.toString())))
        .sort((a, b) => a.anio - b.anio || a.cuatrimestre - b.cuatrimestre || a.nombre.localeCompare(b.nombre));

      const materiasPeriodo = [];
      let horasUsadas = 0;
      for (const materia of disponibles) {
        const horasMateria = Math.max(2, materia.creditos || 4);
        if (materiasPeriodo.length > 0 && horasUsadas + horasMateria > horasPorSemana) continue;
        materiasPeriodo.push({
          _id: materia._id,
          nombre: materia.nombre,
          codigo: materia.codigo,
          creditos: materia.creditos,
          horasSemanalesEstimadas: horasMateria,
          anio: materia.anio,
          cuatrimestre: materia.cuatrimestre
        });
        horasUsadas += horasMateria;
      }

      if (materiasPeriodo.length === 0) {
        break;
      }

      periodos.push({ anio, cuatrimestre, horasUsadas, materias: materiasPeriodo });
      materiasPeriodo.forEach((m) => {
        approvedIds.add(m._id.toString());
        pending.delete(m._id.toString());
      });
      cuatrimestre = cuatrimestre === 1 ? 2 : 1;
      if (cuatrimestre === 1) anio++;
    }

    res.json({
      horasPorSemana,
      periodos,
      pendientesNoPlanificadas: [...pending.values()].map((m) => ({
        _id: m._id,
        nombre: m.nombre,
        codigo: m.codigo
      }))
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar planificador', error: error.message });
  }
};

const listSavedStudyPlans = async (req, res) => {
  try {
    const plans = await SavedStudyPlan.find({ estudiante: req.user.id })
      .sort({ updatedAt: -1 })
      .populate('periodos.materias.materia', 'nombre codigo creditos');
    res.json(plans);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al listar planificaciones guardadas', error: error.message });
  }
};

const saveStudyPlan = async (req, res) => {
  try {
    const { nombre, horasPorSemana, periodos } = req.body;
    if (!nombre || !Array.isArray(periodos)) {
      return res.status(400).json({ mensaje: 'nombre y periodos son obligatorios' });
    }

    const normalized = periodos.map((periodo) => ({
      anio: periodo.anio,
      cuatrimestre: periodo.cuatrimestre,
      horasUsadas: periodo.horasUsadas,
      materias: (periodo.materias || []).map((materia) => ({
        materia: materia._id || materia.materia,
        nombre: materia.nombre,
        codigo: materia.codigo,
        creditos: materia.creditos,
        horasSemanalesEstimadas: materia.horasSemanalesEstimadas
      }))
    }));

    const saved = await SavedStudyPlan.create({
      estudiante: req.user.id,
      nombre,
      horasPorSemana: Math.max(1, Number(horasPorSemana || 1)),
      periodos: normalized
    });

    res.status(201).json({ mensaje: 'Planificacion guardada', plan: saved });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al guardar planificacion', error: error.message });
  }
};

module.exports = {
  getStudentSituation,
  updateGrade,
  bulkLoadSituation,
  inscribirseACursada,
  cerrarCuatrimestre,
  getInscripcionesActivas,
  getMateriasDisponibles,
  getProyeccionCursada,
  getAvanceCarrera,
  listCreditActivities,
  createCreditActivity,
  getQuePasaSi,
  getPlanificador,
  getRendimientoPlan,
  listSavedStudyPlans,
  saveStudyPlan
};
