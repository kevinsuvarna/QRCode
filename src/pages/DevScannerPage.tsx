import { useEffect, useState } from 'react';
import type { CardId } from '../data/cards';
import { useQrScanner } from '../hooks/useQrScanner';

// TEMPORARY developer page at /dev/scanner (only exists in `npm run dev`, never in the
// production build). Shows what the scanner sees, without navigating anywhere.
// Delete this file and its route in App.tsx once the scanner is trusted.

const MAX_RAW_VALUES = 5;

export default function DevScannerPage() {
  const [rawValues, setRawValues] = useState<string[]>([]);
  const [acceptedCard, setAcceptedCard] = useState<CardId | null>(null);

  useEffect(() => {
    document.title = 'Scanner test · Case File';
  }, []);

  const { videoRef, status } = useQrScanner(
    // On the real page this would navigate. Here we just show it.
    (cardId) => setAcceptedCard(cardId),
    // Newest first, keep only the last 5.
    (value) => setRawValues((previous) => [value, ...previous].slice(0, MAX_RAW_VALUES)),
  );

  return (
    <main className="mx-auto max-w-2xl p-8 font-mono text-lg text-snow">
      <h1 className="text-2xl font-bold">Scanner test</h1>

      <p className="mt-6">
        Status: <strong aria-live="polite">{status}</strong>
      </p>
      <p className="mt-2">
        Accepted card: <strong>{acceptedCard ?? '—'}</strong>
        {acceptedCard && ' (the scanner now ignores everything; reload to test again)'}
      </p>

      <h2 className="mt-6 font-bold">Last {MAX_RAW_VALUES} raw values (newest first)</h2>
      {rawValues.length === 0 ? (
        <p className="mt-2 opacity-70">Nothing scanned yet.</p>
      ) : (
        <ol className="mt-2 list-decimal pl-8">
          {rawValues.map((value, index) => (
            // Values can repeat, so the index is part of the key.
            <li key={`${index}-${value}`}>
              <code>{JSON.stringify(value)}</code>
            </li>
          ))}
        </ol>
      )}

      {/* Same invisible video as the real page — never shown on screen. */}
      <video
        ref={videoRef}
        muted
        playsInline
        aria-hidden="true"
        className="pointer-events-none fixed top-0 left-0 h-px w-px opacity-0"
      />
    </main>
  );
}
