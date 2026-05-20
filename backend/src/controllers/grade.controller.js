const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');
const CreditActivity = require('../models/CreditActivity');
const AcademicOffer = require('../models/AcademicOffer');
const SavedStudyPlan = require('../models/SavedStudyPlan');
const Event = require('../models/Event');
const { createAcademicEvent } = require('../utils/academicEvents');

const sortBySubjectPosition = (items) => [...items].sort((a, b) => {
  const materiaA = a.materia || {};
  const materiaB = b.materia || {};
  return (materiaA.anio || 0) - (materiaB.anio || 0) ||
    (materiaA.cuatrimestre || 0) - (materiaB.cuatrimestre || 0) ||
    (materiaA.nombre || '').localeCompare(materiaB.nombre || '');
});

const APPROVED_STATES = ['Aprobada', 'Promocion'];
const UNLOCKING_STATES = ['Regular', 'Aprobada', 'Promocion'];
const REGULAR_YEARS = 2;

const addYears = (date, years) => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};

const getPlanSubjectsForUser = async (userId) => {
  const user = await User.findById(userId).populate('planEstudio').populate('carrera');
  if (user?.planEstudio) {
    const plan = await StudyPlan.findById(user.planEstudio)
      .populate('materias.materia')
      .populate('materias.correlativas');
    
    if (!plan) return { user, plan: null, materias: [] };

    const materias = plan.materias.map(pm => {
      if (!pm.materia) return null;
      return {
        _id: pm.materia._id,
        nombre: pm.materia.nombre,
        codigo: pm.materia.codigo,
        anio: pm.anio,
        cuatrimestre: pm.cuatrimestre,
        creditos: pm.creditos,
        horasSemanales: pm.horasSemanales || 4,
        correlativas: pm.correlativas || [],
        esOptativa: pm.esOptativa,
        esUnahur: pm.esUnahur
      };
    }).filter(Boolean);

    return { user, plan, materias };
  }

  // Si no hay plan, intentamos buscar por carrera pero ahora sin correlativas base en Subject
  const filter = user?.carrera ? { carrera: user.carrera._id } : {};
  const subjects = await Subject.find(filter);
  const materias = subjects.map(s => ({
    _id: s._id,
    nombre: s.nombre,
    codigo: s.codigo,
    anio: 0,
    cuatrimestre: 0,
    creditos: 0,
    correlativas: [],
    esOptativa: false,
    esUnahur: false
  }));
  return { user, plan: null, materias };
};

const getUnlockedSubjects = (materias, unlockingIds, blockedIds = new Set()) => materias
  .filter((m) => !unlockingIds.has(m._id.toString()))
  .filter((m) => !blockedIds.has(m._id.toString()))
  .filter((m) => (m.correlativas || []).every((c) => unlockingIds.has(c._id.toString())));

// =====================================================
// SITUACION ACADEMICA
// =====================================================

const getStudentSituation = async (req, res) => {
  try {
    const userId = req.user.id;
    const situation = await Grade.find({ estudiante: userId })
      .populate('materia');

    const { materias: planSubjects } = await getPlanSubjectsForUser(userId);
    const planMap = new Map(planSubjects.map(ps => [ps._id.toString(), ps]));

    const enriched = situation.map(record => {
      const ps = planMap.get(record.materia?._id.toString());
      const rawRecord = record.toObject();
      if (ps) {
        rawRecord.materia = {
          ...rawRecord.materia,
          anio: ps.anio,
          cuatrimestre: ps.cuatrimestre,
          creditos: ps.creditos,
          esOptativa: ps.esOptativa,
          esUnahur: ps.esUnahur
        };
      } else {
        // Default values if not in plan
        rawRecord.materia = {
          ...rawRecord.materia,
          anio: 0,
          cuatrimestre: 0
        };
      }
      return rawRecord;
    });

    res.json(sortBySubjectPosition(enriched));
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener situación académica', error: error.message });
  }
};

const getPendingSubjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { materias } = await getPlanSubjectsForUser(userId);
    
    // Buscar materias que ya están terminadas o regularizadas
    const completedGrades = await Grade.find({ 
      estudiante: userId,
      estado: { $in: ['Aprobada', 'Promocion', 'Regular'] }
    }).select('materia');
    
    const completedSubjectIds = new Set(completedGrades.map(g => g.materia.toString()));

    // Filtrar las materias del plan que NO están terminadas/regulares
    const pending = materias.filter(m => !completedSubjectIds.has(m._id.toString()));

    res.json(pending);
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al obtener materias pendientes', error: error.message });
  }
};

const updateGrade = async (req, res) => {
  try {
    const { materiaId, estado, nota, cuatrimestre, anioCursada } = req.body;
    const userId = req.user.id;

    const { materias: planSubjects } = await getPlanSubjectsForUser(userId);
    const subjectInPlan = planSubjects.find(m => m._id.toString() === materiaId.toString());

    // Validación estricta de correlatividades para Aprobar/Promocionar
    if (APPROVED_STATES.includes(estado)) {
      if (subjectInPlan && subjectInPlan.correlativas.length > 0) {
        const approvedGrades = await Grade.find({
          estudiante: userId,
          materia: { $in: subjectInPlan.correlativas.map(c => c._id) },
          estado: { $in: APPROVED_STATES }
        });
        
        if (approvedGrades.length < subjectInPlan.correlativas.length) {
          const missing = subjectInPlan.correlativas
            .filter(c => !approvedGrades.some(g => g.materia.toString() === c._id.toString()))
            .map(c => c.nombre)
            .join(', ');
          return res.status(400).json({ 
            mensaje: `No puedes aprobar ${subjectInPlan.nombre} sin haber aprobado antes: ${missing}` 
          });
        }
      }
    }

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

    // Crear evento académico si corresponde
    if (grade && grade.materia) {
      await createAcademicEvent(userId, estado, grade.materia.nombre);
    }

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
    const errors = [];

    // Obtenemos todas las notas actuales para validar correlativas en memoria durante el loop
    const currentGrades = await Grade.find({ estudiante: userId });
    const approvedIds = new Set(
      currentGrades.filter(g => APPROVED_STATES.includes(g.estado)).map(g => g.materia.toString())
    );

    // Procesamos uno por uno para validar dependencias
    const { materias: planSubjects } = await getPlanSubjectsForUser(userId);

    for (const r of records) {
      if (APPROVED_STATES.includes(r.estado)) {
        const subjectInPlan = planSubjects.find(m => m._id.toString() === r.materiaId.toString());
        if (subjectInPlan && subjectInPlan.correlativas.length > 0) {
          const hasAll = subjectInPlan.correlativas.every(c => approvedIds.has(c._id.toString()));
          if (!hasAll) {
            errors.push(`Materia ${subjectInPlan.nombre} salteada: no cumple correlativas.`);
            continue;
          }
        }
        approvedIds.add(r.materiaId.toString());
      }

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
      ).populate('materia');

      if (grade && grade.materia) {
        await createAcademicEvent(userId, r.estado, grade.materia.nombre);
      }
      results.push(grade);
    }

    res.json({ 
      mensaje: `${results.length} registros cargados. ${errors.length} errores.`, 
      registros: results,
      errores: errors 
    });
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

    const { materias: planSubjects } = await getPlanSubjectsForUser(userId);
    const subjectInPlan = planSubjects.find(m => m._id.toString() === materiaId.toString());

    if (!subjectInPlan) {
      return res.status(404).json({ mensaje: 'Materia no encontrada en tu plan de estudio' });
    }

    // Verificar correlativas
    if (subjectInPlan.correlativas && subjectInPlan.correlativas.length > 0) {
      const cumplidas = await Grade.find({
        estudiante: userId,
        materia: { $in: subjectInPlan.correlativas.map(c => c._id) },
        estado: { $in: UNLOCKING_STATES }
      });
      if (cumplidas.length < subjectInPlan.correlativas.length) {
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

    // Crear evento académico si corresponde
    if (grade && grade.materia) {
      await createAcademicEvent(userId, 'Inscripto', grade.materia.nombre);
    }

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

    // Crear evento académico si corresponde
    if (grade && grade.materia) {
      await createAcademicEvent(userId, estado, grade.materia.nombre);
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

    // Materias que habilitan otras (regulares o aprobadas)
    const grades = await Grade.find({ estudiante: userId });
    const unlockingIds = new Set(
      grades.filter((g) => UNLOCKING_STATES.includes(g.estado))
        .map((g) => g.materia.toString())
    );
    const yaInscriptaIds = new Set(
      grades.filter((g) => ['Inscripto', 'Cursando', 'Regular'].includes(g.estado))
        .map((g) => g.materia.toString())
    );

    let disponibles = getUnlockedSubjects(materias, unlockingIds, yaInscriptaIds);

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
    const { materias } = await getPlanSubjectsForUser(userId);

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
    const { user, plan, materias: planSubjects } = await getPlanSubjectsForUser(userId);

    const grades = await Grade.find({ estudiante: userId }).populate('materia');

    let totalMaterias = 0;
    let creditosNecesarios = 0;
    let materiasUnahurRequeridas = 0;
    let nivelInglesRequerido = 'B1';

    if (plan) {
      totalMaterias = planSubjects.length;
      creditosNecesarios = plan.creditosNecesarios;
      materiasUnahurRequeridas = plan.materiasUnahurRequeridas;
      nivelInglesRequerido = plan.nivelInglesRequerido;
    } else {
      // Defaults si no hay plan asignado
      totalMaterias = planSubjects.length || 0;
      creditosNecesarios = 0;
      materiasUnahurRequeridas = 0;
      nivelInglesRequerido = 'B1';
    }

    const actividades = await CreditActivity.find({ estudiante: userId });
    const creditosActividades = actividades.reduce((sum, a) => sum + a.creditos, 0);

    const planMap = new Map(planSubjects.map(ps => [ps._id.toString(), ps]));
    
    // Filtrar notas que pertenecen al plan actual
    const gradesDelPlan = grades.filter(g => g.materia && planMap.has(g.materia._id.toString()));

    const aprobadas = gradesDelPlan.filter((g) => APPROVED_STATES.includes(g.estado));
    const regularizadas = gradesDelPlan.filter((g) => g.estado === 'Regular');
    const cursando = gradesDelPlan.filter((g) => ['Inscripto', 'Cursando'].includes(g.estado));

    const creditosMateriasAprobadas = aprobadas.reduce(
      (sum, g) => {
        const ps = planMap.get(g.materia._id.toString());
        return sum + (ps?.creditos || 0);
      },
      0
    );
    const creditosAprobados = creditosMateriasAprobadas + creditosActividades;
    
    const materiasUnahurInscriptas = aprobadas.filter(g => {
      const ps = planMap.get(g.materia._id.toString());
      return ps?.esUnahur;
    });

    const materiasUnahurFaltantes = Math.max(0, materiasUnahurRequeridas - materiasUnahurInscriptas.length);

    // Avance por año
    const avancePorAnio = {};
    for (const ps of planSubjects) {
      if (ps.anio === 0) continue;
      if (!avancePorAnio[ps.anio]) {
        avancePorAnio[ps.anio] = { aprobadas: 0, regulares: 0, cursando: 0, total: 0 };
      }
      avancePorAnio[ps.anio].total++;
    }

    for (const g of gradesDelPlan) {
      const ps = planMap.get(g.materia._id.toString());
      if (!ps || ps.anio === 0) continue;
      
      if (!avancePorAnio[ps.anio]) {
        avancePorAnio[ps.anio] = { aprobadas: 0, regulares: 0, cursando: 0, total: 0 };
      }

      if (['Aprobada', 'Promocion'].includes(g.estado)) {
        if (!ps.esUnahur) avancePorAnio[ps.anio].aprobadas++;
      }
      else if (g.estado === 'Regular') avancePorAnio[ps.anio].regulares++;
      else if (['Inscripto', 'Cursando'].includes(g.estado)) avancePorAnio[ps.anio].cursando++;
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
      creditosOptativasAprobados: aprobadas.filter(g => {
        const ps = planMap.get(g.materia._id.toString());
        return ps?.esOptativa;
      }).reduce((sum, g) => {
        const ps = planMap.get(g.materia._id.toString());
        return sum + (ps?.creditos || 0);
      }, 0),
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

    if (creditos > 5) {
      return res.status(400).json({ mensaje: 'No puedes registrar más de 5 créditos por actividad' });
    }

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
    const { materias = [] } = req.body; // Array de { materiaId, estadoHipotetico }
    const { materias: planSubjects } = await getPlanSubjectsForUser(req.user.id);
    const grades = await Grade.find({ estudiante: req.user.id });

    // unlockingIds actuales (reales)
    const unlockingIds = new Set(
      grades.filter((g) => UNLOCKING_STATES.includes(g.estado)).map((g) => g.materia.toString())
    );
    
    const yaInscriptaIds = new Set(
      grades.filter((g) => ['Inscripto', 'Cursando', 'Regular', 'Aprobada', 'Promocion'].includes(g.estado))
        .map((g) => g.materia.toString())
    );

    const disponiblesActuales = getUnlockedSubjects(planSubjects, unlockingIds, yaInscriptaIds);

    // Aplicar hipótesis
    const simulatedUnlockingIds = new Set(unlockingIds);
    const simulatedYaInscriptaIds = new Set(yaInscriptaIds);

    for (const h of materias) {
      // Manejar tanto el formato { materiaId, estadoHipotetico } como el formato simple de ID (string)
      const mId = (typeof h === 'string' ? h : h.materiaId)?.toString();
      const mEstado = typeof h === 'string' ? 'Aprobada' : h.estadoHipotetico;

      if (!mId) continue;

      if (['Regular', 'Aprobada', 'Promocion'].includes(mEstado)) {
        simulatedUnlockingIds.add(mId);
      }
      // Al simular pasarla, ya no cuenta como "actualmente cursando" para el bloqueo de inscribibles
      simulatedYaInscriptaIds.add(mId);
    }

    const disponiblesSimuladas = getUnlockedSubjects(planSubjects, simulatedUnlockingIds, simulatedYaInscriptaIds);
    
    const actualesIds = new Set(disponiblesActuales.map((m) => m._id.toString()));
    const desbloqueadasRaw = disponiblesSimuladas.filter((m) => !actualesIds.has(m._id.toString()));

    // Enriquecer desbloqueadas con info de correlativas
    const desbloqueadas = desbloqueadasRaw.map(m => ({
      _id: m._id,
      nombre: m.nombre,
      codigo: m.codigo,
      correlativasFaltantes: (m.correlativas || []).filter(c => !unlockingIds.has(c._id.toString())),
      correlativasSimuladas: (m.correlativas || []).filter(c => 
        !unlockingIds.has(c._id.toString()) && simulatedUnlockingIds.has(c._id.toString())
      )
    }));

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

    // Materias que ya no hay que planificar (aprobadas, cursando o regulares)
    const excludedFromPlanningIds = new Set(
      grades.filter((g) => [...APPROVED_STATES, 'Cursando', 'Regular'].includes(g.estado))
        .map((g) => g.materia.toString())
    );

    const pending = new Map(
      planSubjects
        .filter((m) => !excludedFromPlanningIds.has(m._id.toString()))
        .map((m) => [m._id.toString(), m])
    );

    // Para el primer periodo del planificador, consideramos las que están cursando/regulares como "aprobadas" 
    // para que desbloqueen sus correlativas INMEDIATAS. 
    // Pero NO las agregamos permanentemente a virtualApprovedIds desde el inicio si queremos que sea progresivo.
    let currentVirtualApproved = new Set([...approvedIds]);
    
    // Subjects that are currently being taken or are regular. 
    // They "virtually" unlock subjects for the FIRST period only.
    const inProgressIds = new Set(
      grades.filter((g) => ['Cursando', 'Regular'].includes(g.estado))
        .map((g) => g.materia.toString())
    );

    // Detectamos el próximo cuatrimestre según la fecha actual
    const now = new Date();
    const month = now.getMonth(); // 0-11
    let anio = now.getFullYear();
    let cuatrimestre = month < 6 ? 2 : 1; 
    if (month >= 6) anio++;

    // El usuario requiere que el planificador contemple todas las materias habilitadas
    // (un paso por delante de su situación actual) y las distribuya según las horas.
    const unlockingContext = new Set([...approvedIds, ...inProgressIds]);
    const periodos = [];

    // Filtramos todas las materias que el alumno YA podría cursar (Nivel 1)
    const targetSubjects = [...pending.values()]
      .filter((m) => (m.correlativas || []).every((c) => unlockingContext.has(c._id.toString())))
      .sort((a, b) => {
        // Priorizamos materias de carrera (anio > 0) sobre materias UNAHUR/Optativas (anio 0)
        const anioA = a.anio === 0 ? 99 : a.anio;
        const anioB = b.anio === 0 ? 99 : b.anio;
        if (anioA !== anioB) return anioA - anioB;

        // Priorizamos las materias que coinciden con el cuatrimestre inicial
        const matchA = (a.cuatrimestre === cuatrimestre || a.cuatrimestre === 0) ? 0 : 1;
        const matchB = (b.cuatrimestre === cuatrimestre || b.cuatrimestre === 0) ? 0 : 1;
        if (matchA !== matchB) return matchA - matchB;

        return a.cuatrimestre - b.cuatrimestre || a.nombre.localeCompare(b.nombre);
      });

    let subjectsToPlan = [...targetSubjects];
    let currentAnio = anio;
    let currentCuatrimestre = cuatrimestre;
    let guard = 0;

    // Distribuimos el pool de materias habilitadas en periodos sucesivos
    while (subjectsToPlan.length > 0 && guard < 20) {
      guard++;
      const materiasPeriodo = [];
      let horasUsadas = 0;
      const remaining = [];

      for (const materia of subjectsToPlan) {
        const horasMateria = Math.max(1, materia.horasSemanales || 4);
        
        // Si la materia entra en este periodo, la sumamos
        if (horasUsadas + horasMateria <= horasPorSemana) {
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
        } else {
          // Si no entra, queda para el siguiente periodo
          remaining.push(materia);
        }
      }

      if (materiasPeriodo.length > 0) {
        periodos.push({ 
          anio: currentAnio, 
          cuatrimestre: currentCuatrimestre, 
          horasUsadas, 
          materias: materiasPeriodo 
        });
      } else {
        // Si ninguna materia entra (ej: una materia pide 10h y el límite es 8h),
        // evitamos bucle infinito y salimos.
        break;
      }

      subjectsToPlan = remaining;
      currentCuatrimestre = currentCuatrimestre === 1 ? 2 : 1;
      if (currentCuatrimestre === 1) currentAnio++;
    }

    res.json({
      horasPorSemana,
      periodos,
      pendientesNoPlanificadas: subjectsToPlan.map((m) => ({
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

const deleteGrade = async (req, res) => {
  try {
    const { materiaId } = req.params;
    const userId = req.user.id;

    const result = await Grade.findOneAndDelete({ estudiante: userId, materia: materiaId });

    if (!result) {
      return res.status(404).json({ mensaje: 'No se encontró la materia en tu situación académica' });
    }

    res.json({ mensaje: 'Materia eliminada de la situación académica' });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al eliminar la materia', error: error.message });
  }
};

module.exports = {
  getPlanSubjectsForUser,
  getStudentSituation,
  getPendingSubjects,
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
  saveStudyPlan,
  deleteGrade
};
