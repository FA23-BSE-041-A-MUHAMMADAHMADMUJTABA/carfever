import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export default function LoginPage() {
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
      // Fetch user from auth state
      const d = localStorage.getItem('cf_currentUser');
      const u = d ? JSON.parse(d) : null;
      if (u) {
        if (u.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(u.role === 'seller' ? '/seller' : '/buyer');
        }
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <img src={logoImg} alt="carFever" className="auth-logo" />
          <h1>Welcome Back</h1>
          <p>Sign in to your carFever account</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create one</Link></p>
          <p className="auth-admin-link"><Link to="/admin/login">Admin Login →</Link></p>
        </div>
        <div className="auth-demo-hint">
          <strong>Demo Accounts:</strong><br />
          Seller: seller@demo.com / seller123<br />
          Buyer: buyer@demo.com / buyer123
        </div>
      </div>
    </div>
  );
}
