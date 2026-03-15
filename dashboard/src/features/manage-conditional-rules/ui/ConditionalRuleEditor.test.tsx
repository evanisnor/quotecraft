import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConditionalRuleEditor } from './ConditionalRuleEditor';
import type { VisibilityRule, VisibilityCondition, BaseFieldConfig } from '@/shared/config';

function makeCondition(overrides: Partial<VisibilityCondition> = {}): VisibilityCondition {
  return {
    id: 'cond-1',
    sourceFieldId: 'field-2',
    operator: '=',
    value: '',
    ...overrides,
  };
}

function makeRule(overrides: Partial<VisibilityRule> = {}): VisibilityRule {
  return {
    id: 'rule-1',
    targetFieldId: 'field-1',
    conditions: [makeCondition()],
    combinator: 'AND',
    ...overrides,
  };
}

function makeField(
  overrides: Partial<BaseFieldConfig> & Pick<BaseFieldConfig, 'id' | 'label'>,
): BaseFieldConfig {
  return {
    type: 'text',
    required: false,
    variableName: overrides.label.toLowerCase().replace(/\s+/g, '_'),
    ...overrides,
  };
}

const field1 = makeField({ id: 'field-1', label: 'Name' });
const field2 = makeField({ id: 'field-2', label: 'Age' });
const field3 = makeField({ id: 'field-3', label: 'Country' });

const defaultProps = {
  rules: [] as VisibilityRule[],
  fields: [field1, field2] as BaseFieldConfig[],
  onAddRule: jest.fn(),
  onUpdateRule: jest.fn(),
  onDeleteRule: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ConditionalRuleEditor', () => {
  it('renders a section with "Conditional visibility rules" label', () => {
    render(<ConditionalRuleEditor {...defaultProps} />);

    expect(
      screen.getByRole('region', { name: 'Conditional visibility rules' }),
    ).toBeInTheDocument();
  });

  it('renders each rule as a row with target field, source field, operator, value, delete', () => {
    const rule = makeRule();
    render(<ConditionalRuleEditor {...defaultProps} rules={[rule]} />);

    expect(screen.getByRole('combobox', { name: 'Rule 1 target field' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Rule 1 source field' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Rule 1 operator' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Rule 1 value' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete rule 1' })).toBeInTheDocument();
  });

  it('selecting a different target field calls onUpdateRule with updated targetFieldId', async () => {
    const user = userEvent.setup();
    const onUpdateRule = jest.fn();
    const rule = makeRule({ id: 'rule-1', targetFieldId: 'field-1' });
    render(
      <ConditionalRuleEditor
        {...defaultProps}
        rules={[rule]}
        fields={[field1, field2]}
        onUpdateRule={onUpdateRule}
      />,
    );

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rule 1 target field' }), 'Age');

    expect(onUpdateRule).toHaveBeenCalledTimes(1);
    expect(onUpdateRule).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'rule-1', targetFieldId: 'field-2' }),
    );
  });

  it('selecting a different source field calls onUpdateRule with updated condition sourceFieldId', async () => {
    const user = userEvent.setup();
    const onUpdateRule = jest.fn();
    const rule = makeRule({
      id: 'rule-1',
      targetFieldId: 'field-1',
      conditions: [makeCondition({ id: 'cond-1', sourceFieldId: 'field-2' })],
    });
    render(
      <ConditionalRuleEditor
        {...defaultProps}
        rules={[rule]}
        fields={[field1, field2, field3]}
        onUpdateRule={onUpdateRule}
      />,
    );

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Rule 1 source field' }),
      'Country',
    );

    expect(onUpdateRule).toHaveBeenCalledTimes(1);
    const updatedRule = onUpdateRule.mock.calls[0][0] as VisibilityRule;
    expect(updatedRule.conditions[0].sourceFieldId).toBe('field-3');
  });

  it('selecting a different operator calls onUpdateRule with updated condition operator', async () => {
    const user = userEvent.setup();
    const onUpdateRule = jest.fn();
    const rule = makeRule({
      id: 'rule-1',
      conditions: [makeCondition({ id: 'cond-1', operator: '=' })],
    });
    render(<ConditionalRuleEditor {...defaultProps} rules={[rule]} onUpdateRule={onUpdateRule} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Rule 1 operator' }), '>');

    expect(onUpdateRule).toHaveBeenCalledTimes(1);
    const updatedRule = onUpdateRule.mock.calls[0][0] as VisibilityRule;
    expect(updatedRule.conditions[0].operator).toBe('>');
  });

  it('typing in the value input calls onUpdateRule with updated condition value', async () => {
    const user = userEvent.setup();
    const onUpdateRule = jest.fn();
    const rule = makeRule({
      id: 'rule-1',
      conditions: [makeCondition({ id: 'cond-1', value: '' })],
    });
    render(<ConditionalRuleEditor {...defaultProps} rules={[rule]} onUpdateRule={onUpdateRule} />);

    await user.type(screen.getByRole('textbox', { name: 'Rule 1 value' }), '18');

    expect(onUpdateRule).toHaveBeenCalled();
    const lastCall = onUpdateRule.mock.calls[
      onUpdateRule.mock.calls.length - 1
    ][0] as VisibilityRule;
    expect(lastCall.conditions[0].value).toBe('8');
  });

  it('clicking the delete button calls onDeleteRule with the rule id', async () => {
    const user = userEvent.setup();
    const onDeleteRule = jest.fn();
    const rule = makeRule({ id: 'rule-1' });
    render(<ConditionalRuleEditor {...defaultProps} rules={[rule]} onDeleteRule={onDeleteRule} />);

    await user.click(screen.getByRole('button', { name: 'Delete rule 1' }));

    expect(onDeleteRule).toHaveBeenCalledTimes(1);
    expect(onDeleteRule).toHaveBeenCalledWith('rule-1');
  });

  it('clicking "Add rule" calls onAddRule', async () => {
    const user = userEvent.setup();
    const onAddRule = jest.fn();
    render(<ConditionalRuleEditor {...defaultProps} onAddRule={onAddRule} />);

    await user.click(screen.getByRole('button', { name: 'Add rule' }));

    expect(onAddRule).toHaveBeenCalledTimes(1);
  });

  it('"Add rule" button is disabled when fields list is empty', () => {
    render(<ConditionalRuleEditor {...defaultProps} fields={[]} />);

    expect(screen.getByRole('button', { name: 'Add rule' })).toBeDisabled();
  });

  it('"Add rule" button is enabled when there are fields', () => {
    render(<ConditionalRuleEditor {...defaultProps} fields={[field1, field2]} />);

    expect(screen.getByRole('button', { name: 'Add rule' })).not.toBeDisabled();
  });

  it('source field dropdown excludes the currently selected target field', () => {
    const rule = makeRule({
      targetFieldId: 'field-1',
      conditions: [makeCondition({ sourceFieldId: 'field-2' })],
    });
    render(
      <ConditionalRuleEditor {...defaultProps} rules={[rule]} fields={[field1, field2, field3]} />,
    );

    const sourceSelect = screen.getByRole('combobox', { name: 'Rule 1 source field' });
    const options = Array.from(sourceSelect.querySelectorAll('option')).map((o) => o.textContent);

    expect(options).not.toContain('Name');
    expect(options).toContain('Age');
    expect(options).toContain('Country');
  });

  it('shows all fields in the source dropdown when there is only one field', () => {
    const rule = makeRule({
      targetFieldId: 'field-1',
      conditions: [makeCondition({ sourceFieldId: 'field-1' })],
    });
    render(<ConditionalRuleEditor {...defaultProps} rules={[rule]} fields={[field1]} />);

    const sourceSelect = screen.getByRole('combobox', { name: 'Rule 1 source field' });
    const options = Array.from(sourceSelect.querySelectorAll('option')).map((o) => o.textContent);

    expect(options).toContain('Name');
  });

  it('renders multiple rules correctly', () => {
    const rule1 = makeRule({
      id: 'rule-1',
      targetFieldId: 'field-1',
      conditions: [makeCondition({ id: 'cond-1', sourceFieldId: 'field-2' })],
    });
    const rule2 = makeRule({
      id: 'rule-2',
      targetFieldId: 'field-2',
      conditions: [makeCondition({ id: 'cond-2', sourceFieldId: 'field-1' })],
    });
    render(<ConditionalRuleEditor {...defaultProps} rules={[rule1, rule2]} />);

    expect(screen.getByRole('combobox', { name: 'Rule 1 target field' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Rule 2 target field' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete rule 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete rule 2' })).toBeInTheDocument();
  });

  it('shows only the "Add rule" button when rules is empty', () => {
    render(<ConditionalRuleEditor {...defaultProps} rules={[]} />);

    expect(screen.getByRole('button', { name: 'Add rule' })).toBeInTheDocument();
    expect(screen.queryByRole('combobox', { name: 'Rule 1 target field' })).not.toBeInTheDocument();
  });
});
