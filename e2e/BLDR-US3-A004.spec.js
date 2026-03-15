const { chromium } = require('playwright');
const path = require('path');

const TARGET_URL = 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');

const results = [];

function record(name, status, detail) {
  results.push({ name, status, detail });
  const icon = status === 'PASS' ? 'PASS' : status === 'FAIL' ? 'FAIL' : 'SKIP';
  console.log(`[${icon}] ${name}${detail ? ': ' + detail : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // =========================================================
    // Setup: Register + Create Calculator
    // =========================================================
    console.log('\n=== Setup: Register and create calculator ===');
    await page.goto(`${TARGET_URL}/register`);
    await page.waitForLoadState('networkidle');

    const ts = Date.now();
    await page.fill('input[aria-label="Email"]', `e2e-cre-${ts}@test.com`);
    await page.fill('input[aria-label="Password"]', 'TestPass123!');
    await page.fill('input[aria-label="Confirm password"]', 'TestPass123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('Authenticated');

    const newCalcBtn = page.locator('button').filter({ hasText: /new calculator/i });
    await newCalcBtn.waitFor({ state: 'visible', timeout: 5000 });
    await newCalcBtn.click();
    await page.waitForURL('**/editor/**', { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    console.log('Editor loaded:', page.url());

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/bldr-us3-a004-01-editor.png` });

    // =========================================================
    // AC1: "Conditional visibility rules" section is visible
    // =========================================================
    console.log('\n=== AC1: Conditional visibility rules section is visible ===');

    const rulesSection = page.locator('[aria-label="Conditional visibility rules"]');
    const sectionVisible = await rulesSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (sectionVisible) {
      record('AC1: Conditional visibility rules section visible', 'PASS',
        'Section with aria-label="Conditional visibility rules" is rendered');
    } else {
      record('AC1: Conditional visibility rules section visible', 'FAIL',
        'Section with aria-label="Conditional visibility rules" not found in DOM');
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/bldr-us3-a004-02-rules-section.png` });

    // =========================================================
    // AC2: "Add rule" button is disabled when no fields exist
    // =========================================================
    console.log('\n=== AC2: Add rule button disabled with no fields ===');

    const addRuleBtn = rulesSection.locator('button', { hasText: /^Add rule$/i });
    const addRuleBtnVisible = await addRuleBtn.isVisible({ timeout: 3000 }).catch(() => false);

    if (!addRuleBtnVisible) {
      record('AC2: Add rule button visible', 'FAIL', '"Add rule" button not found in the section');
    } else {
      const isDisabled = await addRuleBtn.isDisabled();
      if (isDisabled) {
        record('AC2: Add rule button disabled when no fields exist', 'PASS',
          '"Add rule" button is disabled before any fields are added');
      } else {
        record('AC2: Add rule button disabled when no fields exist', 'FAIL',
          '"Add rule" button is NOT disabled despite no fields existing');
      }
    }

    // =========================================================
    // AC3: After adding a field, "Add rule" button becomes enabled
    // =========================================================
    console.log('\n=== AC3: Add rule button enabled after adding a field ===');

    // Add a field using the field type palette
    const textFieldBtn = page.locator('button').filter({ hasText: /^Text$/i }).first();
    const textBtnVisible = await textFieldBtn.isVisible({ timeout: 3000 }).catch(() => false);

    let fieldAdded = false;
    if (textBtnVisible) {
      await textFieldBtn.click();
      await page.waitForTimeout(500);
      fieldAdded = true;
      console.log('Added Text field');
    } else {
      // Try any available field type
      const anyTypeBtn = page.locator('button').filter({ hasText: /^(Number|Slider|Dropdown|Checkbox|Radio)$/i }).first();
      if (await anyTypeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        const btnText = await anyTypeBtn.textContent();
        await anyTypeBtn.click();
        await page.waitForTimeout(500);
        fieldAdded = true;
        console.log(`Added ${btnText} field`);
      } else {
        console.log('WARNING: Could not find any field type palette button');
      }
    }

    if (fieldAdded) {
      const isDisabledAfterField = await addRuleBtn.isDisabled();
      if (!isDisabledAfterField) {
        record('AC3: Add rule button enabled after adding a field', 'PASS',
          '"Add rule" button becomes enabled when at least one field exists');
      } else {
        record('AC3: Add rule button enabled after adding a field', 'FAIL',
          '"Add rule" button remains disabled after adding a field');
      }
    } else {
      record('AC3: Add rule button enabled after adding a field', 'NOT TESTED',
        'Could not add a field to enable the button');
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/bldr-us3-a004-03-after-field.png` });

    // =========================================================
    // AC4: Clicking "Add rule" adds a rule row with correct elements
    // =========================================================
    console.log('\n=== AC4: Clicking Add rule adds a rule row ===');

    const addRuleEnabled = await addRuleBtn.isEnabled().catch(() => false);
    if (!addRuleEnabled) {
      record('AC4: Add rule button clickable', 'FAIL',
        '"Add rule" button is not enabled — cannot test rule row creation');
    } else {
      // Count rules before
      const rulesBefore = await rulesSection.locator('div').filter({ has: page.locator('button[aria-label^="Delete rule"]') }).count();
      console.log('Rules before clicking Add rule:', rulesBefore);

      await addRuleBtn.click();
      await page.waitForTimeout(500);

      await page.screenshot({ path: `${SCREENSHOTS_DIR}/bldr-us3-a004-04-rule-added.png` });

      // Check for rule 1 elements using aria-labels from the component
      const targetFieldSelect = rulesSection.locator('select[aria-label="Rule 1 target field"]');
      const sourceFieldSelect = rulesSection.locator('select[aria-label="Rule 1 source field"]');
      const operatorSelect = rulesSection.locator('select[aria-label="Rule 1 operator"]');
      const valueInput = rulesSection.locator('input[aria-label="Rule 1 value"]');
      const deleteBtn = rulesSection.locator('button[aria-label="Delete rule 1"]');
      const whenText = rulesSection.locator('span', { hasText: 'when' }).first();
      const showText = rulesSection.locator('span', { hasText: 'Show' }).first();

      const targetVisible = await targetFieldSelect.isVisible({ timeout: 3000 }).catch(() => false);
      const sourceVisible = await sourceFieldSelect.isVisible({ timeout: 3000 }).catch(() => false);
      const operatorVisible = await operatorSelect.isVisible({ timeout: 3000 }).catch(() => false);
      const valueVisible = await valueInput.isVisible({ timeout: 3000 }).catch(() => false);
      const deleteBtnVisible = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false);
      const whenVisible = await whenText.isVisible({ timeout: 2000 }).catch(() => false);
      const showVisible = await showText.isVisible({ timeout: 2000 }).catch(() => false);

      console.log('Rule row elements:');
      console.log('  "Show" text:', showVisible);
      console.log('  Target field select:', targetVisible);
      console.log('  "when" text:', whenVisible);
      console.log('  Source field select:', sourceVisible);
      console.log('  Operator select:', operatorVisible);
      console.log('  Value input:', valueVisible);
      console.log('  Delete button:', deleteBtnVisible);

      // Verify target field select has the added field as option
      if (targetVisible) {
        record('AC4: Rule row - target field select present', 'PASS',
          'Select for target field (Rule 1 target field) is visible');
      } else {
        record('AC4: Rule row - target field select present', 'FAIL',
          'Target field select not found in rule row');
      }

      if (whenVisible) {
        record('AC4: Rule row - "when" text present', 'PASS', '"when" text is visible');
      } else {
        record('AC4: Rule row - "when" text present', 'FAIL', '"when" text not visible');
      }

      if (sourceVisible) {
        record('AC4: Rule row - source field select present', 'PASS',
          'Select for source field (Rule 1 source field) is visible');
      } else {
        record('AC4: Rule row - source field select present', 'FAIL',
          'Source field select not found in rule row');
      }

      if (operatorVisible) {
        record('AC4: Rule row - operator select present', 'PASS',
          'Operator select (Rule 1 operator) is visible');

        // Verify operators include =, >, <
        const operatorOptions = await operatorSelect.locator('option').allInnerTexts();
        console.log('  Operator options:', operatorOptions);
        const hasEquals = operatorOptions.some(op => op.trim() === '=');
        const hasGreater = operatorOptions.some(op => op.trim() === '>');
        const hasLess = operatorOptions.some(op => op.trim() === '<');

        if (hasEquals && hasGreater && hasLess) {
          record('AC4: Operator select includes equals, greater-than, less-than', 'PASS',
            `Operators: ${operatorOptions.join(', ')}`);
        } else {
          record('AC4: Operator select includes equals, greater-than, less-than', 'FAIL',
            `Expected =, >, < but got: ${operatorOptions.join(', ')}`);
        }
      } else {
        record('AC4: Rule row - operator select present', 'FAIL',
          'Operator select not found in rule row');
      }

      if (valueVisible) {
        record('AC4: Rule row - value text input present', 'PASS',
          'Text input for value (Rule 1 value) is visible');
      } else {
        record('AC4: Rule row - value text input present', 'FAIL',
          'Value text input not found in rule row');
      }

      if (deleteBtnVisible) {
        record('AC4: Rule row - Delete button present', 'PASS',
          '"Delete" button (Delete rule 1) is visible');
      } else {
        record('AC4: Rule row - Delete button present', 'FAIL',
          'Delete button not found in rule row');
      }

      // =========================================================
      // AC5: Rule is included in the config when saving
      // =========================================================
      console.log('\n=== AC5: visibilityRules included in PUT request body when saving ===');

      // Intercept PUT requests to observe the payload
      let capturedPutBody = null;
      await page.route('**/v1/calculators/**', async (route) => {
        const request = route.request();
        if (request.method() === 'PUT') {
          capturedPutBody = request.postDataJSON();
          console.log('  Intercepted PUT body (keys):', Object.keys(capturedPutBody || {}));
        }
        // Continue the request regardless
        await route.continue();
      });

      // Click Save button (SaveStatusIndicator)
      const saveBtn = page.locator('button').filter({ hasText: /^Save$/i }).first();
      const saveBtnVisible = await saveBtn.isVisible({ timeout: 3000 }).catch(() => false);
      if (saveBtnVisible) {
        await saveBtn.click();
        await page.waitForTimeout(1500);
      } else {
        // Auto-save may trigger; wait a moment
        await page.waitForTimeout(3000);
      }

      if (capturedPutBody !== null) {
        const configPayload = capturedPutBody.config;
        const hasVisibilityRules = configPayload !== undefined && Object.prototype.hasOwnProperty.call(configPayload, 'visibilityRules');
        if (hasVisibilityRules && configPayload !== undefined) {
          const rules = configPayload.visibilityRules;
          if (Array.isArray(rules) && rules.length > 0) {
            record('AC5: visibilityRules in PUT body with at least one rule', 'PASS',
              `PUT body.visibilityRules has ${rules.length} rule(s)`);
          } else if (Array.isArray(rules)) {
            record('AC5: visibilityRules in PUT body (empty array)', 'FAIL',
              'visibilityRules key present but array is empty — rule was not saved');
          } else {
            record('AC5: visibilityRules in PUT body', 'FAIL',
              `visibilityRules present but not an array: ${JSON.stringify(rules)}`);
          }
        } else {
          record('AC5: visibilityRules in PUT body', 'FAIL',
            `PUT body does not contain visibilityRules key. Keys: ${Object.keys(capturedPutBody).join(', ')}`);
        }
      } else {
        record('AC5: visibilityRules in PUT body', 'NOT TESTED',
          'No PUT request was captured during the save attempt');
      }

      // Unroute to avoid interference
      await page.unrouteAll();

      // =========================================================
      // AC6: Clicking "Delete" on a rule removes it
      // =========================================================
      console.log('\n=== AC6: Clicking Delete removes the rule ===');

      await page.screenshot({ path: `${SCREENSHOTS_DIR}/bldr-us3-a004-05-before-delete.png` });

      const deleteRuleBtn = rulesSection.locator('button[aria-label="Delete rule 1"]');
      const deleteBtnStillVisible = await deleteRuleBtn.isVisible({ timeout: 3000 }).catch(() => false);

      if (!deleteBtnStillVisible) {
        record('AC6: Delete rule button visible before delete', 'FAIL',
          '"Delete rule 1" button not visible before attempting delete');
      } else {
        await deleteRuleBtn.click();
        await page.waitForTimeout(400);

        await page.screenshot({ path: `${SCREENSHOTS_DIR}/bldr-us3-a004-06-after-delete.png` });

        // Verify the rule row is gone
        const ruleRowGone = !(await rulesSection.locator('button[aria-label="Delete rule 1"]').isVisible({ timeout: 1000 }).catch(() => false));
        const noMoreSourceSelect = !(await rulesSection.locator('select[aria-label="Rule 1 source field"]').isVisible({ timeout: 1000 }).catch(() => false));

        if (ruleRowGone && noMoreSourceSelect) {
          record('AC6: Delete rule removes the rule row', 'PASS',
            'Rule 1 row elements are no longer visible after clicking Delete');
        } else {
          record('AC6: Delete rule removes the rule row', 'FAIL',
            'Rule row elements still visible after clicking Delete');
        }
      }
    }

    // =========================================================
    // Console errors check
    // =========================================================
    if (consoleErrors.length > 0) {
      console.log('\nConsole errors during test:');
      consoleErrors.forEach(e => console.log('  ERROR:', e));
    } else {
      console.log('\nNo console errors during test');
    }

    await page.screenshot({ path: `${SCREENSHOTS_DIR}/bldr-us3-a004-07-final.png`, fullPage: true });

  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    await page.screenshot({ path: `${SCREENSHOTS_DIR}/bldr-us3-a004-fatal.png` }).catch(() => {});
    record('Test execution', 'FAIL', err.message);
  } finally {
    await browser.close();
  }

  // =========================================================
  // Results summary
  // =========================================================
  console.log('\n====================================================');
  console.log('  BLDR-US3-A004 E2E TEST RESULTS');
  console.log('====================================================');

  const passes = results.filter(r => r.status === 'PASS').length;
  const fails = results.filter(r => r.status === 'FAIL').length;
  const notTested = results.filter(r => r.status === 'NOT TESTED').length;

  results.forEach(r => {
    const icon = r.status === 'PASS' ? 'PASS' : r.status === 'FAIL' ? 'FAIL' : 'SKIP';
    console.log(`  [${icon}] ${r.name}`);
    if (r.detail) console.log(`         ${r.detail}`);
  });

  console.log('\n----------------------------------------------------');
  console.log(`  Total: ${results.length} | Pass: ${passes} | Fail: ${fails} | Not Tested: ${notTested}`);
  const verdict = fails === 0 ? 'PASS' : 'FAIL';
  console.log(`  Verdict: ${verdict}`);
  console.log('====================================================\n');
})();
