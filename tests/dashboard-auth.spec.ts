import { test, expect } from '@playwright/test';

const email = process.env.E2E_LOGIN_EMAIL;
const password = process.env.E2E_LOGIN_PASSWORD;

test.describe('authenticated dashboard smoke', () => {
  test.skip(!email || !password, 'Set E2E_LOGIN_EMAIL and E2E_LOGIN_PASSWORD to run the authenticated dashboard smoke test.');

  test('connected dashboard displays without crashing', async ({ page }) => {
    await page.goto('http://localhost:3000/login');

    await page.getByLabel('Email').fill(email!);
    await page.getByLabel('Mot de passe').fill(password!);
    await page.getByRole('button', { name: /se connecter/i }).click();

    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByText(/données marché à/i)).toBeVisible();
  });
});
