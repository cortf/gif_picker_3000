import GifCard from "./GifCard";
import { Gif } from "../hooks/useGifFetch";

interface GifGridProps {
  gifs: Gif[];
  loading?: boolean;
  error?: string | null;
  title?: string;
}

export default function GifGrid({ gifs, loading, error, title }: GifGridProps) {
  return (
    <div className="max-w-4xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {title && <h3 className="col-span-full text-center mb-2">{title}</h3>}

      {error && (
        <p className="col-span-full text-center text-red-500">{error}</p>
      )}

      {loading && gifs.length === 0 && (
        <p className="col-span-full text-center">Loading...</p>
      )}

      {!loading && gifs.length === 0 && !error && (
        <p className="col-span-full text-center">No GIFs found.</p>
      )}

      {gifs.map((gif: Gif) => (
        <GifCard
          key={gif.id}
          mp4Url={gif.mp4Url}
          originalUrl={gif.originalUrl}
        />
      ))}
    </div>
  );
}
