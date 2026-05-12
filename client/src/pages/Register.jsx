import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div style={{ fontSize: 40 }}>⚡</div>
          <h1>TaskFlow</h1>
          <p>Create your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name</label>
            <input
              className="form-control"
              type="text"
              name="name"
              placeholder="John Doe"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
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
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>
          <div className="form-group">
            <label>Role</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {['member', 'admin'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, role: r }))}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: 8,
                    border: `2px solid ${form.role === r ? '#355872' : '#dde2e8'}`,
                    background: form.role === r ? '#355872' : '#fff',
                    color: form.role === r ? '#fff' : '#6c7a89',
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
          </div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#6c7a89' }}>
          Already have an account?{' '}
          <Link
            to="/login"
            style={{ color: '#355872', fontWeight: 600, textDecoration: 'none' }}
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
