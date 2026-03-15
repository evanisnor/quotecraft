import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  BaseFieldConfig,
  NumberFieldConfig,
  SliderFieldConfig,
  DropdownFieldConfig,
  ImageSelectFieldConfig,
  ResultOutputConfig,
  Step,
  FeatureFlags,
} from '@/shared/config';
import { CalculatorPreviewForm } from './CalculatorPreviewForm';

function makeNumberField(overrides: Partial<NumberFieldConfig> = {}): NumberFieldConfig {
  return {
    id: 'field-num',
    type: 'number',
    label: 'Quantity',
    required: false,
    variableName: 'quantity',
    defaultValue: 5,
    ...overrides,
  };
}

function makeSliderField(overrides: Partial<SliderFieldConfig> = {}): SliderFieldConfig {
  return {
    id: 'field-slider',
    type: 'slider',
    label: 'Budget',
    required: false,
    variableName: 'budget',
    min: 0,
    max: 500,
    defaultValue: 100,
    ...overrides,
  };
}

function makeDropdownField(overrides: Partial<DropdownFieldConfig> = {}): DropdownFieldConfig {
  return {
    id: 'field-dropdown',
    type: 'dropdown',
    label: 'Plan',
    required: false,
    variableName: 'plan',
    options: [
      { id: 'opt-1', label: 'Basic', value: '10' },
      { id: 'opt-2', label: 'Pro', value: '25' },
    ],
    ...overrides,
  };
}

describe('CalculatorPreviewForm — badge', () => {
  it('renders the "Powered by QuoteCraft" badge linking to the QuoteCraft homepage', () => {
    render(<CalculatorPreviewForm fields={[]} />);

    const badge = screen.getByRole('link', { name: 'Powered by QuoteCraft' });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('href', 'https://quotecraft.io');
  });

  it('renders the badge inside a footer at the bottom of the form', () => {
    render(
      <CalculatorPreviewForm
        fields={[makeNumberField()]}
        outputs={[{ id: 'out-1', label: 'Total', expression: '1' }]}
      />,
    );

    const form = screen.getByRole('form', { name: 'Calculator Preview Form' });
    const footer = form.querySelector('footer');
    expect(footer).not.toBeNull();

    const badge = screen.getByRole('link', { name: 'Powered by QuoteCraft' });
    expect(footer).toContainElement(badge);

    // Badge footer is the last child of the form
    expect(form.lastElementChild).toBe(footer);
  });

  it('hides the badge when featureFlags.brandingRemovable is true', () => {
    const featureFlags: FeatureFlags = { brandingRemovable: true };
    render(<CalculatorPreviewForm fields={[]} featureFlags={featureFlags} />);

    expect(screen.queryByRole('link', { name: 'Powered by QuoteCraft' })).not.toBeInTheDocument();
  });

  it('shows the badge when featureFlags.brandingRemovable is false', () => {
    const featureFlags: FeatureFlags = { brandingRemovable: false };
    render(<CalculatorPreviewForm fields={[]} featureFlags={featureFlags} />);

    expect(screen.getByRole('link', { name: 'Powered by QuoteCraft' })).toBeInTheDocument();
  });
});

describe('CalculatorPreviewForm', () => {
  it('renders a form with aria-label "Calculator Preview Form"', () => {
    render(<CalculatorPreviewForm fields={[]} />);

    expect(screen.getByRole('form', { name: 'Calculator Preview Form' })).toBeInTheDocument();
  });

  it('shows the empty-state message when fields is empty', () => {
    render(<CalculatorPreviewForm fields={[]} />);

    expect(screen.getByText('Add fields to preview your calculator.')).toBeInTheDocument();
  });

  it('does not show the empty-state message when fields are present', () => {
    render(<CalculatorPreviewForm fields={[makeNumberField()]} />);

    expect(screen.queryByText('Add fields to preview your calculator.')).not.toBeInTheDocument();
  });

  it('renders a field for each entry in the fields array by label text', () => {
    const fields: BaseFieldConfig[] = [makeNumberField(), makeSliderField()];

    render(<CalculatorPreviewForm fields={fields} />);

    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget')).toBeInTheDocument();
  });

  it('changing a number input updates the displayed value', async () => {
    const user = userEvent.setup();

    render(<CalculatorPreviewForm fields={[makeNumberField()]} />);

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '99');

    expect(input).toHaveValue(99);
  });

  it('renders a field added after initial mount', () => {
    const initialFields: BaseFieldConfig[] = [makeNumberField()];
    const newField = makeSliderField({ id: 'field-slider-new', variableName: 'budget_new' });

    const { rerender } = render(<CalculatorPreviewForm fields={initialFields} />);

    rerender(<CalculatorPreviewForm fields={[...initialFields, newField]} />);

    expect(screen.getByLabelText('Budget')).toBeInTheDocument();
  });

  it('preserves user-changed values when a new field is added', async () => {
    const user = userEvent.setup();
    const initialFields: BaseFieldConfig[] = [makeNumberField()];
    const newField = makeSliderField({ id: 'field-slider-new', variableName: 'budget_new' });

    const { rerender } = render(<CalculatorPreviewForm fields={initialFields} />);

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '77');

    rerender(<CalculatorPreviewForm fields={[...initialFields, newField]} />);

    expect(screen.getByRole('spinbutton')).toHaveValue(77);
  });

  it('renders multiple field types without error', () => {
    const fields: BaseFieldConfig[] = [
      makeNumberField(),
      makeSliderField(),
      makeDropdownField(),
      {
        id: 'field-text',
        type: 'text',
        label: 'Company',
        required: false,
        variableName: 'company',
      },
      {
        id: 'field-checkbox',
        type: 'checkbox',
        label: 'Add-ons',
        required: false,
        variableName: 'addons',
        options: [{ id: 'opt-1', label: 'Analytics', value: '10' }],
      } as BaseFieldConfig,
      {
        id: 'field-radio',
        type: 'radio',
        label: 'Support',
        required: false,
        variableName: 'support',
        options: [{ id: 'opt-1', label: 'Email', value: '5' }],
      } as BaseFieldConfig,
      {
        id: 'field-image',
        type: 'image_select',
        label: 'Logo',
        required: false,
        variableName: 'logo',
        options: [],
      } as ImageSelectFieldConfig,
    ];

    expect(() => render(<CalculatorPreviewForm fields={fields} />)).not.toThrow();
  });
});

describe('CalculatorPreviewForm — real-time reactivity', () => {
  function makeOutput(overrides: Partial<ResultOutputConfig> = {}): ResultOutputConfig {
    return {
      id: 'output-1',
      label: 'Total',
      expression: '{quantity} * 10',
      ...overrides,
    };
  }

  it('removing a field removes it from the preview', () => {
    const quantityField = makeNumberField();
    const budgetField = makeSliderField();

    const { rerender } = render(<CalculatorPreviewForm fields={[quantityField, budgetField]} />);

    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.getByLabelText('Budget')).toBeInTheDocument();

    rerender(<CalculatorPreviewForm fields={[quantityField]} />);

    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.queryByLabelText('Budget')).not.toBeInTheDocument();
  });

  it('updating a field label reflects immediately in the preview', () => {
    const field = makeNumberField({ label: 'Quantity' });

    const { rerender } = render(<CalculatorPreviewForm fields={[field]} />);

    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();

    const updatedField = { ...field, label: 'Units' };
    rerender(<CalculatorPreviewForm fields={[updatedField]} />);

    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Units')).toBeInTheDocument();
  });

  it('after field deletion, the deleted field variable is not in formula context', () => {
    const quantityField = makeNumberField({ variableName: 'quantity', defaultValue: 5 });
    const budgetField = makeSliderField({ variableName: 'budget', defaultValue: 100 });
    const output = makeOutput({ expression: '{budget} * 2', label: 'Budget Total' });

    const { rerender } = render(
      <CalculatorPreviewForm fields={[quantityField, budgetField]} outputs={[output]} />,
    );

    // Verify the formula evaluates correctly with both fields present
    expect(screen.getByText('200')).toBeInTheDocument();

    // Change the budget slider value so userValues has an entry for 'budget'
    const slider = screen.getByLabelText('Budget');
    fireEvent.change(slider, { target: { value: '150' } });

    // Delete the budget field — remove it from the fields array
    rerender(<CalculatorPreviewForm fields={[quantityField]} outputs={[output]} />);

    // The formula references {budget} which no longer has a field — must produce an error
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).not.toBe('');
  });

  it('variable name change removes old variable from formula context', async () => {
    const user = userEvent.setup();
    const field = makeNumberField({ variableName: 'quantity', defaultValue: 3 });
    const output = makeOutput({ expression: '{quantity} * 4', label: 'Total' });

    const { rerender } = render(<CalculatorPreviewForm fields={[field]} outputs={[output]} />);

    // Formula evaluates correctly with the original variable name
    expect(screen.getByText('12')).toBeInTheDocument();

    // Change a value so userValues has an entry for 'quantity'
    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '7');
    expect(screen.getByText('28')).toBeInTheDocument();

    // Rename the variable on the field config
    const renamedField = { ...field, variableName: 'qty_new' };
    const outputForOldName = makeOutput({ expression: '{quantity} * 4', label: 'Total' });
    rerender(<CalculatorPreviewForm fields={[renamedField]} outputs={[outputForOldName]} />);

    // Formula referencing the old name should now produce an error
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).not.toBe('');

    // Formula referencing the new name should use the default value (3)
    const outputForNewName = makeOutput({ expression: '{qty_new} * 4', label: 'Total' });
    rerender(<CalculatorPreviewForm fields={[renamedField]} outputs={[outputForNewName]} />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });
});

describe('CalculatorPreviewForm — formula engine integration', () => {
  function makeOutput(overrides: Partial<ResultOutputConfig> = {}): ResultOutputConfig {
    return {
      id: 'output-1',
      label: 'Total',
      expression: '{quantity} * 10',
      ...overrides,
    };
  }

  it('renders no results section when outputs is undefined', () => {
    render(<CalculatorPreviewForm fields={[makeNumberField()]} />);

    expect(screen.queryByRole('region', { name: 'Results' })).not.toBeInTheDocument();
  });

  it('renders no results section when outputs is an empty array', () => {
    render(<CalculatorPreviewForm fields={[makeNumberField()]} outputs={[]} />);

    expect(screen.queryByRole('region', { name: 'Results' })).not.toBeInTheDocument();
  });

  it('renders a results section with aria-label="Results" when outputs are provided', () => {
    const field = makeNumberField({ variableName: 'quantity', defaultValue: 5 });
    const output = makeOutput({ expression: '10', label: 'Total' });

    render(<CalculatorPreviewForm fields={[field]} outputs={[output]} />);

    expect(screen.getByRole('region', { name: 'Results' })).toBeInTheDocument();
  });

  it('evaluates a formula against current field values and displays the numeric result', () => {
    const field = makeNumberField({ variableName: 'quantity', defaultValue: 4 });
    const output = makeOutput({ expression: '{quantity} * 3', label: 'Total Cost' });

    render(<CalculatorPreviewForm fields={[field]} outputs={[output]} />);

    expect(screen.getByText('Total Cost')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('displays error in role="alert" when formula is invalid', () => {
    const field = makeNumberField({ variableName: 'quantity', defaultValue: 5 });
    const output = makeOutput({ expression: '???invalid???', label: 'Bad Output' });

    render(<CalculatorPreviewForm fields={[field]} outputs={[output]} />);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert.textContent).not.toBe('');
  });

  it('result updates when a field value changes (reactivity)', async () => {
    const user = userEvent.setup();
    const field = makeNumberField({ variableName: 'quantity', defaultValue: 2 });
    const output = makeOutput({ expression: '{quantity} * 5', label: 'Subtotal' });

    render(<CalculatorPreviewForm fields={[field]} outputs={[output]} />);

    expect(screen.getByText('10')).toBeInTheDocument();

    const input = screen.getByRole('spinbutton');
    await user.clear(input);
    await user.type(input, '6');

    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('evaluates multiple outputs and displays all results', () => {
    const field = makeNumberField({ variableName: 'quantity', defaultValue: 3 });
    const outputs: ResultOutputConfig[] = [
      { id: 'out-1', label: 'Base', expression: '{quantity} * 2' },
      { id: 'out-2', label: 'Tax', expression: '{quantity} * 1' },
    ];

    render(<CalculatorPreviewForm fields={[field]} outputs={outputs} />);

    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Tax')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('CalculatorPreviewForm — multi-step mode', () => {
  function makeStep(overrides: Partial<Step> = {}): Step {
    return {
      id: 'step-1',
      title: 'Step 1',
      fieldIds: [],
      ...overrides,
    };
  }

  function makeOutput(overrides: Partial<ResultOutputConfig> = {}): ResultOutputConfig {
    return {
      id: 'output-1',
      label: 'Total',
      expression: '{quantity} * 10',
      ...overrides,
    };
  }

  it('does not render a progress bar in single-page mode (default)', () => {
    render(<CalculatorPreviewForm fields={[makeNumberField()]} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('does not render step navigation in single-page mode (default)', () => {
    render(<CalculatorPreviewForm fields={[makeNumberField()]} />);

    expect(screen.queryByRole('navigation', { name: 'Step navigation' })).not.toBeInTheDocument();
  });

  it('renders a progress bar in multi-step mode when steps are present', () => {
    const field = makeNumberField();
    const step = makeStep({ fieldIds: [field.id] });

    render(
      <CalculatorPreviewForm
        fields={[field]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[step]}
      />,
    );

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('shows the correct step count on initial render (Step 1 of N)', () => {
    const field1 = makeNumberField({ id: 'f1', variableName: 'quantity' });
    const field2 = makeSliderField({ id: 'f2', variableName: 'budget' });
    const step1 = makeStep({ id: 'step-1', fieldIds: ['f1'] });
    const step2 = makeStep({ id: 'step-2', title: 'Step 2', fieldIds: ['f2'] });

    render(
      <CalculatorPreviewForm
        fields={[field1, field2]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[step1, step2]}
      />,
    );

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('shows only fields belonging to the current step', () => {
    const field1 = makeNumberField({ id: 'f1', variableName: 'quantity' });
    const field2 = makeSliderField({ id: 'f2', variableName: 'budget' });
    const step1 = makeStep({ id: 'step-1', fieldIds: ['f1'] });
    const step2 = makeStep({ id: 'step-2', title: 'Step 2', fieldIds: ['f2'] });

    render(
      <CalculatorPreviewForm
        fields={[field1, field2]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[step1, step2]}
      />,
    );

    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.queryByLabelText('Budget')).not.toBeInTheDocument();
  });

  it('Next button is disabled on the last step', () => {
    const field = makeNumberField({ id: 'f1', variableName: 'quantity' });
    const step = makeStep({ fieldIds: ['f1'] });

    render(
      <CalculatorPreviewForm
        fields={[field]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[step]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Next step' })).toBeDisabled();
  });

  it('Back button is disabled on the first step', () => {
    const field = makeNumberField({ id: 'f1', variableName: 'quantity' });
    const step = makeStep({ fieldIds: ['f1'] });

    render(
      <CalculatorPreviewForm
        fields={[field]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[step]}
      />,
    );

    expect(screen.getByRole('button', { name: 'Previous step' })).toBeDisabled();
  });

  it('clicking Next advances to the next step and shows the next step fields', async () => {
    const user = userEvent.setup();
    const field1 = makeNumberField({ id: 'f1', variableName: 'quantity' });
    const field2 = makeSliderField({ id: 'f2', variableName: 'budget' });
    const step1 = makeStep({ id: 'step-1', fieldIds: ['f1'] });
    const step2 = makeStep({ id: 'step-2', title: 'Step 2', fieldIds: ['f2'] });

    render(
      <CalculatorPreviewForm
        fields={[field1, field2]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[step1, step2]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next step' }));

    expect(screen.queryByLabelText('Quantity')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  });

  it('clicking Back goes to the previous step', async () => {
    const user = userEvent.setup();
    const field1 = makeNumberField({ id: 'f1', variableName: 'quantity' });
    const field2 = makeSliderField({ id: 'f2', variableName: 'budget' });
    const step1 = makeStep({ id: 'step-1', fieldIds: ['f1'] });
    const step2 = makeStep({ id: 'step-2', title: 'Step 2', fieldIds: ['f2'] });

    render(
      <CalculatorPreviewForm
        fields={[field1, field2]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[step1, step2]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByLabelText('Budget')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous step' }));
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    expect(screen.queryByLabelText('Budget')).not.toBeInTheDocument();
  });

  it('results section is hidden on non-last steps in multi-step mode', () => {
    const field1 = makeNumberField({ id: 'f1', variableName: 'quantity', defaultValue: 2 });
    const field2 = makeSliderField({ id: 'f2', variableName: 'budget' });
    const step1 = makeStep({ id: 'step-1', fieldIds: ['f1'] });
    const step2 = makeStep({ id: 'step-2', title: 'Step 2', fieldIds: ['f2'] });
    const output = makeOutput({ expression: '{quantity} * 10', label: 'Total' });

    render(
      <CalculatorPreviewForm
        fields={[field1, field2]}
        outputs={[output]}
        layoutMode="multi-step"
        steps={[step1, step2]}
      />,
    );

    // On step 1 (not the last step), Results should not be shown
    expect(screen.queryByRole('region', { name: 'Results' })).not.toBeInTheDocument();
  });

  it('results section is shown on the last step in multi-step mode', async () => {
    const user = userEvent.setup();
    const field1 = makeNumberField({ id: 'f1', variableName: 'quantity', defaultValue: 2 });
    const field2 = makeSliderField({ id: 'f2', variableName: 'budget' });
    const step1 = makeStep({ id: 'step-1', fieldIds: ['f1'] });
    const step2 = makeStep({ id: 'step-2', title: 'Step 2', fieldIds: ['f2'] });
    const output = makeOutput({ expression: '{quantity} * 10', label: 'Total' });

    render(
      <CalculatorPreviewForm
        fields={[field1, field2]}
        outputs={[output]}
        layoutMode="multi-step"
        steps={[step1, step2]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Next step' }));

    expect(screen.getByRole('region', { name: 'Results' })).toBeInTheDocument();
  });

  it('shows the empty state when in multi-step mode with no steps', () => {
    render(
      <CalculatorPreviewForm
        fields={[makeNumberField()]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[]}
      />,
    );

    expect(screen.getByText('Add fields to preview your calculator.')).toBeInTheDocument();
  });

  it('clamps step index if steps are removed while on a later step', async () => {
    const user = userEvent.setup();
    const field1 = makeNumberField({ id: 'f1', variableName: 'quantity' });
    const field2 = makeSliderField({ id: 'f2', variableName: 'budget' });
    const step1 = makeStep({ id: 'step-1', fieldIds: ['f1'] });
    const step2 = makeStep({ id: 'step-2', title: 'Step 2', fieldIds: ['f2'] });

    const { rerender } = render(
      <CalculatorPreviewForm
        fields={[field1, field2]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[step1, step2]}
      />,
    );

    // Navigate to step 2
    await user.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();

    // Remove step 2 — now only step 1 exists
    rerender(
      <CalculatorPreviewForm
        fields={[field1, field2]}
        outputs={[]}
        layoutMode="multi-step"
        steps={[step1]}
      />,
    );

    // Step index should be clamped to 0 (Step 1 of 1)
    expect(screen.getByText('Step 1 of 1')).toBeInTheDocument();
    expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
  });
});
