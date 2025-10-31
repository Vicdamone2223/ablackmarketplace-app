import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import supabase from '../supabaseClient';
import { isBusinessOpenNow } from '../utils/timeUtils';

const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 3958.8; // miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const logSearch = async ({ city, category, user_lat, user_lon }) => {
  try {
    await supabase.from('search_logs').insert([
      {
        city,
        category: category || null,
        user_lat,
        user_lon,
        note: 'CategoryPage search',
      },
    ]);
  } catch (err) {
    console.error('Failed to log search:', err.message);
  }
};

const CategoryPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        setError('⚠️ Location unavailable. Distances may be off.');
      }
    );

    // Fetch categories from Supabase
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching categories:', error.message);
        return;
      }

      setCategories(data);
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchBusinesses = async () => {
      setIsLoading(true);
      setError('');
      let userCoords = null;

      if (selectedCity) {
        try {
          const res = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(
              selectedCity
            )}&key=fdd306151a5e4b468447cee33d7413bc`
          );
          const geoData = await res.json();
          if (geoData.results.length > 0) {
            const { lat, lng } = geoData.results[0].geometry;
            userCoords = { latitude: lat, longitude: lng };

            await logSearch({
              city: selectedCity,
              category: selectedCategory,
              user_lat: lat,
              user_lon: lng,
            });
          } else {
            setError('⚠️ Could not find coordinates for selected city.');
            console.warn('City not found in OpenCage');
          }
        } catch (err) {
          console.error('Failed to geocode selected city:', err);
          setError('⚠️ Failed to geocode selected city.');
        }
      }

      if (!selectedCity && userLocation) {
        userCoords = userLocation;

        await logSearch({
          city: 'User location',
          category: selectedCategory,
          user_lat: userLocation.latitude,
          user_lon: userLocation.longitude,
        });
      }

      const { data, error } = await supabase
        .from('businesses')
        .select('*, categories(name)');

      if (error) {
        console.error('Error fetching businesses:', error);
        setError('⚠️ Could not fetch businesses.');
        setIsLoading(false);
        return;
      }

      let enriched = data.map((biz) => {
        const isOpen = isBusinessOpenNow(biz);
        let distance = null;

        if (
          userCoords &&
          biz.latitude &&
          biz.longitude &&
          !isNaN(biz.latitude) &&
          !isNaN(biz.longitude)
        ) {
          distance = haversineDistance(
            userCoords.latitude,
            userCoords.longitude,
            biz.latitude,
            biz.longitude
          );
        }

        return {
          ...biz,
          is_open: isOpen,
          distance: distance !== null ? parseFloat(distance.toFixed(1)) : null,
          category: biz.categories?.name || 'Uncategorized',
        };
      });

      if (userCoords) {
        enriched = enriched.filter(
          (biz) => biz.distance !== null && biz.distance <= 50
        );
      }

      setBusinesses(enriched);
      setIsLoading(false);
    };

    fetchBusinesses();
  }, [userLocation, selectedCity, selectedCategory]);

  const filteredBusinesses = businesses.filter((biz) => {
    if (onlyOpen && !biz.is_open) return false;
    if (
      selectedCategory &&
      !biz.description?.toLowerCase().includes(selectedCategory.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-4 p-4 pb-24">
      <h2 className="text-xl font-semibold">Search Businesses</h2>

      {error && (
        <div className="bg-red-100 text-red-800 text-sm px-4 py-2 rounded shadow">
          {error}
        </div>
      )}

      {/* City Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">City</label>
        <input
          type="text"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          placeholder="Current Location"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>

      {/* Category Dropdown */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Category</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={onlyOpen}
          onChange={() => setOnlyOpen(!onlyOpen)}
          className="accent-blue-500"
        />
        Only show businesses that are open
      </label>

      {/* 🏪 Business Cards */}
      <div className="space-y-2 pt-4">
        {isLoading ? (
          <p className="text-sm text-gray-500">🔄 Finding businesses...</p>
        ) : filteredBusinesses.length > 0 ? (
          filteredBusinesses.map((biz, index) => (
            <Link to={`/business/${biz.id}`} key={biz.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.05,
                  duration: 0.3,
                  ease: 'easeOut',
                }}
                whileHover={{ scale: 1.02 }}
                className="block w-full p-3 rounded-md bg-white dark:bg-gray-800 shadow cursor-pointer"
              >
                <div className="font-semibold">{biz.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 flex flex-wrap items-center gap-2">
                  <span>{biz.city}</span>
                  <span>{biz.is_open ? '🟢 Open' : '🔴 Closed'}</span>
                  {biz.distance !== null && <span>{biz.distance} mi</span>}
                  {biz.category && (
                    <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-0.5 rounded dark:bg-gray-700 dark:text-gray-200">
                      {biz.category}
                    </span>
                  )}
                </div>
              </motion.div>
            </Link>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No matching businesses found.
          </p>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
