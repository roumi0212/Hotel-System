// Run this once to reset stale SENT commands back to PENDING
// so the ESP32 can receive them again.
//
// Usage: node reset_commands.mjs

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  // Reset all SENT commands that were never ACKED (stuck from crash loop)
  const result = await prisma.command.updateMany({
    where: { status: 'SENT' },
    data:  { status: 'PENDING', sent_at: null }
  });

  console.log(`Reset ${result.count} stuck SENT commands back to PENDING.`);

  // Also show current command summary
  const summary = await prisma.command.groupBy({
    by: ['status'],
    _count: { id: true }
  });

  console.log('\nCurrent command status summary:');
  summary.forEach(s => console.log(`  ${s.status}: ${s._count.id}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
