import { AVAILABLE_ICON_FILES, FALLBACK_ICONS, type IconPath } from '../data/icons';

type AppIconProps = {
  path: IconPath;
  className?: string;
};

// Shows the icon file from public/icons/ if it has been added, otherwise the Lucide
// fallback. Icons are always decorative here, so screen readers skip them.
export default function AppIcon({ path, className }: AppIconProps) {
  if (AVAILABLE_ICON_FILES.has(path)) {
    return <img src={path} alt="" aria-hidden="true" className={className} />;
  }

  const FallbackIcon = FALLBACK_ICONS[path];
  return <FallbackIcon aria-hidden="true" strokeWidth={2.25} className={className} />;
}
