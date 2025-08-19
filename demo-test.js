// Quick demo test to verify the setup works
const { test, expect } = require('@playwright/test');

test('Demo: Verify Yalla Admin Web is accessible', async ({ page }) => {
  console.log('🚀 Testing Yalla Admin Web accessibility...');
  
  // Navigate to the application
  const response = await page.goto('https://admin-dev.yalla.systems');
  
  // Verify basic accessibility
  expect(response.status()).toBe(200);
  console.log('✅ Site is accessible (HTTP 200)');
  
  // Verify title
  await expect(page).toHaveTitle('Yalla Admin Web');
  console.log('✅ Page title is correct');
  
  // Verify security headers
  const headers = response.headers();
  expect(headers['x-frame-options']).toBe('DENY');
  expect(headers['strict-transport-security']).toContain('max-age=63072000');
  console.log('✅ Security headers are properly configured');
  
  // Take a screenshot
  await page.screenshot({ path: 'demo-screenshot.png' });
  console.log('✅ Screenshot saved as demo-screenshot.png');
  
  console.log('🎉 Demo test completed successfully!');
});