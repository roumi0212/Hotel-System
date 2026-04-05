import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const room = await prisma.room.findFirst({ where: { room_number: '101' } });
  if (!room) {
    console.log('Room 101 not found.');
    process.exit(1);
  }

  await prisma.command.create({
    data: {
      room_id: room.id,
      command_type: 'LIGHT_SET',
      payload_json: { target: 'mainLight', on: true },
      source: 'ADMIN_UI',
    }
  });

  console.log('Successfully injected LIGHT_SET command for Room 101 directly into the database!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
