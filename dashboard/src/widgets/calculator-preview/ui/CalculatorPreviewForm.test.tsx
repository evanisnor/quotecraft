import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  BaseFieldConfig,
  NumberFieldConfig,
  SliderFieldConfig,
  DropdownFieldConfig,
  ResultOutputConfig,
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
      },
    ];

    expect(() => render(<CalculatorPreviewForm fields={fields} />)).not.toThrow();
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
