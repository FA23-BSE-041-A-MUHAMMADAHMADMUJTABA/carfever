import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      // In a real app we'd decode token or check role.
      const d = localStorage.getItem('cf_currentUser');
      const u = d ? JSON.parse(d) : null;
      if (u && u.role === 'admin') {
        navigate('/admin');
      } else {
        setError('Unauthorized. This access point is for administrators only.');
      }
    } else {
      setError(result.error || 'Invalid credentials');
    }
  };

  return (
    <div className="auth-page admin-auth">
      <div className="auth-card">
        <div className="auth-card-header">
          <img src={logoImg} alt="carFever" className="auth-logo" />
          <h1>Admin Access</h1>
          <p>Restricted area — authorised personnel only</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Admin Email</label>
            <input type="email" placeholder="admin@carfever.co.uk" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-auth-primary btn-admin" disabled={loading}>
            {loading ? 'Verifying...' : 'Admin Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          <p><Link to="/login">← Back to regular login</Link></p>
        </div>
        <div className="auth-demo-hint">
          <strong>Demo:</strong> admin@carfever.co.uk / admin123
        </div>
      </div>
    </div>
  );
}
