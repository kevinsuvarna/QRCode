import { useEffect } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { CARDS, CORRECT_ANSWER, NEXT_ROUTE, RESULT_COPY, isCardId } from '../data/cards';
import CaseFolder from '../components/CaseFolder';
import GameButton from '../components/GameButton';
import GameShell from '../components/GameShell';
import OptionTile from '../components/OptionTile';
import Stamp from '../components/Stamp';

// No camera on this page: the student must press a button to go back and scan again.
export default function ResultPage() {
  const { cardId } = useParams();
  const location = useLocation();

  // Hooks must run before any early `return`, so this can't use `isCorrect` below.
  useEffect(() => {
    document.title = `${cardId === CORRECT_ANSWER ? 'Account identified!' : 'Not quite'} · Case File`;
  }, [cardId]);

  // Keep ?debug=1 in links if (and only if) it's already in the URL.
  const home = { pathname: '/', search: location.search };

  // Decision logic from CLAUDE.md section 6.
  if (!cardId || !isCardId(cardId)) return <Navigate to={home} replace />;
  const card = CARDS[cardId];
  const isCorrect = cardId === CORRECT_ANSWER;

  const copy = RESULT_COPY[cardId];

  return (
    <GameShell>
      <CaseFolder className={isCorrect ? 'animate-pop-in' : 'animate-pop-in-shake'}>
        {/* Small screens: everything stacks in this padded column.
            lg+: each piece is placed where the 1280×831 mockup has it (px ÷ 16 = rem),
            measured from the folder's top-left corner. */}
        <div className="flex flex-col gap-6 px-5 pt-6 pb-8 lg:block lg:p-0">
          <Stamp
            isCorrect={isCorrect}
            className="self-start lg:absolute lg:top-0 lg:-left-[4.7rem]"
          />

          <div className="w-[13.4rem] self-center lg:absolute lg:top-[11.25rem] lg:left-[5.4rem]">
            <OptionTile card={card} index={0} pin="pushpin" tiltDeg={1} />
          </div>

          <div className="text-type-ink lg:absolute lg:top-[4.25rem] lg:left-[27rem] lg:w-[32rem]">
            <h1 className="font-title text-[1.625rem] leading-[1.2] font-bold uppercase lg:text-[1.875rem]">
              {copy.heading}
            </h1>
            {/* Mockup spacing: ~36px under the heading, ~30px between paragraphs. */}
            {copy.paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                className={`${index === 0 ? 'mt-[2.25rem]' : 'mt-[1.875rem]'} font-body text-[1.25rem] leading-[2rem] lg:text-[1.375rem]`}
              >
                {paragraph}
              </p>
            ))}
            {copy.listIntro && (
              <p className="mt-[4rem] font-body text-[1.25rem] leading-[2rem] lg:text-[1.375rem]">
                {copy.listIntro}
              </p>
            )}
            {copy.bullets && (
              <ul className="list-disc pl-10 font-body text-[1.25rem] leading-[2rem] lg:text-[1.375rem]">
                {copy.bullets.map((bullet) => (
                  <li key={bullet}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* The button straddles the folder's bottom edge on large screens. */}
        <div className="flex justify-center pb-6 lg:absolute lg:right-[4.4rem] lg:-bottom-6 lg:pb-0">
          {isCorrect ? (
            <GameButton to={{ pathname: NEXT_ROUTE, search: location.search }} arrow="right">
              Next
            </GameButton>
          ) : (
            <GameButton to={home} arrow="left">
              Try again
            </GameButton>
          )}
        </div>
      </CaseFolder>
    </GameShell>
  );
}
