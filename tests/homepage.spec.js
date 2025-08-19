const { test, expect } = require('@playwright/test');

test.describe('Homepage Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/');
  });

  test('TC001: Homepage loads successfully', async ({ page }) => {
    // Verify page loads with correct title
    await expect(page).toHaveTitle('Yalla Admin Web');
    
    // Verify page is loaded (no loading states)
    await page.waitForLoadState('networkidle');
    
    // Check for any console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait a bit to catch any console errors
    await page.waitForTimeout(2000);
    
    // Assert no critical console errors
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && // Ignore favicon errors
      !error.includes('404') // Ignore 404 errors for resources
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('TC002: Page has correct meta information', async ({ page }) => {
    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content');
    expect(description).toBe('Book appointments with qualified doctors easily');
    
    // Check viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    // Check charset
    const charset = await page.locator('meta[charset]').getAttribute('charset');
    expect(charset).toBe('utf-8');
  });

  test('TC003: Security headers are present', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    // Check security headers
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['strict-transport-security']).toContain('max-age=63072000');
    expect(headers['content-security-policy']).toBeTruthy();
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });

  test('TC004: Page is responsive', async ({ page }) => {
    // Test desktop resolution
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for desktop
    await page.screenshot({ path: 'test-results/desktop-1920x1080.png' });
    
    // Test tablet resolution
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for tablet
    await page.screenshot({ path: 'test-results/tablet-768x1024.png' });
    
    // Test mobile resolution
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for mobile
    await page.screenshot({ path: 'test-results/mobile-375x667.png' });
    
    // Verify page is still functional on mobile
    await expect(page).toHaveTitle('Yalla Admin Web');
  });

  test('TC005: Performance metrics are acceptable', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Measure performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
    });
    
    // Assert reasonable performance metrics (adjust thresholds as needed)
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
    expect(performanceMetrics.loadComplete).toBeLessThan(5000); // 5 seconds
    
    console.log('Performance Metrics:', performanceMetrics);
  });

  test('TC006: Accessibility basics', async ({ page }) => {
    // Check for proper HTML structure
    const htmlLang = await page.locator('html').getAttribute('lang');
    expect(htmlLang).toBe('en');
    
    // Check for ARIA landmarks
    const notifications = await page.locator('[role="region"][aria-label*="Notifications"]');
    await expect(notifications).toBeVisible();
    
    // Check for proper heading structure (if any headings exist)
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count();
    if (headings > 0) {
      // If headings exist, ensure h1 is present
      await expect(page.locator('h1')).toHaveCount({ min: 1 });
    }
  });
});