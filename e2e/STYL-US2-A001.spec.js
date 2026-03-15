const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
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
    pass('Editor page loaded');

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a001-01-editor.png` });

    // =====================================================================
    // AC1: Badge renders at the bottom of the calculator preview in the builder
    // =====================================================================
    console.log('--- AC1: Badge renders at the bottom of the calculator preview ---');

    // The badge lives inside the CalculatorPreviewForm, inside a <footer>
    const badgeFooter = page.locator('footer:has(.qc-badge), footer:has([class*="qc-badge"])');
    const badgeLink = page.locator('.qc-badge');
    const badgeLinkCount = await badgeLink.count();

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a001-02-preview-pane.png` });

    if (badgeLinkCount > 0) {
      pass('AC1: Badge element with class "qc-badge" is present in the builder preview');
    } else {
      fail('AC1: Badge element with class "qc-badge" is present in the builder preview', '.qc-badge not found on page');
    }

    // =====================================================================
    // AC2: Badge text is "Powered by QuoteCraft"
    // =====================================================================
    console.log('--- AC2: Checking badge text ---');
    if (badgeLinkCount > 0) {
      const badgeText = await badgeLink.first().textContent();
      if (badgeText && badgeText.trim() === 'Powered by QuoteCraft') {
        pass('AC2: Badge text is "Powered by QuoteCraft"', `Found: "${badgeText.trim()}"`);
      } else {
        fail('AC2: Badge text is "Powered by QuoteCraft"', `Found: "${badgeText ? badgeText.trim() : '(empty)'}"`);
      }
    } else {
      fail('AC2: Badge text is "Powered by QuoteCraft"', 'Badge element not found, cannot check text');
    }

    // =====================================================================
    // AC3: Badge links to https://quotecraft.io
    // =====================================================================
    console.log('--- AC3: Checking badge link href ---');
    if (badgeLinkCount > 0) {
      const badgeHref = await badgeLink.first().getAttribute('href');
      if (badgeHref === 'https://quotecraft.io') {
        pass('AC3: Badge links to "https://quotecraft.io"', `href="${badgeHref}"`);
      } else {
        fail('AC3: Badge links to "https://quotecraft.io"', `href="${badgeHref}"`);
      }
    } else {
      fail('AC3: Badge links to "https://quotecraft.io"', 'Badge element not found, cannot check href');
    }

    // =====================================================================
    // AC4: Badge is visible when a calculator is open in the builder
    // =====================================================================
    console.log('--- AC4: Checking badge is visible ---');
    if (badgeLinkCount > 0) {
      const isVisible = await badgeLink.first().isVisible();
      if (isVisible) {
        pass('AC4: Badge is visible when a calculator is open in the builder');
      } else {
        fail('AC4: Badge is visible when a calculator is open in the builder', 'Badge exists but is not visible');
        await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a001-badge-not-visible.png` });
      }
    } else {
      fail('AC4: Badge is visible when a calculator is open in the builder', 'Badge element not found');
    }

    // Additional: badge has target="_blank" and rel="noopener noreferrer"
    console.log('--- Checking badge link attributes ---');
    if (badgeLinkCount > 0) {
      const target = await badgeLink.first().getAttribute('target');
      const rel = await badgeLink.first().getAttribute('rel');
      if (target === '_blank') {
        pass('Badge has target="_blank"');
      } else {
        fail('Badge has target="_blank"', `target="${target}"`);
      }
      if (rel === 'noopener noreferrer') {
        pass('Badge has rel="noopener noreferrer"');
      } else {
        fail('Badge has rel="noopener noreferrer"', `rel="${rel}"`);
      }
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a001-03-badge.png` });

    // --- Check for console errors ---
    if (consoleErrors.length === 0) {
      pass('No console errors during the test flow');
    } else {
      fail('No console errors during the test flow', consoleErrors.join('; '));
    }

  } catch (err) {
    fail('Unexpected error during test', err.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/styl-us2-a001-error.png` });
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
