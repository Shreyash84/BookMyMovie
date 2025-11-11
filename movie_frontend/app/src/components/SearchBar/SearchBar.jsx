// SearchBar.jsx
import React, { useState } from "react";
import { Search, X } from "lucide-react";

const SearchBar = ({ onSearch, placeholder = "Search for movies..." }) => {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setQuery("");
    onSearch("");
  };

  return (
    <div className="relative max-w-2xl mx-auto mb-12">
      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        value={query}
        onChange={handleSearch}
        placeholder={placeholder}
        className="w-full pl-12 pr-12 py-4 bg-white border border-slate-700 rounded-xl text-slate-800 placeholder-gray-400 focus:outline-none focus:border-red-500 transition-colors duration-300 text-lg"
      />
      {query && (
        <button
          onClick={clearSearch}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-600 transition-colors duration-200"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;