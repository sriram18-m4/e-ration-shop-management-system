import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, ClipboardList, LayoutDashboard, LogOut, ShieldCheck, Store, UsersRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import ChatAssistant from './ChatAssistant.jsx';

const navItems = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/stock', label: 'Stock', icon: Boxes },
  { to: '/app/beneficiaries', label: 'Beneficiaries', icon: UsersRound },
  { to: '/app/transactions', label: 'Transactions', icon: ClipboardList },
  { to: '/app/shops', label: 'Shops', icon: Store, roles: ['admin'] },
  { to: '/app/users', label: 'Users', icon: ShieldCheck, roles: ['admin'] }
];

function roleLabel(role) {
  return role.replace('_', ' ');
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">ER</div>
          <div>
            <strong>E-Ration</strong>
            <span>Distribution OS</span>
          </div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems
            .filter((item) => !item.roles || item.roles.includes(user.role))
            .map((item) => {
              const Icon = item.icon;
              return (
                <NavLink key={item.to} to={item.to} className="nav-link" title={item.label}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
        </nav>
        <div className="sidebar-user">
          <div>
            <strong>{user.fullName}</strong>
            <span>{roleLabel(user.role)}</span>
          </div>
          <button className="icon-button" onClick={handleLogout} title="Sign out" type="button">
            <LogOut size={18} />
          </button>
        </div>
      </aside>
      <main className="main-panel">
        <Outlet />
      </main>
      <ChatAssistant />
    </div>
  );
}
