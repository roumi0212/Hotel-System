# MVP Test Plan

Follow this guide to manually verify the MVP core requirements. You should execute these tests across two different browser windows to simulate multiple users (e.g. Chrome for Admin, Firefox for Guest).

## 1. Initialization
Ensure the DB has been seeded with `npx tsx prisma/seed.ts`.
- **Expected:** Rooms 101-110 exist, Admin/Super Admin/Guest roles are created. Room 101 will be CHECKED_IN and occupied.

## 2. Login Credentials
Start the local server (`npm run dev`) and visit `http://localhost:3000/login`.
- **Super Admin:** `superadmin@hotel.local` / `password123`
- **Admin:** `admin@hotel.local` / `password123`
- **Guest 101:** `guest101@hotel.local` / `password123`

## 3. Test: Admin Capabilities
Log in as `admin@hotel.local`.
- Visit Dashboard (`/admin`). **Expected:** Total Rooms (10), Checked In, and other metrics displayed and Audit Logs present.
- Visit Rooms (`/admin/rooms`). **Expected:** Grid of rooms with colors highlighting status. Room 101 shows checked in.
- Click on Room `102` (Vacant). Click "Check In".
- **Expected:** The Room status updates to CHECKED_IN.

## 4. Test: Guest Limitations and Dashboard
In an incognito window, log in as `guest101@hotel.local`.
- Attempt to visit `/admin`. **Expected:** Redirected to login.
- Visit `/guest/101`. **Expected:** Large dynamic tablet-optimized interface loads.
- Turn "Do Not Disturb" on. **Expected:** UI reflects DND in amber and triggers a successful API post.
- **Verify:** Look at the Admin window `/admin/rooms/101`. The DND icon should dynamically appear in the grid.
- Attempt to visit `/guest/102`. **Expected:** An "Unauthorized" or "Controls Disabled" message appears.

## 5. Test: Check-Out Flow & Disabling Access
From the Admin window:
- In Room 101's details page (`/admin/rooms/101`), click **Check Out**.
- **Expected:** State becomes CHECKED_OUT. Guest controls become disabled. Housekeeping flag is turned on. DND is removed.
- **Verify (Guest):** In the Guest window for Room 101, the screen should immediately switch (via polling) to "Controls Unavailable".

## 6. Test: Mock Simulator 
Log in as an Admin and navigate to `/admin/simulator`.
- Look at Room 107.
- Adjust the Temperature to `25°C`. Toggle the "Door" to Open.
- Navigate back to `/admin/rooms`.
- **Expected:** Room 107 now displays a red "Open" state for its door, and Temp reads "25°C".

## 7. Test: Offline Mode
- Assuming Room 105 is `OFFLINE` on seed load.
- In the Simulator (`/admin/simulator`), find Room 105 and click **Send Heartbeat**.
- Go to `/admin/rooms` and view Room 105.
- **Expected:** The Room has dropped its `OFFLINE` tag and returned to `VACANT`.
