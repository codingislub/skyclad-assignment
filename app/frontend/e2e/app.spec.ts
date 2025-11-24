import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should redirect to login page when not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/.*login/);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Email address').fill('operator@caseflow.com');
    await page.getByLabel('Password').fill('operator123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel('Email address').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.click('button[type="submit"]');
    
    await expect(page.locator('text=/invalid|error/i')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email address').fill('operator@caseflow.com');
    await page.getByLabel('Password').fill('operator123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/');
    
    // Logout
    await page.click('button:has-text("Logout")');
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('CSV Import Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email address').fill('operator@caseflow.com');
    await page.getByLabel('Password').fill('operator123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should navigate to import page', async ({ page }) => {
    await page.click('a:has-text("Import")');
    await expect(page).toHaveURL(/.*import/);
    await expect(page.locator('text=/upload/i')).toBeVisible();
  });

  test('should upload and validate CSV file', async ({ page }) => {
    await page.goto('/import');
    
    // Upload file
    const fileInput = page.locator('input[type="file"]');
    // Path adjusted to reach repository root sample file from app/frontend working directory
    await fileInput.setInputFiles('../../sample-cases.csv');
    
    // Wait for validation
    await expect(page.locator('text=/validating|processing/i')).toBeVisible();
    await expect(page.locator('text=/valid|error/i')).toBeVisible({ timeout: 10000 });
  });

  test('should display validation errors', async ({ page }) => {
    await page.goto('/import');
    
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('../../sample-cases.csv');
    
    // Check for error indicators
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Case Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel('Email address').fill('operator@caseflow.com');
    await page.getByLabel('Password').fill('operator123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
  });

  test('should display cases list', async ({ page }) => {
    await page.click('a:has-text("Cases")');
    await expect(page).toHaveURL(/.*cases/);
    await expect(page.locator('[data-testid="cases-table"]')).toBeVisible();
  });

  test('should filter cases', async ({ page }) => {
    await page.goto('/cases');
    
    // Apply filter
    await page.click('button:has-text("Filter")');
    await page.selectOption('select[name="status"]', 'PENDING');
    await page.click('button:has-text("Apply")');
    
    // Check filtered results
    await expect(page.locator('[data-testid="case-row"]')).toHaveCount(1, { timeout: 5000 });
  });

  test('should search cases', async ({ page }) => {
    await page.goto('/cases');
    
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('C-1001');
    
    await expect(page.locator('text=C-1001')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Accessibility', () => {
  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email address')).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Password')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.getByLabel('Email address');
    await expect(emailInput).toBeVisible();

    const passwordInput = page.getByLabel('Password');
    await expect(passwordInput).toBeVisible();
  });
});
