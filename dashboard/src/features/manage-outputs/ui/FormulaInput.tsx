import { useId } from 'react';
import { tokenize, parse, TokenizeError, ParseError } from '@quotecraft/formula-engine';

export interface FormulaInputProps {
  expression: string;
  onChange: (expression: string) => void;
  fieldVariableNames?: string[];
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
 */
export function FormulaInput({ expression, onChange }: FormulaInputProps) {
  const inputId = useId();
  const errorId = useId();

  const error = validateExpression(expression);

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
    </div>
  );
}
