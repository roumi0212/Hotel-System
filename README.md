# Hotel Guestroom Control System MVP

A fully testable MVP hotel guestroom control system for a pilot deployment, focusing on administration, guest interfaces, and simulated IoT device integration.

## Architecture Summary
- **Frontend & Backend**: built natively on Next.js 14 (App Router) using React, TailwindCSS, and NextAuth.js.
- **Database**: PostgreSQL (via Docker Compose) paired with Prisma ORM for type-safe database schemas and queries.
- **Realtime Updates**: The Next.js UI automatically polls state using `AutoRefresh` intervals (2-3 seconds) allowing seamless multi-user visibility.
- **Device Simulation**: IoT device states are managed virtually via a "Mock Device Simulator" which provides toggles for hardware states like Occupancy, Temperature, Doors, and Heartbeats without needing real hardware yet.

## Setup Instructions

### 1. Requirements
- Node.js 18+
- Docker Desktop 

### 2. Getting Started
Clone the repository, then configure the environment variables:
```bash
cd hotel-system
# Copy .env.example if needed, or rely on .env directly
npm install
```

### 3. Database setup
Ensure Docker Desktop is running, then boot the PostgreSQL container:
```bash
docker-compose up -d
```
Generate the Prisma client, push the schema, and seed the demo data (this includes 10 fully configured dummy rooms):
```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts
```

### 4. Running the app
```bash
npm run dev
```
Open `http://localhost:3000` in your browser. It will redirect to `/login`.

## Environment Variables
The application uses the following in `.env`:
- `DATABASE_URL` (Required for Prisma)
- `NEXTAUTH_SECRET` (Required for sessions, must match in production)
- `NEXTAUTH_URL` (Required for NextAuth redirect generation, use `http://localhost:3000` locally and your actual domain in Railway for production)

## Railway Deployment
This project is fully configured for zero-downtime deployment on Railway:
1. Push the repository to GitHub.
2. In Railway, click **New Project** -> **Deploy from GitHub repo**.
3. Railway will automatically detect the `railway.json` configuration config which handles building Next.js and Prisma.
4. Go to the Railway project variables and add:
   - `DATABASE_URL` (Map it to your Neon PostgreSQL or Railway PostgreSQL instance)
   - `NEXTAUTH_SECRET` (Generated secret key)
   - `NEXTAUTH_URL` (The Railway public domain, ex: `https://your-hotel-app.up.railway.app`)
5. Railway handles the `npx prisma generate` command automatically on build pipeline.

## Hardware Integration Guide
Currently, room controllers are simulated by `AdapterMode.MOCK`. To plug in real hardware (like ESP32 via MQTT or HTTP):
1. Register new hardware with `AdapterMode.REAL`.
2. Connect hardware signals (Webhooks, MQTT broker triggers) to target the API routes listed under `/api/device/*`.
3. Commands dispatched via the Guest UI or Admin UI create `Command` database rows in `PENDING` state. Hardware can poll `/api/device/commands/[controllerId]/pending` for these commands, perform instructions locally, and acknowledge them using `/api/device/command-ack`.

**IoT Realtime Integrations APIs:**
- `POST /api/device/heartbeat` (Registers device online)
- `POST /api/device/state-sync` (Full batch sync of state)
- `POST /api/device/sensor` (Batch granular sensor reporting)
