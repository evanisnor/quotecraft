import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import type { BaseFieldConfig } from '@/shared/config';
import { DraggableFieldList } from './DraggableFieldList';

function makeField(id: string, label: string): BaseFieldConfig {
  return {
    id,
    type: 'text',
    label,
    required: false,
    variableName: id,
  };
}

const FIELD_A = makeField('field-a', 'Field A');
const FIELD_B = makeField('field-b', 'Field B');
const FIELD_C = makeField('field-c', 'Field C');

/**
 * Stateful wrapper so that onReorder feeds back into the component,
 * allowing multi-step drag sequences to work correctly.
 */
function ControlledDraggableFieldList({
  initialFields,
  onReorder = jest.fn(),
}: {
  initialFields: BaseFieldConfig[];
  onReorder?: jest.Mock;
}) {
  const [fields, setFields] = useState(initialFields);
  function handleReorder(reordered: BaseFieldConfig[]) {
    setFields(reordered);
    onReorder(reordered);
  }
  return (
    <DraggableFieldList
      fields={fields}
      onReorder={handleReorder}
      renderField={(field) => <span>{field.label}</span>}
    />
  );
}

describe('DraggableFieldList', () => {
  describe('rendering', () => {
    it('renders all fields using the renderField callback', () => {
      render(
        <DraggableFieldList
          fields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={jest.fn()}
          renderField={(field) => <span>{field.label}</span>}
        />,
      );

      expect(screen.getByText('Field A')).toBeInTheDocument();
      expect(screen.getByText('Field B')).toBeInTheDocument();
      expect(screen.getByText('Field C')).toBeInTheDocument();
    });

    it('renders each field item with the draggable attribute', () => {
      render(
        <DraggableFieldList
          fields={[FIELD_A, FIELD_B]}
          onReorder={jest.fn()}
          renderField={(field) => <span>{field.label}</span>}
        />,
      );

      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(2);
      items.forEach((item) => {
        expect(item).toHaveAttribute('draggable', 'true');
      });
    });

    it('renders an empty list without errors when no fields are provided', () => {
      render(
        <DraggableFieldList
          fields={[]}
          onReorder={jest.fn()}
          renderField={(field) => <span>{field.label}</span>}
        />,
      );

      expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    });
  });

  describe('drag-and-drop reordering', () => {
    it('calls onReorder with [B, C, A] when dragging index 0 to index 2', () => {
      const onReorder = jest.fn();
      render(
        <ControlledDraggableFieldList
          initialFields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
        />,
      );

      const items = screen.getAllByRole('listitem');
      fireEvent.dragStart(items[0]);
      fireEvent.dragOver(items[2]);

      expect(onReorder).toHaveBeenCalledWith([FIELD_B, FIELD_C, FIELD_A]);
    });

    it('calls onReorder with [C, A, B] when dragging index 2 to index 0', () => {
      const onReorder = jest.fn();
      render(
        <ControlledDraggableFieldList
          initialFields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
        />,
      );

      const items = screen.getAllByRole('listitem');
      fireEvent.dragStart(items[2]);
      fireEvent.dragOver(items[0]);

      expect(onReorder).toHaveBeenCalledWith([FIELD_C, FIELD_A, FIELD_B]);
    });

    it('correctly reorders across multiple dragover events (multi-step drag)', () => {
      const onReorder = jest.fn();
      render(
        <ControlledDraggableFieldList
          initialFields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
        />,
      );

      const items = screen.getAllByRole('listitem');
      fireEvent.dragStart(items[0]); // start dragging FIELD_A (index 0)
      fireEvent.dragOver(items[1]); // dragover FIELD_B → reorder to [B, A, C], dragging now at index 1
      fireEvent.dragOver(items[2]); // dragover FIELD_C → reorder to [B, C, A], dragging now at index 2

      expect(onReorder).toHaveBeenLastCalledWith([FIELD_B, FIELD_C, FIELD_A]);
    });

    it('does not call onReorder when drop fires (reorder already committed on dragover)', () => {
      const onReorder = jest.fn();
      render(
        <ControlledDraggableFieldList
          initialFields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
        />,
      );

      const items = screen.getAllByRole('listitem');
      fireEvent.dragStart(items[0]);
      fireEvent.dragOver(items[1]);
      onReorder.mockClear();
      fireEvent.drop(items[1]);

      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  describe('dragend clears dragging state', () => {
    it('clears the data-dragging attribute after dragend', () => {
      render(
        <DraggableFieldList
          fields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={jest.fn()}
          renderField={(field) => <span>{field.label}</span>}
        />,
      );

      const items = screen.getAllByRole('listitem');
      fireEvent.dragStart(items[0]);

      // During drag, index 0 should be marked as dragging
      expect(items[0]).toHaveAttribute('data-dragging', 'true');

      fireEvent.dragEnd(items[0]);

      // After dragend, no item should have the dragging attribute
      screen.getAllByRole('listitem').forEach((item) => {
        expect(item).not.toHaveAttribute('data-dragging');
      });
    });

    it('data-dragging attribute follows the dragged item by ID across reorders', () => {
      render(<ControlledDraggableFieldList initialFields={[FIELD_A, FIELD_B, FIELD_C]} />);

      const items = screen.getAllByRole('listitem');
      fireEvent.dragStart(items[0]); // drag Field A
      fireEvent.dragOver(items[1]); // reorder: [B, A, C], Field A moves to index 1

      // After reorder, the item displaying "Field A" should still have data-dragging
      const fieldAItem = screen.getByText('Field A').closest('li');
      expect(fieldAItem).toHaveAttribute('data-dragging', 'true');

      // The item at list position 0 (Field B) should NOT have data-dragging
      const listItems = screen.getAllByRole('listitem');
      expect(listItems[0]).not.toHaveAttribute('data-dragging');
    });
  });

  describe('no-op for same position', () => {
    it('does not call onReorder when dragover fires without a prior dragstart', () => {
      const onReorder = jest.fn();
      render(
        <DraggableFieldList
          fields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
          renderField={(field) => <span>{field.label}</span>}
        />,
      );

      const items = screen.getAllByRole('listitem');
      fireEvent.dragOver(items[1]);

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('does not call onReorder when dragover target is the same as the dragged item', () => {
      const onReorder = jest.fn();
      render(
        <DraggableFieldList
          fields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
          renderField={(field) => <span>{field.label}</span>}
        />,
      );

      const items = screen.getAllByRole('listitem');
      fireEvent.dragStart(items[1]);
      fireEvent.dragOver(items[1]);

      expect(onReorder).not.toHaveBeenCalled();
    });
  });

  describe('keyboard reordering', () => {
    it('moves an item up when ArrowUp is pressed and index > 0', async () => {
      const user = userEvent.setup();
      const onReorder = jest.fn();
      render(
        <ControlledDraggableFieldList
          initialFields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
        />,
      );

      const items = screen.getAllByRole('listitem');
      await user.click(items[1]); // focus Field B (index 1)
      await user.keyboard('{ArrowUp}');

      expect(onReorder).toHaveBeenCalledWith([FIELD_B, FIELD_A, FIELD_C]);
    });

    it('moves an item down when ArrowDown is pressed and index < length - 1', async () => {
      const user = userEvent.setup();
      const onReorder = jest.fn();
      render(
        <ControlledDraggableFieldList
          initialFields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
        />,
      );

      const items = screen.getAllByRole('listitem');
      await user.click(items[1]); // focus Field B (index 1)
      await user.keyboard('{ArrowDown}');

      expect(onReorder).toHaveBeenCalledWith([FIELD_A, FIELD_C, FIELD_B]);
    });

    it('does not call onReorder when ArrowUp is pressed on the first item', async () => {
      const user = userEvent.setup();
      const onReorder = jest.fn();
      render(
        <ControlledDraggableFieldList
          initialFields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
        />,
      );

      const items = screen.getAllByRole('listitem');
      await user.click(items[0]); // focus Field A (index 0)
      await user.keyboard('{ArrowUp}');

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('does not call onReorder when ArrowDown is pressed on the last item', async () => {
      const user = userEvent.setup();
      const onReorder = jest.fn();
      render(
        <ControlledDraggableFieldList
          initialFields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
        />,
      );

      const items = screen.getAllByRole('listitem');
      await user.click(items[2]); // focus Field C (index 2)
      await user.keyboard('{ArrowDown}');

      expect(onReorder).not.toHaveBeenCalled();
    });

    it('does not call onReorder for unrelated key presses', async () => {
      const user = userEvent.setup();
      const onReorder = jest.fn();
      render(
        <ControlledDraggableFieldList
          initialFields={[FIELD_A, FIELD_B, FIELD_C]}
          onReorder={onReorder}
        />,
      );

      const items = screen.getAllByRole('listitem');
      await user.click(items[1]);
      await user.keyboard('{Enter}');

      expect(onReorder).not.toHaveBeenCalled();
    });
  });
});
