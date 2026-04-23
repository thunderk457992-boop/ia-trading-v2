import { test, expect } from '@playwright/test';

test('user can open login page and submit invalid credentials', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  await expect(page).toHaveURL(/login/);

  await page.getByRole('textbox').first().fill('test@example.com');
  await page.getByRole('textbox').nth(1).fill('MotDePasseTest123!');

  await page.getByRole('button', { name: /se connecter/i }).click();

  await expect(page).toHaveURL(/login/);
});