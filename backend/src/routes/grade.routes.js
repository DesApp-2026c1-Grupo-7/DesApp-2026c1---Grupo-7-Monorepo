const express = require('express');
const multer = require('multer');
const router = express.Router();
const gradeController = require('../controllers/grade.controller');
const importController = require('../controllers/import.controller');
const { auth } = require('../middlewares/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Situación académica
router.get('/situacion', auth, gradeController.getStudentSituation);
router.post('/situacion', auth, gradeController.updateGrade);
router.post('/situacion/bulk', auth, gradeController.bulkLoadSituation);
router.post('/situacion/import-excel', auth, upload.single('file'), importController.importSituationExcel);

// Inscripciones a cursada
router.post('/inscripciones', auth, gradeController.inscribirseACursada);
router.post('/cierre-cuatri', auth, gradeController.cerrarCuatrimestre);
router.get('/inscripciones-activas', auth, gradeController.getInscripcionesActivas);

// Asistente académico
router.get('/disponibles', auth, gradeController.getMateriasDisponibles);
router.get('/proyeccion', auth, gradeController.getProyeccionCursada);
router.get('/avance', auth, gradeController.getAvanceCarrera);

module.exports = router;
