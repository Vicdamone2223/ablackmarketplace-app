// src/components/BottomNavBar.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaEllipsisH, FaHome, FaUser, FaClipboardList } from 'react-icons/fa';

const NAV_HEIGHT_PX = 64;

const BottomNavBar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const storedIsAdmin = localStorage.getItem('is_admin');
    setIsAdmin(storedIsAdmin === 'true');
    const onStorage = (e) => e.key === 'is_admin' && setIsAdmin(e.newValue === 'true');
    const onAdminEvent = () => setIsAdmin(localStorage.getItem('is_admin') === 'true');
    window.addEventListener('storage', onStorage);
    window.addEventListener('admin-updated', onAdminEvent);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('admin-updated', onAdminEvent);
    };
  }, []);

  const handleHomeClick = () => {
    window.dispatchEvent(new Event('resetHomeFilters'));
    navigate('/');
  };

  const navItems = [
    { icon: <FaEllipsisH />, path: '/more', label: 'More' },
    { icon: <FaHome />, path: '/', label: 'Home', onClick: handleHomeClick },
    { icon: <FaUser />, path: '/profile-page', label: 'Profile' },
  ];
  if (isAdmin) navItems.push({ icon: <FaClipboardList />, path: '/admin', label: 'Admin' });

  return (
    <nav
      role="navigation"
      aria-label="Bottom navigation"
      className="fixed inset-x-0 z-50 bg-white border-t border-black/10"
      style={{
        bottom: 'var(--safe-bottom)',          // ⬅ sits above gesture area
        height: `${NAV_HEIGHT_PX}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {navItems.map((item, idx) => {
        const active =
          item.path === '/'
            ? pathname === '/'
            : pathname === item.path || pathname.startsWith(item.path + '/');
        const base = 'flex flex-col items-center gap-0.5 text-xs transition-colors';
        const state = active ? 'text-blue-600' : 'text-black';
        const Inner = (
          <>
            <div className="text-xl leading-none">{item.icon}</div>
            <span className="leading-none">{item.label}</span>
          </>
        );
        return item.onClick ? (
          <button key={idx} onClick={item.onClick} className={`${base} ${state}`}>
            {Inner}
          </button>
        ) : (
          <Link key={idx} to={item.path} className={`${base} ${state}`}>
            {Inner}
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;
