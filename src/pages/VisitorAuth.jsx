// src/pages/VisitorAuth.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';

export default function VisitorAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);        // ← source of truth for UI
  const [isAdmin, setIsAdmin] = useState(false); // ← for Admin CTA
  const navigate = useNavigate();

  // 1) On mount, load current session & user
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session ?? null;
      if (session?.user) {
        setUser(session.user);
        const stored = localStorage.getItem('is_admin');
        if (stored === 'true' || stored === 'false') {
          setIsAdmin(stored === 'true');
        } else {
          // fetch once to seed localStorage
          await refreshAdminFlag(session.user.id);
        }
      }
    })();

    // 2) Stay in sync with auth state changes (tokens refresh, signout elsewhere, etc.)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, session) => {
      if (session?.user) {
        setUser(session.user);
        await refreshAdminFlag(session.user.id);
      } else {
        // signed out
        setUser(null);
        setIsAdmin(false);
        localStorage.removeItem('user');
        localStorage.setItem('is_admin', 'false');
        window.dispatchEvent(new Event('admin-updated'));
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Helper: fetch admin flag and update storage/UI
  const refreshAdminFlag = async (userId) => {
    try {
      let admin = false;
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (!profileErr && profile) admin = !!profile.is_admin;

      localStorage.setItem('is_admin', admin ? 'true' : 'false');
      setIsAdmin(admin);
      // Let the navbar update immediately
      window.dispatchEvent(new Event('admin-updated'));
    } catch {
      localStorage.setItem('is_admin', 'false');
      setIsAdmin(false);
      window.dispatchEvent(new Event('admin-updated'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setLoading(true);

    try {
      // Sign Up flow
      if (isSignUp) {
        const { error: signUpErr } = await supabase.auth.signUp({ email, password });
        if (signUpErr) {
          setError(signUpErr.message);
          return;
        }
        setInfo('Check your email to confirm your account, then log in.');
        return;
      }

      // Log In flow
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
      if (signInErr) {
        setError(signInErr.message);
        return;
      }

      // Verify session actually exists
      const { data: sess } = await supabase.auth.getSession();
      const session = sess?.session ?? null;
      if (!session?.user) {
        setError('Login failed: no session returned (check credentials / email confirmation / env vars).');
        return;
      }

      // Persist basic user info for the rest of your app (non-Supabase-aware parts)
      localStorage.setItem('user', JSON.stringify(session.user));

      // Seed admin flag + update UI
      await refreshAdminFlag(session.user.id);

      // Reflect logged-in state immediately on this screen
      setUser(session.user);
      setInfo('You are logged in.');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const [isSignUp, setIsSignUp] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    // onAuthStateChange will clean up UI/localStorage
  };

  // ----- UI -----
  if (user) {
    // Logged-in panel (no redirect)
    return (
      <div className="p-6 space-y-4 max-w-md mx-auto bg-white text-black">
        <h2 className="text-xl font-semibold text-center">Account</h2>

        {info && (
          <div className="bg-green-100 text-green-800 text-sm px-4 py-2 rounded border border-green-200">
            {info}
          </div>
        )}

        <div className="rounded-2xl border border-black/10 p-4">
          <p className="text-sm">
            Signed in as <span className="font-medium">{user.email || user.id}</span>
          </p>
          <p className="text-sm mt-1">Admin: <span className="font-medium">{isAdmin ? 'Yes' : 'No'}</span></p>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700"
            onClick={() => navigate('/')}
          >
            Go Home
          </button>

          {isAdmin && (
            <button
              className="w-full bg-black text-white px-4 py-2 rounded-xl hover:bg-black/90"
              onClick={() => navigate('/admin')}
            >
              Go to Admin
            </button>
          )}

          <button
            className="w-full bg-white text-black border border-black/15 px-4 py-2 rounded-xl"
            onClick={handleSignOut}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  // Logged-out form
  return (
    <div className="p-6 space-y-4 max-w-md mx-auto bg-white text-black">
      <h2 className="text-xl font-semibold text-center">
        {isSignUp ? 'Sign Up' : 'Log In'}
      </h2>

      {error && (
        <div className="bg-red-100 text-red-800 text-sm px-4 py-2 rounded border border-red-200">
          {error}
        </div>
      )}
      {info && (
        <div className="bg-green-100 text-green-800 text-sm px-4 py-2 rounded border border-green-200">
          {info}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-11 px-3 rounded-xl bg-white text-black border border-black/15 placeholder-black/50"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full h-11 px-3 rounded-xl bg-white text-black border border-black/15 placeholder-black/50"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? isSignUp
              ? 'Creating Account…'
              : 'Logging In…'
            : isSignUp
            ? 'Create Account'
            : 'Log In'}
        </button>
      </form>

      <p className="text-sm text-center">
        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
        <button
          type="button"
          onClick={() => { setIsSignUp(!isSignUp); setError(''); setInfo(''); }}
          className="text-blue-600 hover:underline"
        >
          {isSignUp ? 'Log In' : 'Sign Up'}
        </button>
      </p>
    </div>
  );
}
