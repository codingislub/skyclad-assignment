import { test, expect } from '@playwright/test';

// Use persisted authenticated storage state
test.use({ storageState: './e2e/.auth.json' });

test.describe('Cases Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cases');
    await expect(page.locator('[data-testid="cases-table"]')).toBeVisible({ timeout: 15000 });
  });

  test('displays cases list', async ({ page }) => {
    const count = await page.locator('[data-testid="case-row"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('filters cases by status', async ({ page }) => {
    await page.selectOption('select[name="status"]', 'PENDING');
    await page.waitForTimeout(6500); // debounce + fetch
    const count = await page.locator('[data-testid="case-row"]').count();
    expect(count).toBeGreaterThan(0);
  });

  test('searches cases by ID fragment', async ({ page }) => {
    const search = page.locator('input[name="search"]');
    await search.fill('C-');
    await page.waitForTimeout(6500); // debounce + fetch
    const count = await page.locator('[data-testid="case-row"]').count();
    expect(count).toBeGreaterThan(0);
  });
});
