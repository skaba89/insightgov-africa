/**
 * InsightGov Africa - E2E Tests for Legal Pages
 * Tests for Terms of Service and Privacy Policy pages
 */

import { test, expect } from '@playwright/test';

test.describe('Legal Pages', () => {
  
  test.describe('Terms of Service Page', () => {
    test('should display terms page', async ({ page }) => {
      await page.goto('/terms');
      
      // Check main heading
      await expect(page.locator('h1:has-text("Conditions d\'utilisation")')).toBeVisible();
    });

    test('should contain key sections', async ({ page }) => {
      await page.goto('/terms');
      
      // Check for important sections
      await expect(page.locator('text=Acceptation des Conditions')).toBeVisible();
      await expect(page.locator('text=Description des Services')).toBeVisible();
      await expect(page.locator('text=Paiements et Tarification')).toBeVisible();
      await expect(page.locator('text=Utilisation des Données')).toBeVisible();
      await expect(page.locator('text=Résiliation')).toBeVisible();
    });

    test('should mention African jurisdictions', async ({ page }) => {
      await page.goto('/terms');
      
      // Should reference African legal context
      await expect(page.locator('text=UEMOA')).toBeVisible();
    });

    test('should have last updated date', async ({ page }) => {
      await page.goto('/terms');
      
      await expect(page.locator('text=Dernière mise à jour')).toBeVisible();
    });

    test('should link to privacy policy', async ({ page }) => {
      await page.goto('/terms');
      
      await page.click('a:has-text("Politique de confidentialité")');
      await expect(page).toHaveURL(/\/privacy/);
    });
  });

  test.describe('Privacy Policy Page', () => {
    test('should display privacy page', async ({ page }) => {
      await page.goto('/privacy');
      
      // Check main heading
      await expect(page.locator('h1:has-text("Politique de confidentialité")')).toBeVisible();
    });

    test('should contain key sections', async ({ page }) => {
      await page.goto('/privacy');
      
      // Check for important sections
      await expect(page.locator('text=Collecte des Données')).toBeVisible();
      await expect(page.locator('text=Utilisation des Données')).toBeVisible();
      await expect(page.locator('text=Stockage et Sécurité')).toBeVisible();
      await expect(page.locator('text=Cookies')).toBeVisible();
      await expect(page.locator('text=Vos Droits')).toBeVisible();
    });

    test('should mention GDPR and African data laws', async ({ page }) => {
      await page.goto('/privacy');
      
      // Should reference relevant regulations
      const gdpr = page.locator('text=RGPD');
      const ndpr = page.locator('text=NDPR');
      
      await expect(gdpr.or(ndpr)).toBeVisible();
    });

    test('should have contact information', async ({ page }) => {
      await page.goto('/privacy');
      
      await expect(page.locator('text=Contact')).toBeVisible();
    });

    test('should link to terms of service', async ({ page }) => {
      await page.goto('/privacy');
      
      await page.click('a:has-text("Conditions d\'utilisation")');
      await expect(page).toHaveURL(/\/terms/);
    });
  });

  test.describe('Navigation', () => {
    test('should have navigation back to home', async ({ page }) => {
      await page.goto('/terms');
      
      await page.click('a:has-text("Accueil")');
      await expect(page).toHaveURL('/');
    });
  });
});
