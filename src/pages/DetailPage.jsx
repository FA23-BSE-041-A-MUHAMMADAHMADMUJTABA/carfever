import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useApp } from '../context/AppContext';
import { useAuth, API_BASE_URL } from '../context/AuthContext';
import { HeartIcon, PhoneIcon, CardCarSVG } from '../components/Icons';

export default function DetailPage() {
  const { listings, wished, toggleWish, showToast } = useApp();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const car = listings.find(c => c.id === id);
  const [message, setMessage] = useState('');
  const [activeDeal, setActiveDeal] = useState(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  const mediaList = car ? [
    ...(car.images || []).map(url => ({ type: 'image', url })),
    ...(car.videos || []).map(url => ({ type: 'video', url }))
  ] : [];

  // Contract initiation modal state
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [submittingDeal, setSubmittingDeal] = useState(false);

  // Fetch active contract if user is buyer
  useEffect(() => {
    const fetchActiveContract = async () => {
      if (user && user.role === 'buyer' && car) {
        try {
          const res = await axios.get(`${API_BASE_URL}/contracts?buyerId=${user.id}`);
          const matching = res.data.find(c => c.carId === car.id);
          if (matching) {
            setActiveDeal(matching);
          }
        } catch (err) {
          console.error('Error fetching contracts:', err);
        }
      }
    };
    fetchActiveContract();
  }, [user, car]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [id]);

  // Log listing views
  useEffect(() => {
    if (car) {
      axios.post(`${API_BASE_URL}/listings/${car.id}/view`).catch(err => {
        console.error('Failed to log view:', err);
      });
    }
  }, [car]);

  if (!car) {
    return (
      <div className="container" style={{ padding: '120px 0', textAlign: 'center' }}>
        <h2>Car not found</h2>
        <Link to="/listings" className="btn-solid" style={{ marginTop: 16, display: 'inline-block' }}>Browse Cars</Link>
      </div>
    );
  }

  const scores = car.scores || { engine: 90, exterior: 85, interior: 92, trans: 88 };
  const scoreColor = (v) => v >= 85 ? 'green' : 'amber';

  const handleInquiry = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!message.trim()) {
      showToast('Please write a message');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/inquiries`, {
        carId: car.id,
        buyerId: user.id,
        buyerName: user.name,
        sellerId: car.sellerId,
        message: message.trim()
      });
      setMessage('');
      showToast('Message sent to seller! ✓');
    } catch (err) {
      showToast(err.response?.data?.error || 'Error sending message');
    }
  };

  const handleWishlistToggle = async (e) => {
    const res = await toggleWish(car.id, e);
    if (res?.loginRequired) {
      navigate('/login');
    }
  };

  const handleInitiateDeal = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!buyerPhone.trim() || !buyerAddress.trim()) {
      showToast('Please provide your phone number and address');
      return;
    }

    setSubmittingDeal(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/contracts`, {
        carId: car.id,
        buyerId: user.id,
        buyerName: user.name,
        buyerEmail: user.email,
        buyerPhone: buyerPhone.trim(),
        buyerAddress: buyerAddress.trim()
      });
      showToast('Purchase contract initiated! ✓');
      setShowBuyModal(false);
      navigate(`/buyer/contract/${res.data.id}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Error starting purchase contract');
    } finally {
      setSubmittingDeal(false);
    }
  };

  return (
    <div className="detail-page">
      <div className={`detail-hero${mediaList.length > 0 ? ' has-media' : ''}`}>
        {mediaList.length > 0 ? (
          <div className="detail-hero-slider">
            <div className="detail-slider-media">
              {mediaList[activeMediaIndex].type === 'image' ? (
                <img src={mediaList[activeMediaIndex].url} alt={`${car.make} ${car.model}`} />
              ) : (
                <video src={mediaList[activeMediaIndex].url} controls playsInline />
              )}
            </div>

            {mediaList.length > 1 && (
              <>
                <button 
                  type="button"
                  className="detail-slider-btn detail-slider-btn-prev" 
                  onClick={() => setActiveMediaIndex(prev => (prev - 1 + mediaList.length) % mediaList.length)}
                >
                  ‹
                </button>
                <button 
                  type="button"
                  className="detail-slider-btn detail-slider-btn-next" 
                  onClick={() => setActiveMediaIndex(prev => (prev + 1) % mediaList.length)}
                >
                  ›
                </button>

                <div className="detail-slider-dots">
                  {mediaList.map((_, idx) => (
                    <button 
                      type="button"
                      key={idx} 
                      className={`detail-slider-dot${activeMediaIndex === idx ? ' active' : ''}`}
                      onClick={() => setActiveMediaIndex(idx)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <CardCarSVG type={car.bodyType === 'SUV' ? 'suv' : 'sedan'} />
        )}
      </div>

      {/* Workflow timeline tracker */}
      <div className="workflow-tracker">
        <div className="container">
          <div className="workflow-steps">
            {[
              { label: 'Found', done: true },
              { label: 'Inspecting', done: true },
              { label: 'Contact', done: true },
              { label: 'Deal / Contract', done: activeDeal ? true : false, current: !activeDeal },
              { label: 'Drive', done: activeDeal?.status === 'completed' }
            ].map((step, i) => (
              <div key={step.label} className="workflow-step">
                <div className="workflow-step-wrap">
                  <div className={`workflow-circle ${step.done ? 'done' : step.current ? 'current' : 'pending'}`}>
                    {step.done ? '✓' : i + 1}
                  </div>
                  <span className="workflow-label">{step.label}</span>
                </div>
                {i < 4 && <div className={`workflow-line${step.done ? ' done' : ''}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="detail-content" style={{ paddingTop: 48 }}>
          <div>
            <div className="detail-breadcrumb">
              <Link to="/">Home</Link> / <Link to="/listings">Listings</Link> / {car.make} / {car.model}
            </div>
            <h1 className="detail-model-name">{car.make} {car.model}</h1>
            <div className="detail-tags">
              {car.verified && <span className="detail-tag detail-tag-verified">✓ Verified Seller</span>}
              {car.badges?.includes('featured') && <span className="detail-tag detail-tag-featured">★ Featured</span>}
              {car.inspected && <span className="detail-tag detail-tag-inspected">⊙ Inspected</span>}
            </div>

            <div className="detail-specs-grid">
              {[
                { label: 'Mileage', value: `${car.mileage.toLocaleString()} mi` },
                { label: 'Transmission', value: car.trans },
                { label: 'Fuel Type', value: car.fuel },
                { label: 'Engine', value: car.engine },
                { label: 'Colour', value: car.color },
                { label: 'Registered', value: `${car.year} (${car.year % 100} Plate)` },
              ].map(spec => (
                <div key={spec.label} className="detail-spec-cell">
                  <div className="detail-spec-label">{spec.label}</div>
                  <div className="detail-spec-value">{spec.value}</div>
                </div>
              ))}
            </div>

            <div className="detail-description">
              <h3>Description</h3>
              <p>{car.description || `Stunning ${car.year} ${car.make} ${car.model} finished in ${car.color}. Full service history, one previous owner. Excellent condition throughout.`}</p>
            </div>

            <div className="key-features">
              <h3>Key Features</h3>
              <div className="features-pills">
                {(car.features || ['Heated Seats', 'Sat Nav', 'Parking Sensors', 'Bluetooth', 'Cruise Control', 'LED Headlights']).map(f => (
                  <span key={f} className="feature-pill">{f}</span>
                ))}
              </div>
            </div>

            <div className="inspection-report">
              <h3>Inspection Report</h3>
              <div className="inspection-scores">
                {[
                  { label: 'Engine', score: scores.engine },
                  { label: 'Exterior', score: scores.exterior },
                  { label: 'Interior', score: scores.interior },
                  { label: 'Transmission', score: scores.trans },
                ].map(item => (
                  <div key={item.label} className="inspection-score">
                    <div className="inspection-bar-bg">
                      <div className={`inspection-bar-fill ${scoreColor(item.score)}`} style={{ width: `${item.score}%` }} />
                    </div>
                    <div className={`inspection-score-val ${scoreColor(item.score)}`}>{item.score}%</div>
                    <div className="inspection-score-label">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="contact-card">
              <div className="contact-price-section">
                <div className="contact-price-label">Asking Price</div>
                <div className="contact-price">£{car.price.toLocaleString()}</div>
              </div>
              <div className="contact-seller-section">
                <div className="seller-info">
                  <div className="seller-avatar">{(car.sellerName || 'S').charAt(0)}</div>
                  <div>
                    <div className="seller-name">{car.sellerName}</div>
                    <div className="seller-type">{car.sellerType} Seller</div>
                  </div>
                </div>
                {car.verified && <div className="seller-verified-tag">✓ Verified</div>}
                <div className="seller-meta">Listed {car.createdAt} · {car.views || 0} views</div>
              </div>
              
              <div className="contact-actions">
                {/* Contract Deal purchase buttons */}
                {car.status === 'sold' ? (
                  <div className="sold-badge-large" style={{ background: '#d9534f', color: '#fff', textAlign: 'center', padding: 12, borderRadius: 6, fontWeight: 700, marginBottom: 10 }}>
                    SOLD OUT
                  </div>
                ) : activeDeal ? (
                  <button className="btn-send" style={{ background: 'var(--mm-blue)', marginBottom: 10 }} onClick={() => navigate(`/buyer/contract/${activeDeal.id}`)}>
                    View Active Contract (Step {activeDeal.step}/4)
                  </button>
                ) : user?.role === 'seller' ? (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', marginBottom: 10, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                    You are listed as the seller of this vehicle.
                  </div>
                ) : user?.role === 'admin' ? (
                  <div style={{ textAlign: 'center', fontSize: '0.85rem', color: '#888', marginBottom: 10, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                    Logged in as Admin.
                  </div>
                ) : (
                  <button className="btn-send" style={{ background: 'var(--mm-green)', marginBottom: 10 }} onClick={() => {
                    if (!user) { navigate('/login'); }
                    else { setShowBuyModal(true); }
                  }}>
                    {user ? 'Buy Car / Start Contract' : 'Sign In to Buy'}
                  </button>
                )}

                <button className="btn-call"><PhoneIcon /> Call Seller</button>
                <textarea className="contact-textarea" placeholder="Hi, I'm interested in this car. Is it still available?" value={message} onChange={e => setMessage(e.target.value)} />
                <button className="btn-send" onClick={handleInquiry}>
                  {user ? 'Send Message' : 'Sign In to Message'}
                </button>
                <button className="btn-save-wishlist" onClick={handleWishlistToggle}>
                  <HeartIcon filled={wished[car.id]} /> Save to Wishlist
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Cars Section */}
        <div style={{ paddingBottom: 60 }}>
          <div className="section-header reveal">
            <div>
              <div className="section-label">Similar</div>
              <h2 className="section-heading">You May Also Like</h2>
            </div>
          </div>
          <div className="car-grid reveal">
            {listings.filter(c => c.id !== car.id && c.status === 'active').slice(0, 4).map(c => (
              <div className="car-card" key={c.id} onClick={() => navigate(`/car/${c.id}`)}>
                <div className="car-card-image"><CardCarSVG type={c.bodyType === 'SUV' ? 'suv' : 'sedan'} /></div>
                <div className="car-card-body">
                  <div className="car-card-make">{c.make}</div>
                  <div className="car-card-model">{c.model}</div>
                  <div className="car-card-footer">
                    <span className="car-card-price">£{c.price.toLocaleString()}</span>
                    <span className="car-card-city">📍 {c.city}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Buy/Initiate Contract Modal overlay */}
      {showBuyModal && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-card" style={{ background: 'var(--mm-white)', borderRadius: 12, padding: 30, width: 450, color: 'var(--mm-ink)', border: '1px solid var(--mm-silver-light)' }}>
            <h3 style={{ margin: '0 0 16px 0', borderBottom: '1px solid var(--mm-silver-light)', paddingBottom: 8 }}>Initiate Deal Agreement</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--mm-steel)', marginBottom: 20 }}>
              Provide your details to generate the platform contract for buying the **{car.make} {car.model}** at **£{car.price.toLocaleString()}**.
            </p>
            <form onSubmit={handleInitiateDeal}>
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phone Number</label>
                <input type="text" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} required placeholder="e.g. +44 7700 900077" style={{ background: '#fff', border: '1px solid #ccc', color: '#111' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Home / Delivery Address</label>
                <input type="text" value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} required placeholder="e.g. 10 Baker Street, London" style={{ background: '#fff', border: '1px solid #ccc', color: '#111' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" className="btn-outline" onClick={() => setShowBuyModal(false)} style={{ border: '1px solid #ccc' }}>Cancel</button>
                <button type="submit" className="btn-solid" disabled={submittingDeal}>
                  {submittingDeal ? 'Creating...' : 'Submit details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
