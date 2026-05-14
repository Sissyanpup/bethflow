import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminHash = await bcrypt.hash('Admin1234!', 12);
  const admin = await prisma.user.upsert({
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

  // Create demo user
  const userHash = await bcrypt.hash('User1234!', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@bethflow.dev' },
    update: {},
    create: {
      email: 'demo@bethflow.dev',
      username: 'demouser',
      passwordHash: userHash,
      role: Role.USER,
      displayName: 'Demo User',
      bio: 'I am a demo user for Bethflow.',
      isVerified: true,
    },
  });

  // Create a sample board
  const board = await prisma.board.upsert({
    where: { id: 'seed-board-1' },
    update: {},
    create: {
      id: 'seed-board-1',
      title: 'My First Board',
      description: 'Welcome to Bethflow!',
      color: '#5e6ad2',
      ownerId: user.id,
    },
  });

  // Create sample lists
  const todo = await prisma.list.upsert({
    where: { id: 'seed-list-1' },
    update: {},
    create: { id: 'seed-list-1', title: 'To Do', position: 0, boardId: board.id },
  });
  const inProgress = await prisma.list.upsert({
    where: { id: 'seed-list-2' },
    update: {},
    create: { id: 'seed-list-2', title: 'In Progress', position: 1, boardId: board.id },
  });
  await prisma.list.upsert({
    where: { id: 'seed-list-3' },
    update: {},
    create: { id: 'seed-list-3', title: 'Done', position: 2, boardId: board.id },
  });

  // Cards
  await prisma.card.upsert({
    where: { id: 'seed-card-1' },
    update: {},
    create: {
      id: 'seed-card-1',
      title: 'Design the landing page',
      description: 'Create a beautiful guest dashboard.',
      position: 0,
      listId: todo.id,
    },
  });
  await prisma.card.upsert({
    where: { id: 'seed-card-2' },
    update: {},
    create: {
      id: 'seed-card-2',
      title: 'Set up CI/CD pipeline',
      position: 1,
      listId: todo.id,
    },
  });
  await prisma.card.upsert({
    where: { id: 'seed-card-3' },
    update: {},
    create: {
      id: 'seed-card-3',
      title: 'Implement auth module',
      position: 0,
      listId: inProgress.id,
    },
  });

  console.log('Seed complete.');
  console.log(`  Admin: admin@bethflow.dev / Admin1234!`);
  console.log(`  Demo:  demo@bethflow.dev  / User1234!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
