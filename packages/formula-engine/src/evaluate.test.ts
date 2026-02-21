import { evaluate } from './evaluate';
import type { FormulaContext } from './types';

describe('evaluate', () => {
  it('returns a FormulaResult with a finite numeric value', () => {
    const context: FormulaContext = { qty: 5, price: 10 };
    const result = evaluate('qty * price', context);
    expect(Number.isFinite(result.value)).toBe(true);
  });

  it('returns a FormulaResult with an empty context', () => {
    const context: FormulaContext = {};
    const result = evaluate('', context);
    expect(Number.isFinite(result.value)).toBe(true);
  });
});
