'use client';

import type { BaseFieldConfig, FieldOption, CheckboxFieldConfig } from '@/shared/config';
import { FieldConfigPanel } from './FieldConfigPanel';
import { OptionListEditor } from './OptionListEditor';

interface CheckboxFieldConfigPanelProps {
  field: CheckboxFieldConfig;
  onUpdate: (updated: CheckboxFieldConfig) => void;
}

export function CheckboxFieldConfigPanel({ field, onUpdate }: CheckboxFieldConfigPanelProps) {
  function handleBaseUpdate(updatedBase: BaseFieldConfig): void {
    onUpdate({ ...updatedBase, type: 'checkbox', options: field.options });
  }

  function handleOptionsChange(updatedOptions: FieldOption[]): void {
    onUpdate({ ...field, options: updatedOptions });
  }

  return (
    <div>
      <FieldConfigPanel field={field} onUpdate={handleBaseUpdate} />
      <OptionListEditor options={field.options} onChange={handleOptionsChange} />
    </div>
  );
}
