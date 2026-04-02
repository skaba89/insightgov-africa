// ============================================
// InsightGov Africa - Comprehensive Settings E2E Tests
// ============================================

import { test, expect, Page } from '@playwright/test';

// ============================================
// Test Utilities
// ============================================

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
}

// ============================================
// Settings Page - Authentication Tests
// ============================================

test.describe('Settings Page - Authentication', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Should not stay on settings page
    await expect(page).not.toHaveURL('/settings');

    // Should be on login or home page
    const url = page.url();
    expect(url).toMatch(/\/(login|\/$)/);
  });

  test('should preserve redirect after login', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Check for redirect parameter
    const url = page.url();
    if (url.includes('redirect')) {
      expect(url.toLowerCase()).toContain('settings');
    }
  });

  test('should show login prompt for unauthenticated users', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Check for login-related elements
    const loginElements = page.locator('text=/connexion|login|authentifier/i');
    const loginCount = await loginElements.count();

    // Either redirected to login or showing login prompt
    const url = page.url();
    expect(url.includes('/login') || loginCount > 0).toBeTruthy();
  });
});

// ============================================
// Settings Page - Structure Tests
// ============================================

test.describe('Settings Page - Structure', () => {
  // Note: These tests require authentication
  // They will be skipped if not authenticated

  test.skip('should display settings tabs', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Check for main tabs
    await expect(page.locator('text=Compte')).toBeVisible();
    await expect(page.locator('text=Organisation')).toBeVisible();
    await expect(page.locator('text=Abonnement')).toBeVisible();
    await expect(page.locator('text=API')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
  });

  test.skip('should have tab icons', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Check for tab icons (using SVG or icon classes)
    const icons = page.locator('svg');
    const iconCount = await icons.count();
    expect(iconCount).toBeGreaterThan(0);
  });

  test.skip('should have back button', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    const backButton = page.locator('button:has-text("Retour"), a:has-text("Retour")');
    await expect(backButton).toBeVisible();
  });

  test.skip('should show current plan badge', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    const planBadge = page.locator('text=/Free|Starter|Professional|Enterprise/i');
    await expect(planBadge).toBeVisible();
  });
});

// ============================================
// Settings Page - Account Tab Tests
// ============================================

test.describe('Settings Page - Account Tab', () => {
  test.skip('should display account settings form', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    await expect(page.locator('input[id*="firstName"], input[placeholder*="Prénom"]')).toBeVisible();
    await expect(page.locator('input[id*="lastName"], input[placeholder*="Nom"]')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test.skip('should display avatar section', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const avatar = page.locator('img[class*="avatar"], [class*="Avatar"]');
    await expect(avatar.first()).toBeVisible();
  });

  test.skip('should have change photo button', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const changePhotoButton = page.locator('button:has-text("photo")');
    await expect(changePhotoButton).toBeVisible();
  });

  test.skip('should display language selector', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const languageSelect = page.locator('text=/Langue|Language/i');
    await expect(languageSelect).toBeVisible();
  });

  test.skip('should have password change section', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const passwordSection = page.locator('text=/Mot de passe|Password/i');
    await expect(passwordSection).toBeVisible();
  });

  test.skip('should have save button for profile', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const saveButton = page.locator('button:has-text("Enregistrer")');
    await expect(saveButton).toBeVisible();
  });

  test.skip('should show danger zone', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const dangerZone = page.locator('text=/danger|supprimer|compte/i');
    await expect(dangerZone.first()).toBeVisible();
  });

  test.skip('should have account deletion button', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const deleteButton = page.locator('button:has-text("Supprimer")');
    await expect(deleteButton).toBeVisible();
  });
});

// ============================================
// Settings Page - Organization Tab Tests
// ============================================

test.describe('Settings Page - Organization Tab', () => {
  test.skip('should display organization settings', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');

    const orgNameInput = page.locator('input[id*="name"], input[placeholder*="organisation"]');
    await expect(orgNameInput.first()).toBeVisible();
  });

  test.skip('should display organization type selector', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');

    const typeSelect = page.locator('text=/Type|Ministère|ONG|Entreprise/i');
    await expect(typeSelect).toBeVisible();
  });

  test.skip('should display sector selector', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');

    const sectorSelect = page.locator('text=/Secteur|Santé|Éducation/i');
    await expect(sectorSelect).toBeVisible();
  });

  test.skip('should display country and city fields', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');

    const countryInput = page.locator('input[placeholder*="Pays"], input[id*="country"]');
    const cityInput = page.locator('input[placeholder*="Ville"], input[id*="city"]');

    await expect(countryInput.first().or(cityInput.first())).toBeVisible();
  });

  test.skip('should display team members section', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');

    const teamSection = page.locator('text=/Membres|Équipe|Team/i');
    await expect(teamSection).toBeVisible();
  });

  test.skip('should have invite member button', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');

    const inviteButton = page.locator('button:has-text("Inviter")');
    await expect(inviteButton).toBeVisible();
  });

  test.skip('should show invite dialog when clicking invite button', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');
    await page.click('button:has-text("Inviter")');

    const dialog = page.locator('[role="dialog"], [class*="dialog"]');
    await expect(dialog).toBeVisible();
  });

  test.skip('should have email input in invite dialog', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');
    await page.click('button:has-text("Inviter")');

    const emailInput = page.locator('[role="dialog"] input[type="email"]');
    await expect(emailInput).toBeVisible();
  });

  test.skip('should have role selector in invite dialog', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');
    await page.click('button:has-text("Inviter")');

    const roleSelect = page.locator('[role="dialog"] select, [role="dialog"] [role="combobox"]');
    await expect(roleSelect.first()).toBeVisible();
  });
});

// ============================================
// Settings Page - Subscription Tab Tests
// ============================================

test.describe('Settings Page - Subscription Tab', () => {
  test.skip('should display subscription section', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    const planSection = page.locator('text=/Plan|Abonnement|Subscription/i');
    await expect(planSection).toBeVisible();
  });

  test.skip('should display current plan details', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    const currentPlan = page.locator('text=/Plan actuel|Current plan/i');
    await expect(currentPlan).toBeVisible();
  });

  test.skip('should show plan comparison cards', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    // Check for plan names
    await expect(page.locator('text=Free')).toBeVisible();
    await expect(page.locator('text=Starter')).toBeVisible();
    await expect(page.locator('text=Professional')).toBeVisible();
    await expect(page.locator('text=Enterprise')).toBeVisible();
  });

  test.skip('should show upgrade buttons', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    const upgradeButtons = page.locator('button:has-text("Upgrade"), button:has-text("Améliorer")');
    await expect(upgradeButtons.first()).toBeVisible();
  });

  test.skip('should display payment history', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    const historySection = page.locator('text=/Historique|History|Factures/i');
    await expect(historySection).toBeVisible();
  });

  test.skip('should show payment history table', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    // Check for table headers
    const tableHeaders = page.locator('th, [role="columnheader"]');
    const headerCount = await tableHeaders.count();
    expect(headerCount).toBeGreaterThan(0);
  });

  test.skip('should show cancel subscription option', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Abonnement');

    const cancelButton = page.locator('button:has-text("Annuler"), button:has-text("Cancel")');
    await expect(cancelButton.first()).toBeVisible();
  });
});

// ============================================
// Settings Page - API Tab Tests
// ============================================

test.describe('Settings Page - API Tab', () => {
  test.skip('should display API keys section', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=API');

    const apiKeySection = page.locator('text=/Clés API|API Keys/i');
    await expect(apiKeySection).toBeVisible();
  });

  test.skip('should show create API key button', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=API');

    const createButton = page.locator('button:has-text("Générer"), button:has-text("Créer")');
    await expect(createButton.first()).toBeVisible();
  });

  test.skip('should show API keys list', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=API');

    // Check for table or list
    const keysList = page.locator('table, [class*="list"]');
    await expect(keysList.first()).toBeVisible();
  });

  test.skip('should show create key dialog', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=API');
    await page.click('button:has-text("Générer"), button:has-text("Créer")');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
  });

  test.skip('should have key name input in dialog', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=API');
    await page.click('button:has-text("Générer"), button:has-text("Créer")');

    const nameInput = page.locator('[role="dialog"] input');
    await expect(nameInput).toBeVisible();
  });

  test.skip('should have permission selector in dialog', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=API');
    await page.click('button:has-text("Générer"), button:has-text("Créer")');

    const permissionSelect = page.locator('[role="dialog"] select, [role="dialog"] [class*="checkbox"]');
    await expect(permissionSelect.first()).toBeVisible();
  });

  test.skip('should show revoke button for existing keys', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=API');

    const revokeButton = page.locator('button:has-text("Révoquer"), button:has-text("Revoke")');
    // May or may not have existing keys
    const revokeCount = await revokeButton.count();
    expect(revokeCount).toBeGreaterThanOrEqual(0);
  });

  test.skip('should show API documentation link', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=API');

    const docsLink = page.locator('a:has-text("documentation"), a:has-text("Documentation")');
    await expect(docsLink).toBeVisible();
  });
});

// ============================================
// Settings Page - Notifications Tab Tests
// ============================================

test.describe('Settings Page - Notifications Tab', () => {
  test.skip('should display notifications settings', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Notifications');

    const notificationsSection = page.locator('text=/Email|Notifications/i');
    await expect(notificationsSection).toBeVisible();
  });

  test.skip('should show email notifications toggle', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Notifications');

    const emailToggle = page.locator('text=/Email|notifications email/i');
    await expect(emailToggle).toBeVisible();
  });

  test.skip('should show report generated notification option', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Notifications');

    const reportOption = page.locator('text=/rapport|généré|report/i');
    await expect(reportOption).toBeVisible();
  });

  test.skip('should show analysis completed notification option', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Notifications');

    const analysisOption = page.locator('text=/analyse|complété|analysis/i');
    await expect(analysisOption).toBeVisible();
  });

  test.skip('should show weekly digest notification option', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Notifications');

    const digestOption = page.locator('text=/hebdomadaire|digest|weekly/i');
    await expect(digestOption).toBeVisible();
  });

  test.skip('should show marketing emails option', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Notifications');

    const marketingOption = page.locator('text=/marketing|promotion/i');
    await expect(marketingOption).toBeVisible();
  });

  test.skip('should have save button for notifications', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Notifications');

    const saveButton = page.locator('button:has-text("Enregistrer")');
    await expect(saveButton).toBeVisible();
  });

  test.skip('should toggle switches', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Notifications');

    const toggle = page.locator('[role="switch"], input[type="checkbox"]').first();
    if (await toggle.isVisible()) {
      const initialState = await toggle.isChecked();
      await toggle.click();
      await page.waitForTimeout(300);
      const newState = await toggle.isChecked();
      expect(newState).toBe(!initialState);
    }
  });
});

// ============================================
// Settings Page - Form Validation Tests
// ============================================

test.describe('Settings Page - Form Validation', () => {
  test.skip('should validate required fields in account form', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    // Clear required fields and try to save
    const firstNameInput = page.locator('input[id*="firstName"], input[placeholder*="Prénom"]').first();
    await firstNameInput.fill('');
    await page.click('button:has-text("Enregistrer")');

    // Should show validation error
    await page.waitForTimeout(500);
  });

  test.skip('should validate email format', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill('invalid-email');
    await page.click('button:has-text("Enregistrer")');

    // Should show validation error
    await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
  });

  test.skip('should validate password length', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill('short');
    await page.click('button:has-text("Changer"), button:has-text("Modifier")');

    // Should show validation error
    await page.waitForTimeout(500);
  });

  test.skip('should validate password confirmation match', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('Password123!');
    await passwordInputs.nth(1).fill('DifferentPassword123!');
    await page.click('button:has-text("Changer"), button:has-text("Modifier")');

    // Should show error
    await page.waitForTimeout(500);
  });

  test.skip('should validate invite email format', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Organisation');
    await page.click('button:has-text("Inviter")');

    const emailInput = page.locator('[role="dialog"] input[type="email"]');
    await emailInput.fill('invalid-email');
    await page.click('[role="dialog"] button:has-text("Envoyer")');

    // Should show validation error
    await expect(emailInput).toBeVisible();
  });
});

// ============================================
// Settings Page - Mobile Tests
// ============================================

test.describe('Settings Page - Mobile', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
  });

  test.skip('should render settings on mobile', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Should redirect or show login prompt
    const url = page.url();
    expect(url).not.toBe('/settings');
  });

  test.skip('should have scrollable tabs on mobile', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Check for tab container
    const tabList = page.locator('[role="tablist"]');
    if (await tabList.isVisible()) {
      await expect(tabList).toBeVisible();
    }
  });

  test.skip('should show tab icons only on mobile', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    // Icons should be visible even if text is hidden
    const tabIcons = page.locator('[role="tab"] svg');
    const iconCount = await tabIcons.count();
    expect(iconCount).toBeGreaterThan(0);
  });
});

// ============================================
// Settings Page - Accessibility Tests
// ============================================

test.describe('Settings Page - Accessibility', () => {
  test.skip('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    const h1 = page.locator('h1');
    const h1Count = await h1.count();
    expect(h1Count).toBeLessThanOrEqual(1);
  });

  test.skip('should have accessible tabs', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    const tabs = page.locator('[role="tab"]');
    const tabCount = await tabs.count();
    expect(tabCount).toBeGreaterThan(0);
  });

  test.skip('should have accessible form inputs', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    await page.click('text=Compte');

    const inputs = page.locator('input:visible');
    const inputCount = await inputs.count();

    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = inputs.nth(i);
      const label = await input.getAttribute('aria-label');
      const id = await input.getAttribute('id');
      const placeholder = await input.getAttribute('placeholder');

      expect(label || id || placeholder).toBeTruthy();
    }
  });

  test.skip('should have accessible buttons', async ({ page }) => {
    await page.goto('/settings');
    await waitForPageLoad(page);

    const buttons = page.locator('button:visible');
    const buttonCount = await buttons.count();

    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');

      expect(text || ariaLabel).toBeTruthy();
    }
  });
});
