const supabase = require('../utils/supabase');

class Appointment {
  /**
   * Create a new appointment
   * @param {Object} appointmentData - The appointment data
   * @returns {Promise<Object>} - The created appointment
   */
  static async create(appointmentData) {
    try {
      // Set default status if not provided
      const dataToInsert = {
        ...appointmentData,
        status: appointmentData.status || 'pending',
      };

      const { data, error } = await supabase
        .getClient()
        .from('appointments')
        .insert([dataToInsert])
        .select();
      
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('No data returned from database');
      
      return data[0];
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw new Error('Failed to create appointment');
    }
  }

  /**
   * Get an appointment by ID
   * @param {string} id - The appointment ID
   * @returns {Promise<Object>} - The appointment
   */
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .getClient()
        .from('appointments')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Appointment not found');
      
      return data;
    } catch (error) {
      console.error(`Error getting appointment with id ${id}:`, error);
      throw new Error('Failed to get appointment');
    }
  }

  /**
   * Get all appointments
   * @returns {Promise<Array>} - Array of appointments
   */
  static async getAll() {
    try {
      const { data, error } = await supabase
        .getClient()
        .from('appointments')
        .select('*')
        .order('preferred_date', { ascending: true });
      
      if (error) throw error;
      if (!data) throw new Error('No data returned from database');
      
      return data;
    } catch (error) {
      console.error('Error getting all appointments:', error);
      throw new Error('Failed to get appointments');
    }
  }

  /**
   * Update an appointment
   * @param {string} id - The appointment ID
   * @param {Object} updateData - The data to update
   * @returns {Promise<Object>} - The updated appointment
   */
  static async update(id, updateData) {
    try {
      const { data, error } = await supabase
        .getClient()
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      if (!data) throw new Error('Appointment not found or not updated');
      
      return data;
    } catch (error) {
      console.error(`Error updating appointment with id ${id}:`, error);
      throw new Error('Failed to update appointment');
    }
  }

  /**
   * Get appointments by status
   * @param {string} status - The status to filter by
   * @returns {Promise<Array>} - Array of appointments
   */
  static async getByStatus(status) {
    try {
      const { data, error } = await supabase
        .getClient()
        .from('appointments')
        .select('*')
        .eq('status', status)
        .order('preferred_date', { ascending: true });
      
      if (error) throw error;
      if (!data) throw new Error('No data returned from database');
      
      return data;
    } catch (error) {
      console.error(`Error getting appointments with status ${status}:`, error);
      throw new Error('Failed to get appointments');
    }
  }

  /**
   * Get appointments within a date range
   * @param {string} startDate - Start date in YYYY-MM-DD format
   * @param {string} endDate - End date in YYYY-MM-DD format
   * @returns {Promise<Array>} - Array of appointments
   */
  static async getByDateRange(startDate, endDate) {
    try {
      const { data, error } = await supabase
        .getClient()
        .from('appointments')
        .select('*')
        .gte('preferred_date', startDate)
        .lte('preferred_date', endDate)
        .order('preferred_date', { ascending: true });
      
      if (error) throw error;
      if (!data) throw new Error('No data returned from database');
      
      return data;
    } catch (error) {
      console.error(`Error getting appointments between ${startDate} and ${endDate}:`, error);
      throw new Error('Failed to get appointments');
    }
  }

  /**
   * Delete an appointment
   * @param {string} id - The appointment ID
   * @returns {Promise<void>}
   */
  static async delete(id) {
    try {
      const { error } = await supabase
        .getClient()
        .from('appointments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error deleting appointment with id ${id}:`, error);
      throw new Error('Failed to delete appointment');
    }
  }
}

module.exports = Appointment; 