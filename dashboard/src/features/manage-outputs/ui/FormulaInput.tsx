import { useId } from 'react';
import { tokenize, parse, evaluate, TokenizeError, ParseError } from '@quotecraft/formula-engine';

export interface FormulaInputProps {
  expression: string;
  onChange: (expression: string) => void;
  // Reserved for CALC-US1-A008: "did you mean?" variable name suggestions at evaluate time.
  // The prop is accepted but unused until that task is implemented.
  fieldVariableNames?: string[];
  fieldValues?: Record<string, number>;
}

/**
 * Validates a formula expression string using the formula engine's tokenizer
 * and parser. Returns an error message string when the expression is invalid,
 * or null when valid or empty.
 *
 * Unknown variable names are NOT a validation error at this stage — variable
 * resolution only occurs at evaluate time.
 */
function validateExpression(expression: string): string | null {
  if (expression.trim() === '') {
    return null;
  }
  try {
    const tokens = tokenize(expression);
    parse(tokens);
    return null;
  } catch (err) {
    if (err instanceof TokenizeError || err instanceof ParseError) {
      return err.message;
    }
    // Unexpected error type — surface a generic message rather than swallowing
    return 'Invalid expression';
  }
}

/**
 * FormulaInput renders a labeled text input for a formula expression with
 * inline parse/tokenize validation. Errors are shown beneath the input and
 * the input is marked aria-invalid when an error is present.
 *
 * When fieldValues is provided and the expression is syntactically valid, a
 * live result preview is displayed beneath the input showing the evaluated
 * result. Evaluation errors (e.g. unknown variables, division by zero) are
 * shown in the same preview area and are informational — not alerts.
 */
export function FormulaInput({ expression, onChange, fieldValues }: FormulaInputProps) {
  const inputId = useId();
  const errorId = useId();

  const error = validateExpression(expression);

  const isNonEmpty = expression.trim() !== '';
  const isValid = isNonEmpty && error === null;

  const preview = isValid ? evaluate(expression, fieldValues ?? {}) : null;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>): void {
    onChange(e.currentTarget.value);
  }

  return (
    <div>
      <label htmlFor={inputId}>Formula expression</label>
      <input
        id={inputId}
        type="text"
        value={expression}
        onChange={handleChange}
        aria-invalid={error !== null ? 'true' : 'false'}
        aria-describedby={error !== null ? errorId : undefined}
      />
      {error !== null && (
        <p id={errorId} role="alert">
          {error}
        </p>
      )}
      {preview !== null && (
        <output aria-label="Formula result preview" data-testid="formula-preview">
          {preview.error !== undefined ? (
            <>Evaluation error: {preview.error}</>
          ) : (
            <>Preview: {preview.value}</>
          )}
        </output>
      )}
    </div>
  );
}
