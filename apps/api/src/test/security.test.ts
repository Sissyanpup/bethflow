import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../app.js';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcrypt';

// Two test users: alice (attacker) and bob (victim)
const TS = Date.now();
const ALICE = { email: `alice_sec_${TS}@test.invalid`, username: `alice${TS.toString(36)}`.slice(0, 20), password: 'AlicePw1!' };
const BOB = { email: `bob_sec_${TS}@test.invalid`, username: `bob${TS.toString(36)}`.slice(0, 20), password: 'BobPass1!' };

let aliceToken = '';
let bobBoardId = '';

beforeAll(async () => {
  // Create both users directly (bypass bcrypt cost in test — use cost 4 for speed)
  const [aliceUser, bobUser] = await Promise.all([
    prisma.user.create({
      data: { email: ALICE.email, username: ALICE.username, passwordHash: await bcrypt.hash(ALICE.password, 4), isVerified: true },
    }),
    prisma.user.create({
      data: { email: BOB.email, username: BOB.username, passwordHash: await bcrypt.hash(BOB.password, 4), isVerified: true },
    }),
  ]);

  // Create a board owned by Bob
  const board = await prisma.board.create({ data: { title: 'Bob private', ownerId: bobUser.id } });
  bobBoardId = board.id;

  // Get Alice's access token
  const login = await request(app)
    .post('/api/auth/login')
    .send({ email: ALICE.email, password: ALICE.password });
  aliceToken = (login.body.data as { accessToken: string }).accessToken;

  void aliceUser; // used via token
});

afterAll(async () => {
  await prisma.board.deleteMany({ where: { id: bobBoardId } });
  await prisma.user.deleteMany({ where: { email: { in: [ALICE.email, BOB.email] } } });
});

describe('JWT attacks', () => {
  it('rejects JWT none algorithm', async () => {
    // Header: {"alg":"none","typ":"JWT"}  Payload: {"sub":"hacked","role":"ADMIN","exp":9999999999}
    const fakeToken = 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiJoYWNrZWQiLCJlbWFpbCI6ImhhY2tlckBoYWNrLmNvbSIsInJvbGUiOiJBRE1JTiIsImV4cCI6OTk5OTk5OTk5OX0.';
    const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${fakeToken}`);
    expect(res.status).toBe(401);
  });

  it('rejects missing Authorization header → 401', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});

describe('Mass assignment protection', () => {
  it('PATCH /api/users/me ignores role and isVerified fields', async () => {
    const res = await request(app)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ role: 'ADMIN', isVerified: false, isActive: false, displayName: 'Hacker' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('USER');
    expect(res.body.data.isVerified).toBe(true);
    expect(res.body.data.isActive).toBe(true);
    expect(res.body.data.displayName).toBe('Hacker');
  });
});

describe('IDOR — access other user resources', () => {
  it("Alice cannot read Bob's board → 403", async () => {
    const res = await request(app)
      .get(`/api/boards/${bobBoardId}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});

describe('Social link URL scheme enforcement (stored XSS prevention)', () => {
  it('rejects javascript: URL → 422', async () => {
    const res = await request(app)
      .post('/api/me/social-links')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ platform: 'github', label: 'XSS', url: 'javascript:alert(document.cookie)' });

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects data: URI → 422', async () => {
    const res = await request(app)
      .post('/api/me/social-links')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ platform: 'github', label: 'XSS', url: 'data:text/html,<script>alert(1)</script>' });

    expect(res.status).toBe(422);
  });

  it('accepts https:// URL → 201', async () => {
    const res = await request(app)
      .post('/api/me/social-links')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ platform: 'github', label: 'GitHub', url: 'https://github.com/alice' });

    expect(res.status).toBe(201);

    // Clean up the created link
    if (res.body.data?.id) {
      await request(app)
        .delete(`/api/me/social-links/${res.body.data.id as string}`)
        .set('Authorization', `Bearer ${aliceToken}`);
    }
  });
});

describe('GDPR endpoints', () => {
  it('GET /api/users/me/export returns full user data', async () => {
    const res = await request(app)
      .get('/api/users/me/export')
      .set('Authorization', `Bearer ${aliceToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.profile.email).toBe(ALICE.email);
    expect(res.body.data.exportedAt).toBeTruthy();
    expect(res.headers['content-disposition']).toMatch(/attachment/);
  });

  it('DELETE /api/users/me deactivates account', async () => {
    // Use Bob's credentials for this destructive test (Alice is used in other tests)
    const bobLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: BOB.email, password: BOB.password });
    const bobToken = (bobLogin.body.data as { accessToken: string }).accessToken;

    const del = await request(app)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${bobToken}`);

    expect(del.status).toBe(200);

    // Bob can no longer login (account deactivated)
    const loginAgain = await request(app)
      .post('/api/auth/login')
      .send({ email: BOB.email, password: BOB.password });
    expect(loginAgain.status).toBe(401);
  });
});
