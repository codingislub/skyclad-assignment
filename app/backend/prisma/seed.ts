import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@caseflow.com' },
    update: {},
    create: {
      email: 'admin@caseflow.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
    },
  });

  // Create operator user
  const operatorPassword = await bcrypt.hash('operator123', 10);
  const operator = await prisma.user.upsert({
    where: { email: 'operator@caseflow.com' },
    update: {},
    create: {
      email: 'operator@caseflow.com',
      password: operatorPassword,
      role: UserRole.OPERATOR,
      firstName: 'Operator',
      lastName: 'User',
    },
  });

  console.log({ admin, operator });
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
