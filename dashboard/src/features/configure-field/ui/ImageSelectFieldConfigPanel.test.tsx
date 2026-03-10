import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { ImageSelectFieldConfig } from '@/shared/config';
import { ImageSelectFieldConfigPanel } from './ImageSelectFieldConfigPanel';

function makeField(overrides: Partial<ImageSelectFieldConfig> = {}): ImageSelectFieldConfig {
  return {
    id: 'field-1',
    type: 'image_select',
    label: 'Package Type',
    helpText: 'Choose a package',
    required: false,
    variableName: 'package_type',
    options: [
      { id: 'opt-1', label: 'Small', value: '10', imageUrl: 'https://example.com/small.png' },
      { id: 'opt-2', label: 'Large', value: '20', imageUrl: '' },
    ],
    ...overrides,
  };
}

function ControlledImageSelectFieldConfigPanel({
  initialField,
  onUpdate = jest.fn(),
  onUploadImage = jest.fn().mockResolvedValue('https://example.com/uploaded.png'),
}: {
  initialField: ImageSelectFieldConfig;
  onUpdate?: jest.Mock;
  onUploadImage?: jest.Mock;
}) {
  const [field, setField] = useState(initialField);
  function handleUpdate(updated: ImageSelectFieldConfig) {
    setField(updated);
    onUpdate(updated);
  }
  return (
    <ImageSelectFieldConfigPanel
      field={field}
      onUpdate={handleUpdate}
      onUploadImage={onUploadImage}
    />
  );
}

describe('ImageSelectFieldConfigPanel', () => {
  it('renders the base config panel inputs', () => {
    render(
      <ImageSelectFieldConfigPanel
        field={makeField()}
        onUpdate={jest.fn()}
        onUploadImage={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Label', { selector: '#field-label' })).toHaveValue(
      'Package Type',
    );
    expect(screen.getByLabelText('Help text')).toHaveValue('Choose a package');
    expect(screen.getByLabelText('Required')).not.toBeChecked();
    expect(screen.getByLabelText('Variable name')).toHaveValue('package_type');
  });

  it('renders existing options with label, value, and image preview', () => {
    render(
      <ImageSelectFieldConfigPanel
        field={makeField()}
        onUpdate={jest.fn()}
        onUploadImage={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('Label', { selector: '#image-option-label-0' })).toHaveValue(
      'Small',
    );
    expect(screen.getByLabelText('Value', { selector: '#image-option-value-0' })).toHaveValue('10');
    expect(screen.getByLabelText('Label', { selector: '#image-option-label-1' })).toHaveValue(
      'Large',
    );
    expect(screen.getByLabelText('Value', { selector: '#image-option-value-1' })).toHaveValue('20');
  });

  it('renders image preview when imageUrl is non-empty', () => {
    render(
      <ImageSelectFieldConfigPanel
        field={makeField()}
        onUpdate={jest.fn()}
        onUploadImage={jest.fn()}
      />,
    );

    const img = screen.getByAltText('Small');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', 'https://example.com/small.png');
  });

  it('does not render img element when imageUrl is empty string', () => {
    render(
      <ImageSelectFieldConfigPanel
        field={makeField()}
        onUpdate={jest.fn()}
        onUploadImage={jest.fn()}
      />,
    );

    expect(screen.queryByAltText('Large')).not.toBeInTheDocument();
  });

  it('updating option label calls onUpdate with updated options', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledImageSelectFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />,
    );

    const labelInput = screen.getByLabelText('Label', { selector: '#image-option-label-0' });
    await user.clear(labelInput);
    await user.type(labelInput, 'Mini');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([expect.objectContaining({ id: 'opt-1', label: 'Mini' })]),
      }),
    );
  });

  it('updating option value calls onUpdate with updated options', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledImageSelectFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />,
    );

    const valueInput = screen.getByLabelText('Value', { selector: '#image-option-value-0' });
    await user.clear(valueInput);
    await user.type(valueInput, '5');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        options: expect.arrayContaining([expect.objectContaining({ id: 'opt-1', value: '5' })]),
      }),
    );
  });

  it('clicking Remove on an option calls onUpdate with that option removed', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledImageSelectFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />,
    );

    const removeButtons = screen.getAllByRole('button', { name: 'Remove' });
    await user.click(removeButtons[0]);

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [updated] = onUpdate.mock.calls[0] as [ImageSelectFieldConfig];
    expect(updated.options).toHaveLength(1);
    expect(updated.options[0].id).toBe('opt-2');
  });

  it('clicking Add option calls onUpdate with a new blank option appended', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledImageSelectFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />,
    );

    await user.click(screen.getByRole('button', { name: 'Add option' }));

    expect(onUpdate).toHaveBeenCalledTimes(1);
    const [updated] = onUpdate.mock.calls[0] as [ImageSelectFieldConfig];
    expect(updated.options).toHaveLength(3);
    expect(updated.options[2].label).toBe('');
    expect(updated.options[2].value).toBe('');
    expect(updated.options[2].imageUrl).toBe('');
    expect(updated.options[2].id).toBeTruthy();
  });

  it('Upload image button is present and the hidden file input has accept="image/*"', () => {
    render(
      <ImageSelectFieldConfigPanel
        field={makeField()}
        onUpdate={jest.fn()}
        onUploadImage={jest.fn()}
      />,
    );

    expect(screen.getAllByRole('button', { name: 'Upload image' })).toHaveLength(2);
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBe(2);
    expect(fileInputs[0]).toHaveAttribute('accept', 'image/*');
  });

  it('when a file is selected, calls onUploadImage with the file and on success updates imageUrl', async () => {
    const onUpdate = jest.fn();
    const onUploadImage = jest.fn().mockResolvedValue('https://cdn.example.com/new-image.png');

    render(
      <ControlledImageSelectFieldConfigPanel
        initialField={makeField()}
        onUpdate={onUpdate}
        onUploadImage={onUploadImage}
      />,
    );

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const file = new File(['image-content'], 'photo.png', { type: 'image/png' });

    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(onUploadImage).toHaveBeenCalledWith(file);
    });

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.arrayContaining([
            expect.objectContaining({
              id: 'opt-1',
              imageUrl: 'https://cdn.example.com/new-image.png',
            }),
          ]),
        }),
      );
    });
  });

  it('when upload fails, shows an error message', async () => {
    const onUploadImage = jest.fn().mockRejectedValue(new Error('Server error'));

    render(
      <ImageSelectFieldConfigPanel
        field={makeField()}
        onUpdate={jest.fn()}
        onUploadImage={onUploadImage}
      />,
    );

    const fileInputs = document.querySelectorAll('input[type="file"]');
    const file = new File(['image-content'], 'photo.png', { type: 'image/png' });

    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveTextContent('Server error');
    });
  });

  it('updating base field calls onUpdate preserving existing options', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(
      <ControlledImageSelectFieldConfigPanel initialField={makeField()} onUpdate={onUpdate} />,
    );

    await user.clear(screen.getByLabelText('Label', { selector: '#field-label' }));
    await user.type(screen.getByLabelText('Label', { selector: '#field-label' }), 'Image Choice');

    expect(onUpdate).toHaveBeenLastCalledWith(
      expect.objectContaining({
        label: 'Image Choice',
        type: 'image_select',
        options: [
          { id: 'opt-1', label: 'Small', value: '10', imageUrl: 'https://example.com/small.png' },
          { id: 'opt-2', label: 'Large', value: '20', imageUrl: '' },
        ],
      }),
    );
  });
});
