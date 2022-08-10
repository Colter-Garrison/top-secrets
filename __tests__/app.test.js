const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');

const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'testemail@example.com',
  password: 'asdf',
};

const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? testUser.password;
  const agent = request.agent(app);
  const user = await UserService.create({ ...testUser, userProps });
  const { email } = user;
  await agent.post('/api/v1/users/sessions').send({ email, password });
  return [agent, user];
};

describe('backend-express-template routes', () => {
  beforeEach(() => {
    return setup(pool);
  });

  it('POST should create a new user', async () => {
    const res = await request(app).post('/api/v1/users').send(testUser);
    const { firstName, lastName, email } = testUser;

    expect(res.body).toEqual({
      id: expect.any(String),
      firstName,
      lastName,
      email,
    });
  });

  it('POST should sign in an existing user', async () => {
    await request(app).post('/api/v1/users').send(testUser);
    const res = await request(app).post('/api/v1/users/sessions').send({ email: 'testemail@example.com', password: 'asdf' });
    expect(res.status).toBe(200);
  });

  it('DELETE should log a user out', async () => {
    const [agent] = await registerAndLogin();
    const res = await agent.delete('/api/v1/users/sessions');
    expect(res.status).toBe(204);
  });

  it('GET should return a list of secrets if a user is signed in', async () => {
    const [agent] = await registerAndLogin();
    const res = await agent.get('/api/v1/secrets');
    expect(res.status).toBe(200);
  });
  

  afterAll(() => {
    pool.end();
  });
});
