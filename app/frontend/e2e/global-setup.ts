import { chromium, FullConfig } from '@playwright/test';

export default async function globalSetup(config: FullConfig) {
  const baseURL = (config.projects[0].use as any).baseURL || 'http://localhost:5173';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const email = process.env.E2E_EMAIL || 'operator@caseflow.com';
  const password = process.env.E2E_PASSWORD || 'operator123';

  try {
    await page.goto(baseURL + '/login');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(baseURL + '/');
    // Wait for a stable dashboard indicator
    await page.waitForSelector('text=CaseFlow', { timeout: 15000 });
    await context.storageState({ path: './e2e/.auth.json' });
    console.log('[globalSetup] Stored authenticated state to e2e/.auth.json');
  } catch (err) {
    console.error('[globalSetup] Failed to create authenticated state:', err);
  } finally {
    await browser.close();
  }
}
