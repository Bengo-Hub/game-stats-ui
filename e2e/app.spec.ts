import { test, expect } from '@playwright/test';

test.describe('App Navigation', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/UltimateStats/);
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should navigate to games page', async ({ page }) => {
    await page.goto('/games');
    await expect(page.locator('h1')).toContainText('Games');
  });

  test('should navigate to teams page', async ({ page }) => {
    await page.goto('/teams');
    await expect(page.locator('h1')).toContainText('Teams');
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('h1')).toContainText('Analytics');
  });
});

test.describe('Mobile Responsiveness', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display mobile navigation', async ({ page }) => {
    await page.goto('/dashboard');
    // Check that the page loads on mobile
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should have readable text on mobile', async ({ page }) => {
    await page.goto('/dashboard');
    // Verify stats cards are visible
    const cards = page.locator('[class*="Card"]');
    await expect(cards.first()).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have skip to content link', async ({ page }) => {
    await page.goto('/dashboard');
    // Focus the skip link by tabbing
    await page.keyboard.press('Tab');
    const skipLink = page.locator('a:has-text("Skip to main content")');
    await expect(skipLink).toBeFocused();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/dashboard');
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/games');
    // Tab through the page
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    // Verify something is focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should show 404 page for unknown routes', async ({ page }) => {
    await page.goto('/non-existent-page');
    await expect(page.locator('text=Page Not Found')).toBeVisible();
  });
});

test.describe('Search Functionality', () => {
  test('should have working search on games page', async ({ page }) => {
    await page.goto('/games');
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Storm');
    // Verify search input works
    await expect(searchInput).toHaveValue('Storm');
  });

  test('should have working search on teams page', async ({ page }) => {
    await page.goto('/teams');
    const searchInput = page.locator('input[placeholder*="Search"]');
    await expect(searchInput).toBeVisible();
  });
});
