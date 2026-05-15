import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { sendOtpEmail } from '../../lib/email.js';
import { logger } from '../../lib/logger.js';
import type { TokenPayload, AuthTokens } from '@bethflow/shared';

const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

function getPrivateKey(): string {
  const key = process.env['JWT_PRIVATE_KEY'];
  if (!key) throw new Error('JWT_PRIVATE_KEY is not set');
  return key.replace(/\\n/g, '\n');
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
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

  // Send OTP after user creation (non-blocking on failure)
  try {
    const code = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    await prisma.otpToken.create({ data: { email, code, expiresAt } });
    await sendOtpEmail(email, code);
  } catch (err) {
    logger.warn({ err }, 'Failed to send OTP on register');
  }

  return sanitizeUser(user);
}

export async function sendOtp(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw Object.assign(new Error('User not found'), { code: 'NOT_FOUND' });
  }
  if (user.isVerified) {
    throw Object.assign(new Error('Email already verified'), { code: 'CONFLICT' });
  }

  // Rate-limit resend: check if a recent OTP was sent
  const recent = await prisma.otpToken.findFirst({
    where: { email, used: false },
    orderBy: { createdAt: 'desc' },
  });
  if (recent && recent.createdAt > new Date(Date.now() - OTP_RESEND_COOLDOWN_MS)) {
    throw Object.assign(new Error('Please wait before requesting a new code'), { code: 'TOO_MANY_REQUESTS' });
  }

  // Invalidate previous OTPs
  await prisma.otpToken.updateMany({ where: { email, used: false }, data: { used: true } });

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  await prisma.otpToken.create({ data: { email, code, expiresAt } });
  await sendOtpEmail(email, code);
}

export async function verifyOtp(email: string, code: string) {
  const otp = await prisma.otpToken.findFirst({
    where: { email, code, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    throw Object.assign(new Error('Kode tidak valid atau sudah kadaluarsa'), { code: 'UNAUTHORIZED' });
  }

  await prisma.otpToken.update({ where: { id: otp.id }, data: { used: true } });

  const user = await prisma.user.update({
    where: { email },
    data: { isVerified: true },
  });

  const tokens = await issueTokens(user.id, user.email, user.role as 'GUEST' | 'USER' | 'ADMIN');
  return { user: sanitizeUser(user), tokens };
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

  if (!user.isVerified) {
    throw Object.assign(
      new Error('Email not verified. Please check your inbox for the verification code.'),
      { code: 'EMAIL_NOT_VERIFIED', email: user.email },
    );
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

function sanitizeUser(user: {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: Date;
}) {
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
