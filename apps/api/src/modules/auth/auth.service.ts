import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import type { TokenPayload, AuthTokens } from '@bethflow/shared';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function getPrivateKey(): string {
  const key = process.env['JWT_PRIVATE_KEY'];
  if (!key) throw new Error('JWT_PRIVATE_KEY is not set');
  return key.replace(/\\n/g, '\n');
}

export async function registerUser(
  email: string,
  username: string,
  password: string,
  displayName?: string,
) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    throw Object.assign(new Error('Email or username already taken'), { code: 'CONFLICT' });
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await prisma.user.create({
    data: { email, username, passwordHash, displayName: displayName ?? null },
  });

  return sanitizeUser(user);
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    throw Object.assign(new Error('Invalid email or password'), { code: 'UNAUTHORIZED' });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw Object.assign(new Error('Invalid email or password'), { code: 'UNAUTHORIZED' });
  }

  const tokens = await issueTokens(user.id, user.email, user.role as 'GUEST' | 'USER' | 'ADMIN');
  return { user: sanitizeUser(user), tokens };
}

export async function refreshTokens(rawToken: string) {
  const stored = await prisma.refreshToken.findUnique({ where: { token: rawToken } });
  if (!stored || stored.expiresAt < new Date()) {
    if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw Object.assign(new Error('Refresh token invalid or expired'), { code: 'UNAUTHORIZED' });
  }

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const user = await prisma.user.findUniqueOrThrow({ where: { id: stored.userId } });
  return issueTokens(user.id, user.email, user.role as 'GUEST' | 'USER' | 'ADMIN');
}

export async function revokeRefreshToken(rawToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: rawToken } });
}

async function issueTokens(
  userId: string,
  email: string,
  role: 'GUEST' | 'USER' | 'ADMIN',
): Promise<{ access: AuthTokens; refreshToken: string }> {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = { sub: userId, email, role };
  const accessToken = jwt.sign(payload, getPrivateKey(), {
    algorithm: 'RS256',
    expiresIn: ACCESS_TOKEN_TTL,
  });

  const refreshToken = crypto.randomBytes(64).toString('hex');
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return {
    access: { accessToken, expiresIn: 15 * 60 },
    refreshToken,
  };
}

function sanitizeUser(user: { id: string; email: string; username: string; displayName: string | null; avatarUrl: string | null; bio: string | null; role: string; isActive: boolean; isVerified: boolean; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    role: user.role,
    isActive: user.isActive,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  };
}
