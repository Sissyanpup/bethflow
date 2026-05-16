import nodemailer from 'nodemailer';
import { logger } from './logger.js';

async function createTransport(): Promise<nodemailer.Transporter> {
  if (process.env['SMTP_HOST']) {
    return nodemailer.createTransport({
      host: process.env['SMTP_HOST'],
      port: parseInt(process.env['SMTP_PORT'] ?? '587', 10),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASS'],
      },
    });
  }

  // Dev: Ethereal fake SMTP
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: testAccount.user, pass: testAccount.pass },
  });
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const transport = await createTransport();
  const from = process.env['SMTP_FROM'] ?? '"Bethflow" <noreply@bethflow.dev>';

  const info = await transport.sendMail({
    from,
    to,
    subject: 'Bethflow — Kode verifikasi email Anda',
    text: `Kode verifikasi Anda: ${code}\n\nKode berlaku selama 10 menit. Jangan bagikan kepada siapapun.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px;color:#1a1a2e">Verifikasi Email</h2>
        <p style="color:#6b7280;margin:0 0 24px">Masukkan kode berikut untuk menyelesaikan registrasi Anda:</p>
        <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
          <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#7c3aed">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:0">Kode berlaku selama <strong>10 menit</strong>. Jangan bagikan kode ini kepada siapapun.</p>
      </div>
    `,
  });

  if (!process.env['SMTP_HOST']) {
    logger.info(`[OTP DEV] Email: ${to} | Code: ${code} | Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transport = await createTransport();
  const from = process.env['SMTP_FROM'] ?? '"Bethflow" <noreply@bethflow.dev>';

  const info = await transport.sendMail({
    from,
    to,
    subject: 'Bethflow — Reset password Anda',
    text: `Klik tautan berikut untuk mereset password Anda:\n\n${resetUrl}\n\nTautan berlaku selama 1 jam. Abaikan email ini jika Anda tidak meminta reset password.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px;color:#1a1a2e">Reset Password</h2>
        <p style="color:#6b7280;margin:0 0 24px">Kami menerima permintaan untuk mereset password akun Bethflow Anda. Klik tombol di bawah untuk melanjutkan:</p>
        <div style="text-align:center;margin-bottom:24px">
          <a href="${resetUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#5e6ad2);color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.01em">
            Reset Password
          </a>
        </div>
        <p style="color:#9ca3af;font-size:13px;margin:0 0 8px">Atau salin tautan berikut ke browser Anda:</p>
        <p style="color:#7c3aed;font-size:12px;word-break:break-all;margin:0 0 20px">${resetUrl}</p>
        <p style="color:#9ca3af;font-size:13px;margin:0">Tautan berlaku selama <strong>1 jam</strong>. Jika Anda tidak meminta reset password, abaikan email ini — akun Anda tetap aman.</p>
      </div>
    `,
  });

  if (!process.env['SMTP_HOST']) {
    logger.info(`[RESET DEV] Email: ${to} | Preview: ${nodemailer.getTestMessageUrl(info)}`);
  }
}
