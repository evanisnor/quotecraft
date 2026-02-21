import type { FieldConfig } from '@quotecraft/config-schema';

/**
 * Props passed to a field renderer when rendering a single calculator field.
 */
export interface FieldRenderProps {
  /** The field configuration describing how this field should appear. */
  field: FieldConfig;
  /** The current value of the field. */
  value: string | number | boolean;
  /** Callback invoked when the field value changes. */
  onChange: (value: string | number | boolean) => void;
}

/**
 * A field renderer is a function that takes render props and produces output.
 * The concrete output type (DOM node, HTML string, etc.) is determined by
 * the runtime environment — widget uses DOM nodes, dashboard uses React elements.
 *
 * Full implementations are delivered in BLDR-US2 (dashboard) and WDGT-US1 (widget).
 */
export type FieldRenderer<TOutput> = (props: FieldRenderProps) => TOutput;
