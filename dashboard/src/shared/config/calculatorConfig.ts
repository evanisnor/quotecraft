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
