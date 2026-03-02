'use client';

import { useState } from 'react';
import type {
  BaseFieldConfig,
  NumberFieldConfig,
  SliderFieldConfig,
  DropdownFieldConfig,
  RadioFieldConfig,
} from '@/shared/config';
import { FieldPreviewRenderer } from './FieldPreviewRenderer';

export interface CalculatorPreviewFormProps {
  fields: BaseFieldConfig[];
}

function getInitialValue(field: BaseFieldConfig): number {
  switch (field.type) {
    case 'number': {
      const numberField = field as NumberFieldConfig;
      return numberField.defaultValue ?? 0;
    }
    case 'slider': {
      const sliderField = field as SliderFieldConfig;
      return sliderField.defaultValue ?? sliderField.min ?? 0;
    }
    case 'text':
      return 0;
    case 'dropdown': {
      const dropdownField = field as DropdownFieldConfig;
      return parseFloat(dropdownField.options[0]?.value ?? '0') || 0;
    }
    case 'radio': {
      const radioField = field as RadioFieldConfig;
      return parseFloat(radioField.options[0]?.value ?? '0') || 0;
    }
    case 'checkbox':
      return 0;
    case 'image_select':
      return 0;
  }
}

function buildInitialValues(fields: BaseFieldConfig[]): Record<string, number> {
  const values: Record<string, number> = {};
  for (const field of fields) {
    values[field.variableName] = getInitialValue(field);
  }
  return values;
}

export function CalculatorPreviewForm({ fields }: CalculatorPreviewFormProps) {
  const [values, setValues] = useState<Record<string, number>>(() => buildInitialValues(fields));

  function handleChange(variableName: string, value: number): void {
    setValues((prev) => ({ ...prev, [variableName]: value }));
  }

  return (
    <form aria-label="Calculator Preview Form">
      {fields.length === 0 ? (
        <p>Add fields to preview your calculator.</p>
      ) : (
        fields.map((field) => (
          <FieldPreviewRenderer
            key={field.id}
            field={field}
            value={values[field.variableName] ?? 0}
            onChange={(value) => handleChange(field.variableName, value)}
          />
        ))
      )}
    </form>
  );
}
