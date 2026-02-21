/**
 * The types of input fields supported by the calculator builder.
 * Full type set is expanded in BLDR-US2.
 */
export type FieldType = 'number' | 'text' | 'select' | 'radio' | 'checkbox';

/**
 * Configuration for a single calculator input field.
 */
export interface FieldConfig {
  /** Unique identifier for the field within the calculator. */
  id: string;
  /** Display label shown to end users. */
  label: string;
  /** The type of input control to render. */
  type: FieldType;
  /** Whether the field is required before submission. */
  required: boolean;
}

/**
 * The complete configuration for a QuoteCraft calculator.
 * Stored in the database and delivered to the widget via the config API.
 */
export interface CalculatorConfig {
  /** Unique calculator identifier. */
  id: string;
  /** Display title of the calculator. */
  title: string;
  /** Ordered list of input field configurations. */
  fields: FieldConfig[];
}
