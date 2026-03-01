'use client';

import type { FieldOption } from '@/shared/config';
import { generateId } from '@/shared/lib';

interface OptionListEditorProps {
  options: FieldOption[];
  onChange: (options: FieldOption[]) => void;
}

export function OptionListEditor({ options, onChange }: OptionListEditorProps) {
  function handleLabelChange(index: number, newLabel: string): void {
    const updated = options.map((option, i) =>
      i === index ? { ...option, label: newLabel } : option,
    );
    onChange(updated);
  }

  function handleValueChange(index: number, newValue: string): void {
    const updated = options.map((option, i) =>
      i === index ? { ...option, value: newValue } : option,
    );
    onChange(updated);
  }

  function handleRemove(index: number): void {
    const updated = options.filter((_, i) => i !== index);
    onChange(updated);
  }

  function handleAddOption(): void {
    const newOption: FieldOption = { id: generateId(), label: '', value: '' };
    onChange([...options, newOption]);
  }

  return (
    <div>
      {options.map((option, index) => (
        <div key={option.id}>
          <label htmlFor={`option-label-${index}`}>Label</label>
          <input
            id={`option-label-${index}`}
            type="text"
            value={option.label}
            onChange={(e) => handleLabelChange(index, e.target.value)}
          />
          <label htmlFor={`option-value-${index}`}>Value</label>
          <input
            id={`option-value-${index}`}
            type="text"
            value={option.value}
            onChange={(e) => handleValueChange(index, e.target.value)}
          />
          <button type="button" onClick={() => handleRemove(index)}>
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={handleAddOption}>
        Add option
      </button>
    </div>
  );
}
