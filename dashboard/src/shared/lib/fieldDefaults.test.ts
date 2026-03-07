import type {
  BaseFieldConfig,
  NumberFieldConfig,
  SliderFieldConfig,
  DropdownFieldConfig,
  RadioFieldConfig,
  CheckboxFieldConfig,
} from '@/shared/config';
import { buildFieldDefaults, getInitialValue } from './fieldDefaults';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBase(overrides: Partial<BaseFieldConfig> = {}): BaseFieldConfig {
  return {
    id: 'field-1',
    type: 'text',
    label: 'Text Field',
    required: false,
    variableName: 'text_field',
    ...overrides,
  };
}

function makeNumber(overrides: Partial<NumberFieldConfig> = {}): NumberFieldConfig {
  return {
    ...makeBase({ type: 'number', variableName: 'qty' }),
    type: 'number',
    ...overrides,
  };
}

function makeSlider(overrides: Partial<SliderFieldConfig> = {}): SliderFieldConfig {
  return {
    ...makeBase({ type: 'slider', variableName: 'budget' }),
    type: 'slider',
    min: 0,
    max: 100,
    ...overrides,
  };
}

function makeDropdown(overrides: Partial<DropdownFieldConfig> = {}): DropdownFieldConfig {
  return {
    ...makeBase({ type: 'dropdown', variableName: 'plan' }),
    type: 'dropdown',
    options: [],
    ...overrides,
  };
}

function makeRadio(overrides: Partial<RadioFieldConfig> = {}): RadioFieldConfig {
  return {
    ...makeBase({ type: 'radio', variableName: 'support' }),
    type: 'radio',
    options: [],
    ...overrides,
  };
}

function makeCheckbox(overrides: Partial<CheckboxFieldConfig> = {}): CheckboxFieldConfig {
  return {
    ...makeBase({ type: 'checkbox', variableName: 'addons' }),
    type: 'checkbox',
    options: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getInitialValue
// ---------------------------------------------------------------------------

describe('getInitialValue', () => {
  it('returns 0 for a text field', () => {
    expect(getInitialValue(makeBase({ type: 'text' }))).toBe(0);
  });

  it('returns 0 for a number field with no defaultValue', () => {
    expect(getInitialValue(makeNumber({ defaultValue: undefined }))).toBe(0);
  });

  it('returns defaultValue for a number field with a defaultValue', () => {
    expect(getInitialValue(makeNumber({ defaultValue: 42 }))).toBe(42);
  });

  it('returns 0 for a slider field with no defaultValue and no min', () => {
    expect(getInitialValue(makeSlider({ defaultValue: undefined, min: undefined }))).toBe(0);
  });

  it('returns min for a slider field with no defaultValue but with a min', () => {
    expect(getInitialValue(makeSlider({ defaultValue: undefined, min: 10 }))).toBe(10);
  });

  it('returns defaultValue for a slider field with a defaultValue', () => {
    expect(getInitialValue(makeSlider({ defaultValue: 75, min: 10 }))).toBe(75);
  });

  it('returns 0 for a dropdown field with no options', () => {
    expect(getInitialValue(makeDropdown({ options: [] }))).toBe(0);
  });

  it('returns parsed float of the first option value for a dropdown field', () => {
    expect(
      getInitialValue(makeDropdown({ options: [{ id: 'o1', label: 'Basic', value: '19.99' }] })),
    ).toBe(19.99);
  });

  it('returns 0 for a dropdown field whose first option value is not a number', () => {
    expect(
      getInitialValue(makeDropdown({ options: [{ id: 'o1', label: 'N/A', value: 'none' }] })),
    ).toBe(0);
  });

  it('returns 0 for a radio field with no options', () => {
    expect(getInitialValue(makeRadio({ options: [] }))).toBe(0);
  });

  it('returns parsed float of the first option value for a radio field', () => {
    expect(
      getInitialValue(makeRadio({ options: [{ id: 'o1', label: 'Email', value: '5' }] })),
    ).toBe(5);
  });

  it('returns 0 for a checkbox field', () => {
    expect(getInitialValue(makeCheckbox())).toBe(0);
  });

  it('returns 0 for an image_select field', () => {
    expect(getInitialValue(makeBase({ type: 'image_select', variableName: 'logo' }))).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildFieldDefaults
// ---------------------------------------------------------------------------

describe('buildFieldDefaults', () => {
  it('returns an empty record when fields is empty', () => {
    expect(buildFieldDefaults([])).toEqual({});
  });

  it('maps variableName to 0 for a text field', () => {
    const field = makeBase({ type: 'text', variableName: 'company' });
    expect(buildFieldDefaults([field])).toEqual({ company: 0 });
  });

  it('maps variableName to defaultValue for a number field', () => {
    const field = makeNumber({ variableName: 'qty', defaultValue: 10 });
    expect(buildFieldDefaults([field])).toEqual({ qty: 10 });
  });

  it('maps variableName to 0 for a number field with no defaultValue', () => {
    const field = makeNumber({ variableName: 'qty', defaultValue: undefined });
    expect(buildFieldDefaults([field])).toEqual({ qty: 0 });
  });

  it('maps variableName to defaultValue for a slider field', () => {
    const field = makeSlider({ variableName: 'budget', defaultValue: 50, min: 0 });
    expect(buildFieldDefaults([field])).toEqual({ budget: 50 });
  });

  it('maps variableName to min for a slider field with no defaultValue', () => {
    const field = makeSlider({ variableName: 'budget', defaultValue: undefined, min: 20 });
    expect(buildFieldDefaults([field])).toEqual({ budget: 20 });
  });

  it('maps variableName to 0 for a slider field with no defaultValue and no min', () => {
    const field = makeSlider({ variableName: 'budget', defaultValue: undefined, min: undefined });
    expect(buildFieldDefaults([field])).toEqual({ budget: 0 });
  });

  it('maps variableName to first option value for a dropdown field', () => {
    const field = makeDropdown({
      variableName: 'plan',
      options: [
        { id: 'o1', label: 'Basic', value: '10' },
        { id: 'o2', label: 'Pro', value: '25' },
      ],
    });
    expect(buildFieldDefaults([field])).toEqual({ plan: 10 });
  });

  it('maps variableName to 0 for a dropdown field with no options', () => {
    const field = makeDropdown({ variableName: 'plan', options: [] });
    expect(buildFieldDefaults([field])).toEqual({ plan: 0 });
  });

  it('maps variableName to first option value for a radio field', () => {
    const field = makeRadio({
      variableName: 'support',
      options: [{ id: 'o1', label: 'Email', value: '5' }],
    });
    expect(buildFieldDefaults([field])).toEqual({ support: 5 });
  });

  it('maps variableName to 0 for a radio field with empty options', () => {
    const field = makeRadio({ variableName: 'support', options: [] });
    expect(buildFieldDefaults([field])).toEqual({ support: 0 });
  });

  it('maps variableName to 0 for a checkbox field', () => {
    const field = makeCheckbox({ variableName: 'addons' });
    expect(buildFieldDefaults([field])).toEqual({ addons: 0 });
  });

  it('maps variableName to 0 for an image_select field', () => {
    const field = makeBase({ type: 'image_select', variableName: 'logo' });
    expect(buildFieldDefaults([field])).toEqual({ logo: 0 });
  });

  it('handles multiple fields at once, each with its own variableName and default', () => {
    const fields: BaseFieldConfig[] = [
      makeNumber({ variableName: 'qty', defaultValue: 3 }),
      makeSlider({ variableName: 'budget', defaultValue: 100 }),
      makeBase({ type: 'text', variableName: 'company' }),
      makeDropdown({
        variableName: 'plan',
        options: [{ id: 'o1', label: 'Basic', value: '19' }],
      }),
      makeCheckbox({ variableName: 'addons' }),
    ];

    expect(buildFieldDefaults(fields)).toEqual({
      qty: 3,
      budget: 100,
      company: 0,
      plan: 19,
      addons: 0,
    });
  });
});
