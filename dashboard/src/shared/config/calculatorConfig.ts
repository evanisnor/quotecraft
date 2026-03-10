import type { FieldType } from './fieldTypes';

export interface BaseFieldConfig {
  id: string;
  type: FieldType;
  label: string;
  helpText?: string;
  required: boolean;
  variableName: string;
}

export interface FieldOption {
  id: string;
  label: string;
  value: string;
}

export interface DropdownFieldConfig extends BaseFieldConfig {
  type: 'dropdown';
  options: FieldOption[];
}

export interface RadioFieldConfig extends BaseFieldConfig {
  type: 'radio';
  options: FieldOption[];
}

export interface CheckboxFieldConfig extends BaseFieldConfig {
  type: 'checkbox';
  options: FieldOption[];
}

export interface NumberFieldConfig extends BaseFieldConfig {
  type: 'number';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
  placeholder?: string;
}

export interface SliderFieldConfig extends BaseFieldConfig {
  type: 'slider';
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

export interface TextFieldConfig extends BaseFieldConfig {
  type: 'text';
  placeholder?: string;
}

export interface ImageSelectOption {
  id: string;
  label: string;
  value: string;
  imageUrl: string;
}

export interface ImageSelectFieldConfig extends BaseFieldConfig {
  type: 'image_select';
  options: ImageSelectOption[];
}

export interface ResultOutputConfig {
  id: string;
  label: string;
  expression: string;
}

export type LayoutMode = 'single-page' | 'multi-step';

export interface Step {
  id: string;
  title: string;
  fieldIds: string[];
}

/**
 * The full calculator configuration payload sent to and stored by the API.
 * Contains all editor state: input fields, formula output configurations,
 * layout mode, and step definitions.
 */
export interface CalculatorEditorConfig {
  fields: BaseFieldConfig[];
  outputs: ResultOutputConfig[];
  layoutMode: LayoutMode;
  steps: Step[];
}
