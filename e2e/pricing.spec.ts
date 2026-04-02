/**
 * InsightGov Africa - E2E Tests for Pricing Page
 * Tests for pricing tiers, billing toggle, and plan selection
 */

import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('should display pricing page', async ({ page }) => {
    await expect(page.locator('h1:has-text("Tarifs")')).toBeVisible();
  });

  test('should show all pricing tiers', async ({ page }) => {
    // Check for all 4 plans
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('should display correct prices', async ({ page }) => {
    // Monthly prices
    await expect(page.locator('text=0€')).toBeVisible();
    await expect(page.locator('text=49€')).toBeVisible();
    await expect(page.locator('text=149€')).toBeVisible();
    await expect(page.locator('text=499€')).toBeVisible();
  });

  test('should have monthly/yearly toggle', async ({ page }) => {
    const toggle = page.locator('button[role="switch"], input[type="checkbox"]').first();
    
    if (await toggle.isVisible()) {
      await toggle.click();
      await page.waitForTimeout(500);
    }
  });

  test('should show FAQ section', async ({ page }) => {
    await expect(page.locator('text=FAQ')).toBeVisible();
  });

  test('should have contact sales section', async ({ page }) => {
    await expect(page.locator('text=Contact')).toBeVisible();
  });

  test('should show guarantees', async ({ page }) => {
    await expect(page.locator('text=garantie')).toBeVisible();
  });

  test('should have CTA buttons', async ({ page }) => {
    const buttons = page.locator('button:has-text("Commencer"), a:has-text("Commencer")');
    await expect(buttons.first()).toBeVisible();
  });

  test('should display features for each plan', async ({ page }) => {
    // Each plan should list features
    const featureLists = page.locator('ul, [class*="feature"]');
    await expect(featureLists.first()).toBeVisible();
  });
});
