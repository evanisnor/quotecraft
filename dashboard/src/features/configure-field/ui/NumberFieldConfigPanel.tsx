'use client';

import type { BaseFieldConfig, NumberFieldConfig } from '@/shared/config';
import { FieldConfigPanel } from './FieldConfigPanel';

interface NumberFieldConfigPanelProps {
  field: NumberFieldConfig;
  onUpdate: (updated: NumberFieldConfig) => void;
}

export function NumberFieldConfigPanel({ field, onUpdate }: NumberFieldConfigPanelProps) {
  function handleBaseUpdate(updatedBase: BaseFieldConfig): void {
    onUpdate({ ...field, ...updatedBase, type: 'number' });
  }

  function handleNumericChange(
    key: 'min' | 'max' | 'step' | 'defaultValue',
    rawValue: string,
  ): void {
    const parsed = parseFloat(rawValue);
    onUpdate({ ...field, [key]: isNaN(parsed) ? undefined : parsed });
  }

  function handlePlaceholderChange(rawValue: string): void {
    onUpdate({ ...field, placeholder: rawValue === '' ? undefined : rawValue });
  }

  return (
    <div>
      <FieldConfigPanel field={field} onUpdate={handleBaseUpdate} />

      <div>
        <label htmlFor="number-min">Min</label>
        <input
          id="number-min"
          type="number"
          value={field.min ?? ''}
          onChange={(e) => handleNumericChange('min', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="number-max">Max</label>
        <input
          id="number-max"
          type="number"
          value={field.max ?? ''}
          onChange={(e) => handleNumericChange('max', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="number-step">Step</label>
        <input
          id="number-step"
          type="number"
          value={field.step ?? ''}
          onChange={(e) => handleNumericChange('step', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="number-default">Default value</label>
        <input
          id="number-default"
          type="number"
          value={field.defaultValue ?? ''}
          onChange={(e) => handleNumericChange('defaultValue', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="number-placeholder">Placeholder</label>
        <input
          id="number-placeholder"
          type="text"
          value={field.placeholder ?? ''}
          onChange={(e) => handlePlaceholderChange(e.target.value)}
        />
      </div>
    </div>
  );
}
