import { describe, it, expect } from 'vitest';
import {
  CreateSocialLinkSchema,
  UpdateUserSchema,
  CreateCardSchema,
  CreateCatalogSchema,
  RegisterSchema,
  VerifyOtpSchema,
} from '@bethflow/shared';

describe('URL scheme validation — javascript:/data:/ftp: must be blocked', () => {
  const BAD_SCHEMES = [
    'javascript:alert(document.cookie)',
    'data:text/html,<script>alert(1)</script>',
    'ftp://files.example.com/file',
    'file:///etc/passwd',
    'vbscript:msgbox(1)',
  ];
  const GOOD_URLS = ['https://example.com/path', 'http://example.com'];

  describe('Social link url', () => {
    const base = { platform: 'github' as const, label: 'Test' };
    it.each(BAD_SCHEMES)('rejects %s', (url) => {
      expect(CreateSocialLinkSchema.safeParse({ ...base, url }).success).toBe(false);
    });
    it.each(GOOD_URLS)('accepts %s', (url) => {
      expect(CreateSocialLinkSchema.safeParse({ ...base, url }).success).toBe(true);
    });
  });

  describe('User avatarUrl', () => {
    it.each(BAD_SCHEMES)('rejects %s', (url) => {
      expect(UpdateUserSchema.safeParse({ avatarUrl: url }).success).toBe(false);
    });
    it('accepts https:// avatar', () => {
      expect(UpdateUserSchema.safeParse({ avatarUrl: 'https://cdn.example.com/img.png' }).success).toBe(true);
    });
    it('accepts omitted avatarUrl (optional)', () => {
      expect(UpdateUserSchema.safeParse({ displayName: 'Alice' }).success).toBe(true);
    });
  });

  describe('Card mediaUrl', () => {
    it.each(BAD_SCHEMES)('rejects %s', (url) => {
      expect(CreateCardSchema.safeParse({ title: 'T', mediaUrl: url }).success).toBe(false);
    });
    it('accepts valid media url', () => {
      expect(CreateCardSchema.safeParse({ title: 'T', mediaUrl: 'https://cdn.example.com/video.mp4' }).success).toBe(true);
    });
  });

  describe('Catalog mediaUrl', () => {
    it.each(BAD_SCHEMES)('rejects %s', (url) => {
      expect(CreateCatalogSchema.safeParse({ title: 'T', mediaUrl: url }).success).toBe(false);
    });
    it('accepts valid media url', () => {
      expect(CreateCatalogSchema.safeParse({ title: 'T', mediaUrl: 'https://cdn.example.com/img.jpg' }).success).toBe(true);
    });
  });
});

describe('Auth validators', () => {
  describe('RegisterSchema', () => {
    it('rejects XSS in username', () => {
      expect(RegisterSchema.safeParse({ email: 'a@b.com', username: '<script>alert(1)</script>', password: 'Test1234!' }).success).toBe(false);
    });
    it('rejects short password', () => {
      expect(RegisterSchema.safeParse({ email: 'a@b.com', username: 'valid', password: 'short' }).success).toBe(false);
    });
    it('rejects password without uppercase', () => {
      expect(RegisterSchema.safeParse({ email: 'a@b.com', username: 'valid', password: 'alllower1!' }).success).toBe(false);
    });
    it('accepts valid registration', () => {
      expect(RegisterSchema.safeParse({ email: 'user@example.com', username: 'valid_user', password: 'Test1234!' }).success).toBe(true);
    });
  });

  describe('VerifyOtpSchema', () => {
    it('rejects non-6-digit code', () => {
      expect(VerifyOtpSchema.safeParse({ email: 'a@b.com', code: '12345' }).success).toBe(false);
    });
    it('rejects alphabetic code', () => {
      expect(VerifyOtpSchema.safeParse({ email: 'a@b.com', code: 'abcdef' }).success).toBe(false);
    });
    it('accepts 6-digit numeric code', () => {
      expect(VerifyOtpSchema.safeParse({ email: 'a@b.com', code: '123456' }).success).toBe(true);
    });
  });
});
