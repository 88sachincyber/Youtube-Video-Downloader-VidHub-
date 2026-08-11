const request = require('supertest');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret';
process.env.JWT_EXPIRES_IN = '1d';

const app = require('../app');
const User = require('../models/User');
const Program = require('../models/Program');
const Application = require('../models/Application');
const { clearCacheByPrefix } = require('../utils/cache');

const createToken = () => jwt.sign({ id: '507f1f77bcf86cd799439011', email: 'alice@example.com' }, process.env.JWT_SECRET);

beforeEach(() => {
  jest.restoreAllMocks();
  clearCacheByPrefix('GET:');
});

describe('Auth flow', () => {
  test('register, login, and fetch profile', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValueOnce(null);
    jest.spyOn(User, 'create').mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Alice',
      email: 'alice@example.com',
      preferences: {},
    });

    const registerResponse = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(registerResponse.status).toBe(201);
    expect(registerResponse.body.data.user.email).toBe('alice@example.com');
    expect(registerResponse.body.data.user.password).toBeUndefined();

    const loginUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'alice@example.com',
      password: 'hashed',
      comparePassword: jest.fn().mockResolvedValue(true),
      toObject: () => ({ _id: '507f1f77bcf86cd799439011', email: 'alice@example.com', password: 'hashed' }),
    };

    jest.spyOn(User, 'findOne').mockReturnValueOnce({
      select: jest.fn().mockResolvedValue(loginUser),
    });

    const loginResponse = await request(app).post('/api/auth/login').send({
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.data.token).toBeDefined();

    jest.spyOn(User, 'findById').mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Alice',
      email: 'alice@example.com',
      preferences: {},
    });

    const profileResponse = await request(app)
      .get('/api/users/profile')
      .set('Authorization', 'Bearer ' + loginResponse.body.data.token);

    expect(profileResponse.status).toBe(200);
    expect(profileResponse.body.data.email).toBe('alice@example.com');
  });

  test('duplicate registration is blocked', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue({ _id: '507f1f77bcf86cd799439011' });

    const duplicateResponse = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.success).toBe(false);
  });

  test('profile endpoint rejects request without token', async () => {
    const response = await request(app).get('/api/users/profile');

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});

describe('Discovery APIs', () => {
  test('supports filtering, sorting, and pagination', async () => {
    const programs = [
      {
        _id: '507f1f77bcf86cd799439020',
        name: 'Computer Science MSc',
        country: 'Canada',
      },
    ];

    const queryBuilder = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue(programs),
    };

    jest.spyOn(Program, 'find').mockReturnValue(queryBuilder);
    jest.spyOn(Program, 'countDocuments').mockResolvedValue(2);

    const response = await request(app)
      .get('/api/programs')
      .query({ country: 'Canada', fieldOfStudy: 'Computer Science', page: 1, limit: 1, sort: '-tuitionFee' });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.meta.total).toBe(2);
    expect(Program.find).toHaveBeenCalledWith({ country: 'Canada', fieldOfStudy: 'Computer Science' });
    expect(queryBuilder.sort).toHaveBeenCalledWith({ tuitionFee: -1 });
    expect(queryBuilder.skip).toHaveBeenCalledWith(0);
    expect(queryBuilder.limit).toHaveBeenCalledWith(1);
  });

  test('recommendations return results and use preferences', async () => {
    const aggregateSpy = jest.spyOn(Program, 'aggregate').mockResolvedValue([
      { name: 'Data Science MSc', country: 'Canada', fieldOfStudy: 'Computer Science', recommendationScore: 16 },
    ]);

    jest.spyOn(User, 'findById').mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      preferences: {
        toObject: () => ({
          preferredCountry: 'Canada',
          budget: 25000,
          fieldOfStudy: 'Computer Science',
          intake: 'Fall',
          ieltsScore: 7,
        }),
      },
    });

    const response = await request(app)
      .get('/api/programs/recommendations')
      .set('Authorization', 'Bearer ' + createToken());

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data[0].country).toBe('Canada');
    expect(aggregateSpy).toHaveBeenCalledTimes(1);
    expect(aggregateSpy.mock.calls[0][0][0].$addFields).toBeDefined();
  });
});

describe('Application workflow', () => {
  test('creates application and status history', async () => {
    jest.spyOn(Program, 'findById').mockResolvedValue({ _id: '507f1f77bcf86cd799439020' });
    jest.spyOn(Application, 'findOne').mockResolvedValue(null);
    jest.spyOn(Application, 'create').mockResolvedValue({
      _id: '507f1f77bcf86cd799439030',
      status: 'Applied',
      statusHistory: [{ status: 'Applied', note: 'Excited to apply' }],
    });

    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', 'Bearer ' + createToken())
      .send({ programId: '507f1f77bcf86cd799439020', note: 'Excited to apply' });

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe('Applied');
    expect(response.body.data.statusHistory).toHaveLength(1);
  });

  test('prevents duplicate application to same program', async () => {
    jest.spyOn(Program, 'findById').mockResolvedValue({ _id: '507f1f77bcf86cd799439020' });
    jest.spyOn(Application, 'findOne').mockResolvedValue({ _id: '507f1f77bcf86cd799439030' });

    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', 'Bearer ' + createToken())
      .send({ programId: '507f1f77bcf86cd799439020' });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });

  test('allows valid status transitions and tracks history', async () => {
    const applicationDoc = {
      _id: '507f1f77bcf86cd799439030',
      status: 'Applied',
      statusHistory: [{ status: 'Applied' }],
      save: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(Application, 'findOne').mockImplementation(() => Promise.resolve(applicationDoc));

    const reviewed = await request(app)
      .patch('/api/applications/507f1f77bcf86cd799439030/status')
      .set('Authorization', 'Bearer ' + createToken())
      .send({ status: 'Reviewed', note: 'Documents verified' });

    expect(reviewed.status).toBe(200);
    expect(reviewed.body.data.status).toBe('Reviewed');

    const accepted = await request(app)
      .patch('/api/applications/507f1f77bcf86cd799439030/status')
      .set('Authorization', 'Bearer ' + createToken())
      .send({ status: 'Accepted', note: 'Approved' });

    expect(accepted.status).toBe(200);
    expect(accepted.body.data.status).toBe('Accepted');
    expect(accepted.body.data.statusHistory).toHaveLength(3);
  });

  test('rejects invalid status transitions', async () => {
    const applicationDoc = {
      _id: '507f1f77bcf86cd799439030',
      status: 'Applied',
      statusHistory: [{ status: 'Applied' }],
      save: jest.fn().mockResolvedValue(true),
    };

    jest.spyOn(Application, 'findOne').mockResolvedValue(applicationDoc);

    const invalidTransition = await request(app)
      .patch('/api/applications/507f1f77bcf86cd799439030/status')
      .set('Authorization', 'Bearer ' + createToken())
      .send({ status: 'Accepted' });

    expect(invalidTransition.status).toBe(400);
    expect(invalidTransition.body.success).toBe(false);
  });
});
