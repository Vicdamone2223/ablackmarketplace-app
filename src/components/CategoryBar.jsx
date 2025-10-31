import { useEffect, useState } from "react";
import * as FaIcons from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import supabase from "../supabaseClient";

const CategoryBar = ({ setCategoryFilter }) => {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("*");
      if (error) {
        console.error("Error fetching categories:", error.message);
      } else {
        setCategories(data || []);
      }
    };
    fetchCategories();
  }, []);

  const visibleCategories = categories.slice(0, 4);

  return (
    <div className="bg-white text-black sticky top-0 z-40 border-b border-black/10">
      <div className="w-full px-2">
        <div className="flex justify-between gap-2 h-12 items-center">
          {visibleCategories.map((cat) => {
            const Icon = FaIcons[cat.icon] || FaIcons.FaStore;
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.name)}
                className="flex flex-col items-center flex-1 min-w-[60px] text-xs leading-none rounded-lg py-1 hover:bg-black/5 transition"
              >
                <div className="text-2xl mb-1 text-black">
                  <Icon />
                </div>
                <span className="truncate text-black">{cat.name}</span>
              </button>
            );
          })}

          {/* Search icon navigates to /search */}
          <button
            onClick={() => navigate("/search")}
            className="flex flex-col items-center flex-1 min-w-[60px] text-xs leading-none rounded-lg py-1 hover:bg-black/5 transition"
          >
            <div className="text-2xl mb-1 text-black">
              <FaIcons.FaSearch />
            </div>
            <span className="truncate text-black">Search</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryBar;
