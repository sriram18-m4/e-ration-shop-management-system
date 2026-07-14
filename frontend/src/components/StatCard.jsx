import React from 'react';

export default function StatCard({ label, value, accent = 'green' }) {
  return (
    <section className={`stat-card accent-${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </section>
  );
}
