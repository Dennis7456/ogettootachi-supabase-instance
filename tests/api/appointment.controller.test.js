const sinon = require('sinon');
const httpMocks = require('node-mocks-http');
const appointmentController = require('../../src/api/appointment.controller');
const AppointmentService = require('../../src/services/appointment.service');

describe('Appointment Controller', () => {
  // Sample appointment data
  const sampleAppointment = {
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
  
  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });
  
  describe('createAppointment', () => {
    it('should create a new appointment and return 201 status', async () => {
      // Create request and response objects
      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/appointments',
        body: {
          client_name: 'Test User',
          client_email: 'test@example.com',
          client_phone: '1234567890',
          practice_area: 'Corporate Law',
          preferred_date: '2023-06-01',
          preferred_time: '10:00:00',
          message: 'Test appointment',
        },
      });
      
      const res = httpMocks.createResponse();
      
      // Stub the service method
      sinon.stub(AppointmentService, 'createAppointment').resolves(sampleAppointment);
      
      // Call the controller method
      await appointmentController.createAppointment(req, res);
      
      // Assertions
      const data = JSON.parse(res._getData());
      expect(res._getStatusCode()).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(sampleAppointment);
    });
    
    it('should return 400 status if appointment creation fails', async () => {
      // Create request and response objects
      const req = httpMocks.createRequest({
        method: 'POST',
        url: '/api/appointments',
        body: {
          // Missing required fields
        },
      });
      
      const res = httpMocks.createResponse();
      
      // Stub the service method to throw an error
      sinon.stub(AppointmentService, 'createAppointment').rejects(new Error('Missing required fields'));
      
      // Call the controller method
      await appointmentController.createAppointment(req, res);
      
      // Assertions
      const data = JSON.parse(res._getData());
      expect(res._getStatusCode()).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Missing required fields');
    });
  });
  
  describe('getAllAppointments', () => {
    it('should return all appointments with 200 status', async () => {
      // Create request and response objects
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/appointments',
        query: {},
      });
      
      const res = httpMocks.createResponse();
      
      // Stub the service method
      sinon.stub(AppointmentService, 'getAllAppointments').resolves([sampleAppointment]);
      
      // Call the controller method
      await appointmentController.getAllAppointments(req, res);
      
      // Assertions
      const data = JSON.parse(res._getData());
      expect(res._getStatusCode()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.count).toBe(1);
      expect(data.data).toEqual([sampleAppointment]);
    });
    
    it('should apply filters when provided', async () => {
      // Create request and response objects with filters
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/appointments',
        query: {
          status: 'pending',
          startDate: '2023-06-01',
          endDate: '2023-06-30',
        },
      });
      
      const res = httpMocks.createResponse();
      
      // Stub the service method
      const getAllAppointmentsStub = sinon.stub(AppointmentService, 'getAllAppointments').resolves([sampleAppointment]);
      
      // Call the controller method
      await appointmentController.getAllAppointments(req, res);
      
      // Assertions
      expect(getAllAppointmentsStub.calledWith({
        status: 'pending',
        startDate: '2023-06-01',
        endDate: '2023-06-30',
      })).toBe(true);
    });
    
    it('should return 500 status if appointments retrieval fails', async () => {
      // Create request and response objects
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/appointments',
      });
      
      const res = httpMocks.createResponse();
      
      // Stub the service method to throw an error
      sinon.stub(AppointmentService, 'getAllAppointments').rejects(new Error('Database error'));
      
      // Call the controller method
      await appointmentController.getAllAppointments(req, res);
      
      // Assertions
      const data = JSON.parse(res._getData());
      expect(res._getStatusCode()).toBe(500);
      expect(data.success).toBe(false);
    });
  });
  
  describe('getAppointmentById', () => {
    it('should return appointment by ID with 200 status', async () => {
      // Create request and response objects
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/appointments/123',
        params: {
          id: '123',
        },
      });
      
      const res = httpMocks.createResponse();
      
      // Stub the service method
      sinon.stub(AppointmentService, 'getAppointmentById').resolves(sampleAppointment);
      
      // Call the controller method
      await appointmentController.getAppointmentById(req, res);
      
      // Assertions
      const data = JSON.parse(res._getData());
      expect(res._getStatusCode()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(sampleAppointment);
    });
    
    it('should return 404 status if appointment not found', async () => {
      // Create request and response objects
      const req = httpMocks.createRequest({
        method: 'GET',
        url: '/api/appointments/123',
        params: {
          id: '123',
        },
      });
      
      const res = httpMocks.createResponse();
      
      // Stub the service method to return null (not found)
      sinon.stub(AppointmentService, 'getAppointmentById').resolves(null);
      
      // Call the controller method
      await appointmentController.getAppointmentById(req, res);
      
      // Assertions
      const data = JSON.parse(res._getData());
      expect(res._getStatusCode()).toBe(404);
      expect(data.success).toBe(false);
    });
  });
  
  describe('updateAppointmentStatus', () => {
    it('should update appointment status with 200 status', async () => {
      // Create request and response objects
      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/appointments/123/status',
        params: {
          id: '123',
        },
        body: {
          status: 'confirmed',
        },
      });
      
      const res = httpMocks.createResponse();
      
      // Stub the service method
      sinon.stub(AppointmentService, 'updateAppointmentStatus').resolves({
        ...sampleAppointment,
        status: 'confirmed',
      });
      
      // Call the controller method
      await appointmentController.updateAppointmentStatus(req, res);
      
      // Assertions
      const data = JSON.parse(res._getData());
      expect(res._getStatusCode()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.status).toBe('confirmed');
    });
    
    it('should return 400 status if status is not provided', async () => {
      // Create request and response objects
      const req = httpMocks.createRequest({
        method: 'PUT',
        url: '/api/appointments/123/status',
        params: {
          id: '123',
        },
        body: {
          // Missing status
        },
      });
      
      const res = httpMocks.createResponse();
      
      // Call the controller method
      await appointmentController.updateAppointmentStatus(req, res);
      
      // Assertions
      const data = JSON.parse(res._getData());
      expect(res._getStatusCode()).toBe(400);
      expect(data.success).toBe(false);
    });
  });
  
  describe('deleteAppointment', () => {
    it('should delete appointment and return 200 status', async () => {
      // Create request and response objects
      const req = httpMocks.createRequest({
        method: 'DELETE',
        url: '/api/appointments/123',
        params: {
          id: '123',
        },
      });
      
      const res = httpMocks.createResponse();
      
      // Stub the service method
      sinon.stub(AppointmentService, 'deleteAppointment').resolves();
      
      // Call the controller method
      await appointmentController.deleteAppointment(req, res);
      
      // Assertions
      const data = JSON.parse(res._getData());
      expect(res._getStatusCode()).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');
    });
  });
}); 