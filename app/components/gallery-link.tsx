import { getThumbnailUrl } from "@/lib/get-thumbnail-url";

export const GalleryLink: React.FC<{
  name: string;
  imageUrl: string;
  url: string;
}> = ({ name, imageUrl, url }) => (
  <a
    href={url}
    className="flex flex-col justify-center hover:text-orange-400 transition-colors"
  >
    <img src={getThumbnailUrl(imageUrl)} alt={name} height={128} width={128} />
    <div className="mt-2 text-center">{name}</div>
  </a>
);
