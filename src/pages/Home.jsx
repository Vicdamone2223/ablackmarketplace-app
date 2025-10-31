// src/pages/Home.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';
import SearchSection from '../components/SearchSection';
import CategoryBar from '../components/CategoryBar';
import { isBusinessOpenNow } from '../utils/timeUtils';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const Home = () => {
  const [businesses, setBusinesses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');

  useEffect(() => {
    const resetFilters = () => {
      setSelectedCategory(null);
      setCategoryQuery('');
      setCityQuery('');
    };
    window.addEventListener('resetHomeFilters', resetFilters);
    return () => window.removeEventListener('resetHomeFilters', resetFilters);
  }, []);

  useEffect(() => {
    const requestLocation = async () => {
      try {
        if ('permissions' in navigator) {
          const status = await navigator.permissions.query({ name: 'geolocation' });
          if (status.state === 'denied') {
            setError('Location access denied. Distances may be inaccurate.');
            return;
          }
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setUserLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          (err) => {
            console.warn('Geolocation error:', err.message);
            setError('Unable to access location. Distances may be inaccurate.');
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      } catch (err) {
        console.error('Permission check failed:', err);
        setError('Location permissions could not be determined.');
      }
    };
    requestLocation();
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      const { data: categories, error: catError } = await supabase
        .from('categories')
        .select('id, name');

      if (catError) {
        console.error('❌ Category fetch failed:', catError);
        setBusinesses([]);
        return;
      }

      const categoryMap = {};
      (categories || []).forEach((c) => { categoryMap[c.id] = c.name; });

      let baseQuery = supabase.from('businesses').select('*');

      if (categoryQuery) {
        const normalized = categoryQuery.toLowerCase().trim();
        const match = (categories || []).find((cat) =>
          cat.name.toLowerCase().includes(normalized)
        );

        if (match) {
          baseQuery = baseQuery.eq('category_id', match.id);
        } else {
          const { data: tagResults, error: tagErr } = await supabase
            .from('businesses')
            .select('*')
            .contains('tags', [normalized]);

          if (tagErr) {
            console.error('❌ Tag search error:', tagErr);
            setBusinesses([]);
            return;
          }

          if (tagResults?.length) {
            const enriched = tagResults.map((biz) => enrich(biz, categoryMap, userLocation));
            setBusinesses(enriched.filter((b) => !b.is_online));
            return;
          }

          const { data: nameResults, error: nameErr } = await supabase
            .from('businesses')
            .select('*')
            .ilike('name', `%${categoryQuery}%`);

          if (nameErr) {
            console.error('❌ Name search error:', nameErr);
            setBusinesses([]);
            return;
          }

          if (nameResults?.length) {
            const enriched = nameResults.map((biz) => enrich(biz, categoryMap, userLocation));
            setBusinesses(enriched.filter((b) => !b.is_online));
            return;
          }

          setBusinesses([]);
          return;
        }
      }

      if (selectedCategory && !categoryQuery) {
        const match = (categories || []).find(
          (cat) => cat.name.toLowerCase() === selectedCategory.toLowerCase()
        );
        if (match) baseQuery = baseQuery.eq('category_id', match.id);
        else { setBusinesses([]); return; }
      }

      const { data, error } = await baseQuery;
      if (error) {
        console.error('❌ Error fetching businesses:', error);
        setBusinesses([]);
        return;
      }

      const enriched = (data || []).map((biz) => enrich(biz, categoryMap, userLocation));
      let finalData = [];

      if (cityQuery.trim() !== '') {
        finalData = enriched.filter(
          (biz) =>
            !biz.is_online &&
            biz.city &&
            biz.city.toLowerCase().includes(cityQuery.toLowerCase())
        );
      } else if (userLocation) {
        finalData = enriched
          .filter((biz) => !biz.is_online && biz.distance !== null)
          .sort((a, b) => a.distance - b.distance);
      } else {
        finalData = enriched.filter((biz) => !biz.is_online);
      }

      setBusinesses(finalData);
    };

    const enrich = (biz, categoryMap, userLocation) => ({
      ...biz,
      category_name: categoryMap[biz.category_id] || '',
      is_open: isBusinessOpenNow(biz),
      is_online: !!(biz.is_online || biz.online_only),
      distance:
        userLocation && biz.latitude && biz.longitude &&
        !isNaN(biz.latitude) && !isNaN(biz.longitude)
          ? parseFloat(
              haversineDistance(
                userLocation.latitude,
                userLocation.longitude,
                Number(biz.latitude),
                Number(biz.longitude)
              ).toFixed(1)
            )
          : null,
    });

    fetchBusinesses();
  }, [userLocation, selectedCategory, categoryQuery, cityQuery]);

  return (
    <section className="px-4 bg-white text-black min-h-screen">
      <CategoryBar setCategoryFilter={setSelectedCategory} />

      <div className="mt-4">
        <SearchSection
          category={categoryQuery}
          setCategory={setCategoryQuery}
          city={cityQuery}
          setCity={setCityQuery}
        />

        {error && <p className="text-red-600 text-sm mt-3">⚠️ {error}</p>}

        <div className="space-y-4 mt-4">
          {businesses.length === 0 ? (
            <p className="text-center text-gray-600">No matching businesses found.</p>
          ) : (
            businesses.map((biz) => (
              <Link
                to={`/business/${biz.id}`}
                key={biz.id}
                className="block bg-white border border-black/10 text-black shadow-sm rounded-2xl overflow-hidden"
              >
                <div className="h-80 w-full overflow-hidden relative">
                  <img
                    src={biz.gallery?.[0] || 'https://via.placeholder.com/400x200?text=No+Image'}
                    alt={biz.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-lg font-semibold">{biz.name}</h2>
                      <p className="text-sm text-black/70">
                        {biz.city} • {biz.is_open ? '🟢 Open' : '🔴 Closed'}
                      </p>
                      {biz.distance !== null && (
                        <p className="text-sm text-black/60">📍 {biz.distance} miles away</p>
                      )}
                    </div>
                    {biz.category_name && (
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full shadow-sm ml-2 whitespace-nowrap">
                        {biz.category_name}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Home;
