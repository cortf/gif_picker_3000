"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, ChangeEvent, useEffect } from "react";
import GifCard from "../components/GifCard";
import { useGifFetch } from "../hooks/useGifFetch";
import RefreshButton from "@/components/RefreshButton";

// debounce function for updating URL query.
function debounce<T extends (...args: string[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): void => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch: string = searchParams.get("search") || "";
  const [search, setSearch] = useState<string>(initialSearch);
  const [refreshFavorites, setRefreshFavorites] = useState<number>(0);

  // Update the URL query: push "/?search=<query>" when there is a value.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const updateQuery = useCallback(
    debounce<(value: string) => void>((value: string) => {
      const newUrl = value ? `/?search=${encodeURIComponent(value)}` : "/";
      router.push(newUrl);
    }, 300),
    [router]
  );

  useEffect(() => {
    updateQuery(search);
  }, [search, updateQuery]);

  const { gifs, loading, error } = useGifFetch(search, refreshFavorites);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearch(event.target.value);
  };

  return (
    <div className="min-h-screen p-12 bg-gray-50">
      <h1 className="text-3xl font-bold mb-10 text-center">GIF Picker 3000</h1>
      <div className="max-w-md mx-auto flex items-center justify-between">
        <input
          type="text"
          value={search}
          onChange={handleChange}
          placeholder="Search for a GIF..."
          className="w-full p-3 border border-gray-300 rounded-full focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      {!search.trim() && !error && (
        <RefreshButton setRefreshFavorites={setRefreshFavorites} />
      )}

      <div className="max-w-4xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {error && (
          <p className="col-span-full text-center text-red-500">{error}</p>
        )}
        {loading ? (
          <p className="col-span-full text-center">Loading...</p>
        ) : (
          gifs.map((gif) => (
            <GifCard
              key={gif.id}
              mp4Url={gif.mp4Url}
              originalUrl={gif.originalUrl}
            />
          ))
        )}
        {gifs.length === 0 && !error && !loading && (
          <p className="col-span-full text-center">
            No results found. Try a different search
          </p>
        )}
      </div>
    </div>
  );
}
