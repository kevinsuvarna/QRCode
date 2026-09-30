import type { ScannerStatus } from '../hooks/useQrScanner';

type CameraPromptProps = {
  status: ScannerStatus;
};

// "(i) Scan the card in the file" line at the bottom of the folder, plus a small
// scanner-status line underneath.
export default function CameraPrompt({ status }: CameraPromptProps) {
  return (
    <div className="flex items-start gap-3">
      <span
        aria-hidden="true"
        className="flex h-[2.125rem] w-[2.125rem] shrink-0 items-center justify-center rounded-full border-2 border-snow bg-night font-title text-lg font-bold text-snow"
      >
        i
      </span>
      <div>
        <p className="font-body text-[1.375rem] leading-[2.125rem] text-cream [text-shadow:0_1px_2px_rgb(0_0_0/0.35)]">
          Scan the card in the file
        </p>
        {/* aria-live makes screen readers announce status changes */}
        <p aria-live="polite" className="font-body text-base text-cream">
          <StatusText status={status} />
        </p>
      </div>
    </div>
  );
}

function StatusText({ status }: CameraPromptProps) {
  switch (status) {
    case 'starting':
      return 'Starting camera…';
    case 'waiting-for-lift':
      return 'Lift your card off, then place it again.';
    case 'ready':
      return (
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden="true"
            className="animate-soft-pulse h-2.5 w-2.5 rounded-full bg-aqua"
          />
          Scanning…
        </span>
      );
    case 'denied':
      return (
        <ErrorText>
          Camera is blocked. Click the lock icon in the address bar and allow the camera, then
          reload.
        </ErrorText>
      );
    case 'no-camera':
      return <ErrorText>No camera found. Plug one in and reload.</ErrorText>;
  }
}

function ErrorText({ children }: { children: string }) {
  return <span className="rounded bg-cream px-1.5 text-stamp-red">{children}</span>;
}
