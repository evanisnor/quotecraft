'use client';

import type { BaseFieldConfig, TextFieldConfig } from '@/shared/config';
import { FieldConfigPanel } from './FieldConfigPanel';

interface TextFieldConfigPanelProps {
  field: TextFieldConfig;
  onUpdate: (updated: TextFieldConfig) => void;
}

export function TextFieldConfigPanel({ field, onUpdate }: TextFieldConfigPanelProps) {
  function handleBaseUpdate(updatedBase: BaseFieldConfig): void {
    onUpdate({ ...field, ...updatedBase, type: 'text' });
  }

  function handlePlaceholderChange(rawValue: string): void {
    onUpdate({ ...field, placeholder: rawValue === '' ? undefined : rawValue });
  }

  return (
    <div>
      <FieldConfigPanel field={field} onUpdate={handleBaseUpdate} />

      <div>
        <label htmlFor="text-placeholder">Placeholder</label>
        <input
          id="text-placeholder"
          type="text"
          value={field.placeholder ?? ''}
          onChange={(e) => handlePlaceholderChange(e.target.value)}
        />
      </div>
    </div>
  );
}
