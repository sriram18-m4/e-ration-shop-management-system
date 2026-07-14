import React, { useState } from 'react';
import { Pencil, Plus, Save, Store, X } from 'lucide-react';
import api from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import useAsyncData from '../hooks/useAsyncData.js';

const emptyForm = {
  id: null,
  code: '',
  name: '',
  address: '',
  district: '',
  contactPhone: '',
  status: 'active'
};

function formFromShop(shop) {
  return {
    id: shop.id,
    code: shop.code || '',
    name: shop.name || '',
    address: shop.address || '',
    district: shop.district || '',
    contactPhone: shop.contactPhone || shop.contact_phone || '',
    status: shop.status || 'active'
  };
}

export default function Shops() {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [saving, setSaving] = useState(false);

  const shops = useAsyncData(async () => {
    const response = await api.get('/shops');
    return response.data.data;
  }, []);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function editShop(shop) {
    setForm(formFromShop(shop));
    setMessage('');
    setSubmitError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function clearForm() {
    setForm(emptyForm);
    setSubmitError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setSubmitError('');
    setSaving(true);

    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      address: form.address.trim(),
      district: form.district.trim(),
      contactPhone: form.contactPhone.trim(),
      status: form.status
    };

    try {
      if (form.id) {
        await api.put(`/shops/${form.id}`, payload);
        setMessage('Shop updated successfully.');
      } else {
        await api.post('/shops', payload);
        setMessage('Shop added successfully.');
      }

      setForm(emptyForm);
      await shops.reload();
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page-stack">
      <PageHeader title="Shops" eyebrow="Ration shop directory and service status" />

      {shops.error && <div className="error-banner">{shops.error}</div>}
      {submitError && <div className="error-banner">{submitError}</div>}
      {message && <div className="success-banner">{message}</div>}

      <form className="panel form-panel" onSubmit={handleSubmit}>
        <h2>{form.id ? 'Update shop' : 'Add shop'}</h2>
        <div className="form-grid">
          <label>
            Shop code
            <input
              value={form.code}
              onChange={(event) => updateField('code', event.target.value)}
              minLength="2"
              maxLength="32"
              placeholder="Example: VJA-001"
              required
            />
          </label>
          <label>
            Shop name
            <input
              value={form.name}
              onChange={(event) => updateField('name', event.target.value)}
              minLength="2"
              maxLength="120"
              required
            />
          </label>
          <label>
            District
            <input
              value={form.district}
              onChange={(event) => updateField('district', event.target.value)}
              maxLength="80"
            />
          </label>
          <label>
            Contact phone
            <input
              value={form.contactPhone}
              onChange={(event) => updateField('contactPhone', event.target.value)}
              type="tel"
              minLength="8"
              maxLength="20"
            />
          </label>
          <label>
            Status
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label className="span-2">
            Address
            <textarea
              value={form.address}
              onChange={(event) => updateField('address', event.target.value)}
              maxLength="500"
              rows="3"
            />
          </label>
        </div>

        <div className="button-row">
          <button className="primary-button compact-button" type="submit" disabled={saving}>
            {form.id ? <Save size={16} /> : <Plus size={16} />}
            {saving ? 'Saving...' : form.id ? 'Save changes' : 'Add shop'}
          </button>
          {form.id && (
            <button className="secondary-button" type="button" onClick={clearForm} disabled={saving}>
              <X size={16} />
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <section className="table-panel">
        <div className="panel-heading">
          <h2>Registered shops</h2>
          <Store size={20} aria-hidden="true" />
        </div>

        {shops.loading && <div className="screen-loader inline">Loading shops...</div>}
        {!shops.loading && (shops.data || []).length === 0 && (
          <EmptyState title="No shops registered" body="Use the form above to add the first ration shop." />
        )}
        {!shops.loading && (shops.data || []).length > 0 && (
          <div className="responsive-table">
            <table>
              <thead>
                <tr>
                  <th>Shop</th>
                  <th>District</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(shops.data || []).map((shop) => (
                  <tr key={shop.id}>
                    <td>
                      <strong>{shop.name}</strong>
                      <span className="muted-cell">{shop.code}</span>
                    </td>
                    <td>{shop.district || '-'}</td>
                    <td>{shop.contactPhone || shop.contact_phone || '-'}</td>
                    <td>
                      <span className={`pill ${shop.status === 'active' ? 'ok' : 'danger'}`}>
                        {shop.status}
                      </span>
                    </td>
                    <td>
                      <button className="text-button" type="button" onClick={() => editShop(shop)}>
                        <Pencil size={15} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
