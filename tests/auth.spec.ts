import { test, expect } from '@playwright/test';

test('login page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/login');
  await expect(page).toHaveURL(/login/);
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();
  await expect(page.getByRole('button', { name: /se connecter/i })).toBeVisible();
});

test('register page exposes accessible form labels', async ({ page }) => {
  await page.goto('http://localhost:3000/register');
  await expect(page).toHaveURL(/register/);
  await expect(page.getByLabel('Nom complet')).toBeVisible();
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();
});
