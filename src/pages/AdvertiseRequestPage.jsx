import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

const AdvertiseRequestPage = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    business_name: '',
    owner_name: '',
    email: '',
    phone: '',
    message: '',
  });
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
    setLoading(true);

    try {
      // Save request to Supabase table (optional: create 'ad_requests' table)
      await supabase.from('ad_requests').insert([
        {
          ...formData,
          submitted_by: user?.email || 'Guest',
        },
      ]);

      // Send email using the same Resend function
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sendEmail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          subject: '📣 New Advertise Request',
          name: formData.business_name,
          submittedBy: user?.email || formData.email || 'Guest',
          message: `New advertising request:\n\n${JSON.stringify(formData, null, 2)}`,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error('❌ Email failed:', result);
      } else {
        console.log('📬 Email sent:', result);
      }

      setSuccess(true);
      setFormData({
        business_name: '',
        owner_name: '',
        email: '',
        phone: '',
        message: '',
      });
    } catch (err) {
      console.error('❌ Submission failed:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 pb-24 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Advertise With Us</h2>

      {success && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4">
          ✅ Thanks! We'll contact you soon about advertising.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: 'business_name', placeholder: 'Business Name' },
          { name: 'owner_name', placeholder: "Owner's Name" },
          { name: 'email', placeholder: 'Contact Email' },
          { name: 'phone', placeholder: 'Phone Number' },
        ].map((field) => (
          <input
            key={field.name}
            type="text"
            name={field.name}
            placeholder={field.placeholder}
            value={formData[field.name]}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ))}

        <textarea
          name="message"
          placeholder="Tell us a bit about your business or what kind of promo you're interested in..."
          value={formData.message}
          onChange={handleChange}
          rows={5}
          required
          className="w-full px-3 py-2 border rounded bg-white text-black border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
};

export default AdvertiseRequestPage;
