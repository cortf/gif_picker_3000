import { useState, useEffect } from "react";
import { fetchUniqueRecommended, Gif } from "./useGifFetch";

export function useRecommendedGifs(refresh: number = 0) {
  const [gifs, setGifs] = useState<Gif[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchUniqueRecommended(3)
      .then((favorites) => {
        setGifs(favorites);
        setError(null);
      })
      .catch((err) => {
        console.error("Error fetching recommended GIFs:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to fetch recommended GIFs"
        );
        setGifs([]);
      })
      .finally(() => setLoading(false));
  }, [refresh]);

  return { gifs, loading, error };
}
