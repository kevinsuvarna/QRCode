import type { LucideIcon } from 'lucide-react';
import {
  MoveLeft,
  MoveRight,
  Briefcase,
  Camera,
  Check,
  X,
  FolderSearch,
  Lock,
  Pin,
  PiggyBank,
  Repeat,
  RotateCcw,
} from 'lucide-react';

// Every icon file the app uses. They live in public/icons/.
export type IconPath =
  | '/icons/savings.svg'
  | '/icons/fixed-deposit.svg'
  | '/icons/recurring.svg'
  | '/icons/current.svg'
  | '/icons/camera.svg'
  | '/icons/case-file.svg'
  | '/icons/check.svg'
  | '/icons/cross.svg'
  | '/icons/arrow-right.svg'
  | '/icons/arrow-left.svg'
  | '/icons/refresh.svg'
  | '/icons/pushpin.svg';

// The Lucide icon shown until the real file has been added.
export const FALLBACK_ICONS: Record<IconPath, LucideIcon> = {
  '/icons/savings.svg': PiggyBank,
  '/icons/fixed-deposit.svg': Lock,
  '/icons/recurring.svg': Repeat,
  '/icons/current.svg': Briefcase,
  '/icons/camera.svg': Camera,
  '/icons/case-file.svg': FolderSearch,
  '/icons/check.svg': Check,
  '/icons/cross.svg': X,
  '/icons/pushpin.svg': Pin,
  '/icons/arrow-right.svg': MoveRight,
  '/icons/arrow-left.svg': MoveLeft,
  '/icons/refresh.svg': RotateCcw,
};

// Icon files that really exist in public/icons/.
// After you drop a file into that folder, add its path here and the app will use it
// instead of the Lucide fallback. We list them by hand (instead of trying to load the
// file and seeing if it fails) so the browser never requests a missing file.
export const AVAILABLE_ICON_FILES: ReadonlySet<IconPath> = new Set<IconPath>([
  // e.g. '/icons/savings.svg',
]);
