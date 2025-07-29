const Appointment = require('../models/appointment.model');

class AppointmentService {
  /**
   * Create a new appointment
   * @param {Object} appointmentData - The appointment data
   * @returns {Promise<Object>} - The created appointment
   */
  static async createAppointment(appointmentData) {
    // Validate required fields
    this.validateAppointmentData(appointmentData);
    
    // Set default status to pending
    const dataToCreate = {
      ...appointmentData,
      status: 'pending',
    };
    
    return await Appointment.create(dataToCreate);
  }
  
  /**
   * Get all appointments
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - Array of appointments
   */
  static async getAllAppointments(filters = {}) {
    if (filters.status) {
      return await Appointment.getByStatus(filters.status);
    }
    
    if (filters.startDate && filters.endDate) {
      return await Appointment.getByDateRange(filters.startDate, filters.endDate);
    }
    
    return await Appointment.getAll();
  }
  
  /**
   * Get appointment by ID
   * @param {string} id - The appointment ID
   * @returns {Promise<Object>} - The appointment
   */
  static async getAppointmentById(id) {
    if (!id) {
      throw new Error('Appointment ID is required');
    }
    
    return await Appointment.getById(id);
  }
  
  /**
   * Update appointment status
   * @param {string} id - The appointment ID
   * @param {string} status - The new status
   * @returns {Promise<Object>} - The updated appointment
   */
  static async updateAppointmentStatus(id, status) {
    if (!id) {
      throw new Error('Appointment ID is required');
    }
    
    if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
      throw new Error('Invalid appointment status');
    }
    
    return await Appointment.update(id, { status });
  }
  
  /**
   * Update appointment details
   * @param {string} id - The appointment ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated appointment
   */
  static async updateAppointment(id, updateData) {
    if (!id) {
      throw new Error('Appointment ID is required');
    }
    
    // Don't allow updating certain fields
    const { id: _, created_at, ...safeUpdateData } = updateData;
    
    return await Appointment.update(id, safeUpdateData);
  }
  
  /**
   * Delete an appointment
   * @param {string} id - The appointment ID
   * @returns {Promise<void>}
   */
  static async deleteAppointment(id) {
    if (!id) {
      throw new Error('Appointment ID is required');
    }
    
    return await Appointment.delete(id);
  }
  
  /**
   * Validate appointment data
   * @param {Object} data - The appointment data to validate
   * @throws {Error} - If validation fails
   */
  static validateAppointmentData(data) {
    const requiredFields = [
      'client_name',
      'client_email',
      'practice_area',
      'preferred_date',
      'preferred_time'
    ];
    
    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.client_email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(data.preferred_date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    
    // Validate time format (HH:MM:SS or HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/;
    if (!timeRegex.test(data.preferred_time)) {
      throw new Error('Invalid time format. Use HH:MM or HH:MM:SS');
    }
  }
}

module.exports = AppointmentService; 