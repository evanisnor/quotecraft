'use client';

import type { BaseFieldConfig, DropdownFieldConfig, FieldOption } from '@/shared/config';
import { FieldConfigPanel } from './FieldConfigPanel';
import { OptionListEditor } from './OptionListEditor';

interface DropdownFieldConfigPanelProps {
  field: DropdownFieldConfig;
  onUpdate: (updated: DropdownFieldConfig) => void;
}

export function DropdownFieldConfigPanel({ field, onUpdate }: DropdownFieldConfigPanelProps) {
  function handleBaseUpdate(updatedBase: BaseFieldConfig): void {
    onUpdate({ ...updatedBase, type: 'dropdown', options: field.options });
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
