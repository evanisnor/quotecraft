const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8080';
const CALCULATOR_ID = 'ff30b9ed-46f7-4782-a2f3-ca65feebab08';
const EMAIL = 'e2etest@quotecraft.test';
const PASSWORD = 'securepassword';
const SCREENSHOTS_DIR = '/Users/evan/Code/github.com/evanisnor/quotecraft/e2e/screenshots';

const results = [];

function pass(name, detail = '') {
  console.log(`[PASS] ${name}${detail ? ': ' + detail : ''}`);
  results.push({ name, status: 'PASS', detail });
}

function fail(name, detail = '') {
  console.error(`[FAIL] ${name}${detail ? ': ' + detail : ''}`);
  results.push({ name, status: 'FAIL', detail });
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 150 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // ==========================================================================
    // AC3 (pre-check): Config endpoint returns branding_removable: false
    // Validate the server-side feature flag before opening the browser
    // ==========================================================================
    console.log('--- AC3: Verifying config endpoint returns branding_removable: false ---');
    const configResponse = await page.request.get(
      `${API_BASE_URL}/v1/calculators/${CALCULATOR_ID}/config`
    );
    if (configResponse.ok()) {
      const configBody = await configResponse.json();
      const brandingRemovable = configBody?.data?.feature_flags?.branding_removable;
      if (brandingRemovable === false) {
        pass(
          'AC3: Config endpoint returns feature_flags.branding_removable = false',
          `branding_removable=${brandingRemovable}`
        );
      } else {
        fail(
          'AC3: Config endpoint returns feature_flags.branding_removable = false',
          `Got branding_removable=${JSON.stringify(brandingRemovable)}`
        );
      }
    } else {
      fail(
        'AC3: Config endpoint returns feature_flags.branding_removable = false',
        `HTTP ${configResponse.status()}`
      );
    }

    // --- Step 1: Log in ---
    console.log('--- Logging in ---');
    await page.goto(`${TARGET_URL}/login`);
    await page.waitForSelector('input[aria-label="Email"]', { timeout: 10000 });
    await page.fill('input[aria-label="Email"]', EMAIL);
    await page.fill('input[aria-label="Password"]', PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    pass('Login and redirect to dashboard');

    // --- Step 2: Navigate to the calculator editor ---
    console.log('--- Navigating to editor ---');
    await page.goto(`${TARGET_URL}/editor/${CALCULATOR_ID}`);
    await page.waitForSelector('h1:has-text("Calculator Editor")', { timeout: 10000 });

    // Give the editor time to fetch the config from the API and apply feature flags
    await page.waitForTimeout(1500);
    pass('Editor page loaded');

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a002-01-editor.png` });

    // ==========================================================================
    // AC1: Badge renders at the bottom of the calculator preview in the editor
    //
    // The badge lives in CalculatorPreviewForm inside a PreviewPane (Shadow DOM).
    // We query it via JavaScript evaluation against the shadow root.
    // ==========================================================================
    console.log('--- AC1: Badge renders in the calculator preview pane ---');

    const shadowHost = page.locator('[data-testid="preview-shadow-host"]');
    const shadowHostCount = await shadowHost.count();

    if (shadowHostCount === 0) {
      fail('AC1: PreviewPane shadow host element found', '[data-testid="preview-shadow-host"] not found');
    } else {
      pass('AC1: PreviewPane shadow host element found');

      // Access badge inside shadow DOM via JavaScript evaluation
      const badgeInfo = await page.evaluate(() => {
        const host = document.querySelector('[data-testid="preview-shadow-host"]');
        if (!host || !host.shadowRoot) {
          return { found: false, reason: 'shadow root not found' };
        }
        const badge = host.shadowRoot.querySelector('.qc-badge');
        if (!badge) {
          return { found: false, reason: '.qc-badge not found in shadow root' };
        }
        const rect = badge.getBoundingClientRect();
        return {
          found: true,
          text: badge.textContent,
          href: badge.getAttribute('href'),
          target: badge.getAttribute('target'),
          rel: badge.getAttribute('rel'),
          tagName: badge.tagName.toLowerCase(),
          isVisible: rect.width > 0 && rect.height > 0,
        };
      });

      await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a002-02-preview-pane.png` });

      if (badgeInfo.found) {
        pass('AC1: Badge (.qc-badge) is present in the shadow DOM preview pane');

        // Check visibility
        if (badgeInfo.isVisible) {
          pass('AC1: Badge is visible (non-zero bounding rect)');
        } else {
          fail('AC1: Badge is visible (non-zero bounding rect)', 'Badge has zero bounding rect — not visible');
          await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a002-badge-not-visible.png` });
        }

        // Check the badge is an anchor tag
        if (badgeInfo.tagName === 'a') {
          pass('AC1: Badge is rendered as an anchor (<a>) element');
        } else {
          fail('AC1: Badge is rendered as an anchor (<a>) element', `tagName=${badgeInfo.tagName}`);
        }

        // ==========================================================================
        // AC2: Badge links to the QuoteCraft homepage (https://quotecraft.io)
        // ==========================================================================
        console.log('--- AC2: Verifying badge link href ---');
        if (badgeInfo.href === 'https://quotecraft.io') {
          pass('AC2: Badge href links to https://quotecraft.io', `href="${badgeInfo.href}"`);
        } else {
          fail('AC2: Badge href links to https://quotecraft.io', `href="${badgeInfo.href}"`);
        }

        // Check badge text
        const badgeText = (badgeInfo.text || '').trim();
        if (badgeText === 'Powered by QuoteCraft') {
          pass('AC2: Badge text is "Powered by QuoteCraft"', `text="${badgeText}"`);
        } else {
          fail('AC2: Badge text is "Powered by QuoteCraft"', `text="${badgeText}"`);
        }

        // Check target and rel for safe external link
        if (badgeInfo.target === '_blank') {
          pass('Badge has target="_blank"');
        } else {
          fail('Badge has target="_blank"', `target="${badgeInfo.target}"`);
        }
        if (badgeInfo.rel === 'noopener noreferrer') {
          pass('Badge has rel="noopener noreferrer"');
        } else {
          fail('Badge has rel="noopener noreferrer"', `rel="${badgeInfo.rel}"`);
        }
      } else {
        fail('AC1: Badge (.qc-badge) is present in the shadow DOM preview pane', badgeInfo.reason);
        // Fallback: check if badge is accessible outside shadow DOM (e.g., portal rendered in light DOM)
        const lightBadge = page.locator('.qc-badge');
        const lightBadgeCount = await lightBadge.count();
        if (lightBadgeCount > 0) {
          fail(
            'AC1: Badge is in shadow DOM (not light DOM)',
            `Badge found in light DOM but not shadow root — shadow DOM isolation may be broken`
          );
        } else {
          fail('AC1: Badge is not present anywhere on the page', 'Cannot check AC2 or AC3 badge-related criteria');
        }
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a002-badge-missing.png` });
      }
    }

    // ==========================================================================
    // AC3 (continued): Badge is in footer at the bottom of the form (server-controlled)
    //
    // Verify the footer element wraps the badge — this proves badge placement
    // is inside the form footer, consistent with server-controlled rendering.
    // ==========================================================================
    console.log('--- AC3: Badge is inside the form footer (server-controlled placement) ---');

    const footerBadgeInfo = await page.evaluate(() => {
      const host = document.querySelector('[data-testid="preview-shadow-host"]');
      if (!host || !host.shadowRoot) {
        return { found: false, reason: 'shadow root not found' };
      }
      const footer = host.shadowRoot.querySelector('form[aria-label="Calculator Preview Form"] > footer');
      if (!footer) {
        return { found: false, reason: 'No <footer> inside the Calculator Preview Form in shadow DOM' };
      }
      const badge = footer.querySelector('.qc-badge');
      return {
        found: !!badge,
        footerFound: true,
        reason: badge ? '' : '.qc-badge not found inside form footer',
      };
    });

    if (footerBadgeInfo.footerFound) {
      pass('AC3: <footer> element is present inside the Calculator Preview Form');
      if (footerBadgeInfo.found) {
        pass('AC3: Badge is inside the <footer> at the bottom of the Calculator Preview Form');
      } else {
        fail('AC3: Badge is inside the <footer> at the bottom of the Calculator Preview Form', footerBadgeInfo.reason);
      }
    } else {
      fail('AC3: <footer> element present in Calculator Preview Form', footerBadgeInfo.reason);
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a002-03-badge.png` });

    // --- Check for console errors ---
    if (consoleErrors.length === 0) {
      pass('No console errors during the test flow');
    } else {
      fail('No console errors during the test flow', consoleErrors.join('; '));
    }

  } catch (err) {
    fail('Unexpected error during test', err.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a002-error.png` });
    console.error('Stack:', err.stack);
  } finally {
    await browser.close();

    // --- Summary ---
    console.log('\n======= TEST SUMMARY =======');
    const passed = results.filter((r) => r.status === 'PASS');
    const failed = results.filter((r) => r.status === 'FAIL');
    results.forEach((r) => {
      const icon = r.status === 'PASS' ? 'PASS' : 'FAIL';
      console.log(`[${icon}] ${r.name}${r.detail ? ': ' + r.detail : ''}`);
    });
    console.log(`\nTotal: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length}`);
    if (failed.length > 0) {
      console.log('\nFailed tests:');
      failed.forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
      process.exit(1);
    } else {
      console.log('\nAll tests passed.');
      process.exit(0);
    }
  }
})();
