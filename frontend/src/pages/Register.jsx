import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    rationCardNumber: '',
    aadhaarLast4: '',
    familySize: 1,
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel compact">
        <form className="auth-form wide" onSubmit={handleSubmit}>
          <h2>Beneficiary registration</h2>
          {error && <div className="error-banner">{error}</div>}
          <div className="form-grid">
            <label>
              Full name
              <input value={form.fullName} onChange={(event) => update('fullName', event.target.value)} required />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(event) => update('email', event.target.value)} type="email" required />
            </label>
            <label>
              Phone
              <input value={form.phone} onChange={(event) => update('phone', event.target.value)} />
            </label>
            <label>
              Password
              <input value={form.password} onChange={(event) => update('password', event.target.value)} type="password" required />
            </label>
            <label>
              Ration card number
              <input value={form.rationCardNumber} onChange={(event) => update('rationCardNumber', event.target.value)} required />
            </label>
            <label>
              Aadhaar last 4
              <input value={form.aadhaarLast4} onChange={(event) => update('aadhaarLast4', event.target.value)} maxLength="4" />
            </label>
            <label>
              Family size
              <input value={form.familySize} onChange={(event) => update('familySize', event.target.value)} type="number" min="1" />
            </label>
            <label className="span-2">
              Address
              <textarea value={form.address} onChange={(event) => update('address', event.target.value)} rows="3" />
            </label>
          </div>
          <button className="primary-button" disabled={loading} type="submit">
            <UserPlus size={18} />
            {loading ? 'Creating account...' : 'Register'}
          </button>
          <p className="form-footer">
            Already registered? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
