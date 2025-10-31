import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';
import { isBusinessOpenNow } from '../utils/timeUtils';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function SearchPage() {
  const [businesses, setBusinesses] = useState([]);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const [error, setError] = useState('');
  const [categories, setCategories] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [userTypedCity, setUserTypedCity] = useState(false);

  // Geolocation + categories
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(coords);
        if (!userTypedCity) setCityQuery('Current Location');
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setError('⚠️ Location unavailable. Distances may be off.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    (async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });
      if (!error) setCategories(data || []);
    })();
  }, [userTypedCity]);

  // Fetch businesses when filters change
  useEffect(() => {
    const fetchBusinesses = async () => {
      const normalizedQuery = categoryQuery.toLowerCase().trim();
      const normalizedCity = cityQuery.toLowerCase().trim();

      let query = supabase.from('businesses').select('*');

      // Filter by city ONLY if typed manually
      if (userTypedCity && normalizedCity && normalizedCity !== 'current location') {
        query = query.ilike('city', `%${normalizedCity}%`);
      }

      // Category filtering
      if (normalizedQuery) {
        const { data: categoryList, error: catErr } = await supabase
          .from('categories')
          .select('id, name');
        if (catErr) return;

        const match = (categoryList || []).find((c) =>
          c.name.toLowerCase().includes(normalizedQuery)
        );
        query = match ? query.eq('category_id', match.id) : query.contains('tags', [normalizedQuery]);
      }

      const { data, error: finalErr } = await query;
      if (finalErr) return setBusinesses([]);

      // Enrich + sort
      let enriched = (data || []).map((biz) => {
        let distance = null;
        if (
          userLocation &&
          biz.latitude && biz.longitude &&
          !isNaN(biz.latitude) && !isNaN(biz.longitude)
        ) {
          distance = haversineDistance(
            userLocation.latitude,
            userLocation.longitude,
            biz.latitude,
            biz.longitude
          );
        }
        return {
          ...biz,
          is_open: isBusinessOpenNow(biz),
          distance: distance !== null ? parseFloat(distance.toFixed(1)) : null,
        };
      });

      // Keep online-only; for physical, limit to 50mi when using current location
      if (!userTypedCity || cityQuery.toLowerCase() === 'current location') {
        enriched = enriched.filter((biz) => (biz.online_only ? true : biz.distance !== null && biz.distance <= 50));
      }

      enriched.sort((a, b) => {
        if (a.online_only && !b.online_only) return 1;
        if (!a.online_only && b.online_only) return -1;
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });

      setBusinesses(enriched);
    };

    if (userLocation) fetchBusinesses();
  }, [cityQuery, categoryQuery, userLocation, userTypedCity]);

  return (
    <div className="px-4 pt-0 pb-24 space-y-6 overflow-x-hidden bg-white text-black">
      <h1 className="text-xl font-bold mb-2">Search Local Businesses</h1>

      {/* City Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">City</label>
        <input
          type="text"
          value={cityQuery}
          onChange={(e) => {
            setCityQuery(e.target.value);
            setUserTypedCity(true);
          }}
          placeholder="Current Location"
          className="w-full h-12 rounded-xl bg-white text-black placeholder-black/50 border border-black/10 px-3"
        />
      </div>

      {/* Category Dropdown */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">All Categories</label>
        <select
          value={categoryQuery}
          onChange={(e) => setCategoryQuery(e.target.value)}
          className="w-full h-12 rounded-xl bg-white text-black border border-black/10 px-3"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="space-y-4">
        {businesses.length === 0 ? (
          <p className="text-center text-black/60">No matching businesses found.</p>
        ) : (
          businesses.map((biz) => (
            <Link
              to={`/business/${biz.id}`}
              key={biz.id}
              className="block bg-white text-black border border-black/10 shadow rounded-2xl overflow-hidden"
            >
              <div className="h-80 w-full overflow-hidden">
                <img
                  src={biz.gallery?.[0] || 'https://via.placeholder.com/400x200?text=No+Image'}
                  alt={biz.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold">{biz.name}</h2>
                <p className="text-sm text-black/70">
                  {biz.online_only ? '🌐 Online Only' : biz.city} • {biz.is_open ? '🟢 Open' : '🔴 Closed'}
                </p>
                {biz.distance !== null && !biz.online_only && (
                  <p className="text-sm text-black/70">📍 {biz.distance} miles away</p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
