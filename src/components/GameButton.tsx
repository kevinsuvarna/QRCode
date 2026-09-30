import type { ReactNode } from 'react';
import { Link, type To } from 'react-router-dom';
import type { IconPath } from '../data/icons';
import AppIcon from './AppIcon';

type GameButtonProps = {
  to: To;
  variant: 'primary' | 'secondary' | 'danger';
  iconLeft?: IconPath;
  iconRight?: IconPath;
  children: ReactNode;
};

// The 6px darker "bottom edge" is drawn with a box-shadow rather than a border, so
// pressing the button (edge shrinks to 2px, button moves down 4px) doesn't change its
// size and nudge the buttons next to it.
const VARIANT_STYLES: Record<GameButtonProps['variant'], string> = {
  primary:
    'bg-mint text-ink shadow-[0_6px_0_var(--color-mint-deep)] active:shadow-[0_2px_0_var(--color-mint-deep)]',
  secondary:
    'border-2 border-snow/70 bg-panel text-snow shadow-[0_6px_0_var(--color-panel-edge)] active:shadow-[0_2px_0_var(--color-panel-edge)]',
  danger:
    'bg-coral text-ink shadow-[0_6px_0_var(--color-coral-deep)] active:shadow-[0_2px_0_var(--color-coral-deep)]',
};

// Chunky arcade-style button. It navigates, so it renders a <Link>.
export default function GameButton({
  to,
  variant,
  iconLeft,
  iconRight,
  children,
}: GameButtonProps) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 py-3 font-display text-xl font-semibold transition-[translate,box-shadow] duration-75 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-gold active:translate-y-1 ${VARIANT_STYLES[variant]}`}
    >
      {iconLeft && <AppIcon path={iconLeft} className="h-6 w-6" />}
      {children}
      {iconRight && <AppIcon path={iconRight} className="h-6 w-6" />}
    </Link>
  );
}
