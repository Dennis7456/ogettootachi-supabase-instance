const express = require('express');
const router = express.Router();
const appointmentController = require('./appointment.controller');
const { authMiddleware } = require('../middleware/auth');

// Public routes
router.post('/', appointmentController.createAppointment);

// Protected routes (require authentication)
router.get('/', authMiddleware, appointmentController.getAllAppointments);
router.get('/:id', authMiddleware, appointmentController.getAppointmentById);
router.put('/:id/status', authMiddleware, appointmentController.updateAppointmentStatus);
router.put('/:id', authMiddleware, appointmentController.updateAppointment);
router.delete('/:id', authMiddleware, appointmentController.deleteAppointment);

module.exports = router; 