const { test, expect } = require('@playwright/test');

test.describe('Error Handling Tests', () => {
  
  test('TC007: 404 page displays correctly', async ({ page }) => {
    // Navigate to a non-existent page
    const response = await page.goto('/nonexistent-page');
    
    // Verify 404 status code
    expect(response.status()).toBe(404);
    
    // Verify 404 page content
    await expect(page.locator('h1')).toContainText('404 - Page Not Found');
    await expect(page.locator('p')).toContainText('Sorry we couldn\'t find that page.');
    
    // Verify page styling is applied
    const h1Classes = await page.locator('h1').getAttribute('class');
    expect(h1Classes).toContain('text-4xl');
    expect(h1Classes).toContain('font-bold');
    
    // Verify SEO meta tag for 404
    const robotsMeta = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robotsMeta).toBe('noindex');
    
    // Take screenshot of 404 page
    await page.screenshot({ path: 'test-results/404-page.png' });
  });

  test('TC008: 404 page is accessible', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Check that 404 page maintains accessibility features
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
    
    // Verify proper heading hierarchy
    await expect(page.locator('h1')).toHaveCount(1);
    
    // Check for proper contrast (basic check)
    const h1Element = page.locator('h1');
    await expect(h1Element).toBeVisible();
  });

  test('TC009: Multiple invalid routes return 404', async ({ page }) => {
    const invalidRoutes = [
      '/admin/invalid',
      '/api/nonexistent',
      '/dashboard/fake',
      '/users/999999',
      '/settings/invalid'
    ];

    for (const route of invalidRoutes) {
      const response = await page.goto(route);
      expect(response.status()).toBe(404);
      
      // Verify consistent 404 page content
      await expect(page.locator('h1')).toContainText('404 - Page Not Found');
    }
  });

  test('TC010: Network error handling', async ({ page, context }) => {
    // Test with offline network conditions
    await context.setOffline(true);
    
    try {
      await page.goto('/', { timeout: 5000 });
    } catch (error) {
      // Expect network error when offline
      expect(error.message).toContain('net::ERR_INTERNET_DISCONNECTED');
    }
    
    // Restore network
    await context.setOffline(false);
    
    // Verify page loads after network restoration
    await page.goto('/');
    await expect(page).toHaveTitle('Yalla Admin Web');
  });

  test('TC011: Slow network conditions', async ({ page, context }) => {
    // Simulate slow 3G network
    await context.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Add 1s delay
      await route.continue();
    });

    const startTime = Date.now();
    await page.goto('/', { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;
    
    // Verify page still loads (though slowly)
    await expect(page).toHaveTitle('Yalla Admin Web');
    
    // Log load time for analysis
    console.log(`Page loaded in ${loadTime}ms under slow network conditions`);
    
    // Verify load time is reasonable even with simulated delay
    expect(loadTime).toBeLessThan(30000); // 30 seconds max
  });

  test('TC012: JavaScript disabled fallback', async ({ browser }) => {
    // Create context with JavaScript disabled
    const context = await browser.newContext({
      javaScriptEnabled: false
    });
    
    const page = await context.newPage();
    
    try {
      await page.goto('/');
      
      // Verify basic HTML structure is still present
      await expect(page.locator('html')).toBeVisible();
      await expect(page.locator('body')).toBeVisible();
      
      // Check if there's any fallback content or noscript tags
      const noscriptElements = await page.locator('noscript').count();
      console.log(`Found ${noscriptElements} noscript elements`);
      
    } finally {
      await context.close();
    }
  });
});