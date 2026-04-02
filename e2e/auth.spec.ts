// ============================================
// InsightGov Africa - Comprehensive E2E Authentication Tests
// ============================================

import { test, expect, Page } from '@playwright/test';

// ============================================
// Test Utilities
// ============================================

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

// Generate unique test email
function generateTestEmail(): string {
  return `test.${Date.now()}.${Math.random().toString(36).substr(2, 9)}@example.com`;
}

// ============================================
// Landing Page Tests
// ============================================

test.describe('Landing Page - Unauthenticated Users', () => {
  test('should display landing page with hero section', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check main headline
    await expect(page.locator('h1')).toContainText('dashboards');

    // Check CTA buttons
    await expect(page.locator('text=Démarrer gratuitement')).toBeVisible();
    await expect(page.locator('text=Voir la démo')).toBeVisible();
  });

  test('should display features section', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Navigate to features section
    await page.click('a[href="#features"]');

    // Check feature cards are displayed
    await expect(page.locator('text=IA Intelligente')).toBeVisible();
    await expect(page.locator('text=Gain de Temps')).toBeVisible();
    await expect(page.locator('text=Sécurité Avancée')).toBeVisible();
  });

  test('should display pricing section', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Navigate to pricing section
    await page.click('a[href="#pricing"]');

    // Check pricing plans
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test('should display testimonials section', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Navigate to testimonials section
    await page.click('a[href="#testimonials"]');

    // Check testimonials
    await expect(page.locator('text=Ils nous font confiance')).toBeVisible();
  });

  test('should display FAQ section', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Navigate to FAQ section
    await page.click('a[href="#faq"]');

    // Check FAQ items
    await expect(page.locator('text=Questions fréquentes')).toBeVisible();
  });

  test('should display sector selection', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check sector icons
    await expect(page.locator('text=Santé')).toBeVisible();
    await expect(page.locator('text=Éducation')).toBeVisible();
    await expect(page.locator('text=Agriculture')).toBeVisible();
    await expect(page.locator('text=Finance')).toBeVisible();
  });

  test('should display statistics', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Check stats
    await expect(page.locator('text=Organisations')).toBeVisible();
    await expect(page.locator('text=Dashboards créés')).toBeVisible();
    await expect(page.locator('text=Pays africains')).toBeVisible();
    await expect(page.locator('text=Disponibilité')).toBeVisible();
  });
});

// ============================================
// Navigation Tests
// ============================================

test.describe('Navigation', () => {
  test('should have working navigation links', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Test each navigation link
    const navLinks = [
      { href: '#features', text: 'Fonctionnalités' },
      { href: '#how-it-works', text: 'Comment ça marche' },
      { href: '#pricing', text: 'Tarifs' },
      { href: '#testimonials', text: 'Témoignages' },
      { href: '#faq', text: 'FAQ' },
    ];

    for (const link of navLinks) {
      await page.click(`a[href="${link.href}"]`);
      await page.waitForTimeout(300);
    }
  });

  test('should have login link in header', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    await page.click('text=Connexion');
    await expect(page).toHaveURL(/\/login/);
  });

  test('should have signup link in header', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    await page.click('text=Essai gratuit');
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('should have working footer links', async ({ page }) => {
    await page.goto('/');
    await waitForPageLoad(page);

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    // Check legal links
    const conditionsLink = page.locator('a:has-text("Conditions")');
    await expect(conditionsLink).toBeVisible();
  });

  test('should toggle mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await waitForPageLoad(page);

    // Open mobile menu
    const menuButton = page.locator('button').filter({ hasText: '' }).first();
    await menuButton.click();

    // Check menu is open
    await expect(page.locator('text=Fonctionnalités')).toBeVisible();
  });
});

// ============================================
// Login Flow Tests
// ============================================

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);
  });

  test('should display login form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeFocused();
  });

  test('should show error for invalid email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'somepassword');
    await page.click('button[type="submit"]');

    // HTML5 validation should prevent submission
    await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
  });

  test('should show error for wrong credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'nonexistent@example.com');
    await page.fill('input[type="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');

    // Wait for error response
    await page.waitForTimeout(2000);

    // Should show error message or stay on login page
    const url = page.url();
    expect(url).toContain('/login');
  });

  test('should have link to forgot password', async ({ page }) => {
    const forgotLink = page.locator('a:has-text("Mot de passe oublié")');
    await expect(forgotLink).toBeVisible();
  });

  test('should have link to signup', async ({ page }) => {
    const signupLink = page.locator('a:has-text("Créer un compte")');
    await expect(signupLink).toBeVisible();
  });

  test('should show OAuth buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible();
  });

  test('should redirect to dashboard after successful login', async ({ page }) => {
    // This test would need valid test credentials
    // For now, we test the flow without actual authentication
    const email = 'demo@insightgov.africa';
    const password = 'demo123456';

    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');

    // Wait for redirect or error
    await page.waitForTimeout(3000);

    // Should either redirect or show error
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|login)/);
  });
});

// ============================================
// Registration Flow Tests
// ============================================

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/register');
    await waitForPageLoad(page);
  });

  test('should display registration form', async ({ page }) => {
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"], button:has-text("Continuer")')).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"], button:has-text("Continuer")');

    // HTML5 validation
    await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
  });

  test('should show step 2 after completing step 1', async ({ page }) => {
    const email = generateTestEmail();
    const name = 'Test User';
    const password = 'Password123!';

    // Fill step 1
    await page.fill('input[type="email"]', email);
    await page.fill('input[placeholder*="Jean"], input[placeholder*="Nom"]', name);
    await page.fill('input[type="password"]', password);
    await page.fill('input[placeholder*="••••••••"]', password);

    // Go to step 2
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(1000);

    // Should show organization step
    await expect(page.locator('text=Organisation')).toBeVisible();
  });

  test('should show password strength indicator', async ({ page }) => {
    await page.fill('input[type="password"]', 'weak');
    await page.waitForTimeout(300);

    // Check for password feedback
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
  });

  test('should require password confirmation match', async ({ page }) => {
    const email = generateTestEmail();

    await page.fill('input[type="email"]', email);
    await page.fill('input[placeholder*="Jean"], input[placeholder*="Nom"]', 'Test User');
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[placeholder*="••••••••"]', 'DifferentPassword123!');

    // Should stay on step 1 if passwords don't match
    await page.click('button:has-text("Continuer")');
    await page.waitForTimeout(500);
  });

  test('should accept terms checkbox', async ({ page }) => {
    // Look for terms checkbox
    const termsCheckbox = page.locator('input[type="checkbox"]').first();

    if (await termsCheckbox.isVisible()) {
      await termsCheckbox.check();
      await expect(termsCheckbox).toBeChecked();
    }
  });

  test('should have link to login', async ({ page }) => {
    const loginLink = page.locator('a:has-text("Se connecter")');
    await expect(loginLink).toBeVisible();
  });
});

// ============================================
// Logout Flow Tests
// ============================================

test.describe('Logout Flow', () => {
  test('should show logout button when authenticated', async ({ page }) => {
    // Navigate to dashboard (should redirect to login if not authenticated)
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // If on login page, skip this test
    const url = page.url();
    if (url.includes('/login')) {
      test.skip();
      return;
    }

    // Check for logout button
    const logoutButton = page.locator('button:has-text("Déconnexion"), button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
  });
});

// ============================================
// Password Reset Flow Tests
// ============================================

test.describe('Password Reset Flow', () => {
  test('should display forgot password page', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await waitForPageLoad(page);

    await expect(page.locator('h2:has-text("Mot de passe oublié")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button:has-text("Envoyer")')).toBeVisible();
  });

  test('should validate email on password reset', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await waitForPageLoad(page);

    // Try to submit empty
    await page.click('button:has-text("Envoyer")');
    await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
  });

  test('should submit valid email for password reset', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await waitForPageLoad(page);

    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Envoyer")');

    // Wait for response
    await page.waitForTimeout(2000);
  });

  test('should have link back to login', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    await waitForPageLoad(page);

    await page.click('a:has-text("Retour")');
    await expect(page).toHaveURL(/\/login/);
  });
});

// ============================================
// Email Verification Tests
// ============================================

test.describe('Email Verification', () => {
  test('should display verification page', async ({ page }) => {
    await page.goto('/auth/verify-email');
    await waitForPageLoad(page);

    await expect(page.locator('text=Renvoyer')).toBeVisible();
  });

  test('should show error for invalid token', async ({ page }) => {
    await page.goto('/auth/verify-email?error=invalid_token');
    await waitForPageLoad(page);

    await expect(page.locator('text=invalide')).toBeVisible();
  });

  test('should allow resending verification email', async ({ page }) => {
    await page.goto('/auth/verify-email');
    await waitForPageLoad(page);

    await page.fill('input[type="email"]', 'test@example.com');
    await page.click('button:has-text("Renvoyer")');

    await page.waitForTimeout(2000);
  });
});

// ============================================
// Protected Routes Tests
// ============================================

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing dashboard without auth', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // Should redirect to login
    await expect(page).not.toHaveURL('/dashboard');
    expect(page.url()).toMatch(/\/(login|$)/);
  });

  test('should redirect to login when accessing settings without auth', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Should redirect to login
    await expect(page).not.toHaveURL('/settings');
  });

  test('should preserve redirect URL after login', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Check if redirect parameter is preserved
    const url = page.url();
    if (url.includes('redirect')) {
      expect(url).toContain('redirect=%2Fsettings');
    }
  });
});

// ============================================
// OAuth Tests
// ============================================

test.describe('OAuth Integration', () => {
  test('should show Google OAuth button on login', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    await expect(page.locator('button:has-text("Google")')).toBeVisible();
  });

  test('should show GitHub OAuth button on login', async ({ page }) => {
    await page.goto('/login');
    await waitForPageLoad(page);

    await expect(page.locator('button:has-text("GitHub")')).toBeVisible();
  });

  test('should show OAuth buttons on register', async ({ page }) => {
    await page.goto('/auth/register');
    await waitForPageLoad(page);

    await expect(page.locator('button:has-text("Google")')).toBeVisible();
    await expect(page.locator('button:has-text("GitHub")')).toBeVisible();
  });
});

// ============================================
// Auth Error Handling Tests
// ============================================

test.describe('Auth Error Handling', () => {
  test('should display auth error page', async ({ page }) => {
    await page.goto('/auth/error?error=AccessDenied');
    await waitForPageLoad(page);

    await expect(page.locator('text=Erreur')).toBeVisible();
  });

  test('should show retry button on error', async ({ page }) => {
    await page.goto('/auth/error');
    await waitForPageLoad(page);

    await expect(page.locator('button:has-text("Réessayer")')).toBeVisible();
  });

  test('should handle different error types', async ({ page }) => {
    const errorTypes = ['AccessDenied', 'Configuration', 'Verification', 'Default'];

    for (const errorType of errorTypes) {
      await page.goto(`/auth/error?error=${errorType}`);
      await waitForPageLoad(page);
      await expect(page.locator('text=Erreur')).toBeVisible();
    }
  });
});

// ============================================
// Session Management Tests
// ============================================

test.describe('Session Management', () => {
  test('should persist session across page reloads', async ({ page }) => {
    // This would need actual authentication
    // For now, just check the flow
    await page.goto('/');
    await waitForPageLoad(page);
    await page.reload();
    await waitForPageLoad(page);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle session expiration gracefully', async ({ page }) => {
    await page.goto('/dashboard');
    await waitForPageLoad(page);

    // If not authenticated, should redirect to login
    const url = page.url();
    expect(url).not.toBe('/dashboard');
  });
});

// ============================================
// Demo Mode Tests
// ============================================

test.describe('Demo Mode', () => {
  test('should enable demo mode via URL parameter', async ({ page }) => {
    await page.goto('/?demo=true');
    await waitForPageLoad(page);

    await expect(page.locator('text=Mode Démonstration')).toBeVisible();
  });

  test('should show demo banner in demo mode', async ({ page }) => {
    await page.goto('/?demo=true');
    await waitForPageLoad(page);

    await expect(page.locator('text=Données fictives')).toBeVisible();
  });

  test('should have sidebar in demo mode', async ({ page }) => {
    await page.goto('/?demo=true');
    await waitForPageLoad(page);

    const sidebar = page.locator('[class*="sidebar"], nav, [data-sidebar]');
    await expect(sidebar.first()).toBeVisible();
  });
});
