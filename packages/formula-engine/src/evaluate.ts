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
 * Thrown when formula evaluation exceeds the 100ms deadline. Caught by
 * `evaluate()` and converted into a FormulaResult error.
 */
export class TimeoutError extends Error {
  constructor() {
    super('Formula evaluation timed out (exceeded 100ms)');
    this.name = 'TimeoutError';
  }
}

/**
 * Recursively evaluates an AST node against a formula context.
 *
 * - NumberLiteralNode → returns the literal value
 * - VariableNode      → returns context[name]; throws EvaluateError if the name
 *                       is not present in the context (unknown field reference)
 * - UnaryOpNode (-)   → negates the operand
 * - BinaryOpNode      → arithmetic (+, -, *, /, %) or comparison (=, !=, >, <, >=, <=)
 *                       Comparisons return 1 (true) or 0 (false).
 *                       Division by zero follows JS semantics: n/0 → Infinity, 0/0 → NaN.
 * - FunctionCallNode  → IF(cond, then, else) for conditional branching;
 *                       MIN/MAX(a, b, ...) for min/max of 1+ values;
 *                       ABS(x) for absolute value; ROUND(x[, n]) for rounding.
 *                       Invalid argument counts throw EvaluateError.
 *
 * @throws {EvaluateError} when a variable name is not present in the context,
 *   or when a function is called with the wrong number of arguments.
 */
function evalNode(node: ASTNode, context: FormulaContext, deadline: number): number {
  if (Date.now() > deadline) {
    throw new TimeoutError();
  }

  switch (node.kind) {
    case 'NumberLiteral':
      return node.value;

    case 'Variable': {
      if (!(node.name in context)) {
        throw new EvaluateError(`Unknown variable: {${node.name}}`);
      }
      return context[node.name];
    }

    case 'UnaryOp':
      return -evalNode(node.operand, context, deadline);

    case 'BinaryOp': {
      const left = evalNode(node.left, context, deadline);
      const right = evalNode(node.right, context, deadline);
      const op = node.op;

      switch (op) {
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '*':
          return left * right;
        case '/':
          return left / right;
        case '%':
          return left % right;
        case '=':
          return left === right ? 1 : 0;
        case '!=':
          return left !== right ? 1 : 0;
        case '>':
          return left > right ? 1 : 0;
        case '<':
          return left < right ? 1 : 0;
        case '>=':
          return left >= right ? 1 : 0;
        case '<=':
          return left <= right ? 1 : 0;
        default: {
          // TypeScript exhaustiveness guard — BinaryOperator is a closed union.
          const _: never = op;
          throw new EvaluateError(`Unhandled operator: ${String(_)}`);
        }
      }
    }

    case 'FunctionCall': {
      const { name, args } = node;

      if (name === 'IF') {
        if (args.length !== 3) {
          throw new EvaluateError(
            `IF requires exactly 3 arguments (condition, then, else), got ${args.length}`,
          );
        }
        const condition = evalNode(args[0], context, deadline);
        return condition !== 0 ? evalNode(args[1], context, deadline) : evalNode(args[2], context, deadline);
      }

      if (name === 'MIN') {
        if (args.length < 1) {
          throw new EvaluateError(`MIN requires at least 1 argument, got ${args.length}`);
        }
        const values = args.map((arg) => evalNode(arg, context, deadline));
        return Math.min(...values);
      }

      if (name === 'MAX') {
        if (args.length < 1) {
          throw new EvaluateError(`MAX requires at least 1 argument, got ${args.length}`);
        }
        const values = args.map((arg) => evalNode(arg, context, deadline));
        return Math.max(...values);
      }

      if (name === 'ABS') {
        if (args.length !== 1) {
          throw new EvaluateError(`ABS requires exactly 1 argument, got ${args.length}`);
        }
        return Math.abs(evalNode(args[0], context, deadline));
      }

      if (name === 'ROUND') {
        if (args.length < 1 || args.length > 2) {
          throw new EvaluateError(`ROUND requires 1 or 2 arguments, got ${args.length}`);
        }
        const value = evalNode(args[0], context, deadline);
        if (args.length === 1) {
          return Math.round(value);
        }
        const decimals = evalNode(args[1], context, deadline);
        const factor = Math.pow(10, Math.round(decimals));
        return Math.round(value * factor) / factor;
      }

      // TypeScript exhaustiveness guard — FunctionName is a closed union and all
      // cases are handled above. This keeps the compiler satisfied.
      const _exhaustive: never = name;
      throw new EvaluateError(`Function '${String(_exhaustive)}' is not supported`);
    }
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

  const deadline = Date.now() + 100;

  try {
    const tokens = tokenize(expression);
    const ast = parse(tokens);
    const value = evalNode(ast, context, deadline);
    return { value };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { value: 0, error: message };
  }
}
