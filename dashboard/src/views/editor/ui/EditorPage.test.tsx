import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorPage } from './EditorPage';

describe('EditorPage', () => {
  it('renders the Calculator Editor heading', () => {
    render(<EditorPage calculatorId="calc-1" />);

    expect(screen.getByRole('heading', { name: 'Calculator Editor' })).toBeInTheDocument();
  });

  it('renders the field type palette', () => {
    render(<EditorPage calculatorId="calc-1" />);

    expect(screen.getByRole('region', { name: 'Field types' })).toBeInTheDocument();
  });

  it('adds a field to the list when a type is selected from the palette', async () => {
    const user = userEvent.setup();
    render(<EditorPage calculatorId="calc-1" />);

    await user.click(screen.getByRole('button', { name: 'Text Input' }));

    // The new field appears in the draggable list as a list item
    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(1);
    expect(listItems[0]).toHaveTextContent('Text Input');
  });

  it('adds two fields and shows both in the list', async () => {
    const user = userEvent.setup();
    render(<EditorPage calculatorId="calc-1" />);

    await user.click(screen.getByRole('button', { name: 'Text Input' }));
    await user.click(screen.getByRole('button', { name: 'Number Input' }));

    const listItems = screen.getAllByRole('listitem');
    expect(listItems).toHaveLength(2);
  });

  it('shows the FieldEditorWidget when a field in the list is clicked', async () => {
    const user = userEvent.setup();
    render(<EditorPage calculatorId="calc-1" />);

    await user.click(screen.getByRole('button', { name: 'Dropdown' }));

    // The field is added and selected automatically — FieldEditorWidget should be visible
    expect(screen.getByLabelText('Label')).toBeInTheDocument();
  });

  it('does not show the FieldEditorWidget before a field is selected', () => {
    render(<EditorPage calculatorId="calc-1" />);

    expect(screen.queryByLabelText('Label')).not.toBeInTheDocument();
  });

  it('clicking a field button in the list shows the FieldEditorWidget for that field', async () => {
    const user = userEvent.setup();
    render(<EditorPage calculatorId="calc-1" />);

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
    render(<EditorPage calculatorId="calc-1" />);

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
    render(<EditorPage calculatorId="calc-1" />);

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

  it('reordering via ArrowDown keyboard moves a field down in the list', async () => {
    const user = userEvent.setup();
    render(<EditorPage calculatorId="calc-1" />);

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
});
