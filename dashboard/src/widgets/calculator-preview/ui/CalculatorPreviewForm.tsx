'use client';

import { useState, useMemo } from 'react';
import type { BaseFieldConfig, ResultOutputConfig } from '@/shared/config';
import { FieldPreviewRenderer } from '@/shared/ui/field-renderers';
import { evaluate } from '@quotecraft/formula-engine';
import type { FormulaResult } from '@quotecraft/formula-engine';
import { buildFieldDefaults } from '@/shared/lib';

export interface CalculatorPreviewFormProps {
  fields: BaseFieldConfig[];
  outputs?: ResultOutputConfig[];
}

export function CalculatorPreviewForm({ fields, outputs = [] }: CalculatorPreviewFormProps) {
  // Tracks values the user has explicitly changed; merged with field defaults so
  // newly added fields appear with their defaults without resetting existing inputs.
  const [userValues, setUserValues] = useState<Record<string, number>>({});

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

  function handleChange(variableName: string, value: number): void {
    setUserValues((prev) => ({ ...prev, [variableName]: value }));
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
      {outputs.length > 0 && (
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
