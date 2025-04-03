"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, ChangeEvent, useEffect, useRef } from "react";
import GifCard from "../components/GifCard";
import { useGifFetch } from "../hooks/useGifFetch";
import RefreshButton from "@/components/RefreshButton";
import Link from "next/link";

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
  const [page, setPage] = useState<number>(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // When search changes, reset page to 0.
  useEffect(() => {
    setPage(0);
  }, [search]);

  // Update the URL query: push "/?search=<query>" when there is a value.
  const updateQuery = useCallback(
    debounce<(value: string) => void>((value: string) => {
      const newUrl = value ? `/?search=${encodeURIComponent(value)}` : "/";
      router.push(newUrl);
    }, 500),
    [router]
  );

  useEffect(() => {
    updateQuery(search);
  }, [search, updateQuery]);

  // Use the custom hook, passing the current page for pagination.
  const { gifs, loading, error } = useGifFetch(search, refreshFavorites, page);

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearch(event.target.value);
  };

  // Clear search field
  const handleClear = () => {
    setSearch("");
  };

  // Setup an IntersectionObserver to trigger loading more results.
  useEffect(() => {
    if (loading || !search.trim()) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });
    });
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }
    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [loading, search]);

  return (
    <div className="min-h-screen p-12 bg-gray-50">
      <h1 className="text-3xl font-bold mb-10 text-center">
        <Link href="/" onClick={handleClear}>
          GIF Picker 3000
        </Link>
      </h1>
      <div className="max-w-md mx-auto relative">
        <input
          type="text"
          value={search}
          onChange={handleChange}
          placeholder="Search for a GIF..."
          className="w-full py-3 pl-5 border border-gray-300 rounded-full focus:outline-none focus:ring focus:border-blue-300"
        />

        {search && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 font-bold flex items-center text-gray-500 hover:text-gray-700 pr-5"
            aria-label="Clear search"
          >
            &times;
          </button>
        )}
      </div>

      {!search.trim() && !error && (
        <RefreshButton setRefreshFavorites={setRefreshFavorites} />
      )}

      <div className="max-w-4xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {error && (
          <p className="col-span-full text-center text-red-500">{error}</p>
        )}
        {loading && page === 0 ? (
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
            No results found. Try a different search.
          </p>
        )}
      </div>
      {/* Sentinel for infinite scroll */}
      {search.trim() && <div ref={sentinelRef} className="h-10" />}
      {loading && page > 0 && (
        <p className="col-span-full text-center mt-4">Loading more...</p>
      )}
    </div>
  );
}
