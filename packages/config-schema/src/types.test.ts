import type { CalculatorConfig, FieldConfig, FieldType } from './types';

describe('CalculatorConfig types', () => {
  it('accepts a valid CalculatorConfig object', () => {
    const fieldType: FieldType = 'number';
    const field: FieldConfig = {
      id: 'qty',
      label: 'Quantity',
      type: fieldType,
      required: true,
    };
    const config: CalculatorConfig = {
      id: 'calc-001',
      title: 'Project Quote',
      fields: [field],
    };

    expect(config.id).toBe('calc-001');
    expect(config.fields).toHaveLength(1);
    expect(config.fields[0]?.type).toBe('number');
  });
});
