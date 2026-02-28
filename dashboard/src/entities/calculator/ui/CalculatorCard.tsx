import type { CalculatorSummary } from '../model/types';

interface CalculatorCardProps {
  calculator: CalculatorSummary;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function CalculatorCard({ calculator, onOpen, onDelete }: CalculatorCardProps) {
  const shortId = calculator.id.slice(0, 8);

  return (
    <article aria-label={calculator.name}>
      <h2>{calculator.name}</h2>
      <p>
        <small>{shortId}</small>
      </p>
      <p>Last modified: {calculator.updatedAt.toLocaleDateString()}</p>
      <button type="button" onClick={() => onOpen(calculator.id)}>
        Open
      </button>
      <button type="button" onClick={() => onDelete(calculator.id)}>
        Delete
      </button>
    </article>
  );
}
