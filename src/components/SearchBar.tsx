"use client";

import React, { ChangeEvent, forwardRef } from "react";

interface SearchBarProps {
  defaultValue: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  autoFocus?: boolean;
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ defaultValue, onChange, onClear, autoFocus }, ref) => {
    return (
      <div className="max-w-md mx-auto relative">
        <input
          type="text"
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder="Search for a GIF..."
          ref={ref}
          autoFocus={autoFocus}
          className="w-full py-3 pl-5 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring focus:border-blue-300"
        />
        {defaultValue && (
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
);

SearchBar.displayName = "SearchBar";

export default React.memo(SearchBar);
