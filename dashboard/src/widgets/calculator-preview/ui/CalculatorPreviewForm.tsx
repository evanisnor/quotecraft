'use client';

import { useState, useMemo } from 'react';
import type { BaseFieldConfig, ResultOutputConfig, LayoutMode, Step } from '@/shared/config';
import { FieldPreviewRenderer } from '@/shared/ui/field-renderers';
import { evaluate } from '@quotecraft/formula-engine';
import type { FormulaResult } from '@quotecraft/formula-engine';
import { buildFieldDefaults } from '@/shared/lib';
import { ProgressBar } from './ProgressBar';

export interface CalculatorPreviewFormProps {
  fields: BaseFieldConfig[];
  outputs?: ResultOutputConfig[];
  layoutMode?: LayoutMode;
  steps?: Step[];
}

export function CalculatorPreviewForm({
  fields,
  outputs = [],
  layoutMode,
  steps = [],
}: CalculatorPreviewFormProps) {
  // Tracks values the user has explicitly changed; merged with field defaults so
  // newly added fields appear with their defaults without resetting existing inputs.
  const [userValues, setUserValues] = useState<Record<string, number>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const isMultiStep = layoutMode === 'multi-step' && steps.length > 0;

  // Clamp safeStepIndex to valid range in case steps are removed after navigation
  const safeStepIndex = isMultiStep ? Math.min(currentStepIndex, steps.length - 1) : 0;

  const values = useMemo(() => {
    const defaults = buildFieldDefaults(fields);
    const currentVarNames = new Set(fields.map((f) => f.variableName));
    const filteredUserValues = Object.fromEntries(
      Object.entries(userValues).filter(([key]) => currentVarNames.has(key)),
    );
    return { ...defaults, ...filteredUserValues };
  }, [fields, userValues]);

  const results = useMemo<Array<{ output: ResultOutputConfig; result: FormulaResult }>>(
    () =>
      outputs.map((output) => ({
        output,
        result: evaluate(output.expression, values),
      })),
    [outputs, values],
  );

  // Determine which fields to render
  const visibleFields = useMemo(() => {
    if (!isMultiStep) {
      return fields;
    }
    const currentFieldIds = new Set(steps[safeStepIndex].fieldIds);
    return fields.filter((f) => currentFieldIds.has(f.id));
  }, [isMultiStep, fields, steps, safeStepIndex]);

  const isOnLastStep = isMultiStep && safeStepIndex === steps.length - 1;
  const showResults = outputs.length > 0 && (!isMultiStep || isOnLastStep);

  function handleChange(variableName: string, value: number): void {
    setUserValues((prev) => ({ ...prev, [variableName]: value }));
  }

  function handleBack(): void {
    setCurrentStepIndex(safeStepIndex - 1);
  }

  function handleNext(): void {
    setCurrentStepIndex(safeStepIndex + 1);
  }

  // In multi-step mode, empty state is shown when there are no steps.
  // In single-page mode, empty state is shown when there are no fields.
  const isMultiStepMode = layoutMode === 'multi-step';
  const showEmptyState = isMultiStepMode ? steps.length === 0 : fields.length === 0;

  return (
    <form aria-label="Calculator Preview Form">
      {isMultiStep && <ProgressBar currentStep={safeStepIndex + 1} totalSteps={steps.length} />}
      {showEmptyState ? (
        <p>Add fields to preview your calculator.</p>
      ) : (
        visibleFields.map((field) => (
          <FieldPreviewRenderer
            key={field.id}
            field={field}
            value={values[field.variableName] ?? 0}
            onChange={(value) => handleChange(field.variableName, value)}
          />
        ))
      )}
      {isMultiStep && (
        <nav aria-label="Step navigation">
          <button
            type="button"
            aria-label="Previous step"
            disabled={safeStepIndex === 0}
            onClick={handleBack}
          >
            Back
          </button>
          <button
            type="button"
            aria-label="Next step"
            disabled={safeStepIndex === steps.length - 1}
            onClick={handleNext}
          >
            Next
          </button>
        </nav>
      )}
      {showResults && (
        <section aria-label="Results">
          {results.map(({ output, result }) => (
            <div key={output.id}>
              <span>{output.label}</span>
              {result.error !== undefined ? (
                <span role="alert">{result.error}</span>
              ) : (
                <span>{result.value}</span>
              )}
            </div>
          ))}
        </section>
      )}
    </form>
  );
}
