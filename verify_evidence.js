const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const room = await prisma.room.findUnique({
    where: { room_number: '101' },
    select: { room_number: true, controller_id: true, adapter_mode: true }
  });
  console.log("Room 101 Data:", JSON.stringify(room, null, 2));

  // Also manually create a command to verify the pending endpoint
  const testCmd = await prisma.command.create({
    data: {
      room_id: room.id || 'd4586d49-7c66-4e70-afec-217265abcaee',
      command_type: 'LIGHT_SET',
      payload_json: { target: 'mainLight', on: true },
      requested_by_user_id: '3253c55d-8779-4804-8e83-299c366aeee6', // admin
      source: 'ADMIN_UI'
    }
  });
  console.log("Created Test Command:", testCmd.id);

  console.log("DB Prep Done.");
  await prisma.$disconnect();
}
main();
