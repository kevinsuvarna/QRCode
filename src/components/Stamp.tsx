import AppIcon from './AppIcon';

type StampProps = {
  isCorrect: boolean;
  className?: string; // position, set by the page
};

// Tilted rubber-stamp badge: "✓ ACCOUNT IDENTIFIED" (green) or "✕ NOT QUITE" (red).
// It's a label, not a button.
export default function Stamp({ isCorrect, className = '' }: StampProps) {
  return (
    <p
      className={`animate-stamp-in relative inline-flex h-[6.5rem] items-center justify-center gap-3 px-6 font-stamp whitespace-nowrap ${isCorrect ? 'min-w-[23rem]' : 'min-w-[18rem]'} text-[1.625rem] leading-none font-bold text-cream uppercase -rotate-[9deg] ${className}`}
    >
      {/* Surface + stitched border are separate layers so the rough-edge filter
          doesn't blur the text. */}
      <span
        aria-hidden="true"
        className={`${isCorrect ? 'stamp-surface-green' : 'stamp-surface-red'} rough-edge absolute inset-0 rounded-[0.875rem] shadow-[0_0.25rem_0.75rem_rgb(0_0_0/0.35)]`}
      />
      <span
        aria-hidden="true"
        className="absolute inset-2.5 rounded-lg border-2 border-dashed border-cream/80"
      />
      <AppIcon
        path={isCorrect ? '/icons/check.svg' : '/icons/cross.svg'}
        className="relative h-8 w-8 shrink-0"
      />
      <span className="relative">{isCorrect ? 'Account identified' : 'Not quite'}</span>
    </p>
  );
}
