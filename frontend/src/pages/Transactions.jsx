import React, { useState } from 'react';
import { Plus, Send } from 'lucide-react';
import api from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import useAsyncData from '../hooks/useAsyncData.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Transactions() {
  const { user } = useAuth();
  const [form, setForm] = useState({ beneficiaryId: '', remarks: '', items: [{ itemId: '', quantity: '' }] });
  const [message, setMessage] = useState('');
  const canIssue = user.role === 'shop_owner';

  const transactions = useAsyncData(async () => {
    const response = await api.get('/transactions');
    return response.data.data;
  }, []);

  const beneficiaries = useAsyncData(async () => {
    if (!canIssue) return [];
    const response = await api.get('/beneficiaries');
    return response.data.data;
  }, [canIssue]);

  const stock = useAsyncData(async () => {
    if (!canIssue) return [];
    const response = await api.get('/stock');
    return response.data.data;
  }, [canIssue]);

  const availableItems = stock.data || [];

  function updateItem(index, field, value) {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    }));
  }

  async function submitDistribution(event) {
    event.preventDefault();
    setMessage('');
    await api.post('/transactions', {
      beneficiaryId: Number(form.beneficiaryId),
      remarks: form.remarks,
      items: form.items.map((item) => ({ itemId: Number(item.itemId), quantity: Number(item.quantity) }))
    });
    setMessage('Ration issued and stock deducted.');
    setForm({ beneficiaryId: '', remarks: '', items: [{ itemId: '', quantity: '' }] });
    transactions.reload();
    stock.reload();
  }

  return (
    <div className="page-stack">
      <PageHeader title="Transactions" eyebrow="Distribution logs and issue workflow" />
      {transactions.error && <div className="error-banner">{transactions.error}</div>}
      {message && <div className="success-banner">{message}</div>}
      {canIssue && (
        <form className="panel form-panel" onSubmit={submitDistribution}>
          <h2>Issue ration</h2>
          <div className="form-grid fit">
            <label>
              Beneficiary
              <select value={form.beneficiaryId} onChange={(event) => setForm({ ...form, beneficiaryId: event.target.value })} required>
                <option value="">Select beneficiary</option>
                {(beneficiaries.data || []).map((beneficiary) => (
                  <option key={beneficiary.id} value={beneficiary.id}>
                    {beneficiary.fullName} - {beneficiary.rationCardNumber}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Remarks
              <input value={form.remarks} onChange={(event) => setForm({ ...form, remarks: event.target.value })} />
            </label>
          </div>
          <div className="distribution-lines">
            {form.items.map((item, index) => (
              <div className="distribution-line" key={index}>
                <label>
                  Item
                  <select value={item.itemId} onChange={(event) => updateItem(index, 'itemId', event.target.value)} required>
                    <option value="">Select stock item</option>
                    {availableItems.map((stockItem) => (
                      <option key={`${stockItem.shopId}-${stockItem.itemId}`} value={stockItem.itemId}>
                        {stockItem.itemName} ({stockItem.quantity} {stockItem.unit} available)
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quantity
                  <input value={item.quantity} onChange={(event) => updateItem(index, 'quantity', event.target.value)} type="number" min="0.01" step="0.01" required />
                </label>
              </div>
            ))}
          </div>
          <div className="button-row">
            <button
              className="secondary-button"
              type="button"
              onClick={() => setForm({ ...form, items: [...form.items, { itemId: '', quantity: '' }] })}
            >
              <Plus size={16} />
              Add item
            </button>
            <button className="primary-button compact-button" type="submit">
              <Send size={16} />
              Issue ration
            </button>
          </div>
        </form>
      )}
      <section className="table-panel">
        <div className="responsive-table">
          <table>
            <thead>
              <tr>
                <th>Transaction</th>
                <th>Beneficiary</th>
                <th>Shop</th>
                <th>Units</th>
                <th>Issued at</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(transactions.data || []).map((row) => (
                <tr key={row.id}>
                  <td>{row.transactionNo}</td>
                  <td>{row.beneficiaryName}</td>
                  <td>{row.shopName}</td>
                  <td>{row.totalUnits}</td>
                  <td>{new Date(row.issuedAt).toLocaleString()}</td>
                  <td><span className="pill ok">{row.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
