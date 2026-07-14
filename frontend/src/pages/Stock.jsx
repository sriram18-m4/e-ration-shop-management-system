import React, { useMemo, useState } from 'react';
import { RefreshCcw, Save } from 'lucide-react';
import api from '../api/client.js';
import PageHeader from '../components/PageHeader.jsx';
import useAsyncData from '../hooks/useAsyncData.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Stock() {
  const { user } = useAuth();
  const [form, setForm] = useState({ itemId: '', quantity: '', reorderLevel: '', note: '' });
  const [message, setMessage] = useState('');
  const canManage = user.role === 'shop_owner';

  const stockData = useAsyncData(async () => {
    const response = await api.get('/stock');
    return response.data.data;
  }, []);

  const itemData = useAsyncData(async () => {
    if (!canManage) return [];
    const response = await api.get('/stock/items');
    return response.data.data;
  }, [canManage]);

  const grouped = useMemo(() => {
    return (stockData.data || []).reduce((acc, row) => {
      acc[row.shopName] = acc[row.shopName] || [];
      acc[row.shopName].push(row);
      return acc;
    }, {});
  }, [stockData.data]);

  async function submitStock(event) {
    event.preventDefault();
    setMessage('');
    await api.post('/stock', {
      ...form,
      itemId: Number(form.itemId),
      quantity: Number(form.quantity),
      reorderLevel: Number(form.reorderLevel || 0)
    });
    setForm({ itemId: '', quantity: '', reorderLevel: '', note: '' });
    setMessage('Stock updated.');
    stockData.reload();
  }

  async function quickUpdate(row, quantity) {
    await api.put(`/stock/${row.id}`, {
      quantity: Number(quantity),
      reorderLevel: row.reorderLevel,
      note: 'Quick table update'
    });
    stockData.reload();
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Stock"
        eyebrow="Inventory and reorder tracking"
        actions={
          <button className="secondary-button" type="button" onClick={stockData.reload}>
            <RefreshCcw size={16} />
            Refresh
          </button>
        }
      />
      {stockData.error && <div className="error-banner">{stockData.error}</div>}
      {message && <div className="success-banner">{message}</div>}
      {canManage && (
        <form className="panel form-panel" onSubmit={submitStock}>
          <h2>Update shop stock</h2>
          <div className="form-grid fit">
            <label>
              Item
              <select value={form.itemId} onChange={(event) => setForm({ ...form, itemId: event.target.value })} required>
                <option value="">Select item</option>
                {(itemData.data || []).map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                ))}
              </select>
            </label>
            <label>
              Quantity
              <input value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} type="number" min="0" step="0.01" required />
            </label>
            <label>
              Reorder level
              <input value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })} type="number" min="0" step="0.01" />
            </label>
            <label>
              Note
              <input value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
            </label>
          </div>
          <button className="primary-button compact-button" type="submit">
            <Save size={16} />
            Save stock
          </button>
        </form>
      )}
      <section className="table-panel">
        {Object.entries(grouped).map(([shopName, rows]) => (
          <div className="shop-stock" key={shopName}>
            <h2>{shopName}</h2>
            <div className="responsive-table">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th>Quantity</th>
                    <th>Reorder</th>
                    <th>Status</th>
                    {canManage && <th>Quick edit</th>}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.itemName}</td>
                      <td>{row.sku}</td>
                      <td>{row.quantity} {row.unit}</td>
                      <td>{row.reorderLevel}</td>
                      <td><span className={row.isLowStock ? 'pill danger' : 'pill ok'}>{row.isLowStock ? 'Low' : 'Healthy'}</span></td>
                      {canManage && (
                        <td>
                          <input
                            className="table-input"
                            defaultValue={row.quantity}
                            onBlur={(event) => {
                              if (event.target.value !== String(row.quantity)) quickUpdate(row, event.target.value);
                            }}
                            type="number"
                            min="0"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
