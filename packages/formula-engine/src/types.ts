/**
 * A map of field IDs to their current numeric values, used when evaluating a formula.
 */
export type FormulaContext = Record<string, number>;

/**
 * The result of evaluating a formula expression.
 */
export interface FormulaResult {
  /** The computed numeric value. */
  value: number;
}
