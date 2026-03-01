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

    it('defaults an unknown variable to 0 without an error', () => {
      expect(evaluate('{unknown}', {})).toEqual({ value: 0 });
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
  // Errors — unsupported function calls
  // ---------------------------------------------------------------------------

  describe('unsupported function calls', () => {
    it('returns an error for IF()', () => {
      const result = evaluate('IF(1, 2, 3)', {});
      expect(result.value).toBe(0);
      expect(result.error).toBeDefined();
    });

    it('returns an error for MIN()', () => {
      const result = evaluate('MIN(1, 2)', {});
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
});
