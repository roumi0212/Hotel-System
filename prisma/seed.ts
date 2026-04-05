import { PrismaClient, Role, RoomState, DeviceType, AdapterMode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create Users
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@hotel.local' },
    update: {},
    create: {
      email: 'superadmin@hotel.local',
      password_hash: 'password123', // In real app, hash this!
      full_name: 'Super Admin',
      role: Role.SUPER_ADMIN,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@hotel.local' },
    update: {},
    create: {
      email: 'admin@hotel.local',
      password_hash: 'password123',
      full_name: 'Hotel Admin',
      role: Role.ADMIN,
    },
  });

  const guest101 = await prisma.user.upsert({
    where: { email: 'guest101@hotel.local' },
    update: {},
    create: {
      email: 'guest101@hotel.local',
      password_hash: 'password123',
      full_name: 'Guest 101',
      role: Role.GUEST,
    },
  });

  // Create Rooms
  const roomsToCreate = [
    { number: '101', state: RoomState.CHECKED_IN, do_not_disturb: true },
    { number: '102', state: RoomState.VACANT, do_not_disturb: false },
    { number: '103', state: RoomState.CHECKED_OUT, housekeeping_requested: true },
    { number: '104', state: RoomState.MAINTENANCE },
    { number: '105', state: RoomState.OFFLINE },
    { number: '106', state: RoomState.CHECKED_IN },
    { number: '107', state: RoomState.VACANT },
    { number: '108', state: RoomState.VACANT },
    { number: '109', state: RoomState.CHECKED_IN },
    { number: '110', state: RoomState.VACANT },
  ];

  for (const r of roomsToCreate) {
    const room = await prisma.room.upsert({
      where: { room_number: r.number },
      update: {
        state: r.state,
        do_not_disturb: r.do_not_disturb || false,
        housekeeping_requested: r.housekeeping_requested || false,
        guest_controls_enabled: r.state === RoomState.CHECKED_IN,
        occupied_now: r.state === RoomState.CHECKED_IN,
        current_temperature: 22.5,
      },
      create: {
        room_number: r.number,
        floor: '1',
        state: r.state,
        do_not_disturb: r.do_not_disturb || false,
        housekeeping_requested: r.housekeeping_requested || false,
        guest_controls_enabled: r.state === RoomState.CHECKED_IN,
        occupied_now: r.state === RoomState.CHECKED_IN,
        current_temperature: 22.5,
        adapter_mode: AdapterMode.MOCK,
        controller_id: `mock-controller-${r.number}`
      },
    });

    // Assign guest if 101
    if (r.number === '101') {
      await prisma.roomAssignment.create({
        data: {
          room_id: room.id,
          guest_user_id: guest101.id,
          is_active: true,
          check_in_at: new Date(),
        }
      });
    }

    // Devices for room
    const devices = [
      { key: 'mainLight', type: DeviceType.LIGHT, name: 'Main Light' },
      { key: 'bedsideLeft', type: DeviceType.LIGHT, name: 'Bedside Left' },
      { key: 'bedsideRight', type: DeviceType.LIGHT, name: 'Bedside Right' },
      { key: 'hvac', type: DeviceType.HVAC, name: 'HVAC' },
    ];

    for (const d of devices) {
      await prisma.device.create({
        data: {
          room_id: room.id,
          device_key: d.key,
          device_type: d.type,
          display_name: d.name,
        }
      });
    }
  }

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
