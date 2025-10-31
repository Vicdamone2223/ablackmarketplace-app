import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

const AddBusinessPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    street_address: '',
    category_id: '',
    phone: '',
    instagram_url: '',
    website_url: '',
    menu_url: '',
    description: '',
    hours: {
      Monday: '',
      Tuesday: '',
      Wednesday: '',
      Thursday: '',
      Friday: '',
      Saturday: '',
      Sunday: '',
    },
    is_open: false,
    online_only: false,
    gallery: [],
  });

  const inputClasses =
    'w-full p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white';

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from('categories').select('*');
      if (error) {
        console.error('Error fetching categories:', error.message);
      } else {
        setCategories(data);
      }
    };
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleHoursChange = (day, value) => {
    setFormData((prev) => ({
      ...prev,
      hours: {
        ...prev.hours,
        [day]: value,
      },
    }));
  };

  const handleGalleryChange = (e) => {
    const urls = e.target.value.split(',').map((url) => url.trim());
    setFormData({ ...formData, gallery: urls });
  };

  const fetchCoordinates = async (address) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      const location = data?.results?.[0]?.geometry?.location;
      return {
        latitude: location?.lat || null,
        longitude: location?.lng || null,
      };
    } catch (err) {
      console.error('❌ Error fetching coordinates:', err);
      return { latitude: null, longitude: null };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let coords = { latitude: null, longitude: null };

    if (formData.online_only) {
      // ✅ If online-only and city is provided, get city center coordinates
      if (formData.city.trim()) {
        coords = await fetchCoordinates(formData.city);
      }
    } else {
      // ✅ For physical businesses, require street address and fetch precise coords
      if (!formData.street_address.trim()) {
        alert('Please enter a street address for physical businesses.');
        return;
      }
      const fullAddress = `${formData.street_address}, ${formData.city}`;
      coords = await fetchCoordinates(fullAddress);
    }

    const cleanedTags = tagInput
      .split(',')
      .map((tag) => tag.trim().toLowerCase())
      .filter(Boolean);

    const payload = {
      ...formData,
      is_open: !!formData.is_open,
      online_only: !!formData.online_only,
      latitude: coords.latitude,
      longitude: coords.longitude,
      tags: cleanedTags.length > 0 ? cleanedTags : null,
      street_address: formData.online_only ? null : formData.street_address,
    };

    if (payload.gallery.length === 1 && payload.gallery[0] === '') {
      delete payload.gallery;
    }

    const { error } = await supabase.from('businesses').insert([payload]);

    if (error) {
      console.error('❌ Error adding business:', error.message);
      alert(`Error: ${error.message}`);
    } else {
      console.log('✅ Business added!');
      navigate('/admin');
    }
  };

  const daysOfWeek = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];

  return (
    <div className="p-6 pb-24">
      <h2 className="text-xl font-semibold mb-4">Add New Business</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Business Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={inputClasses}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            className={inputClasses}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Street Address</label>
          <input
            type="text"
            name="street_address"
            value={formData.street_address}
            onChange={handleChange}
            className={inputClasses}
            placeholder="e.g. 123 Main St"
            required={!formData.online_only}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Category</label>
          <select
            name="category_id"
            value={formData.category_id}
            onChange={handleChange}
            className={inputClasses}
            required
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Phone Number</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Instagram URL</label>
          <input
            type="url"
            name="instagram_url"
            value={formData.instagram_url}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Website URL</label>
          <input
            type="url"
            name="website_url"
            value={formData.website_url}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Menu URL</label>
          <input
            type="url"
            name="menu_url"
            value={formData.menu_url}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Business Hours</label>
          <div className="space-y-2">
            {daysOfWeek.map((day) => (
              <div key={day} className="flex gap-2 items-center">
                <label className="w-24">{day}</label>
                <input
                  type="text"
                  placeholder="e.g. 9:00 AM - 5:00 PM or Closed"
                  value={formData.hours[day]}
                  onChange={(e) => handleHoursChange(day, e.target.value)}
                  className="flex-1 p-2 border rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_open"
            checked={formData.is_open}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm">Currently Open</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            name="online_only"
            checked={formData.online_only}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm">Online Only</label>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Gallery Image URLs (comma separated)
          </label>
          <input
            type="text"
            name="gallery"
            onChange={handleGalleryChange}
            className={inputClasses}
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Tags (comma separated)</label>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="e.g. chicken, vegan, wifi, patio"
            className={inputClasses}
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default AddBusinessPage;
