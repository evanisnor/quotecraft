import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  BaseFieldConfig,
  NumberFieldConfig,
  SliderFieldConfig,
  TextFieldConfig,
  DropdownFieldConfig,
  RadioFieldConfig,
  CheckboxFieldConfig,
} from '@/shared/config';
import { FieldPreviewRenderer } from './FieldPreviewRenderer';

function makeNumberField(overrides: Partial<NumberFieldConfig> = {}): NumberFieldConfig {
  return {
    id: 'field-num',
    type: 'number',
    label: 'Quantity',
    required: false,
    variableName: 'quantity',
    min: 0,
    max: 100,
    step: 1,
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
    max: 1000,
    step: 10,
    defaultValue: 100,
    ...overrides,
  };
}

function makeTextField(overrides: Partial<TextFieldConfig> = {}): TextFieldConfig {
  return {
    id: 'field-text',
    type: 'text',
    label: 'Company Name',
    required: false,
    variableName: 'company_name',
    placeholder: 'Enter company name',
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

function makeRadioField(overrides: Partial<RadioFieldConfig> = {}): RadioFieldConfig {
  return {
    id: 'field-radio',
    type: 'radio',
    label: 'Support Level',
    required: false,
    variableName: 'support_level',
    options: [
      { id: 'opt-1', label: 'Email', value: '5' },
      { id: 'opt-2', label: 'Phone', value: '15' },
    ],
    ...overrides,
  };
}

function makeCheckboxField(overrides: Partial<CheckboxFieldConfig> = {}): CheckboxFieldConfig {
  return {
    id: 'field-checkbox',
    type: 'checkbox',
    label: 'Add-ons',
    required: false,
    variableName: 'addons',
    options: [
      { id: 'opt-1', label: 'Analytics', value: '10' },
      { id: 'opt-2', label: 'Support', value: '20' },
    ],
    ...overrides,
  };
}

function makeImageSelectField(): BaseFieldConfig {
  return {
    id: 'field-image',
    type: 'image_select',
    label: 'Logo',
    required: false,
    variableName: 'logo',
  };
}

describe('FieldPreviewRenderer', () => {
  describe('number field', () => {
    it('renders an input of type number', () => {
      render(<FieldPreviewRenderer field={makeNumberField()} value={5} onChange={jest.fn()} />);

      expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    });

    it('renders the field label', () => {
      render(<FieldPreviewRenderer field={makeNumberField()} value={5} onChange={jest.fn()} />);

      expect(screen.getByLabelText('Quantity')).toBeInTheDocument();
    });
  });

  describe('slider field', () => {
    it('renders an input of type range', () => {
      render(<FieldPreviewRenderer field={makeSliderField()} value={100} onChange={jest.fn()} />);

      expect(screen.getByRole('slider')).toBeInTheDocument();
    });

    it('renders the field label', () => {
      render(<FieldPreviewRenderer field={makeSliderField()} value={100} onChange={jest.fn()} />);

      expect(screen.getByLabelText('Budget')).toBeInTheDocument();
    });
  });

  describe('text field', () => {
    it('renders an input of type text', () => {
      render(<FieldPreviewRenderer field={makeTextField()} value={0} onChange={jest.fn()} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    it('renders the field label', () => {
      render(<FieldPreviewRenderer field={makeTextField()} value={0} onChange={jest.fn()} />);

      expect(screen.getByLabelText('Company Name')).toBeInTheDocument();
    });
  });

  describe('dropdown field', () => {
    it('renders a select element', () => {
      render(<FieldPreviewRenderer field={makeDropdownField()} value={10} onChange={jest.fn()} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('renders the correct number of options', () => {
      render(<FieldPreviewRenderer field={makeDropdownField()} value={10} onChange={jest.fn()} />);

      expect(screen.getAllByRole('option')).toHaveLength(2);
    });

    it('renders the field label', () => {
      render(<FieldPreviewRenderer field={makeDropdownField()} value={10} onChange={jest.fn()} />);

      expect(screen.getByLabelText('Plan')).toBeInTheDocument();
    });
  });

  describe('radio field', () => {
    it('renders radio inputs for each option', () => {
      render(<FieldPreviewRenderer field={makeRadioField()} value={5} onChange={jest.fn()} />);

      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(2);
    });

    it('renders a fieldset with a legend', () => {
      render(<FieldPreviewRenderer field={makeRadioField()} value={5} onChange={jest.fn()} />);

      expect(screen.getByRole('group', { name: 'Support Level' })).toBeInTheDocument();
    });
  });

  describe('checkbox field', () => {
    it('renders checkboxes for each option', () => {
      render(<FieldPreviewRenderer field={makeCheckboxField()} value={0} onChange={jest.fn()} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('renders a fieldset with a legend', () => {
      render(<FieldPreviewRenderer field={makeCheckboxField()} value={0} onChange={jest.fn()} />);

      expect(screen.getByRole('group', { name: 'Add-ons' })).toBeInTheDocument();
    });
  });

  describe('image_select field', () => {
    it('renders a placeholder message', () => {
      render(
        <FieldPreviewRenderer field={makeImageSelectField()} value={0} onChange={jest.fn()} />,
      );

      expect(screen.getByText('Image Select (not yet supported in preview)')).toBeInTheDocument();
    });
  });

  describe('onChange callbacks', () => {
    it('changing a number input calls onChange with the new numeric value', () => {
      const onChange = jest.fn();

      render(<FieldPreviewRenderer field={makeNumberField()} value={5} onChange={onChange} />);

      const input = screen.getByRole('spinbutton');
      fireEvent.change(input, { target: { value: '42' } });

      expect(onChange).toHaveBeenLastCalledWith(42);
    });

    it('changing a dropdown selection calls onChange with the option numeric value', async () => {
      const onChange = jest.fn();
      const user = userEvent.setup();

      render(<FieldPreviewRenderer field={makeDropdownField()} value={10} onChange={onChange} />);

      await user.selectOptions(screen.getByRole('combobox'), 'Pro');

      expect(onChange).toHaveBeenLastCalledWith(25);
    });
  });

  describe('helpText', () => {
    it('renders helpText when present', () => {
      const field = makeNumberField({ helpText: 'Enter a quantity between 0 and 100' });

      render(<FieldPreviewRenderer field={field} value={5} onChange={jest.fn()} />);

      expect(screen.getByText('Enter a quantity between 0 and 100')).toBeInTheDocument();
    });

    it('does not render a small element when helpText is absent', () => {
      const field = makeNumberField({ helpText: undefined });

      render(<FieldPreviewRenderer field={field} value={5} onChange={jest.fn()} />);

      expect(screen.queryByRole('note')).not.toBeInTheDocument();
      // Verify no <small> element is present
      expect(document.querySelector('small')).toBeNull();
    });
  });
});
