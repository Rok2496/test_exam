const { test, expect } = require('@playwright/test');

test.describe('Security Tests', () => {
  
  test('TC018: Content Security Policy validation', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    const csp = headers['content-security-policy'];
    expect(csp).toBeTruthy();
    
    // Verify CSP directives
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("style-src 'self'");
    expect(csp).toContain("img-src 'self'");
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain("frame-src 'none'");
    
    // Log full CSP for analysis
    console.log('Content Security Policy:', csp);
  });

  test('TC019: HTTPS enforcement', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    // Verify HSTS header
    const hsts = headers['strict-transport-security'];
    expect(hsts).toBeTruthy();
    expect(hsts).toContain('max-age=63072000');
    expect(hsts).toContain('includeSubDomains');
    expect(hsts).toContain('preload');
    
    // Verify the connection is HTTPS
    expect(page.url()).toMatch(/^https:/);
  });

  test('TC020: Clickjacking protection', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    // Verify X-Frame-Options header
    const frameOptions = headers['x-frame-options'];
    expect(frameOptions).toBe('DENY');
  });

  test('TC021: MIME type sniffing protection', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    // Verify X-Content-Type-Options header
    const contentTypeOptions = headers['x-content-type-options'];
    expect(contentTypeOptions).toBe('nosniff');
  });

  test('TC022: Referrer policy validation', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    // Verify Referrer-Policy header
    const referrerPolicy = headers['referrer-policy'];
    expect(referrerPolicy).toBe('strict-origin-when-cross-origin');
  });

  test('TC023: Permissions policy validation', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    // Verify Permissions-Policy header
    const permissionsPolicy = headers['permissions-policy'];
    expect(permissionsPolicy).toBeTruthy();
    expect(permissionsPolicy).toContain('camera=()');
    expect(permissionsPolicy).toContain('microphone=()');
    expect(permissionsPolicy).toContain('geolocation=()');
    expect(permissionsPolicy).toContain('payment=()');
  });

  test('TC024: XSS protection validation', async ({ page }) => {
    // Test for potential XSS vulnerabilities by checking if scripts are properly sanitized
    await page.goto('/');
    
    // Check if inline scripts are properly handled by CSP
    const inlineScriptBlocked = await page.evaluate(() => {
      try {
        // Try to execute inline script (should be blocked by CSP)
        const script = document.createElement('script');
        script.innerHTML = 'window.xssTest = true;';
        document.head.appendChild(script);
        return !window.xssTest;
      } catch (error) {
        return true; // Script was blocked
      }
    });
    
    expect(inlineScriptBlocked).toBe(true);
  });

  test('TC025: Information disclosure check', async ({ page }) => {
    const response = await page.goto('/');
    const headers = response.headers();
    
    // Check that sensitive server information is not disclosed
    expect(headers['server']).not.toContain('Apache/');
    expect(headers['server']).not.toContain('Microsoft-IIS/');
    
    // Verify no sensitive headers are exposed
    expect(headers['x-powered-by']).toBeUndefined();
    expect(headers['x-aspnet-version']).toBeUndefined();
    
    // Check response body doesn't contain sensitive information
    const content = await page.content();
    expect(content).not.toMatch(/password/i);
    expect(content).not.toMatch(/secret/i);
    expect(content).not.toMatch(/api[_-]?key/i);
  });

  test('TC026: Cookie security (if cookies are set)', async ({ page, context }) => {
    await page.goto('/');
    
    // Get all cookies
    const cookies = await context.cookies();
    
    if (cookies.length > 0) {
      cookies.forEach(cookie => {
        console.log(`Cookie: ${cookie.name}`, {
          secure: cookie.secure,
          httpOnly: cookie.httpOnly,
          sameSite: cookie.sameSite
        });
        
        // Verify security attributes for HTTPS
        if (page.url().startsWith('https://')) {
          expect(cookie.secure).toBe(true);
        }
        
        // Verify HttpOnly for session cookies
        if (cookie.name.toLowerCase().includes('session') || 
            cookie.name.toLowerCase().includes('auth')) {
          expect(cookie.httpOnly).toBe(true);
        }
      });
    } else {
      console.log('No cookies found on initial page load');
    }
  });

  test('TC027: Resource loading security', async ({ page }) => {
    await page.goto('/');
    
    // Monitor network requests to ensure they're from allowed origins
    const requests = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        resourceType: request.resourceType()
      });
    });
    
    await page.waitForLoadState('networkidle');
    
    // Verify all resources are loaded from allowed origins
    const externalResources = requests.filter(req => 
      !req.url.startsWith('https://admin-dev.yalla.systems') &&
      !req.url.startsWith('https://dev.yalla.systems') &&
      !req.url.startsWith('data:') &&
      !req.url.startsWith('blob:')
    );
    
    // Log external resources for review
    if (externalResources.length > 0) {
      console.log('External resources loaded:', externalResources);
    }
    
    // Check for potentially unsafe external resources
    const unsafeResources = externalResources.filter(req => 
      req.url.startsWith('http://') || // Non-HTTPS
      req.url.includes('eval') ||
      req.url.includes('javascript:')
    );
    
    expect(unsafeResources).toHaveLength(0);
  });
});