import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { authApi } from '../../api/auth.js';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  Building2,
  ArrowLeftRight,
  CreditCard,
  BarChart2,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',    labelFr: 'Tableau de bord' },
  { to: '/paychecks',    icon: Wallet,           label: 'Paychecks',    labelFr: 'Paie' },
  { to: '/bills',        icon: Receipt,          label: 'Bills',        labelFr: 'Factures' },
  { to: '/accounts',     icon: Building2,        label: 'Accounts',     labelFr: 'Comptes' },
  { to: '/transactions', icon: ArrowLeftRight,   label: 'Transactions', labelFr: 'Transactions' },
  { to: '/statements',   icon: CreditCard,       label: 'Statements',   labelFr: 'Relevés' },
  { to: '/stats',        icon: BarChart2,        label: 'Stats',        labelFr: 'Statistiques' },
];

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  async function handleLogout() {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      navigate('/login');
    }
  }

  return (
    <div className="flex h-screen" style={{ backgroundColor: '#f5f3ef' }}>

      {/* Sidebar */}
      <aside className="w-56 flex flex-col bg-white border-r border-stone-200 shrink-0">

        {/* Logo */}
        <div className="px-5 py-5 border-b border-stone-100">
          <h1
            className="text-xl font-semibold text-stone-800"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            MoneyQC
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">Finance personnelle</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ to, icon: Icon, label, labelFr }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
                }`
              }
            >
              <Icon size={16} strokeWidth={1.75} />
              <div>
                <div className="leading-tight">{label}</div>
                <div className="text-xs opacity-60 leading-tight">{labelFr}</div>
              </div>
            </NavLink>
          ))}
        </nav>

        {/* Divider */}
        <div className="border-t border-stone-100 mx-3" />

        {/* Settings + user */}
        <div className="px-3 py-3 space-y-0.5">
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-amber-50 text-amber-700 font-medium'
                  : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
              }`
            }
          >
            <Settings size={16} strokeWidth={1.75} />
            <div>
              <div className="leading-tight">Settings</div>
              <div className="text-xs opacity-60 leading-tight">Paramètres</div>
            </div>
          </NavLink>

          {/* User row */}
          <div className="flex items-center gap-2 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-amber-700">
                {user?.display_name?.[0]?.toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-stone-800 truncate">{user?.display_name}</div>
              <div className="text-xs text-stone-400 truncate">{user?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-stone-400 hover:text-red-500 transition-colors"
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>

      </aside>

      {/* Right side — top bar + content */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-12 bg-white border-b border-stone-200 flex items-center justify-between px-6 shrink-0">
          {/* Left — household name */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400 font-medium uppercase tracking-wide">Household</span>
            <span className="text-xs text-stone-300">·</span>
            <span className="text-xs text-stone-600 font-medium">{user?.display_name}'s account</span>
          </div>

          {/* Right — language toggle + avatar */}
          <div className="flex items-center gap-3">
            {/* EN / FR toggle */}
            <div className="flex items-center gap-0.5 bg-stone-100 rounded-md p-0.5">
              <button className="px-2.5 py-1 rounded text-xs font-medium bg-white text-stone-800 shadow-sm">
                EN
              </button>
              <button className="px-2.5 py-1 rounded text-xs font-medium text-stone-400 hover:text-stone-600">
                FR
              </button>
            </div>

            {/* Avatar */}
            <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
              <span className="text-xs font-semibold text-amber-700">
                {user?.display_name?.[0]?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}