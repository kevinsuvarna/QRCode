import { useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { CARDS, CORRECT_ANSWER, NEXT_ROUTE, isCardId } from '../data/cards';
import AppIcon from '../components/AppIcon';
import GameButton from '../components/GameButton';
import GameShell from '../components/GameShell';
import { ACCENT_STYLES } from '../components/accentStyles';

// No camera on this page: the student must press a button to go back and scan again.
export default function ResultPage() {
  const { cardId } = useParams();
  const location = useLocation();

  // Hooks must run before any early `return`, so this can't use `isCorrect` below.
  useEffect(() => {
    document.title = `${cardId === CORRECT_ANSWER ? 'Correct!' : 'Not correct'} · Case File`;
  }, [cardId]);

  // Keep ?debug=1 in links if (and only if) it's already in the URL.
  const home = { pathname: '/', search: location.search };

  // Decision logic from CLAUDE.md section 6.
  if (!cardId || !isCardId(cardId)) return <Navigate to={home} replace />;
  const card = CARDS[cardId];
  const isCorrect = cardId === CORRECT_ANSWER;

  return (
    <GameShell>
      <div className="flex w-full flex-1 items-center justify-center">
        <article
          className={`w-full max-w-[640px] rounded-3xl border-4 bg-panel p-6 text-center sm:p-10 ${
            isCorrect
              ? 'animate-pop-in border-mint shadow-[0_0_60px_-10px_var(--color-mint)]'
              : 'animate-pop-in-shake border-coral'
          }`}
        >
          <p
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-lg font-bold text-ink ${
              isCorrect ? 'bg-mint' : 'bg-coral'
            }`}
          >
            <AppIcon
              path={isCorrect ? '/icons/check.svg' : '/icons/cross.svg'}
              className="h-6 w-6"
            />
            {isCorrect ? 'Correct!' : 'Not correct'}
          </p>

          <div
            className={`mx-auto mt-6 flex h-32 w-32 items-center justify-center rounded-3xl border-b-[6px] text-ink ${ACCENT_STYLES[card.accent]}`}
          >
            <AppIcon path={card.icon} className="h-24 w-24" />
          </div>

          <h1 className="mt-4 font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            {card.title}
          </h1>

          {!isCorrect && (
            <p className="mt-4 font-display text-xl font-semibold text-gold">
              Good try! Here&apos;s what this one is:
            </p>
          )}
          <p className="mx-auto mt-3 max-w-[60ch] text-lg leading-normal sm:text-xl">
            {card.explanation}
          </p>

          {isCorrect ? (
            <div className="mt-8 flex flex-col-reverse gap-4 sm:flex-row sm:justify-between">
              <GameButton to={home} variant="secondary" iconLeft="/icons/arrow-left.svg">
                Go Back
              </GameButton>
              <GameButton
                to={{ pathname: NEXT_ROUTE, search: location.search }}
                variant="primary"
                iconRight="/icons/arrow-right.svg"
              >
                Go Next
              </GameButton>
            </div>
          ) : (
            <div className="mt-8 flex justify-center">
              <GameButton to={home} variant="danger" iconLeft="/icons/refresh.svg">
                Try Again
              </GameButton>
            </div>
          )}
        </article>
      </div>
    </GameShell>
  );
}
