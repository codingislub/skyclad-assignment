import { test, expect } from '@playwright/test';

// Accessibility checks (unauthenticated login page)

test.describe('Accessibility', () => {
  test('login form tab order', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email address')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /sign in/i })).toBeFocused();
  });
});
