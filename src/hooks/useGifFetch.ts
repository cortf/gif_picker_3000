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

// Fetch GIFs for a search query with pagination.
async function fetchGifsFromSearch(
  query: string,
  limit: number,
  offset: number
): Promise<Gif[]> {
  const response = await fetch(
    `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(
      query
    )}&limit=${limit}&offset=${offset}`
  );
  if (!response.ok) {
    if (response.status === 429)
      throw new Error("API limit reached. Try again later");
    if (response.status === 414)
      throw new Error("Search query too long. Please refine your search.");
    throw new Error("Failed to fetch GIFs");
  }
  const json: GiphyResponse = await response.json();
  return json.data.map((gif) => ({
    id: gif.id,
    mp4Url: gif.images.downsized_small.mp4,
    originalUrl: gif.url,
  }));
}

// Fetch a single random GIF.
async function fetchRandomGif(): Promise<Gif> {
  const response = await fetch(
    `https://api.giphy.com/v1/gifs/random?api_key=${API_KEY}`
  );
  if (!response.ok) {
    if (response.status === 429)
      throw new Error("API limit reached. Try again later");
    throw new Error("Failed to fetch random gif");
  }
  const json = await response.json();
  return {
    id: json.data.id,
    mp4Url: json.data.images.downsized_small.mp4,
    originalUrl: json.data.url,
  };
}

// Fetch a count of random GIFs.
export async function fetchUniqueRecommended(count: number): Promise<Gif[]> {
  const results: Gif[] = [];
  while (results.length < count) {
    try {
      const gif = await fetchRandomGif();
      if (!results.some((g) => g.id === gif.id)) {
        results.push(gif);
      }
    } catch (error) {
      console.error("Error fetching a recommended gif:", error);
      throw error;
    }
  }
  return results;
}

function getErrorMessage(err: unknown, defaultMsg: string): string {
  if (err instanceof Error) return err.message || defaultMsg;
  return defaultMsg;
}

export function useGifFetch(
  search: string,
  refresh: number = 0,
  page: number = 0
) {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const limit = 9; // Number of GIFs to load per page

  useEffect(() => {
    if (!search.trim()) {
      setLoading(true);
      fetchUniqueRecommended(3)
        .then((rec) => {
          setGifs(rec);
          setError(null);
          setHasMore(false); // No infinite scroll for recommended GIFs.
        })
        .catch((err) => {
          console.error("Error fetching recommended:", err);
          setError(getErrorMessage(err, "Failed to fetch recommended GIFs"));
          setGifs([]);
        })
        .finally(() => setLoading(false));
      return;
    } else {
      // Special case for simulating API limit.
      if (search.toLowerCase() === "simulate429") {
        setError("API limit reached. Try again later");
        setLoading(false);
        return;
      }
      setLoading(true);
      const timer = setTimeout(() => {
        const offset = page * limit;
        fetchGifsFromSearch(search, limit, offset)
          .then((fetchedGifs) => {
            // Determine if there are more results.
            if (fetchedGifs.length < limit) {
              setHasMore(false);
            } else {
              setHasMore(true);
            }
            // For the first page, replace the list; otherwise append.
            if (page === 0) {
              setGifs(fetchedGifs);
            } else {
              setGifs((prev) => [...prev, ...fetchedGifs]);
            }
            setError(null);
          })
          .catch((err) => {
            const errMsg = getErrorMessage(err, "Failed to fetch GIFs");
            // If api limit error occurs AND we already have GIFs do not clear them
            if (errMsg === "API limit reached. Try again later") {
              if (page === 0 && gifs.length === 0) {
                setGifs([]);
              }
            } else {
              // For other errors on first page, clear the GIFs
              if (page === 0) {
                setGifs([]);
              }
            }
            setError(errMsg);
            setHasMore(false);
          })
          .finally(() => setLoading(false));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [search, refresh, page]);

  return { gifs, loading, error, hasMore };
}
