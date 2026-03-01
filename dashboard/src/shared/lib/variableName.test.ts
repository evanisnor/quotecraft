import { generateVariableName } from './variableName';

describe('generateVariableName', () => {
  test.each([
    { input: 'Project Name!', expected: 'project_name' },
    { input: '  Budget  ', expected: 'budget' },
    { input: 'A&B', expected: 'a_b' },
    { input: 'hello world', expected: 'hello_world' },
    { input: 'CamelCase', expected: 'camelcase' },
    { input: 'multiple   spaces', expected: 'multiple_spaces' },
    { input: '---leading-trailing---', expected: 'leading_trailing' },
    { input: 'already_snake_case', expected: 'already_snake_case' },
    { input: 'UPPERCASE', expected: 'uppercase' },
    { input: 'special!@#$%chars', expected: 'special_chars' },
    { input: '123 numbers', expected: '123_numbers' },
    { input: 'a', expected: 'a' },
  ])('converts "$input" to "$expected"', ({ input, expected }) => {
    expect(generateVariableName(input)).toBe(expected);
  });

  it('returns an empty string for an empty input', () => {
    expect(generateVariableName('')).toBe('');
  });

  it('returns an empty string when the input contains only non-alphanumeric characters', () => {
    expect(generateVariableName('!!!###')).toBe('');
  });
});
