import type { Card } from '../data/cards';

// Tailwind only includes classes it can find written out in full in the source code,
// so we spell out every accent class here instead of building them like `bg-${accent}`.
export const ACCENT_STYLES: Record<Card['accent'], string> = {
  mint: 'bg-mint border-mint-deep',
  gold: 'bg-gold border-gold-deep',
  sky: 'bg-sky border-sky-deep',
  lilac: 'bg-lilac border-lilac-deep',
};
