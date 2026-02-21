import type { FieldRenderProps, FieldRenderer } from './types';

describe('FieldRenderer types', () => {
  it('accepts a valid FieldRenderProps object', () => {
    const props: FieldRenderProps = {
      field: {
        id: 'qty',
        label: 'Quantity',
        type: 'number',
        required: true,
      },
      value: 5,
      onChange: (_value) => {},
    };

    expect(props.field.id).toBe('qty');
    expect(props.value).toBe(5);
  });

  it('accepts a FieldRenderer function returning a string', () => {
    const renderer: FieldRenderer<string> = (props) => `<input id="${props.field.id}" />`;

    const result = renderer({
      field: { id: 'qty', label: 'Quantity', type: 'number', required: true },
      value: 0,
      onChange: () => {},
    });

    expect(result).toBe('<input id="qty" />');
  });
});
