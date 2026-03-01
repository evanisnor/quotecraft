import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { NumberFieldConfig } from '@/shared/config';
import { NumberFieldConfigPanel } from './NumberFieldConfigPanel';

function makeField(overrides: Partial<NumberFieldConfig> = {}): NumberFieldConfig {
  return {
    id: 'field-1',
    type: 'number',
    label: 'Quantity',
    helpText: 'Enter a quantity',
    required: false,
    variableName: 'quantity',
    min: 1,
    max: 100,
    step: 1,
    defaultValue: 10,
    placeholder: 'e.g. 5',
    ...overrides,
  };
}

/**
 * Stateful wrapper so that userEvent interactions propagate back through the
 * controlled component correctly.
 */
function ControlledNumberFieldConfigPanel({
  initialField,
  onUpdate = jest.fn(),
}: {
  initialField: NumberFieldConfig;
  onUpdate?: jest.Mock;
}) {
  const [field, setField] = useState(initialField);
  function handleUpdate(updated: NumberFieldConfig) {
    setField(updated);
    onUpdate(updated);
  }
  return <NumberFieldConfigPanel field={field} onUpdate={handleUpdate} />;
}

describe('NumberFieldConfigPanel', () => {
  it('renders the base config panel inputs', () => {
    render(<NumberFieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);

    expect(screen.getByLabelText('Label', { selector: '#field-label' })).toHaveValue('Quantity');
    expect(screen.getByLabelText('Help text')).toHaveValue('Enter a quantity');
    expect(screen.getByLabelText('Required')).not.toBeChecked();
    expect(screen.getByLabelText('Variable name')).toHaveValue('quantity');
  });

  it('renders min/max/step/defaultValue/placeholder inputs with values from field prop', () => {
    render(<NumberFieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);

    expect(screen.getByLabelText('Min')).toHaveValue(1);
    expect(screen.getByLabelText('Max')).toHaveValue(100);
    expect(screen.getByLabelText('Step')).toHaveValue(1);
    expect(screen.getByLabelText('Default value')).toHaveValue(10);
    expect(screen.getByLabelText('Placeholder')).toHaveValue('e.g. 5');
  });

  it('renders empty inputs when all optional numeric fields are undefined', () => {
    render(
      <NumberFieldConfigPanel
        field={makeField({
          min: undefined,
          max: undefined,
          step: undefined,
          defaultValue: undefined,
          placeholder: undefined,
        })}
        onUpdate={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Min')).toHaveValue(null);
    expect(screen.getByLabelText('Max')).toHaveValue(null);
    expect(screen.getByLabelText('Step')).toHaveValue(null);
    expect(screen.getByLabelText('Default value')).toHaveValue(null);
    expect(screen.getByLabelText('Placeholder')).toHaveValue('');
  });

  it('typing a number into min updates the field with the parsed number', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ min: undefined })}
        onUpdate={onUpdate}
      />,
    );

    await user.type(screen.getByLabelText('Min'), '5');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ min: 5 }));
  });

  it('clearing the min input sets min to undefined', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel initialField={makeField({ min: 1 })} onUpdate={onUpdate} />,
    );

    await user.clear(screen.getByLabelText('Min'));

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ min: undefined }));
  });

  it('typing a number into max updates the field with the parsed number', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ max: undefined })}
        onUpdate={onUpdate}
      />,
    );

    await user.type(screen.getByLabelText('Max'), '50');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ max: 50 }));
  });

  it('clearing the max input sets max to undefined', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ max: 100 })}
        onUpdate={onUpdate}
      />,
    );

    await user.clear(screen.getByLabelText('Max'));

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ max: undefined }));
  });

  it('typing a number into step updates the field with the parsed number', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ step: undefined })}
        onUpdate={onUpdate}
      />,
    );

    await user.type(screen.getByLabelText('Step'), '2');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ step: 2 }));
  });

  it('clearing the step input sets step to undefined', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ step: 1 })}
        onUpdate={onUpdate}
      />,
    );

    await user.clear(screen.getByLabelText('Step'));

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ step: undefined }));
  });

  it('typing a number into defaultValue updates the field with the parsed number', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ defaultValue: undefined })}
        onUpdate={onUpdate}
      />,
    );

    await user.type(screen.getByLabelText('Default value'), '7');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ defaultValue: 7 }));
  });

  it('clearing the defaultValue input sets defaultValue to undefined', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ defaultValue: 10 })}
        onUpdate={onUpdate}
      />,
    );

    await user.clear(screen.getByLabelText('Default value'));

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ defaultValue: undefined }));
  });

  it('typing into placeholder updates the field with the string value', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ placeholder: undefined })}
        onUpdate={onUpdate}
      />,
    );

    await user.type(screen.getByLabelText('Placeholder'), 'Enter number');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ placeholder: 'Enter number' }),
    );
  });

  it('clearing placeholder sets placeholder to undefined', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ placeholder: 'e.g. 5' })}
        onUpdate={onUpdate}
      />,
    );

    await user.clear(screen.getByLabelText('Placeholder'));

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ placeholder: undefined }));
  });

  it('emits config with min exceeding max unchanged — caller is responsible for validation', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledNumberFieldConfigPanel
        initialField={makeField({ min: 1, max: 100 })}
        onUpdate={onUpdate}
      />,
    );

    await user.clear(screen.getByLabelText('Min'));
    await user.type(screen.getByLabelText('Min'), '200');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ min: 200, max: 100 }));
  });

  it('updating a base field preserves number-specific config unchanged', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(<ControlledNumberFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />);

    await user.clear(screen.getByLabelText('Label', { selector: '#field-label' }));
    await user.type(screen.getByLabelText('Label', { selector: '#field-label' }), 'Amount');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Amount',
        type: 'number',
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 10,
        placeholder: 'e.g. 5',
      }),
    );
  });
});
