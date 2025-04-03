"use client";

import React, { useState } from "react";

interface GifCardProps {
  mp4Url: string;
  originalUrl: string;
}

function GifCard({ mp4Url, originalUrl }: GifCardProps) {
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(originalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  return (
    <div className="flex flex-col h-full border border-slate-200 rounded p-2 bg-white shadow-lg">
      <div className="flex flex-grow items-center justify-center">
        <video
          src={mp4Url}
          autoPlay
          loop
          muted
          playsInline
          className="max-w-full"
        />
      </div>
      <button
        className="mt-4 flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        onClick={handleCopy}
      >
        {copied ? (
          <>
            {/* Checkmark icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 00-1.414 0L8 12.586 4.707 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l8-8a1 1 0 000-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Copied!
          </>
        ) : (
          <>
            {/* Copy icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 25 25"
              fill="none"
              strokeWidth="2"
              stroke="#ffffff"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            Copy URL
          </>
        )}
      </button>
    </div>
  );
}

export default React.memo(GifCard);
