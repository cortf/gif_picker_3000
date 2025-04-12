"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, ChangeEvent, useState } from "react";
import Link from "next/link";
import GifGrid from "../components/GifGrid";
import { useGifFetch } from "../hooks/useGifFetch";
import { useRecommendedGifs } from "../hooks/useRecommendedGifs";
import RefreshButton from "@/components/RefreshButton";
import SearchBar from "../components/SearchBar";

// Debounce function for updating URL query.
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
  const urlSearch = searchParams.get("search") || "";

  const [refreshFavorites, setRefreshFavorites] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const updateQuery = useCallback(
    debounce((value: string) => {
      const newUrl = value ? `/?search=${encodeURIComponent(value)}` : "/";
      router.push(newUrl);
    }, 500),
    [router]
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>): void => {
    updateQuery(event.target.value);
    setPage(0);
  };

  const handleClear = () => {
    updateQuery("");
    setPage(0);
  };

  const { gifs, loading, error, hasMore, initialLoadComplete } = useGifFetch(
    urlSearch,
    refreshFavorites,
    page
  );

  const {
    gifs: recGifs,
    loading: recLoading,
    error: recError,
  } = useRecommendedGifs();

  // IntersectionObserver for infinite scroll.
  useEffect(() => {
    if (loading || !urlSearch.trim() || error || !hasMore) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) setPage((prev) => prev + 1);
      });
    });
    const currentSentinel = sentinelRef.current;
    if (currentSentinel) observer.observe(currentSentinel);
    return () => {
      if (currentSentinel) observer.unobserve(currentSentinel);
    };
  }, [loading, urlSearch, error, hasMore]);

  const showRecommended =
    !loading &&
    page === 0 &&
    gifs.length === 0 &&
    !!urlSearch.trim() &&
    error &&
    error !== "API limit reached. Try again later";

  if (!initialLoadComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xl font-semibold">
        Loading GIF Picker 3000...
      </div>
    );
  }

  return (
    <div className="min-h-screen p-12 bg-gray-50">
      <h1 className="title mb-10 text-center">
        <Link href="/" onClick={handleClear}>
          GIF Picker 3000
        </Link>
      </h1>

      <SearchBar
        key={urlSearch}
        defaultValue={urlSearch}
        onChange={handleChange}
        onClear={handleClear}
        autoFocus
      />

      {!urlSearch.trim() && !error && (
        <RefreshButton setRefreshFavorites={setRefreshFavorites} />
      )}

      <GifGrid gifs={gifs} loading={loading && page === 0} error={error} />

      {urlSearch.trim() && !error && hasMore && (
        <div ref={sentinelRef} className="h-10" />
      )}

      {loading && page > 0 && (
        <p className="col-span-full text-center mt-4">Loading more...</p>
      )}

      {showRecommended && (
        <GifGrid
          gifs={recGifs}
          loading={recLoading}
          error={recError}
          title="Here are a few recommended GIFs..."
        />
      )}
    </div>
  );
}
