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
router.post('/situacion/preview-excel', auth, upload.single('file'), importController.previewSituationExcel);
router.post('/situacion/confirm-excel', auth, importController.confirmSituationExcel);
router.post('/situacion/import-excel', auth, upload.single('file'), importController.importSituationExcel);

// Inscripciones a cursada
router.post('/inscripciones', auth, gradeController.inscribirseACursada);
router.post('/cierre-cuatri', auth, gradeController.cerrarCuatrimestre);
router.get('/inscripciones-activas', auth, gradeController.getInscripcionesActivas);

// Asistente académico
router.get('/disponibles', auth, gradeController.getMateriasDisponibles);
router.get('/proyeccion', auth, gradeController.getProyeccionCursada);
router.get('/avance', auth, gradeController.getAvanceCarrera);
router.post('/que-pasa-si', auth, gradeController.getQuePasaSi);
router.get('/planificador', auth, gradeController.getPlanificador);
router.get('/actividades-creditos', auth, gradeController.listCreditActivities);
router.post('/actividades-creditos', auth, gradeController.createCreditActivity);

module.exports = router;
