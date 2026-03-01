/**
 * The kind of a lexical token produced by the tokenizer.
 *
 * IDENT is used for both keywords (IF, MIN, MAX, ABS, ROUND) and
 * user-defined identifiers. Distinguishing keywords from identifiers
 * is the parser's responsibility.
 */
export type TokenKind =
  | 'NUMBER'   // numeric literal: e.g. 42, 3.14
  | 'IDENT'    // identifier or keyword: e.g. IF, MIN, MAX, ABS, ROUND, foo
  | 'VARIABLE' // field reference: {field_name} — value stored without braces
  | 'PLUS'     // +
  | 'MINUS'    // -
  | 'STAR'     // *
  | 'SLASH'    // /
  | 'PERCENT'  // %
  | 'EQ'       // =
  | 'NEQ'      // !=
  | 'GT'       // >
  | 'LT'       // <
  | 'GTE'      // >=
  | 'LTE'      // <=
  | 'LPAREN'   // (
  | 'RPAREN'   // )
  | 'COMMA'    // ,
  | 'EOF';     // end of input

/**
 * A single lexical token.
 */
export interface Token {
  /** The kind of token. */
  kind: TokenKind;
  /**
   * The raw text of the token. For VARIABLE tokens, this is the field name
   * without the surrounding braces. For EOF, this is an empty string.
   */
  value: string;
}
