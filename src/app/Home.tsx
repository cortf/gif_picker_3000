"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, ChangeEvent, useEffect, useRef } from "react";
import Link from "next/link";
import GifCard from "../components/GifCard";
import { useGifFetch, Gif } from "../hooks/useGifFetch";
import { useRecommendedGifs } from "../hooks/useRecommendedGifs";
import RefreshButton from "@/components/RefreshButton";
import SearchBar from "@/components/SearchBar";

// debounce function for updating URL query.
function debounce<T extends (...args: string[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>): void => {
    if (timeout !== null) clearTimeout(timeout);
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

  const { gifs, loading, error, hasMore } = useGifFetch(
    search,
    refreshFavorites,
    page
  );

  const {
    gifs: recGifs,
    loading: recLoading,
    error: recError,
  } = useRecommendedGifs();

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    setSearch(event.target.value);
  };

  const handleClear = () => {
    setSearch("");
  };

  // IntersectionObserver for infinite scroll.
  useEffect(() => {
    // Only trigger infinite scroll if:
    // - search query is active
    // - no error
    // - there are more results
    if (loading || !search.trim() || error || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });
    });
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [loading, search, error, hasMore]);

  return (
    <div className="min-h-screen p-12 bg-gray-50">
      <h1 className="text-3xl font-bold mb-10 text-center">
        <Link href="/" onClick={handleClear}>
          GIF Picker 3000
        </Link>
      </h1>
      <SearchBar value={search} onChange={handleChange} onClear={handleClear} />

      {!search.trim() && !error && (
        <RefreshButton setRefreshFavorites={setRefreshFavorites} />
      )}

      <div className="max-w-4xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* If API limit error occurs display error message */}
        {error === "API limit reached. Try again later" && (
          <p className="col-span-full text-center text-red-500">{error}</p>
        )}
        {error &&
          error !== "API limit reached. Try again later" &&
          gifs.length === 0 && (
            <p className="col-span-full text-center">
              Oops! There&apos;s nothing here.
            </p>
          )}
        {gifs.length > 0 &&
          gifs.map((gif: Gif) => (
            <GifCard
              key={gif.id}
              mp4Url={gif.mp4Url}
              originalUrl={gif.originalUrl}
            />
          ))}
      </div>

      {/* Sentinel for infinite scroll */}
      {search.trim() && !error && hasMore && (
        <div ref={sentinelRef} className="h-10" />
      )}

      {loading && page === 0 && (
        <p className="col-span-full text-center">Loading...</p>
      )}
      {loading && page > 0 && (
        <p className="col-span-full text-center mt-4">Loading more...</p>
      )}

      {/* If a non api limit error occurred OR no search results, display recommended GIFs */}
      {((error && error !== "API limit reached. Try again later") ||
        (!loading && gifs.length === 0 && search.trim())) && (
        <div className="max-w-4xl mx-auto mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <h3 className="col-span-full text-center mt-6">
            For GIFs that DO exist, here are a few you can check out...
          </h3>
          {recLoading ? (
            <p className="col-span-full text-center">
              Loading recommendations...
            </p>
          ) : recGifs.length > 0 ? (
            recGifs.map((gif: Gif) => (
              <GifCard
                key={gif.id}
                mp4Url={gif.mp4Url}
                originalUrl={gif.originalUrl}
              />
            ))
          ) : recError ? (
            <p className="col-span-full text-center text-red-500">{recError}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}
