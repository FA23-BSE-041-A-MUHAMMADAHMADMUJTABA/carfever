import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CardCarSVG, HeartIcon } from '../../components/Icons';

export default function BuyerDashboard() {
  const { user } = useAuth();
  const { listings, wished, toggleWish, showToast } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  const [inquiries, setInquiries] = useState([]);
  const [contracts, setContracts] = useState([]);

  const wishedCars = listings.filter(c => wished[c.id]);

  const fetchDashboardData = async () => {
    try {
      const inqRes = await axios.get(`${API_BASE_URL}/inquiries/buyer/${user.id}`);
      setInquiries(inqRes.data);

      const contractRes = await axios.get(`${API_BASE_URL}/contracts?buyerId=${user.id}`);
      setContracts(contractRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, tab]);

  const handleWishlistToggle = async (carId, e) => {
    await toggleWish(carId, e);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <span>Buyer Panel</span>
        </div>
        <nav className="dashboard-nav">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>📊 Overview</button>
          <button className={tab === 'wishlist' ? 'active' : ''} onClick={() => setTab('wishlist')}>❤️ Wishlist ({wishedCars.length})</button>
          <button className={tab === 'inquiries' ? 'active' : ''} onClick={() => setTab('inquiries')}>💬 My Inquiries ({inquiries.length})</button>
          <button className={tab === 'contracts' ? 'active' : ''} onClick={() => setTab('contracts')}>
            📋 My Deals
            {contracts.filter(c => c.step === 3).length > 0 && (
              <span className="nav-badge nav-badge-amber">{contracts.filter(c => c.step === 3).length}</span>
            )}
          </button>
        </nav>
        <Link to="/" className="dashboard-back-link">← Back to Site</Link>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h2>
            {tab === 'overview' && 'Dashboard Overview'}
            {tab === 'wishlist' && 'My Wishlist'}
            {tab === 'inquiries' && 'My Inquiries'}
            {tab === 'contracts' && 'My Purchases & Contracts'}
          </h2>
          <div className="nav-user-menu">
            <div className="nav-user-avatar">{user.name.charAt(0)}</div>
            <span>{user.name}</span>
          </div>
        </div>

        <div className="dashboard-content">
          {tab === 'overview' && (
            <>
              <div className="admin-stats">
                <div className="admin-stat-card"><div className="admin-stat-label">Saved Cars</div><div className="admin-stat-value">{wishedCars.length}</div></div>
                <div className="admin-stat-card"><div className="admin-stat-label">Inquiries Sent</div><div className="admin-stat-value">{inquiries.length}</div></div>
                <div className="admin-stat-card"><div className="admin-stat-label">Replies Received</div><div className="admin-stat-value">{inquiries.filter(i => i.status === 'replied').length}</div></div>
                <div className="admin-stat-card"><div className="admin-stat-label">My Deals</div><div className="admin-stat-value">{contracts.length}</div></div>
              </div>
              <div className="admin-quick-actions">
                <div className="admin-action-card" onClick={() => navigate('/listings')}>
                  <div className="admin-action-icon">🔍</div>
                  <div><div className="admin-action-title">Browse Cars</div><div className="admin-action-desc">Find your perfect vehicle</div></div>
                </div>
                <div className="admin-action-card" onClick={() => setTab('wishlist')}>
                  <div className="admin-action-icon">❤️</div>
                  <div><div className="admin-action-title">View Wishlist</div><div className="admin-action-desc">{wishedCars.length} saved cars</div></div>
                </div>
                <div className="admin-action-card" onClick={() => setTab('contracts')}>
                  <div className="admin-action-icon">📋</div>
                  <div><div className="admin-action-title">My Purchases</div><div className="admin-action-desc">{contracts.filter(c => c.status !== 'completed').length} active deals</div></div>
                </div>
              </div>
            </>
          )}

          {tab === 'wishlist' && (
            <div className="car-grid" style={{ padding: '0' }}>
              {wishedCars.length === 0 ? (
                <div className="empty-state" style={{ gridColumn: '1/-1', padding: 40 }}>
                  <h3>Your wishlist is empty</h3>
                  <p>Browse cars and click the heart icon to save them here</p>
                  <button className="btn-solid" onClick={() => navigate('/listings')}>Browse Cars</button>
                </div>
              ) : wishedCars.map(car => (
                <div className="car-card" key={car.id} onClick={() => navigate(`/car/${car.id}`)}>
                  <div className="car-card-image">
                    <CardCarSVG type={car.bodyType === 'SUV' ? 'suv' : 'sedan'} />
                    <button className="wishlist-btn wished" onClick={(e) => handleWishlistToggle(car.id, e)}><HeartIcon filled /></button>
                  </div>
                  <div className="car-card-body">
                    <div className="car-card-make">{car.make}</div>
                    <div className="car-card-model">{car.model}</div>
                    <div className="car-card-footer">
                      <span className="car-card-price">£{car.price.toLocaleString()}</span>
                      <span className="car-card-city">📍 {car.city}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'inquiries' && (
            <div className="inquiries-list">
              {inquiries.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><h3>No inquiries yet</h3><p>Message sellers from car detail pages to start conversations</p><button className="btn-solid" onClick={() => navigate('/listings')}>Browse Cars</button></div>
              ) : inquiries.map(inq => {
                const car = listings.find(c => c.id === inq.carId);
                return (
                  <div key={inq.id} className="inquiry-card">
                    <div className="inquiry-header">
                      <div className="seller-avatar">{user.name.charAt(0)}</div>
                      <div><strong>You</strong><span className="inquiry-date">{inq.createdAt}</span></div>
                      <span className={`status-pill status-${inq.status}`}>{inq.status}</span>
                    </div>
                    <div className="inquiry-car-ref" onClick={() => car && navigate(`/car/${car.id}`)} style={{ cursor: 'pointer' }}>
                      Re: {car ? `${car.make} ${car.model} — £${car.price.toLocaleString()}` : 'Unknown car'}
                    </div>
                    <div className="inquiry-message">{inq.message}</div>
                    {inq.reply && <div className="inquiry-reply"><strong>Seller replied:</strong> {inq.reply}</div>}
                    {!inq.reply && <div className="inquiry-waiting">Waiting for seller response...</div>}
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'contracts' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <span className="admin-table-title">My Purchase Contracts ({contracts.length})</span>
              </div>
              {contracts.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <h3>No purchase contracts initiated</h3>
                  <p>You can start a purchase by clicking "Buy Car" on any car detail page.</p>
                  <button className="btn-solid" onClick={() => navigate('/listings')}>Browse Cars</button>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>Car Listing</th><th>Proposed Price</th><th>Stage</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {contracts.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.make} {c.model}</strong> ({c.year})</td>
                        <td style={{ fontWeight: 700 }}>£{c.price.toLocaleString()}</td>
                        <td>Step {c.step}/4</td>
                        <td>
                          <span className={`status-pill status-${
                            c.status === 'completed' ? 'active' :
                            c.status === 'initiated' ? 'pending' : 'replied'
                          }`}>
                            {c.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button className="table-action-btn table-action-view" onClick={() => navigate(`/buyer/contract/${c.id}`)}>
                            {c.step === 3 ? '✍ Finalize & Sign' : 'View Contract'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
