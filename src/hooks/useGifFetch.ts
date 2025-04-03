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

async function fetchRandomGif(): Promise<Gif> {
  const response = await fetch(
    `https://api.giphy.com/v1/gifs/random?api_key=${API_KEY}`
  );
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("API limit reached. Try again later");
    }
    throw new Error("Failed to fetch random gif");
  }
  const json = await response.json();
  return {
    id: json.data.id,
    mp4Url: json.data.images.downsized_small.mp4,
    originalUrl: json.data.url,
  };
}

async function fetchUniqueFavorites(count: number): Promise<Gif[]> {
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
  if (err instanceof Error) {
    return err.message || defaultMsg;
  }
  return defaultMsg;
}

export function useGifFetch(search: string, refresh: number = 0) {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!search.trim()) {
      setLoading(true);
      fetchUniqueFavorites(3)
        .then((favorites) => {
          setGifs(favorites);
          setError(null);
        })
        .catch((err) => {
          console.error("Error fetching favorites:", err);
          setError(getErrorMessage(err, "Failed to fetch recommended GIFs"));
          setGifs([]);
        })
        .finally(() => setLoading(false));
      return;
    } else {
      if (search.toLowerCase() === "simulate429") {
        setError("API limit reached. Try again later");
        setLoading(false);
        return;
      }
      setLoading(true);
      const timer = setTimeout(() => {
        const fetchGifs = async (): Promise<void> => {
          try {
            const response = await fetch(
              `https://api.giphy.com/v1/gifs/search?api_key=${API_KEY}&q=${encodeURIComponent(
                search
              )}&limit=12`
            );
            if (!response.ok) {
              if (response.status === 429) {
                setError("API limit reached. Try again later");
                // Leave previous GIFs intact on rate limit errors.
              } else {
                setError("Failed to fetch GIFs");
                setGifs([]); // Clear GIFs for non-429 errors.
              }
              setLoading(false);
              return;
            }
            const json: GiphyResponse = await response.json();
            const fetchedGifs = json.data.map((gif) => ({
              id: gif.id,
              mp4Url: gif.images.downsized_small.mp4,
              originalUrl: gif.url,
            }));
            // If no GIFs are returned, we don't treat it as an error.
            if (fetchedGifs.length === 0) {
              setError(null);
              setGifs([]);
            } else {
              setError(null);
              setGifs(fetchedGifs);
            }
          } catch (err) {
            console.error("Error fetching GIFs:", err);
            setError(getErrorMessage(err, "Failed to fetch GIFs"));
            setGifs([]);
          } finally {
            setLoading(false);
          }
        };

        fetchGifs();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [search, refresh]);

  return { gifs, loading, error };
}
