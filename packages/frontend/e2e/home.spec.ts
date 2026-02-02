import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should display the header with branding', async ({ page }) => {
    await page.goto('/');

    // Check header
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByText('ain/verify')).toBeVisible();
  });

  test('should display the explore claims section', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.getByRole('heading', { name: 'Explore Claims' })).toBeVisible();

    // Check description
    await expect(
      page.getByText('Discover and verify claims through collective evidence and consensus')
    ).toBeVisible();
  });

  test('should display search functionality', async ({ page }) => {
    await page.goto('/');

    // Check search input
    const searchInput = page.getByPlaceholder('Search claims...');
    await expect(searchInput).toBeVisible();

    // Check search button
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
  });

  test('should display sort options', async ({ page }) => {
    await page.goto('/');

    // Check sort buttons
    await expect(page.getByRole('button', { name: 'Recent' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Gradient' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Most Voted' })).toBeVisible();
  });

  test('should show empty state when no claims', async ({ page }) => {
    await page.goto('/');

    // Check empty state message (when backend is not running or no claims)
    await expect(
      page.getByText('No claims found').or(page.locator('.animate-spin'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should display login buttons when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Check OAuth buttons
    await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'GitHub' })).toBeVisible();
  });

  test('should change sort order when clicking sort buttons', async ({ page }) => {
    await page.goto('/');

    // Click different sort buttons and verify they become active
    const gradientButton = page.getByRole('button', { name: 'Gradient' });
    await gradientButton.click();

    // Check that the button has the active class (blue background)
    await expect(gradientButton).toHaveClass(/bg-blue-100/);

    const mostVotedButton = page.getByRole('button', { name: 'Most Voted' });
    await mostVotedButton.click();
    await expect(mostVotedButton).toHaveClass(/bg-blue-100/);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // Header should still be visible
    await expect(page.locator('header')).toBeVisible();

    // Main content should be visible
    await expect(page.getByRole('heading', { name: 'Explore Claims' })).toBeVisible();
  });
});
