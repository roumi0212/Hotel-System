import { test, expect } from '@playwright/test';

test.describe('Hotel System MVP E2E', () => {
    
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status === 'timedOut' || testInfo.status === 'failed') {
      console.log(`Failed inside: ${testInfo.title}`);
      console.log(await page.content());
    }
  });

  test('Admin can login and view rooms', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/admin\/rooms/, { timeout: 15000 });
    
    await expect(page.getByText('Rooms Status', { exact: false })).toBeVisible();
    await expect(page.locator('h2', { hasText: '101' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Guest can login and view assigned room', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/login');
    await page.fill('input[type="email"]', 'guest101@hotel.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/guest\/101/, { timeout: 15000 });
    
    // Check Room 101 is there
    await expect(page.getByText('Room 101', { exact: false })).toBeVisible({ timeout: 10000 });
    
    // Check Master On button
    const masterOn = page.locator('button', { hasText: 'Master On' }).first();
    await expect(masterOn).toBeVisible();
    await masterOn.click();
    
    // Check Do Not Disturb button exists
    const dnd = page.locator('button', { hasText: 'Do Not Disturb' }).first();
    await expect(dnd).toBeVisible();
    await dnd.click();
  });

  test('Guest cannot view unassigned room', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/login');
    await page.fill('input[type="email"]', 'guest101@hotel.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/guest\/101/, { timeout: 15000 });
    await page.goto('/guest/102');
    
    await expect(page.getByText('Unauthorized', { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test('Admin check-in vacant room, check-out checked-in room', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/admin\/rooms/, { timeout: 15000 });
    
    // Room 102 Vacant -> Check IN
    const room102 = page.locator('a[href*="/admin/rooms/"]').filter({ hasText: '102' }).first();
    await room102.click();
    
    await expect(page.getByText('Room 102', { exact: false })).toBeVisible({ timeout: 10000 });
    await page.locator('button', { hasText: 'Check In' }).first().click();
    await expect(page.getByText('Checked In', { exact: false }).first()).toBeVisible({ timeout: 10000 });

    // Go back
    await page.goto('/admin/rooms');
    
    // Room 106 Checked In -> Check Out
    const room106 = page.locator('a[href*="/admin/rooms/"]').filter({ hasText: '106' }).first();
    await room106.click();
    
    await expect(page.getByText('Room 106', { exact: false })).toBeVisible({ timeout: 10000 });
    await page.locator('button', { hasText: 'Check Out' }).first().click();
    await expect(page.getByText('Checked Out', { exact: false }).first()).toBeVisible({ timeout: 10000 });
  });

  test('Admin sees offline room state', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/admin\/rooms/, { timeout: 15000 });
    
    const offlineCard = page.locator('a[href*="/admin/rooms/"]').filter({ hasText: '105' }).first();
    await expect(offlineCard).toBeVisible({ timeout: 10000 });
    await expect(offlineCard.getByText('Offline', { exact: false })).toBeVisible();
  });

  test('Simulator updates room status', async ({ page }) => {
    test.setTimeout(30000);
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@hotel.local');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/admin\/rooms/, { timeout: 15000 });
    await page.goto('/admin/simulator');
    
    const card = page.locator('.bg-slate-900').filter({ hasText: 'RM 107' }).first();
    await expect(card).toBeVisible({ timeout: 10000 });
    
    const toggleDoorBtn = card.locator('button', { hasText: 'Toggle Door' }).first();
    await toggleDoorBtn.click();
    
    await expect(card.getByText('Open', { exact: true }).or(card.getByText('Closed', { exact: true }))).toBeVisible({ timeout: 10000 });
  });

});
