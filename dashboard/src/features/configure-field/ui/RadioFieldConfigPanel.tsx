'use client';

import type { BaseFieldConfig, FieldOption, RadioFieldConfig } from '@/shared/config';
import { FieldConfigPanel } from './FieldConfigPanel';
import { OptionListEditor } from './OptionListEditor';

interface RadioFieldConfigPanelProps {
  field: RadioFieldConfig;
  onUpdate: (updated: RadioFieldConfig) => void;
}

export function RadioFieldConfigPanel({ field, onUpdate }: RadioFieldConfigPanelProps) {
  function handleBaseUpdate(updatedBase: BaseFieldConfig): void {
    onUpdate({ ...updatedBase, type: 'radio', options: field.options });
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
