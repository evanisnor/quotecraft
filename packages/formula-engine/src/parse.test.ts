import { tokenize } from './tokenize';
import { parse, ParseError } from './parse';
import type {
  ASTNode,
  NumberLiteralNode,
  VariableNode,
  BinaryOpNode,
  UnaryOpNode,
  FunctionCallNode,
} from './ast';

// ---------------------------------------------------------------------------
// Builder helpers — keep expected AST construction concise
// ---------------------------------------------------------------------------

function num(value: number): NumberLiteralNode {
  return { kind: 'NumberLiteral', value };
}

function variable(name: string): VariableNode {
  return { kind: 'Variable', name };
}

function binop(
  op: BinaryOpNode['op'],
  left: ASTNode,
  right: ASTNode,
): BinaryOpNode {
  return { kind: 'BinaryOp', op, left, right };
}

function unary(operand: ASTNode): UnaryOpNode {
  return { kind: 'UnaryOp', op: '-', operand };
}

function call(name: FunctionCallNode['name'], args: ASTNode[]): FunctionCallNode {
  return { kind: 'FunctionCall', name, args };
}

/** Convenience: tokenize then parse in one step. */
function p(formula: string): ASTNode {
  return parse(tokenize(formula));
}

// ---------------------------------------------------------------------------
// Literals
// ---------------------------------------------------------------------------

describe('parse — number literals', () => {
  it('parses an integer literal', () => {
    expect(p('42')).toEqual(num(42));
  });

  it('parses zero', () => {
    expect(p('0')).toEqual(num(0));
  });

  it('parses a decimal literal', () => {
    expect(p('3.14')).toEqual(num(3.14));
  });

  it('parses a decimal with leading zero', () => {
    expect(p('0.5')).toEqual(num(0.5));
  });

  it('parses a large integer', () => {
    expect(p('1000000')).toEqual(num(1000000));
  });
});

describe('parse — variable references', () => {
  it('parses a simple variable', () => {
    expect(p('{qty}')).toEqual(variable('qty'));
  });

  it('parses a variable with an underscore', () => {
    expect(p('{num_rooms}')).toEqual(variable('num_rooms'));
  });

  it('parses a variable with digits', () => {
    expect(p('{field2}')).toEqual(variable('field2'));
  });
});

// ---------------------------------------------------------------------------
// Arithmetic
// ---------------------------------------------------------------------------

describe('parse — arithmetic operators', () => {
  it('parses addition', () => {
    expect(p('1 + 2')).toEqual(binop('+', num(1), num(2)));
  });

  it('parses subtraction', () => {
    expect(p('3 - 1')).toEqual(binop('-', num(3), num(1)));
  });

  it('parses multiplication', () => {
    expect(p('4 * 5')).toEqual(binop('*', num(4), num(5)));
  });

  it('parses division', () => {
    expect(p('10 / 2')).toEqual(binop('/', num(10), num(2)));
  });

  it('parses modulo', () => {
    expect(p('10 % 3')).toEqual(binop('%', num(10), num(3)));
  });
});

// ---------------------------------------------------------------------------
// Operator precedence
// ---------------------------------------------------------------------------

describe('parse — operator precedence', () => {
  it('gives multiplication higher precedence than addition: 1 + 2 * 3', () => {
    // Expected: 1 + (2 * 3)  →  BinaryOp(+, 1, BinaryOp(*, 2, 3))
    expect(p('1 + 2 * 3')).toEqual(binop('+', num(1), binop('*', num(2), num(3))));
  });

  it('gives multiplication higher precedence than subtraction: 4 - 6 / 2', () => {
    // Expected: 4 - (6 / 2)
    expect(p('4 - 6 / 2')).toEqual(binop('-', num(4), binop('/', num(6), num(2))));
  });

  it('left-associates addition: 1 + 2 + 3', () => {
    // Expected: (1 + 2) + 3
    expect(p('1 + 2 + 3')).toEqual(binop('+', binop('+', num(1), num(2)), num(3)));
  });

  it('left-associates multiplication: 2 * 3 * 4', () => {
    // Expected: (2 * 3) * 4
    expect(p('2 * 3 * 4')).toEqual(binop('*', binop('*', num(2), num(3)), num(4)));
  });

  it('parentheses override precedence: (1 + 2) * 3', () => {
    // Expected: BinaryOp(*, BinaryOp(+, 1, 2), 3)
    expect(p('(1 + 2) * 3')).toEqual(binop('*', binop('+', num(1), num(2)), num(3)));
  });

  it('nested parentheses', () => {
    // ((2 + 3)) * 4 → BinaryOp(*, BinaryOp(+, 2, 3), 4)
    expect(p('((2 + 3)) * 4')).toEqual(binop('*', binop('+', num(2), num(3)), num(4)));
  });

  it('comparison has lower precedence than addition: 1 + 2 > 3 * 4', () => {
    // Expected: (1 + 2) > (3 * 4)
    expect(p('1 + 2 > 3 * 4')).toEqual(
      binop('>', binop('+', num(1), num(2)), binop('*', num(3), num(4))),
    );
  });

  it('modulo binds tighter than addition: 10 + 10 % 3', () => {
    // Expected: 10 + (10 % 3)
    expect(p('10 + 10 % 3')).toEqual(binop('+', num(10), binop('%', num(10), num(3))));
  });
});

// ---------------------------------------------------------------------------
// Unary minus
// ---------------------------------------------------------------------------

describe('parse — unary minus', () => {
  it('parses negative literal', () => {
    expect(p('-1')).toEqual(unary(num(1)));
  });

  it('parses negation of a parenthesised expression', () => {
    // -(2 + 3) → UnaryOp(-, BinaryOp(+, 2, 3))
    expect(p('-(2 + 3)')).toEqual(unary(binop('+', num(2), num(3))));
  });

  it('parses negation of a variable', () => {
    expect(p('-{x}')).toEqual(unary(variable('x')));
  });

  it('parses double unary minus: --{val}', () => {
    // --{val} → UnaryOp(-, UnaryOp(-, variable('val')))
    expect(p('--{val}')).toEqual(unary(unary(variable('val'))));
  });

  it('unary minus applied to a function call result', () => {
    // -ABS({x}) → UnaryOp(-, FunctionCall(ABS, [variable(x)]))
    expect(p('-ABS({x})')).toEqual(unary(call('ABS', [variable('x')])));
  });
});

// ---------------------------------------------------------------------------
// Comparison operators
// ---------------------------------------------------------------------------

describe('parse — comparison operators', () => {
  it('parses greater-than', () => {
    expect(p('{qty} > 10')).toEqual(binop('>', variable('qty'), num(10)));
  });

  it('parses equals', () => {
    expect(p('{a} = {b}')).toEqual(binop('=', variable('a'), variable('b')));
  });

  it('parses not-equals', () => {
    expect(p('{x} != 0')).toEqual(binop('!=', variable('x'), num(0)));
  });

  it('parses less-than', () => {
    expect(p('{x} < 100')).toEqual(binop('<', variable('x'), num(100)));
  });

  it('parses greater-than-or-equal', () => {
    expect(p('{qty} >= 10')).toEqual(binop('>=', variable('qty'), num(10)));
  });

  it('parses less-than-or-equal', () => {
    expect(p('{qty} <= 5')).toEqual(binop('<=', variable('qty'), num(5)));
  });

  it('chained comparisons are left-associative: 1 < 2 < 3', () => {
    // Expected: (1 < 2) < 3
    expect(p('1 < 2 < 3')).toEqual(binop('<', binop('<', num(1), num(2)), num(3)));
  });
});

// ---------------------------------------------------------------------------
// Function calls
// ---------------------------------------------------------------------------

describe('parse — function calls', () => {
  it('parses IF with a comparison and two branches', () => {
    expect(p('IF({qty} > 0, {price}, 0)')).toEqual(
      call('IF', [
        binop('>', variable('qty'), num(0)),
        variable('price'),
        num(0),
      ]),
    );
  });

  it('parses MIN with two variable arguments', () => {
    expect(p('MIN({a}, {b})')).toEqual(call('MIN', [variable('a'), variable('b')]));
  });

  it('parses MAX with two number literals', () => {
    expect(p('MAX(1, 2)')).toEqual(call('MAX', [num(1), num(2)]));
  });

  it('parses ABS with a variable', () => {
    expect(p('ABS({x})')).toEqual(call('ABS', [variable('x')]));
  });

  it('parses ROUND with a variable and a literal precision', () => {
    expect(p('ROUND({price}, 2)')).toEqual(call('ROUND', [variable('price'), num(2)]));
  });

  it('parses a function call with a single argument', () => {
    expect(p('ABS(42)')).toEqual(call('ABS', [num(42)]));
  });
});

// ---------------------------------------------------------------------------
// Nested expressions
// ---------------------------------------------------------------------------

describe('parse — nested expressions', () => {
  it('parses IF with arithmetic in branch: IF({qty} > 0, {price} * {qty}, 0)', () => {
    expect(p('IF({qty} > 0, {price} * {qty}, 0)')).toEqual(
      call('IF', [
        binop('>', variable('qty'), num(0)),
        binop('*', variable('price'), variable('qty')),
        num(0),
      ]),
    );
  });

  it('parses nested function calls: ROUND(ABS({x}), 2)', () => {
    expect(p('ROUND(ABS({x}), 2)')).toEqual(
      call('ROUND', [call('ABS', [variable('x')]), num(2)]),
    );
  });

  it('parses multi-level precedence: {a} + {b} * {c} - {d} / {e}', () => {
    // Expected: ({a} + ({b} * {c})) - ({d} / {e})
    expect(p('{a} + {b} * {c} - {d} / {e}')).toEqual(
      binop(
        '-',
        binop('+', variable('a'), binop('*', variable('b'), variable('c'))),
        binop('/', variable('d'), variable('e')),
      ),
    );
  });

  it('parses IF nested inside MIN: MIN(IF({x} > 0, {x}, 0), {y})', () => {
    expect(p('MIN(IF({x} > 0, {x}, 0), {y})')).toEqual(
      call('MIN', [
        call('IF', [
          binop('>', variable('x'), num(0)),
          variable('x'),
          num(0),
        ]),
        variable('y'),
      ]),
    );
  });

  it('parses nested unary minus with arithmetic: -(3 * {x})', () => {
    expect(p('-(3 * {x})')).toEqual(unary(binop('*', num(3), variable('x'))));
  });
});

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------

describe('parse — error cases', () => {
  it('throws ParseError for an unknown identifier', () => {
    expect(() => p('foo')).toThrow(ParseError);
  });

  it('throws ParseError for an unknown identifier in an expression', () => {
    expect(() => p('1 + foo')).toThrow(ParseError);
  });

  it('throws ParseError for an unknown function name', () => {
    // SQRT is not in the allow-list
    expect(() => p('SQRT({x})')).toThrow(ParseError);
  });

  it('throws ParseError for an identifier that looks like a function but is not allowed', () => {
    expect(() => p('POW(2, 3)')).toThrow(ParseError);
  });

  it('throws ParseError for a missing closing parenthesis', () => {
    expect(() => p('(1 + 2')).toThrow(ParseError);
  });

  it('throws ParseError for a missing closing paren in a function call', () => {
    expect(() => p('ABS({x}')).toThrow(ParseError);
  });

  it('throws ParseError for trailing tokens after a valid expression', () => {
    // "1 2" — there is a valid expression "1" followed by the unexpected "2"
    expect(() => p('1 2')).toThrow(ParseError);
  });

  it('throws ParseError for trailing operator after expression', () => {
    expect(() => p('1 + 2 +')).toThrow(ParseError);
  });

  it('throws ParseError for empty input (just EOF)', () => {
    expect(() => p('')).toThrow(ParseError);
  });

  it('throws ParseError for a bare comma', () => {
    expect(() => p(',')).toThrow(ParseError);
  });

  it('throws ParseError for an unmatched closing parenthesis', () => {
    expect(() => p('1 + 2)')).toThrow(ParseError);
  });

  it('ParseError carries name: "ParseError"', () => {
    let caught: unknown;
    try {
      p('foo');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ParseError);
    expect((caught as ParseError).name).toBe('ParseError');
  });

  it('ParseError from empty input carries name: "ParseError"', () => {
    let caught: unknown;
    try {
      p('');
    } catch (e) {
      caught = e;
    }
    expect(caught).toBeInstanceOf(ParseError);
    expect((caught as ParseError).name).toBe('ParseError');
  });

  it('ParseError message is descriptive for unknown identifier', () => {
    let caught: unknown;
    try {
      p('foo');
    } catch (e) {
      caught = e;
    }
    expect((caught as ParseError).message).toMatch(/foo/);
  });

  it('ParseError message is descriptive for trailing tokens', () => {
    let caught: unknown;
    try {
      p('1 2');
    } catch (e) {
      caught = e;
    }
    expect((caught as ParseError).message).toMatch(/unexpected/i);
  });
});

// ---------------------------------------------------------------------------
// Table-driven: comparison operators
// ---------------------------------------------------------------------------

describe('parse — comparison operators (table-driven)', () => {
  test.each([
    { formula: '{x} = {y}',  op: '=' },
    { formula: '{x} != {y}', op: '!=' },
    { formula: '{x} > {y}',  op: '>' },
    { formula: '{x} < {y}',  op: '<' },
    { formula: '{x} >= {y}', op: '>=' },
    { formula: '{x} <= {y}', op: '<=' },
  ] as const)('parses $formula with op=$op', ({ formula, op }) => {
    const result = p(formula);
    expect(result).toEqual(binop(op, variable('x'), variable('y')));
  });
});

// ---------------------------------------------------------------------------
// Table-driven: all arithmetic operators
// ---------------------------------------------------------------------------

describe('parse — arithmetic operators (table-driven)', () => {
  test.each([
    { formula: '5 + 3', op: '+', left: 5, right: 3 },
    { formula: '5 - 3', op: '-', left: 5, right: 3 },
    { formula: '5 * 3', op: '*', left: 5, right: 3 },
    { formula: '5 / 3', op: '/', left: 5, right: 3 },
    { formula: '5 % 3', op: '%', left: 5, right: 3 },
  ] as const)('parses $formula', ({ formula, op, left, right }) => {
    expect(p(formula)).toEqual(binop(op, num(left), num(right)));
  });
});

// ---------------------------------------------------------------------------
// Table-driven: function names that are valid
// ---------------------------------------------------------------------------

describe('parse — valid function names (table-driven)', () => {
  test.each([
    { name: 'IF',    args: '1, 2, 3',    count: 3 },
    { name: 'MIN',   args: '1, 2',       count: 2 },
    { name: 'MAX',   args: '1, 2',       count: 2 },
    { name: 'ABS',   args: '1',          count: 1 },
    { name: 'ROUND', args: '1, 2',       count: 2 },
  ] as const)('parses $name(...) successfully', ({ name, args, count }) => {
    const result = p(`${name}(${args})`);
    expect(result.kind).toBe('FunctionCall');
    expect((result as FunctionCallNode).name).toBe(name);
    expect((result as FunctionCallNode).args).toHaveLength(count);
  });
});

// ---------------------------------------------------------------------------
// Table-driven: unknown identifiers/functions that must throw ParseError
// ---------------------------------------------------------------------------

describe('parse — invalid identifiers throw ParseError (table-driven)', () => {
  test.each([
    'foo',
    'bar',
    'SQRT({x})',
    'POW(2, 3)',
    'LOG(10)',
    'unknown',
  ])('throws ParseError for: %s', (formula) => {
    expect(() => p(formula)).toThrow(ParseError);
  });
});
