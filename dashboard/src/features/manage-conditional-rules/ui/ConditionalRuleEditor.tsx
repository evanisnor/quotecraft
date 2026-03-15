'use client';

import type { BaseFieldConfig, VisibilityRule, ComparisonOperator } from '@/shared/config';

interface ConditionalRuleEditorProps {
  rules: VisibilityRule[];
  fields: BaseFieldConfig[];
  onAddRule: () => void;
  onUpdateRule: (rule: VisibilityRule) => void;
  onDeleteRule: (ruleId: string) => void;
}

const OPERATORS: ComparisonOperator[] = ['=', '!=', '>', '<', '>=', '<='];

export function ConditionalRuleEditor({
  rules,
  fields,
  onAddRule,
  onUpdateRule,
  onDeleteRule,
}: ConditionalRuleEditorProps) {
  function handleTargetFieldChange(rule: VisibilityRule, targetFieldId: string): void {
    onUpdateRule({ ...rule, targetFieldId });
  }

  function handleSourceFieldChange(rule: VisibilityRule, sourceFieldId: string): void {
    const [condition, ...rest] = rule.conditions;
    onUpdateRule({
      ...rule,
      conditions: [{ ...condition, sourceFieldId }, ...rest],
    });
  }

  function handleOperatorChange(rule: VisibilityRule, operator: ComparisonOperator): void {
    const [condition, ...rest] = rule.conditions;
    onUpdateRule({
      ...rule,
      conditions: [{ ...condition, operator }, ...rest],
    });
  }

  function handleValueChange(rule: VisibilityRule, value: string): void {
    const [condition, ...rest] = rule.conditions;
    onUpdateRule({
      ...rule,
      conditions: [{ ...condition, value }, ...rest],
    });
  }

  function getSourceFields(rule: VisibilityRule): BaseFieldConfig[] {
    if (fields.length <= 1) {
      return fields;
    }
    return fields.filter((f) => f.id !== rule.targetFieldId);
  }

  return (
    <section aria-label="Conditional visibility rules">
      {rules.map((rule, index) => {
        const ruleNumber = index + 1;
        const condition = rule.conditions[0];
        const sourceFields = getSourceFields(rule);

        if (condition === undefined) return null;

        return (
          <div key={rule.id}>
            <span>Show</span>
            <select
              aria-label={`Rule ${ruleNumber} target field`}
              value={rule.targetFieldId}
              onChange={(e) => handleTargetFieldChange(rule, e.target.value)}
            >
              {fields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
            <span>when</span>
            <select
              aria-label={`Rule ${ruleNumber} source field`}
              value={condition.sourceFieldId}
              onChange={(e) => handleSourceFieldChange(rule, e.target.value)}
            >
              {sourceFields.map((field) => (
                <option key={field.id} value={field.id}>
                  {field.label}
                </option>
              ))}
            </select>
            <select
              aria-label={`Rule ${ruleNumber} operator`}
              value={condition.operator}
              onChange={(e) => handleOperatorChange(rule, e.target.value as ComparisonOperator)}
            >
              {OPERATORS.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            <input
              type="text"
              aria-label={`Rule ${ruleNumber} value`}
              value={condition.value}
              onChange={(e) => handleValueChange(rule, e.target.value)}
            />
            <button
              type="button"
              aria-label={`Delete rule ${ruleNumber}`}
              onClick={() => onDeleteRule(rule.id)}
            >
              Delete
            </button>
          </div>
        );
      })}
      <button type="button" disabled={fields.length === 0} onClick={onAddRule}>
        Add rule
      </button>
    </section>
  );
}
