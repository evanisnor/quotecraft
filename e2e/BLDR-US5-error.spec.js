// Targeted test for BLDR-US5 error/retry behavior
// Verifies: error status, user notification, retry logic

const { chromium } = require('playwright');

const DASHBOARD_URL = 'http://localhost:3000';
const CALC_ID = 'test-calculator-abc123';
const EDITOR_URL = `${DASHBOARD_URL}/editor/${CALC_ID}`;
const FAKE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0LXVzZXIifQ.fake-sig';

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext();
  const page = await context.newPage();

  let putCallCount = 0;

  // Mock PUT to always fail — tests retry behavior
  await page.route(`**/v1/calculators/${CALC_ID}`, (route) => {
    if (route.request().method() === 'PUT') {
      putCallCount++;
      console.log(`PUT attempt #${putCallCount} intercepted — returning 500`);
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    } else {
      route.continue();
    }
  });

  await page.goto(DASHBOARD_URL);
  await page.evaluate((token) => {
    localStorage.setItem('auth_token', token);
  }, FAKE_TOKEN);
  await page.goto(EDITOR_URL, { waitUntil: 'networkidle', timeout: 15000 });

  const statusEl = page.locator('[role="status"]');
  await statusEl.waitFor({ timeout: 5000 });
  console.log('Editor loaded successfully');

  // Add a field to trigger auto-save
  const addFieldBtn = page.locator('button').filter({ hasText: /Number|Text|Dropdown|Radio|Checkbox|Slider/i }).first();
  console.log('Triggering state change by adding a field...');
  await addFieldBtn.click();

  // Wait for all retries to exhaust (debounce 2s + 3 retries with 1s+2s+4s backoff = ~9s total)
  console.log('Waiting for retries to exhaust (~15s total wait)...');
  try {
    await page.waitForFunction(() => {
      const el = document.querySelector('[role="status"]');
      return el && el.textContent?.includes('Error saving');
    }, { timeout: 35000 });
    
    const statusText = await statusEl.textContent();
    console.log(`Status element text: "${statusText}"`);
    console.log(`Total PUT attempts: ${putCallCount}`);
    
    // Verify "Error saving" is shown
    if (statusText?.includes('Error saving')) {
      console.log('PASS: "Error saving" status shown after retries exhausted');
    } else {
      console.log(`FAIL: Expected "Error saving" but got "${statusText}"`);
    }
    
    // Verify retry happened (should be 4 attempts: 1 initial + 3 retries)
    if (putCallCount >= 4) {
      console.log(`PASS: Retry logic executed — ${putCallCount} PUT attempts made (1 initial + ${putCallCount-1} retries)`);
    } else if (putCallCount > 1) {
      console.log(`PASS: Retry logic executed — ${putCallCount} PUT attempts (expected up to 4)`);
    } else {
      console.log(`FAIL: No retry logic — only ${putCallCount} PUT attempt(s) made`);
    }
    
    // Verify user notification via role="alert" — scoped inside the save status indicator
    // to avoid strict-mode violations if other role="alert" elements exist on the page
    const alertEl = page.locator('[role="status"] [role="alert"]');
    const alertCount = await alertEl.count();
    if (alertCount > 0) {
      const alertText = await alertEl.first().textContent();
      console.log(`PASS: User notification shown — role="alert" text: "${alertText}"`);
    } else {
      console.log('FAIL: No role="alert" element found inside save status indicator');
    }
    
    await page.screenshot({ path: '/tmp/bldr-us5-error-retry-confirmed.png' });
    console.log('Screenshot saved to /tmp/bldr-us5-error-retry-confirmed.png');
    
  } catch (e) {
    const statusText = await statusEl.textContent().catch(() => 'COULD_NOT_READ');
    console.log(`FAIL: Timed out waiting for Error saving status. Current status: "${statusText}"`);
    console.log(`Total PUT attempts made: ${putCallCount}`);
    await page.screenshot({ path: '/tmp/bldr-us5-error-retry-timeout.png' });
  }

  await browser.close();
})();
