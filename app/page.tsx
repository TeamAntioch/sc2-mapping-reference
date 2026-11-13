import cliffs from "@/app/(gallery)/cliffs/cliff-list";
import doodads from "@/app/(gallery)/doodads/doodad-list";
import terrain from "@/app/(gallery)/terrain/terrain-list";
import tilesets from "@/app/(gallery)/tilesets/tileset-list";
import { GalleryLink } from "@/app/components/gallery-link";

const sections: {
  name: string;
  url: string;
  imageUrl: string;
  count: number;
}[] = [
  {
    imageUrl: `/cliffs/${cliffs[0].url}`,
    name: "Cliffs",
    count: cliffs.length,
    url: "/cliffs",
  },
  {
    imageUrl: `/doodads/${doodads[0].url}`,
    name: "Doodads",
    count: doodads.length,
    url: "/doodads",
  },
  {
    imageUrl: `/tilesets/${tilesets[0].url}`,
    name: "Tilesets",
    count: tilesets.length,
    url: "/tilesets",
  },
  {
    imageUrl: `/terrain/${terrain[0].url}`,
    name: "Terrain",
    count: terrain.length,
    url: "/terrain",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <header className="mb-10">
        <p className="mb-3 font-display text-xs uppercase tracking-[0.3em] text-cyan-400/80">
          <span aria-hidden>◆ </span>StarCraft II Editor
        </p>
        <h1 className="font-display text-4xl font-bold uppercase tracking-[0.08em] text-cyan-50 sm:text-5xl">
          Mapping Reference
        </h1>
        <p className="mt-3 max-w-xl text-slate-400">
          Browse every cliff, doodad, tileset and terrain texture, and search
          doodads in plain words.
        </p>
        <div className="mt-6 h-px max-w-md bg-gradient-to-r from-cyan-400/70 to-transparent" />
      </header>
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {sections.map((section) => (
          <GalleryLink
            key={section.name}
            name={section.name}
            imageUrl={section.imageUrl}
            url={section.url}
            count={section.count}
          />
        ))}
      </section>
    </main>
  );
}
