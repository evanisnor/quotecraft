import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { TextFieldConfig } from '@/shared/config';
import { TextFieldConfigPanel } from './TextFieldConfigPanel';

function makeField(overrides: Partial<TextFieldConfig> = {}): TextFieldConfig {
  return {
    id: 'field-1',
    type: 'text',
    label: 'Project Description',
    helpText: 'Describe your project',
    required: false,
    variableName: 'project_description',
    placeholder: 'Enter a description...',
    ...overrides,
  };
}

/**
 * Stateful wrapper so that userEvent interactions propagate back through the
 * controlled component correctly.
 */
function ControlledTextFieldConfigPanel({
  initialField,
  onUpdate = jest.fn(),
}: {
  initialField: TextFieldConfig;
  onUpdate?: jest.Mock;
}) {
  const [field, setField] = useState(initialField);
  function handleUpdate(updated: TextFieldConfig) {
    setField(updated);
    onUpdate(updated);
  }
  return <TextFieldConfigPanel field={field} onUpdate={handleUpdate} />;
}

describe('TextFieldConfigPanel', () => {
  it('renders the base config panel inputs', () => {
    render(<TextFieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);

    expect(screen.getByLabelText('Label', { selector: '#field-label' })).toHaveValue(
      'Project Description',
    );
    expect(screen.getByLabelText('Help text')).toHaveValue('Describe your project');
    expect(screen.getByLabelText('Required')).not.toBeChecked();
    expect(screen.getByLabelText('Variable name')).toHaveValue('project_description');
  });

  it('renders placeholder input with value from field prop', () => {
    render(<TextFieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);

    expect(screen.getByLabelText('Placeholder')).toHaveValue('Enter a description...');
  });

  it('renders empty placeholder input when placeholder is undefined', () => {
    render(
      <TextFieldConfigPanel field={makeField({ placeholder: undefined })} onUpdate={jest.fn()} />,
    );

    expect(screen.getByLabelText('Placeholder')).toHaveValue('');
  });

  it('typing into placeholder updates the field with the string', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledTextFieldConfigPanel
        initialField={makeField({ placeholder: undefined })}
        onUpdate={onUpdate}
      />,
    );

    await user.type(screen.getByLabelText('Placeholder'), 'e.g. redesign my website');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ placeholder: 'e.g. redesign my website' }),
    );
  });

  it('clearing placeholder sets it to undefined', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledTextFieldConfigPanel
        initialField={makeField({ placeholder: 'Enter a description...' })}
        onUpdate={onUpdate}
      />,
    );

    await user.clear(screen.getByLabelText('Placeholder'));

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ placeholder: undefined }));
  });

  it('updating a base field preserves placeholder unchanged', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(<ControlledTextFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />);

    await user.clear(screen.getByLabelText('Label', { selector: '#field-label' }));
    await user.type(screen.getByLabelText('Label', { selector: '#field-label' }), 'Notes');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Notes',
        type: 'text',
        placeholder: 'Enter a description...',
      }),
    );
  });
});
