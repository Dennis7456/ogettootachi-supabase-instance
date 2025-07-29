const AppointmentService = require('../services/appointment.service');

/**
 * Create a new appointment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.createAppointment = async (req, res) => {
  try {
    const appointmentData = req.body;
    const appointment = await AppointmentService.createAppointment(appointmentData);
    
    return res.status(201).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Error creating appointment:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to create appointment',
    });
  }
};

/**
 * Get all appointments with optional filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAllAppointments = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    
    const appointments = await AppointmentService.getAllAppointments(filters);
    
    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error('Error getting appointments:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Get appointment by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await AppointmentService.getAppointmentById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found',
      });
    }
    
    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Error getting appointment:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

/**
 * Update appointment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
      });
    }
    
    const appointment = await AppointmentService.updateAppointmentStatus(
      req.params.id,
      status
    );
    
    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to update appointment status',
    });
  }
};

/**
 * Update appointment details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.updateAppointment = async (req, res) => {
  try {
    const updateData = req.body;
    
    const appointment = await AppointmentService.updateAppointment(
      req.params.id,
      updateData
    );
    
    return res.status(200).json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    
    return res.status(400).json({
      success: false,
      error: error.message || 'Failed to update appointment',
    });
  }
};

/**
 * Delete appointment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.deleteAppointment = async (req, res) => {
  try {
    await AppointmentService.deleteAppointment(req.params.id);
    
    return res.status(200).json({
      success: true,
      data: {},
      message: 'Appointment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
}; 