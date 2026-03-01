import type { ASTNode } from './ast';
import type { FormulaContext, FormulaResult } from './types';
import { tokenize } from './tokenize';
import { parse } from './parse';

/**
 * Thrown when the evaluator cannot evaluate a syntactically valid AST node —
 * for example, calling a function that is not yet implemented.
 */
export class EvaluateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EvaluateError';
  }
}

/**
 * Recursively evaluates an AST node against a formula context.
 *
 * - NumberLiteralNode → returns the literal value
 * - VariableNode      → returns context[name], defaulting to 0 for unknown fields
 * - UnaryOpNode (-)   → negates the operand
 * - BinaryOpNode      → arithmetic (+, -, *, /, %) or comparison (=, !=, >, <, >=, <=)
 *                       Comparisons return 1 (true) or 0 (false).
 *                       Division by zero follows JS semantics: n/0 → Infinity, 0/0 → NaN.
 * - FunctionCallNode  → throws EvaluateError (functions are implemented in later tasks)
 *
 * @throws {EvaluateError} when an unsupported function call is encountered.
 */
function evalNode(node: ASTNode, context: FormulaContext): number {
  switch (node.kind) {
    case 'NumberLiteral':
      return node.value;

    case 'Variable':
      return context[node.name] ?? 0;

    case 'UnaryOp':
      return -evalNode(node.operand, context);

    case 'BinaryOp': {
      const left = evalNode(node.left, context);
      const right = evalNode(node.right, context);
      const op = node.op;

      switch (op) {
        case '+':  return left + right;
        case '-':  return left - right;
        case '*':  return left * right;
        case '/':  return left / right;
        case '%':  return left % right;
        case '=':  return left === right ? 1 : 0;
        case '!=': return left !== right ? 1 : 0;
        case '>':  return left > right   ? 1 : 0;
        case '<':  return left < right   ? 1 : 0;
        case '>=': return left >= right  ? 1 : 0;
        case '<=': return left <= right  ? 1 : 0;
        default: {
          // TypeScript exhaustiveness guard — BinaryOperator is a closed union.
          const _: never = op;
          throw new EvaluateError(`Unhandled operator: ${String(_)}`);
        }
      }
    }

    case 'FunctionCall':
      throw new EvaluateError(`Function '${node.name}' is not yet supported`);
  }
}

/**
 * Evaluates a formula expression against a context of field values.
 *
 * The pipeline is:
 *   expression → tokenize → parse → evalNode
 *
 * An empty or whitespace-only expression returns `{ value: 0 }` immediately.
 * Any TokenizeError, ParseError, or EvaluateError is caught and returned as
 * `{ value: 0, error: message }` — the evaluator never throws.
 *
 * Comparisons return 1 for true and 0 for false. Division by zero follows
 * standard JavaScript semantics (Infinity or NaN) — it is not treated as an
 * error.
 *
 * @param expression - The formula expression string to evaluate.
 * @param context    - A map of field names to their current numeric values.
 * @returns A FormulaResult containing the computed value, and an optional
 *          error message if evaluation failed.
 */
export function evaluate(expression: string, context: FormulaContext): FormulaResult {
  if (expression.trim() === '') {
    return { value: 0 };
  }

  try {
    const tokens = tokenize(expression);
    const ast = parse(tokens);
    const value = evalNode(ast, context);
    return { value };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { value: 0, error: message };
  }
}
