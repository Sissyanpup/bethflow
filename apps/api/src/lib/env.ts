const REQUIRED_VARS = [
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_PRIVATE_KEY',
  'JWT_PUBLIC_KEY',
  'ALLOWED_ORIGINS',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `[startup] Missing required environment variables: ${missing.join(', ')}\n` +
        'Copy .env.example to .env and fill in all required values.',
    );
  }

  if (process.env['NODE_ENV'] === 'production') {
    const privateKey = process.env['JWT_PRIVATE_KEY'] ?? '';
    const publicKey = process.env['JWT_PUBLIC_KEY'] ?? '';
    if (privateKey.includes('CHANGE_ME') || publicKey.includes('CHANGE_ME')) {
      throw new Error('[startup] JWT keys must be replaced with real RSA keys in production.');
    }
    const origins = process.env['ALLOWED_ORIGINS'] ?? '';
    if (origins.includes('localhost')) {
      throw new Error(
        '[startup] ALLOWED_ORIGINS contains "localhost" in production. Set the real domain.',
      );
    }
    if (!process.env['SMTP_HOST']) {
      // Non-fatal: OTP emails will fall back to Ethereal dev preview, which is not useful in prod.
      console.warn(
        '[startup] WARNING: SMTP_HOST not set — OTP verification emails will not be delivered.',
      );
    }
  }
}
