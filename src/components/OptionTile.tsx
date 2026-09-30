import type { CSSProperties } from 'react';
import type { Card } from '../data/cards';
import AppIcon from './AppIcon';

type OptionTileProps = {
  card: Card;
  index: number; // position in the row: picks the tilt and staggers the fade-in
  onSelect?: () => void; // only passed in debug mode
  pin?: 'dot' | 'pushpin'; // small dot (Choose screen) or red pushpin (Result screen)
  tiltDeg?: number; // overrides the tilt picked by `index`
};

// Each note sits slightly crooked, like paper pinned by hand (measured from the
// mockup, relative to the folder's own tilt). Fixed values, so it looks the same
// every time.
const TILTS_DEG = [0, 0.6, 0.3, -0.6];
const OFFSETS_REM = [0.375, -0.25, 0, -0.25];

// A pinned paper note showing one card's name (the "tile" on the Choose screen).
export default function OptionTile({
  card,
  index,
  onSelect,
  pin = 'dot',
  tiltDeg,
}: OptionTileProps) {
  const style: CSSProperties = {
    rotate: `${tiltDeg ?? TILTS_DEG[index % TILTS_DEG.length]}deg`,
    translate: `0 ${OFFSETS_REM[index % OFFSETS_REM.length]}rem`,
    animationDelay: `${index * 60}ms`,
  };
  const className =
    'animate-fade-up relative flex h-[9rem] w-full items-center justify-center px-4 text-center lg:h-[11.875rem]';

  const content = (
    <>
      <span
        aria-hidden="true"
        className="paper-note paper-grain rough-edge absolute inset-0 rounded-[3px] border-[1.5px] border-dashed border-folder-edge/45 shadow-[0_2px_4px_rgb(0_0_0/0.25)]"
      />
      {pin === 'dot' ? (
        <span
          aria-hidden="true"
          className="absolute top-4 left-4 h-3 w-3 rounded-full bg-pin shadow-[inset_-1px_-1px_2px_rgb(0_0_0/0.5)]"
        />
      ) : (
        <AppIcon
          path="/icons/pushpin.svg"
          className="absolute -top-1 -left-1 h-9 w-9 -rotate-12 fill-pushpin text-pushpin drop-shadow-[1px_2px_1px_rgb(0_0_0/0.45)]"
        />
      )}
      <span className="relative font-note text-[1.625rem] leading-[1.15] text-type-ink lg:text-[2rem]">
        {card.title}
      </span>
    </>
  );

  // Normal mode: the physical card is the input, so the note is display-only.
  if (!onSelect) {
    return (
      <div className={className} style={style}>
        {content}
      </div>
    );
  }

  // Debug mode (?debug=1): a real button so the developer can test without cards.
  return (
    <button
      type="button"
      onClick={onSelect}
      style={style}
      className={`${className} cursor-pointer transition-transform hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-aqua`}
    >
      {content}
    </button>
  );
}
