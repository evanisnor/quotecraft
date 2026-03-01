import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { SliderFieldConfig } from '@/shared/config';
import { SliderFieldConfigPanel } from './SliderFieldConfigPanel';

function makeField(overrides: Partial<SliderFieldConfig> = {}): SliderFieldConfig {
  return {
    id: 'field-1',
    type: 'slider',
    label: 'Budget',
    helpText: 'Drag to set budget',
    required: false,
    variableName: 'budget',
    min: 0,
    max: 1000,
    step: 10,
    defaultValue: 100,
    ...overrides,
  };
}

/**
 * Stateful wrapper so that userEvent interactions propagate back through the
 * controlled component correctly.
 */
function ControlledSliderFieldConfigPanel({
  initialField,
  onUpdate = jest.fn(),
}: {
  initialField: SliderFieldConfig;
  onUpdate?: jest.Mock;
}) {
  const [field, setField] = useState(initialField);
  function handleUpdate(updated: SliderFieldConfig) {
    setField(updated);
    onUpdate(updated);
  }
  return <SliderFieldConfigPanel field={field} onUpdate={handleUpdate} />;
}

describe('SliderFieldConfigPanel', () => {
  it('renders the base config panel inputs', () => {
    render(<SliderFieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);

    expect(screen.getByLabelText('Label', { selector: '#field-label' })).toHaveValue('Budget');
    expect(screen.getByLabelText('Help text')).toHaveValue('Drag to set budget');
    expect(screen.getByLabelText('Required')).not.toBeChecked();
    expect(screen.getByLabelText('Variable name')).toHaveValue('budget');
  });

  it('renders min/max/step/defaultValue inputs with values from field prop', () => {
    render(<SliderFieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);

    expect(screen.getByLabelText('Min')).toHaveValue(0);
    expect(screen.getByLabelText('Max')).toHaveValue(1000);
    expect(screen.getByLabelText('Step')).toHaveValue(10);
    expect(screen.getByLabelText('Default value')).toHaveValue(100);
  });

  it('renders empty inputs when all optional numeric fields are undefined', () => {
    render(
      <SliderFieldConfigPanel
        field={makeField({
          min: undefined,
          max: undefined,
          step: undefined,
          defaultValue: undefined,
        })}
        onUpdate={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Min')).toHaveValue(null);
    expect(screen.getByLabelText('Max')).toHaveValue(null);
    expect(screen.getByLabelText('Step')).toHaveValue(null);
    expect(screen.getByLabelText('Default value')).toHaveValue(null);
  });

  it('typing a number into min updates the field with the parsed number', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledSliderFieldConfigPanel
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
      <ControlledSliderFieldConfigPanel initialField={makeField({ min: 0 })} onUpdate={onUpdate} />,
    );

    await user.clear(screen.getByLabelText('Min'));

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ min: undefined }));
  });

  it('typing a number into max updates the field with the parsed number', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledSliderFieldConfigPanel
        initialField={makeField({ max: undefined })}
        onUpdate={onUpdate}
      />,
    );

    await user.type(screen.getByLabelText('Max'), '500');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ max: 500 }));
  });

  it('clearing the max input sets max to undefined', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledSliderFieldConfigPanel
        initialField={makeField({ max: 1000 })}
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
      <ControlledSliderFieldConfigPanel
        initialField={makeField({ step: undefined })}
        onUpdate={onUpdate}
      />,
    );

    await user.type(screen.getByLabelText('Step'), '25');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ step: 25 }));
  });

  it('clearing the step input sets step to undefined', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledSliderFieldConfigPanel
        initialField={makeField({ step: 10 })}
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
      <ControlledSliderFieldConfigPanel
        initialField={makeField({ defaultValue: undefined })}
        onUpdate={onUpdate}
      />,
    );

    await user.type(screen.getByLabelText('Default value'), '50');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ defaultValue: 50 }));
  });

  it('clearing the defaultValue input sets defaultValue to undefined', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledSliderFieldConfigPanel
        initialField={makeField({ defaultValue: 100 })}
        onUpdate={onUpdate}
      />,
    );

    await user.clear(screen.getByLabelText('Default value'));

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ defaultValue: undefined }));
  });

  it('emits config with min exceeding max unchanged — caller is responsible for validation', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledSliderFieldConfigPanel
        initialField={makeField({ min: 0, max: 1000 })}
        onUpdate={onUpdate}
      />,
    );

    await user.clear(screen.getByLabelText('Min'));
    await user.type(screen.getByLabelText('Min'), '2000');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ min: 2000, max: 1000 }));
  });

  it('updating a base field preserves slider-specific config unchanged', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(<ControlledSliderFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />);

    await user.clear(screen.getByLabelText('Label', { selector: '#field-label' }));
    await user.type(screen.getByLabelText('Label', { selector: '#field-label' }), 'Price');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Price',
        type: 'slider',
        min: 0,
        max: 1000,
        step: 10,
        defaultValue: 100,
      }),
    );
  });
});
