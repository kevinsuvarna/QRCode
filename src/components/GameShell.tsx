import type { ReactNode } from 'react';
import CaseStepper from './CaseStepper';

type GameShellProps = {
  children: ReactNode;
};

// Shared page frame: grid background, torn header band with the step tracker, <main>.
export default function GameShell({ children }: GameShellProps) {
  return (
    <div className="page-bg min-h-dvh overflow-x-hidden">
      <RoughEdgeFilters />

      <header className="relative h-[6.5rem]">
        {/* The band sticks out past the screen edges so the torn filter only shows on
            the bottom edge. */}
        <div
          aria-hidden="true"
          className="torn-edge absolute -inset-x-4 -top-4 bottom-0 bg-night-band"
        />
        <div className="absolute top-8 right-[4.5rem]">
          <CaseStepper />
        </div>
      </header>

      <main className="flex flex-col items-center px-4 pb-12 lg:px-0">{children}</main>
    </div>
  );
}

// SVG filters used by the .rough-edge and .torn-edge CSS classes. They shift each
// pixel by a small random amount (noise), which makes straight edges look like torn
// or hand-cut paper. The <svg> itself takes up no space.
function RoughEdgeFilters() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <filter id="rough-edge">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="3" seed="4" />
        <feDisplacementMap in="SourceGraphic" scale="5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="torn-edge">
        <feTurbulence type="fractalNoise" baseFrequency="0.02 0.08" numOctaves="3" seed="9" />
        <feDisplacementMap
          in="SourceGraphic"
          scale="14"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </svg>
  );
}
