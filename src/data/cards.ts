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

// The question shown on the Choose screen for THIS case (displayed in capitals by CSS).
export const CASE_QUESTION = 'What type of bank account does Ananya have?';

// What the Result screen says for each card in THIS case. Headings are shown in
// capitals by CSS, so write them in normal case here.
export type ResultCopy = {
  heading: string;
  paragraphs: string[];
  listIntro?: string; // optional line that introduces a bullet list
  bullets?: string[];
};

export const RESULT_COPY: Record<CardId, ResultCopy> = {
  // From design/result-correct.jpeg
  'savings-account': {
    heading: "Yes; it's a savings account!",
    paragraphs: [
      'Ananya uses her account to keep her pocket money, save for short-term goals, and make occasional payments.',
    ],
    listIntro: 'A savings account lets her:',
    bullets: ['Put money in', 'Keep it safe', 'Take money out when needed'],
  },
  // DRAFT — not in the mockups yet; needs the developer's approval.
  'fixed-deposit': {
    heading: 'A fixed deposit is used when...',
    paragraphs: [
      "You have a lump sum you won't need for a while and want to lock it away for a set time to earn more interest.",
      'Ananya needs her money for pocket money and occasional payments, so she can’t lock it all away.',
    ],
  },
  // DRAFT — not in the mockups yet; needs the developer's approval.
  'recurring-deposit': {
    heading: 'A recurring deposit is used when...',
    paragraphs: [
      'You want to save the same amount every month for a set time and get it all back with interest at the end.',
      'Ananya puts money in and takes it out when she needs to, not a fixed amount every month.',
    ],
  },
  // From design/result-incorrect.jpeg
  'current-account': {
    heading: 'A current account is used when...',
    paragraphs: [
      'You need to make frequent payments and receive money regularly, especially for a business.',
      'Ananya uses her account for pocket money, saving and occasional payments, not frequent business transactions.',
    ],
  },
};

// The answer for THIS case. Change here only.
export const CORRECT_ANSWER: CardId = 'savings-account';

// Where "Go Next" goes. Placeholder until step 2 of the case exists.
export const NEXT_ROUTE = '/';

export function isCardId(value: string): value is CardId {
  return Object.prototype.hasOwnProperty.call(CARDS, value);
}
