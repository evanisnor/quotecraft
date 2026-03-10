'use client';

import type { Step, BaseFieldConfig } from '@/shared/config';

interface StepManagerProps {
  steps: Step[];
  fields: BaseFieldConfig[];
  onAddStep: () => void;
  onDeleteStep: (stepId: string) => void;
  onReorderSteps: (reordered: Step[]) => void;
  onRenameStep: (stepId: string, title: string) => void;
  onMoveFieldToStep: (fieldId: string, targetStepId: string) => void;
  onRemoveFieldFromStep: (fieldId: string, stepId: string) => void;
}

export function StepManager({
  steps,
  fields,
  onAddStep,
  onDeleteStep,
  onReorderSteps,
  onRenameStep,
  onMoveFieldToStep,
  onRemoveFieldFromStep,
}: StepManagerProps) {
  const assignedFieldIds = new Set(steps.flatMap((s) => s.fieldIds));
  const unassignedFields = fields.filter((f) => !assignedFieldIds.has(f.id));

  function handleMoveUp(index: number): void {
    if (index === 0) return;
    const next = [...steps];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onReorderSteps(next);
  }

  function handleMoveDown(index: number): void {
    if (index === steps.length - 1) return;
    const next = [...steps];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onReorderSteps(next);
  }

  function handleAssignField(fieldId: string, stepId: string): void {
    if (stepId === '') return;
    onMoveFieldToStep(fieldId, stepId);
  }

  return (
    <section aria-label="Step manager">
      {steps.map((step, index) => {
        const assignedFields = fields.filter((f) => step.fieldIds.includes(f.id));
        return (
          <div key={step.id}>
            <input
              type="text"
              aria-label={`Step ${index + 1} title`}
              value={step.title}
              onChange={(e) => onRenameStep(step.id, e.target.value)}
            />
            <ul>
              {assignedFields.map((field) => (
                <li key={field.id}>
                  {field.label}
                  <button
                    type="button"
                    aria-label={`Remove ${field.label} from ${step.title}`}
                    onClick={() => onRemoveFieldFromStep(field.id, step.id)}
                  >
                    Remove from step
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              aria-label={`Move ${step.title} up`}
              disabled={index === 0}
              onClick={() => handleMoveUp(index)}
            >
              Move step up
            </button>
            <button
              type="button"
              aria-label={`Move ${step.title} down`}
              disabled={index === steps.length - 1}
              onClick={() => handleMoveDown(index)}
            >
              Move step down
            </button>
            <button
              type="button"
              aria-label={`Delete ${step.title}`}
              onClick={() => onDeleteStep(step.id)}
            >
              Delete step
            </button>
          </div>
        );
      })}

      {unassignedFields.length > 0 && (
        <div>
          <ul aria-label="Unassigned fields">
            {unassignedFields.map((field) => (
              <li key={field.id}>
                {field.label}
                <select
                  aria-label={`Assign ${field.label} to step`}
                  defaultValue=""
                  onChange={(e) => handleAssignField(field.id, e.target.value)}
                >
                  <option value="" disabled>
                    Assign to step...
                  </option>
                  {steps.map((step) => (
                    <option key={step.id} value={step.id}>
                      {step.title}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button type="button" onClick={onAddStep}>
        Add step
      </button>
    </section>
  );
}
