/**
 * Converts a label string into a snake_case variable name slug.
 *
 * Rules:
 * - Lowercase all characters
 * - Replace any non-alphanumeric character with an underscore
 * - Collapse consecutive underscores into a single underscore
 * - Trim leading and trailing underscores
 *
 * Examples:
 *   "Project Name!" → "project_name"
 *   "  Budget  "   → "budget"
 *   "A&B"          → "a_b"
 *   ""             → ""
 */
export function generateVariableName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
