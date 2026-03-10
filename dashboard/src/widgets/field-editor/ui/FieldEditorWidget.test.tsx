import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { BaseFieldConfig, DropdownFieldConfig, ImageSelectFieldConfig } from '@/shared/config';
import { FieldEditorWidget } from './FieldEditorWidget';

function makeTextField(overrides: Partial<BaseFieldConfig> = {}): BaseFieldConfig {
  return {
    id: 'field-1',
    type: 'text',
    label: 'Project Name',
    helpText: 'Enter your project name',
    required: false,
    variableName: 'project_name',
    ...overrides,
  };
}

function makeDropdownField(overrides: Partial<DropdownFieldConfig> = {}): DropdownFieldConfig {
  return {
    id: 'field-1',
    type: 'dropdown',
    label: 'Package Size',
    required: false,
    variableName: 'package_size',
    options: [],
    ...overrides,
  };
}

function makeImageSelectField(
  overrides: Partial<ImageSelectFieldConfig> = {},
): ImageSelectFieldConfig {
  return {
    id: 'field-1',
    type: 'image_select',
    label: 'Image Choice',
    required: false,
    variableName: 'image_choice',
    options: [],
    ...overrides,
  };
}

function ControlledFieldEditorWidget({
  initialField,
  onUpdate = jest.fn(),
  onDelete = jest.fn(),
  onUploadImage,
}: {
  initialField: BaseFieldConfig;
  onUpdate?: jest.Mock;
  onDelete?: jest.Mock;
  onUploadImage?: (file: File) => Promise<string>;
}) {
  const [field, setField] = useState(initialField);
  function handleUpdate(updated: BaseFieldConfig) {
    setField(updated);
    onUpdate(updated);
  }
  return (
    <FieldEditorWidget
      field={field}
      onUpdate={handleUpdate}
      onDelete={onDelete}
      onUploadImage={onUploadImage}
    />
  );
}

describe('FieldEditorWidget', () => {
  it('renders the field config panel inputs', () => {
    render(<FieldEditorWidget field={makeTextField()} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByLabelText('Label')).toHaveValue('Project Name');
    expect(screen.getByLabelText('Help text')).toHaveValue('Enter your project name');
    expect(screen.getByLabelText('Required')).not.toBeChecked();
    expect(screen.getByLabelText('Variable name')).toHaveValue('project_name');
  });

  it('renders the Delete field button', () => {
    render(<FieldEditorWidget field={makeTextField()} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    expect(screen.getByRole('button', { name: 'Delete field' })).toBeInTheDocument();
  });

  it('calls onUpdate when a field config input changes', async () => {
    const onUpdate = jest.fn();
    const user = userEvent.setup();

    render(<ControlledFieldEditorWidget initialField={makeTextField()} onUpdate={onUpdate} />);

    await user.clear(screen.getByLabelText('Label'));
    await user.type(screen.getByLabelText('Label'), 'Budget');

    expect(onUpdate).toHaveBeenLastCalledWith(expect.objectContaining({ label: 'Budget' }));
  });

  it('shows confirmation dialog when Delete field is clicked', async () => {
    const user = userEvent.setup();

    render(<FieldEditorWidget field={makeTextField()} onUpdate={jest.fn()} onDelete={jest.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Delete field' }));

    expect(screen.getByRole('dialog', { name: 'Confirm field deletion' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('calls onDelete only after confirming, not on initial Delete field click', async () => {
    const onDelete = jest.fn();
    const user = userEvent.setup();

    render(<FieldEditorWidget field={makeTextField()} onUpdate={jest.fn()} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Delete field' }));

    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  describe('dropdown type', () => {
    it('renders the option list editor with Add option button', () => {
      render(
        <FieldEditorWidget field={makeDropdownField()} onUpdate={jest.fn()} onDelete={jest.fn()} />,
      );

      expect(screen.getByRole('button', { name: 'Add option' })).toBeInTheDocument();
    });
  });

  describe('image_select type', () => {
    it('renders Add option button and Upload image button when an option exists', () => {
      const fieldWithOption = makeImageSelectField({
        options: [{ id: 'opt-1', label: 'Option A', value: '5', imageUrl: '' }],
      });

      render(
        <FieldEditorWidget
          field={fieldWithOption}
          onUpdate={jest.fn()}
          onDelete={jest.fn()}
          onUploadImage={jest.fn().mockResolvedValue('https://example.com/img.png')}
        />,
      );

      expect(screen.getByRole('button', { name: 'Add option' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Upload image' })).toBeInTheDocument();
    });

    it('calls onUploadImage when a file is selected via the upload control', async () => {
      const onUpdate = jest.fn();
      const onUploadImage = jest
        .fn()
        .mockResolvedValue('https://cdn.example.com/uploaded-image.png');

      const fieldWithOption = makeImageSelectField({
        options: [{ id: 'opt-1', label: 'Option A', value: '5', imageUrl: '' }],
      });

      render(
        <ControlledFieldEditorWidget
          initialField={fieldWithOption}
          onUpdate={onUpdate}
          onUploadImage={onUploadImage}
        />,
      );

      const fileInputs = document.querySelectorAll('input[type="file"]');
      const file = new File(['image-data'], 'photo.jpg', { type: 'image/jpeg' });

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
                imageUrl: 'https://cdn.example.com/uploaded-image.png',
              }),
            ]),
          }),
        );
      });
    });
  });
});
