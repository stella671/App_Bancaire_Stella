import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Wallet,
  Archive,
  ArrowLeftRight,
  Sparkles,
  LogOut,
  Shield,
  Users,
  User,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminNavItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/banks', label: 'Banques', icon: Building2 },
  { to: '/accounts', label: 'Comptes', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/archives', label: 'Archives', icon: Archive },
  { to: '/users', label: 'Utilisateurs', icon: Users },
];

const userNavItems = [
  { to: '/dashboard', label: 'Mes comptes', icon: Wallet },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
];

function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                <span className="gradient-text">Stella</span>Bank
              </span>
            </NavLink>

            <nav className="flex items-center gap-1">
              {(user?.role === 'admin' ? adminNavItems : userNavItems).map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {user?.role === 'admin' ? <Shield className="w-4 h-4 text-primary-400" /> : <User className="w-4 h-4 text-gray-400" />}
                {user?.role === 'admin' ? (
                  <span className="text-xs bg-primary-500/20 text-primary-300 px-2 py-0.5 rounded-full">admin</span>
                ) : (
                  <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">client</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
              >
                <LogOut className="w-4 h-4" />
                D&eacute;connexion
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        <Outlet />
      </main>

      <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Sparkles className="w-4 h-4 text-primary-500" />
              <span>StellaBank &copy; {new Date().getFullYear()} &mdash; Tous droits r&eacute;serv&eacute;s</span>
            </div>
            <div className="flex items-center gap-4 text-gray-600 text-xs">
              <span>Propuls&eacute; par StellaBank</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
