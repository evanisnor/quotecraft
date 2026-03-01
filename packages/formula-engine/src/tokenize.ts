import type { Token, TokenKind } from './token';

/**
 * Thrown when the tokenizer encounters input it cannot produce a valid token
 * from — for example, an unclosed variable reference or an unrecognized
 * character.
 */
export class TokenizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TokenizeError';
  }
}

/**
 * Converts a formula expression string into a flat array of tokens.
 *
 * Rules:
 * - Whitespace (space, tab, newline, carriage return) is skipped.
 * - Numbers start with a digit and may include a single decimal point
 *   followed by more digits. Leading-decimal numbers like `.5` are not
 *   supported and will trigger a TokenizeError.
 * - Identifiers start with a letter ([a-zA-Z]) and continue with letters,
 *   digits, or underscores. The tokenizer does not distinguish keywords
 *   from user-defined identifiers — that is the parser's responsibility.
 * - Variables are written as `{name}` where `name` consists of letters,
 *   digits, and underscores. The value stored in the token is the name
 *   without braces. An unclosed `{` throws TokenizeError.
 * - Two-character operators (`!=`, `>=`, `<=`) are matched before their
 *   single-character counterparts. A lone `!` throws TokenizeError.
 * - Any unrecognized character throws TokenizeError.
 * - The returned array always ends with an EOF token.
 *
 * @throws {TokenizeError} for unrecognized characters or malformed input.
 */
export function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;

  while (pos < input.length) {
    const ch = input[pos];

    // Skip whitespace
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      pos++;
      continue;
    }

    // Number: must start with a digit
    if (isDigit(ch)) {
      const start = pos;
      while (pos < input.length && isDigit(input[pos])) {
        pos++;
      }
      // Optional decimal portion — must have at least one digit after '.'
      if (pos < input.length && input[pos] === '.') {
        const dotPos = pos;
        pos++; // consume '.'
        if (pos >= input.length || !isDigit(input[pos])) {
          throw new TokenizeError(
            `Invalid number literal: trailing '.' at position ${dotPos}`
          );
        }
        while (pos < input.length && isDigit(input[pos])) {
          pos++;
        }
      }
      tokens.push({ kind: 'NUMBER', value: input.slice(start, pos) });
      continue;
    }

    // Identifier: starts with a letter
    if (isLetter(ch)) {
      const start = pos;
      while (pos < input.length && isIdentChar(input[pos])) {
        pos++;
      }
      tokens.push({ kind: 'IDENT', value: input.slice(start, pos) });
      continue;
    }

    // Variable: {name}
    if (ch === '{') {
      pos++; // consume '{'
      const start = pos;
      while (pos < input.length && isIdentChar(input[pos])) {
        pos++;
      }
      if (pos === start) {
        throw new TokenizeError(
          `Empty variable name at position ${start - 1}: variable references must be non-empty`
        );
      }
      if (pos >= input.length || input[pos] !== '}') {
        // start - 1 points back to the '{' that was consumed before setting start
        throw new TokenizeError(
          `Unclosed variable reference starting at position ${start - 1}`
        );
      }
      const name = input.slice(start, pos);
      pos++; // consume '}'
      tokens.push({ kind: 'VARIABLE', value: name });
      continue;
    }

    // Two-character and single-character operators
    const twoChar = pos + 1 < input.length ? input.slice(pos, pos + 2) : '';

    if (twoChar === '!=') {
      tokens.push({ kind: 'NEQ', value: '!=' });
      pos += 2;
      continue;
    }

    if (twoChar === '>=') {
      tokens.push({ kind: 'GTE', value: '>=' });
      pos += 2;
      continue;
    }

    if (twoChar === '<=') {
      tokens.push({ kind: 'LTE', value: '<=' });
      pos += 2;
      continue;
    }

    // Single-character operators and punctuation
    const singleCharKind = singleCharToken(ch);
    if (singleCharKind !== null) {
      tokens.push({ kind: singleCharKind, value: ch });
      pos++;
      continue;
    }

    // '!' alone is not a valid token
    if (ch === '!') {
      throw new TokenizeError(
        `Unexpected '!' at position ${pos}: expected '!=' but found '!' alone`
      );
    }

    throw new TokenizeError(
      `Unrecognized character '${ch}' at position ${pos}`
    );
  }

  tokens.push({ kind: 'EOF', value: '' });
  return tokens;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isDigit(ch: string): boolean {
  return ch >= '0' && ch <= '9';
}

function isLetter(ch: string): boolean {
  return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
}

function isIdentChar(ch: string): boolean {
  return isLetter(ch) || isDigit(ch) || ch === '_';
}

/**
 * Returns the TokenKind for a recognized single-character operator, or null
 * if the character is not a single-character operator. Does NOT handle '!'
 * (that requires lookahead and is dealt with separately).
 */
function singleCharToken(ch: string): TokenKind | null {
  switch (ch) {
    case '+': return 'PLUS';
    case '-': return 'MINUS';
    case '*': return 'STAR';
    case '/': return 'SLASH';
    case '%': return 'PERCENT';
    case '=': return 'EQ';
    case '>': return 'GT';
    case '<': return 'LT';
    case '(': return 'LPAREN';
    case ')': return 'RPAREN';
    case ',': return 'COMMA';
    default:  return null;
  }
}
