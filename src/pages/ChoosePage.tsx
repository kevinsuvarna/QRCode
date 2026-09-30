import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CARD_ORDER, CARDS, type CardId } from '../data/cards';
import { useQrScanner } from '../hooks/useQrScanner';
import CameraPrompt from '../components/CameraPrompt';
import GameShell from '../components/GameShell';
import OptionTile from '../components/OptionTile';

export default function ChoosePage() {
  const navigate = useNavigate();
  const location = useLocation();
  // Debug mode is on only if the developer typed ?debug=1 into the URL themselves.
  const isDebug = new URLSearchParams(location.search).get('debug') === '1';

  useEffect(() => {
    document.title = 'What will you choose? · Case File';
  }, []);

  // `search` carries ?debug=1 along to the result page (if it was there).
  function goToResult(cardId: CardId) {
    navigate({ pathname: `/result/${cardId}`, search: location.search });
  }

  const { videoRef, status } = useQrScanner(goToResult);

  return (
    <GameShell>
      <div className="flex w-full flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center">
          <h1 className="text-center font-display text-[clamp(2.5rem,5vw,4rem)] leading-tight font-bold">
            What will you <span className="text-gold">choose</span>?
          </h1>

          <ul className="mt-8 grid w-full max-w-6xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
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
        </div>

        {/* Below the tiles on small screens; bottom-right on large ones. It stays in the
            normal page flow (instead of position: fixed) so it can never cover a tile. */}
        <div className="mt-8 flex justify-center lg:justify-end">
          <CameraPrompt status={status} />
        </div>
      </div>

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
