import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StepManager } from './StepManager';
import type { Step, BaseFieldConfig } from '@/shared/config';

function makeStep(overrides: Partial<Step> & Pick<Step, 'id' | 'title'>): Step {
  return { fieldIds: [], ...overrides };
}

function makeField(
  overrides: Partial<BaseFieldConfig> & Pick<BaseFieldConfig, 'id' | 'label'>,
): BaseFieldConfig {
  return {
    type: 'text',
    required: false,
    variableName: overrides.label?.toLowerCase().replace(/\s+/g, '_') ?? 'field',
    ...overrides,
  };
}

const defaultProps = {
  steps: [] as Step[],
  fields: [] as BaseFieldConfig[],
  onAddStep: jest.fn(),
  onDeleteStep: jest.fn(),
  onReorderSteps: jest.fn(),
  onRenameStep: jest.fn(),
  onMoveFieldToStep: jest.fn(),
  onRemoveFieldFromStep: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('StepManager', () => {
  it('renders a section with the "Step manager" label', () => {
    render(<StepManager {...defaultProps} />);

    expect(screen.getByRole('region', { name: 'Step manager' })).toBeInTheDocument();
  });

  it('renders each step title as an editable input', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Step 1' }),
      makeStep({ id: 's2', title: 'Step 2' }),
    ];

    render(<StepManager {...defaultProps} steps={steps} />);

    expect(screen.getByRole('textbox', { name: 'Step 1 title' })).toHaveValue('Step 1');
    expect(screen.getByRole('textbox', { name: 'Step 2 title' })).toHaveValue('Step 2');
  });

  it('shows fields assigned to a step within that step block', () => {
    const field = makeField({ id: 'f1', label: 'My Field' });
    const step = makeStep({ id: 's1', title: 'Step 1', fieldIds: ['f1'] });

    render(<StepManager {...defaultProps} steps={[step]} fields={[field]} />);

    // The field label should appear in the step area
    expect(screen.getByText('My Field')).toBeInTheDocument();
  });

  it('clicking "Remove from step" button calls onRemoveFieldFromStep with fieldId and stepId', async () => {
    const user = userEvent.setup();
    const onRemoveFieldFromStep = jest.fn();
    const field = makeField({ id: 'f1', label: 'My Field' });
    const step = makeStep({ id: 's1', title: 'Step 1', fieldIds: ['f1'] });

    render(
      <StepManager
        {...defaultProps}
        steps={[step]}
        fields={[field]}
        onRemoveFieldFromStep={onRemoveFieldFromStep}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Remove My Field from Step 1' }));

    expect(onRemoveFieldFromStep).toHaveBeenCalledWith('f1', 's1');
    expect(onRemoveFieldFromStep).toHaveBeenCalledTimes(1);
  });

  it('"Move step up" button is disabled for the first step', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Step 1' }),
      makeStep({ id: 's2', title: 'Step 2' }),
    ];

    render(<StepManager {...defaultProps} steps={steps} />);

    expect(screen.getByRole('button', { name: 'Move Step 1 up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Step 2 up' })).not.toBeDisabled();
  });

  it('"Move step down" button is disabled for the last step', () => {
    const steps = [
      makeStep({ id: 's1', title: 'Step 1' }),
      makeStep({ id: 's2', title: 'Step 2' }),
    ];

    render(<StepManager {...defaultProps} steps={steps} />);

    expect(screen.getByRole('button', { name: 'Move Step 1 down' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move Step 2 down' })).toBeDisabled();
  });

  it('clicking "Move step up" calls onReorderSteps with the steps swapped', async () => {
    const user = userEvent.setup();
    const onReorderSteps = jest.fn();
    const step1 = makeStep({ id: 's1', title: 'Step 1' });
    const step2 = makeStep({ id: 's2', title: 'Step 2' });

    render(
      <StepManager {...defaultProps} steps={[step1, step2]} onReorderSteps={onReorderSteps} />,
    );

    await user.click(screen.getByRole('button', { name: 'Move Step 2 up' }));

    expect(onReorderSteps).toHaveBeenCalledWith([step2, step1]);
    expect(onReorderSteps).toHaveBeenCalledTimes(1);
  });

  it('clicking "Move step down" calls onReorderSteps with the steps swapped', async () => {
    const user = userEvent.setup();
    const onReorderSteps = jest.fn();
    const step1 = makeStep({ id: 's1', title: 'Step 1' });
    const step2 = makeStep({ id: 's2', title: 'Step 2' });

    render(
      <StepManager {...defaultProps} steps={[step1, step2]} onReorderSteps={onReorderSteps} />,
    );

    await user.click(screen.getByRole('button', { name: 'Move Step 1 down' }));

    expect(onReorderSteps).toHaveBeenCalledWith([step2, step1]);
    expect(onReorderSteps).toHaveBeenCalledTimes(1);
  });

  it('changing a step title input calls onRenameStep with the step id and new title', () => {
    const onRenameStep = jest.fn();
    const step = makeStep({ id: 's1', title: 'Step 1' });

    render(<StepManager {...defaultProps} steps={[step]} onRenameStep={onRenameStep} />);

    const input = screen.getByRole('textbox', { name: 'Step 1 title' });
    fireEvent.change(input, { target: { value: 'Intro' } });

    expect(onRenameStep).toHaveBeenCalledWith('s1', 'Intro');
    expect(onRenameStep).toHaveBeenCalledTimes(1);
  });

  it('clicking "Delete step" calls onDeleteStep with the step id', async () => {
    const user = userEvent.setup();
    const onDeleteStep = jest.fn();
    const step = makeStep({ id: 's1', title: 'Step 1' });

    render(<StepManager {...defaultProps} steps={[step]} onDeleteStep={onDeleteStep} />);

    await user.click(screen.getByRole('button', { name: 'Delete Step 1' }));

    expect(onDeleteStep).toHaveBeenCalledWith('s1');
    expect(onDeleteStep).toHaveBeenCalledTimes(1);
  });

  it('shows the unassigned fields section when there are fields not in any step', () => {
    const field = makeField({ id: 'f1', label: 'Unassigned Field' });
    const step = makeStep({ id: 's1', title: 'Step 1', fieldIds: [] });

    render(<StepManager {...defaultProps} steps={[step]} fields={[field]} />);

    expect(screen.getByRole('list', { name: 'Unassigned fields' })).toBeInTheDocument();
    expect(screen.getByText('Unassigned Field')).toBeInTheDocument();
  });

  it('does not show the unassigned fields section when all fields are assigned', () => {
    const field = makeField({ id: 'f1', label: 'Assigned Field' });
    const step = makeStep({ id: 's1', title: 'Step 1', fieldIds: ['f1'] });

    render(<StepManager {...defaultProps} steps={[step]} fields={[field]} />);

    expect(screen.queryByRole('list', { name: 'Unassigned fields' })).not.toBeInTheDocument();
  });

  it('selecting a step in the assign dropdown calls onMoveFieldToStep', async () => {
    const user = userEvent.setup();
    const onMoveFieldToStep = jest.fn();
    const field = makeField({ id: 'f1', label: 'Unassigned Field' });
    const step = makeStep({ id: 's1', title: 'Step 1', fieldIds: [] });

    render(
      <StepManager
        {...defaultProps}
        steps={[step]}
        fields={[field]}
        onMoveFieldToStep={onMoveFieldToStep}
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Assign Unassigned Field to step' }),
      'Step 1',
    );

    expect(onMoveFieldToStep).toHaveBeenCalledWith('f1', 's1');
    expect(onMoveFieldToStep).toHaveBeenCalledTimes(1);
  });

  it('"Add step" button calls onAddStep', async () => {
    const user = userEvent.setup();
    const onAddStep = jest.fn();

    render(<StepManager {...defaultProps} onAddStep={onAddStep} />);

    await user.click(screen.getByRole('button', { name: 'Add step' }));

    expect(onAddStep).toHaveBeenCalledTimes(1);
  });
});
