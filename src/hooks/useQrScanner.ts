import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { isCardId, type CardId } from '../data/cards';

// The numbered tags ([1] … [7]) mark each rule from CLAUDE.md section 7, so you can
// search for them.

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

// [3] Duplicate cooldown. The camera reads the same code ~10 times per second while a
// card sits there, so the raw-scan callback reports the same value at most once per
// DUPLICATE_COOLDOWN_MS. (Accepting a card is handled by the lift rule above instead.)
const DUPLICATE_COOLDOWN_MS = 2000;

// onScan:    called once with a valid card ID when the student places a card.
// onRawScan: optional, for debugging. Called with every trimmed value the camera reads
//            (valid card or not), with the duplicate cooldown applied.
export function useQrScanner(
  onScan: (cardId: CardId) => void,
  onRawScan?: (value: string) => void,
) {
  // A "ref" is a box that holds a value across renders without causing a re-render.
  // videoRef gives us the real <video> element once React has put it on the page.
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<ScannerStatus>('starting');

  // [1] Callbacks in refs. The page passes a brand-new onScan function every time it
  // re-renders. If the camera effect below depended on onScan, every re-render would
  // stop and restart the camera. Instead we copy the latest function into a ref after
  // each render, and the camera code always calls whatever is in the ref.
  const onScanRef = useRef(onScan);
  const onRawScanRef = useRef(onRawScan);
  useEffect(() => {
    onScanRef.current = onScan;
    onRawScanRef.current = onRawScan;
  });

  // The empty [] at the end means: run this once when the page appears, and run the
  // returned cleanup function once when the page goes away.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // These variables live for one visit to the page. Returning to "/" mounts the page
    // again, which starts everything fresh.
    let cancelled = false; // true once the page has unmounted
    let scanner: QrScanner | null = null;
    let readyAt: number | null = null; // when the camera finished starting
    let lastCardSeenAt = 0; // last time any valid card was in view
    let armed = false; // true once we're allowed to accept a card
    let hasFired = false; // [4] true once we've sent the student to a result page
    const lastReportedAt = new Map<string, number>(); // [3] raw value → time reported

    // [3] Report a raw value to the debug callback, unless we reported it recently.
    function reportRaw(value: string, now: number) {
      const last = lastReportedAt.get(value);
      if (last !== undefined && now - last < DUPLICATE_COOLDOWN_MS) return;
      lastReportedAt.set(value, now);
      onRawScanRef.current?.(value);
    }

    // Called for every camera frame the scanner checks (about 10 per second).
    // `cardId` is the card in view, or null if there is no valid card in this frame.
    function handleFrame(cardId: CardId | null) {
      // [4] "Already navigated" guard. After we've called onScan once, the page is
      // navigating away; any more scans in the meantime must be ignored, otherwise a
      // second card could trigger a second navigation.
      if (cancelled || hasFired) return;
      const now = performance.now();

      // Lift rule: stay "unarmed" until no card has been seen for LIFT_MS.
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
        hasFired = true; // [4]
        onScanRef.current(cardId);
      }
    }

    async function start(videoElement: HTMLVideoElement) {
      try {
        // [6] Check that the computer has any camera at all before trying to open one.
        if (!(await QrScanner.hasCamera())) {
          if (!cancelled) setStatus('no-camera');
          return;
        }
        const preferredCamera = await pickCamera();
        if (cancelled) return;

        scanner = new QrScanner(
          videoElement,
          (result) => {
            // [7] Trim spaces/newlines some QR generators add, then check it's one of
            // our card IDs. Anything else is silently ignored (treated as "no card").
            const value = result.data.trim();
            reportRaw(value, performance.now());
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
        // [6] Blocked permission → 'denied'; anything else → 'no-camera'.
        setStatus((await isPermissionError(error)) ? 'denied' : 'no-camera');
      }
    }

    void start(video);

    // [5] Cleanup. React calls this when the page unmounts (the student leaves it).
    // stop() turns the camera off (so its light goes out) and destroy() frees the
    // scanner's background worker. Coming back to the page runs the effect again.
    return () => {
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

// [6] Decide whether a camera error means "the user blocked it".
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
