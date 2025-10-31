// src/pages/AdminPage.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

export default function AdminPage() {
  const [businesses, setBusinesses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(''); // '' or number
  const navigate = useNavigate();

  // Fetch businesses and categories
  useEffect(() => {
    const fetchData = async () => {
      const { data: bizData, error: bizError } = await supabase
        .from('businesses')
        .select('*');

      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (bizError) {
        console.error('❌ Error fetching businesses:', bizError.message);
      } else {
        setBusinesses(bizData || []);
      }

      if (catError) {
        console.error('❌ Error fetching categories:', catError.message);
      } else {
        setCategories(catData || []);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (e, bizId, bizName) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${bizName}"?`)) return;

    const { error } = await supabase.from('businesses').delete().eq('id', bizId);
    if (error) {
      console.error('❌ Delete error:', error.message);
      alert(`Failed to delete: ${error.message}`);
    } else {
      setBusinesses((prev) => prev.filter((b) => b.id !== bizId));
    }
  };

  // Normalize category comparison (number vs string)
  const catId = categoryFilter === '' ? '' : Number(categoryFilter);

  const filtered = businesses.filter((biz) => {
    const matchesSearch = biz.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = catId === '' || Number(biz.category_id) === catId;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="p-4 max-w-2xl mx-auto bg-white text-black">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <div className="flex gap-2 flex-wrap">
          {/* Matches <Route path="/admin/create" ... /> */}
          <button
            onClick={() => navigate('/admin/create')}
            className="bg-black text-white px-4 py-2 rounded hover:bg-black/90"
          >
            ➕ Add New Business
          </button>

          {/* Matches <Route path="/admin-review" ... /> */}
          <button
            onClick={() => navigate('/admin-review')}
            className="bg-black text-white px-4 py-2 rounded hover:bg-black/90"
          >
            🧐 Review Suggestions
          </button>
        </div>
      </div>

      {/* Search / Filters */}
      <input
        type="text"
        placeholder="Search businesses by name…"
        className="w-full mb-3 h-11 px-3 rounded-xl bg-white text-black border border-black/10 placeholder-black/50"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="w-full mb-4 h-11 px-3 rounded-xl bg-white text-black border border-black/10"
      >
        <option value="">All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {filtered.length === 0 ? (
        <p className="text-black/60 text-center">No businesses found.</p>
      ) : (
        filtered.map((biz) => (
          <div
            key={biz.id}
            onClick={() => navigate(`/admin/edit/${biz.id}`)} // Matches <Route path="/admin/edit/:id" ... />
            className="bg-white border border-black/10 hover:bg-black/[0.02] p-3 mb-2 rounded-2xl cursor-pointer flex justify-between items-center"
            role="button"
            tabIndex={0}
          >
            <div>
              <strong>{biz.name}</strong> – {biz.city || 'No city'}
            </div>
            <button
              onClick={(e) => handleDelete(e, biz.id, biz.name)}
              className="text-red-600 hover:text-red-700 text-sm"
              aria-label={`Delete ${biz.name}`}
              title="Delete business"
            >
              🗑️
            </button>
          </div>
        ))
      )}
    </div>
  );
}
