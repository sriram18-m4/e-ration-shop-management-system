import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <div className="auth-copy">
          <div className="brand large">
            <div className="brand-mark">ER</div>
            <div>
              <strong>E-Ration</strong>
              <span>Shop Management</span>
            </div>
          </div>
          <h1>Secure ration distribution, from stockroom to beneficiary.</h1>
          <p>Track allocation, inventory, and issue history with role-based access for admins, shop owners, and ration card holders.</p>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <h2>Sign in</h2>
          {error && <div className="error-banner">{error}</div>}
          <label>
            Email
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
          </label>
          <label>
            Password
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" required />
          </label>
          <button className="primary-button" disabled={loading} type="submit">
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          <p className="form-footer">
            New beneficiary? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
