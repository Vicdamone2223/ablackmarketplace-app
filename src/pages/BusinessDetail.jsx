import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaPhone, FaMapMarkerAlt, FaInstagram, FaArrowLeft, FaTrash } from 'react-icons/fa';
import ImageGallery from 'react-image-gallery';
import 'react-image-gallery/styles/css/image-gallery.css';
import supabase from '../supabaseClient';

// NEW: location context (provides coords + status = 'granted' | 'denied' | 'idle')
import { useLocationCtx } from '../context/LocationContext';

const Stars = ({ value = 0 }) => {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div className="flex gap-0.5 text-yellow-500">
      {[1, 2, 3, 4, 5].map(i => <span key={i}>{i <= v ? '★' : '☆'}</span>)}
    </div>
  );
};

const fmtDate = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const placeholderAvatar = (nameOrEmail) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(nameOrEmail || 'User')}`;

// Small helper (Haversine) — kept local so we don't change your helpers
function milesBetween(a, b) {
  if (!a || !b) return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371e3; // meters
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const Δφ = toRad(b.lat - a.lat);
  const Δλ = toRad(b.lng - a.lng);

  const sinΔφ = Math.sin(Δφ / 2);
  const sinΔλ = Math.sin(Δλ / 2);

  const c =
    2 *
    Math.atan2(
      Math.sqrt(sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ),
      Math.sqrt(1 - (sinΔφ * sinΔφ + Math.cos(φ1) * Math.cos(φ2) * sinΔλ * sinΔλ))
    );

  const meters = R * c;
  const miles = meters / 1609.344;
  return miles;
}

export default function BusinessDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [business, setBusiness] = useState(null);
  const [user, setUser] = useState(null);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [reviews, setReviews] = useState([]);

  // NEW: current user location
  const { coords } = useLocationCtx(); // { lat, lng } | null

  const isAdmin = localStorage.getItem('is_admin') === 'true';

  useEffect(() => {
    const fetchBusiness = async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('*, category:categories(name)')
        .eq('id', id)
        .single();

      if (!error && data) {
        setBusiness(data);
        if (data.main_image_url && data.gallery?.length) {
          const index = data.gallery.findIndex((img) => img === data.main_image_url);
          setMainImageIndex(index !== -1 ? index : 0);
        }
      }
    };

    fetchBusiness();

    const storedUser = JSON.parse(localStorage.getItem('user'));
    setUser(storedUser);

    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadReviews = async () => {
    const { data, error } = await supabase
      .from('reviews')
      .select('id, rating, comment, created_at, reviewer_name, reviewer_avatar_url')
      .eq('business_id', id)
      .order('created_at', { ascending: false });

    if (!error) setReviews(data || []);
  };

  const isFavorited = favorites.includes(id);

  const toggleFavorite = () => {
    const updated = isFavorited
      ? favorites.filter((favId) => favId !== id)
      : [...favorites, id];

    setFavorites(updated);
    localStorage.setItem('favorites', JSON.stringify(updated));
  };

  const handleSetMainImage = async (imageUrl) => {
    const { error } = await supabase
      .from('businesses')
      .update({ main_image_url: imageUrl })
      .eq('id', id);

    if (!error) {
      setBusiness((prev) => ({ ...prev, main_image_url: imageUrl }));
    }
  };

  const deleteReview = async (reviewId) => {
    if (!isAdmin) return;
    const ok = confirm('Delete this review?');
    if (!ok) return;
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) {
      alert(`Failed to delete review: ${error.message}`);
    } else {
      await loadReviews();
    }
  };

  if (!business) return <div className="p-4">Loading...</div>;

  // Try to read lat/lng from any common field names
  const bizLat =
    business.lat ?? business.latitude ?? business.location_lat ?? business.latititude; // (include typos just in case)
  const bizLng =
    business.lng ?? business.longitude ?? business.location_lng ?? business.longititude;

  // NEW: compute miles (only if coords + bizLat/Lng exist)
  let milesAway = null;
  if (
    coords?.lat != null &&
    coords?.lng != null &&
    typeof bizLat === 'number' &&
    typeof bizLng === 'number'
  ) {
    const m = milesBetween(
      { lat: coords.lat, lng: coords.lng },
      { lat: bizLat, lng: bizLng }
    );
    if (m != null && Number.isFinite(m)) {
      milesAway = Math.round(m * 10) / 10; // 1 decimal
    }
  }

  const images = (business.gallery || []).map((url) => ({
    original: url,
    thumbnail: url,
    renderItem: () => (
      <div className="relative">
        <img
          src={url}
          alt="Business"
          loading="lazy"
          className="w-full h-[450px] object-cover rounded-md"
        />
        {user?.isAdmin && (
          <button
            onClick={() => handleSetMainImage(url)}
            className="absolute top-2 right-2 bg-white/90 text-black text-xs px-2 py-1 rounded border border-black/10"
          >
            {business.main_image_url === url ? 'Main Image' : 'Set as Main'}
          </button>
        )}
      </div>
    ),
  }));

  const renderHours = () => {
    const daysOfWeek = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    if (typeof business.hours === 'object' && business.hours !== null) {
      return (
        <ul className="space-y-1">
          {daysOfWeek.map((day) => (
            <li key={day}>
              <strong>{day}:</strong> {business.hours[day] || 'Closed'}
            </li>
          ))}
        </ul>
      );
    } else if (typeof business.hours === 'string') {
      return <li>{business.hours}</li>;
    } else {
      return <li>Not provided</li>;
    }
  };

  // Prefer lat/lng deep link if available (more accurate than address search)
  const googleMapsLink =
    typeof bizLat === 'number' && typeof bizLng === 'number'
      ? `https://www.google.com/maps/search/?api=1&query=${bizLat},${bizLng}`
      : business.street_address && business.city
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${business.street_address}, ${business.city}`
        )}`
      : 'https://maps.google.com';

  return (
    <div className="pb-24 bg-white text-black">
      <style>{`
        .image-gallery-content,
        .image-gallery-thumbnails-wrapper,
        .image-gallery-slide-wrapper,
        .image-gallery { margin-bottom: 0 !important; padding-bottom: 0 !important; }
      `}</style>

      {/* Gallery */}
      <div className="w-full">
        <ImageGallery
          items={images}
          startIndex={mainImageIndex}
          showPlayButton={false}
          showFullscreenButton={true}
          showThumbnails={true}
          slideOnThumbnailOver={true}
        />
      </div>

      {/* Body */}
      <div className="px-4 pt-4 space-y-4">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-blue-600 flex items-center gap-1"
        >
          <FaArrowLeft /> Back
        </button>

        <div className="flex items-center justify-between gap-2">
          <p className="text-lg font-semibold">{business.name}</p>

          <div className="flex items-center gap-2">
            {business.category?.name && (
              <span className="text-xs bg-black/5 text-black px-2 py-1 rounded-full">
                {business.category.name}
              </span>
            )}
            {/* NEW: show distance if we have it */}
            {milesAway != null && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {milesAway} mi
              </span>
            )}
          </div>
        </div>

        <p className="text-sm text-black/70">{business.description}</p>

        <div className="text-sm">
          <p className="font-medium mb-1">Hours</p>
          {renderHours()}
        </div>

        <button
          onClick={toggleFavorite}
          className={`w-full mt-2 px-4 py-2 rounded text-sm font-medium transition ${
            isFavorited
              ? 'bg-red-500 text-white'
              : 'bg-white text-black border border-black/10'
          }`}
        >
          {isFavorited ? '❤️ Remove from Favorites' : '🤍 Save to Favorites'}
        </button>

        {/* Actions */}
        <div className="flex flex-col gap-3 pt-4">
          <a
            href={`tel:${business.phone}`}
            className="flex items-center gap-2 bg-white text-black border border-black/10 px-4 py-2 rounded-md"
          >
            <FaPhone /> Call
          </a>
          <a
            href={googleMapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-black border border-black/10 px-4 py-2 rounded-md"
          >
            <FaMapMarkerAlt /> View Address
          </a>
          <a
            href={business.instagram_url || 'https://instagram.com'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-white text-black border border-black/10 px-4 py-2 rounded-md"
          >
            <FaInstagram /> Instagram
          </a>

          {business.menu_url && (
            <a
              href={business.menu_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white text-black border border-black/10 px-4 py-2 rounded-md"
            >
              🧾 View Menu
            </a>
          )}

          {business.website_url && (
            <a
              href={business.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-white text-black border border-black/10 px-4 py-2 rounded-md"
            >
              🌐 Visit Website
            </a>
          )}

          <button
            onClick={() => navigate(`/business/${id}/review`)}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Add Review
          </button>

          {user?.isAdmin && (
            <Link
              to={`/admin/edit/${business.id}`}
              className="text-sm text-blue-600 hover:underline text-center pt-2"
            >
              ✏️ Edit Business
            </Link>
          )}
        </div>

        {/* Reviews */}
        <div className="pt-6">
          <h3 className="text-lg font-semibold mb-3">Reviews</h3>
          {reviews.length === 0 ? (
            <p className="text-sm text-black/60">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="flex gap-3 bg-white border border-black/10 rounded-2xl p-3"
                >
                  <img
                    src={rev.reviewer_avatar_url || placeholderAvatar(rev.reviewer_name)}
                    alt="avatar"
                    className="w-10 h-10 rounded-full object-cover border border-black/10"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rev.reviewer_name || 'Member'}</span>
                        <Stars value={rev.rating} />
                      </div>
                      <span className="text-xs text-black/60">{fmtDate(rev.created_at)}</span>
                    </div>
                    {rev.comment && (
                      <p className="text-sm mt-1 text-black/80">{rev.comment}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      className="self-start text-red-600 hover:text-red-700"
                      title="Delete review"
                      onClick={() => deleteReview(rev.id)}
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
