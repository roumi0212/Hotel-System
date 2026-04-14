async function main() {
  const credentials = {
    email: 'admin@hotel.local',
    password: 'password123',
    redirect: 'false',
    csrfToken: '' // Doesn't matter for credentials usually
  };

  const loginRes = await fetch('http://localhost:3000/api/auth/callback/credentials', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(credentials).toString()
  });

  const cookies = loginRes.headers.get('set-cookie');
  console.log("Login Status:", loginRes.status);
  
  if (!cookies) return console.log("No cookies! Cannot test.");
  
  // Extract NextAuth session cookie
  const sessionCookie = cookies.split(',').find(c => c.includes('next-auth.session-token'));

  const reqHeaders = {
    'Content-Type': 'application/json',
  };
  if (sessionCookie) reqHeaders['Cookie'] = sessionCookie;

  console.log("Using headers:", reqHeaders);

  const res = await fetch('http://localhost:3000/api/rooms/d4586d49-7c66-4e70-afec-217265abcaee/lights/main', {
    method: 'POST',
    headers: reqHeaders,
    body: JSON.stringify({ on: true })
  });

  console.log("Lights Status:", res.status);
  console.log("Lights Body:", await res.text());
}
main();
