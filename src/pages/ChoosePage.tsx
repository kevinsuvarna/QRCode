import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CARD_ORDER, CARDS, CASE_QUESTION, type CardId } from '../data/cards';
import { useQrScanner } from '../hooks/useQrScanner';
import CameraPrompt from '../components/CameraPrompt';
import CaseFolder from '../components/CaseFolder';
import GameButton from '../components/GameButton';
import GameShell from '../components/GameShell';
import OptionTile from '../components/OptionTile';

export default function ChoosePage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Debug mode is on only if the developer typed ?debug=1 into the URL themselves.
  const isDebug = new URLSearchParams(location.search).get('debug') === '1';

  useEffect(() => {
    document.title = `${CASE_QUESTION} · Case File`;
  }, []);

  // The hook only calls this with a valid card ID (anything else is ignored).
  // `search` carries ?debug=1 along to the result page (if it was there).
  function goToResult(cardId: CardId) {
    navigate({ pathname: `/result/${cardId}`, search: location.search });
  }

  const { videoRef, status } = useQrScanner(goToResult);

  return (
    <GameShell>
      {/* Sizes/positions at lg+ are copied from the 1280×831 mockup (px ÷ 16 = rem). */}
      <CaseFolder>
        <div className="relative px-5 pt-6 pb-8 lg:px-[3.25rem] lg:pt-[3.5rem] lg:pb-0">
          <h1 className="max-w-[54rem] font-title text-[1.75rem] leading-[1.1] font-bold text-type-ink uppercase lg:text-[2.375rem]">
            {CASE_QUESTION}
          </h1>

          <ul className="mt-8 grid grid-cols-2 gap-4 lg:mt-[2.25rem] lg:grid-cols-4">
            {CARD_ORDER.map((cardId, index) => (
              <li key={cardId}>
                <OptionTile
                  card={CARDS[cardId]}
                  index={index}
                  onSelect={isDebug ? () => goToResult(cardId) : undefined}
                />
              </li>
            ))}
          </ul>

          <div className="mt-8 lg:mt-[3.75rem]">
            <CameraPrompt status={status} />
          </div>
        </div>

        {/* SCAN straddles the folder's bottom edge on large screens. It's display-only
            for now: scanning is automatic (CLAUDE.md section 9, PENDING). */}
        <div className="flex justify-center pb-6 lg:absolute lg:right-[4.4rem] lg:-bottom-6 lg:pb-0">
          <GameButton arrow="right">Scan</GameButton>
        </div>
      </CaseFolder>

      {/* The camera feed must be in the page but invisible. Don't use display:none —
          some browsers stop sending video frames to hidden elements. */}
      <video
        ref={videoRef}
        muted
        playsInline
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 h-px w-px opacity-0"
      />
    </GameShell>
  );
}
