import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { FieldOption } from '@/shared/config';
import { OptionListEditor } from './OptionListEditor';

function makeOption(overrides: Partial<FieldOption> = {}): FieldOption {
  return {
    id: 'opt-1',
    label: 'Option A',
    value: 'option_a',
    ...overrides,
  };
}

/**
 * Stateful wrapper so that userEvent interactions propagate back through the
 * controlled component correctly.
 */
function ControlledOptionListEditor({
  initialOptions,
  onChange = jest.fn(),
}: {
  initialOptions: FieldOption[];
  onChange?: jest.Mock;
}) {
  const [options, setOptions] = useState(initialOptions);
  function handleChange(updated: FieldOption[]) {
    setOptions(updated);
    onChange(updated);
  }
  return <OptionListEditor options={options} onChange={handleChange} />;
}

describe('OptionListEditor', () => {
  it('renders all options with their labels and values populated', () => {
    const options = [
      makeOption({ id: 'opt-1', label: 'Small', value: 'small' }),
      makeOption({ id: 'opt-2', label: 'Large', value: 'large' }),
    ];

    render(<OptionListEditor options={options} onChange={jest.fn()} />);

    expect(screen.getByLabelText('Label', { selector: '#option-label-0' })).toHaveValue('Small');
    expect(screen.getByLabelText('Value', { selector: '#option-value-0' })).toHaveValue('small');
    expect(screen.getByLabelText('Label', { selector: '#option-label-1' })).toHaveValue('Large');
    expect(screen.getByLabelText('Value', { selector: '#option-value-1' })).toHaveValue('large');
  });

  it('renders empty state with no option rows but still shows Add option button', () => {
    render(<OptionListEditor options={[]} onChange={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Add option' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Label')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Value')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });

  it('clicking Add option appends a new blank option row', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();

    render(<ControlledOptionListEditor initialOptions={[]} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Add option' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [newOptions] = onChange.mock.calls[0] as [FieldOption[]];
    expect(newOptions).toHaveLength(1);
    expect(newOptions[0].label).toBe('');
    expect(newOptions[0].value).toBe('');
    expect(typeof newOptions[0].id).toBe('string');
    expect(newOptions[0].id.length).toBeGreaterThan(0);
  });

  it('changing a label input updates that option label and leaves others unchanged', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    const options = [
      makeOption({ id: 'opt-1', label: 'Small', value: 'small' }),
      makeOption({ id: 'opt-2', label: 'Large', value: 'large' }),
    ];

    render(<ControlledOptionListEditor initialOptions={options} onChange={onChange} />);

    const labelInput = screen.getByLabelText('Label', { selector: '#option-label-0' });
    await user.clear(labelInput);
    await user.type(labelInput, 'Tiny');

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as FieldOption[];
    expect(lastCall[0].label).toBe('Tiny');
    expect(lastCall[1].label).toBe('Large');
  });

  it('changing a value input updates that option value and leaves others unchanged', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    const options = [
      makeOption({ id: 'opt-1', label: 'Small', value: 'small' }),
      makeOption({ id: 'opt-2', label: 'Large', value: 'large' }),
    ];

    render(<ControlledOptionListEditor initialOptions={options} onChange={onChange} />);

    const valueInput = screen.getByLabelText('Value', { selector: '#option-value-0' });
    await user.clear(valueInput);
    await user.type(valueInput, 'tiny');

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1][0] as FieldOption[];
    expect(lastCall[0].value).toBe('tiny');
    expect(lastCall[1].value).toBe('large');
  });

  it('clicking Remove on an option removes it and leaves others unchanged', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    const options = [
      makeOption({ id: 'opt-1', label: 'Small', value: 'small' }),
      makeOption({ id: 'opt-2', label: 'Large', value: 'large' }),
    ];

    render(<ControlledOptionListEditor initialOptions={options} onChange={onChange} />);

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);

    expect(onChange).toHaveBeenCalledTimes(1);
    const [updated] = onChange.mock.calls[0] as [FieldOption[]];
    expect(updated).toHaveLength(1);
    expect(updated[0].label).toBe('Large');
  });

  it('clicking Remove on the only option leaves an empty list', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    const options = [makeOption({ id: 'opt-1', label: 'Solo', value: 'solo' })];

    render(<ControlledOptionListEditor initialOptions={options} onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onChange).toHaveBeenCalledTimes(1);
    const [updated] = onChange.mock.calls[0] as [FieldOption[]];
    expect(updated).toHaveLength(0);
  });
});
