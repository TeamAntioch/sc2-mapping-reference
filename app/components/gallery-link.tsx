/**
 * How wide a card shows: a third of the page's 5xl column (less its padding and gaps) from md up,
 * half the screen below.
 */
const CARD_SIZES = "(min-width: 1024px) 315px, (min-width: 768px) 33vw, 50vw";

/** A home-page card linking to one gallery section. */
export const GalleryLink: React.FC<{
  name: string;
  /** The full-size picture. */
  imageUrl: string;
  /** Its 512 px medium thumbnail, when it has one; the card falls back to the full size. */
  mediumUrl?: string;
  url: string;
  count: number;
}> = ({ name, imageUrl, mediumUrl, url, count }) => (
  <a href={url} className="group block transition hover:drop-shadow-glow">
    <div className="clip-corner bg-sky-400/35 p-px transition-colors group-hover:bg-cyan-400">
      <div className="clip-corner bg-slate-900 p-1.5">
        <img
          src={mediumUrl ?? imageUrl}
          srcSet={
            mediumUrl ? `${mediumUrl} 512w, ${imageUrl} 1024w` : undefined
          }
          sizes={mediumUrl ? CARD_SIZES : undefined}
          alt=""
          className="block aspect-[1168/915] w-full object-cover"
        />
        <div className="flex items-baseline justify-between gap-2 px-1 pb-1 pt-2.5">
          <span className="font-display text-sm font-semibold uppercase tracking-[0.12em] text-sky-100 transition-colors group-hover:text-cyan-200">
            {name}
          </span>
          <span className="font-display text-xs tabular-nums text-sky-300/60">
            [{count.toLocaleString("en-US")}]
          </span>
        </div>
      </div>
    </div>
  </a>
);
