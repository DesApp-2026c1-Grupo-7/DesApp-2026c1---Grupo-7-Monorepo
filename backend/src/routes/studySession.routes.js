const { Router } = require('express');
const { 
  createStudySession, 
  getStudySessions, 
  joinStudySession, 
  manageJoinRequest,
  leaveStudySession,
  getStudySessionById,
  updateStudySession,
  cancelStudySession,
  kickParticipant
} = require('../controllers/studySession.controller');
const { auth, authorize } = require('../middlewares/auth');

const router = Router();

// Todas las rutas de sesiones requieren estar autenticado
router.use(auth);

router.get('/', getStudySessions);

// Obtener detalles de una sesión específica
router.get('/:id', getStudySessionById);

// Solo estudiantes pueden proponer sesiones de estudio
router.post('/', authorize('student'), createStudySession);

// Editar una sesión (solo creador)
router.put('/:id', authorize('student'), updateStudySession);

// Cancelar una sesión (solo creador)
router.delete('/:id', authorize('student'), cancelStudySession);

// Unirse a una sesión
router.post('/:id/join', authorize('student'), joinStudySession);

// Darse de baja de una sesión
router.post('/:id/leave', authorize('student'), leaveStudySession);

// Gestionar solicitudes (solo el creador, validado en el controlador)
router.post('/manage-request', authorize('student'), manageJoinRequest);

// Expulsar a un miembro (solo el creador, validado en el controlador)
router.post('/:id/kick/:userId', authorize('student'), kickParticipant);

module.exports = router;
