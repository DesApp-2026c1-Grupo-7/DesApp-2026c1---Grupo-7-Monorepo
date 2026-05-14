const express = require('express');
const router = express.Router();
const invitationController = require('../controllers/invitation.controller');
const { auth } = require('../middlewares/auth');

// Rutas protegidas
router.post('/enviar', auth, invitationController.sendInvitation);
router.post('/aceptar', auth, invitationController.acceptInvitation);
router.post('/rechazar', auth, invitationController.rejectInvitation);
router.get('/pendientes', auth, invitationController.getInvitacionesPendientes);
router.get('/enviadas', auth, invitationController.getInvitacionesEnviadas);
router.delete('/:id', auth, invitationController.cancelarInvitacion);
router.get('/contactos', auth, invitationController.getContactos);
router.delete('/contactos/:id', auth, invitationController.removeContacto);

// Ruta pública para verificar el token de la invitación
router.get('/verificar/:token', invitationController.getInvitationByToken);

module.exports = router;
