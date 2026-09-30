import type { ScannerStatus } from '../hooks/useQrScanner';
import AppIcon from './AppIcon';

type CameraPromptProps = {
  status: ScannerStatus;
};

export default function CameraPrompt({ status }: CameraPromptProps) {
  return (
    <section className="flex w-full max-w-sm items-center gap-4 rounded-2xl border-2 border-panel-edge bg-panel p-5">
      <AppIcon path="/icons/camera.svg" className="h-12 w-12 shrink-0 text-sky" />
      <div>
        <p className="font-display text-xl leading-snug font-semibold">
          Place your card under the camera
        </p>
        {/* aria-live makes screen readers announce status changes */}
        <p aria-live="polite" className="mt-1 text-lg">
          <StatusText status={status} />
        </p>
      </div>
    </section>
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
          <span aria-hidden="true" className="animate-soft-pulse h-3 w-3 rounded-full bg-mint" />
          Scanning…
        </span>
      );
    case 'denied':
      return (
        <span className="text-coral">
          Camera is blocked. Click the lock icon in the address bar and allow the camera, then
          reload.
        </span>
      );
    case 'no-camera':
      return <span className="text-coral">No camera found. Plug one in and reload.</span>;
  }
}
