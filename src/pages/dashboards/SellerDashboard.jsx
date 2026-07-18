import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CardCarSVG } from '../../components/Icons';

export default function SellerDashboard() {
  const { user } = useAuth();
  const { listings, showToast, refreshListings } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  
  const [inquiries, setInquiries] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [replyText, setReplyText] = useState({});

  const myListings = listings.filter(c => c.sellerId === user.id);
  const activeCount = myListings.filter(c => c.status === 'active').length;
  const pendingCount = myListings.filter(c => c.status === 'pending').length;
  const totalViews = myListings.reduce((s, c) => s + (c.views || 0), 0);

  const fetchDashboardData = async () => {
    try {
      const inqRes = await axios.get(`${API_BASE_URL}/inquiries/seller/${user.id}`);
      setInquiries(inqRes.data);

      const contractRes = await axios.get(`${API_BASE_URL}/contracts?sellerId=${user.id}`);
      setContracts(contractRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, tab]);

  const handleReply = async (inqId) => {
    if (!replyText[inqId]?.trim()) return;
    try {
      await axios.post(`${API_BASE_URL}/inquiries/${inqId}/reply`, {
        reply: replyText[inqId].trim()
      });
      showToast('Reply sent! ✓');
      setReplyText(p => ({ ...p, [inqId]: '' }));
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to send reply');
    }
  };

  const handleDeleteListing = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/listings/${carId}`);
      showToast('Listing deleted');
      refreshListings();
    } catch (err) {
      showToast('Failed to delete listing');
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-sidebar">
        <div className="dashboard-sidebar-header">
          <span>Seller Panel</span>
        </div>
        <nav className="dashboard-nav">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>📊 Overview</button>
          <button className={tab === 'listings' ? 'active' : ''} onClick={() => setTab('listings')}>🚗 My Listings</button>
          <button className={tab === 'add' ? 'active' : ''} onClick={() => setTab('add')}>➕ Add Listing</button>
          <button className={tab === 'inquiries' ? 'active' : ''} onClick={() => setTab('inquiries')}>
            💬 Inquiries
            {inquiries.filter(i => i.status === 'pending').length > 0 && (
              <span className="nav-badge nav-badge-amber">{inquiries.filter(i => i.status === 'pending').length}</span>
            )}
          </button>
          <button className={tab === 'contracts' ? 'active' : ''} onClick={() => setTab('contracts')}>
            📋 Deals & Contracts
            {contracts.filter(c => c.step === 2).length > 0 && (
              <span className="nav-badge nav-badge-amber">{contracts.filter(c => c.step === 2).length}</span>
            )}
          </button>
        </nav>
        <Link to="/" className="dashboard-back-link">← Back to Site</Link>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h2>
            {tab === 'overview' && 'Dashboard Overview'}
            {tab === 'listings' && 'My Listings'}
            {tab === 'add' && 'Add New Listing'}
            {tab === 'inquiries' && 'Inquiries'}
            {tab === 'contracts' && 'Deals & Sales Contracts'}
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
                <div className="admin-stat-card"><div className="admin-stat-label">Active Listings</div><div className="admin-stat-value">{activeCount}</div></div>
                <div className="admin-stat-card"><div className="admin-stat-label">Pending Review</div><div className="admin-stat-value">{pendingCount}</div></div>
                <div className="admin-stat-card"><div className="admin-stat-label">Total Views</div><div className="admin-stat-value">{totalViews.toLocaleString()}</div></div>
                <div className="admin-stat-card"><div className="admin-stat-label">Total Deals</div><div className="admin-stat-value">{contracts.length}</div></div>
              </div>
              <div className="admin-quick-actions">
                <div className="admin-action-card" onClick={() => setTab('add')}>
                  <div className="admin-action-icon">➕</div>
                  <div><div className="admin-action-title">Add New Listing</div><div className="admin-action-desc">Create a new car listing</div></div>
                </div>
                <div className="admin-action-card" onClick={() => setTab('inquiries')}>
                  <div className="admin-action-icon">💬</div>
                  <div><div className="admin-action-title">View Inquiries</div><div className="admin-action-desc">{inquiries.filter(i => i.status === 'pending').length} pending messages</div></div>
                </div>
                <div className="admin-action-card" onClick={() => setTab('contracts')}>
                  <div className="admin-action-icon">📋</div>
                  <div><div className="admin-action-title">Sales Contracts</div><div className="admin-action-desc">{contracts.filter(c => c.status !== 'completed').length} active deals</div></div>
                </div>
              </div>
            </>
          )}

          {tab === 'listings' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <span className="admin-table-title">My Listings ({myListings.length})</span>
                <button className="btn-approve-all" onClick={() => setTab('add')}>+ Add New</button>
              </div>
              {myListings.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <h3>No listings yet</h3>
                  <p>Start selling by adding your first car listing</p>
                  <button className="btn-solid" onClick={() => setTab('add')}>Add Listing</button>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>Vehicle</th><th>Price</th><th>Views</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {myListings.map(car => (
                      <tr key={car.id}>
                        <td><div className="table-listing-info"><div className="table-thumb"><CardCarSVG type={car.bodyType === 'SUV' ? 'suv' : 'sedan'} /></div><div><div className="table-listing-name">{car.make} {car.model}</div><div className="table-listing-id">{car.year} · {car.city}</div></div></div></td>
                        <td style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, color: 'var(--mm-ink)' }}>£{car.price.toLocaleString()}</td>
                        <td>{car.views || 0}</td>
                        <td><span className={`status-pill status-${car.status}`}>{car.status.charAt(0).toUpperCase() + car.status.slice(1)}</span></td>
                        <td>
                          <div className="table-actions">
                            <button className="table-action-btn table-action-view" onClick={() => navigate(`/car/${car.id}`)}>View</button>
                            <button className="table-action-btn table-action-reject" onClick={() => handleDeleteListing(car.id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'add' && <AddListingForm userId={user.id} userName={user.name} onComplete={() => { setTab('listings'); showToast('Listing submitted for review! ✓'); refreshListings(); }} />}

          {tab === 'inquiries' && (
            <div className="inquiries-list">
              {inquiries.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}><h3>No inquiries yet</h3><p>When buyers message you about your listings, they'll appear here</p></div>
              ) : (
                inquiries.map(inq => {
                  const car = listings.find(c => c.id === inq.carId);
                  return (
                    <div key={inq.id} className="inquiry-card">
                      <div className="inquiry-header">
                        <div className="seller-avatar">{inq.buyerName.charAt(0)}</div>
                        <div>
                          <strong>{inq.buyerName}</strong>
                          <span className="inquiry-date">{inq.createdAt}</span>
                        </div>
                        <span className={`status-pill status-${inq.status}`}>{inq.status}</span>
                      </div>
                      <div className="inquiry-car-ref">Re: {car ? `${car.make} ${car.model}` : 'Unknown car'}</div>
                      <div className="inquiry-message">{inq.message}</div>
                      {inq.reply ? (
                        <div className="inquiry-reply"><strong>Your reply:</strong> {inq.reply}</div>
                      ) : (
                        <div className="inquiry-reply-form">
                          <textarea placeholder="Write your reply..." value={replyText[inq.id] || ''} onChange={e => setReplyText(p => ({ ...p, [inq.id]: e.target.value }))} />
                          <button className="btn-solid" onClick={() => handleReply(inq.id)}>Send Reply</button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'contracts' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <span className="admin-table-title">Deals & Contracts ({contracts.length})</span>
              </div>
              {contracts.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <h3>No contracts initiated yet</h3>
                  <p>When buyers start purchasing your cars, deals will appear here</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>Car Listing</th><th>Buyer Name</th><th>Proposed Price</th><th>Stage</th><th>Status</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {contracts.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.make} {c.model}</strong> ({c.year})</td>
                        <td>{c.buyerName}</td>
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
                          <button className="table-action-btn table-action-view" onClick={() => navigate(`/seller/contract/${c.id}`)}>
                            {c.step === 2 ? '✍ Sign Contract' : 'View Contract'}
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

/* Add Listing Form Component inside file */
function AddListingForm({ userId, userName, onComplete }) {
  const [form, setForm] = useState({
    make: '', model: '', year: '2024', price: '', mileage: '', fuel: 'Petrol',
    trans: 'Automatic', engine: '', color: '', city: '', bodyType: 'Sedan',
    description: '', features: [], images: [], videos: []
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const allFeatures = ['Heated Seats', 'Sat Nav', 'Leather Interior', 'Parking Sensors', 'LED Headlights', 'Apple CarPlay', 'Bluetooth', 'Cruise Control', 'Keyless Entry', 'Rear Camera', 'Panoramic Roof', 'Alloy Wheels'];

  const toggleFeature = (f) => {
    setForm(p => ({
      ...p,
      features: p.features.includes(f) ? p.features.filter(x => x !== f) : [...p.features, f]
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setError('');
    if (form.images.length + files.length > 5) {
      setError('You can upload a maximum of 5 photos.');
      return;
    }

    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(base64s => {
      setForm(p => ({
        ...p,
        images: [...p.images, ...base64s]
      }));
    });
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files);
    setError('');
    if (form.videos.length + files.length > 2) {
      setError('You can upload a maximum of 2 videos.');
      return;
    }

    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then(base64s => {
      setForm(p => ({
        ...p,
        videos: [...p.videos, ...base64s]
      }));
    });
  };

  const removeImage = (index) => {
    setForm(p => ({
      ...p,
      images: p.images.filter((_, i) => i !== index)
    }));
  };

  const removeVideo = (index) => {
    setForm(p => ({
      ...p,
      videos: p.videos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Core fields validation
    if (!form.make || !form.model || !form.price || !form.city) {
      setError('Please fill in all required fields (Make, Model, Price, City)');
      return;
    }

    // Photo validation: must be at least 1, max 5
    if (form.images.length === 0) {
      setError('At least 1 photo is required to list your vehicle.');
      return;
    }
    if (form.images.length > 5) {
      setError('A maximum of 5 photos is allowed.');
      return;
    }

    // Video validation: max 2
    if (form.videos.length > 2) {
      setError('A maximum of 2 videos is allowed.');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/listings`, {
        ...form,
        sellerId: userId,
        sellerName: userName,
        sellerType: 'Private'
      });
      onComplete();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit listing');
    } finally {
      setLoading(false);
    }
  };

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <form className="add-listing-form" onSubmit={handleSubmit}>
      {error && <div className="auth-error" style={{ marginBottom: 20, padding: 12, background: 'rgba(217,108,108,0.1)', color: 'var(--mm-red)', borderRadius: 'var(--radius)', fontWeight: 500 }}>{error}</div>}
      
      <div className="form-section">
        <h3>Vehicle Details</h3>
        <div className="form-row">
          <div className="form-group"><label>Make *</label><input type="text" placeholder="e.g. BMW" value={form.make} onChange={e => update('make', e.target.value)} required /></div>
          <div className="form-group"><label>Model *</label><input type="text" placeholder="e.g. 3 Series M Sport" value={form.model} onChange={e => update('model', e.target.value)} required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Year</label><select value={form.year} onChange={e => update('year', e.target.value)}>{[2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => <option key={y} value={y}>{y}</option>)}</select></div>
          <div className="form-group"><label>Price (£) *</label><input type="number" placeholder="e.g. 35000" value={form.price} onChange={e => update('price', e.target.value)} required /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Mileage</label><input type="number" placeholder="e.g. 12000" value={form.mileage} onChange={e => update('mileage', e.target.value)} /></div>
          <div className="form-group"><label>Engine</label><input type="text" placeholder="e.g. 2.0L TSI" value={form.engine} onChange={e => update('engine', e.target.value)} /></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Fuel Type</label><select value={form.fuel} onChange={e => update('fuel', e.target.value)}><option>Petrol</option><option>Diesel</option><option>Electric</option><option>Hybrid</option></select></div>
          <div className="form-group"><label>Transmission</label><select value={form.trans} onChange={e => update('trans', e.target.value)}><option>Automatic</option><option>Manual</option></select></div>
        </div>
        <div className="form-row">
          <div className="form-group"><label>Body Type</label><select value={form.bodyType} onChange={e => update('bodyType', e.target.value)}><option>Sedan</option><option>SUV</option><option>Hatchback</option><option>Estate</option><option>Coupé</option></select></div>
          <div className="form-group"><label>Colour</label><input type="text" placeholder="e.g. Alpine White" value={form.color} onChange={e => update('color', e.target.value)} /></div>
        </div>
        <div className="form-group"><label>City / Location *</label><input type="text" placeholder="e.g. London" value={form.city} onChange={e => update('city', e.target.value)} required /></div>
      </div>

      <div className="form-section">
        <h3>Media Uploads</h3>
        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div className="form-group">
            <label>Photos (Min 1, Max 5) *</label>
            <div className="file-input-wrapper" style={{ marginTop: 6 }}>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={form.images.length >= 5} style={{ display: 'none' }} id="photo-upload-input" />
              <label htmlFor="photo-upload-input" className="btn-outline" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'center', width: '100%' }}>
                📷 Select Photos ({form.images.length}/5)
              </label>
            </div>
            {form.images.length > 0 && (
              <div className="media-preview-grid">
                {form.images.map((img, idx) => (
                  <div key={idx} className="media-preview-card">
                    <img src={img} alt={`Preview ${idx + 1}`} />
                    <button type="button" className="remove-media-btn" onClick={() => removeImage(idx)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Videos (Max 2, Optional)</label>
            <div className="file-input-wrapper" style={{ marginTop: 6 }}>
              <input type="file" accept="video/*" multiple onChange={handleVideoUpload} disabled={form.videos.length >= 2} style={{ display: 'none' }} id="video-upload-input" />
              <label htmlFor="video-upload-input" className="btn-outline" style={{ display: 'inline-block', padding: '10px 16px', borderRadius: 'var(--radius)', cursor: 'pointer', textAlign: 'center', width: '100%' }}>
                🎥 Select Videos ({form.videos.length}/2)
              </label>
            </div>
            {form.videos.length > 0 && (
              <div className="media-preview-grid">
                {form.videos.map((vid, idx) => (
                  <div key={idx} className="media-preview-card">
                    <video src={vid} muted />
                    <button type="button" className="remove-media-btn" onClick={() => removeVideo(idx)}>×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-section">
        <h3>Description</h3>
        <div className="form-group">
          <textarea rows="4" placeholder="Describe your vehicle in detail..." value={form.description} onChange={e => update('description', e.target.value)} />
        </div>
      </div>

      <div className="form-section">
        <h3>Features</h3>
        <div className="features-checkbox-grid">
          {allFeatures.map(f => (
            <label key={f} className={`feature-checkbox${form.features.includes(f) ? ' checked' : ''}`}>
              <input type="checkbox" checked={form.features.includes(f)} onChange={() => toggleFeature(f)} />
              {f}
            </label>
          ))}
        </div>
      </div>

      <button type="submit" className="btn-auth-primary" disabled={loading} style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 600 }}>
        {loading ? 'Submitting...' : 'Submit Listing for Review'}
      </button>
    </form>
  );
}
