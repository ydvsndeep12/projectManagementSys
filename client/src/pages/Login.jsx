import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const ROLE_HINTS = {
  admin: { email: 'admin@taskflow.com', password: 'Admin@123' },
  member: { email: '', password: '' },
};

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('member');
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (r) => {
    setRole(r);
    setError('');
    if (r === 'admin') {
      setForm({ email: ROLE_HINTS.admin.email, password: ROLE_HINTS.admin.password });
    } else {
      setForm({ email: '', password: '' });
    }
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ fontSize: 40 }}></div>
          <h1>TaskFlow</h1>
          <p>Sign in to your account</p>
        </div>

        {/* Role selector */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {['member', 'admin'].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRoleChange(r)}
              style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 8,
                border: `2px solid ${role === r ? '#355872' : '#dde2e8'}`,
                background: role === r ? '#355872' : '#fff',
                color: role === r ? '#fff' : '#6c7a89',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s',
              }}
            >
              {r === 'admin' ? '🛡 Admin' : '👤 Member'}
            </button>
          ))}
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              className="form-control"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              className="form-control"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? 'Signing in…' : `Sign In as ${role === 'admin' ? 'Admin' : 'Member'}`}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6c7a89' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#355872', fontWeight: 600, textDecoration: 'none' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
