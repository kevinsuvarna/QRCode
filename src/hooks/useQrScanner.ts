import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { isCardId, type CardId } from '../data/cards';

export type ScannerStatus =
  | 'starting' // camera is turning on
  | 'waiting-for-lift' // a card is already under the camera; wait until it's lifted
  | 'ready' // scanning, the next card placed will be accepted
  | 'denied' // the student (or browser) blocked camera access
  | 'no-camera'; // no usable camera found

// To use a specific camera (for example a USB document camera), put part of its name
// here, e.g. 'Logitech'. You can see camera names in the browser's site settings.
// Leave it empty to let the browser pick (on a laptop: the built-in webcam).
const PREFERRED_CAMERA_LABEL = '';

// How long (ms) the camera must see no card before we accept one. When the student
// comes back from the result page their card is often still under the camera, so we
// wait for them to lift it instead of instantly jumping to the result again.
// The same wait also applies right after the camera starts.
const LIFT_MS = 800;

export function useQrScanner(onScan: (cardId: CardId) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<ScannerStatus>('starting');

  // Keep the latest callback in a ref, so a new callback on every render does not
  // restart the camera. The effect below only runs once per mount.
  const onScanRef = useRef(onScan);
  useEffect(() => {
    onScanRef.current = onScan;
  });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // These variables live for one mount of the page. Returning to "/" mounts the page
    // again, which starts fresh.
    let cancelled = false; // true once the page has unmounted
    let scanner: QrScanner | null = null;
    let readyAt: number | null = null; // when the camera finished starting
    let lastCardSeenAt = 0; // last time any valid card was in view
    let armed = false; // true once we're allowed to accept a card
    let hasFired = false; // true once we've sent the student to a result page

    // Called for every camera frame the scanner checks (about 10 per second).
    // `cardId` is the card in view, or null if there is no valid card in this frame.
    function handleFrame(cardId: CardId | null) {
      if (cancelled || hasFired) return;
      const now = performance.now();

      if (!armed) {
        if (cardId) lastCardSeenAt = now;
        const quietSince = Math.max(readyAt ?? now, lastCardSeenAt);
        if (readyAt !== null && now - quietSince >= LIFT_MS) {
          armed = true;
          setStatus('ready');
        } else {
          if (cardId) setStatus('waiting-for-lift');
          return;
        }
      }

      if (cardId) {
        hasFired = true; // ignore every scan after this one
        onScanRef.current(cardId);
      }
    }

    async function start(videoElement: HTMLVideoElement) {
      try {
        if (!(await QrScanner.hasCamera())) {
          if (!cancelled) setStatus('no-camera');
          return;
        }
        const preferredCamera = await pickCamera();
        if (cancelled) return;

        scanner = new QrScanner(
          videoElement,
          (result) => {
            // Cards encode only their ID. Anything else is silently ignored.
            const value = result.data.trim();
            handleFrame(isCardId(value) ? value : null);
          },
          {
            returnDetailedScanResult: true,
            preferredCamera,
            maxScansPerSecond: 10,
            highlightScanRegion: false,
            highlightCodeOutline: false,
            // Called when a frame has no QR code. Passing our own function also stops
            // qr-scanner from logging decode errors to the console.
            onDecodeError: () => handleFrame(null),
          },
        );
        await scanner.start();
        if (!cancelled) readyAt = performance.now();
      } catch (error) {
        // Errors after unmount (e.g. "play() was interrupted") are expected; ignore them.
        if (cancelled) return;
        setStatus((await isPermissionError(error)) ? 'denied' : 'no-camera');
      }
    }

    void start(video);

    return () => {
      // Turns the camera (and its light) off when leaving the Choose screen.
      cancelled = true;
      scanner?.stop();
      scanner?.destroy();
    };
  }, []);

  return { videoRef, status };
}

// Returns the camera to use: a device ID if PREFERRED_CAMERA_LABEL matches a camera,
// otherwise 'environment' (rear camera on phones; any camera on a laptop).
async function pickCamera(): Promise<QrScanner.FacingMode | QrScanner.DeviceId> {
  const wanted = PREFERRED_CAMERA_LABEL.trim().toLowerCase();
  if (wanted === '') return 'environment';

  // `true` asks the browser for camera names, which it only shares after permission.
  const cameras = await QrScanner.listCameras(true);
  const match = cameras.find((camera) => camera.label.toLowerCase().includes(wanted));
  return match ? match.id : 'environment';
}

async function isPermissionError(error: unknown): Promise<boolean> {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  if (/NotAllowed|permission/i.test(text)) return true;

  // qr-scanner hides the browser's real error behind a generic "Camera not found.",
  // so ask the browser directly whether camera access is blocked for this site.
  try {
    const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
    return permission.state === 'denied';
  } catch {
    return false; // this browser can't tell us, so assume it's a missing camera
  }
}
