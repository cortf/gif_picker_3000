"use client";

import React from "react";
import { ChangeEvent } from "react";

interface SearchBarProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

function SearchBar({ value, onChange, onClear }: SearchBarProps) {
  return (
    <div className="max-w-md mx-auto relative">
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Search for a GIF..."
        className="w-full py-3 pl-5 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring focus:border-blue-300"
      />
      {value && (
        <button
          onClick={onClear}
          className="absolute inset-y-0 right-0 font-bold flex items-center pr-5 text-gray-500 hover:text-gray-700"
          aria-label="Clear search"
        >
          &times;
        </button>
      )}
    </div>
  );
}

export default React.memo(SearchBar);
