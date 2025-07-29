const { createClient } = require('@supabase/supabase-js');
const Contact = require('../../src/models/contact.model');
const supabase = require('../../src/utils/supabase');

// Create a mock Supabase client and a single shared query builder
const createMockClient = () => {
  // Shared query builder instance
  const queryBuilder = {
    data: null,
    error: null,
    insert: jest.fn().mockImplementation(function(data) {
      this.data = data;
      return {
        select: jest.fn().mockImplementation(() => Promise.resolve(mockInsertResponse)),
      };
    }),
    select: jest.fn().mockImplementation(function() {
      return this;
    }),
    eq: jest.fn().mockImplementation(function() {
      return this;
    }),
    single: jest.fn().mockImplementation(function() {
      return Promise.resolve(mockSelectResponse);
    }),
  };

  // Supabase client stub that always returns the same builder
  const client = {
    from: jest.fn().mockImplementation(() => queryBuilder),
  };

  return client;
};

// Mock responses
const mockInsertResponse = {
  data: [
    {
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Inquiry',
      message: 'Hello, I have a question',
    },
  ],
  error: null,
};

const mockSelectResponse = {
  data: {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Inquiry',
    message: 'Hello, I have a question',
  },
  error: null,
};

// Mock the Supabase util
const mockClient = createMockClient();
jest.mock('../../src/utils/supabase', () => ({
  getClient: jest.fn(() => mockClient),
  getAdminClient: jest.fn(() => mockClient),
}));

describe('Contact Model', () => {
  // Mock console.error to clean up test output
  const originalConsoleError = console.error;
  
  beforeAll(() => {
    console.error = jest.fn();
  });
  
  afterAll(() => {
    console.error = originalConsoleError;
  });
  
  const mockContact = {
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Inquiry',
    message: 'Hello, I have a question',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a new contact submission', async () => {
    const result = await Contact.create(mockContact);

    expect(result).toEqual({
      id: '123',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Inquiry',
      message: 'Hello, I have a question',
    });

    expect(mockClient.from).toHaveBeenCalledWith('contacts');
    const builder = mockClient.from.mock.results[0].value;

    expect(builder.insert).toHaveBeenCalledTimes(1);
    expect(builder.insert).toHaveBeenCalledWith([mockContact]);
  });

  test('should handle errors when creating a contact', async () => {
    const error = { message: 'Database error' };
    
    // Create a new mock implementation for this test
    const mockErrorInsert = jest.fn().mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({ data: null, error })
    }));
    
    // Get the query builder and override the insert method
    const queryBuilder = mockClient.from();
    queryBuilder.insert = mockErrorInsert;
    
    // Now the test
    await expect(Contact.create(mockContact)).rejects.toThrow('Failed to create contact');
    
    // Verify the calls
    expect(mockClient.from).toHaveBeenCalledWith('contacts');
    expect(mockErrorInsert).toHaveBeenCalledWith([mockContact]);
  });

  test('should get a contact by id', async () => {
    const result = await Contact.getById('123');

    expect(result).toEqual(mockSelectResponse.data);

    expect(mockClient.from).toHaveBeenCalledWith('contacts');
    const builder = mockClient.from.mock.results[0].value;

    expect(builder.select).toHaveBeenCalledWith('*');
    expect(builder.eq).toHaveBeenCalledWith('id', '123');
    expect(builder.single).toHaveBeenCalled();
  });

  test('should get all contacts', async () => {
    // Mock the response for getAll
    const mockContacts = [
      { id: '1', name: 'John Doe', email: 'john@example.com', subject: 'Inquiry', message: 'Hello' },
      { id: '2', name: 'Jane Smith', email: 'jane@example.com', subject: 'Question', message: 'Hi there' }
    ];
    
    // Create a new query builder for this test
    const queryBuilder = mockClient.from();
    queryBuilder.select = jest.fn().mockReturnThis();
    queryBuilder.select.mockImplementation(() => Promise.resolve({ data: mockContacts, error: null }));
    
    // Call the method under test
    const result = await Contact.getAll();
    
    // Verify the result
    expect(result).toEqual(mockContacts);
    
    // Verify the calls
    expect(mockClient.from).toHaveBeenCalledWith('contacts');
    expect(queryBuilder.select).toHaveBeenCalledWith('*');
  });
  
  test('should handle errors when getting all contacts', async () => {
    const error = { message: 'Failed to fetch contacts' };
    
    // Create a new query builder for this test
    const queryBuilder = mockClient.from();
    queryBuilder.select = jest.fn().mockReturnThis();
    queryBuilder.select.mockImplementation(() => Promise.resolve({ data: null, error }));
    
    // Test that the error is properly propagated
    await expect(Contact.getAll()).rejects.toThrow('Failed to get contacts');
    
    // Verify the calls
    expect(mockClient.from).toHaveBeenCalledWith('contacts');
    expect(queryBuilder.select).toHaveBeenCalledWith('*');
  });

  test('should handle Supabase client errors in getById', async () => {
    // Mock a Supabase client error
    const error = new Error('Supabase connection error');
    
    // Create a new query builder that throws an error
    const queryBuilder = mockClient.from();
    queryBuilder.select = jest.fn().mockReturnThis();
    queryBuilder.eq = jest.fn().mockReturnThis();
    queryBuilder.single = jest.fn().mockRejectedValue(error);
    
    // Test that the error is properly caught and rethrown
    await expect(Contact.getById('123')).rejects.toThrow('Failed to get contact');
    
    // Verify the calls
    expect(mockClient.from).toHaveBeenCalledWith('contacts');
    expect(queryBuilder.select).toHaveBeenCalledWith('*');
    expect(queryBuilder.eq).toHaveBeenCalledWith('id', '123');
    expect(queryBuilder.single).toHaveBeenCalled();
  });

  test('should handle Supabase client errors in getAll', async () => {
    // Mock a Supabase client error
    const error = new Error('Supabase connection error');
    
    // Create a new query builder that throws an error
    const queryBuilder = mockClient.from();
    queryBuilder.select = jest.fn().mockRejectedValue(error);
    
    // Test that the error is properly caught and rethrown
    await expect(Contact.getAll()).rejects.toThrow('Failed to get contacts');
    
    // Verify the calls
    expect(mockClient.from).toHaveBeenCalledWith('contacts');
    expect(queryBuilder.select).toHaveBeenCalledWith('*');
  });
});
