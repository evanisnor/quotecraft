const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000';
const FAKE_CALCULATOR_ID = 'test-calc-e2e-001';

const results = [];

function pass(name, detail) {
  results.push({ status: 'PASS', name, detail });
  console.log(`[PASS] ${name}${detail ? ': ' + detail : ''}`);
}

function fail(name, detail) {
  results.push({ status: 'FAIL', name, detail });
  console.log(`[FAIL] ${name}${detail ? ': ' + detail : ''}`);
}

function escapeId(id) {
  // Escape for use in CSS ID selector (handle colons and other special chars)
  return id.replace(/([:#.[\]])/g, '\\$1');
}

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // Capture console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  try {
    // Step 1: Navigate to the app and inject a fake auth token into localStorage
    await page.goto(TARGET_URL);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'fake-e2e-test-token');
    });
    console.log('Injected fake auth token into localStorage');

    // Step 2: Navigate directly to the editor route
    const editorUrl = `${TARGET_URL}/editor/${FAKE_CALCULATOR_ID}`;
    await page.goto(editorUrl);
    await page.waitForLoadState('networkidle');

    // Step 3: Verify the editor page rendered
    const h1 = page.locator('h1').filter({ hasText: 'Calculator Editor' }).first();
    const h1Visible = await h1.isVisible().catch(() => false);
    if (h1Visible) {
      pass('Editor page renders', 'h1 "Calculator Editor" is visible');
    } else {
      const bodyText = await page.textContent('body');
      fail('Editor page renders', `h1 not found. Body: "${bodyText?.substring(0, 200)}"`);
    }

    await page.screenshot({ path: '/tmp/calc-us2-a003-01-editor-loaded.png' });
    console.log('Screenshot: /tmp/calc-us2-a003-01-editor-loaded.png');

    // Step 4: Add a "Number Input" field using the field type palette
    // From the buttons discovered: 'Number Input' is the label
    const numberButton = page.locator('button', { hasText: 'Number Input' }).first();
    const numberButtonVisible = await numberButton.isVisible().catch(() => false);
    if (numberButtonVisible) {
      await numberButton.click();
      pass('Add Number Input field', 'Clicked "Number Input" button in field palette');
    } else {
      const allButtons = await page.locator('button').allTextContents();
      fail('Add Number Input field', `Button not found. Available: ${allButtons.join(', ')}`);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/calc-us2-a003-02-after-add-field.png' });
    console.log('Screenshot: /tmp/calc-us2-a003-02-after-add-field.png');

    // Note: Number Input field label → variable name "number_input" via generateVariableName
    // Default value for number field with no defaultValue → 0
    // So {number_input} * 2 → 0 * 2 → 0

    // Step 5: Add a formula output using the "Add output" button
    const addOutputButton = page.locator('button', { hasText: /add output/i }).first();
    const addOutputVisible = await addOutputButton.isVisible().catch(() => false);
    if (addOutputVisible) {
      await addOutputButton.click();
      pass('Add output button clicked', '"Add output" button clicked');
    } else {
      const allButtons2 = await page.locator('button').allTextContents();
      fail('Add output button found', `Not found. Available: ${allButtons2.join(', ')}`);
    }

    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/calc-us2-a003-03-after-add-output.png' });
    console.log('Screenshot: /tmp/calc-us2-a003-03-after-add-output.png');

    // Step 6: Verify FormulaInput is visible (output auto-selected on add)
    const formulaLabel = page.locator('label', { hasText: /formula expression/i }).first();
    const formulaLabelVisible = await formulaLabel.isVisible().catch(() => false);

    if (!formulaLabelVisible) {
      // Try clicking the first output in the list
      const outputItem = page.locator('section[aria-label="Formula outputs"] button').first();
      const outputItemVisible = await outputItem.isVisible().catch(() => false);
      if (outputItemVisible) {
        await outputItem.click();
        await page.waitForTimeout(500);
      }
    }

    const formulaLabelFinal = page.locator('label', { hasText: /formula expression/i }).first();
    const formulaLabelFinalVisible = await formulaLabelFinal.isVisible().catch(() => false);
    if (!formulaLabelFinalVisible) {
      const pageContent = await page.textContent('main').catch(() => '');
      fail('Formula expression label visible', `Not found. Main: "${pageContent?.substring(0, 300)}"`);
      await page.screenshot({ path: '/tmp/calc-us2-a003-formula-missing.png' });
    } else {
      pass('Formula expression input visible', 'FormulaInput rendered after adding/selecting output');
    }

    // Get the formula input element via the label's "for" attribute
    const labelFor = await formulaLabelFinal.getAttribute('for').catch(() => null);
    console.log(`Formula label "for" attribute: "${labelFor}"`);

    // Use page.getByLabel() which handles the label-for association
    const theFormulaInput = page.getByLabel('Formula expression');

    // ----------------------------------------------------------------
    // TEST 1: Preview not shown when expression is empty
    // ----------------------------------------------------------------
    console.log('\n--- TEST 1: Preview hidden when expression is empty ---');
    // Make sure input is empty
    await theFormulaInput.fill('');
    await page.waitForTimeout(200);

    const previewWhenEmpty = page.locator('[data-testid="formula-preview"], output[aria-label="Formula result preview"]');
    const previewVisibleWhenEmpty = await previewWhenEmpty.isVisible().catch(() => false);
    if (!previewVisibleWhenEmpty) {
      pass('Preview hidden when expression is empty', 'No preview element visible for empty expression');
    } else {
      const previewText = await previewWhenEmpty.textContent();
      fail('Preview hidden when expression is empty', `Preview visible with: "${previewText}"`);
    }

    await page.screenshot({ path: '/tmp/calc-us2-a003-04-empty-expression.png' });
    console.log('Screenshot: /tmp/calc-us2-a003-04-empty-expression.png');

    // ----------------------------------------------------------------
    // TEST 2: Type "42" → Preview shows "Preview: 42"
    // ----------------------------------------------------------------
    console.log('\n--- TEST 2: Type "42" → Preview shows "Preview: 42" ---');
    await theFormulaInput.click();
    await theFormulaInput.fill('42');
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/calc-us2-a003-05-formula-42.png' });
    console.log('Screenshot: /tmp/calc-us2-a003-05-formula-42.png');

    const previewAfter42 = page.locator('[data-testid="formula-preview"], output[aria-label="Formula result preview"]');
    const previewAfter42Visible = await previewAfter42.isVisible().catch(() => false);
    if (!previewAfter42Visible) {
      fail('Preview shown for constant formula "42"', 'Preview element not visible after typing "42"');
    } else {
      const previewText = await previewAfter42.textContent();
      console.log(`Preview text for "42": "${previewText}"`);
      if (previewText && previewText.includes('Preview:') && previewText.includes('42')) {
        pass('Preview shows "Preview: 42" for constant formula', `Got: "${previewText}"`);
      } else {
        fail('Preview shows correct result for "42"', `Expected "Preview: 42" but got: "${previewText}"`);
      }
    }

    // ----------------------------------------------------------------
    // TEST 3: Preview updates as expression changes → type "100"
    // ----------------------------------------------------------------
    console.log('\n--- TEST 3: Preview updates when expression changes to "100" ---');
    await theFormulaInput.fill('100');
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/calc-us2-a003-06-formula-100.png' });
    console.log('Screenshot: /tmp/calc-us2-a003-06-formula-100.png');

    const previewAfter100 = page.locator('[data-testid="formula-preview"], output[aria-label="Formula result preview"]');
    const preview100Visible = await previewAfter100.isVisible().catch(() => false);
    const preview100Text = preview100Visible ? await previewAfter100.textContent() : '';
    console.log(`Preview text for "100": "${preview100Text}"`);
    if (preview100Visible && preview100Text && preview100Text.includes('100')) {
      pass('Preview updates as expression changes', `Changed to 100, preview shows: "${preview100Text}"`);
    } else {
      fail('Preview updates as expression changes', `Expected "Preview: 100" but got: "${preview100Text}" (visible: ${preview100Visible})`);
    }

    // ----------------------------------------------------------------
    // TEST 4: Preview hidden when expression is cleared
    // ----------------------------------------------------------------
    console.log('\n--- TEST 4: Preview hidden when expression is cleared ---');
    await theFormulaInput.fill('');
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/calc-us2-a003-07-formula-cleared.png' });
    console.log('Screenshot: /tmp/calc-us2-a003-07-formula-cleared.png');

    const previewAfterClear = page.locator('[data-testid="formula-preview"], output[aria-label="Formula result preview"]');
    const previewVisibleAfterClear = await previewAfterClear.isVisible().catch(() => false);
    if (!previewVisibleAfterClear) {
      pass('Preview hidden when expression cleared', 'Preview element not visible after clearing expression');
    } else {
      const clearText = await previewAfterClear.textContent();
      fail('Preview hidden when expression cleared', `Preview still visible with: "${clearText}"`);
    }

    // ----------------------------------------------------------------
    // TEST 5: Invalid expression "1 +" → no preview, error shown
    // ----------------------------------------------------------------
    console.log('\n--- TEST 5: Invalid expression "1 +" → error shown, no preview ---');
    await theFormulaInput.fill('1 +');
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/calc-us2-a003-08-invalid-expression.png' });
    console.log('Screenshot: /tmp/calc-us2-a003-08-invalid-expression.png');

    const previewAfterInvalid = page.locator('[data-testid="formula-preview"], output[aria-label="Formula result preview"]');
    const previewVisibleAfterInvalid = await previewAfterInvalid.isVisible().catch(() => false);
    if (!previewVisibleAfterInvalid) {
      pass('Preview hidden for invalid expression "1 +"', 'No preview shown for syntactically invalid expression');
    } else {
      const invalidText = await previewAfterInvalid.textContent();
      fail('Preview hidden for invalid expression', `Preview visible with: "${invalidText}"`);
    }

    // Check for error message (role="alert")
    const errorAlert = page.locator('[role="alert"]').first();
    const errorVisible = await errorAlert.isVisible().catch(() => false);
    if (errorVisible) {
      const errorText = await errorAlert.textContent();
      pass('Error message shown for invalid expression', `Error: "${errorText}"`);
    } else {
      fail('Error message shown for invalid expression', 'No role="alert" error visible for "1 +"');
    }

    // Also check aria-invalid on the input
    const ariaInvalid = await theFormulaInput.getAttribute('aria-invalid').catch(() => null);
    console.log(`Input aria-invalid for "1 +": "${ariaInvalid}"`);
    if (ariaInvalid === 'true') {
      pass('Formula input marked aria-invalid for bad expression', 'aria-invalid="true"');
    } else {
      fail('Formula input aria-invalid', `Expected "true" but got: "${ariaInvalid}"`);
    }

    // ----------------------------------------------------------------
    // TEST 6: Formula referencing field variable uses field defaults
    // ----------------------------------------------------------------
    console.log('\n--- TEST 6: Formula with field variable reference uses default values ---');
    // We need to know the actual variable name. Let's check by clicking on the field
    // in the field list to open its config panel and see the variable name.

    // Click on the Number Input field item in the draggable field list
    const fieldItems = page.locator('ul').filter({ has: page.locator('li') }).locator('li');
    const fieldItemsCount = await fieldItems.count();
    console.log(`Total li items: ${fieldItemsCount}`);

    // Find the button for the number field in the field list
    // After adding "Number Input", there should be a button with that text
    const fieldListButton = page.locator('button', { hasText: 'Number Input' }).first();
    const fieldListButtonVisible = await fieldListButton.isVisible().catch(() => false);

    let variableName = 'number_input'; // Default assumption from generateVariableName("Number Input")
    if (fieldListButtonVisible) {
      await fieldListButton.click();
      await page.waitForTimeout(400);
      // Look for variable name in the field config panel
      const varNameInput = page.getByLabel(/variable name/i).first();
      const varNameVisible = await varNameInput.isVisible().catch(() => false);
      if (varNameVisible) {
        variableName = await varNameInput.inputValue();
        console.log(`Actual field variable name: "${variableName}"`);
      } else {
        console.log('Variable name input not found in config panel, using assumption: "number_input"');
        // Check what's on screen
        const mainText = await page.textContent('main').catch(() => '');
        const varMatch = mainText?.match(/variable[:\s]+(\w+)/i);
        if (varMatch) {
          variableName = varMatch[1];
          console.log(`Extracted variable name from text: "${variableName}"`);
        }
      }
    }

    // Need to get back to the FormulaInput — click the output in the output list
    // The output list button text is "Output 1" (from createOutput function)
    const outputSelectButton = page.locator('section[aria-label="Formula outputs"] button', { hasText: /output 1/i }).first();
    const outputSelectVisible = await outputSelectButton.isVisible().catch(() => false);
    if (outputSelectVisible) {
      await outputSelectButton.click();
      await page.waitForTimeout(400);
    } else {
      // Try any button in the formula outputs section
      const anyOutputBtn = page.locator('section[aria-label="Formula outputs"] button').first();
      const anyOutputBtnVisible = await anyOutputBtn.isVisible().catch(() => false);
      if (anyOutputBtnVisible) {
        await anyOutputBtn.click();
        await page.waitForTimeout(400);
      }
    }

    // Now test with the field variable name
    const formulaWithVar = `{${variableName}} * 2`;
    console.log(`Testing formula: "${formulaWithVar}"`);
    
    const theFormulaInputAgain = page.getByLabel('Formula expression');
    await theFormulaInputAgain.fill(formulaWithVar);
    await page.waitForTimeout(300);

    await page.screenshot({ path: '/tmp/calc-us2-a003-09-field-variable.png' });
    console.log('Screenshot: /tmp/calc-us2-a003-09-field-variable.png');

    const previewWithVar = page.locator('[data-testid="formula-preview"], output[aria-label="Formula result preview"]');
    const previewWithVarVisible = await previewWithVar.isVisible().catch(() => false);
    if (previewWithVarVisible) {
      const varPreviewText = await previewWithVar.textContent();
      console.log(`Preview for "${formulaWithVar}": "${varPreviewText}"`);
      if (varPreviewText && varPreviewText.includes('Preview:')) {
        // Preview: 0 (since default for number field is 0)
        pass('Preview shown for field variable formula', `Formula "${formulaWithVar}" shows: "${varPreviewText}"`);
        if (varPreviewText.includes('0')) {
          pass('Preview uses field default value (0)', `Default value 0 used in evaluation: "${varPreviewText}"`);
        } else {
          fail('Preview uses field default value (0)', `Expected 0 in result but got: "${varPreviewText}"`);
        }
      } else if (varPreviewText && varPreviewText.includes('Evaluation error')) {
        // Variable not found — the variable name assumption was wrong
        console.log(`Evaluation error for "${formulaWithVar}" — variable name mismatch`);
        fail('Preview uses field default value', `Evaluation error: "${varPreviewText}" — variable name "${variableName}" not matched`);
      } else {
        fail('Preview shown for field variable formula', `Unexpected content: "${varPreviewText}"`);
      }
    } else {
      fail('Preview shown for field variable formula', `Preview not visible for "${formulaWithVar}"`);
    }

    // ----------------------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------------------
    console.log('\n--- FINAL RESULTS ---');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`${passed} PASS, ${failed} FAIL`);
    for (const r of results) {
      console.log(`  [${r.status}] ${r.name}`);
      if (r.detail) console.log(`         ${r.detail}`);
    }

    if (consoleErrors.length > 0) {
      console.log('\nConsole errors during test:');
      for (const err of consoleErrors) {
        console.log(`  ERROR: ${err}`);
      }
    } else {
      console.log('\nNo console errors captured.');
    }

  } catch (err) {
    console.error('Test execution error:', err.message);
    console.error(err.stack);
    await page.screenshot({ path: '/tmp/calc-us2-a003-crash.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
