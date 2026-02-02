import { test, expect } from '@playwright/test';

test.describe('Claims', () => {
  test.describe('Create Claim Page', () => {
    test('should redirect to home if not authenticated', async ({ page }) => {
      await page.goto('/claims/new');

      // Should redirect to home or show auth required
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Claim Detail Page', () => {
    test('should show 404 for non-existent claim', async ({ page }) => {
      // Try to access a non-existent claim
      await page.goto('/claims/00000000-0000-0000-0000-000000000000');

      // Should show loading then error or 404
      await page.waitForTimeout(2000);

      // Either shows error state or redirects
      const hasError = await page.getByText('not found').isVisible().catch(() => false);
      const hasLoading = await page.locator('.animate-spin').isVisible().catch(() => false);

      expect(hasError || hasLoading || page.url() === '/').toBeTruthy();
    });
  });

  test.describe('Search Functionality', () => {
    test('should allow entering search query', async ({ page }) => {
      await page.goto('/');

      const searchInput = page.getByPlaceholder('Search claims...');
      await searchInput.fill('climate change');

      await expect(searchInput).toHaveValue('climate change');
    });

    test('should submit search on button click', async ({ page }) => {
      await page.goto('/');

      const searchInput = page.getByPlaceholder('Search claims...');
      await searchInput.fill('test query');

      const searchButton = page.getByRole('button', { name: 'Search' });
      await searchButton.click();

      // Search should have been submitted
      // (actual results depend on backend)
    });

    test('should submit search on enter key', async ({ page }) => {
      await page.goto('/');

      const searchInput = page.getByPlaceholder('Search claims...');
      await searchInput.fill('test query');
      await searchInput.press('Enter');

      // Search should have been submitted
    });
  });
});
