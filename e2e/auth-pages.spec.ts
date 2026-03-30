/**
 * InsightGov Africa - E2E Tests for Auth Pages
 * Tests for forgot password, verify email, and authentication flows
 */

import { test, expect } from '@playwright/test';

test.describe('Authentication Pages', () => {
  
  test.describe('Forgot Password Page', () => {
    test('should display forgot password form', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      // Check page elements
      await expect(page.locator('h2:has-text("Mot de passe oublié")')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('button:has-text("Envoyer")')).toBeVisible();
    });

    test('should show error for empty email', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      await page.click('button:has-text("Envoyer")');
      
      // Form validation should trigger
      await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
    });

    test('should submit valid email', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button:has-text("Envoyer")');
      
      // Should show success message or redirect
      await page.waitForTimeout(2000);
    });

    test('should have link back to login', async ({ page }) => {
      await page.goto('/auth/forgot-password');
      
      await page.click('a:has-text("Retour à la connexion")');
      
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('Verify Email Page', () => {
    test('should display verification page', async ({ page }) => {
      await page.goto('/auth/verify-email');
      
      // Should show resend form when no token
      await expect(page.locator('text=Renvoyer')).toBeVisible();
    });

    test('should show error for invalid token', async ({ page }) => {
      await page.goto('/auth/verify-email?error=invalid_token');
      
      await expect(page.locator('text=invalide')).toBeVisible();
    });

    test('should allow resending verification email', async ({ page }) => {
      await page.goto('/auth/verify-email');
      
      await page.fill('input[type="email"]', 'test@example.com');
      await page.click('button:has-text("Renvoyer")');
      
      await page.waitForTimeout(2000);
    });
  });

  test.describe('Login Page Integration', () => {
    test('should have forgot password link', async ({ page }) => {
      await page.goto('/login');
      
      await page.click('a:has-text("Mot de passe oublié")');
      
      await expect(page).toHaveURL(/\/auth\/forgot-password/);
    });
  });

  test.describe('Signup Page Integration', () => {
    test('should have terms and privacy links', async ({ page }) => {
      await page.goto('/signup');
      
      const termsLink = page.locator('a:has-text("conditions d\'utilisation")');
      const privacyLink = page.locator('a:has-text("politique de confidentialité")');
      
      await expect(termsLink).toBeVisible();
      await expect(privacyLink).toBeVisible();
      
      // Test terms link
      await termsLink.click();
      await expect(page).toHaveURL(/\/terms/);
      
      // Go back and test privacy link
      await page.goto('/signup');
      await privacyLink.click();
      await expect(page).toHaveURL(/\/privacy/);
    });
  });
});
