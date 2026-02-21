import type { FormulaContext, FormulaResult } from './types';

/**
 * Evaluates a formula expression against a context of field values.
 *
 * Supported operations: arithmetic (+, -, *, /), comparisons, conditionals,
 * and allow-listed math functions (MIN, MAX, ABS, ROUND).
 *
 * Full implementation is delivered in CALC-US1.
 */
export function evaluate(
  _expression: string,
  _context: FormulaContext,
): FormulaResult {
  // Stub — full formula evaluation is implemented in CALC-US1
  return { value: 0 };
}
