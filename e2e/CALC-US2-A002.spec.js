const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const TEST_CALCULATOR_ID = 'test-calc-id-e2e-final';

const results = [];

function pass(name, detail) {
  results.push({ status: 'PASS', name, detail });
  console.log(`PASS: ${name}${detail ? ' — ' + detail : ''}`);
}

function fail(name, detail) {
  results.push({ status: 'FAIL', name, detail });
  console.log(`FAIL: ${name}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // Track unexpected JS errors (exclude known API errors)
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('ERR_CONNECTION_REFUSED') && !text.includes('net::ERR')) {
        consoleErrors.push(text);
      }
    }
  });

  try {
    // Setup: inject fake auth token
    await page.goto(TARGET_URL);
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'e2e-fake-token-for-testing');
    });

    await page.goto(`${TARGET_URL}/editor/${TEST_CALCULATOR_ID}`);
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1000);

    const url = page.url();
    if (url.includes('/editor/')) {
      pass('Setup: Editor page loaded successfully');
    } else {
      fail('Setup: Editor page not loaded', `URL: ${url}`);
      await browser.close();
      return;
    }

    // Helper: get the FormulaInput container element which wraps label + input + error
    // We scope alert lookups to the FormulaInput's parent <div> — not the preview pane
    async function getFormulaInputAlerts() {
      return await page.evaluate(() => {
        // Find the label specifically for the formula expression (not just the first label)
        const labels = Array.from(document.querySelectorAll('label'));
        const label = labels.find(l => l.textContent?.trim() === 'Formula expression');
        if (!label) return [];
        const inputEl = document.getElementById(label.getAttribute('for') || '');
        if (!inputEl) return [];
        // Walk up to the wrapping div
        const container = inputEl.closest('div');
        if (!container) return [];
        const alerts = container.querySelectorAll('[role="alert"]');
        return Array.from(alerts).map(a => a.textContent || '');
      });
    }

    // AC1: Formula input absent before any output, visible after adding one

    const formulaBeforeAdd = await page.getByLabel('Formula expression').isVisible().catch(() => false);
    if (!formulaBeforeAdd) {
      pass('AC1-pre: Formula expression input absent before any output added');
    } else {
      fail('AC1-pre: Formula expression input should not be present before adding an output');
    }

    await page.getByRole('button', { name: /add output/i }).click();
    await page.waitForTimeout(500);

    const formulaAfterAdd = await page.getByLabel('Formula expression').isVisible().catch(() => false);
    if (formulaAfterAdd) {
      pass('AC1: Formula expression input visible after adding an output (auto-selected)');
    } else {
      fail('AC1: Formula expression input not visible after adding an output');
      await browser.close();
      return;
    }

    const formulaInput = page.getByLabel('Formula expression');

    // AC2: Valid formula "1 + 2" — no error in FormulaInput

    await formulaInput.fill('1 + 2');
    await page.waitForTimeout(400);

    const alertsValid = await getFormulaInputAlerts();
    const nonEmptyAlertsValid = alertsValid.filter(t => t.trim() !== '');
    if (nonEmptyAlertsValid.length === 0) {
      pass('AC2: No inline error shown for valid formula "1 + 2"');
    } else {
      fail('AC2: Inline error shown for valid formula "1 + 2"', `Alerts: ${nonEmptyAlertsValid.join(', ')}`);
    }

    const ariaInvalidValid = await formulaInput.getAttribute('aria-invalid');
    if (ariaInvalidValid === 'false') {
      pass('AC2-aria: aria-invalid="false" for valid formula');
    } else {
      fail('AC2-aria: Expected aria-invalid="false"', `Got: ${ariaInvalidValid}`);
    }

    await page.screenshot({ path: '/tmp/final-ac2-valid.png' });

    // AC2 variant: valid formula with variable syntax

    await formulaInput.fill('{qty} * {price}');
    await page.waitForTimeout(400);

    const alertsVarFormula = await getFormulaInputAlerts();
    const nonEmptyAlertsVar = alertsVarFormula.filter(t => t.trim() !== '');
    if (nonEmptyAlertsVar.length === 0) {
      pass('AC2-var: No FormulaInput error for valid variable formula "{qty} * {price}"');
    } else {
      fail('AC2-var: FormulaInput shows error for valid variable formula "{qty} * {price}"', `Alerts: ${nonEmptyAlertsVar.join(', ')}`);
    }

    await page.screenshot({ path: '/tmp/final-ac2-var-formula.png' });

    // AC3: Invalid formula "1 +" — inline error shown

    await formulaInput.fill('1 +');
    await page.waitForTimeout(400);

    const alertsInvalid = await getFormulaInputAlerts();
    const nonEmptyAlertsInvalid = alertsInvalid.filter(t => t.trim() !== '');
    if (nonEmptyAlertsInvalid.length > 0) {
      pass('AC3: Inline error shown for invalid formula "1 +"', `Error: "${nonEmptyAlertsInvalid[0]}"`);
    } else {
      fail('AC3: No inline error shown for invalid formula "1 +"');
    }

    const ariaInvalidInvalid = await formulaInput.getAttribute('aria-invalid');
    if (ariaInvalidInvalid === 'true') {
      pass('AC3-aria: aria-invalid="true" for invalid formula');
    } else {
      fail('AC3-aria: Expected aria-invalid="true"', `Got: ${ariaInvalidInvalid}`);
    }

    await page.screenshot({ path: '/tmp/final-ac3-invalid.png' });

    // AC4: Clearing input removes the error

    await formulaInput.fill('');
    await page.waitForTimeout(400);

    const alertsAfterClear = await getFormulaInputAlerts();
    const nonEmptyAlertsAfterClear = alertsAfterClear.filter(t => t.trim() !== '');
    if (nonEmptyAlertsAfterClear.length === 0) {
      pass('AC4: Error cleared when formula input is emptied');
    } else {
      fail('AC4: Error persists after clearing formula input', `Alerts: ${nonEmptyAlertsAfterClear.join(', ')}`);
    }

    const ariaInvalidClear = await formulaInput.getAttribute('aria-invalid');
    if (ariaInvalidClear === 'false') {
      pass('AC4-aria: aria-invalid="false" after clearing');
    } else {
      fail('AC4-aria: Expected aria-invalid="false" after clearing', `Got: ${ariaInvalidClear}`);
    }

    await page.screenshot({ path: '/tmp/final-ac4-cleared.png' });

    // Extra: switching to valid formula after invalid removes error

    await formulaInput.fill('1 +');
    await page.waitForTimeout(400);
    await formulaInput.fill('1 + 2');
    await page.waitForTimeout(400);

    const alertsAfterFix = await getFormulaInputAlerts();
    const nonEmptyAlertsAfterFix = alertsAfterFix.filter(t => t.trim() !== '');
    if (nonEmptyAlertsAfterFix.length === 0) {
      pass('Extra: Error cleared when invalid formula corrected to valid "1 + 2"');
    } else {
      fail('Extra: Error persists after correcting formula to valid', `Alerts: ${nonEmptyAlertsAfterFix.join(', ')}`);
    }

    await page.screenshot({ path: '/tmp/final-ac-extra.png' });

    // JS errors check
    if (consoleErrors.length === 0) {
      pass('No unexpected JS console errors');
    } else {
      fail('Unexpected JS console errors', consoleErrors.join('; '));
    }

  } catch (err) {
    fail('Unexpected test error', err.message);
    await page.screenshot({ path: '/tmp/final-error.png' });
  } finally {
    await browser.close();

    console.log('\n========== TEST SUMMARY ==========');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    results.forEach(r => {
      console.log(`${r.status === 'PASS' ? '[ PASS ]' : '[ FAIL ]'} ${r.name}${r.detail ? ' — ' + r.detail : ''}`);
    });
    console.log(`\nVERDICT: ${failed === 0 ? 'PASS' : 'FAIL'}`);
  }
})();
