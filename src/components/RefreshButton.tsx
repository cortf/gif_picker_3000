import { Dispatch, SetStateAction } from "react";

interface RefreshButtonProps {
  setRefreshFavorites: Dispatch<SetStateAction<number>>;
}

export default function RefreshButton({
  setRefreshFavorites,
}: RefreshButtonProps) {
  return (
    <div className="flex justify-center items-center mt-6">
      <h2 className="text-lg font-semibold">Recommended GIFs</h2>
      <button
        onClick={() => setRefreshFavorites((prev) => prev + 1)}
        className="ml-4 text-blue-500 hover:text-blue-700"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 25 25"
          fill="none"
          strokeWidth="2"
          stroke={"#147bd2"}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2.5 2v6h6M21.5 22v-6h-6" />
          <path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2" />
        </svg>
      </button>
    </div>
  );
}
