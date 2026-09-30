import type { CSSProperties } from 'react';
import type { Card } from '../data/cards';
import AppIcon from './AppIcon';
import { ACCENT_STYLES } from './accentStyles';

type OptionTileProps = {
  card: Card;
  index: number; // position in the row, used to stagger the fade-in
  onSelect?: () => void; // only passed in debug mode
};

export default function OptionTile({ card, index, onSelect }: OptionTileProps) {
  const className = `animate-fade-up flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl border-b-[6px] p-5 text-ink sm:p-6 ${ACCENT_STYLES[card.accent]}`;
  const style: CSSProperties = { animationDelay: `${index * 60}ms` };

  const content = (
    <>
      <AppIcon path={card.icon} className="h-16 w-16" />
      <span className="text-center font-display text-2xl leading-tight font-bold">
        {card.title}
      </span>
    </>
  );

  // Normal mode: the physical card is the input, so the tile is display-only.
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
      className={`${className} cursor-pointer transition-transform hover:-translate-y-1 focus-visible:outline-4 focus-visible:outline-offset-4 focus-visible:outline-snow`}
    >
      {content}
    </button>
  );
}
