interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const fillPercent = (currentStep / totalSteps) * 100;
  const labelText = `Step ${currentStep} of ${totalSteps}`;

  return (
    <div>
      <span>{labelText}</span>
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuetext={labelText}
      >
        <div style={{ width: `${fillPercent}%` }} />
      </div>
    </div>
  );
}
