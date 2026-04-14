const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const commandId = '59664032-0c5b-4c78-a9fe-60cbfbf10adf';
  
  // Simulate ESP32 HTTP POST for ACK
  const res = await fetch('http://localhost:3000/api/device/command-ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      controllerId: 'ESP_101',
      commandId: commandId,
      status: 'ACKED'
    })
  });
  
  console.log("Ack response status:", res.status);
  
  // Verify DB
  const cmd = await prisma.command.findUnique({
    where: { id: commandId },
    select: { id: true, status: true, acknowledged_at: true }
  });
  
  console.log("Final DB Command Status:", JSON.stringify(cmd, null, 2));

  await prisma.$disconnect();
}
main();
