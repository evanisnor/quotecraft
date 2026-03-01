import { tokenize, TokenizeError } from './tokenize';
import type { Token } from './token';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a token for use in expected arrays. */
function tok(kind: Token['kind'], value: string): Token {
  return { kind, value };
}

const EOF = tok('EOF', '');

// ---------------------------------------------------------------------------
// Empty / whitespace input
// ---------------------------------------------------------------------------

describe('tokenize — empty and whitespace input', () => {
  it('returns only EOF for an empty string', () => {
    expect(tokenize('')).toEqual([EOF]);
  });

  it('returns only EOF for a whitespace-only string', () => {
    expect(tokenize('   \t\n\r')).toEqual([EOF]);
  });
});

// ---------------------------------------------------------------------------
// Number literals
// ---------------------------------------------------------------------------

describe('tokenize — number literals', () => {
  it('tokenizes a single integer', () => {
    expect(tokenize('42')).toEqual([tok('NUMBER', '42'), EOF]);
  });

  it('tokenizes zero', () => {
    expect(tokenize('0')).toEqual([tok('NUMBER', '0'), EOF]);
  });

  it('tokenizes a decimal number', () => {
    expect(tokenize('3.14')).toEqual([tok('NUMBER', '3.14'), EOF]);
  });

  it('tokenizes a decimal with only zeros after the point', () => {
    expect(tokenize('1.0')).toEqual([tok('NUMBER', '1.0'), EOF]);
  });

  it('tokenizes a number with leading zero followed by decimal', () => {
    expect(tokenize('0.5')).toEqual([tok('NUMBER', '0.5'), EOF]);
  });

  it('tokenizes a large integer', () => {
    expect(tokenize('1000000')).toEqual([tok('NUMBER', '1000000'), EOF]);
  });
});

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

describe('tokenize — identifiers', () => {
  it('tokenizes a single uppercase keyword', () => {
    expect(tokenize('IF')).toEqual([tok('IDENT', 'IF'), EOF]);
  });

  it('tokenizes a lowercase identifier', () => {
    expect(tokenize('foo')).toEqual([tok('IDENT', 'foo'), EOF]);
  });

  it('tokenizes a mixed-case identifier', () => {
    expect(tokenize('myVar')).toEqual([tok('IDENT', 'myVar'), EOF]);
  });

  it('tokenizes an identifier with digits', () => {
    expect(tokenize('x2')).toEqual([tok('IDENT', 'x2'), EOF]);
  });

  it('tokenizes an identifier with underscores', () => {
    expect(tokenize('some_func')).toEqual([tok('IDENT', 'some_func'), EOF]);
  });

  test.each([
    ['MIN'],
    ['MAX'],
    ['ABS'],
    ['ROUND'],
    ['IF'],
  ])('tokenizes built-in keyword %s as IDENT', (keyword) => {
    expect(tokenize(keyword)).toEqual([tok('IDENT', keyword), EOF]);
  });
});

// ---------------------------------------------------------------------------
// Variable references
// ---------------------------------------------------------------------------

describe('tokenize — variable references', () => {
  it('tokenizes a simple variable and strips braces', () => {
    expect(tokenize('{qty}')).toEqual([tok('VARIABLE', 'qty'), EOF]);
  });

  it('tokenizes a variable with an underscore', () => {
    expect(tokenize('{num_rooms}')).toEqual([tok('VARIABLE', 'num_rooms'), EOF]);
  });

  it('tokenizes a variable with digits in the name', () => {
    expect(tokenize('{field2}')).toEqual([tok('VARIABLE', 'field2'), EOF]);
  });

  it('tokenizes a variable with a mixed name', () => {
    expect(tokenize('{base_price}')).toEqual([tok('VARIABLE', 'base_price'), EOF]);
  });

  it('throws TokenizeError for an unclosed variable reference', () => {
    expect(() => tokenize('{foo')).toThrow(TokenizeError);
  });

  it('throws TokenizeError and carries the TokenizeError name', () => {
    expect(() => tokenize('{foo')).toThrow(expect.objectContaining({ name: 'TokenizeError' }));
  });
});

// ---------------------------------------------------------------------------
// Arithmetic operators
// ---------------------------------------------------------------------------

describe('tokenize — arithmetic operators', () => {
  it('tokenizes PLUS', () => {
    expect(tokenize('+')).toEqual([tok('PLUS', '+'), EOF]);
  });

  it('tokenizes MINUS', () => {
    expect(tokenize('-')).toEqual([tok('MINUS', '-'), EOF]);
  });

  it('tokenizes STAR', () => {
    expect(tokenize('*')).toEqual([tok('STAR', '*'), EOF]);
  });

  it('tokenizes SLASH', () => {
    expect(tokenize('/')).toEqual([tok('SLASH', '/'), EOF]);
  });

  it('tokenizes PERCENT', () => {
    expect(tokenize('%')).toEqual([tok('PERCENT', '%'), EOF]);
  });

  it('tokenizes a simple addition expression', () => {
    expect(tokenize('1 + 2')).toEqual([
      tok('NUMBER', '1'),
      tok('PLUS', '+'),
      tok('NUMBER', '2'),
      EOF,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Comparison operators
// ---------------------------------------------------------------------------

describe('tokenize — comparison operators', () => {
  it('tokenizes EQ', () => {
    expect(tokenize('=')).toEqual([tok('EQ', '='), EOF]);
  });

  it('tokenizes NEQ', () => {
    expect(tokenize('!=')).toEqual([tok('NEQ', '!='), EOF]);
  });

  it('tokenizes GT', () => {
    expect(tokenize('>')).toEqual([tok('GT', '>'), EOF]);
  });

  it('tokenizes LT', () => {
    expect(tokenize('<')).toEqual([tok('LT', '<'), EOF]);
  });

  it('tokenizes GTE', () => {
    expect(tokenize('>=')).toEqual([tok('GTE', '>='), EOF]);
  });

  it('tokenizes LTE', () => {
    expect(tokenize('<=')).toEqual([tok('LTE', '<='), EOF]);
  });

  it('does not consume GTE when followed by another character', () => {
    expect(tokenize('>= 5')).toEqual([
      tok('GTE', '>='),
      tok('NUMBER', '5'),
      EOF,
    ]);
  });

  it('tokenizes GT when not followed by =', () => {
    expect(tokenize('> 5')).toEqual([
      tok('GT', '>'),
      tok('NUMBER', '5'),
      EOF,
    ]);
  });

  it('tokenizes LT when not followed by =', () => {
    expect(tokenize('< 5')).toEqual([
      tok('LT', '<'),
      tok('NUMBER', '5'),
      EOF,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Grouping and comma
// ---------------------------------------------------------------------------

describe('tokenize — parentheses and comma', () => {
  it('tokenizes LPAREN', () => {
    expect(tokenize('(')).toEqual([tok('LPAREN', '('), EOF]);
  });

  it('tokenizes RPAREN', () => {
    expect(tokenize(')')).toEqual([tok('RPAREN', ')'), EOF]);
  });

  it('tokenizes COMMA', () => {
    expect(tokenize(',')).toEqual([tok('COMMA', ','), EOF]);
  });
});

// ---------------------------------------------------------------------------
// Multi-token expressions
// ---------------------------------------------------------------------------

describe('tokenize — multi-token expressions', () => {
  it('tokenizes a variable multiplication expression', () => {
    expect(tokenize('{qty} * {price} + 10')).toEqual([
      tok('VARIABLE', 'qty'),
      tok('STAR', '*'),
      tok('VARIABLE', 'price'),
      tok('PLUS', '+'),
      tok('NUMBER', '10'),
      EOF,
    ]);
  });

  it('tokenizes a function call', () => {
    expect(tokenize('IF(1, 2, 3)')).toEqual([
      tok('IDENT', 'IF'),
      tok('LPAREN', '('),
      tok('NUMBER', '1'),
      tok('COMMA', ','),
      tok('NUMBER', '2'),
      tok('COMMA', ','),
      tok('NUMBER', '3'),
      tok('RPAREN', ')'),
      EOF,
    ]);
  });

  it('tokenizes a MIN call with variable arguments', () => {
    expect(tokenize('MIN({a}, {b})')).toEqual([
      tok('IDENT', 'MIN'),
      tok('LPAREN', '('),
      tok('VARIABLE', 'a'),
      tok('COMMA', ','),
      tok('VARIABLE', 'b'),
      tok('RPAREN', ')'),
      EOF,
    ]);
  });

  it('tokenizes consecutive tokens without spaces', () => {
    expect(tokenize('(1+2)')).toEqual([
      tok('LPAREN', '('),
      tok('NUMBER', '1'),
      tok('PLUS', '+'),
      tok('NUMBER', '2'),
      tok('RPAREN', ')'),
      EOF,
    ]);
  });

  it('tokenizes a nested function expression', () => {
    expect(tokenize('ROUND(ABS({x}), 2)')).toEqual([
      tok('IDENT', 'ROUND'),
      tok('LPAREN', '('),
      tok('IDENT', 'ABS'),
      tok('LPAREN', '('),
      tok('VARIABLE', 'x'),
      tok('RPAREN', ')'),
      tok('COMMA', ','),
      tok('NUMBER', '2'),
      tok('RPAREN', ')'),
      EOF,
    ]);
  });

  it('tokenizes a comparison expression with variables', () => {
    expect(tokenize('{qty} >= 10')).toEqual([
      tok('VARIABLE', 'qty'),
      tok('GTE', '>='),
      tok('NUMBER', '10'),
      EOF,
    ]);
  });

  it('tokenizes an arithmetic expression with a decimal', () => {
    expect(tokenize('{price} * 1.5')).toEqual([
      tok('VARIABLE', 'price'),
      tok('STAR', '*'),
      tok('NUMBER', '1.5'),
      EOF,
    ]);
  });
});

// ---------------------------------------------------------------------------
// Error cases
// ---------------------------------------------------------------------------

describe('tokenize — error cases', () => {
  it('throws TokenizeError for an unrecognized character @', () => {
    expect(() => tokenize('@')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for a lone ! without =', () => {
    expect(() => tokenize('!')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for ! in the middle of an expression', () => {
    expect(() => tokenize('1 ! 2')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for an unclosed brace in an expression', () => {
    expect(() => tokenize('{qty * 2')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for a hash character', () => {
    expect(() => tokenize('#price')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for a dollar sign', () => {
    expect(() => tokenize('$100')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for a caret', () => {
    expect(() => tokenize('^')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for an ampersand', () => {
    expect(() => tokenize('&')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for a trailing decimal with no fractional digits', () => {
    expect(() => tokenize('1.')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for a trailing decimal followed by a non-digit', () => {
    expect(() => tokenize('1.+2')).toThrow(TokenizeError);
  });

  it('throws TokenizeError for an empty variable name {}', () => {
    expect(() => tokenize('{}')).toThrow(TokenizeError);
  });
});

// ---------------------------------------------------------------------------
// Table-driven: all single-character punctuation
// ---------------------------------------------------------------------------

describe('tokenize — all single-character operators via table', () => {
  test.each([
    { input: '+', kind: 'PLUS',    value: '+' },
    { input: '-', kind: 'MINUS',   value: '-' },
    { input: '*', kind: 'STAR',    value: '*' },
    { input: '/', kind: 'SLASH',   value: '/' },
    { input: '%', kind: 'PERCENT', value: '%' },
    { input: '=', kind: 'EQ',      value: '=' },
    { input: '>', kind: 'GT',      value: '>' },
    { input: '<', kind: 'LT',      value: '<' },
    { input: '(', kind: 'LPAREN',  value: '(' },
    { input: ')', kind: 'RPAREN',  value: ')' },
    { input: ',', kind: 'COMMA',   value: ',' },
  ] as const)('$input → $kind', ({ input, kind, value }) => {
    const tokens = tokenize(input);
    expect(tokens).toHaveLength(2); // operator + EOF
    expect(tokens[0]).toEqual(tok(kind, value));
    expect(tokens[1]).toEqual(EOF);
  });
});

// ---------------------------------------------------------------------------
// Table-driven: two-character operators
// ---------------------------------------------------------------------------

describe('tokenize — two-character operators via table', () => {
  test.each([
    { input: '!=', kind: 'NEQ', value: '!=' },
    { input: '>=', kind: 'GTE', value: '>=' },
    { input: '<=', kind: 'LTE', value: '<=' },
  ] as const)('$input → $kind', ({ input, kind, value }) => {
    const tokens = tokenize(input);
    expect(tokens).toHaveLength(2);
    expect(tokens[0]).toEqual(tok(kind, value));
    expect(tokens[1]).toEqual(EOF);
  });
});
