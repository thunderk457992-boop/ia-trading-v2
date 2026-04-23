import { test, expect } from '@playwright/test';

// Verifies the ?success=true redirect flow without a real authenticated session
test('dashboard ?success=true redirects unauthenticated user to login', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard?success=true&plan=pro');
  // Should redirect to login (not authenticated)
  await expect(page).toHaveURL(/login/);
});

test('dashboard ?upgraded=true shows correctly without auth (redirects to login)', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard?upgraded=true&plan=pro');
  await expect(page).toHaveURL(/login/);
});

test('stripe sync endpoint rejects unauthenticated requests', async ({ page }) => {
  const res = await page.request.post('http://localhost:3000/api/stripe/sync');
  expect(res.status()).toBe(401);
  const body = await res.json();
  expect(body.error).toMatch(/authentifi/i);
});

test('stripe checkout endpoint rejects unauthenticated requests', async ({ page }) => {
  const res = await page.request.post('http://localhost:3000/api/stripe/checkout', {
    data: { priceId: 'price_test', plan: 'pro' },
  });
  expect(res.status()).toBe(401);
});

test('stripe plans endpoint returns plan config', async ({ page }) => {
  const res = await page.request.get('http://localhost:3000/api/stripe/plans');
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('pro');
  expect(body).toHaveProperty('premium');
});
