const { test, expect } = require('@playwright/test');

test('hit API as admin', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'admin@hotel.local');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("Sign In")');

  // Wait for redirect to dashboard
  await page.waitForURL('**/admin/rooms/**');
  
  // Now hit the Lights endpoint using the authenticated context
  const res = await page.request.post('http://localhost:3000/api/rooms/d4586d49-7c66-4e70-afec-217265abcaee/lights/main', {
    data: { on: true }
  });
  
  console.log("Status:", res.status());
  console.log("Body:", await res.text());
});
