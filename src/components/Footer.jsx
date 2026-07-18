import { Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="nav-logo" style={{ color: 'var(--mm-white)', marginBottom: 0 }}>
              <img src={logoImg} alt="carFever" className="nav-logo-img" style={{ height: 32 }} />
              <span>car<em>Fever</em></span>
            </div>
            <p className="footer-brand-desc">
              The UK's most trusted automotive marketplace. Connecting buyers and sellers since 2024 — with verified listings, transparent pricing, and a premium experience.
            </p>
            <div className="footer-socials">
              {['f', 'in', 'tw', 'ig'].map(s => (
                <a key={s} href="#" className="footer-social">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14 }}>
                    <circle cx="8" cy="8" r="6" />
                    <text x="8" y="11" textAnchor="middle" fontSize="7" fill="currentColor" stroke="none">{s}</text>
                  </svg>
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="footer-col-title">Marketplace</div>
            <ul className="footer-links">
              {['Browse Cars', 'Sell Your Car', 'Car Finance', 'Car Insurance', 'MOT Check', 'Vehicle History'].map(link => (
                <li key={link}><Link to="/listings">{link}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Sell</div>
            <ul className="footer-links">
              {['List for Free', 'Dealer Accounts', 'Featured Listings', 'Pricing Plans', 'Seller Dashboard', 'Success Stories'].map(link => (
                <li key={link}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="footer-col-title">Company</div>
            <ul className="footer-links">
              {['About Us', 'Careers', 'Press', 'Blog', 'Contact', 'Terms & Privacy'].map(link => (
                <li key={link}><a href="#">{link}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© 2026 carFever Ltd. All rights reserved.</span>
          <span className="footer-cities">London · Manchester · Birmingham · Leeds · Edinburgh · Glasgow · Bristol · Liverpool</span>
        </div>
      </div>
    </footer>
  );
}
