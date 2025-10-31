import { useEffect, useState } from 'react';
import supabase from '../supabaseClient';

const AdminReviewPage = () => {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndSuggestions = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(user);

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.is_admin) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setIsAdmin(true);

      const { data, error } = await supabase
        .from('suggested_businesses')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error) setSuggestions(data);
      setLoading(false);
    };

    fetchUserAndSuggestions();
  }, []);

  const handleApprove = async (biz) => {
    const { id, ...businessData } = biz;

    const { error: insertError } = await supabase
      .from('businesses')
      .insert(businessData);

    if (insertError) {
      alert('❌ Failed to approve. Check console.');
      console.error(insertError);
      return;
    }

    await supabase.from('suggested_businesses').delete().eq('id', id);
    setSuggestions((prev) => prev.filter((b) => b.id !== id));
  };

  const handleDecline = async (id) => {
    await supabase.from('suggested_businesses').delete().eq('id', id);
    setSuggestions((prev) => prev.filter((b) => b.id !== id));
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!user || !isAdmin) return <div className="p-6 text-red-600">Access Denied.</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">📋 Review Business Suggestions</h2>

      {suggestions.length === 0 ? (
        <p>No pending submissions. ✅</p>
      ) : (
        suggestions.map((biz) => (
          <div
            key={biz.id}
            className="border border-gray-300 rounded p-4 mb-4 shadow-sm bg-white dark:bg-gray-800"
          >
            <h3 className="text-lg font-semibold mb-1">{biz.name}</h3>
            <p className="text-sm text-gray-600">{biz.city}</p>
            <p className="mt-2">{biz.description}</p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => handleApprove(biz)}
                className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
              >
                Approve
              </button>
              <button
                onClick={() => handleDecline(biz.id)}
                className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
              >
                Decline
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default AdminReviewPage;
