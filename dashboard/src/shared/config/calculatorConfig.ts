import type { FieldType } from './fieldTypes';

export interface BaseFieldConfig {
  id: string;
  type: FieldType;
  label: string;
  helpText?: string;
  required: boolean;
  variableName: string;
}
