import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

const SuggestBusinessPage = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    street_address: '',
    city: '',
    category_id: '',
    phone: '',
    instagram_url: '',
    website_url: '',
    menu_url: '',
    description: '',
    hours: '',
    gallery: '',
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    const fetchCategories = async () => {
      const { data: cats } = await supabase.from('categories').select('*');
      setCategories(cats || []);
    };

    fetchCategories();

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('User:', user);
    if (!user) return;

    setLoading(true);

    const businessData = {
      ...formData,
      user_id: user.id,
      gallery: formData.gallery
        .split(',')
        .map((url) => url.trim())
        .filter((url) => url.length),
      hours: [], // or remove this line if your DB doesn't require it
    };

    const { error } = await supabase.from('suggested_businesses').insert([businessData]);

    setLoading(false);

    if (error) {
      alert('There was an error submitting your business. Please try again.');
      console.error(error);
    } else {
      // ✅ Send Resend email via Supabase Edge Function
      try {
        console.log('Sending business submission email...');
        const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sendEmail`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            subject: '🆕 New Business Submission',
            name: formData.name,
            submittedBy: user.email || 'Guest',
            message: `New business submitted:\n\n${JSON.stringify(formData, null, 2)}`
          }),
        });

        const result = await res.json();
        console.log('Email function response:', result);

        if (!res.ok) {
          console.error('Email function returned an error:', result);
        }
      } catch (err) {
        console.error('Failed to send email:', err);
      }

      setSuccess(true);
      setFormData({
        name: '',
        street_address: '',
        city: '',
        category_id: '',
        phone: '',
        instagram_url: '',
        website_url: '',
        menu_url: '',
        description: '',
        hours: '',
        gallery: '',
      });
    }
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Suggest a Business</h2>

      {success && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">
          ✅ Thanks! Your business suggestion has been submitted for review.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: 'name', placeholder: 'Business Name' },
          { name: 'street_address', placeholder: 'Street Address' },
          { name: 'city', placeholder: 'City' },
          { name: 'phone', placeholder: 'Phone' },
          { name: 'instagram_url', placeholder: 'Instagram URL' },
          { name: 'website_url', placeholder: 'Website URL' },
          { name: 'menu_url', placeholder: 'Menu URL (for restaurants)' },
          { name: 'gallery', placeholder: 'Image URLs (comma-separated)' },
        ].map((field) => (
          <input
            key={field.name}
            type="text"
            name={field.name}
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ))}

        <select
          name="category_id"
          value={formData.category_id}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select Category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <textarea
          name="description"
          placeholder="Business Description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Suggestion'}
        </button>
      </form>
    </div>
  );
};

export default SuggestBusinessPage;
