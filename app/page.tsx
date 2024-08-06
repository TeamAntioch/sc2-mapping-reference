import cliffs from "@/app/(gallery)/cliffs/cliff-list";
import doodads from "@/app/(gallery)/doodads/doodad-list";
import terrain from "@/app/(gallery)/terrain/terrain-list";
import tilesets from "@/app/(gallery)/tilesets/tileset-list";
import { GalleryLink } from "@/app/components/gallery-link";

const sections: {
  name: string;
  url: string;
  imageUrl: string;
}[] = [
  {
    imageUrl: `/cliffs/${cliffs[0].url}`,
    name: "Cliffs",
    url: "/cliffs",
  },
  {
    imageUrl: `/doodads/${doodads[0].url}`,
    name: "Doodads",
    url: "/doodads",
  },
  {
    imageUrl: `/tilesets/${tilesets[0].url}`,
    name: "Tilesets",
    url: "/tilesets",
  },
  {
    imageUrl: `/terrain/${terrain[0].url}`,
    name: "Terrain Gallery",
    url: "/terrain",
  },
];

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <header className="flex flex-col items-center mb-4">
        <h1 className="text-4xl font-bold">StarCraft 2 Mapping Reference</h1>
      </header>
      <section className="grid grid-cols-5 gap-3">
        {sections.map((section) => (
          <GalleryLink
            key={section.name}
            name={section.name}
            imageUrl={section.imageUrl}
            url={section.url}
          />
        ))}
      </section>
    </main>
  );
}
