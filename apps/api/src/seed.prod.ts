import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env['ADMIN_PASSWORD'] ?? 'Admin1234!';
  const adminHash = await bcrypt.hash(adminPassword, 12);

  await prisma.user.upsert({
    where: { email: 'admin@bethflow.dev' },
    update: {},
    create: {
      email: 'admin@bethflow.dev',
      username: 'admin',
      passwordHash: adminHash,
      role: Role.ADMIN,
      displayName: 'Admin',
      isVerified: true,
    },
  });

  console.log('[seed.prod] Admin account ready: admin@bethflow.dev');
}

main().catch(console.error).finally(() => prisma.$disconnect());
