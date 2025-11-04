// src/pages/ProfilePage.jsx
import { useNavigate, Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import supabase from '../supabaseClient';

// NEW: Capacitor + Camera plugin (used only on native to force Photo Library)
import { Capacitor } from '@capacitor/core';
import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';

// Flip this to false if you want to disable storage uploads and go URL-only
const ENABLE_AVATAR_UPLOAD = true;

// Optional: list your admin email(s)
const ADMIN_EMAILS = ['ablackweb@gmail.com'];

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);

  // profile fields
  const [fullName, setFullName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [saving, setSaving] = useState(false);

  // URL input state
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [avatarUrlInput, setAvatarUrlInput] = useState('');

  // Web-only hidden file input
  const fileRef = useRef(null);

  // Load user/admin + favorites
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const u = JSON.parse(storedUser);
      setUser(u);

      const adminNow =
        localStorage.getItem('is_admin') === 'true' ||
        ADMIN_EMAILS.includes((u.email || '').toLowerCase());

      setIsAdmin(adminNow);
      localStorage.setItem('is_admin', adminNow ? 'true' : 'false');
      window.dispatchEvent(new Event('admin-updated')); // for navbar badges etc.

      loadProfile(u.email);
    }
    setFavorites(JSON.parse(localStorage.getItem('favorites')) || []);
  }, []);

  const loadProfile = async (email) => {
    if (!email) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('full_name, city, state, avatar_url')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn('profiles fetch:', error.message);
      return;
    }
    if (data) {
      setFullName(data.full_name || '');
      setCity(data.city || '');
      setState(data.state || '');
      setAvatarUrl(data.avatar_url || '');
      setAvatarUrlInput(data.avatar_url || '');
    }
  };

  // save + return row for feedback
  const saveProfile = async () => {
    if (!user?.email) {
      alert('No user email — are you logged in?');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        email: user.email,
        full_name: fullName || null,
        city: city || null,
        state: state || null,
        avatar_url: avatarUrl || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'email' })
        .select()
        .single();

      if (error) {
        console.error('save profile:', error);
        alert(`Save failed: ${error.message}`);
        return;
      }

      setFullName(data?.full_name || '');
      setCity(data?.city || '');
      setState(data?.state || '');
      setAvatarUrl(data?.avatar_url || '');
      setAvatarUrlInput(data?.avatar_url || '');
      alert('Profile saved ✅');
    } catch (e) {
      console.error(e);
      alert(`Save failed: ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  // ---------- Avatar upload helpers ----------

  // Upload any File/Blob to Supabase and set avatar URL
  const uploadToSupabase = async (blobOrFile, filenameHint = 'avatar.jpg') => {
    if (!ENABLE_AVATAR_UPLOAD || !user?.email) return;

    const safeEmail = user.email.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${safeEmail}/${Date.now()}-${filenameHint}`.replace(/\s+/g, '_');

    const { error: upErr } = await supabase.storage
      .from('avatars')
      .upload(path, blobOrFile);

    if (upErr) {
      console.error('avatar upload:', upErr);
      alert(`Avatar upload failed: ${upErr.message}`);
      return;
    }

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    setAvatarUrl(data.publicUrl);
    setAvatarUrlInput(data.publicUrl);
    alert('Avatar uploaded ✅ — don’t forget to Save Profile');
  };

  // Web/desktop handler (hidden <input type="file">)
  const onFile = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;
      await uploadToSupabase(file, file.name || 'avatar.jpg');
    } catch (err) {
      console.error(err);
      alert(`Avatar upload failed: ${err.message || err}`);
    }
  };

  // Main entry triggered by "Upload" button
  const pickImage = async () => {
    // On native iOS/Android, open Photos only (no camera)
    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.getPhoto({
          source: CameraSource.Photos,          // <-- Photo Library only
          resultType: CameraResultType.Uri,     // get a file/URI we can fetch as Blob
          quality: 80,
          allowEditing: false,
        });

        if (!photo || !photo.webPath) return; // user canceled
        // Convert the selected photo to a Blob and upload
        const resp = await fetch(photo.webPath);
        const blob = await resp.blob();
        // Try to keep the correct extension if available
        const name = (photo.path?.split('/').pop() || 'avatar.jpg').replace(/\?.*$/, '');
        await uploadToSupabase(blob, name);
      } catch (e) {
        // user cancelled or plugin error — do nothing
        if (import.meta.env.DEV) console.debug('Photo pick canceled or failed:', e);
      }
      return;
    }

    // On web/desktop: open the regular file chooser
    fileRef.current?.click();
  };

  // ---------- URL-based avatar helpers ----------

  const validateImageUrl = (url) => {
    try {
      const u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) return false;
      // Allow any URL; if you want strict extensions, uncomment:
      // if (!/\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i.test(u.pathname)) return false;
      return true;
    } catch {
      return false;
    }
  };

  const applyUrlAvatar = async () => {
    if (!avatarUrlInput) {
      alert('Paste an image URL first.');
      return;
    }
    if (!validateImageUrl(avatarUrlInput)) {
      alert('That does not look like a valid http(s) image URL.');
      return;
    }
    setAvatarUrl(avatarUrlInput.trim());
    alert('Avatar URL set ✅ — click Save Profile to persist it.');
  };

  // ---------- Auth helpers ----------

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('is_admin');
    window.dispatchEvent(new Event('admin-updated'));
    navigate('/');
  };

  const handleLogin = () => navigate('/login');

  if (!user) {
    return (
      <div className="p-6 space-y-6 pb-24">
        <h2 className="text-xl font-semibold">You're not logged in.</h2>
        <button
          onClick={handleLogin}
          className="w-full bg-black text-white px-4 py-2 rounded hover:bg-black/90"
        >
          Log In
        </button>
        <a
          href="https://ablackweb.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center bg-black text-white px-4 py-2 rounded hover:bg-black/90 transition"
        >
          💬 Join the Community
        </a>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 pb-24">
      {/* Profile header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={
              avatarUrl ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(
                fullName || user.email || 'User'
              )}`
            }
            alt="Avatar"
            className="w-24 h-24 rounded-full object-cover border border-gray-700"
          />

          {ENABLE_AVATAR_UPLOAD && (
            <>
              <button
                onClick={pickImage}
                className="absolute -bottom-2 -right-2 text-xs bg-black text-white px-2 py-1 rounded"
              >
                Upload
              </button>

              {/* Web/desktop fallback only (never triggered on native) */}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFile}
              />
            </>
          )}
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
          {/* Light theme readable inputs (still fine in dark) */}
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Name"
            className="w-full rounded border px-3 py-2
                       bg-white text-black border-black/15 placeholder-black/50
                       dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-400"
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="w-full rounded border px-3 py-2
                       bg-white text-black border-black/15 placeholder-black/50
                       dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-400"
          />
          <input
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="State"
            className="w-full rounded border px-3 py-2
                       bg-white text-black border-black/15 placeholder-black/50
                       dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-400"
          />

          {/* URL-based avatar controls */}
          <div className="col-span-full">
            <button
              type="button"
              onClick={() => setShowUrlInput((v) => !v)}
              className="text-xs px-2 py-1 rounded border border-gray-600 mr-2"
            >
              {showUrlInput ? 'Hide URL field' : 'Use image URL instead'}
            </button>
            {showUrlInput && (
              <div className="mt-2 flex gap-2">
                <input
                  value={avatarUrlInput}
                  onChange={(e) => setAvatarUrlInput(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="flex-1 rounded border px-3 py-2
                             bg-white text-black border-black/15 placeholder-black/50
                             dark:bg-gray-900 dark:text-white dark:border-gray-700 dark:placeholder-gray-400"
                />
                <button
                  onClick={applyUrlAvatar}
                  className="px-3 py-2 rounded bg-black hover:bg-black/90 text-white text-sm"
                >
                  Set URL
                </button>
              </div>
            )}
          </div>

          <button
            onClick={saveProfile}
            disabled={saving}
            className="col-span-full mt-1 bg-black hover:bg-black/90 text-white rounded px-4 py-2"
          >
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Existing content */}
      <h2 className="text-xl font-semibold mt-2">
        {fullName ? `${fullName}'s Profile` : `${user?.email || 'Guest'}'s Profile`}
      </h2>

      <div>
        <h3 className="text-md font-medium mb-2">Saved Businesses</h3>
        {favorites.length > 0 ? (
          <ul className="space-y-2">
            {favorites.map((biz, index) => (
              <li key={index} className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                {biz.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You haven't saved any businesses yet.
          </p>
        )}
      </div>

      <Link
        to="/suggest"
        className="block w-full text-center bg-black text-white px-4 py-2 rounded hover:bg-black/90 transition"
      >
        ➕ Suggest a Business
      </Link>

      {isAdmin && (
        <Link
          to="/admin"
          className="block w-full text-center bg-black text-white px-4 py-2 rounded hover:bg-black/90 transition"
        >
          🛠️ Admin Panel
        </Link>
      )}

      <a
        href="https://ablackweb.com"
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full text-center bg-black text-white px-4 py-2 rounded hover:bg-black/90 transition"
      >
        💬 Join the Community
      </a>

      <button
        onClick={handleLogout}
        className="w-full bg-black text-white text-sm py-2 rounded hover:bg-black/90"
      >
        Log Out
      </button>
    </div>
  );
};

export default ProfilePage;
