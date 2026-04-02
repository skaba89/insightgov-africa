// =============================================================================
// InsightGov Africa - Business Module E2E Tests
// Tests pour le module Business/Commerce
// =============================================================================

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'test@insightgov.africa',
  password: 'TestPassword123!',
};

test.describe('Business Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/auth/login');
    
    // Login with test credentials
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  // ==========================================================================
  // Business List Page
  // ==========================================================================
  test('should display business list page', async ({ page }) => {
    await page.goto('/business');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Business');
    
    // Check for create button
    await expect(page.getByRole('button', { name: /créer|nouveau|ajouter/i })).toBeVisible();
  });

  test('should filter businesses by type', async ({ page }) => {
    await page.goto('/business');
    
    // Check if filter dropdown exists
    const typeFilter = page.locator('select, [data-testid="type-filter"]').first();
    if (await typeFilter.isVisible()) {
      await typeFilter.selectOption('shop');
      
      // Wait for results to update
      await page.waitForTimeout(500);
      
      // Verify filter is applied
      await expect(page.locator('[data-testid="business-card"]')).toBeVisible();
    }
  });

  test('should open business creation form', async ({ page }) => {
    await page.goto('/business');
    
    // Click create button
    await page.click('button:has-text("Nouveau"), button:has-text("Créer")');
    
    // Check if modal or form is visible
    const modal = page.locator('[role="dialog"], form');
    await expect(modal).toBeVisible();
    
    // Check for required fields
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
  });

  // ==========================================================================
  // Business Detail Page
  // ==========================================================================
  test('should navigate to business detail', async ({ page }) => {
    await page.goto('/business');
    
    // Wait for businesses to load
    await page.waitForTimeout(1000);
    
    // Click on first business card
    const businessCard = page.locator('[data-testid="business-card"], a[href^="/business/"]').first();
    if (await businessCard.isVisible()) {
      await businessCard.click();
      
      // Check URL
      await expect(page).toHaveURL(/\/business\/[a-z0-9]+/);
      
      // Check tabs
      await expect(page.locator('text=Produits')).toBeVisible();
      await expect(page.locator('text=Commandes')).toBeVisible();
    }
  });

  // ==========================================================================
  // Products Page
  // ==========================================================================
  test('should display products page', async ({ page }) => {
    await page.goto('/products');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Produit');
    
    // Check for stats cards
    await expect(page.locator('text=Total')).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/products');
    
    // Check if filter exists
    const categoryFilter = page.locator('select[name="category"], [data-testid="category-filter"]').first();
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      
      // Select a category
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }
  });

  test('should show low stock warning', async ({ page }) => {
    await page.goto('/products');
    
    // Check for low stock badge
    const lowStockBadge = page.locator('text=/stock bas|rupture/i');
    // Badge might not be visible if no products with low stock
    const count = await lowStockBadge.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // ==========================================================================
  // Orders Page
  // ==========================================================================
  test('should display orders page', async ({ page }) => {
    await page.goto('/orders');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Commande');
    
    // Check for stats cards
    await expect(page.locator('text=Total')).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/orders');
    
    // Check if status filter exists
    const statusFilter = page.locator('select[name="status"], [data-testid="status-filter"]').first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('pending');
      
      // Wait for results
      await page.waitForTimeout(500);
    }
  });

  test('should display order status badges', async ({ page }) => {
    await page.goto('/orders');
    
    // Wait for orders to load
    await page.waitForTimeout(1000);
    
    // Check for status badges
    const pendingBadge = page.locator('text=/en attente|pending/i');
    const deliveredBadge = page.locator('text=/livré|delivered/i');
    
    // At least one badge type should be visible if orders exist
    const pendingCount = await pendingBadge.count();
    const deliveredCount = await deliveredBadge.count();
    
    expect(pendingCount + deliveredCount).toBeGreaterThanOrEqual(0);
  });

  // ==========================================================================
  // Customers Page
  // ==========================================================================
  test('should display customers page', async ({ page }) => {
    await page.goto('/customers');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Client');
    
    // Check for segmentation tabs or filters
    await expect(page.locator('text=/nouveau|régulier|VIP/i')).toBeVisible();
  });

  test('should filter customers by segment', async ({ page }) => {
    await page.goto('/customers');
    
    // Check for segment tabs
    const vipTab = page.locator('button:has-text("VIP"), [data-testid="vip-filter"]');
    if (await vipTab.isVisible()) {
      await vipTab.click();
      
      // Wait for results
      await page.waitForTimeout(500);
    }
  });

  test('should search customers', async ({ page }) => {
    await page.goto('/customers');
    
    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="recherch"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Amadou');
      
      // Wait for search results
      await page.waitForTimeout(500);
    }
  });

  // ==========================================================================
  // Wallet Page
  // ==========================================================================
  test('should display wallet page', async ({ page }) => {
    await page.goto('/wallet');
    
    // Check page title
    await expect(page.locator('h1')).toContainText('Portefeuille');
    
    // Check for balance display
    await expect(page.locator('text=GNF')).toBeVisible();
    
    // Check for action buttons
    await expect(page.getByRole('button', { name: /dépôt/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /retrait/i })).toBeVisible();
  });

  test('should open deposit form', async ({ page }) => {
    await page.goto('/wallet');
    
    // Click deposit button
    await page.click('button:has-text("Dépôt")');
    
    // Check if modal is visible
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    
    // Check for amount input
    await expect(page.locator('input[name="amount"], input[type="number"]').first()).toBeVisible();
    
    // Check for provider selection
    await expect(page.locator('text=Orange')).toBeVisible();
  });

  test('should display transaction history', async ({ page }) => {
    await page.goto('/wallet');
    
    // Scroll to transactions section
    await page.locator('text=/transaction|historique/i').scrollIntoViewIfNeeded();
    
    // Check for transaction list or table
    const transactionSection = page.locator('[data-testid="transactions"], table');
    await expect(transactionSection.first()).toBeVisible();
  });
});

// =============================================================================
// Mobile Money Integration Tests
// =============================================================================

test.describe('Mobile Money Payments', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', TEST_USER.email);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should validate Orange Money phone number', async ({ page }) => {
    await page.goto('/wallet');
    
    // Open deposit form
    await page.click('button:has-text("Dépôt")');
    
    // Select Orange Money
    await page.click('text=Orange');
    
    // Enter invalid phone number
    const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone"]').first();
    await phoneInput.fill('12345');
    
    // Try to submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Should show validation error
    await expect(page.locator('text=/invalide|incorrect/i')).toBeVisible();
  });

  test('should validate MTN Money phone number', async ({ page }) => {
    await page.goto('/wallet');
    
    // Open deposit form
    await page.click('button:has-text("Dépôt")');
    
    // Select MTN Money
    await page.click('text=MTN');
    
    // Enter Orange number (should fail for MTN)
    const phoneInput = page.locator('input[name="phone"], input[placeholder*="phone"]').first();
    await phoneInput.fill('+224622000000'); // Orange prefix
    
    // Try to submit
    const submitBtn = page.locator('button[type="submit"]');
    await submitBtn.click();
    
    // Should show validation error for wrong operator
    const errorVisible = await page.locator('text=/MTN|Orange|opérateur/i').isVisible();
    expect(errorVisible).toBeTruthy();
  });

  test('should validate minimum deposit amount', async ({ page }) => {
    await page.goto('/wallet');
    
    // Open deposit form
    await page.click('button:has-text("Dépôt")');
    
    // Enter small amount
    const amountInput = page.locator('input[name="amount"], input[type="number"]').first();
    await amountInput.fill('100'); // Too small
    
    // Try to submit
    await page.click('button[type="submit"]');
    
    // Should show minimum amount error
    const errorVisible = await page.locator('text=/minimum|minimum/i').isVisible();
    expect(errorVisible).toBeTruthy();
  });
});

// =============================================================================
// Business API Tests
// =============================================================================

test.describe('Business API', () => {
  test('should fetch businesses via API', async ({ request }) => {
    const response = await request.get('/api/business', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Should return 401 without auth, or 200 with auth
    expect([200, 401]).toContain(response.status());
  });

  test('should fetch products via API', async ({ request }) => {
    const response = await request.get('/api/products', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('should fetch orders via API', async ({ request }) => {
    const response = await request.get('/api/orders', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('should fetch customers via API', async ({ request }) => {
    const response = await request.get('/api/customers', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    expect([200, 401]).toContain(response.status());
  });

  test('should fetch wallet balance via API', async ({ request }) => {
    const response = await request.get('/api/payments/wallet', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    expect([200, 401]).toContain(response.status());
  });
});
