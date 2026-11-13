import { getThumbnailUrl } from "@/lib/get-thumbnail-url";

/** A home-page card linking to one gallery section. */
export const GalleryLink: React.FC<{
  name: string;
  imageUrl: string;
  url: string;
  count: number;
}> = ({ name, imageUrl, url, count }) => (
  <a href={url} className="group block transition hover:drop-shadow-glow">
    <div className="clip-corner bg-sky-400/35 p-px transition-colors group-hover:bg-cyan-400">
      <div className="clip-corner bg-slate-900 p-1.5">
        <img
          src={getThumbnailUrl(imageUrl)}
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
