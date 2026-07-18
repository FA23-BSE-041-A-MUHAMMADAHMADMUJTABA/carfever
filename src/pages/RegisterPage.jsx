import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', role: 'buyer' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.email.includes('@')) { setError('Valid email is required'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }

    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.role);
    setLoading(false);

    if (result.success) {
      navigate(form.role === 'seller' ? '/seller' : '/buyer');
    } else {
      setError(result.error);
    }
  };

  const update = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <img src={logoImg} alt="carFever" className="auth-logo" />
          <h1>Create Account</h1>
          <p>Join the UK's premier auto marketplace</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="form-group">
            <label>I want to</label>
            <div className="role-toggle">
              <button type="button" className={`role-btn${form.role === 'buyer' ? ' active' : ''}`} onClick={() => update('role', 'buyer')}>Buy Cars</button>
              <button type="button" className={`role-btn${form.role === 'seller' ? ' active' : ''}`} onClick={() => update('role', 'seller')}>Sell Cars</button>
            </div>
          </div>
          <div className="form-group">
            <label>Full Name</label>
            <input type="text" placeholder="John Smith" value={form.name} onChange={e => update('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Min 6 chars" value={form.password} onChange={e => update('password', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="••••••••" value={form.confirm} onChange={e => update('confirm', e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn-auth-primary" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
