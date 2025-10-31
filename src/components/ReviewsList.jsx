import { useEffect, useState } from 'react';
import * as Fa from 'react-icons/fa';
import supabase from '../supabaseClient';

function Stars({ value }) {
  const filled = Math.round(Number(value) || 0);
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) =>
        i < filled ? <Fa.FaStar key={i} className="text-yellow-400" />
                   : <Fa.FaRegStar key={i} className="text-yellow-700" />
      )}
    </div>
  );
}

export default function ReviewsList({ businessId }) {
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });
    if (!error) {
      setReviews(data || []);
      if (data?.length) {
        const a = data.reduce((s, r) => s + Number(r.rating || 0), 0) / data.length;
        setAvg(a.toFixed(1));
      } else setAvg(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const channel = supabase
      .channel('reviews-list')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'reviews', filter: `business_id=eq.${businessId}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Reviews</h3>
        {avg ? (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <Stars value={avg} />
            <span>{avg} · {reviews.length}</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">No reviews yet</span>
        )}
      </div>

      {loading && <p className="text-sm text-gray-400">Loading…</p>}

      <div className="space-y-3">
        {reviews.map(r => (
          <div key={r.id} className="bg-white/5 dark:bg-gray-800 border border-gray-700 rounded p-3">
            <div className="flex items-center justify-between">
              <Stars value={r.rating} />
              <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.comment && <p className="mt-2 text-sm text-gray-200">{r.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
