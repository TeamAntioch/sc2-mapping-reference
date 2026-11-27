/** A closed-by-default "Advanced" section for the galleries' sliders. */
export const AdvancedSettings: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <details className="group/advanced mb-4 max-w-md font-display text-xs tracking-wide">
    <summary className="flex cursor-pointer list-none items-center gap-2 uppercase text-cyan-300 transition-colors hover:text-cyan-100 focus-visible:text-cyan-100 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
      <span
        aria-hidden
        className="inline-block transition-transform group-open/advanced:rotate-90"
      >
        ▸
      </span>
      Advanced
    </summary>
    <div className="mt-3 space-y-4 border-l border-cyan-400/30 pl-4">
      {children}
    </div>
  </details>
);
