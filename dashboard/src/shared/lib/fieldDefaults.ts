import type {
  BaseFieldConfig,
  NumberFieldConfig,
  SliderFieldConfig,
  DropdownFieldConfig,
  RadioFieldConfig,
} from '@/shared/config';

/**
 * Returns the default numeric value for a field based on its type and config.
 * Text, checkbox, and image_select fields have no numeric representation and
 * default to 0. Number and slider fields use their configured defaultValue,
 * falling back to min (slider) or 0. Dropdown and radio fields use the parsed
 * numeric value of the first option, or 0 if no options are defined.
 */
export function getInitialValue(field: BaseFieldConfig): number {
  switch (field.type) {
    case 'number': {
      const numberField = field as NumberFieldConfig;
      return numberField.defaultValue ?? 0;
    }
    case 'slider': {
      const sliderField = field as SliderFieldConfig;
      return sliderField.defaultValue ?? sliderField.min ?? 0;
    }
    case 'text':
      return 0;
    case 'dropdown': {
      const dropdownField = field as DropdownFieldConfig;
      return parseFloat(dropdownField.options[0]?.value ?? '0') || 0;
    }
    case 'radio': {
      const radioField = field as RadioFieldConfig;
      return parseFloat(radioField.options[0]?.value ?? '0') || 0;
    }
    case 'checkbox':
      return 0;
    case 'image_select':
      return 0;
    default: {
      const _unreachable: never = field.type;
      return _unreachable;
    }
  }
}

/**
 * Builds a map of variableName → default numeric value for all fields in the
 * provided array. Used to seed formula evaluation contexts with sensible
 * starting values before any user interaction.
 */
export function buildFieldDefaults(fields: BaseFieldConfig[]): Record<string, number> {
  const defaults: Record<string, number> = {};
  for (const field of fields) {
    defaults[field.variableName] = getInitialValue(field);
  }
  return defaults;
}
