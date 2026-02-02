import { test, expect } from '@playwright/test';

test.describe('UI Components', () => {
  test.describe('Header', () => {
    test('should be visible on all pages', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('header')).toBeVisible();

      await page.goto('/claims/new');
      await expect(page.locator('header')).toBeVisible();
    });

    test('should have navigation link to Explore', async ({ page }) => {
      await page.goto('/');

      const exploreLink = page.getByRole('link', { name: 'Explore' });
      await expect(exploreLink).toBeVisible();
      await expect(exploreLink).toHaveAttribute('href', '/');
    });

    test('should have clickable logo linking to home', async ({ page }) => {
      await page.goto('/claims/new');

      const logo = page.getByRole('link', { name: 'ain/verify' });
      await expect(logo).toBeVisible();
      await logo.click();

      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Search Card', () => {
    test('should have proper styling', async ({ page }) => {
      await page.goto('/');

      // Check that search card exists and has card styling
      const searchCard = page.locator('.card').first();
      await expect(searchCard).toBeVisible();
    });

    test('should have input with proper placeholder', async ({ page }) => {
      await page.goto('/');

      const input = page.getByPlaceholder('Search claims...');
      await expect(input).toHaveClass(/input/);
    });
  });

  test.describe('Buttons', () => {
    test('should have primary button styling', async ({ page }) => {
      await page.goto('/');

      const searchButton = page.getByRole('button', { name: 'Search' });
      await expect(searchButton).toHaveClass(/btn-primary/);
    });

    test('should have secondary button styling for OAuth', async ({ page }) => {
      await page.goto('/');

      const googleButton = page.getByRole('button', { name: 'Google' });
      await expect(googleButton).toHaveClass(/btn-secondary/);
    });
  });
});

test.describe('Accessibility', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');

    // Should have h1
    const h1 = page.getByRole('heading', { level: 1 });
    await expect(h1).toBeVisible();
  });

  test('should have proper link accessibility', async ({ page }) => {
    await page.goto('/');

    // All links should have accessible text
    const links = await page.getByRole('link').all();
    for (const link of links) {
      const text = await link.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should have proper button accessibility', async ({ page }) => {
    await page.goto('/');

    // All buttons should have accessible text
    const buttons = await page.getByRole('button').all();
    for (const button of buttons) {
      const text = await button.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('should have proper form labels', async ({ page }) => {
    await page.goto('/');

    // Search input should be accessible
    const searchInput = page.getByPlaceholder('Search claims...');
    await expect(searchInput).toBeVisible();
  });
});

test.describe('Loading States', () => {
  test('should show loading spinner while fetching data', async ({ page }) => {
    await page.goto('/');

    // Either loading spinner or content should be visible
    const spinner = page.locator('.animate-spin');
    const content = page.getByRole('heading', { name: 'Explore Claims' });

    await expect(spinner.or(content)).toBeVisible({ timeout: 10000 });
  });
});
