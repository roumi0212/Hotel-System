const { POST } = require('./src/app/api/rooms/[roomId]/lights/main/route');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// mock getServerSession
jest.mock('next-auth', () => ({
  getServerSession: () => Promise.resolve({
    user: { id: '3253c55d-8779-4804-8e83-299c366aeee6', role: 'ADMIN' }
  })
}));

// Too complex because of next/server NextRequest etc.
