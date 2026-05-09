import { test, expect } from '@playwright/test';
import {
  authenticatePage,
  cleanupTempUser,
  createAdminClient,
  createTempUser,
  hasSupabaseAdminEnv,
} from "./helpers/test-supabase"

test('home page loads and main CTA is visible', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page).toHaveURL(/localhost:3000/);
  await expect(page.getByRole('navigation').getByRole('link', { name: /tester gratuitement/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /choisir pro/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /choisir premium/i })).toBeVisible();
});

test('dashboard redirects to login when user is not authenticated', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');
  await expect(page).toHaveURL(/login/);
  const redirected = new URL(page.url());
  expect(redirected.searchParams.get('reason')).toBe('auth_required');
  expect(redirected.searchParams.get('next')).toBe('/dashboard');
});

test('pricing redirects to login when user is not authenticated', async ({ page }) => {
  await page.goto('http://localhost:3000/pricing');
  await expect(page).toHaveURL(/login/);
  const redirected = new URL(page.url());
  expect(redirected.searchParams.get('reason')).toBe('auth_required');
  expect(redirected.searchParams.get('next')).toBe('/pricing');
});

test('advisor redirects to login when user is not authenticated', async ({ page }) => {
  await page.goto('http://localhost:3000/advisor');
  await expect(page).toHaveURL(/login/);
  const redirected = new URL(page.url());
  expect(redirected.searchParams.get('reason')).toBe('auth_required');
  expect(redirected.searchParams.get('next')).toBe('/advisor');
});

test('chat redirects to login when user is not authenticated', async ({ page }) => {
  await page.goto('http://localhost:3000/chat');
  await expect(page).toHaveURL(/login/);
  const redirected = new URL(page.url());
  expect(redirected.searchParams.get('reason')).toBe('auth_required');
  expect(redirected.searchParams.get('next')).toBe('/chat');
});

test('settings redirects to login when user is not authenticated', async ({ page }) => {
  await page.goto('http://localhost:3000/settings');
  await expect(page).toHaveURL(/login/);
  const redirected = new URL(page.url());
  expect(redirected.searchParams.get('reason')).toBe('auth_required');
  expect(redirected.searchParams.get('next')).toBe('/settings');
});

test('guide redirects to login when user is not authenticated', async ({ page }) => {
  await page.goto('http://localhost:3000/guide');
  await expect(page).toHaveURL(/login/);
  const redirected = new URL(page.url());
  expect(redirected.searchParams.get('reason')).toBe('auth_required');
  expect(redirected.searchParams.get('next')).toBe('/guide');
});

test.describe('homepage adapts to authenticated users', () => {
  test.skip(!hasSupabaseAdminEnv(), 'requires Supabase admin env');

  test('authenticated users see dashboard and analysis CTAs instead of auth/signup prompts', async ({ page }) => {
    const admin = createAdminClient()
    const user = await createTempUser(admin, "home-auth")

    try {
      await authenticatePage(page, user)
      await page.goto('http://localhost:3000/')

      await expect(page.getByTestId('home-nav-primary')).toHaveText(/dashboard/i)
      await expect(page.getByTestId('home-nav-secondary')).toHaveText(/ouvrir mon dashboard/i)
      await expect(page.getByTestId('home-hero-primary')).toHaveText(/ouvrir mon dashboard/i)
      await expect(page.getByTestId('home-hero-secondary')).toHaveText(/nouvelle analyse/i)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})
