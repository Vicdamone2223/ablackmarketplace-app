import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import supabase from '../supabaseClient';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default function AddReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [bizName, setBizName] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('businesses').select('name').eq('id', id).single();
      if (data?.name) setBizName(data.name);
    })();
  }, [id]);

  const submit = async () => {
    const r = clamp(parseInt(rating, 10) || 0, 1, 5);
    if (!r) return alert('Please pick a rating 1–5.');
    if (!id) return alert('Missing business id.');

    setSubmitting(true);

    // pull local user/profile for reviewer fields
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const email = storedUser?.email || null;

    let reviewerName = email || 'Member';
    let reviewerAvatar = null;

    if (email) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('email', email)
        .single();
      if (prof?.full_name) reviewerName = prof.full_name;
      if (prof?.avatar_url) reviewerAvatar = prof.avatar_url;
    }

    const { error } = await supabase.from('reviews').insert([{
  business_id: id,
  rating: r,
  comment: comment?.trim() || null,
  user_id: null,
  reviewer_name: reviewerName,
  reviewer_avatar_url: reviewerAvatar,
  // created_at comes from DB default now()
}]);


    setSubmitting(false);

    if (error) {
      console.error('review insert error:', error);
      alert(`Error submitting review: ${error.message}`);
      return;
    }
    navigate(`/business/${id}`, { replace: true });
  };

  const onTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-semibold mb-4">Add Review {bizName ? `for ${bizName}` : ''}</h1>

      <label className="block text-sm mb-1">Rating (1–5)</label>
      <input
        type="number"
        min={1}
        max={5}
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        className="w-full border rounded px-3 py-2 mb-4 bg-white dark:bg-gray-900 text-black dark:text-white"
      />

      <label className="block text-sm mb-1">Comment (optional)</label>
      <textarea
        rows={5}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onKeyDown={onTextKeyDown}
        placeholder="Share your experience… (Enter to submit, Shift+Enter for newline)"
        className="w-full border rounded px-3 py-2 mb-4 bg-white dark:bg-gray-900 text-black dark:text-white"
      />

      <button
        onClick={submit}
        disabled={submitting}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit Review'}
      </button>
    </div>
  );
}
