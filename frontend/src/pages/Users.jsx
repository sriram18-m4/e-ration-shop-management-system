import React, { useState } from 'react';
import { UserPlus } from 'lucide-react';
import api from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import useAsyncData from '../hooks/useAsyncData.js';

const emptyUser = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  role: 'shop_owner',
  shopId: '',
  rationCardNumber: '',
  aadhaarLast4: '',
  status: 'active'
};

export default function Users() {
  const [form, setForm] = useState(emptyUser);
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const users = useAsyncData(async () => {
    const response = await api.get('/users');
    return response.data.data;
  }, []);

  const shops = useAsyncData(async () => {
    const response = await api.get('/shops');
    return response.data.data;
  }, []);

  async function submitUser(event) {
    event.preventDefault();
    setMessage('');
    setSubmitError('');
    setSaving(true);
    const payload = { ...form, shopId: form.shopId || undefined };

    try {
      await api.post('/users', payload);
      setMessage('User created successfully.');
      setForm(emptyUser);
      await users.reload();
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader title="Users" eyebrow="RBAC and shop assignment" />
      {users.error && <div className="error-banner">{users.error}</div>}
      {shops.error && <div className="error-banner">{shops.error}</div>}
      {submitError && <div className="error-banner">{submitError}</div>}
      {message && <div className="success-banner">{message}</div>}
      <form className="panel form-panel" onSubmit={submitUser}>
        <h2>Create user</h2>
        <div className="form-grid fit">
          <label>
            Full name
            <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} minLength="2" maxLength="120" required />
          </label>
          <label>
            Email
            <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
          </label>
          <label>
            Phone
            <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} type="tel" minLength="8" maxLength="20" />
          </label>
          <label>
            Password (minimum 8 characters)
            <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" minLength="8" required />
          </label>
          <label>
            Role
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="admin">Admin</option>
              <option value="shop_owner">Shop owner</option>
              <option value="beneficiary">Beneficiary</option>
            </select>
          </label>
          <label>
            Shop
            <select
              value={form.shopId}
              onChange={(event) => setForm({ ...form, shopId: event.target.value })}
              required={form.role === 'shop_owner'}
            >
              <option value="">{form.role === 'shop_owner' ? 'Select shop' : 'None'}</option>
              {(shops.data || []).map((shop) => (
                <option key={shop.id} value={shop.id}>{shop.name}</option>
              ))}
            </select>
          </label>
          {form.role === 'beneficiary' && (
            <>
              <label>
                Ration card
                <input value={form.rationCardNumber} onChange={(event) => setForm({ ...form, rationCardNumber: event.target.value })} />
              </label>
              <label>
                Aadhaar last 4
                <input value={form.aadhaarLast4} onChange={(event) => setForm({ ...form, aadhaarLast4: event.target.value })} maxLength="4" />
              </label>
            </>
          )}
        </div>
        <button className="primary-button compact-button" type="submit" disabled={saving}>
          <UserPlus size={16} />
          {saving ? 'Creating...' : 'Create user'}
        </button>
      </form>
      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Shop</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {(users.data || []).map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.fullName}</strong>
                    <span className="muted-cell">{row.email}</span>
                  </td>
                  <td>{row.role.replace('_', ' ')}</td>
                  <td>{row.shopName || '-'}</td>
                  <td><span className="pill ok">{row.status}</span></td>
                  <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
