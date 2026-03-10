'use client';

import { useMemo, useState } from 'react';
import type { ApiClient } from '@/shared/api';
import { FieldTypePalette } from '@/features/add-field';
import { LayoutModeToggle } from '@/features/toggle-layout';
import { StepManager } from '@/features/manage-steps';
import { DraggableFieldList } from '@/features/reorder-fields';
import { useAutoSave, SaveStatusIndicator } from '@/features/auto-save';
import { OutputList, FormulaInput } from '@/features/manage-outputs';
import { FieldEditorWidget } from '@/widgets/field-editor';
import { PreviewPane, CalculatorPreviewForm } from '@/widgets/calculator-preview';
import type {
  BaseFieldConfig,
  FieldType,
  DropdownFieldConfig,
  RadioFieldConfig,
  CheckboxFieldConfig,
  ImageSelectFieldConfig,
  ResultOutputConfig,
  LayoutMode,
  Step,
} from '@/shared/config';
import { FIELD_TYPE_LABELS } from '@/shared/config';
import { generateId, generateVariableName, buildFieldDefaults } from '@/shared/lib';

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
  if (type === 'image_select') {
    return { ...base, options: [] } as ImageSelectFieldConfig;
  }
  return base;
}

function createOutput(index: number): ResultOutputConfig {
  return { id: generateId(), label: `Output ${index + 1}`, expression: '' };
}

export function EditorPage({ calculatorId, client }: EditorPageProps) {
  const [fields, setFields] = useState<BaseFieldConfig[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [outputs, setOutputs] = useState<ResultOutputConfig[]>([]);
  const [selectedOutputId, setSelectedOutputId] = useState<string | null>(null);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('single-page');
  const [steps, setSteps] = useState<Step[]>([]);

  const selectedField = fields.find((f) => f.id === selectedFieldId) ?? null;

  const config = useMemo(
    () => ({ fields, outputs, layoutMode, steps }),
    [fields, outputs, layoutMode, steps],
  );
  const fieldDefaults = useMemo(() => buildFieldDefaults(fields), [fields]);

  const { status: saveStatus, save } = useAutoSave(client, calculatorId, config);

  function handleAddField(type: FieldType): void {
    const newField = createField(type);
    setFields((prev) => [...prev, newField]);
    setSelectedFieldId(newField.id);
    if (layoutMode === 'multi-step') {
      setSteps((prev) =>
        prev.map((s, i) => (i === 0 ? { ...s, fieldIds: [...s.fieldIds, newField.id] } : s)),
      );
    }
  }

  function handleReorder(reordered: BaseFieldConfig[]): void {
    setFields(reordered);
  }

  function handleUpdate(updated: BaseFieldConfig): void {
    setFields((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  }

  function handleDelete(): void {
    const deletedId = selectedFieldId;
    setFields((prev) => prev.filter((f) => f.id !== deletedId));
    setSelectedFieldId(null);
    if (deletedId !== null) {
      setSteps((prev) =>
        prev.map((s) => ({ ...s, fieldIds: s.fieldIds.filter((id) => id !== deletedId) })),
      );
    }
  }

  function handleAddOutput(): void {
    const newOutput = createOutput(outputs.length);
    setOutputs((prev) => [...prev, newOutput]);
    setSelectedOutputId(newOutput.id);
  }

  function handleDeleteOutput(id: string): void {
    setOutputs((prev) => prev.filter((o) => o.id !== id));
    if (selectedOutputId === id) {
      setSelectedOutputId(null);
    }
  }

  function handleReorderOutputs(reordered: ResultOutputConfig[]): void {
    setOutputs(reordered);
  }

  function handleUpdateOutputExpression(id: string, expression: string): void {
    setOutputs((prev) => prev.map((o) => (o.id === id ? { ...o, expression } : o)));
  }

  function handleAddStep(): void {
    setSteps((prev) => [
      ...prev,
      { id: generateId(), title: `Step ${prev.length + 1}`, fieldIds: [] },
    ]);
  }

  function handleDeleteStep(stepId: string): void {
    setSteps((prev) => prev.filter((s) => s.id !== stepId));
  }

  function handleReorderSteps(reordered: Step[]): void {
    setSteps(reordered);
  }

  function handleRenameStep(stepId: string, title: string): void {
    setSteps((prev) => prev.map((s) => (s.id === stepId ? { ...s, title } : s)));
  }

  function handleMoveFieldToStep(fieldId: string, targetStepId: string): void {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.id === targetStepId) {
          return {
            ...s,
            fieldIds: s.fieldIds.includes(fieldId) ? s.fieldIds : [...s.fieldIds, fieldId],
          };
        }
        return { ...s, fieldIds: s.fieldIds.filter((id) => id !== fieldId) };
      }),
    );
  }

  function handleRemoveFieldFromStep(fieldId: string, stepId: string): void {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === stepId ? { ...s, fieldIds: s.fieldIds.filter((id) => id !== fieldId) } : s,
      ),
    );
  }

  function handleLayoutModeChange(newMode: LayoutMode): void {
    if (newMode === 'multi-step' && steps.length === 0) {
      // On first entry into multi-step mode, put all existing fields into a
      // single default step. Subsequent entries preserve existing step assignments.
      const initialStep: Step = {
        id: generateId(),
        title: 'Step 1',
        fieldIds: fields.map((f) => f.id),
      };
      setSteps([initialStep]);
    }
    // Steps are intentionally preserved when switching back to single-page so
    // that returning to multi-step mode restores the builder's step assignments.
    setLayoutMode(newMode);
  }

  async function handleUploadImage(file: File): Promise<string> {
    const result = await client.uploadFile<{ url: string }>('/v1/assets', file);
    return result.url;
  }

  return (
    <main data-calculator-id={calculatorId}>
      <h1>Calculator Editor</h1>
      <SaveStatusIndicator status={saveStatus} onSave={save} />
      <div className="flex gap-6">
        <div className="flex-1">
          <LayoutModeToggle mode={layoutMode} onChange={handleLayoutModeChange} />
          {layoutMode === 'multi-step' && (
            <StepManager
              steps={steps}
              fields={fields}
              onAddStep={handleAddStep}
              onDeleteStep={handleDeleteStep}
              onReorderSteps={handleReorderSteps}
              onRenameStep={handleRenameStep}
              onMoveFieldToStep={handleMoveFieldToStep}
              onRemoveFieldFromStep={handleRemoveFieldFromStep}
            />
          )}
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
              onUploadImage={handleUploadImage}
            />
          )}
          <OutputList
            outputs={outputs}
            selectedOutputId={selectedOutputId}
            onAdd={handleAddOutput}
            onSelect={setSelectedOutputId}
            onDelete={handleDeleteOutput}
            onReorder={handleReorderOutputs}
          />
          {selectedOutputId !== null && (
            <FormulaInput
              expression={outputs.find((o) => o.id === selectedOutputId)?.expression ?? ''}
              onChange={(expression) => handleUpdateOutputExpression(selectedOutputId, expression)}
              fieldVariableNames={fields.map((f) => f.variableName)}
              fieldValues={fieldDefaults}
            />
          )}
        </div>
        <div className="flex-1">
          <PreviewPane>
            <CalculatorPreviewForm fields={fields} outputs={outputs} />
          </PreviewPane>
        </div>
      </div>
    </main>
  );
}
