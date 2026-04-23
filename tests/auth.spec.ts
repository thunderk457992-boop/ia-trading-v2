import { test, expect } from '@playwright/test';

test('login page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page).toHaveURL(/login/);
  await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
});