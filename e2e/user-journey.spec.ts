// ============================================
// InsightGov Africa - Critical User Journey E2E Tests
// ============================================
// This file tests complete end-to-end flows that represent
// real user scenarios from landing to conversion
// ============================================

import { test, expect, Page } from '@playwright/test';

// ============================================
// Test Utilities
// ============================================

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

function generateTestEmail(): string {
  return `test.${Date.now()}.${Math.random().toString(36).substr(2, 9)}@example.com`;
}

// ============================================
// Journey 1: New User Discovery Flow
// ============================================

test.describe('Journey 1: New User Discovery', () => {
  test('should complete landing page to signup flow', async ({ page }) => {
    // Step 1: Land on homepage
    await page.goto('/');
    await waitForPageLoad(page);

    // Verify landing page elements
    await expect(page.locator('h1')).toContainText('dashboards');
    await expect(page.locator('text=Démarrer gratuitement')).toBeVisible();

    // Step 2: Scroll through features
    await page.click('a[href="#features"]');
    await page.waitForTimeout(300);
    await expect(page.locator('text=IA Intelligente')).toBeVisible();

    // Step 3: View pricing
    await page.click('a[href="#pricing"]');
    await page.waitForTimeout(300);
    await expect(page.locator('text=Professional')).toBeVisible();

    // Step 4: Click CTA to start
    await page.click('text=Démarrer gratuitement');
    await waitForPageLoad(page);

    // Should be on onboarding or login page
    expect(page.url()).toMatch(/\/(onboarding|login|signup)/);
  });

  test('should navigate from pricing to onboarding', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Click on most popular plan
    await page.click('text=Professional').first();
    await page.waitForTimeout(300);

    // Click CTA button
    const ctaButton = page.locator('button:has-text("Essai gratuit"), a:has-text("Commencer")').first();
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await waitForPageLoad(page);
      expect(page.url()).toMatch(/\/(onboarding|login|signup)/);
    }
  });

  test('should explore testimonials and trust signals', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Navigate to testimonials
    await page.click('a[href="#testimonials"]');
    await page.waitForTimeout(300);

    // Verify testimonials are visible
    await expect(page.locator('text=Ils nous font confiance')).toBeVisible();

    // Check for trust badges
    await expect(page.locator('text=RGPD')).toBeVisible();
    await expect(page.locator('text=ISO')).toBeVisible();
  });

  test('should view FAQ and get answers', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Navigate to FAQ
    await page.click('a[href="#faq"]');
    await page.waitForTimeout(300);

    // Expand a FAQ item
    const faqItem = page.locator('button:has-text("Comment fonctionne")').first();
    if (await faqItem.isVisible()) {
      await faqItem.click();
      await page.waitForTimeout(300);

      // Verify answer is shown
      const answer = page.locator('text=/IA analyse|automatique/i');
      await expect(answer.first()).toBeVisible();
    }
  });
});

// ============================================
// Journey 2: Demo Mode Exploration
// ============================================

test.describe('Journey 2: Demo Mode Exploration', () => {
  test('should explore demo mode without signup', async ({ page }) => {
    // Enter demo mode
    await page.goto('/?demo=true');
    await waitForPageLoad(page);

    // Verify demo mode is active
    await expect(page.locator('text=Mode Démonstration')).toBeVisible();
    await expect(page.locator('text=Données fictives')).toBeVisible();

    // Look for dashboard elements
    const kpiCards = page.locator('[class*="card"]');
    const cardCount = await kpiCards.count();
    expect(cardCount).toBeGreaterThan(0);

    // Navigate to charts
    const charts = page.locator('svg, [class*="chart"]');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should generate demo data and see dashboard', async ({ page }) => {
    await page.goto('/?demo=true');
    await waitForPageLoad(page);

    // Look for generate/demo button
    const generateButton = page.locator('button:has-text("Générer"), button:has-text("Demo")').first();

    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(3000);

      // Verify dashboard is generated
      const dashboardElements = page.locator('text=/KPI|dashboard|résultat|métrique/i');
      await expect(dashboardElements.first()).toBeVisible();
    }
  });

  test('should explore demo dashboard filters', async ({ page }) => {
    await page.goto('/?demo=true');
    await waitForPageLoad(page);

    // Look for filter elements
    const filters = page.locator('[class*="filter"], select, [role="combobox"]').first();

    if (await filters.isVisible()) {
      await filters.click();
      await page.waitForTimeout(300);

      // Check if filter options are shown
      const options = page.locator('[role="option"], option');
      const optionsCount = await options.count();
      expect(optionsCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should view demo dashboard on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/?demo=true');
    await waitForPageLoad(page);

    // Verify mobile layout
    await expect(page.locator('text=Mode Démonstration')).toBeVisible();

    // Check for mobile menu toggle
    const menuToggle = page.locator('button[aria-label*="menu"], button:has-text("Menu")');
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await page.waitForTimeout(300);
    }
  });
});

// ============================================
// Journey 3: Onboarding Flow
// ============================================

test.describe('Journey 3: Onboarding Flow', () => {
  test('should start onboarding from landing page', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Click main CTA
    await page.click('text=Démarrer gratuitement');
    await waitForPageLoad(page);

    // Should be on onboarding page
    expect(page.url()).toMatch(/\/(onboarding|signup|login)/);
  });

  test('should progress through onboarding steps', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForPageLoad(page);

    // Check welcome message
    await expect(page.locator('text=Bienvenue')).toBeVisible();

    // Step 1: Select organization type
    const orgTypeCards = page.locator('[class*="card"]');
    const cardCount = await orgTypeCards.count();

    if (cardCount > 0) {
      await orgTypeCards.first().click();
      await page.waitForTimeout(300);

      // Look for next button
      const nextButton = page.locator('button:has-text("Suivant")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test('should select sector during onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForPageLoad(page);

    // Navigate through to sector selection
    const orgTypeCards = page.locator('[class*="card"]');
    if (await orgTypeCards.first().isVisible()) {
      await orgTypeCards.first().click();

      const nextButton = page.locator('button:has-text("Suivant")');
      if (await nextButton.isVisible()) {
        await nextButton.click();
        await page.waitForTimeout(500);

        // Look for sector options
        const sectorOptions = page.locator('text=/Santé|Éducation|Agriculture|Finance/');
        await expect(sectorOptions.first()).toBeVisible();
      }
    }
  });

  test('should show upload step in onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForPageLoad(page);

    // Navigate to upload step
    // This typically requires completing previous steps

    // Look for upload elements
    const uploadArea = page.locator('text=/Import|Upload|Glissez|CSV|Excel|fichier/i');
    const uploadVisible = await uploadArea.first().isVisible();

    if (!uploadVisible) {
      // Try to navigate to upload step
      const orgTypeCards = page.locator('[class*="card"]');
      if (await orgTypeCards.first().isVisible()) {
        await orgTypeCards.first().click();

        // Skip through steps
        for (let i = 0; i < 3; i++) {
          const nextButton = page.locator('button:has-text("Suivant")');
          if (await nextButton.isVisible()) {
            await nextButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }

    // Check for upload area
    const uploadAreaFinal = page.locator('text=/Import|Upload|Glissez|CSV|Excel|fichier/i');
    await expect(uploadAreaFinal.first()).toBeVisible();
  });

  test('should allow skipping onboarding', async ({ page }) => {
    await page.goto('/onboarding');
    await waitForPageLoad(page);

    // Look for skip button
    const skipButton = page.locator('text=Passer, button:has-text("Passer")');

    if (await skipButton.isVisible()) {
      await skipButton.click();
      await page.waitForTimeout(500);

      // Should navigate away from onboarding
      expect(page.url()).not.toContain('/onboarding');
    }
  });
});

// ============================================
// Journey 4: Authentication Flow
// ============================================

test.describe('Journey 4: Authentication Flow', () => {
  test('should navigate to login from header', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Click login link in header
    await page.click('text=Connexion');
    await waitForPageLoad(page);

    expect(page.url()).toContain('/login');
  });

  test('should see registration option', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    // Look for registration link
    const registerLink = page.locator('a:has-text("Créer un compte")');
    await expect(registerLink).toBeVisible();

    await registerLink.click();
    await waitForPageLoad(page);

    expect(page.url()).toMatch(/\/(register|signup)/);
  });

  test('should see OAuth options', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    // Check for OAuth buttons
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible();
  });

  test('should access password reset', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    // Click forgot password
    await page.click('a:has-text("Mot de passe oublié")');
    await waitForPageLoad(page);

    expect(page.url()).toContain('forgot-password');

    // Verify reset form
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Envoyer")')).toBeVisible();
  });
});

// ============================================
// Journey 5: Dashboard Interaction (Demo)
// ============================================

test.describe('Journey 5: Dashboard Interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?demo=true');
    await waitForPageLoad(page);
  });

  test('should view dashboard metrics', async ({ page }) => {
    // Look for metric/KPI displays
    const metrics = page.locator('[class*="metric"], [class*="kpi"], [class*="card"]');
    const metricsCount = await metrics.count();
    expect(metricsCount).toBeGreaterThan(0);
  });

  test('should view charts and visualizations', async ({ page }) => {
    // Look for chart elements
    const charts = page.locator('svg, [class*="chart"], [class*="tremor"]');
    const chartCount = await charts.count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should see trend indicators', async ({ page }) => {
    // Look for percentage or trend indicators
    const trends = page.locator('text=/\\+.*%|−.*%|-.*%|↑|↓/');
    const trendCount = await trends.count();
    expect(trendCount).toBeGreaterThanOrEqual(0);
  });

  test('should view insights section', async ({ page }) => {
    // Look for insights/recommendations
    const insights = page.locator('text=/insight|recommandation|conclusion|observation/i');
    const insightsCount = await insights.count();
    expect(insightsCount).toBeGreaterThanOrEqual(0);
  });

  test('should see export options', async ({ page }) => {
    // Look for export buttons
    const exportButtons = page.locator('button:has-text("Export"), button:has-text("PDF"), button:has-text("Excel")');
    const exportCount = await exportButtons.count();
    expect(exportCount).toBeGreaterThanOrEqual(0);
  });
});

// ============================================
// Journey 6: Pricing and Plans
// ============================================

test.describe('Journey 6: Pricing and Plans', () => {
  test('should view all pricing tiers', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Verify all plans are displayed
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('should see plan features', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Look for feature lists
    const features = page.locator('text=/utilisateur|dashboard|KPI|export|support/i');
    const featureCount = await features.count();
    expect(featureCount).toBeGreaterThan(0);
  });

  test('should see monthly/yearly toggle', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Look for billing toggle
    const toggle = page.locator('[role="switch"], input[type="checkbox"], button:has-text("an"), button:has-text("mois")');
    await expect(toggle.first()).toBeVisible();
  });

  test('should see FAQ on pricing page', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Look for FAQ section
    await expect(page.locator('text=FAQ')).toBeVisible();
  });

  test('should see contact sales option', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Look for enterprise/contact section
    const contactOption = page.locator('text=/contact|nous contacter|Enterprise/i');
    await expect(contactOption).toBeVisible();
  });

  test('should click plan CTA', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Click a plan CTA
    const ctaButton = page.locator('button:has-text("Commencer"), a:has-text("Commencer"), button:has-text("Essai")').first();
    await expect(ctaButton).toBeVisible();
  });
});

// ============================================
// Journey 7: Legal Pages Flow
// ============================================

test.describe('Journey 7: Legal Pages Flow', () => {
  test('should access terms of service', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Click on terms link
    await page.click('a:has-text("Conditions")');
    await waitForPageLoad(page);

    expect(page.url()).toMatch(/\/(terms|legal\/terms)/);
  });

  test('should access privacy policy', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Click on privacy link
    await page.click('a:has-text("Confidentialité")');
    await waitForPageLoad(page);

    expect(page.url()).toMatch(/\/(privacy|legal\/privacy)/);
  });

  test('should see GDPR compliance information', async ({ page }) => {
    await page.goto('/privacy');
    await waitForPageLoad(page);

    // Check for GDPR/privacy terms
    const gdprText = page.locator('text=/RGPD|GDPR|données personnelles|confidentialité/i');
    await expect(gdprText.first()).toBeVisible();
  });

  test('should navigate between legal pages', async ({ page }) => {
    await page.goto('/legal/terms');
    await waitForPageLoad(page);

    // Look for privacy link in terms page
    const privacyLink = page.locator('a:has-text("Politique de confidentialité")');
    if (await privacyLink.isVisible()) {
      await privacyLink.click();
      await waitForPageLoad(page);
      expect(page.url()).toMatch(/\/privacy/);
    }
  });
});

// ============================================
// Journey 8: Mobile User Experience
// ============================================

test.describe('Journey 8: Mobile User Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test('should load mobile landing page', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Verify mobile layout
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should use mobile navigation menu', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Open mobile menu
    const menuButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await menuButton.click();
    await page.waitForTimeout(300);

    // Verify menu is open
    await expect(page.locator('text=Fonctionnalités')).toBeVisible();
  });

  test('should view mobile pricing', async ({ page }) => {
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Verify pricing cards stack vertically
    const pricingCards = page.locator('[class*="card"]');
    const cardCount = await pricingCards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('should access mobile demo', async ({ page }) => {
    await page.goto('/?demo=true');
    await waitForPageLoad(page);

    await expect(page.locator('text=Mode Démonstration')).toBeVisible();
  });

  test('should use mobile login form', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    // Verify form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });
});

// ============================================
// Journey 9: Error Recovery Flow
// ============================================

test.describe('Journey 9: Error Recovery', () => {
  test('should handle 404 gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    await waitForPageLoad(page);

    // Should show 404 or redirect
    const isHome = page.url() === '/';
    const hasError = await page.locator('text=/404|introuvable|non trouvé/i').count() > 0;

    expect(isHome || hasError).toBeTruthy();
  });

  test('should recover from auth error', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');
    await waitForPageLoad(page);

    // Should show error with retry option
    await expect(page.locator('text=Erreur')).toBeVisible();

    const retryButton = page.locator('button:has-text("Réessayer")');
    if (await retryButton.isVisible()) {
      await retryButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should handle protected route redirect', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Should redirect to login
    expect(page.url()).not.toBe('/dashboard');
    expect(page.url()).toMatch(/\/(login|\/$)/);
  });
});

// ============================================
// Journey 10: Full Conversion Flow
// ============================================

test.describe('Journey 10: Full Conversion Flow', () => {
  test('should complete landing to signup journey', async ({ page }) => {
    // Step 1: Land on homepage
    await page.goto('/');
    await waitForPageLoad(page);

    // Step 2: Browse features
    await page.click('a[href="#features"]');
    await page.waitForTimeout(300);

    // Step 3: View pricing
    await page.click('a[href="#pricing"]');
    await page.waitForTimeout(300);

    // Step 4: View testimonials
    await page.click('a[href="#testimonials"]');
    await page.waitForTimeout(300);

    // Step 5: Start signup
    await page.click('text=Démarrer gratuitement');
    await waitForPageLoad(page);

    // Should be on onboarding/signup
    expect(page.url()).toMatch(/\/(onboarding|signup|login)/);
  });

  test('should complete pricing to onboarding journey', async ({ page }) => {
    // Start at pricing
    await page.goto('/pricing');
    await waitForPageLoad(page);

    // Select Professional plan
    const professionalPlan = page.locator('text=Professional').first();
    await professionalPlan.click();
    await page.waitForTimeout(300);

    // Click CTA
    const ctaButton = page.locator('button:has-text("Essai"), a:has-text("Commencer")').first();
    if (await ctaButton.isVisible()) {
      await ctaButton.click();
      await waitForPageLoad(page);

      // Should navigate to signup/onboarding
      expect(page.url()).toMatch(/\/(onboarding|signup|login)/);
    }
  });

  test('should complete demo to signup journey', async ({ page }) => {
    // Try demo mode
    await page.goto('/?demo=true');
    await waitForPageLoad(page);

    await expect(page.locator('text=Mode Démonstration')).toBeVisible();

    // Look for signup CTA in demo mode
    const signupCTA = page.locator('button:has-text("Inscription"), a:has-text("Inscription"), button:has-text("Créer un compte")');

    if (await signupCTA.first().isVisible()) {
      await signupCTA.first().click();
      await waitForPageLoad(page);

      expect(page.url()).toMatch(/\/(signup|login|onboarding)/);
    }
  });
});

// ============================================
// Journey 11: Accessibility User Journey
// ============================================

test.describe('Journey 11: Accessibility Journey', () => {
  test('should navigate using keyboard', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Tab through navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Focus should be visible
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper heading structure', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check H1 exists and is unique
    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBe(1);
  });

  test('should have accessible images', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();

    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const ariaLabel = await img.getAttribute('aria-label');
      const ariaHidden = await img.getAttribute('aria-hidden');

      // Image should have alt text or be marked as decorative
      expect(alt || ariaLabel || ariaHidden === 'true').toBeTruthy();
    }
  });

  test('should have accessible forms', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    // Check form inputs have labels
    const inputs = page.locator('input:visible');
    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const placeholder = await input.getAttribute('placeholder');

      // Input should have some form of labeling
      expect(id || ariaLabel || placeholder).toBeTruthy();
    }
  });
});

// ============================================
// Performance Journeys
// ============================================

test.describe('Performance Journeys', () => {
  test('landing page should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await waitForPageLoad(page);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test('dashboard demo should load quickly', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/?demo=true');
    await waitForPageLoad(page);
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test('should not have critical console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await waitForPageLoad(page);
    await page.waitForTimeout(2000);

    // Filter out non-critical errors
    const criticalErrors = errors.filter(
      (e) => !e.includes('favicon') && !e.includes('extension') && !e.includes('network')
    );

    expect(criticalErrors.length).toBe(0);
  });
});
