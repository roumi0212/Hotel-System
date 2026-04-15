/**
 * seed_controller.mjs
 * 
 * Idempotent provisioning script for ESP32 Room Controllers.
 * Safe to run multiple times — skips if controller already exists.
 * 
 * Usage:
 *   node seed_controller.mjs
 * 
 * To add a new room (e.g. Room 102 / ESP_102):
 *   1. Duplicate the provisionController() call at the bottom of this file
 *   2. Set roomNumber = "102", controllerId = "ESP_102", friendlyName = "..."
 *   3. Run: node seed_controller.mjs
 *   No code changes to the app are needed.
 */

import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function provisionController({ roomNumber, controllerId, friendlyName, notes, firmwareVersion = '1.0.0' }) {
  console.log(`\n--- Provisioning Room ${roomNumber} / ${controllerId} ---`);

  // 1. Find the room
  const room = await prisma.room.findUnique({
    where: { room_number: roomNumber },
    include: { room_controller: true }
  });

  if (!room) {
    console.log(`  ❌ Room ${roomNumber} not found in database. Create the room first.`);
    return null;
  }

  // 2. Check if a RoomController already exists for this controller_id
  const existing = await prisma.roomController.findUnique({
    where: { controller_id: controllerId }
  });

  if (existing) {
    console.log(`  ✅ RoomController ${controllerId} already exists — skipping creation.`);
    console.log(`     Room: ${room.room_number} | mode: ${existing.adapter_mode}`);
    return existing;
  }

  // 3. Ensure this room doesn't already have a DIFFERENT controller bound
  if (room.room_controller) {
    console.log(`  ⚠️  Room ${roomNumber} already has controller: ${room.room_controller.controller_id}`);
    console.log(`     Run manually if you want to reassign.`);
    return room.room_controller;
  }

  // 4. Create the RoomController and update the Room simultaneously
  const [controller] = await prisma.$transaction([
    prisma.roomController.create({
      data: {
        controller_id: controllerId,
        room_id: room.id,
        friendly_name: friendlyName,
        adapter_mode: 'REAL',
        firmware_version: firmwareVersion,
        notes: notes,
      }
    }),
    // Keep Room.controller_id and adapter_mode in sync (used by existing queries)
    prisma.room.update({
      where: { id: room.id },
      data: {
        controller_id: controllerId,
        adapter_mode: 'REAL',
      }
    })
  ]);

  console.log(`  ✅ Created RoomController:`);
  console.log(`     controller_id: ${controller.controller_id}`);
  console.log(`     room_id:       ${controller.room_id}`);
  console.log(`     adapter_mode:  ${controller.adapter_mode}`);
  console.log(`     friendly_name: ${controller.friendly_name}`);

  return controller;
}

async function verifyRoom101() {
  console.log('\n--- Verification: Room 101 ---');

  const room = await prisma.room.findUnique({
    where: { room_number: '101' },
    include: { room_controller: true }
  });

  if (!room) {
    console.log('  ❌ Room 101 not found!');
    return;
  }

  const rc = room.room_controller;

  const checks = [
    ['Room 101 exists',              !!room],
    ['adapter_mode = REAL on Room',  room.adapter_mode === 'REAL'],
    ['controller_id on Room',        room.controller_id === 'ESP_101'],
    ['RoomController exists',        !!rc],
    ['controller_id = ESP_101',      rc?.controller_id === 'ESP_101'],
    ['Room mapping correct',         rc?.room_id === room.id],
    ['adapter_mode = REAL on ctrl',  rc?.adapter_mode === 'REAL'],
  ];

  for (const [label, pass] of checks) {
    console.log(`  ${pass ? '✅' : '❌'} ${label}`);
  }
}

async function main() {
  try {
    // ---------------------------------------------------------------------------
    // Provision Room 101 — the pilot real hardware room
    // ---------------------------------------------------------------------------
    await provisionController({
      roomNumber:      '101',
      controllerId:    'ESP_101',
      friendlyName:    'Floor 1 - Room 101 (Pilot)',
      notes:           'ESP32-WROVER DevKit. DHT11 on pin 4. Relay on pin 23 (active LOW). DND LED pin 32. HK LED pin 33.',
      firmwareVersion: '1.0.0',
    });

    // ---------------------------------------------------------------------------
    // Provision Room 102
    // ---------------------------------------------------------------------------
    await provisionController({
      roomNumber:      '102',
      controllerId:    'ESP_102',
      friendlyName:    'Floor 1 - Room 102',
      notes:           'ESP32-WROVER DevKit.',
      firmwareVersion: '1.0.0',
    });

    // Run verification
    await verifyRoom101();

  } finally {
    await prisma.$disconnect();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
