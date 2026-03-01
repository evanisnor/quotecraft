import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { BaseFieldConfig } from '@/shared/config';
import { FieldConfigPanel } from './FieldConfigPanel';

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

/**
 * Stateful wrapper so that userEvent interactions propagate back through the
 * controlled component correctly.
 */
function ControlledFieldConfigPanel({
  initialField,
  onUpdate = jest.fn(),
}: {
  initialField: BaseFieldConfig;
  onUpdate?: jest.Mock;
}) {
  const [field, setField] = useState(initialField);
  function handleUpdate(updated: BaseFieldConfig) {
    setField(updated);
    onUpdate(updated);
  }
  return <FieldConfigPanel field={field} onUpdate={handleUpdate} />;
}

describe('FieldConfigPanel', () => {
  it('renders label input populated from field prop', () => {
    render(<FieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);
    expect(screen.getByLabelText('Label')).toHaveValue('Project Name');
  });

  it('renders help text input populated from field prop', () => {
    render(<FieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);
    expect(screen.getByLabelText('Help text')).toHaveValue('Enter your project name');
  });

  it('renders help text input as empty when helpText is absent', () => {
    render(<FieldConfigPanel field={makeField({ helpText: undefined })} onUpdate={jest.fn()} />);
    expect(screen.getByLabelText('Help text')).toHaveValue('');
  });

  it('renders required checkbox populated from field prop when unchecked', () => {
    render(<FieldConfigPanel field={makeField({ required: false })} onUpdate={jest.fn()} />);
    expect(screen.getByLabelText('Required')).not.toBeChecked();
  });

  it('renders required checkbox populated from field prop when checked', () => {
    render(<FieldConfigPanel field={makeField({ required: true })} onUpdate={jest.fn()} />);
    expect(screen.getByLabelText('Required')).toBeChecked();
  });

  it('renders variable name input populated from field prop', () => {
    render(<FieldConfigPanel field={makeField()} onUpdate={jest.fn()} />);
    expect(screen.getByLabelText('Variable name')).toHaveValue('project_name');
  });

  describe('changing the label', () => {
    it('calls onUpdate with the new label and auto-updates variableName when it was in sync with the old label', async () => {
      const onUpdate = jest.fn();
      const user = userEvent.setup();
      // variableName matches generateVariableName('Project Name') → 'project_name'
      const initialField = makeField({ label: 'Project Name', variableName: 'project_name' });

      render(<ControlledFieldConfigPanel initialField={initialField} onUpdate={onUpdate} />);

      await user.clear(screen.getByLabelText('Label'));
      await user.type(screen.getByLabelText('Label'), 'Budget Amount');

      expect(onUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          label: 'Budget Amount',
          variableName: 'budget_amount',
        }),
      );
    });

    it('calls onUpdate with the new label but does NOT override variableName when it was manually set', async () => {
      const onUpdate = jest.fn();
      const user = userEvent.setup();
      // variableName does NOT match generateVariableName('Project Name') → 'project_name'
      const initialField = makeField({ label: 'Project Name', variableName: 'my_custom_var' });

      render(<ControlledFieldConfigPanel initialField={initialField} onUpdate={onUpdate} />);

      await user.clear(screen.getByLabelText('Label'));
      await user.type(screen.getByLabelText('Label'), 'Budget Amount');

      expect(onUpdate).toHaveBeenLastCalledWith(
        expect.objectContaining({
          label: 'Budget Amount',
          variableName: 'my_custom_var',
        }),
      );
    });
  });

  it('calls onUpdate with updated helpText when help text input changes', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    const initialField = makeField();

    render(<ControlledFieldConfigPanel initialField={initialField} onUpdate={onUpdate} />);

    await user.clear(screen.getByLabelText('Help text'));
    await user.type(screen.getByLabelText('Help text'), 'Describe your project');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({ helpText: 'Describe your project' }),
    );
  });

  it('calls onUpdate with required true when the required checkbox is toggled on', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    const initialField = makeField({ required: false });

    render(<ControlledFieldConfigPanel initialField={initialField} onUpdate={onUpdate} />);

    await user.click(screen.getByLabelText('Required'));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ required: true }));
  });

  it('calls onUpdate with required false when the required checkbox is toggled off', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    const initialField = makeField({ required: true });

    render(<ControlledFieldConfigPanel initialField={initialField} onUpdate={onUpdate} />);

    await user.click(screen.getByLabelText('Required'));

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ required: false }));
  });

  it('calls onUpdate with new variableName and leaves label unchanged when variable name input changes', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();
    const initialField = makeField({ label: 'Project Name', variableName: 'project_name' });

    render(<ControlledFieldConfigPanel initialField={initialField} onUpdate={onUpdate} />);

    await user.clear(screen.getByLabelText('Variable name'));
    await user.type(screen.getByLabelText('Variable name'), 'proj_nm');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Project Name',
        variableName: 'proj_nm',
      }),
    );
  });
});
