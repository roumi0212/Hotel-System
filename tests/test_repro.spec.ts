import { test, expect } from '@playwright/test';

test('hit check-in and lights', async ({ request }) => {
  // Try to login as admin
  const loginRes = await request.post('http://localhost:3000/api/auth/callback/credentials', {
    form: {
      email: 'admin@hotel.local',
      password: 'password123',
      redirect: 'false',
      csrfToken: ''
    }
  });
  console.log('Login:', loginRes.status());
  
  // Hit lights endpoint for room 101, request context automatically keeps cookies.
  const roomsRes = await request.post('http://localhost:3000/api/rooms/d4586d49-7c66-4e70-afec-217265abcaee/lights/main', {
    headers: {
      'Content-Type': 'application/json'
    },
    data: { on: true }
  });
  
  console.log('Lights Status:', roomsRes.status());
  console.log('Lights Body:', await roomsRes.text());
});
