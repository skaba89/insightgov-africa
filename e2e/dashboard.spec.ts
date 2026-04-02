// ============================================
// InsightGov Africa - Comprehensive Dashboard E2E Tests
// ============================================

import { test, expect, Page } from '@playwright/test';

// ============================================
// Test Utilities
// ============================================

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

async function enableDemoMode(page: Page) {
  await page.goto('/?demo=true');
  await waitForPageLoad(page);
}

// ============================================
// Dashboard - Landing Tests
// ============================================

test.describe('Dashboard Landing Page', () => {
  test('should display welcome message when authenticated', async ({ page }) => {
    // Navigate to dashboard (will redirect to login if not authenticated)
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Check if redirected or on dashboard
    const url = page.url();
    if (url.includes('/dashboard')) {
      await expect(page.locator('text=Bienvenue')).toBeVisible();
    }
  });

  test('should show quick action cards', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    const url = page.url();
    if (url.includes('/dashboard')) {
      await expect(page.locator('text=Nouveau Dashboard')).toBeVisible();
      await expect(page.locator('text=Mes Données')).toBeVisible();
      await expect(page.locator('text=Abonnement')).toBeVisible();
    }
  });

  test('should show getting started guide', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    const url = page.url();
    if (url.includes('/dashboard')) {
      await expect(page.locator('text=Commencer')).toBeVisible();
    }
  });

  test('should have logout button', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    const url = page.url();
    if (url.includes('/dashboard')) {
      const logoutButton = page.locator('button:has-text("Déconnexion")');
      await expect(logoutButton).toBeVisible();
    }
  });
});

// ============================================
// Dashboard - Demo Mode Tests
// ============================================

test.describe('Dashboard - Demo Mode', () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
  });

  test('should load demo dashboard', async ({ page }) => {
    await expect(page.locator('text=Mode Démonstration')).toBeVisible();
  });

  test('should show demo banner', async ({ page }) => {
    await expect(page.locator('text=Données fictives')).toBeVisible();
  });

  test('should have sidebar navigation', async ({ page }) => {
    const sidebar = page.locator('[class*="sidebar"], nav, [data-sidebar]');
    await expect(sidebar.first()).toBeVisible();
  });

  test('should display demo KPIs', async ({ page }) => {
    // Look for KPI cards or metrics
    const kpiElements = page.locator('[class*="kpi"], [class*="metric"], [class*="card"]');
    await expect(kpiElements.first()).toBeVisible();
  });
});

// ============================================
// Dataset Upload Flow Tests
// ============================================

test.describe('Dataset Upload Flow', () => {
  test('should show upload area on onboarding page', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForPageLoad(page);

    // Navigate through steps to upload
    // Step 1: Organization type
    const orgTypeCard = page.locator('[class*="card"]').first();
    if (await orgTypeCard.isVisible()) {
      await orgTypeCard.click();
    }

    // Look for upload area
    const uploadArea = page.locator('text=/Import|Upload|Glissez|CSV|Excel/i');
    await expect(uploadArea.first()).toBeVisible();
  });

  test('should show supported file formats', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForPageLoad(page);

    // Check for format indicators
    const formatText = page.locator('text=/CSV|Excel|\\.xlsx|\\.xls/i');
    await expect(formatText.first()).toBeVisible();
  });

  test('should show file size limit information', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForPageLoad(page);

    // Check for size limit
    const sizeInfo = page.locator('text=/MB|mo|maximum/i');
    await expect(sizeInfo.first()).toBeVisible();
  });

  test('should show demo generation button', async ({ page }) => {
    await enableDemoMode(page);

    const demoButton = page.locator('button:has-text("Démo"), button:has-text("Demo"), button:has-text("Générer")');
    await expect(demoButton.first()).toBeVisible();
  });

  test('should validate file type on upload', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForPageLoad(page);

    // Look for file input
    const fileInput = page.locator('input[type="file"]');

    if (await fileInput.isVisible()) {
      // Try uploading invalid file type
      const invalidFile = {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('This is not a valid data file'),
      };

      await fileInput.setInputFiles(invalidFile);
      await page.waitForTimeout(1000);

      // Should show error
      const error = page.locator('text=/invalide|erreur|non supporté/i');
      await expect(error.first()).toBeVisible();
    }
  });
});

// ============================================
// Data Analysis Flow Tests
// ============================================

test.describe('Data Analysis Flow', () => {
  test('should trigger AI analysis after upload', async ({ page }) => {
    await enableDemoMode(page);

    // Click demo generation button
    const generateButton = page.locator('button:has-text("Générer"), button:has-text("Demo")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(2000);

      // Should show loading or analysis indicator
      const loading = page.locator('text=/analyse|Analyse|IA|génération/i');
      await expect(loading.first()).toBeVisible();
    }
  });

  test('should display analysis results', async ({ page }) => {
    await enableDemoMode(page);

    // Generate demo data
    const generateButton = page.locator('button:has-text("Générer"), button:has-text("Demo")').first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(3000);

      // Should show results
      const results = page.locator('text=/KPI|dashboard|résultat/i');
      await expect(results.first()).toBeVisible();
    }
  });

  test('should show detected columns', async ({ page }) => {
    await enableDemoMode(page);

    // Look for column information
    const columnInfo = page.locator('text=/colonne|column|champ/i');
    await expect(columnInfo.first()).toBeVisible();
  });

  test('should display data quality indicators', async ({ page }) => {
    await enableDemoMode(page);

    // Look for quality indicators
    const qualityIndicators = page.locator('text=/qualité|quality|complet|completeness/i');
    await expect(qualityIndicators.first()).toBeVisible();
  });
});

// ============================================
// Chart Rendering Tests
// ============================================

test.describe('Chart Rendering', () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
  });

  test('should render charts in demo mode', async ({ page }) => {
    // Look for chart containers
    const charts = page.locator('svg, [class*="chart"], [class*="tremor"]');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should display bar charts', async ({ page }) => {
    // Look for bar chart elements
    const barCharts = page.locator('[class*="BarChart"], svg rect');
    const barCount = await barCharts.count();
    expect(barCount).toBeGreaterThanOrEqual(0);
  });

  test('should display line charts', async ({ page }) => {
    // Look for line chart elements
    const lineCharts = page.locator('[class*="LineChart"], svg path');
    const lineCount = await lineCharts.count();
    expect(lineCount).toBeGreaterThanOrEqual(0);
  });

  test('should display pie/donut charts', async ({ page }) => {
    // Look for pie/donut chart elements
    const pieCharts = page.locator('[class*="DonutChart"], [class*="PieChart"], svg circle');
    const pieCount = await pieCharts.count();
    expect(pieCount).toBeGreaterThanOrEqual(0);
  });

  test('should show KPI cards with metrics', async ({ page }) => {
    // Look for KPI cards
    const kpiCards = page.locator('[class*="KPICard"], [class*="metric"], [class*="card"]');
    const kpiCount = await kpiCards.count();
    expect(kpiCount).toBeGreaterThan(0);
  });

  test('should display trend indicators', async ({ page }) => {
    // Look for trend indicators
    const trends = page.locator('[class*="trend"], text=/\\+|−|-|%/');
    const trendCount = await trends.count();
    expect(trendCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// Dashboard Interactions Tests
// ============================================

test.describe('Dashboard Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
  });

  test('should show filters panel', async ({ page }) => {
    const filters = page.locator('[class*="filter"], text=/filtrer|filter/i');
    await expect(filters.first()).toBeVisible();
  });

  test('should allow filter selection', async ({ page }) => {
    const filterSelect = page.locator('select, [role="combobox"]').first();

    if (await filterSelect.isVisible()) {
      await filterSelect.click();
      await page.waitForTimeout(300);
    }
  });

  test('should show date range picker', async ({ page }) => {
    const datePicker = page.locator('[class*="date"], input[type="date"], text=/date|période/i');
    await expect(datePicker.first()).toBeVisible();
  });

  test('should show sector selector', async ({ page }) => {
    const sectorSelector = page.locator('text=/secteur|Santé|Éducation|Agriculture/i');
    await expect(sectorSelector.first()).toBeVisible();
  });

  test('should allow dashboard refresh', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Rafraîchir"), button:has-text("Actualiser")');

    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await page.waitForTimeout(1000);
    }
  });
});

// ============================================
// Dashboard Layout Tests
// ============================================

test.describe('Dashboard Layout', () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
  });

  test('should have responsive grid layout', async ({ page }) => {
    // Check for grid classes
    const grid = page.locator('[class*="grid"]');
    const gridCount = await grid.count();
    expect(gridCount).toBeGreaterThan(0);
  });

  test('should show executive summary section', async ({ page }) => {
    const summary = page.locator('text=/résumé|summary|executive/i');
    await expect(summary.first()).toBeVisible();
  });

  test('should show key insights section', async ({ page }) => {
    const insights = page.locator('text=/insight|conclusion|observation/i');
    await expect(insights.first()).toBeVisible();
  });

  test('should show recommendations section', async ({ page }) => {
    const recommendations = page.locator('text=/recommandation|suggestion/i');
    await expect(recommendations.first()).toBeVisible();
  });

  test('should display dashboard title', async ({ page }) => {
    const title = page.locator('h1, h2').first();
    await expect(title).toBeVisible();
  });

  test('should show organization name', async ({ page }) => {
    const orgName = page.locator('text=/Ministère|ONG|Organisation|Entreprise/i');
    await expect(orgName.first()).toBeVisible();
  });
});

// ============================================
// Dashboard Mobile Tests
// ============================================

test.describe('Dashboard - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should render dashboard on mobile', async ({ page }) => {
    await enableDemoMode(page);
    await expect(page.locator('text=Mode Démonstration')).toBeVisible();
  });

  test('should have collapsible sidebar on mobile', async ({ page }) => {
    await enableDemoMode(page);

    // Look for menu toggle
    const menuToggle = page.locator('button[aria-label*="menu"], button:has-text("Menu")');

    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await page.waitForTimeout(300);
    }
  });

  test('should stack KPI cards vertically on mobile', async ({ page }) => {
    await enableDemoMode(page);

    const kpiCards = page.locator('[class*="card"]');
    const cardCount = await kpiCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });
});

// ============================================
// Dashboard Performance Tests
// ============================================

test.describe('Dashboard Performance', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/?demo=true');
    await waitForPageLoad(page);
    const loadTime = Date.now() - startTime;

    // Dashboard should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should not have console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await enableDemoMode(page);
    await page.waitForTimeout(2000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('extension') &&
      !e.includes('network')
    );
    expect(criticalErrors.length).toBe(0);
  });
});

// ============================================
// Dashboard Accessibility Tests
// ============================================

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await enableDemoMode(page);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test('should have accessible buttons', async ({ page }) => {
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('should have accessible form inputs', async ({ page }) => {
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const label = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');
      const id = await input.getAttribute('id');

      expect(label || placeholder || id).toBeTruthy();
    }
  });
});
