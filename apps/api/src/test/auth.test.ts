import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';

// Unique suffix per test run to avoid collisions with parallel test files
const SUFFIX = `${Date.now()}_auth`;
const EMAIL = `test_${SUFFIX}@test.invalid`;
const USERNAME = `tu${Date.now().toString(36)}`.slice(0, 20);
const PASSWORD = 'TestPass1!';

afterAll(async () => {
  await prisma.otpToken.deleteMany({ where: { email: EMAIL } });
  await prisma.user.deleteMany({ where: { email: EMAIL } });
});

describe('POST /api/auth/register', () => {
  it('creates user and returns pendingVerification', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: EMAIL, username: USERNAME, password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pendingVerification).toBe(true);
    expect(res.body.data.email).toBe(EMAIL);
  });

  it('returns 409 on duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: EMAIL, username: `${USERNAME}_2`, password: PASSWORD });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects invalid username (XSS chars)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'other@test.invalid', username: '<script>', password: PASSWORD });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('POST /api/auth/login', () => {
  it('blocks login for unverified user → 403 EMAIL_NOT_VERIFIED', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('EMAIL_NOT_VERIFIED');
    expect(res.body.error.details.email).toBe(EMAIL);
  });

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: 'WrongPass999!' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('POST /api/auth/send-otp', () => {
  it('returns 200 for non-existent email (anti-enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/send-otp')
      .send({ email: 'ghost_xyz_9999@test.invalid' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('POST /api/auth/verify-otp', () => {
  it('rejects wrong code → 401', async () => {
    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: EMAIL, code: '000000' });

    expect(res.status).toBe(401);
  });

  it('accepts correct code from DB → sets isVerified, returns access token', async () => {
    const otp = await prisma.otpToken.findFirst({
      where: { email: EMAIL, used: false },
      orderBy: { createdAt: 'desc' },
    });
    expect(otp).not.toBeNull();

    const res = await request(app)
      .post('/api/auth/verify-otp')
      .send({ email: EMAIL, code: otp!.code });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.isVerified).toBe(true);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});

describe('Auth flow — verified user login and refresh token rotation', () => {
  it('login succeeds after verification', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.isVerified).toBe(true);
  });

  it('refresh token is single-use (rotation)', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: EMAIL, password: PASSWORD });

    const cookies = login.headers['set-cookie'] as string[] | undefined;
    expect(cookies).toBeDefined();

    const r1 = await request(app).post('/api/auth/refresh').set('Cookie', cookies ?? []);
    expect(r1.status).toBe(200);

    // Same original refresh cookie must now be invalid
    const r2 = await request(app).post('/api/auth/refresh').set('Cookie', cookies ?? []);
    expect(r2.status).toBe(401);
  });
});
