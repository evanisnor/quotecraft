import type { Token } from './token';
import type {
  ASTNode,
  BinaryOperator,
  FunctionName,
} from './ast';

/**
 * Thrown when the parser encounters a token sequence that does not match
 * the grammar, including unknown identifiers, unknown function names, or
 * mismatched parentheses.
 */
export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

// ---------------------------------------------------------------------------
// Allow-list for function names
// ---------------------------------------------------------------------------

const FUNCTION_NAMES = new Set<string>(['IF', 'MIN', 'MAX', 'ABS', 'ROUND']);

function isFunctionName(value: string): value is FunctionName {
  return FUNCTION_NAMES.has(value);
}

// ---------------------------------------------------------------------------
// Parser implementation
// ---------------------------------------------------------------------------

/**
 * Stateful single-use recursive descent parser that walks a flat token array.
 * Create one instance per `parse` call.
 */
class Parser {
  private readonly tokens: Token[];
  private pos: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  // -------------------------------------------------------------------------
  // Token inspection helpers
  // -------------------------------------------------------------------------

  peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const token = this.tokens[this.pos];
    this.pos++;
    return token;
  }

  private expect(kind: Token['kind']): Token {
    const token = this.peek();
    if (token.kind !== kind) {
      throw new ParseError(
        `Expected '${kind}' but got '${token.kind}'` +
          (token.value ? ` ('${token.value}')` : ''),
      );
    }
    return this.advance();
  }

  // -------------------------------------------------------------------------
  // Grammar rules — lowest to highest precedence
  // -------------------------------------------------------------------------

  /**
   * expression → comparison
   *
   * Entry point for parsing a complete expression. Used by both the top-level
   * `parse` function and recursively inside parentheses and function arguments.
   */
  parseExpression(): ASTNode {
    return this.parseComparison();
  }

  /**
   * comparison → addition ((= | != | > | < | >= | <=) addition)*
   */
  private parseComparison(): ASTNode {
    let node = this.parseAddition();

    while (true) {
      const kind = this.peek().kind;
      let op: BinaryOperator | null = null;

      if      (kind === 'EQ')  op = '=';
      else if (kind === 'NEQ') op = '!=';
      else if (kind === 'GT')  op = '>';
      else if (kind === 'LT')  op = '<';
      else if (kind === 'GTE') op = '>=';
      else if (kind === 'LTE') op = '<=';
      else break;

      this.advance(); // consume operator token
      const right = this.parseAddition();
      node = { kind: 'BinaryOp', op, left: node, right };
    }

    return node;
  }

  /**
   * addition → multiplication ((+ | -) multiplication)*
   */
  private parseAddition(): ASTNode {
    let node = this.parseMultiplication();

    while (true) {
      const kind = this.peek().kind;
      let op: BinaryOperator | null = null;

      if      (kind === 'PLUS')  op = '+';
      else if (kind === 'MINUS') op = '-';
      else break;

      this.advance();
      const right = this.parseMultiplication();
      node = { kind: 'BinaryOp', op, left: node, right };
    }

    return node;
  }

  /**
   * multiplication → unary ((* | / | %) unary)*
   */
  private parseMultiplication(): ASTNode {
    let node = this.parseUnary();

    while (true) {
      const kind = this.peek().kind;
      let op: BinaryOperator | null = null;

      if      (kind === 'STAR')    op = '*';
      else if (kind === 'SLASH')   op = '/';
      else if (kind === 'PERCENT') op = '%';
      else break;

      this.advance();
      const right = this.parseUnary();
      node = { kind: 'BinaryOp', op, left: node, right };
    }

    return node;
  }

  /**
   * unary → - unary | primary
   */
  private parseUnary(): ASTNode {
    if (this.peek().kind === 'MINUS') {
      this.advance(); // consume '-'
      const operand = this.parseUnary();
      return { kind: 'UnaryOp', op: '-', operand };
    }
    return this.parsePrimary();
  }

  /**
   * primary → NUMBER
   *         | VARIABLE
   *         | IDENT LPAREN args RPAREN
   *         | LPAREN expression RPAREN
   */
  private parsePrimary(): ASTNode {
    const token = this.peek();

    // NUMBER literal
    if (token.kind === 'NUMBER') {
      this.advance();
      return { kind: 'NumberLiteral', value: parseFloat(token.value) };
    }

    // VARIABLE reference — value stored without braces by the tokenizer
    if (token.kind === 'VARIABLE') {
      this.advance();
      return { kind: 'Variable', name: token.value };
    }

    // IDENT — must be an allowed function name followed by '('
    if (token.kind === 'IDENT') {
      this.advance(); // consume identifier

      if (this.peek().kind === 'LPAREN') {
        // Looks like a function call — validate the name
        if (!isFunctionName(token.value)) {
          throw new ParseError(
            `Unknown function name '${token.value}': ` +
              `expected one of IF, MIN, MAX, ABS, ROUND`,
          );
        }
        this.advance(); // consume '('
        const args = this.parseArgs();
        this.expect('RPAREN');
        return { kind: 'FunctionCall', name: token.value, args };
      }

      // Identifier not followed by '(' — no valid non-function use of IDENT
      throw new ParseError(
        `Unknown identifier '${token.value}': bare identifiers are not allowed; ` +
          `use variable references (e.g. {${token.value}}) or one of the allowed ` +
          `function names: IF, MIN, MAX, ABS, ROUND`,
      );
    }

    // Grouped expression: ( expression )
    if (token.kind === 'LPAREN') {
      this.advance(); // consume '('
      const inner = this.parseExpression();
      this.expect('RPAREN');
      return inner;
    }

    // Anything else is a syntax error
    throw new ParseError(
      `Unexpected token '${token.kind}'` + (token.value ? ` ('${token.value}')` : ''),
    );
  }

  /**
   * args → expression (, expression)*
   *
   * Parses function arguments after '(' has been consumed. Does NOT consume
   * the closing ')'.
   */
  private parseArgs(): ASTNode[] {
    const args: ASTNode[] = [];
    args.push(this.parseExpression());

    while (this.peek().kind === 'COMMA') {
      this.advance(); // consume ','
      args.push(this.parseExpression());
    }

    return args;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Parses a flat array of tokens (as produced by `tokenize`) into an AST.
 *
 * Supported grammar:
 * - Numeric literals: 42, 3.14
 * - Variable references: {name}
 * - Arithmetic: + - * / % (with standard precedence)
 * - Comparison: = != > < >= <= (lower precedence than arithmetic)
 * - Unary minus: -expr
 * - Function calls: IF(…) MIN(…) MAX(…) ABS(…) ROUND(…)
 * - Parenthesised grouping: (expr)
 *
 * No other identifiers are permitted. Bare identifiers that are not valid
 * function names cause a ParseError.
 *
 * The parser does NOT reference `eval`, `Function`, `window`, `document`, or
 * any browser global. It is pure TypeScript operating only on the token array.
 *
 * @throws {ParseError} for any syntactic error in the token stream.
 */
export function parse(tokens: Token[]): ASTNode {
  const parser = new Parser(tokens);
  const root = parser.parseExpression();

  // After a well-formed expression the next token must be EOF.
  const next = parser.peek();
  if (next.kind !== 'EOF') {
    throw new ParseError(
      `Unexpected token after expression: '${next.kind}'` +
        (next.value ? ` ('${next.value}')` : ''),
    );
  }

  return root;
}
