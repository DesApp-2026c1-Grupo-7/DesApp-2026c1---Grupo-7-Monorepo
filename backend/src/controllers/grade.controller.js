const Grade = require('../models/Grade');
const Subject = require('../models/Subject');
const User = require('../models/User');
const StudyPlan = require('../models/StudyPlan');

const sortBySubjectPosition = (items) => [...items].sort((a, b) => {
  const materiaA = a.materia || {};
  const materiaB = b.materia || {};
  return (materiaA.anio || 0) - (materiaB.anio || 0) ||
    (materiaA.cuatrimestre || 0) - (materiaB.cuatrimestre || 0) ||
    (materiaA.nombre || '').localeCompare(materiaB.nombre || '');
});

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
    const user = await User.findById(userId).populate('planEstudio');

    // Materias del plan del estudiante (o todas si no tiene plan)
    let materias;
    if (user && user.planEstudio) {
      const plan = await StudyPlan.findById(user.planEstudio).populate('materias');
      materias = plan.materias;
    } else {
      materias = await Subject.find().populate('correlativas');
    }

    // Cargar correlativas si no estan populadas
    materias = await Subject.find({ _id: { $in: materias.map((m) => m._id) } })
      .populate('correlativas');

    // Materias ya aprobadas/promocionadas
    const grades = await Grade.find({ estudiante: userId });
    const aprobadasIds = new Set(
      grades.filter((g) => ['Aprobada', 'Promocion'].includes(g.estado))
        .map((g) => g.materia.toString())
    );
    const yaInscriptaIds = new Set(
      grades.filter((g) => ['Inscripto', 'Cursando', 'Regular'].includes(g.estado))
        .map((g) => g.materia.toString())
    );

    const disponibles = materias
      .filter((m) => !aprobadasIds.has(m._id.toString()))
      .filter((m) => !yaInscriptaIds.has(m._id.toString()))
      .filter((m) => {
        // Cumple todas las correlativas
        const correlIds = (m.correlativas || []).map((c) => c._id.toString());
        return correlIds.every((cid) => aprobadasIds.has(cid));
      });

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
    let creditosOptativasNecesarios = 0;
    let nivelInglesRequerido = 'B1';
    let materiasDelPlanOCarreraIds = [];

    if (user && user.planEstudio) {
      const plan = await StudyPlan.findById(user.planEstudio);
      totalMaterias = plan.materias.length;
      creditosNecesarios = plan.creditosNecesarios;
      creditosOptativasNecesarios = plan.creditosOptativasNecesarios;
      nivelInglesRequerido = plan.nivelInglesRequerido;
      materiasDelPlanOCarreraIds = plan.materias.map((id) => id.toString());
    } else if (user && user.carrera) {
      totalMaterias = user.carrera.cantidadMaterias;
      creditosNecesarios = user.carrera.creditosNecesarios;
      nivelInglesRequerido = user.carrera.nivelInglesRequerido;
      const materiasCarrera = await Subject.find({ carrera: user.carrera._id }).select('_id');
      materiasDelPlanOCarreraIds = materiasCarrera.map((m) => m._id.toString());
    }

    const aprobadas = grades.filter((g) => ['Aprobada', 'Promocion'].includes(g.estado));
    const regularizadas = grades.filter((g) => g.estado === 'Regular');
    const cursando = grades.filter((g) => ['Inscripto', 'Cursando'].includes(g.estado));

    const creditosAprobados = aprobadas.reduce(
      (sum, g) => sum + (g.materia?.creditos || 0),
      0
    );
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
    for (const g of grades) {
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
      creditosNecesarios,
      creditosOptativasAprobados,
      creditosOptativasNecesarios,
      nivelInglesRequerido,
      materiasUnahurFaltantes,
      avancePorAnio,
      porcentajeAvance: totalMaterias > 0 ? Math.round((aprobadas.length / totalMaterias) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al calcular avance', error: error.message });
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
  getAvanceCarrera
};
