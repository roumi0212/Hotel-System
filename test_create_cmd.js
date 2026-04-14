const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    const room = await prisma.room.findFirst({ where: { room_number: '101' } });

    console.log("Admin:", admin?.id, "Room:", room?.id);

    const command = await prisma.command.create({
      data: {
        room_id: room.id,
        command_type: 'LIGHT_SET',
        payload_json: { target: 'mainLight', on: true },
        requested_by_user_id: admin.id,
        source: 'ADMIN_UI',
      }
    });
    console.log("Command created:", command.id);

    await prisma.auditLog.create({
      data: {
        action_type: 'LIGHT_COMMAND',
        success: true,
        actor_user_id: admin.id,
        actor_role: admin.role,
        room_id: room.id,
        action_details: { target: 'mainLight', on: true }
      }
    });
    console.log("Audit log created");
  } catch (error) {
    console.error("Internal error exception:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
