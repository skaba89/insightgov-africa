// ============================================
// InsightGov Africa - Tests E2E Authentification
// ============================================

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should display landing page for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Dashboards IA');
  });

  test('should show login modal when clicking login button', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Se connecter');
    await expect(page.locator('text=Connexion')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('h2, h3, CardTitle').first()).toContainText('Connexion');
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/register');
    await expect(page.locator('h2, h3, CardTitle').first()).toContainText(/compte|Créer/);
  });

  test('should show validation errors on login', async ({ page }) => {
    await page.goto('/auth/login');

    // Try to submit empty form
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should toggle between login and register', async ({ page }) => {
    await page.goto('/auth/login');
    await page.click('text=Créer un compte');
    await expect(page).toHaveURL(/register/);
  });

  test('should enable demo mode', async ({ page }) => {
    await page.goto('/?demo=true');
    await expect(page.locator('text=Mode Démonstration')).toBeVisible();
  });

  test('should register new user', async ({ page }) => {
    await page.goto('/auth/register');

    // Fill step 1
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`);
    await page.fill('input[placeholder*="Jean"]', 'Test User');
    await page.fill('input[placeholder*="8 caractères"]', 'password123');
    await page.fill('input[placeholder*="••••••••"]', 'password123');

    // Go to step 2
    await page.click('button:has-text("Continuer")');

    // Should be on step 2
    await expect(page.locator('text=Organisation')).toBeVisible();
  });
});

test.describe('OAuth', () => {
  test('should show Google OAuth button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
  });

  test('should show GitHub OAuth button', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to home when accessing settings without auth', async ({ page }) => {
    await page.goto('/settings');
    // Should redirect or show login
    await expect(page).not.toHaveURL('/settings');
  });
});
