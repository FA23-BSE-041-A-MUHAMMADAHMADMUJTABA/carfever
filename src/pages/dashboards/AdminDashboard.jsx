import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth, API_BASE_URL } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { CardCarSVG } from '../../components/Icons';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const { showToast } = useApp();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState('overview');
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Commission settings
  const [commissionType, setCommissionType] = useState('percentage');
  const [commissionRate, setCommissionRate] = useState('5');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchAdminData = async () => {
    try {
      const listingsRes = await axios.get(`${API_BASE_URL}/listings`);
      setListings(listingsRes.data);

      const usersRes = await axios.get(`${API_BASE_URL}/users`);
      setUsers(usersRes.data);

      const settingsRes = await axios.get(`${API_BASE_URL}/settings`);
      if (settingsRes.data.commission_type) {
        setCommissionType(settingsRes.data.commission_type);
      }
      if (settingsRes.data.commission_rate) {
        setCommissionRate(settingsRes.data.commission_rate);
      }

      const contractsRes = await axios.get(`${API_BASE_URL}/contracts`);
      setContracts(contractsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [user, tab]);

  const handleApprove = async (carId) => {
    try {
      await axios.post(`${API_BASE_URL}/listings/${carId}/approve`);
      showToast('Listing approved ✓');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to approve listing');
    }
  };

  const handleReject = async (carId) => {
    try {
      await axios.post(`${API_BASE_URL}/listings/${carId}/reject`);
      showToast('Listing rejected');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to reject listing');
    }
  };

  const handleDeleteListing = async (carId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) return;
    try {
      await axios.delete(`${API_BASE_URL}/listings/${carId}`);
      showToast('Listing deleted');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to delete listing');
    }
  };

  const handleToggleUser = async (userId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/users/${userId}/toggle`);
      showToast(res.data.active ? 'User activated' : 'User deactivated');
      fetchAdminData();
    } catch (err) {
      showToast('Failed to toggle user status');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!commissionRate || isNaN(commissionRate) || Number(commissionRate) < 0) {
      showToast('Please enter a valid positive number');
      return;
    }
    setSavingSettings(true);
    try {
      await axios.post(`${API_BASE_URL}/settings`, {
        commission_type: commissionType,
        commission_rate: commissionRate
      });
      showToast('Commission settings saved successfully! ✓');
    } catch (err) {
      showToast('Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const pendingListings = listings.filter(c => c.status === 'pending');
  const activeListings = listings.filter(c => c.status === 'active');
  
  const filteredListings = listings.filter(c =>
    `${c.make} ${c.model} ${c.sellerName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const nonAdminUsers = users.filter(u => u.role !== 'admin');

  return (
    <div className="dashboard-page admin-dashboard">
      <div className="dashboard-sidebar admin-sidebar-dark">
        <div className="dashboard-sidebar-header">
          <span>Admin<em>Panel</em></span>
        </div>
        <nav className="dashboard-nav">
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>📊 Overview</button>
          <button className={tab === 'listings' ? 'active' : ''} onClick={() => setTab('listings')}>
            🚗 Listings
            {pendingListings.length > 0 && <span className="nav-badge nav-badge-amber">{pendingListings.length}</span>}
          </button>
          <button className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>👥 Users</button>
          <button className={tab === 'contracts' ? 'active' : ''} onClick={() => setTab('contracts')}>
            📋 Contracts & Deals
            {contracts.filter(c => c.step === 1).length > 0 && (
              <span className="nav-badge nav-badge-amber">{contracts.filter(c => c.step === 1).length}</span>
            )}
          </button>
          <button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>⚙ Settings</button>
        </nav>
        <button className="dashboard-back-link" onClick={() => { logout(); navigate('/'); }}>🚪 Logout</button>
      </div>

      <div className="dashboard-main">
        <div className="dashboard-topbar">
          <h2>
            {tab === 'overview' && 'Admin Dashboard'}
            {tab === 'listings' && 'Manage Listings'}
            {tab === 'users' && 'Manage Users'}
            {tab === 'contracts' && 'Platform Sales Contracts'}
            {tab === 'settings' && 'Commission Settings'}
          </h2>
          <div className="admin-topbar-right">
            <span className="admin-topbar-date">{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
            <div className="admin-avatar">
              <div className="admin-avatar-circle">AK</div>
              <span className="admin-avatar-name">{user.name}</span>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {tab === 'overview' && (
            <>
              {pendingListings.length > 0 && (
                <div className="admin-alert admin-alert-info" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center' }}>
                  <span>📋 <strong>{pendingListings.length} listings</strong> are pending review and require attention.</span>
                  <button className="admin-alert-btn" style={{ marginLeft: 'auto' }} onClick={() => setTab('listings')}>Review Now</button>
                </div>
              )}

              {contracts.filter(c => c.step === 1).length > 0 && (
                <div className="admin-alert admin-alert-info" style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', background: 'rgba(52, 152, 219, 0.1)', borderLeft: '4px solid #3498db' }}>
                  <span>📋 <strong>{contracts.filter(c => c.step === 1).length} contracts</strong> are waiting for platform approval and commission stamp.</span>
                  <button className="admin-alert-btn" style={{ marginLeft: 'auto', background: '#3498db' }} onClick={() => setTab('contracts')}>Review Deals</button>
                </div>
              )}

              <div className="admin-stats">
                <div className="admin-stat-card"><div className="admin-stat-label">Active Listings</div><div className="admin-stat-value">{activeListings.length}</div><div className="admin-stat-trend up">↑ Live</div></div>
                <div className="admin-stat-card"><div className="admin-stat-label">Total Users</div><div className="admin-stat-value">{nonAdminUsers.length}</div><div className="admin-stat-trend up">↑ Growing</div></div>
                <div className="admin-stat-card"><div className="admin-stat-label">Pending Reviews</div><div className="admin-stat-value">{pendingListings.length}</div><div className={`admin-stat-trend ${pendingListings.length > 0 ? 'down' : 'up'}`}>{pendingListings.length > 0 ? '⚠ Action needed' : '✓ All clear'}</div></div>
                <div className="admin-stat-card"><div className="admin-stat-label">Platform Contracts</div><div className="admin-stat-value">{contracts.length}</div><div className="admin-stat-trend up">Deals Log</div></div>
              </div>

              <div className="admin-charts">
                <div className="admin-chart-card">
                  <div className="admin-chart-title">Listings by Status</div>
                  <div className="bar-chart">
                    {[
                      { label: 'Active', h: Math.max(10, (activeListings.length / Math.max(listings.length, 1)) * 100), highlight: true },
                      { label: 'Pending', h: Math.max(10, (pendingListings.length / Math.max(listings.length, 1)) * 100) },
                      { label: 'Rejected', h: Math.max(10, (listings.filter(c => c.status === 'rejected').length / Math.max(listings.length, 1)) * 100) },
                    ].map(bar => (
                      <div key={bar.label} className="bar-item">
                        <div className={`bar${bar.highlight ? ' highlight' : ''}`} style={{ height: `${bar.h}%` }} />
                        <span className="bar-label">{bar.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="admin-chart-card">
                  <div className="admin-chart-title">Users by Role</div>
                  <div className="donut-chart-wrap">
                    <div className="donut-legend" style={{ width: '100%' }}>
                      {[
                        { color: 'var(--mm-blue)', label: 'Sellers', count: users.filter(u => u.role === 'seller').length },
                        { color: 'var(--mm-green)', label: 'Buyers', count: users.filter(u => u.role === 'buyer').length },
                        { color: 'var(--mm-amber)', label: 'Admin', count: 1 },
                      ].map(item => (
                        <div key={item.label} className="donut-legend-item">
                          <div className="donut-legend-color" style={{ background: item.color }} />
                          <span className="donut-legend-text">{item.label}</span>
                          <span className="donut-legend-pct">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {tab === 'listings' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <span className="admin-table-title">All Listings ({listings.length})</span>
                <div className="admin-table-actions">
                  <input type="text" className="admin-table-search" placeholder="Search listings..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
              </div>
              <table className="admin-table">
                <thead>
                  <tr><th>Listing</th><th>Price</th><th>Seller</th><th>City</th><th>Date</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredListings.map(car => (
                    <tr key={car.id}>
                      <td><div className="table-listing-info"><div className="table-thumb"><CardCarSVG type={car.bodyType === 'SUV' ? 'suv' : 'sedan'} /></div><div><div className="table-listing-name">{car.make} {car.model}</div><div className="table-listing-id">{car.year}</div></div></div></td>
                      <td style={{ fontFamily: 'var(--ff-display)', fontWeight: 700, color: 'var(--mm-ink)' }}>£{car.price.toLocaleString()}</td>
                      <td>{car.sellerName}</td>
                      <td>{car.city}</td>
                      <td>{car.createdAt}</td>
                      <td><span className={`status-pill status-${car.status}`}>{car.status.charAt(0).toUpperCase() + car.status.slice(1)}</span></td>
                      <td>
                        <div className="table-actions">
                          {car.status === 'pending' ? (
                            <>
                              <button className="table-action-btn table-action-approve" onClick={() => handleApprove(car.id)}>Approve</button>
                              <button className="table-action-btn table-action-reject" onClick={() => handleReject(car.id)}>Reject</button>
                            </>
                          ) : (
                            <>
                              <button className="table-action-btn table-action-view" onClick={() => navigate(`/car/${car.id}`)}>View</button>
                              <button className="table-action-btn table-action-reject" onClick={() => handleDeleteListing(car.id)}>Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'users' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <span className="admin-table-title">Registered Users ({nonAdminUsers.length})</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {nonAdminUsers.map(u => (
                    <tr key={u.id}>
                      <td><div className="table-listing-info"><div className="seller-avatar" style={{ width: 32, height: 32, fontSize: '0.75rem' }}>{u.name.charAt(0)}</div><div className="table-listing-name">{u.name}</div></div></td>
                      <td>{u.email}</td>
                      <td><span className={`status-pill status-${u.role === 'seller' ? 'active' : 'pending'}`}>{u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span></td>
                      <td>{u.createdAt}</td>
                      <td><span className={`status-pill status-${u.active ? 'active' : 'rejected'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                      <td>
                        <button className={`table-action-btn ${u.active ? 'table-action-reject' : 'table-action-approve'}`} onClick={() => handleToggleUser(u.id)}>
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'contracts' && (
            <div className="admin-table-card">
              <div className="admin-table-header">
                <span className="admin-table-title">Contracts Log ({contracts.length})</span>
              </div>
              {contracts.length === 0 ? (
                <div className="empty-state" style={{ padding: 40 }}>
                  <h3>No contracts created yet</h3>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr><th>Car Model</th><th>Buyer</th><th>Seller</th><th>Price</th><th>Platform Commission</th><th>Stage</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {contracts.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.make} {c.model}</strong> ({c.year})</td>
                        <td>{c.buyerName}</td>
                        <td>{c.sellerName}</td>
                        <td>£{c.price.toLocaleString()}</td>
                        <td style={{ color: '#d96c6c' }}>
                          {c.step >= 2 ? `£${c.commissionAmount.toLocaleString()}` : <span style={{ color: '#aaa', fontStyle: 'italic', fontSize: '0.85rem' }}>Pending approval</span>}
                        </td>
                        <td>Step {c.step}/4</td>
                        <td>
                          <button className="table-action-btn table-action-view" onClick={() => navigate(`/admin/contract/${c.id}`)}>
                            {c.step === 1 ? '🔍 Approve & Stamp' : 'View Contract'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === 'settings' && (
            <div className="admin-table-card" style={{ padding: 30 }}>
              <div style={{ maxWidth: 500 }}>
                <h3 style={{ marginBottom: 20 }}>System Commission Setup</h3>
                <form onSubmit={handleSaveSettings}>
                  <div className="form-group" style={{ marginBottom: 15 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Commission Type</label>
                    <div style={{ display: 'flex', gap: 15 }}>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" checked={commissionType === 'percentage'} onChange={() => setCommissionType('percentage')} />
                        Percentage (%)
                      </label>
                      <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="radio" checked={commissionType === 'flat'} onChange={() => setCommissionType('flat')} />
                        Flat Fee (£)
                      </label>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginBottom: 25 }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      {commissionType === 'percentage' ? 'Commission Rate (%)' : 'Commission Amount (£)'}
                    </label>
                    <input type="number" step="any" value={commissionRate} onChange={e => setCommissionRate(e.target.value)} required style={{ background: '#fff', border: '1px solid #ccc', color: '#111', width: '100%', padding: '10px' }} />
                  </div>
                  <button type="submit" className="btn-solid" disabled={savingSettings}>
                    {savingSettings ? 'Saving...' : 'Save Settings'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
