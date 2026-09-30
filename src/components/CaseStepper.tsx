// "1 Call — 2 Case — 3 Solve" progress tracker in the header.
// Decorative for now (not clickable). CURRENT_STEP is a guess until the design says
// which step each screen belongs to (CLAUDE.md section 9, PENDING).

const STEPS = ['Call', 'Case', 'Solve'];
const CURRENT_STEP = 3;

export default function CaseStepper() {
  return (
    <ol aria-label="Case progress" className="flex items-start">
      {STEPS.map((label, index) => {
        const stepNumber = index + 1;
        return (
          <li key={label} className="flex items-start">
            {/* The line joining this step to the previous one */}
            {index > 0 && (
              <span aria-hidden="true" className="mt-[1.0625rem] h-[3px] w-20 bg-stepper" />
            )}
            <span
              className="flex w-9 flex-col items-center"
              aria-current={stepNumber === CURRENT_STEP ? 'step' : undefined}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-night bg-stepper font-button text-lg leading-none font-bold text-night">
                {stepNumber}
              </span>
              <span className="mt-2 font-sans text-[0.8125rem] text-stepper">{label}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
