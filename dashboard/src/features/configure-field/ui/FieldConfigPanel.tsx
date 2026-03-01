'use client';

import type { BaseFieldConfig } from '@/shared/config';
import { generateVariableName } from '@/shared/lib';

interface FieldConfigPanelProps {
  field: BaseFieldConfig;
  onUpdate: (updated: BaseFieldConfig) => void;
}

export function FieldConfigPanel({ field, onUpdate }: FieldConfigPanelProps) {
  function handleLabelChange(newLabel: string): void {
    const isVariableNameInSync = field.variableName === generateVariableName(field.label);

    onUpdate({
      ...field,
      label: newLabel,
      variableName: isVariableNameInSync ? generateVariableName(newLabel) : field.variableName,
    });
  }

  function handleHelpTextChange(newHelpText: string): void {
    onUpdate({ ...field, helpText: newHelpText });
  }

  function handleRequiredChange(newRequired: boolean): void {
    onUpdate({ ...field, required: newRequired });
  }

  function handleVariableNameChange(newVariableName: string): void {
    onUpdate({ ...field, variableName: newVariableName });
  }

  return (
    <div>
      <div>
        <label htmlFor="field-label">Label</label>
        <input
          id="field-label"
          type="text"
          value={field.label}
          onChange={(e) => handleLabelChange(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="field-help-text">Help text</label>
        <input
          id="field-help-text"
          type="text"
          value={field.helpText ?? ''}
          onChange={(e) => handleHelpTextChange(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="field-required">Required</label>
        <input
          id="field-required"
          type="checkbox"
          checked={field.required}
          onChange={(e) => handleRequiredChange(e.target.checked)}
        />
      </div>

      <div>
        <label htmlFor="field-variable-name">Variable name</label>
        <input
          id="field-variable-name"
          type="text"
          value={field.variableName}
          onChange={(e) => handleVariableNameChange(e.target.value)}
        />
      </div>
    </div>
  );
}
