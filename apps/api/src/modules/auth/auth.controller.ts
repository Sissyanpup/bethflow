import type { Request, Response } from 'express';
import * as authService from './auth.service.js';

const REFRESH_COOKIE = 'refreshToken';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env['NODE_ENV'] === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/auth',
};

export async function register(req: Request, res: Response): Promise<void> {
  const { email, username, password, displayName } = req.body as {
    email: string;
    username: string;
    password: string;
    displayName?: string;
  };

  try {
    const user = await authService.registerUser(email, username, password, displayName);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'CONFLICT') {
      res.status(409).json({ success: false, error: { code: 'CONFLICT', message: e.message } });
      return;
    }
    throw err;
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email: string; password: string };

  try {
    const { user, tokens } = await authService.loginUser(email, password);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.json({ success: true, data: { user, ...tokens.access } });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'UNAUTHORIZED') {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: e.message } });
      return;
    }
    throw err;
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies[REFRESH_COOKIE] as string | undefined;
  if (!rawToken) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'No refresh token' },
    });
    return;
  }

  try {
    const tokens = await authService.refreshTokens(rawToken);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS);
    res.json({ success: true, data: tokens.access });
  } catch (err) {
    const e = err as Error & { code?: string };
    if (e.code === 'UNAUTHORIZED') {
      res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: e.message } });
      return;
    }
    throw err;
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies[REFRESH_COOKIE] as string | undefined;
  if (rawToken) {
    await authService.revokeRefreshToken(rawToken);
  }
  res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' });
  res.json({ success: true, data: null });
}
