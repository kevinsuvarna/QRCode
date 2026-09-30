import type { ReactNode } from 'react';

type CaseFolderProps = {
  children: ReactNode;
  className?: string; // extra classes from the page, e.g. an entrance animation
};

// The big tilted manila "case file" that holds each screen's content. At lg+ its size
// and position are copied from the 1280×831 mockups (px ÷ 16 = rem) and are the same
// on every screen.
export default function CaseFolder({ children, className = '' }: CaseFolderProps) {
  return (
    <section
      className={`relative mt-6 w-full max-w-3xl lg:mt-[5.25rem] lg:h-[33rem] lg:w-[63.4rem] lg:max-w-none lg:translate-x-3 lg:-rotate-1 ${className}`}
    >
      {/* Paper layer, kept separate so the rough-edge filter doesn't distort the text. */}
      <div
        aria-hidden="true"
        className="paper-folder paper-grain rough-edge absolute inset-0 rounded-2xl border-[5px] border-folder-edge shadow-[0_0.5rem_1.5rem_rgb(0_0_0/0.35)]"
      />
      {children}
    </section>
  );
}
