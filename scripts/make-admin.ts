
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.log('Please provide email as argument');
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: { email }
  });

  if (!user) {
    console.log(`User with email ${email} not found`);
    process.exit(1);
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: 'ADMIN' }
  });

  console.log(`User ${user.username} (${email}) is now ADMIN`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
