const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  await prisma.room.updateMany({
    data: {
      adapter_mode: 'REAL'
    }
  });
  console.log('All rooms updated to REAL adapter mode');
  await prisma.$disconnect();
}
main();
