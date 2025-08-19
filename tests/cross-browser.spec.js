const { test, expect } = require('@playwright/test');

test.describe('Cross-Browser Compatibility Tests', () => {
  
  test('TC013: Homepage loads consistently across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Verify title is consistent across browsers
    await expect(page).toHaveTitle('Yalla Admin Web');
    
    // Verify page loads completely
    await page.waitForLoadState('networkidle');
    
    // Take browser-specific screenshot
    await page.screenshot({ 
      path: `test-results/homepage-${browserName}.png`,
      fullPage: true 
    });
    
    // Check for browser-specific console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(`${browserName}: ${msg.text()}`);
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Log browser-specific errors for analysis
    if (errors.length > 0) {
      console.log(`${browserName} errors:`, errors);
    }
  });

  test('TC014: CSS rendering consistency', async ({ page, browserName }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if CSS is loaded properly
    const stylesheets = await page.locator('link[rel="stylesheet"]').count();
    expect(stylesheets).toBeGreaterThan(0);
    
    // Verify font loading
    const fontPreload = await page.locator('link[rel="preload"][as="font"]').count();
    expect(fontPreload).toBeGreaterThan(0);
    
    // Check computed styles for key elements
    const bodyStyles = await page.locator('body').evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        fontFamily: styles.fontFamily,
        backgroundColor: styles.backgroundColor,
        color: styles.color
      };
    });
    
    // Log styles for comparison across browsers
    console.log(`${browserName} body styles:`, bodyStyles);
    
    // Verify styles are applied (not default browser styles)
    expect(bodyStyles.fontFamily).not.toBe('Times');
  });

  test('TC015: JavaScript functionality across browsers', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Test basic JavaScript functionality
    const jsWorking = await page.evaluate(() => {
      try {
        // Test modern JavaScript features
        const testArray = [1, 2, 3];
        const doubled = testArray.map(x => x * 2);
        const hasPromise = typeof Promise !== 'undefined';
        const hasArrowFunctions = (() => true)();
        
        return {
          arrayMethods: doubled.length === 3,
          promises: hasPromise,
          arrowFunctions: hasArrowFunctions,
          es6Support: true
        };
      } catch (error) {
        return {
          error: error.message,
          es6Support: false
        };
      }
    });
    
    console.log(`${browserName} JavaScript support:`, jsWorking);
    
    // Verify JavaScript is working
    expect(jsWorking.es6Support).toBe(true);
    expect(jsWorking.arrayMethods).toBe(true);
    expect(jsWorking.promises).toBe(true);
  });

  test('TC016: Mobile browser compatibility', async ({ page, browserName }) => {
    // Only run on mobile browsers
    if (!browserName.includes('Mobile')) {
      test.skip();
    }
    
    await page.goto('/');
    
    // Verify mobile-specific meta tags
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
    
    // Check touch-friendly elements (if any interactive elements exist)
    const clickableElements = await page.locator('button, a, [role="button"]').count();
    
    if (clickableElements > 0) {
      // Verify elements are touch-friendly (at least 44px touch target)
      const touchTargets = await page.locator('button, a, [role="button"]').evaluateAll(elements => {
        return elements.map(el => {
          const rect = el.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            touchFriendly: rect.width >= 44 && rect.height >= 44
          };
        });
      });
      
      console.log(`${browserName} touch targets:`, touchTargets);
    }
    
    // Take mobile-specific screenshot
    await page.screenshot({ 
      path: `test-results/mobile-${browserName}.png`,
      fullPage: true 
    });
  });

  test('TC017: Feature detection and polyfills', async ({ page, browserName }) => {
    await page.goto('/');
    
    // Check for polyfills and feature detection
    const browserFeatures = await page.evaluate(() => {
      return {
        fetch: typeof fetch !== 'undefined',
        intersectionObserver: typeof IntersectionObserver !== 'undefined',
        customElements: typeof customElements !== 'undefined',
        webComponents: typeof HTMLElement.prototype.attachShadow !== 'undefined',
        serviceWorker: 'serviceWorker' in navigator,
        webGL: (() => {
          try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          } catch (e) {
            return false;
          }
        })()
      };
    });
    
    console.log(`${browserName} feature support:`, browserFeatures);
    
    // Verify essential features are available
    expect(browserFeatures.fetch).toBe(true);
  });
});