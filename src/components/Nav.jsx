import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export default function Nav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      let threshold = 60;
      if (location.pathname === '/') {
        const isMobile = window.innerWidth <= 768;
        const heroHeight = window.innerHeight * (isMobile ? 2 : 3);
        threshold = heroHeight - 80;
      }
      setScrolled(window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  const isHome = location.pathname === '/';

  const getDashLink = () => {
    if (!user) return null;
    if (user.role === 'seller') return '/seller';
    if (user.role === 'buyer') return '/buyer';
    if (user.role === 'admin') return '/admin';
    return null;
  };

  return (
    <nav className={`nav${scrolled || !isHome ? ' scrolled' : ''}`}>
      <Link to="/" className="nav-logo">
        <img src={logoImg} alt="carFever" className="nav-logo-img" />
        <span>car<em>Fever</em></span>
      </Link>

      <button className={`mobile-menu-btn${mobileOpen ? ' open' : ''}`} onClick={() => setMobileOpen(!mobileOpen)} aria-label="Menu">
        <span /><span /><span />
      </button>

      <ul className={`nav-links${mobileOpen ? ' open' : ''}`}>
        <li><NavLink to="/" onClick={() => setMobileOpen(false)} end>Home</NavLink></li>
        <li><NavLink to="/listings" onClick={() => setMobileOpen(false)}>Buy</NavLink></li>
        {user && getDashLink() && (
          <li><NavLink to={getDashLink()} onClick={() => setMobileOpen(false)}>Dashboard</NavLink></li>
        )}
        {!user && <li><NavLink to="/admin/login" onClick={() => setMobileOpen(false)}>Admin</NavLink></li>}
        
        {/* Mobile menu only action items */}
        <li className="mobile-only-actions">
          {user ? (
            <div className="nav-user-menu-mobile">
              <div className="nav-user-avatar">{user.name.charAt(0)}</div>
              <span className="nav-user-name">{user.name}</span>
              <button className="nav-logout-btn" onClick={() => { logout(); setMobileOpen(false); navigate('/'); }}>Logout</button>
            </div>
          ) : (
            <div className="nav-mobile-buttons">
              <NavLink to="/login" onClick={() => setMobileOpen(false)} className="nav-login-btn">Sign In</NavLink>
              <NavLink to="/register" onClick={() => setMobileOpen(false)} className="nav-sell-btn">Sell Your Car</NavLink>
            </div>
          )}
        </li>
      </ul>

      <div className="nav-actions">
        {user ? (
          <div className="nav-user-menu">
            <div className="nav-user-avatar">{user.name.charAt(0)}</div>
            <span className="nav-user-name">{user.name}</span>
            <button className="nav-logout-btn" onClick={() => { logout(); navigate('/'); }}>Logout</button>
          </div>
        ) : (
          <>
            <NavLink to="/login" className="nav-login-btn">Sign In</NavLink>
            <NavLink to="/register" className="nav-sell-btn">Sell Your Car</NavLink>
          </>
        )}
      </div>
    </nav>
  );
}
