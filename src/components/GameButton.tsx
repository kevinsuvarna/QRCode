import type { ReactNode } from 'react';
import { Link, type To } from 'react-router-dom';
import AppIcon from './AppIcon';

type GameButtonProps = {
  // Where the button goes. Leave it out for a display-only button (see SCAN on the
  // Choose screen, whose behavior isn't decided yet).
  to?: To;
  arrow?: 'left' | 'right';
  className?: string; // position, set by the page
  children: ReactNode;
};

// The glowing aqua "SCAN / NEXT / TRY AGAIN" button from the mockups.
export default function GameButton({ to, arrow, className = '', children }: GameButtonProps) {
  const content = (
    <>
      {/* Button surface, kept separate so the rough-edge filter doesn't blur the text. */}
      <span
        aria-hidden="true"
        className="paper-button rough-edge absolute inset-0 rounded-[1.75rem] border-[3px] border-folder-edge"
      />
      <span className="relative inline-flex items-center gap-3">
        {arrow === 'left' && <AppIcon path="/icons/arrow-left.svg" className="h-10 w-10" />}
        {children}
        {arrow === 'right' && <AppIcon path="/icons/arrow-right.svg" className="h-10 w-10" />}
      </span>
    </>
  );
  const buttonClass = `relative inline-flex h-[5rem] min-w-[16rem] items-center justify-center px-6 font-button text-[2.25rem] font-bold uppercase text-type-ink -rotate-[1.5deg] ${className}`;

  if (!to) {
    return (
      <div aria-hidden="true" className={buttonClass}>
        {content}
      </div>
    );
  }

  return (
    <Link
      to={to}
      className={`${buttonClass} transition-[translate] duration-75 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-aqua active:translate-y-0.5`}
    >
      {content}
    </Link>
  );
}
