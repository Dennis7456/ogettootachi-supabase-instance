const sinon = require('sinon');
const Appointment = require('../../src/models/appointment.model');
const supabase = require('../../src/utils/supabase');

describe('Appointment Model', () => {
  let supabaseStub;
  let mockClient;
  
  // Sample appointment data
  const mockAppointmentData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    client_name: 'Test User',
    client_email: 'test@example.com',
    client_phone: '1234567890',
    practice_area: 'Corporate Law',
    preferred_date: '2023-06-01',
    preferred_time: '10:00:00',
    message: 'Test appointment',
    status: 'pending',
    created_at: '2023-05-30T12:00:00Z',
  };
  
  beforeEach(() => {
    // Create mock Supabase client with method chaining
    mockClient = {
      from: sinon.stub().returnsThis(),
      select: sinon.stub().returnsThis(),
      insert: sinon.stub().returnsThis(),
      update: sinon.stub().returnsThis(),
      eq: sinon.stub().returnsThis(),
      single: sinon.stub().returnsThis(),
      order: sinon.stub().returnsThis(),
      gte: sinon.stub().returnsThis(),
      lte: sinon.stub().returnsThis(),
      delete: sinon.stub().returnsThis(),
    };
    
    // Stub the getClient method to return our mock client
    supabaseStub = sinon.stub(supabase, 'getClient').returns(mockClient);
  });
  
  afterEach(() => {
    // Restore stubs
    supabaseStub.restore();
    sinon.restore();
  });
  
  describe('create()', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        client_name: 'Test User',
        client_email: 'test@example.com',
        client_phone: '1234567890',
        practice_area: 'Corporate Law',
        preferred_date: '2023-06-01',
        preferred_time: '10:00:00',
        message: 'Test appointment',
      };
      
      // Mock the response directly
      mockClient.insert.resolves({ 
        data: [mockAppointmentData], 
        error: null 
      });
      
      const result = await Appointment.create(appointmentData);
      
      expect(mockClient.from.calledWith('appointments')).toBe(true);
      expect(result).toHaveProperty('id');
      expect(result.client_name).toBe(appointmentData.client_name);
    });
    
    it('should throw an error if appointment creation fails', async () => {
      mockClient.insert.resolves({ data: null, error: new Error('Database error') });
      
      await expect(Appointment.create({})).rejects.toThrow('Failed to create appointment');
    });
  });
  
  describe('getById()', () => {
    it('should return an appointment by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock the response directly
      mockClient.single.resolves({ 
        data: mockAppointmentData, 
        error: null 
      });
      
      const result = await Appointment.getById(id);
      
      expect(mockClient.from.calledWith('appointments')).toBe(true);
      expect(mockClient.eq.calledWith('id', id)).toBe(true);
      expect(result).toHaveProperty('id', id);
    });
    
    it('should throw an error if appointment retrieval fails', async () => {
      mockClient.single.resolves({ data: null, error: new Error('Not found') });
      
      await expect(Appointment.getById('invalid-id')).rejects.toThrow('Failed to get appointment');
    });
  });
  
  describe('getAll()', () => {
    it('should return all appointments', async () => {
      // Mock the response directly
      mockClient.select.resolves({ 
        data: [mockAppointmentData], 
        error: null 
      });
      
      const result = await Appointment.getAll();
      
      expect(mockClient.from.calledWith('appointments')).toBe(true);
      expect(mockClient.order.calledWith('preferred_date', { ascending: true })).toBe(true);
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should throw an error if appointments retrieval fails', async () => {
      mockClient.select.resolves({ data: null, error: new Error('Database error') });
      
      await expect(Appointment.getAll()).rejects.toThrow('Failed to get appointments');
    });
  });
  
  describe('update()', () => {
    it('should update an appointment', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = { status: 'confirmed' };
      
      // Mock the response directly
      mockClient.update.resolves({ 
        data: {...mockAppointmentData, status: 'confirmed'}, 
        error: null 
      });
      
      const result = await Appointment.update(id, updateData);
      
      expect(mockClient.from.calledWith('appointments')).toBe(true);
      expect(mockClient.update.calledWith(updateData)).toBe(true);
      expect(mockClient.eq.calledWith('id', id)).toBe(true);
      expect(result).toHaveProperty('status', 'confirmed');
    });
    
    it('should throw an error if appointment update fails', async () => {
      mockClient.update.resolves({ data: null, error: new Error('Update failed') });
      
      await expect(Appointment.update('invalid-id', {})).rejects.toThrow('Failed to update appointment');
    });
  });
  
  describe('getByStatus()', () => {
    it('should return appointments filtered by status', async () => {
      const status = 'pending';
      
      // Mock the response directly
      mockClient.select.resolves({ 
        data: [mockAppointmentData], 
        error: null 
      });
      
      const result = await Appointment.getByStatus(status);
      
      expect(mockClient.from.calledWith('appointments')).toBe(true);
      expect(mockClient.eq.calledWith('status', status)).toBe(true);
      expect(Array.isArray(result)).toBe(true);
    });
    
    it('should throw an error if status filtering fails', async () => {
      mockClient.select.resolves({ data: null, error: new Error('Filter failed') });
      
      await expect(Appointment.getByStatus('invalid-status')).rejects.toThrow('Failed to get appointments');
    });
  });
  
  describe('getByDateRange()', () => {
    it('should return appointments within a date range', async () => {
      const startDate = '2023-06-01';
      const endDate = '2023-06-30';
      
      // Mock the response directly
      mockClient.select.resolves({ 
        data: [mockAppointmentData], 
        error: null 
      });
      
      const result = await Appointment.getByDateRange(startDate, endDate);
      
      expect(mockClient.from.calledWith('appointments')).toBe(true);
      expect(mockClient.gte.calledWith('preferred_date', startDate)).toBe(true);
      expect(mockClient.lte.calledWith('preferred_date', endDate)).toBe(true);
      expect(Array.isArray(result)).toBe(true);
    });
  });
  
  describe('delete()', () => {
    it('should delete an appointment', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      
      // Mock the response directly
      mockClient.delete.resolves({ 
        error: null 
      });
      
      await Appointment.delete(id);
      
      expect(mockClient.from.calledWith('appointments')).toBe(true);
      expect(mockClient.eq.calledWith('id', id)).toBe(true);
      expect(mockClient.delete.calledOnce).toBe(true);
    });
    
    it('should throw an error if appointment deletion fails', async () => {
      mockClient.delete.resolves({ error: new Error('Delete failed') });
      
      await expect(Appointment.delete('invalid-id')).rejects.toThrow();
    });
  });
}); 