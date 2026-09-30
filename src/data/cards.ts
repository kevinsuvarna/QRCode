import type { IconPath } from './icons';

export type CardId = 'savings-account' | 'fixed-deposit' | 'recurring-deposit' | 'current-account';

export type Card = {
  id: CardId;
  title: string;
  icon: IconPath; // path under /public, e.g. '/icons/savings.svg'
  accent: 'mint' | 'gold' | 'sky' | 'lilac'; // theme color name
  explanation: string; // 2–3 short sentences, age 13–15 reading level
};

export const CARDS: Record<CardId, Card> = {
  'savings-account': {
    id: 'savings-account',
    title: 'Savings Account',
    icon: '/icons/savings.svg',
    accent: 'mint',
    explanation:
      "A savings account is a safe place in a bank to keep money you don't need right away. The bank pays you a little extra, called interest, for keeping it there. You can take your money out whenever you need it.",
  },
  'fixed-deposit': {
    id: 'fixed-deposit',
    title: 'Fixed Deposit',
    icon: '/icons/fixed-deposit.svg',
    accent: 'gold',
    explanation:
      "A fixed deposit locks away one lump sum of money for a set time, like one year. You earn more interest than a savings account, but you can't easily take the money out early.",
  },
  'recurring-deposit': {
    id: 'recurring-deposit',
    title: 'Recurring Deposit',
    icon: '/icons/recurring.svg',
    accent: 'sky',
    explanation:
      'A recurring deposit is where you put in the same small amount every month for a set time. It helps you build a savings habit, and you get it all back with interest at the end.',
  },
  'current-account': {
    id: 'current-account',
    title: 'Current Account',
    icon: '/icons/current.svg',
    accent: 'lilac',
    explanation:
      "A current account is made for businesses that move money in and out many times a day. It usually pays little or no interest, so it isn't meant for saving.",
  },
};

// Display order of tiles on the Choose screen
export const CARD_ORDER: CardId[] = [
  'savings-account',
  'fixed-deposit',
  'recurring-deposit',
  'current-account',
];

// The answer for THIS case. Change here only.
export const CORRECT_ANSWER: CardId = 'savings-account';

// Where "Go Next" goes. Placeholder until step 2 of the case exists.
export const NEXT_ROUTE = '/';

export function isCardId(value: string): value is CardId {
  return Object.prototype.hasOwnProperty.call(CARDS, value);
}
