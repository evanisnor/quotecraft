export type FieldType =
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'number'
  | 'slider'
  | 'text'
  | 'image_select';

export const FIELD_TYPES: ReadonlyArray<FieldType> = [
  'dropdown',
  'radio',
  'checkbox',
  'number',
  'slider',
  'text',
  'image_select',
] as const;

export const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  dropdown: 'Dropdown',
  radio: 'Radio Button',
  checkbox: 'Checkbox',
  number: 'Number Input',
  slider: 'Slider',
  text: 'Text Input',
  image_select: 'Image Select',
};
