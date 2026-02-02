import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.describe('OAuth Buttons', () => {
    test('should display Google login button', async ({ page }) => {
      await page.goto('/');

      const googleButton = page.getByRole('button', { name: 'Google' });
      await expect(googleButton).toBeVisible();
      await expect(googleButton).toBeEnabled();
    });

    test('should display GitHub login button', async ({ page }) => {
      await page.goto('/');

      const githubButton = page.getByRole('button', { name: 'GitHub' });
      await expect(githubButton).toBeVisible();
      await expect(githubButton).toBeEnabled();
    });
  });

  test.describe('OAuth Callback', () => {
    test('should handle missing code parameter', async ({ page }) => {
      // Navigate to callback without code
      await page.goto('/auth/callback/google');

      // Should show error
      await expect(page.getByText('Authentication Failed')).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('No authorization code received')).toBeVisible();
    });

    test('should display return home button on error', async ({ page }) => {
      await page.goto('/auth/callback/github');

      // Wait for error to appear
      await expect(page.getByText('Authentication Failed')).toBeVisible({ timeout: 5000 });

      // Return home button should be visible
      const returnButton = page.getByRole('button', { name: 'Return Home' });
      await expect(returnButton).toBeVisible();
    });

    test('should redirect to home when clicking return button', async ({ page }) => {
      await page.goto('/auth/callback/google');

      // Wait for error
      await expect(page.getByText('Authentication Failed')).toBeVisible({ timeout: 5000 });

      // Click return button
      await page.getByRole('button', { name: 'Return Home' }).click();

      // Should be on home page
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('Authenticated State', () => {
    test('should show login buttons when not authenticated', async ({ page }) => {
      // Clear any stored tokens
      await page.goto('/');
      await page.evaluate(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      });
      await page.reload();

      // Should see login buttons
      await expect(page.getByRole('button', { name: 'Google' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'GitHub' })).toBeVisible();
    });
  });
});
