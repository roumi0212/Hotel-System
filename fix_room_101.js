const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const room = await prisma.room.update({
    where: { room_number: '101' },
    data: {
      adapter_mode: 'REAL',
      controller_id: 'ESP_101'
    }
  });
  console.log(room);
  await prisma.$disconnect();
}
main();
