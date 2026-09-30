import type { ReactNode } from 'react';
import AppIcon from './AppIcon';

type GameShellProps = {
  children: ReactNode;
};

// Shared page frame: night-sky background, "CASE FILE #01" header, centered <main>.
export default function GameShell({ children }: GameShellProps) {
  return (
    <div className="game-bg flex min-h-dvh flex-col">
      <header className="flex items-center gap-3 px-4 pt-4 sm:px-8 sm:pt-6">
        <AppIcon path="/icons/case-file.svg" className="h-8 w-8 text-gold" />
        <p className="font-display text-lg font-semibold tracking-[0.2em] uppercase">
          Case File #01
        </p>
      </header>
      <main className="flex flex-1 flex-col items-center px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
