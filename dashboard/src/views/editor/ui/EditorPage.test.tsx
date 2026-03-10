import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorPage } from './EditorPage';
import { StubApiClient } from '@/shared/api/testing';

function renderEditor(calculatorId = 'calc-1') {
  const client = new StubApiClient();
  // Pre-enqueue success responses so that if auto-save fires (after the 2s debounce)
  // the StubApiClient does not throw from an empty queue.
  for (let i = 0; i < 20; i++) {
    client.enqueueSuccess({});
  }
  render(<EditorPage calculatorId={calculatorId} client={client} />);
  return { client };
}

describe('EditorPage', () => {
  it('renders the Calculator Editor heading', () => {
    renderEditor();

    expect(screen.getByRole('heading', { name: 'Calculator Editor' })).toBeInTheDocument();
  });

  it('renders the field type palette', () => {
    renderEditor();

    expect(screen.getByRole('region', { name: 'Field types' })).toBeInTheDocument();
  });

  it('renders the save status indicator', () => {
    renderEditor();

    expect(screen.getByRole('status', { name: 'Save status' })).toBeInTheDocument();
  });

  it('renders a Save button for manual saves', () => {
    renderEditor();

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('adds a field to the list when a type is selected from the palette', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Text Input' }));

    // The new field appears in the draggable list as a list item
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(1);
    expect(listItems[0]).toHaveTextContent('Text Input');
  });

  it('adds two fields and shows both in the list', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Text Input' }));
    await user.click(screen.getByRole('button', { name: 'Number Input' }));

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('shows the FieldEditorWidget when a field in the list is clicked', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Dropdown' }));

    // The field is added and selected automatically — FieldEditorWidget should be visible
    expect(screen.getByLabelText('Label')).toBeInTheDocument();
  });

  it('does not show the FieldEditorWidget before a field is selected', () => {
    renderEditor();

    expect(screen.queryByLabelText('Label')).not.toBeInTheDocument();
  });

  it('clicking a field button in the list shows the FieldEditorWidget for that field', async () => {
    const user = userEvent.setup();
    renderEditor();

    // Add two fields
    await user.click(screen.getByRole('button', { name: 'Text Input' }));
    await user.click(screen.getByRole('button', { name: 'Number Input' }));

    // Both are added; the last one is selected. Click the first field button in the list.
    const listItems = screen.getAllByRole('listitem');
    const firstFieldButton = listItems[0].querySelector('button');
    expect(firstFieldButton).not.toBeNull();
    await user.click(firstFieldButton!);

    // The editor should be showing
    expect(screen.getByLabelText('Label')).toBeInTheDocument();
  });

  it('updating the label via FieldEditorWidget reflects the change in the list', async () => {
    const user = userEvent.setup();
    renderEditor();

    // Add a text field (label defaults to "Text Input")
    await user.click(screen.getByRole('button', { name: 'Text Input' }));

    // The field appears in the list with the default label
    const listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Text Input');

    // Update the label via the config panel
    const labelInput = screen.getByLabelText('Label');
    await user.clear(labelInput);
    await user.type(labelInput, 'My Custom Field');

    // The field button in the list should now show the updated label
    const updatedItems = screen.getAllByRole('listitem');
    expect(updatedItems[0]).toHaveTextContent('My Custom Field');
  });

  it('deleting a field removes it from the list and hides the editor', async () => {
    const user = userEvent.setup();
    renderEditor();

    // Add a field
    await user.click(screen.getByRole('button', { name: 'Slider' }));

    // The editor should be visible
    expect(screen.getByLabelText('Label')).toBeInTheDocument();

    // Click "Delete field" and then confirm
    await user.click(screen.getByRole('button', { name: 'Delete field' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    // The field list should be empty and the editor hidden
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.queryByLabelText('Label')).not.toBeInTheDocument();
  });

  it('renders the preview pane region', async () => {
    renderEditor();

    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Calculator Preview' })).toBeInTheDocument();
    });
  });

  it('renders both the editor content column and the preview pane column', async () => {
    renderEditor();

    // Left column: editor controls are present
    expect(screen.getByRole('region', { name: 'Field types' })).toBeInTheDocument();

    // Right column: preview pane is present
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Calculator Preview' })).toBeInTheDocument();
    });
  });

  it('renders the calculator preview form inside the preview pane shadow DOM', async () => {
    renderEditor();

    const host = screen.getByTestId('preview-shadow-host');

    await waitFor(() => {
      const form = host.shadowRoot?.querySelector('[aria-label="Calculator Preview Form"]');
      expect(form).not.toBeNull();
    });
  });

  it('adding a field to the editor shows the field label in the preview pane shadow DOM', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Number Input' }));

    const host = screen.getByTestId('preview-shadow-host');

    await waitFor(() => {
      const form = host.shadowRoot?.querySelector('[aria-label="Calculator Preview Form"]');
      expect(form).not.toBeNull();
      expect(form?.textContent).toContain('Number Input');
    });
  });

  it('label change immediately reflects in the preview pane shadow DOM', async () => {
    const user = userEvent.setup();
    renderEditor();

    // Add a Number Input field (auto-selected after add)
    await user.click(screen.getByRole('button', { name: 'Number Input' }));

    const host = screen.getByTestId('preview-shadow-host');

    // Verify the default label is visible in the shadow DOM
    await waitFor(() => {
      const form = host.shadowRoot?.querySelector('[aria-label="Calculator Preview Form"]');
      expect(form?.textContent).toContain('Number Input');
    });

    // Update the label via the FieldEditorWidget
    const labelInput = screen.getByLabelText('Label');
    await user.clear(labelInput);
    await user.type(labelInput, 'Widgets Count');

    // The new label should appear in the preview pane shadow DOM
    await waitFor(() => {
      const form = host.shadowRoot?.querySelector('[aria-label="Calculator Preview Form"]');
      expect(form?.textContent).toContain('Widgets Count');
      expect(form?.textContent).not.toContain('Number Input');
    });
  });

  it('deleting a field immediately removes it from the preview pane shadow DOM', async () => {
    const user = userEvent.setup();
    renderEditor();

    // Add a field
    await user.click(screen.getByRole('button', { name: 'Slider' }));

    const host = screen.getByTestId('preview-shadow-host');

    // Verify the field label is visible in the shadow DOM
    await waitFor(() => {
      const form = host.shadowRoot?.querySelector('[aria-label="Calculator Preview Form"]');
      expect(form?.textContent).toContain('Slider');
    });

    // Delete the field
    await user.click(screen.getByRole('button', { name: 'Delete field' }));
    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    // The preview pane should now show the empty-state message
    await waitFor(() => {
      const form = host.shadowRoot?.querySelector('[aria-label="Calculator Preview Form"]');
      expect(form?.textContent).toContain('Add fields to preview your calculator.');
    });
  });

  it('reordering via ArrowDown keyboard moves a field down in the list', async () => {
    const user = userEvent.setup();
    renderEditor();

    // Add two fields
    await user.click(screen.getByRole('button', { name: 'Text Input' }));
    await user.click(screen.getByRole('button', { name: 'Number Input' }));

    // Verify initial order: [Text Input, Number Input]
    let listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Text Input');
    expect(listItems[1]).toHaveTextContent('Number Input');

    // Focus the first list item and press ArrowDown
    await user.click(listItems[0]);
    fireEvent.keyDown(listItems[0], { key: 'ArrowDown' });

    // After reorder: [Number Input, Text Input]
    listItems = screen.getAllByRole('listitem');
    expect(listItems[0]).toHaveTextContent('Number Input');
    expect(listItems[1]).toHaveTextContent('Text Input');
  });

  it('renders the formula outputs section', () => {
    renderEditor();

    expect(screen.getByRole('region', { name: 'Formula outputs' })).toBeInTheDocument();
  });

  it('renders the Add output button', () => {
    renderEditor();

    expect(screen.getByRole('button', { name: 'Add output' })).toBeInTheDocument();
  });

  it('adds an output to the list when Add output is clicked', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add output' }));

    // The new output appears in the outputs list
    expect(screen.getByRole('button', { name: 'Output 1' })).toBeInTheDocument();
  });

  it('adds two outputs and shows both in the list', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add output' }));
    await user.click(screen.getByRole('button', { name: 'Add output' }));

    expect(screen.getByRole('button', { name: 'Output 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Output 2' })).toBeInTheDocument();
  });

  it('deletes an output when the delete button is clicked', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add output' }));
    expect(screen.getByRole('button', { name: 'Output 1' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete output Output 1' }));

    expect(screen.queryByRole('button', { name: 'Output 1' })).not.toBeInTheDocument();
  });

  it('shows the formula input when an output is selected', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add output' }));
    // The new output is auto-selected; formula input should be visible
    expect(screen.getByLabelText('Formula expression')).toBeInTheDocument();
  });

  it('does not show the formula input before an output is selected', () => {
    renderEditor();

    expect(screen.queryByLabelText('Formula expression')).not.toBeInTheDocument();
  });

  it('hides the formula input when the selected output is deleted', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add output' }));
    expect(screen.getByLabelText('Formula expression')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Delete output Output 1' }));

    expect(screen.queryByLabelText('Formula expression')).not.toBeInTheDocument();
  });

  it('typing in the formula input updates the expression for the selected output', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add output' }));

    const formulaInput = screen.getByLabelText('Formula expression');
    await user.type(formulaInput, '1 + 2');

    expect(formulaInput).toHaveValue('1 + 2');
  });

  it('shows an inline error when an invalid expression is typed', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add output' }));

    await user.type(screen.getByLabelText('Formula expression'), '1 +');

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByLabelText('Formula expression')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a live result preview in the formula input using field defaults', async () => {
    const user = userEvent.setup();
    renderEditor();

    // Add a Number Input field — it gets a default defaultValue of undefined so defaults to 0
    await user.click(screen.getByRole('button', { name: 'Number Input' }));

    // Add an output (auto-selected)
    await user.click(screen.getByRole('button', { name: 'Add output' }));

    // Type a constant expression so the preview is predictable regardless of field defaults
    const formulaInput = screen.getByLabelText('Formula expression');
    await user.type(formulaInput, '7 * 6');

    // The live preview should show the computed result
    const preview = document.querySelector('[data-testid="formula-preview"]');
    expect(preview).toBeInTheDocument();
    expect(preview?.textContent).toBe('Preview: 42');
  });

  it('shows no live preview when the formula expression is empty', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Add output' }));

    // Formula expression is empty by default — no preview should be shown
    expect(document.querySelector('[data-testid="formula-preview"]')).not.toBeInTheDocument();
  });

  it('adding an Image Select field shows it in the list', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Image Select' }));

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(1);
    expect(listItems[0]).toHaveTextContent('Image Select');
  });

  it('after adding Image Select and clicking it, shows the Add option button', async () => {
    const user = userEvent.setup();
    renderEditor();

    await user.click(screen.getByRole('button', { name: 'Image Select' }));

    // The field is auto-selected after add, so the image select config panel is visible
    expect(screen.getByRole('button', { name: 'Add option' })).toBeInTheDocument();
  });

  it('uploading an image calls client.uploadFile and updates the imageUrl on the option', async () => {
    const user = userEvent.setup();

    // Use a fresh client with the upload response queued first (before any auto-save responses)
    // so that the uploadFile call receives the expected URL rather than an auto-save placeholder.
    const client = new StubApiClient();
    client.enqueueSuccess({ url: 'https://cdn.example.com/uploaded.png' });
    // Pre-enqueue auto-save placeholders after the upload response
    for (let i = 0; i < 20; i++) {
      client.enqueueSuccess({});
    }
    render(<EditorPage calculatorId="calc-upload" client={client} />);

    await user.click(screen.getByRole('button', { name: 'Image Select' }));

    // Add an option so the upload control appears
    await user.click(screen.getByRole('button', { name: 'Add option' }));

    // Simulate selecting a file on the hidden file input via fireEvent (matches jsdom behavior)
    const file = new File(['img'], 'photo.png', { type: 'image/png' });
    const fileInputs = document.querySelectorAll('input[type="file"]');
    expect(fileInputs.length).toBe(1);
    fireEvent.change(fileInputs[0], { target: { files: [file] } });

    // The uploadFile call should have been made with the asset path
    await waitFor(() => {
      expect(client.calls.some((c) => c.method === 'UPLOAD' && c.path === '/v1/assets')).toBe(true);
    });

    // The image preview should now show the returned URL
    await waitFor(() => {
      expect(
        document.querySelector('img[src="https://cdn.example.com/uploaded.png"]'),
      ).not.toBeNull();
    });
  });
});
