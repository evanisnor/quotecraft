import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { RadioFieldConfig } from '@/shared/config';
import { RadioFieldConfigPanel } from './RadioFieldConfigPanel';

function makeField(overrides: Partial<RadioFieldConfig> = {}): RadioFieldConfig {
  return {
    id: 'field-1',
    type: 'radio',
    label: 'Package Size',
    helpText: 'Choose a package',
    required: false,
    variableName: 'package_size',
    options: [
      { id: 'opt-1', label: 'Small', value: 'small' },
      { id: 'opt-2', label: 'Large', value: 'large' },
    ],
    ...overrides,
  };
}

/**
 * Stateful wrapper so that userEvent interactions propagate back through the
 * controlled component correctly.
 */
function ControlledRadioFieldConfigPanel({
  initialField,
  onUpdate = jest.fn(),
}: {
  initialField: RadioFieldConfig;
  onUpdate?: jest.Mock;
}) {
  const [field, setField] = useState(initialField);
  function handleUpdate(updated: RadioFieldConfig) {
    setField(updated);
    onUpdate(updated);
  }
  return <RadioFieldConfigPanel field={field} onUpdate={handleUpdate} />;
}

describe('RadioFieldConfigPanel', () => {
  it('renders the base config panel inputs', () => {
    render(<RadioFieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);

    expect(screen.getByLabelText('Label', { selector: '#field-label' })).toHaveValue(
      'Package Size',
    );
    expect(screen.getByLabelText('Help text')).toHaveValue('Choose a package');
    expect(screen.getByLabelText('Required')).not.toBeChecked();
    expect(screen.getByLabelText('Variable name')).toHaveValue('package_size');
  });

  it('renders the option list with existing options', () => {
    render(<RadioFieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);

    expect(screen.getByLabelText('Label', { selector: '#option-label-0' })).toHaveValue('Small');
    expect(screen.getByLabelText('Value', { selector: '#option-value-0' })).toHaveValue('small');
    expect(screen.getByLabelText('Label', { selector: '#option-label-1' })).toHaveValue('Large');
    expect(screen.getByLabelText('Value', { selector: '#option-value-1' })).toHaveValue('large');
  });

  it('updating a base field calls onUpdate with updated base field and unchanged options', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(<ControlledRadioFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />);

    await user.clear(screen.getByLabelText('Label', { selector: '#field-label' }));
    await user.type(screen.getByLabelText('Label', { selector: '#field-label' }), 'Plan Type');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Plan Type',
        type: 'radio',
        options: [
          { id: 'opt-1', label: 'Small', value: 'small' },
          { id: 'opt-2', label: 'Large', value: 'large' },
        ],
      }),
    );
  });

  it('updating an option calls onUpdate with updated options and unchanged base fields', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(<ControlledRadioFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />);

    const optionLabelInput = screen.getByLabelText('Label', { selector: '#option-label-0' });
    await user.clear(optionLabelInput);
    await user.type(optionLabelInput, 'Tiny');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Package Size',
        variableName: 'package_size',
        options: expect.arrayContaining([expect.objectContaining({ id: 'opt-1', label: 'Tiny' })]),
      }),
    );
  });

  it('adding an option calls onUpdate with the new option appended', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(<ControlledRadioFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />);

    await user.click(screen.getByRole('button', { name: 'Add option' }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [updated] = onUpdate.mock.calls[0] as [RadioFieldConfig];
    expect(updated.options).toHaveLength(3);
    expect(updated.options[2].label).toBe('');
    expect(updated.options[2].value).toBe('');
    expect(updated.label).toBe('Package Size');
  });

  it('removing an option calls onUpdate with that option removed', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(<ControlledRadioFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />);

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [updated] = onUpdate.mock.calls[0] as [RadioFieldConfig];
    expect(updated.options).toHaveLength(1);
    expect(updated.options[0].id).toBe('opt-2');
    expect(updated.label).toBe('Package Size');
  });
});
