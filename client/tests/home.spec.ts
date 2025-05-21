import { test, expect } from '@playwright/test';

test('homepage loads successfully', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page loads
  await expect(page.locator('body')).toBeVisible();
  
  // Take a screenshot to verify the page loaded
  await page.screenshot({ path: 'test-results/homepage.png' });
});
