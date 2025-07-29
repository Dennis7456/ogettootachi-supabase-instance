const supabase = require('../utils/supabase');

class Contact {
  static async create(contactData) {
    try {
      const { data, error } = await supabase
        .getClient()
        .from('contacts')
        .insert([contactData])
        .select();
      
      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Error creating contact:', error);
      throw new Error('Failed to create contact');
    }
  }

  static async getById(id) {
    try {
      const { data, error } = await supabase
        .getClient()
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error getting contact with id ${id}:`, error);
      throw new Error('Failed to get contact');
    }
  }

  static async getAll() {
    try {
      const { data, error } = await supabase
        .getClient()
        .from('contacts')
        .select('*');
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting all contacts:', error);
      throw new Error('Failed to get contacts');
    }
  }
}

module.exports = Contact;
