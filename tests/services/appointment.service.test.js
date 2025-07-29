const sinon = require('sinon');
const AppointmentService = require('../../src/services/appointment.service');
const Appointment = require('../../src/models/appointment.model');

describe('Appointment Service', () => {
  // Sample valid appointment data
  const validAppointmentData = {
    client_name: 'Test User',
    client_email: 'test@example.com',
    client_phone: '1234567890',
    practice_area: 'Corporate Law',
    preferred_date: '2023-06-01',
    preferred_time: '10:00:00',
    message: 'Test appointment',
  };
  
  // Sample appointment response
  const appointmentResponse = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    ...validAppointmentData,
    status: 'pending',
    created_at: '2023-05-30T12:00:00Z',
  };
  
  beforeEach(() => {
    // Stub Appointment model methods
    sinon.stub(Appointment, 'create').resolves(appointmentResponse);
    sinon.stub(Appointment, 'getAll').resolves([appointmentResponse]);
    sinon.stub(Appointment, 'getById').resolves(appointmentResponse);
    sinon.stub(Appointment, 'update').resolves({...appointmentResponse, status: 'confirmed'});
    sinon.stub(Appointment, 'delete').resolves();
    sinon.stub(Appointment, 'getByStatus').resolves([appointmentResponse]);
    sinon.stub(Appointment, 'getByDateRange').resolves([appointmentResponse]);
  });
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('createAppointment()', () => {
    it('should create a new appointment with valid data', async () => {
      const result = await AppointmentService.createAppointment(validAppointmentData);
      
      expect(Appointment.create.calledOnce).toBe(true);
      expect(result).toEqual(appointmentResponse);
    });
    
    it('should throw error if required fields are missing', async () => {
      const invalidData = {
        client_name: 'Test User',
        // Missing email and other required fields
      };
      
      await expect(AppointmentService.createAppointment(invalidData)).rejects.toThrow('Missing required fields');
      expect(Appointment.create.called).toBe(false);
    });
    
    it('should throw error if email format is invalid', async () => {
      const invalidData = {
        ...validAppointmentData,
        client_email: 'invalid-email',
      };
      
      await expect(AppointmentService.createAppointment(invalidData)).rejects.toThrow('Invalid email format');
      expect(Appointment.create.called).toBe(false);
    });
    
    it('should throw error if date format is invalid', async () => {
      const invalidData = {
        ...validAppointmentData,
        preferred_date: '01/06/2023', // Wrong format
      };
      
      await expect(AppointmentService.createAppointment(invalidData)).rejects.toThrow('Invalid date format');
      expect(Appointment.create.called).toBe(false);
    });
    
    it('should throw error if time format is invalid', async () => {
      const invalidData = {
        ...validAppointmentData,
        preferred_time: '10am', // Wrong format
      };
      
      await expect(AppointmentService.createAppointment(invalidData)).rejects.toThrow('Invalid time format');
      expect(Appointment.create.called).toBe(false);
    });
  });
  
  describe('getAllAppointments()', () => {
    it('should get all appointments when no filters provided', async () => {
      const result = await AppointmentService.getAllAppointments();
      
      expect(Appointment.getAll.calledOnce).toBe(true);
      expect(result).toEqual([appointmentResponse]);
    });
    
    it('should filter appointments by status when status filter provided', async () => {
      const result = await AppointmentService.getAllAppointments({ status: 'pending' });
      
      expect(Appointment.getByStatus.calledWith('pending')).toBe(true);
      expect(Appointment.getAll.called).toBe(false);
      expect(result).toEqual([appointmentResponse]);
    });
    
    it('should filter appointments by date range when date filters provided', async () => {
      const startDate = '2023-06-01';
      const endDate = '2023-06-30';
      
      const result = await AppointmentService.getAllAppointments({ startDate, endDate });
      
      expect(Appointment.getByDateRange.calledWith(startDate, endDate)).toBe(true);
      expect(Appointment.getAll.called).toBe(false);
      expect(result).toEqual([appointmentResponse]);
    });
  });
  
  describe('getAppointmentById()', () => {
    it('should get appointment by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      
      const result = await AppointmentService.getAppointmentById(id);
      
      expect(Appointment.getById.calledWith(id)).toBe(true);
      expect(result).toEqual(appointmentResponse);
    });
    
    it('should throw error if ID is not provided', async () => {
      await expect(AppointmentService.getAppointmentById()).rejects.toThrow('Appointment ID is required');
      expect(Appointment.getById.called).toBe(false);
    });
  });
  
  describe('updateAppointmentStatus()', () => {
    it('should update appointment status with valid status', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const status = 'confirmed';
      
      const result = await AppointmentService.updateAppointmentStatus(id, status);
      
      expect(Appointment.update.calledWith(id, { status })).toBe(true);
      expect(result.status).toBe('confirmed');
    });
    
    it('should throw error if ID is not provided', async () => {
      await expect(AppointmentService.updateAppointmentStatus(null, 'confirmed')).rejects.toThrow('Appointment ID is required');
      expect(Appointment.update.called).toBe(false);
    });
    
    it('should throw error if status is invalid', async () => {
      await expect(AppointmentService.updateAppointmentStatus('123', 'invalid-status')).rejects.toThrow('Invalid appointment status');
      expect(Appointment.update.called).toBe(false);
    });
  });
  
  describe('updateAppointment()', () => {
    it('should update appointment with valid data', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        client_name: 'Updated Name',
        message: 'Updated message',
      };
      
      await AppointmentService.updateAppointment(id, updateData);
      
      expect(Appointment.update.calledWith(id, updateData)).toBe(true);
    });
    
    it('should throw error if ID is not provided', async () => {
      await expect(AppointmentService.updateAppointment(null, {})).rejects.toThrow('Appointment ID is required');
      expect(Appointment.update.called).toBe(false);
    });
    
    it('should remove id and created_at from update data', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const updateData = {
        id: 'different-id', // Should be removed
        created_at: '2023-01-01', // Should be removed
        client_name: 'Updated Name', // Should be kept
      };
      
      await AppointmentService.updateAppointment(id, updateData);
      
      // Check that id and created_at were removed
      const expectedUpdateData = { client_name: 'Updated Name' };
      expect(Appointment.update.calledWith(id, expectedUpdateData)).toBe(true);
    });
  });
  
  describe('deleteAppointment()', () => {
    it('should delete appointment by ID', async () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      
      await AppointmentService.deleteAppointment(id);
      
      expect(Appointment.delete.calledWith(id)).toBe(true);
    });
    
    it('should throw error if ID is not provided', async () => {
      await expect(AppointmentService.deleteAppointment()).rejects.toThrow('Appointment ID is required');
      expect(Appointment.delete.called).toBe(false);
    });
  });
}); 