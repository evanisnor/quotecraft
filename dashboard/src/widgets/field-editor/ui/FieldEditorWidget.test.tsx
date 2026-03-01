import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { BaseFieldConfig } from '@/shared/config';
import { FieldEditorWidget } from './FieldEditorWidget';

function makeField(overrides: Partial<BaseFieldConfig> = {}): BaseFieldConfig {
  return {
    id: 'field-1',
    type: 'text',
    label: 'Project Name',
    helpText: 'Enter your project name',
    required: false,
    variableName: 'project_name',
    ...overrides,
  };
}

function ControlledFieldEditorWidget({
  initialField,
  onUpdate = jest.fn(),
  onDelete = jest.fn(),
}: {
  initialField: BaseFieldConfig;
  onUpdate?: jest.Mock;
  onDelete?: jest.Mock;
}) {
  const [field, setField] = useState(initialField);
  function handleUpdate(updated: BaseFieldConfig) {
    setField(updated);
    onUpdate(updated);
  }
  return <FieldEditorWidget field={field} onUpdate={handleUpdate} onDelete={onDelete} />;
}

describe('FieldEditorWidget', () => {
  it('renders the field config panel inputs', () => {
    render(<FieldEditorWidget field={makeField()} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByLabelText('Label')).toHaveValue('Project Name');
    expect(screen.getByLabelText('Help text')).toHaveValue('Enter your project name');
    expect(screen.getByLabelText('Required')).not.toBeChecked();
    expect(screen.getByLabelText('Variable name')).toHaveValue('project_name');
  });

  it('renders the Delete field button', () => {
    render(<FieldEditorWidget field={makeField()} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Delete field' })).toBeInTheDocument();
  });

  it('calls onUpdate when a field config input changes', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(<ControlledFieldEditorWidget initialField={makeField()} onUpdate={onUpdate} />);

    await user.clear(screen.getByLabelText('Label'));
    await user.type(screen.getByLabelText('Label'), 'Budget');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ label: 'Budget' }));
  });

  it('shows confirmation dialog when Delete field is clicked', async () => {
    const user = userEvent.setup();

    render(<FieldEditorWidget field={makeField()} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Delete field' }));

    expect(screen.getByRole('dialog', { name: 'Confirm field deletion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onDelete only after confirming, not on initial Delete field click', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();

    render(<FieldEditorWidget field={makeField()} onUpdate={jest.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete field' }));

    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
