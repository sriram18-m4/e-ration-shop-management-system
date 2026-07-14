import React, { useEffect, useState } from 'react';
import { Save, UserPlus } from 'lucide-react';
import api from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import useAsyncData from '../hooks/useAsyncData.js';
import { useAuth } from '../context/AuthContext.jsx';

const emptyForm = {
  id: null,
  fullName: '',
  email: '',
  phone: '',
  password: '',
  shopId: '',
  rationCardNumber: '',
  aadhaarLast4: '',
  familySize: 1,
  address: '',
  incomeCategory: '',
  monthlyEntitlementKg: 0
};

export default function Beneficiaries() {
  const { user } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  const beneficiaries = useAsyncData(async () => {
    const response = await api.get('/beneficiaries');
    return response.data.data;
  }, []);

  const shops = useAsyncData(async () => {
    if (user.role === 'beneficiary') return [];
    const response = await api.get('/shops');
    return response.data.data;
  }, [user.role]);

  useEffect(() => {
    if (user.role === 'shop_owner') setForm((current) => ({ ...current, shopId: user.shopId }));
  }, [user]);

  function edit(row) {
    setForm({
      ...emptyForm,
      ...row,
      password: '',
      shopId: row.shopId || ''
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    const payload = { ...form };
    if (!payload.password) delete payload.password;
    if (!payload.shopId) delete payload.shopId;

    if (form.id) {
      await api.put(`/beneficiaries/${form.id}`, payload);
      setMessage('Beneficiary updated.');
    } else {
      await api.post('/beneficiaries', payload);
      setMessage('Beneficiary added.');
    }
    setForm(user.role === 'shop_owner' ? { ...emptyForm, shopId: user.shopId } : emptyForm);
    beneficiaries.reload();
  }

  const canManage = ['admin', 'shop_owner'].includes(user.role);

  return (
    <div className="page-stack">
      <PageHeader title="Beneficiaries" eyebrow="Ration card records and eligibility" />
      {beneficiaries.error && <div className="error-banner">{beneficiaries.error}</div>}
      {message && <div className="success-banner">{message}</div>}
      {canManage && (
        <form className="panel form-panel" onSubmit={handleSubmit}>
          <h2>{form.id ? 'Update beneficiary' : 'Add beneficiary'}</h2>
          <div className="form-grid">
            <label>
              Full name
              <input value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} type="email" required />
            </label>
            <label>
              Phone
              <input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </label>
            {!form.id && (
              <label>
                Password
                <input value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} type="password" placeholder="Defaults if blank" />
              </label>
            )}
            {user.role === 'admin' && (
              <label>
                Shop
                <select value={form.shopId || ''} onChange={(event) => setForm({ ...form, shopId: event.target.value })}>
                  <option value="">Unassigned</option>
                  {(shops.data || []).map((shop) => (
                    <option key={shop.id} value={shop.id}>{shop.name}</option>
                  ))}
                </select>
              </label>
            )}
            <label>
              Ration card
              <input value={form.rationCardNumber || ''} onChange={(event) => setForm({ ...form, rationCardNumber: event.target.value })} required />
            </label>
            <label>
              Aadhaar last 4
              <input value={form.aadhaarLast4 || ''} onChange={(event) => setForm({ ...form, aadhaarLast4: event.target.value })} maxLength="4" />
            </label>
            <label>
              Family size
              <input value={form.familySize || 1} onChange={(event) => setForm({ ...form, familySize: event.target.value })} type="number" min="1" />
            </label>
            <label>
              Income category
              <input value={form.incomeCategory || ''} onChange={(event) => setForm({ ...form, incomeCategory: event.target.value })} />
            </label>
            <label>
              Monthly entitlement kg
              <input value={form.monthlyEntitlementKg || 0} onChange={(event) => setForm({ ...form, monthlyEntitlementKg: event.target.value })} type="number" min="0" step="0.01" />
            </label>
            <label className="span-2">
              Address
              <textarea value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} rows="3" />
            </label>
          </div>
          <div className="button-row">
            <button className="primary-button compact-button" type="submit">
              {form.id ? <Save size={16} /> : <UserPlus size={16} />}
              {form.id ? 'Save changes' : 'Add beneficiary'}
            </button>
            {form.id && (
              <button className="secondary-button" type="button" onClick={() => setForm(emptyForm)}>
                Clear
              </button>
            )}
          </div>
        </form>
      )}
      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Ration card</th>
                <th>Shop</th>
                <th>Family</th>
                <th>Status</th>
                {canManage && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {(beneficiaries.data || []).map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.fullName}</strong>
                    <span className="muted-cell">{row.email}</span>
                  </td>
                  <td>{row.rationCardNumber}</td>
                  <td>{row.shopName || 'Unassigned'}</td>
                  <td>{row.familySize}</td>
                  <td><span className="pill ok">{row.status}</span></td>
                  {canManage && (
                    <td>
                      <button className="text-button" type="button" onClick={() => edit(row)}>Edit</button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
