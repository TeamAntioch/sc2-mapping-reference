import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  type PictureRow,
  SetPictures,
} from "@/app/(gallery)/sets/[id]/set-pictures";
import { KIND_WORDS, sizeText } from "@/app/(gallery)/sets/set-words";
import { publishedSet, publishedSets } from "@/lib/set-search/sets";

// A page for each set in the looks, built with the site; any other id is a 404.
export const dynamicParams = false;

export const generateStaticParams = (): { id: string }[] =>
  publishedSets().map(({ id }) => ({ id }));

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const set = publishedSet((await params).id)?.set;
  return set
    ? {
        title: `${set.name} · Sets · StarCraft 2 Mapping Reference`,
        description: set.look,
      }
    : {};
}

const Heading: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h2 className="mb-2 mt-6 font-display text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
    {children}
  </h2>
);

const List: React.FC<{ items: readonly string[] }> = ({ items }) => (
  <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-slate-300 marker:text-cyan-400/60">
    {items.map((item) => (
      <li key={item}>{item}</li>
    ))}
  </ul>
);

const CONFIDENCE_WORDS = {
  high: "High: the pictures showed the place well.",
  medium: "Medium: the pictures showed some of it.",
  low: "Low: the pictures showed little of it.",
} as const;

const SetPage = async ({ params }: Props) => {
  const found = publishedSet((await params).id);
  if (!found) notFound();
  const { set, look } = found;

  const rows: PictureRow[] = set.pictures.map((picture) => ({
    shows: picture.shows,
    pictures: [
      {
        url: picture.url,
        thumbnail: picture.thumbnail,
        label: "Blender render",
        caption: `${picture.shows} (Blender render)`,
      },
      ...(picture.inGame
        ? [
            {
              url: picture.inGame.url,
              thumbnail: picture.inGame.thumbnail,
              label: "In game",
              caption: `${picture.shows} (in game)`,
            },
          ]
        : []),
    ],
  }));
  const views: PictureRow[] = set.views.map((view) => ({
    shows: view.shows,
    pictures: [
      {
        url: view.url,
        thumbnail: view.thumbnail,
        label: view.shows,
        caption: `${view.shows} (Blender render)`,
      },
    ],
  }));

  return (
    <article className="max-w-5xl">
      <p className="mb-3 font-display text-xs uppercase tracking-[0.14em]">
        <a
          href="/sets"
          className="text-sky-300 transition-colors hover:text-cyan-100"
        >
          ◂ All sets
        </a>
      </p>
      <h1 className="font-display text-2xl font-bold uppercase tracking-[0.08em] text-cyan-50 sm:text-3xl">
        {set.name}
      </h1>
      <p
        className="mt-2 font-display text-xs uppercase tracking-wider text-sky-300/70"
        title={KIND_WORDS[set.kind]}
      >
        {set.kind} · {sizeText(set.size)} · {set.cameras}{" "}
        {set.cameras === 1 ? "camera" : "cameras"} · {set.source}
      </p>
      <div className="mt-3 h-px max-w-md bg-gradient-to-r from-cyan-400/70 to-transparent" />

      <div className="grid gap-x-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <Heading>Look</Heading>
          <p className="text-sm leading-relaxed text-slate-300">{set.look}</p>
          <Heading>Facets</Heading>
          <ul className="flex flex-wrap gap-1.5">
            {set.facets.map((facet) => (
              <li
                key={facet}
                className="border border-cyan-400/25 px-2 py-0.5 text-xs text-sky-200/80"
              >
                {facet}
              </li>
            ))}
          </ul>
          {set.standsInFor.length > 0 && (
            <>
              <Heading>Could stand in for</Heading>
              <List items={set.standsInFor} />
            </>
          )}
          {set.rooms && (
            <>
              <Heading>Places in it</Heading>
              <List items={set.rooms} />
            </>
          )}
        </div>
        <div>
          <Heading>Confidence</Heading>
          <p className="text-sm leading-relaxed text-slate-300">
            {CONFIDENCE_WORDS[set.confidence]}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-slate-500">
            {look.basis}
          </p>
          {look.problems.length > 0 && (
            <>
              <Heading>Problems with the pictures</Heading>
              <List items={look.problems} />
            </>
          )}
          <Heading>Files</Heading>
          <p className="mb-1 text-xs text-slate-500">
            The Cutscene Editor files the set is in.
          </p>
          <ul className="space-y-1 break-all font-mono text-xs text-sky-200/80">
            {set.files.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        </div>
      </div>

      <h2 className="mb-1 mt-10 font-display text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">
        Pictures
      </h2>
      <p className="mb-4 max-w-3xl text-xs leading-relaxed text-slate-500">
        Blender renders of the set&apos;s pieces where its file puts them, roof
        cut away, each beside the same view filmed in the game where one came
        out.
      </p>
      <SetPictures rows={rows} views={views} />
    </article>
  );
};

export default SetPage;
