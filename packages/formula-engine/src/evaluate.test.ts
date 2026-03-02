import { evaluate } from './evaluate';
import type { FormulaContext } from './types';

describe('evaluate', () => {
  // ---------------------------------------------------------------------------
  // Empty / whitespace
  // ---------------------------------------------------------------------------

  describe('empty and whitespace expressions', () => {
    it('returns { value: 0 } with no error for an empty string', () => {
      const result = evaluate('', {});
      expect(result).toEqual({ value: 0 });
    });

    it('returns { value: 0 } with no error for a whitespace-only string', () => {
      const result = evaluate('   ', {});
      expect(result).toEqual({ value: 0 });
    });
  });

  // ---------------------------------------------------------------------------
  // Number literals
  // ---------------------------------------------------------------------------

  describe('number literals', () => {
    it('evaluates an integer literal', () => {
      expect(evaluate('42', {})).toEqual({ value: 42 });
    });

    it('evaluates a decimal literal', () => {
      expect(evaluate('3.14', {})).toEqual({ value: 3.14 });
    });
  });

  // ---------------------------------------------------------------------------
  // Arithmetic
  // ---------------------------------------------------------------------------

  describe('arithmetic', () => {
    test.each([
      { expression: '1 + 2',  expected: 3  },
      { expression: '10 - 3', expected: 7  },
      { expression: '4 * 5',  expected: 20 },
      { expression: '15 / 3', expected: 5  },
      { expression: '10 % 3', expected: 1  },
    ])('$expression → $expected', ({ expression, expected }) => {
      expect(evaluate(expression, {})).toEqual({ value: expected });
    });
  });

  // ---------------------------------------------------------------------------
  // Operator precedence
  // ---------------------------------------------------------------------------

  describe('operator precedence', () => {
    it('multiplies before adding', () => {
      expect(evaluate('2 + 3 * 4', {})).toEqual({ value: 14 });
    });

    it('subtracts left-associatively', () => {
      expect(evaluate('10 - 2 - 3', {})).toEqual({ value: 5 });
    });
  });

  // ---------------------------------------------------------------------------
  // Parentheses
  // ---------------------------------------------------------------------------

  describe('parentheses', () => {
    it('overrides default precedence: (2 + 3) * 4', () => {
      expect(evaluate('(2 + 3) * 4', {})).toEqual({ value: 20 });
    });

    it('groups the right operand: 2 * (3 + 4)', () => {
      expect(evaluate('2 * (3 + 4)', {})).toEqual({ value: 14 });
    });

    it('handles nested parentheses: ((5 + 3) * 2) / 4', () => {
      expect(evaluate('((5 + 3) * 2) / 4', {})).toEqual({ value: 4 });
    });
  });

  // ---------------------------------------------------------------------------
  // Unary minus
  // ---------------------------------------------------------------------------

  describe('unary minus', () => {
    it('negates a literal', () => {
      expect(evaluate('-5', {})).toEqual({ value: -5 });
    });

    it('negates a parenthesised sub-expression', () => {
      expect(evaluate('-(2 + 3)', {})).toEqual({ value: -5 });
    });

    it('combines with addition', () => {
      expect(evaluate('10 + -3', {})).toEqual({ value: 7 });
    });

    it('negates a variable reference', () => {
      expect(evaluate('-{qty}', { qty: 5 })).toEqual({ value: -5 });
    });
  });

  // ---------------------------------------------------------------------------
  // Comparisons — return 1 (true) or 0 (false)
  // ---------------------------------------------------------------------------

  describe('comparisons', () => {
    test.each([
      { expression: '5 = 5',  expected: 1, label: 'equal (true)'          },
      { expression: '5 = 4',  expected: 0, label: 'equal (false)'         },
      { expression: '5 != 4', expected: 1, label: 'not equal (true)'      },
      { expression: '5 != 5', expected: 0, label: 'not equal (false)'     },
      { expression: '5 > 3',  expected: 1, label: 'greater than (true)'   },
      { expression: '3 > 5',  expected: 0, label: 'greater than (false)'  },
      { expression: '3 < 5',  expected: 1, label: 'less than (true)'      },
      { expression: '5 < 3',  expected: 0, label: 'less than (false)'     },
      { expression: '5 >= 5', expected: 1, label: 'gte (true, equal)'     },
      { expression: '5 >= 6', expected: 0, label: 'gte (false)'           },
      { expression: '3 <= 5', expected: 1, label: 'lte (true)'            },
      { expression: '6 <= 5', expected: 0, label: 'lte (false)'           },
    ])('$label: $expression → $expected', ({ expression, expected }) => {
      expect(evaluate(expression, {})).toEqual({ value: expected });
    });
  });

  // ---------------------------------------------------------------------------
  // Variable references
  // ---------------------------------------------------------------------------

  describe('variable references', () => {
    it('resolves a single variable', () => {
      expect(evaluate('{qty} * 10', { qty: 5 })).toEqual({ value: 50 });
    });

    it('resolves two variables in an addition', () => {
      const context: FormulaContext = { a: 3, b: 4 };
      expect(evaluate('{a} + {b}', context)).toEqual({ value: 7 });
    });

    it('resolves decimal variable values', () => {
      const context: FormulaContext = { price: 9.99, qty: 3 };
      expect(evaluate('{price} * {qty}', context)).toEqual({ value: 29.97 });
    });

    it('resolves a known variable whose value is 0', () => {
      // Field is defined in the calculator with value 0 — not an error
      expect(evaluate('{qty}', { qty: 0 })).toEqual({ value: 0 });
    });

    it('resolves a known variable whose value is 0 in arithmetic', () => {
      expect(evaluate('{qty} * 10', { qty: 0 })).toEqual({ value: 0 });
    });

    it('returns an error for a variable name not present in the context', () => {
      const result = evaluate('{unknown}', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('{unknown}');
    });

    it('error message includes the unknown variable name in braces', () => {
      const result = evaluate('{numbathrooms}', {});
      expect(result.error).toBeDefined();
      expect(result.error).toContain('{numbathrooms}');
    });

    it('returns an error when one of several variables is unknown', () => {
      // {a} is known; {typo} is not — evaluation fails with the unknown name
      const result = evaluate('{a} + {typo}', { a: 5 });
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('{typo}');
    });

    it('resolves multiple variables from a full context', () => {
      const context: FormulaContext = { rooms: 3, rate: 200, discount: 50 };
      expect(evaluate('{rooms} * {rate} - {discount}', context)).toEqual({ value: 550 });
    });
  });

  // ---------------------------------------------------------------------------
  // Errors — parse / tokenize failures
  // ---------------------------------------------------------------------------

  describe('parse and tokenize errors', () => {
    it('returns an error for an incomplete expression', () => {
      const result = evaluate('1 +', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('returns an error for an unclosed variable reference', () => {
      const result = evaluate('{unclosed', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('returns an error for a bare identifier', () => {
      const result = evaluate('foo', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Errors — unsupported function calls (MIN, MAX, ABS, ROUND not yet implemented)
  // ---------------------------------------------------------------------------

  describe('unsupported function calls', () => {
    it('returns an error for MIN()', () => {
      const result = evaluate('MIN(1, 2)', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('returns an error for MAX()', () => {
      const result = evaluate('MAX(1, 2)', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('returns an error for ABS()', () => {
      const result = evaluate('ABS(-5)', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('returns an error for ROUND()', () => {
      const result = evaluate('ROUND(3.7)', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // IF conditional expression
  // ---------------------------------------------------------------------------

  describe('IF conditional expression', () => {
    it('returns then_value when condition is non-zero (truthy)', () => {
      expect(evaluate('IF(1, 10, 20)', {})).toEqual({ value: 10 });
    });

    it('returns else_value when condition is zero (falsy)', () => {
      expect(evaluate('IF(0, 10, 20)', {})).toEqual({ value: 20 });
    });

    it('evaluates condition as an expression: true branch', () => {
      expect(evaluate('IF(5 > 3, 100, 0)', {})).toEqual({ value: 100 });
    });

    it('evaluates condition as an expression: false branch', () => {
      expect(evaluate('IF(5 > 10, 100, 0)', {})).toEqual({ value: 0 });
    });

    it('evaluates then_value as an expression', () => {
      expect(evaluate('IF(1, 2 + 3, 99)', {})).toEqual({ value: 5 });
    });

    it('evaluates else_value as an expression', () => {
      expect(evaluate('IF(0, 99, 4 * 5)', {})).toEqual({ value: 20 });
    });

    it('supports variable references in condition', () => {
      expect(evaluate('IF({qty} > 0, {qty} * 10, 0)', { qty: 5 })).toEqual({ value: 50 });
    });

    it('uses else_value when variable condition is falsy', () => {
      expect(evaluate('IF({qty} > 0, {qty} * 10, 0)', { qty: 0 })).toEqual({ value: 0 });
    });

    it('supports nested IF in then branch', () => {
      // IF(x > 10, IF(x > 20, 3, 2), 1)
      // x=25: outer true → inner true → 3
      expect(evaluate('IF({x} > 10, IF({x} > 20, 3, 2), 1)', { x: 25 })).toEqual({ value: 3 });
    });

    it('supports nested IF in then branch (middle tier)', () => {
      // x=15: outer true → inner false → 2
      expect(evaluate('IF({x} > 10, IF({x} > 20, 3, 2), 1)', { x: 15 })).toEqual({ value: 2 });
    });

    it('supports nested IF in else branch', () => {
      // x=5: outer false → inner: 1
      expect(evaluate('IF({x} > 10, IF({x} > 20, 3, 2), 1)', { x: 5 })).toEqual({ value: 1 });
    });

    it('supports nested IF in else branch expression', () => {
      expect(evaluate('IF(0, 99, IF(1, 42, 0))', {})).toEqual({ value: 42 });
    });

    it('supports equality check in condition', () => {
      expect(evaluate('IF({plan} = 1, 50, 100)', { plan: 1 })).toEqual({ value: 50 });
    });

    it('uses else_value when equality check is false', () => {
      expect(evaluate('IF({plan} = 1, 50, 100)', { plan: 2 })).toEqual({ value: 100 });
    });

    it('treats a negative condition as truthy', () => {
      expect(evaluate('IF(-1, 10, 20)', {})).toEqual({ value: 10 });
    });

    it('returns an error when IF receives fewer than 3 arguments', () => {
      const result = evaluate('IF(1, 2)', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('returns an error when IF receives more than 3 arguments', () => {
      const result = evaluate('IF(1, 2, 3, 4)', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Division by zero — follows JS semantics, not an error
  // ---------------------------------------------------------------------------

  describe('division by zero', () => {
    it('returns Infinity for n / 0', () => {
      const result = evaluate('10 / 0', {});
      expect(result.value).toBe(Infinity);
      expect(result.error).toBeUndefined();
    });

    it('returns NaN for 0 / 0', () => {
      const result = evaluate('0 / 0', {});
      expect(Number.isNaN(result.value)).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Chained operations
  // ---------------------------------------------------------------------------

  describe('chained operations with variables', () => {
    it('applies precedence correctly with variables', () => {
      const context: FormulaContext = { base: 10, extra: 5 };
      expect(evaluate('{base} + {extra} * 2', context)).toEqual({ value: 20 });
    });

    it('respects parentheses with variables', () => {
      const context: FormulaContext = { a: 2, b: 3, c: 4 };
      expect(evaluate('({a} + {b}) * {c}', context)).toEqual({ value: 20 });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases: division by zero — extended
  // ---------------------------------------------------------------------------

  describe('division by zero — extended edge cases', () => {
    it('returns -Infinity for a negative numerator divided by zero (-10 / 0)', () => {
      const result = evaluate('-10 / 0', {});
      expect(result.value).toBe(-Infinity);
      expect(result.error).toBeUndefined();
    });

    it('returns Infinity when a positive variable is divided by zero literal', () => {
      const result = evaluate('{x} / 0', { x: 5 });
      expect(result.value).toBe(Infinity);
      expect(result.error).toBeUndefined();
    });

    it('returns -Infinity when a negative variable is divided by zero literal', () => {
      const result = evaluate('{x} / 0', { x: -5 });
      expect(result.value).toBe(-Infinity);
      expect(result.error).toBeUndefined();
    });

    it('returns NaN for a variable equal to zero divided by zero literal', () => {
      const result = evaluate('{x} / 0', { x: 0 });
      expect(Number.isNaN(result.value)).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns NaN for literal modulo zero (10 % 0)', () => {
      const result = evaluate('10 % 0', {});
      expect(Number.isNaN(result.value)).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns NaN for 0 % 0', () => {
      const result = evaluate('0 % 0', {});
      expect(Number.isNaN(result.value)).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns Infinity when a non-zero variable is divided by a zero variable', () => {
      const result = evaluate('{a} / {b}', { a: 7, b: 0 });
      expect(result.value).toBe(Infinity);
      expect(result.error).toBeUndefined();
    });

    it('returns NaN when a zero variable is divided by another zero variable', () => {
      const result = evaluate('{a} / {b}', { a: 0, b: 0 });
      expect(Number.isNaN(result.value)).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('returns NaN for variable modulo zero variable ({a} % {b}, b=0)', () => {
      const result = evaluate('{a} % {b}', { a: 10, b: 0 });
      expect(Number.isNaN(result.value)).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('propagates Infinity through subsequent addition (Infinity + 5)', () => {
      // {a} / {b} + {c} where b=0 produces Infinity + 5 = Infinity
      const result = evaluate('{a} / {b} + {c}', { a: 1, b: 0, c: 5 });
      expect(result.value).toBe(Infinity);
      expect(result.error).toBeUndefined();
    });

    it('propagates NaN through subsequent arithmetic (NaN + 1 = NaN)', () => {
      // 0/0 + {c} = NaN + 5 = NaN
      const result = evaluate('{a} / {b} + {c}', { a: 0, b: 0, c: 5 });
      expect(Number.isNaN(result.value)).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('division by zero inside an IF branch does not affect the not-taken branch', () => {
      // condition is false, so only else_value (100) is evaluated
      const result = evaluate('IF(0, {x} / 0, 100)', { x: 5 });
      expect(result.value).toBe(100);
      expect(result.error).toBeUndefined();
    });

    it('division by zero in the taken IF branch returns Infinity', () => {
      const result = evaluate('IF(1, {x} / 0, 99)', { x: 5 });
      expect(result.value).toBe(Infinity);
      expect(result.error).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases: IF short-circuit evaluation
  // ---------------------------------------------------------------------------

  describe('IF short-circuit evaluation', () => {
    it('does not evaluate the else branch when condition is truthy', () => {
      // {undefined_var} is not in context — would throw EvaluateError if evaluated
      const result = evaluate('IF(1, 100, {undefined_var})', {});
      expect(result.value).toBe(100);
      expect(result.error).toBeUndefined();
    });

    it('does not evaluate the then branch when condition is falsy', () => {
      const result = evaluate('IF(0, {undefined_var}, 200)', {});
      expect(result.value).toBe(200);
      expect(result.error).toBeUndefined();
    });

    it('does not evaluate the else branch with a variable condition that is truthy', () => {
      const result = evaluate('IF({qty} > 0, {qty} * 10, {undefined_var})', { qty: 3 });
      expect(result.value).toBe(30);
      expect(result.error).toBeUndefined();
    });

    it('does not evaluate the then branch with a variable condition that is falsy', () => {
      const result = evaluate('IF({qty} > 0, {undefined_var}, {qty} + 5)', { qty: 0 });
      expect(result.value).toBe(5);
      expect(result.error).toBeUndefined();
    });

    it('evaluates the correct nested IF branch and skips the unevaluated sibling', () => {
      // Outer condition is 1 (truthy), so we go to the then branch (another IF).
      // The outer else branch {undefined_var} is never reached.
      const result = evaluate('IF(1, IF(0, 10, 20), {undefined_var})', {});
      expect(result.value).toBe(20);
      expect(result.error).toBeUndefined();
    });

    it('evaluates the error result when the taken branch references an unknown variable', () => {
      // condition is truthy, so then-branch {unknown} IS evaluated → error
      const result = evaluate('IF(1, {unknown}, 100)', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('{unknown}');
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases: deeply nested IFs (3+ levels)
  // ---------------------------------------------------------------------------

  describe('deeply nested IF expressions', () => {
    it('evaluates a 3-level nested IF to the innermost then branch', () => {
      // IF(a>0, IF(b>0, IF(c>0, 1, 2), 3), 4)  with a=1, b=1, c=1 → 1
      const ctx: FormulaContext = { a: 1, b: 1, c: 1 };
      expect(evaluate('IF({a} > 0, IF({b} > 0, IF({c} > 0, 1, 2), 3), 4)', ctx)).toEqual({ value: 1 });
    });

    it('evaluates a 3-level nested IF to the innermost else branch', () => {
      // a=1, b=1, c=0 → inner else → 2
      const ctx: FormulaContext = { a: 1, b: 1, c: 0 };
      expect(evaluate('IF({a} > 0, IF({b} > 0, IF({c} > 0, 1, 2), 3), 4)', ctx)).toEqual({ value: 2 });
    });

    it('evaluates a 3-level nested IF through the middle tier', () => {
      // a=1, b=0 → middle else → 3
      const ctx: FormulaContext = { a: 1, b: 0, c: 0 };
      expect(evaluate('IF({a} > 0, IF({b} > 0, IF({c} > 0, 1, 2), 3), 4)', ctx)).toEqual({ value: 3 });
    });

    it('evaluates a 3-level nested IF to the outermost else branch', () => {
      // a=0 → outer else → 4
      const ctx: FormulaContext = { a: 0, b: 1, c: 1 };
      expect(evaluate('IF({a} > 0, IF({b} > 0, IF({c} > 0, 1, 2), 3), 4)', ctx)).toEqual({ value: 4 });
    });

    it('uses the result of an IF as a condition — inner condition true', () => {
      // IF(IF({x} > 5, 1, 0), 100, 200) — inner IF produces 1 → outer takes then branch
      expect(evaluate('IF(IF({x} > 5, 1, 0), 100, 200)', { x: 10 })).toEqual({ value: 100 });
    });

    it('uses the result of an IF as a condition — inner condition false', () => {
      // IF(IF({x} > 5, 1, 0), 100, 200) — inner IF produces 0 → outer takes else branch
      expect(evaluate('IF(IF({x} > 5, 1, 0), 100, 200)', { x: 3 })).toEqual({ value: 200 });
    });

    it('sums two independent IF expressions', () => {
      // IF(a>0, 10, 0) + IF(b>0, 5, 0)
      const ctx: FormulaContext = { a: 1, b: 1 };
      expect(evaluate('IF({a} > 0, 10, 0) + IF({b} > 0, 5, 0)', ctx)).toEqual({ value: 15 });
    });

    it('sums two independent IFs where one condition is false', () => {
      const ctx: FormulaContext = { a: 1, b: 0 };
      expect(evaluate('IF({a} > 0, 10, 0) + IF({b} > 0, 5, 0)', ctx)).toEqual({ value: 10 });
    });

    it('handles arithmetic in all three IF arguments at once', () => {
      // IF({x} * 2 > 10, {x} + 100, {x} - 100)  with x=6 → 12>10 true → 106
      expect(evaluate('IF({x} * 2 > 10, {x} + 100, {x} - 100)', { x: 6 })).toEqual({ value: 106 });
    });

    it('handles arithmetic in all three IF arguments — false branch', () => {
      expect(evaluate('IF({x} * 2 > 10, {x} + 100, {x} - 100)', { x: 4 })).toEqual({ value: -96 });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases: deep nesting of parentheses and unary operators
  // ---------------------------------------------------------------------------

  describe('deep nesting of parentheses and unary operators', () => {
    it('evaluates many layers of redundant parentheses', () => {
      expect(evaluate('((((((1 + 2))))))', {})).toEqual({ value: 3 });
    });

    it('evaluates right-associative nested additions in parentheses', () => {
      // 1 + (2 + (3 + (4 + (5 + (6 + 7))))) = 28
      expect(evaluate('1 + (2 + (3 + (4 + (5 + (6 + 7)))))', {})).toEqual({ value: 28 });
    });

    it('evaluates deeply nested multiplication with subtraction', () => {
      // 2 * (3 + (4 * (5 - 1))) = 2 * (3 + 16) = 2 * 19 = 38
      expect(evaluate('2 * (3 + (4 * (5 - 1)))', {})).toEqual({ value: 38 });
    });

    it('evaluates double unary minus (negation cancels out)', () => {
      // --5 → -(-5) → 5
      expect(evaluate('--5', {})).toEqual({ value: 5 });
    });

    it('evaluates triple unary minus', () => {
      // ---5 → -(--5) → -(5) → -5
      expect(evaluate('---5', {})).toEqual({ value: -5 });
    });

    it('evaluates quadruple unary minus', () => {
      // ----5 → 5
      expect(evaluate('----5', {})).toEqual({ value: 5 });
    });

    it('evaluates double unary minus on a variable', () => {
      expect(evaluate('--{x}', { x: 7 })).toEqual({ value: 7 });
    });

    it('evaluates triple unary minus on a variable', () => {
      expect(evaluate('---{x}', { x: 7 })).toEqual({ value: -7 });
    });

    it('evaluates unary minus applied to a parenthesised IF expression', () => {
      // -(IF(1, 5, 0)) → -5
      expect(evaluate('-(IF(1, 5, 0))', {})).toEqual({ value: -5 });
    });

    it('evaluates nested parens mixed with comparisons', () => {
      // ((3 + 4) > (2 + 2)) → (7 > 4) → 1
      expect(evaluate('((3 + 4) > (2 + 2))', {})).toEqual({ value: 1 });
    });

    it('evaluates a long left-associative addition chain', () => {
      // 1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 = 55
      expect(evaluate('1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10', {})).toEqual({ value: 55 });
    });

    it('evaluates a long chain of multiplications', () => {
      // 1 * 2 * 3 * 4 * 5 = 120
      expect(evaluate('1 * 2 * 3 * 4 * 5', {})).toEqual({ value: 120 });
    });

    it('evaluates deeply nested variables in parentheses', () => {
      const ctx: FormulaContext = { a: 2, b: 3, c: 4, d: 5 };
      // (({a} + {b}) * ({c} - {d})) = (5 * -1) = -5
      expect(evaluate('(({a} + {b}) * ({c} - {d}))', ctx)).toEqual({ value: -5 });
    });
  });

  // ---------------------------------------------------------------------------
  // Edge cases: complex real-world-like pricing formulas
  // ---------------------------------------------------------------------------

  describe('complex pricing formula patterns', () => {
    it('computes a tiered rate: base + per-unit for large quantities', () => {
      // IF({qty} > 100, 500 + ({qty} - 100) * 4, {qty} * 5)
      // qty=150 → 500 + (150-100)*4 = 500 + 200 = 700
      const ctx: FormulaContext = { qty: 150 };
      expect(evaluate('IF({qty} > 100, 500 + ({qty} - 100) * 4, {qty} * 5)', ctx)).toEqual({ value: 700 });
    });

    it('computes a tiered rate — below threshold path', () => {
      // qty=50 → 50*5 = 250
      expect(evaluate('IF({qty} > 100, 500 + ({qty} - 100) * 4, {qty} * 5)', { qty: 50 })).toEqual({ value: 250 });
    });

    it('computes a multi-variable formula: rooms * rate with a discount', () => {
      const ctx: FormulaContext = { rooms: 4, rate: 250, discount: 100 };
      expect(evaluate('{rooms} * {rate} - {discount}', ctx)).toEqual({ value: 900 });
    });

    it('applies a percentage discount when the premium flag is set', () => {
      // IF({premium} = 1, {price} * 0.8, {price})
      expect(evaluate('IF({premium} = 1, {price} * 0.8, {price})', { premium: 1, price: 500 })).toEqual({ value: 400 });
    });

    it('does not apply a discount when the premium flag is unset', () => {
      expect(evaluate('IF({premium} = 1, {price} * 0.8, {price})', { premium: 0, price: 500 })).toEqual({ value: 500 });
    });

    it('handles a zero-quantity guard to prevent meaningless output', () => {
      // IF({qty} = 0, 0, {base} + {qty} * {rate})
      const ctx: FormulaContext = { qty: 0, base: 100, rate: 20 };
      expect(evaluate('IF({qty} = 0, 0, {base} + {qty} * {rate})', ctx)).toEqual({ value: 0 });
    });

    it('handles a non-zero quantity in the guard formula', () => {
      const ctx: FormulaContext = { qty: 3, base: 100, rate: 20 };
      expect(evaluate('IF({qty} = 0, 0, {base} + {qty} * {rate})', ctx)).toEqual({ value: 160 });
    });

    describe('3-tier pricing model using nested IFs', () => {
      // IF(qty <= 10, qty*10, IF(qty <= 50, qty*8, qty*6))
      const formula = 'IF({qty} <= 10, {qty} * 10, IF({qty} <= 50, {qty} * 8, {qty} * 6))';

      test.each([
        { qty: 5,   expected: 50,  label: 'tier 1 (qty=5)'   },
        { qty: 25,  expected: 200, label: 'tier 2 (qty=25)'  },
        { qty: 100, expected: 600, label: 'tier 3 (qty=100)' },
      ])('$label', ({ qty, expected }) => {
        expect(evaluate(formula, { qty })).toEqual({ value: expected });
      });
    });

    it('handles a formula where multiple variables evaluate to zero', () => {
      const ctx: FormulaContext = { a: 0, b: 0, c: 0 };
      expect(evaluate('{a} + {b} + {c}', ctx)).toEqual({ value: 0 });
    });

    it('handles negative variable values in arithmetic', () => {
      const ctx: FormulaContext = { discount: -50, price: 200 };
      // price + discount = 200 + (-50) = 150
      expect(evaluate('{price} + {discount}', ctx)).toEqual({ value: 150 });
    });

    it('handles fractional results from integer division', () => {
      expect(evaluate('1 / 4', {})).toEqual({ value: 0.25 });
    });

    it('returns 1 when a fractional variable exceeds a fractional threshold', () => {
      expect(evaluate('{x} > 0.5', { x: 0.75 })).toEqual({ value: 1 });
    });

    it('returns 0 when a fractional variable is below a fractional threshold', () => {
      expect(evaluate('{x} > 0.5', { x: 0.25 })).toEqual({ value: 0 });
    });

    it('evaluates a not-equal check in a condition — non-zero status', () => {
      expect(evaluate('IF({status} != 0, 100, 0)', { status: 2 })).toEqual({ value: 100 });
    });

    it('evaluates a not-equal check in a condition — zero status', () => {
      expect(evaluate('IF({status} != 0, 100, 0)', { status: 0 })).toEqual({ value: 0 });
    });
  });
});
