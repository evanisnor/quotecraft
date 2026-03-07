'use client';

import { useMemo, useState } from 'react';
import type { ApiClient } from '@/shared/api';
import { FieldTypePalette } from '@/features/add-field';
import { DraggableFieldList } from '@/features/reorder-fields';
import { useAutoSave, SaveStatusIndicator } from '@/features/auto-save';
import { FieldEditorWidget } from '@/widgets/field-editor';
import { PreviewPane, CalculatorPreviewForm } from '@/widgets/calculator-preview';
import type {
  BaseFieldConfig,
  FieldType,
  DropdownFieldConfig,
  RadioFieldConfig,
  CheckboxFieldConfig,
} from '@/shared/config';
import { FIELD_TYPE_LABELS } from '@/shared/config';
import { generateId, generateVariableName } from '@/shared/lib';

interface EditorPageProps {
  calculatorId: string;
  client: ApiClient;
}

function createField(type: FieldType): BaseFieldConfig {
  const id = generateId();
  const label = FIELD_TYPE_LABELS[type];
  const base: BaseFieldConfig = {
    id,
    type,
    label,
    required: false,
    variableName: generateVariableName(label),
  };
  if (type === 'dropdown' || type === 'radio' || type === 'checkbox') {
    return { ...base, options: [] } as DropdownFieldConfig | RadioFieldConfig | CheckboxFieldConfig;
  }
  return base;
}

export function EditorPage({ calculatorId, client }: EditorPageProps) {
  const [fields, setFields] = useState<BaseFieldConfig[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  // Build the full config payload from current editor state.
  // outputs is empty until CALC-US2 is implemented.
  const config = useMemo(() => ({ fields, outputs: [] }), [fields]);

  const { status: saveStatus, save } = useAutoSave(client, calculatorId, config);

  function handleAddField(type: FieldType): void {
    const newField = createField(type);
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
  }

  function handleReorder(reordered: BaseFieldConfig[]): void {
    setFields(reordered);
  }

  function handleUpdate(updated: BaseFieldConfig): void {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  function handleDelete(): void {
    setFields((prev) => prev.filter((f) => f.id !== selectedFieldId));
    setSelectedFieldId(null);
  }

  return (
    <main data-calculator-id={calculatorId}>
      <h1>Calculator Editor</h1>
      <SaveStatusIndicator status={saveStatus} onSave={save} />
      <div className="flex gap-6">
        <div className="flex-1">
          <FieldTypePalette onAdd={handleAddField} />
          <DraggableFieldList
            fields={fields}
            onReorder={handleReorder}
            renderField={(field) => (
              <button type="button" onClick={() => setSelectedFieldId(field.id)}>
                {field.label}
              </button>
            )}
          />
          {selectedField !== null && (
            <FieldEditorWidget
              field={selectedField}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          )}
        </div>
        <div className="flex-1">
          <PreviewPane>
            <CalculatorPreviewForm fields={fields} outputs={[]} />
          </PreviewPane>
        </div>
      </div>
    </main>
  );
}
