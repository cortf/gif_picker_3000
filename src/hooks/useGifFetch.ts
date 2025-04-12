import { useState, useEffect } from "react";

export interface Gif {
  id: string;
  mp4Url: string;
  originalUrl: string;
}

interface GiphyResponse {
  data: {
    id: string;
    url: string;
    images: {
      downsized_small: {
        mp4: string;
      };
    };
  }[];
  meta: {
    status: number;
    msg: string;
    response_id: string;
  };
}

const API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
const LIMIT = 9;

function dedupeGifs(gifs: Gif[]): Gif[] {
  return Array.from(new Map(gifs.map((gif) => [gif.id, gif])).values());
}

function getErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message || fallback : fallback;
}

async function fetchGifsFromSearch(
  query: string,
  limit: number,
  offset: number
): Promise<Gif[]> {
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(
      query
    )}&limit=${limit}&offset=${offset}`
  );

  if (!res.ok) {
    if (res.status === 429)
      throw new Error("API limit reached. Try again later");
    if (res.status === 414)
      throw new Error("Search query too long. Please refine your search.");
    throw new Error("Failed to fetch GIFs");
  }

  const json: GiphyResponse = await res.json();
  return json.data.map((gif) => ({
    id: gif.id,
    mp4Url: gif.images.downsized_small.mp4,
    originalUrl: gif.url,
  }));
}

async function fetchRandomGif(): Promise<Gif> {
  const res = await fetch(
    `https://api.giphy.com/v1/gifs/random?api_key=${API_KEY}`
  );
  if (!res.ok) {
    if (res.status === 429)
      throw new Error("API limit reached. Try again later");
    throw new Error("Failed to fetch random gif");
  }

  const json = await res.json();
  return {
    id: json.data.id,
    mp4Url: json.data.images.downsized_small.mp4,
    originalUrl: json.data.url,
  };
}

export async function fetchUniqueRecommended(count: number): Promise<Gif[]> {
  const results: Gif[] = [];
  while (results.length < count) {
    try {
      const gif = await fetchRandomGif();
      if (!results.some((g) => g.id === gif.id)) {
        results.push(gif);
      }
    } catch (err) {
      console.error("Error fetching a recommended gif:", err);
      throw err;
    }
  }
  return results;
}

export function useGifFetch(
  search: string,
  refresh: number = 0,
  page: number = 0
) {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadRecommendedGifs() {
      setLoading(true);
      try {
        const rec = await fetchUniqueRecommended(3);
        if (!cancelled) {
          setGifs(rec);
          setError(null);
          setHasMore(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(getErrorMessage(err, "Failed to fetch recommended GIFs"));
          setGifs([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    }

    async function loadSearchGifs() {
      if (search.toLowerCase() === "simulate429") {
        setError("API limit reached. Try again later");
        setLoading(false);
        setInitialLoadComplete(true);
        return;
      }

      setLoading(true);
      const offset = page * LIMIT;

      try {
        const fetched = await fetchGifsFromSearch(search, LIMIT, offset);
        if (cancelled) return;

        const hasMoreResults = fetched.length === LIMIT;
        setHasMore(hasMoreResults);
        setError(null);

        if (page === 0) {
          setGifs(dedupeGifs(fetched));
        } else {
          setGifs((prev) => {
            const existingIds = new Set(prev.map((gif) => gif.id));
            const deduped = fetched.filter((gif) => !existingIds.has(gif.id));
            return [...prev, ...deduped];
          });
        }
      } catch (err) {
        if (!cancelled) {
          const errMsg = getErrorMessage(err, "Failed to fetch GIFs");
          setError(errMsg);
          setHasMore(false);
          setGifs([]);

          if (page === 0 && gifs.length === 0) {
            setGifs([]);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setInitialLoadComplete(true);
        }
      }
    }

    if (!search.trim()) {
      loadRecommendedGifs();
    } else {
      const debounceTimer = setTimeout(loadSearchGifs, 500);
      return () => {
        cancelled = true;
        clearTimeout(debounceTimer);
      };
    }
  }, [search, refresh, page]);

  return { gifs, loading, error, hasMore, initialLoadComplete };
}
