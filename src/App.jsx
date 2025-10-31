// src/App.jsx
import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

import Home from './pages/Home';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import VisitorAuth from './pages/VisitorAuth';

import AdminPage from './pages/AdminPage';
import AdminReviewPage from './pages/AdminReviewPage';
import AddBusinessPage from './pages/AddBusinessPage';
import EditBusinessPage from './pages/EditBusinessPage';

import BusinessDetail from './pages/BusinessDetail';
import AddReviewPage from './pages/AddReviewPage';

import CategoryPage from './pages/CategoryPage';
import MoreCategories from './pages/MoreCategories';
import MorePage from './pages/MorePage';
import SuggestBusinessPage from './pages/SuggestBusinessPage';
import AdvertiseRequestPage from './pages/AdvertiseRequestPage';

import BottomNavBar from './components/BottomNavBar';

const RouterImpl = Capacitor.isNativePlatform() ? HashRouter : BrowserRouter;
const NAV_HEIGHT_PX = 64;

export default function App() {
  // light (white) system bars, dark icons, and do not overlay the webview
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const initBars = async () => {
      try {
        await StatusBar.setBackgroundColor({ color: '#ffffff' });
        await StatusBar.setStyle({ style: Style.Dark });
        if (StatusBar.setOverlaysWebView) {
          await StatusBar.setOverlaysWebView({ overlay: false });
        }
      } catch (err) {
        // harmless on web/older devices where plugin isn't available
        // keep a statement in here to satisfy eslint(no-empty)
        if (import.meta.env.DEV) console.debug('[StatusBar] init skipped:', err);
      }
    };

    initBars();
  }, []);

  // Edge-swipe back/forward (starts at screen edges to avoid conflicts)
  useEffect(() => {
    const EDGE = 24;   // px from left/right edge
    const THRESH = 60; // horizontal distance to trigger
    const MAX_VY = 30; // vertical movement cancels

    let startX = 0, startY = 0, tracking = false, fromLeft = false, fromRight = false;

    const onStart = (e) => {
      if (e.touches?.length !== 1) return;
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      fromLeft  = startX <= EDGE;
      fromRight = startX >= (window.innerWidth - EDGE);
      tracking = fromLeft || fromRight;
    };

    const onMove = (e) => {
      if (!tracking) return;
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = Math.abs(t.clientY - startY);
      if (dy > MAX_VY) { tracking = false; return; }

      if (fromLeft && dx > THRESH) {
        window.history.back();
        tracking = false;
      } else if (fromRight && dx < -THRESH) {
        window.history.forward();
        tracking = false;
      }
    };

    const onEnd = () => { tracking = false; };

    window.addEventListener('touchstart', onStart, { passive: true });
    window.addEventListener('touchmove',  onMove,  { passive: true });
    window.addEventListener('touchend',   onEnd,   { passive: true });
    window.addEventListener('touchcancel', onEnd);

    return () => {
      window.removeEventListener('touchstart', onStart);
      window.removeEventListener('touchmove',  onMove);
      window.removeEventListener('touchend',   onEnd);
      window.removeEventListener('touchcancel', onEnd);
    };
  }, []);

  return (
    <RouterImpl>
      {/* Paint the status area solid white */}
      <div
        aria-hidden
        className="fixed top-0 inset-x-0 bg-white pointer-events-none"
        style={{ height: 'var(--safe-top)', zIndex: 40 }}
      />

      <div
        className="min-h-screen bg-white text-black"
        style={{
          paddingTop: 'var(--safe-top)',                                   // below status area
          paddingBottom: `calc(${NAV_HEIGHT_PX}px + var(--safe-bottom))`,  // above gesture area
        }}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/profile-page" element={<ProfilePage />} />
          <Route path="/login" element={<VisitorAuth />} />

          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin-review" element={<AdminReviewPage />} />
          <Route path="/admin/create" element={<AddBusinessPage />} />
          <Route path="/admin/edit/:id" element={<EditBusinessPage />} />

          <Route path="/business/:id" element={<BusinessDetail />} />
          <Route path="/business/:id/review" element={<AddReviewPage />} />

          <Route path="/categories" element={<CategoryPage />} />
          <Route path="/more-categories" element={<MoreCategories />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="/suggest" element={<SuggestBusinessPage />} />
          <Route path="/advertise" element={<AdvertiseRequestPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* Bottom nav (positioned above the gesture bar by paddingBottom above) */}
        <BottomNavBar />
      </div>

      {/* Paint the gesture safe-area solid white so nothing shows through */}
      <div
        aria-hidden
        className="fixed bottom-0 inset-x-0 bg-white pointer-events-none"
        style={{ height: 'var(--safe-bottom)', zIndex: 40 }}
      />
    </RouterImpl>
  );
}
