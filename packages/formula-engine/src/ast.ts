/**
 * Binary operator symbols supported by the formula engine.
 *
 * Arithmetic: + - * / %
 * Comparison: = != > < >= <=
 */
export type BinaryOperator = '+' | '-' | '*' | '/' | '%' | '=' | '!=' | '>' | '<' | '>=' | '<=';

/**
 * Allow-listed function names. Only these identifiers are legal in a
 * function-call position. Any other identifier causes a ParseError.
 */
export type FunctionName = 'IF' | 'MIN' | 'MAX' | 'ABS' | 'ROUND';

// ---------------------------------------------------------------------------
// AST node interfaces
// ---------------------------------------------------------------------------

/** A numeric literal such as 42 or 3.14. */
export interface NumberLiteralNode {
  readonly kind: 'NumberLiteral';
  /** The numeric value of the literal, already parsed from the token text. */
  readonly value: number;
}

/** A field reference such as {qty}. The `name` is stored without braces. */
export interface VariableNode {
  readonly kind: 'Variable';
  /** The field name without the surrounding { }. */
  readonly name: string;
}

/**
 * A binary operation: left op right.
 * The parser produces left-associative trees for operators at the same
 * precedence level.
 */
export interface BinaryOpNode {
  readonly kind: 'BinaryOp';
  readonly op: BinaryOperator;
  readonly left: ASTNode;
  readonly right: ASTNode;
}

/**
 * A unary operation. Only unary minus (-) is supported.
 */
export interface UnaryOpNode {
  readonly kind: 'UnaryOp';
  readonly op: '-';
  readonly operand: ASTNode;
}

/**
 * A function call. Only the allow-listed FunctionName values are accepted;
 * anything else causes a ParseError during parsing.
 */
export interface FunctionCallNode {
  readonly kind: 'FunctionCall';
  readonly name: FunctionName;
  readonly args: readonly ASTNode[];
}

/**
 * Discriminated union of all AST node types produced by the parser.
 */
export type ASTNode =
  | NumberLiteralNode
  | VariableNode
  | BinaryOpNode
  | UnaryOpNode
  | FunctionCallNode;
