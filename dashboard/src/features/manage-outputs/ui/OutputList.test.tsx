import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OutputList } from './OutputList';
import type { ResultOutputConfig } from '@/shared/config';

function makeOutput(id: string, label: string): ResultOutputConfig {
  return { id, label, expression: '' };
}

const EMPTY: ResultOutputConfig[] = [];

const TWO_OUTPUTS: ResultOutputConfig[] = [
  makeOutput('out-1', 'Subtotal'),
  makeOutput('out-2', 'Total'),
];

describe('OutputList', () => {
  it('renders the section with accessible label', () => {
    render(
      <OutputList
        outputs={EMPTY}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    expect(screen.getByRole('region', { name: 'Formula outputs' })).toBeInTheDocument();
  });

  it('renders the Add output button', () => {
    render(
      <OutputList
        outputs={EMPTY}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Add output' })).toBeInTheDocument();
  });

  it('renders nothing in the list when outputs is empty', () => {
    render(
      <OutputList
        outputs={EMPTY}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('renders each output as a list item with its label', () => {
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Subtotal');
    expect(items[1]).toHaveTextContent('Total');
  });

  it('calls onAdd when the Add output button is clicked', async () => {
    const user = userEvent.setup();
    const onAdd = jest.fn();
    render(
      <OutputList
        outputs={EMPTY}
        selectedOutputId={null}
        onAdd={onAdd}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Add output' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onSelect with the output id when the output button is clicked', async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={onSelect}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Subtotal' }));

    expect(onSelect).toHaveBeenCalledWith('out-1');
  });

  it('calls onDelete with the output id when the delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={onDelete}
        onReorder={() => {}}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Delete output Subtotal' }));

    expect(onDelete).toHaveBeenCalledWith('out-1');
  });

  it('marks the selected output with data-selected attribute', () => {
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId="out-2"
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    const items = screen.getAllByRole('listitem');
    expect(items[0]).not.toHaveAttribute('data-selected');
    expect(items[1]).toHaveAttribute('data-selected', 'true');
  });

  it('calls onReorder with the updated list when ArrowDown is pressed on an item', () => {
    const onReorder = jest.fn();
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={onReorder}
      />,
    );

    const items = screen.getAllByRole('listitem');
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });

    expect(onReorder).toHaveBeenCalledWith([TWO_OUTPUTS[1], TWO_OUTPUTS[0]]);
  });

  it('calls onReorder with the updated list when ArrowUp is pressed on an item', () => {
    const onReorder = jest.fn();
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={onReorder}
      />,
    );

    const items = screen.getAllByRole('listitem');
    fireEvent.keyDown(items[1], { key: 'ArrowUp' });

    expect(onReorder).toHaveBeenCalledWith([TWO_OUTPUTS[1], TWO_OUTPUTS[0]]);
  });

  it('does not call onReorder when ArrowUp is pressed on the first item', () => {
    const onReorder = jest.fn();
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={onReorder}
      />,
    );

    const items = screen.getAllByRole('listitem');
    fireEvent.keyDown(items[0], { key: 'ArrowUp' });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('does not call onReorder when ArrowDown is pressed on the last item', () => {
    const onReorder = jest.fn();
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={onReorder}
      />,
    );

    const items = screen.getAllByRole('listitem');
    fireEvent.keyDown(items[1], { key: 'ArrowDown' });

    expect(onReorder).not.toHaveBeenCalled();
  });

  it('renders a delete button for each output', () => {
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Delete output Subtotal' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete output Total' })).toBeInTheDocument();
  });

  it('calls onReorder with the updated list when dragging an item over another', () => {
    const onReorder = jest.fn();
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={onReorder}
      />,
    );

    const items = screen.getAllByRole('listitem');
    fireEvent.dragStart(items[0]);
    fireEvent.dragOver(items[1]);

    expect(onReorder).toHaveBeenCalledWith([TWO_OUTPUTS[1], TWO_OUTPUTS[0]]);
  });

  it('clears the dragging state after drag ends', () => {
    render(
      <OutputList
        outputs={TWO_OUTPUTS}
        selectedOutputId={null}
        onAdd={() => {}}
        onSelect={() => {}}
        onDelete={() => {}}
        onReorder={() => {}}
      />,
    );

    const items = screen.getAllByRole('listitem');
    fireEvent.dragStart(items[0]);
    expect(items[0]).toHaveAttribute('data-dragging', 'true');

    fireEvent.dragEnd(items[0]);
    expect(items[0]).not.toHaveAttribute('data-dragging');
  });
});
