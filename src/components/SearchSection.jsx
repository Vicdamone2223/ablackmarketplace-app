import React, { useState, useEffect } from "react";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";
import { useLocationCtx } from "../context/LocationContext";

const SearchSection = ({ category, city, setCategory, setCity }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [citySuggestions, setCitySuggestions] = useState([]);
  const [citySearchInput, setCitySearchInput] = useState("");
  const navigate = useNavigate();

  const { ensurePermission, status } = useLocationCtx();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!category) return setSuggestions([]);
      const { data: catData } = await supabase
        .from("categories")
        .select("name")
        .ilike("name", `%${category}%`);
      const { data: bizData } = await supabase
        .from("businesses")
        .select("name")
        .ilike("name", `%${category}%`);
      const combined = [
        ...(catData || []).map((c) => c.name),
        ...(bizData || []).map((b) => b.name),
      ];
      setSuggestions([...new Set(combined)]);
    };
    fetchSuggestions();
  }, [category]);

  useEffect(() => {
    const fetchCitySuggestions = async () => {
      if (!citySearchInput) return setCitySuggestions([]);
      const { data } = await supabase
        .from("businesses")
        .select("city")
        .ilike("city", `%${citySearchInput}%`);
      const uniqueCities = [
        ...new Set((data || []).map((b) => b.city).filter(Boolean)),
      ].sort();
      setCitySuggestions(uniqueCities);
    };
    fetchCitySuggestions();
  }, [citySearchInput]);

  // Optional helper — when the input loses focus, ensure the viewport
  // is comfortably reset (no effect if the page wasn't scrolled).
  const handleBlur = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  return (
    <div className="bg-white text-black rounded-2xl p-4 shadow-sm border border-black/10">
      {/* Category / business search */}
      <div className="relative mb-3">
        <div className="flex items-center h-12 rounded-xl bg-white border border-black/10 px-3">
          <button
            type="button"
            aria-label="Open search"
            onClick={() => navigate("/search")}
            className="mr-2 text-black/70 hover:text-black"
          >
            <FaSearch />
          </button>
          <input
            type="text"
            className="w-full bg-transparent outline-none text-base text-black placeholder-black/50"
            placeholder="Search businesses or categories"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={handleBlur}
            enterKeyHint="search"
            aria-label="Search businesses or categories"
          />
        </div>

        {suggestions.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-lg max-h-56 overflow-auto">
            {suggestions.map((item, idx) => (
              <li
                key={idx}
                className="px-3 py-2 text-sm text-black hover:bg-black/5 cursor-pointer"
                onClick={() => setCategory(item)}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* City search with autocomplete */}
      <div className="relative">
        <div className="flex items-center h-12 rounded-xl bg-white border border-black/10 px-3">
          <FaMapMarkerAlt className="text-black/70 mr-2" />
          <input
            type="text"
            className="w-full bg-transparent outline-none text-base text-black placeholder-black/50"
            placeholder="Search by city (e.g. Atlanta)"
            value={citySearchInput}
            onChange={(e) => {
              const v = e.target.value;
              setCitySearchInput(v);
              if (v !== city) setCity("");
            }}
            onBlur={handleBlur}
            enterKeyHint="search"
            aria-label="Search by city"
          />
        </div>

        {citySuggestions.length > 0 && (
          <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-lg max-h-56 overflow-auto">
            {citySuggestions.map((item, idx) => (
              <li
                key={idx}
                className="px-3 py-2 text-sm text-black hover:bg-black/5 cursor-pointer"
                onClick={() => {
                  setCity(item);
                  setCitySearchInput(item);
                  setCitySuggestions([]);
                }}
              >
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Location permission helper */}
      <div className="pt-3">
        <button
          type="button"
          onClick={ensurePermission}
          className="text-xs text-blue-600 hover:underline"
        >
          {status === "granted" ? "Location enabled ✔" : "Use my location"}
        </button>
      </div>
    </div>
  );
};

export default SearchSection;
