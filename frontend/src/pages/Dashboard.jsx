import React, { useEffect } from 'react';
import { AlertTriangle, ClipboardList } from 'lucide-react';
import api from '../api/client.js';
import EmptyState from '../components/EmptyState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import StatCard from '../components/StatCard.jsx';
import useAsyncData from '../hooks/useAsyncData.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useAsyncData(async () => {
    const response = await api.get('/dashboard/summary');
    return response.data.data;
  }, []);

  useEffect(() => {
    const timer = setInterval(reload, 30000);
    return () => clearInterval(timer);
  }, [reload]);

  return (
    <div className="page-stack">
      <PageHeader title="Dashboard" eyebrow={`${user.role.replace('_', ' ')} workspace`} />
      {error && <div className="error-banner">{error}</div>}
      {loading && <div className="screen-loader inline">Loading dashboard...</div>}
      {data && (
        <>
          <section className="stats-grid">
            <StatCard label="Total stock units" value={data.totalStock} accent="green" />
            <StatCard label="Low stock items" value={data.lowStockCount} accent="amber" />
            <StatCard label="Beneficiaries" value={data.totalBeneficiaries} accent="blue" />
            <StatCard label="Transactions" value={data.totalTransactions} accent="rose" />
          </section>
          <section className="content-grid">
            <div className="panel">
              <div className="panel-heading">
                <h2>Low stock watchlist</h2>
                <AlertTriangle size={18} />
              </div>
              {data.lowStock.length ? (
                <div className="list-stack">
                  {data.lowStock.map((item) => (
                    <div className="list-row" key={item.id}>
                      <div>
                        <strong>{item.itemName}</strong>
                        <span>{item.shopName}</span>
                      </div>
                      <b>{item.quantity} {item.unit}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Stock is healthy" body="No items are below reorder level." />
              )}
            </div>
            <div className="panel">
              <div className="panel-heading">
                <h2>Recent distribution</h2>
                <ClipboardList size={18} />
              </div>
              {data.recentTransactions.length ? (
                <div className="list-stack">
                  {data.recentTransactions.map((transaction) => (
                    <div className="list-row" key={transaction.id}>
                      <div>
                        <strong>{transaction.beneficiaryName}</strong>
                        <span>{transaction.transactionNo}</span>
                      </div>
                      <b>{transaction.totalUnits} units</b>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No distribution yet" body="Transactions will appear once ration is issued." />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
