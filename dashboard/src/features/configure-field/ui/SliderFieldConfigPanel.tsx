'use client';

import type { BaseFieldConfig, SliderFieldConfig } from '@/shared/config';
import { FieldConfigPanel } from './FieldConfigPanel';

interface SliderFieldConfigPanelProps {
  field: SliderFieldConfig;
  onUpdate: (updated: SliderFieldConfig) => void;
}

export function SliderFieldConfigPanel({ field, onUpdate }: SliderFieldConfigPanelProps) {
  function handleBaseUpdate(updatedBase: BaseFieldConfig): void {
    onUpdate({ ...field, ...updatedBase, type: 'slider' });
  }

  function handleNumericChange(
    key: 'min' | 'max' | 'step' | 'defaultValue',
    rawValue: string,
  ): void {
    const parsed = parseFloat(rawValue);
    onUpdate({ ...field, [key]: isNaN(parsed) ? undefined : parsed });
  }

  return (
    <div>
      <FieldConfigPanel field={field} onUpdate={handleBaseUpdate} />

      <div>
        <label htmlFor="slider-min">Min</label>
        <input
          id="slider-min"
          type="number"
          value={field.min ?? ''}
          onChange={(e) => handleNumericChange('min', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="slider-max">Max</label>
        <input
          id="slider-max"
          type="number"
          value={field.max ?? ''}
          onChange={(e) => handleNumericChange('max', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="slider-step">Step</label>
        <input
          id="slider-step"
          type="number"
          value={field.step ?? ''}
          onChange={(e) => handleNumericChange('step', e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="slider-default">Default value</label>
        <input
          id="slider-default"
          type="number"
          value={field.defaultValue ?? ''}
          onChange={(e) => handleNumericChange('defaultValue', e.target.value)}
        />
      </div>
    </div>
  );
}
