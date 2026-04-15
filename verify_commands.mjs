import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const commands = await prisma.command.findMany({
    orderBy: { created_at: 'desc' },
    take: 5
  });

  console.log('Recent 5 Commands:');
  for (const cmd of commands) {
    console.log(`- Type: ${cmd.command_type}`);
    console.log(`  Payload (type: ${typeof cmd.payload_json}):`, JSON.stringify(cmd.payload_json));
  }

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
