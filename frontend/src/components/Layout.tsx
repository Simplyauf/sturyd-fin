import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, Send, Shield, LogOut } from 'lucide-react';

interface LayoutProps {
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const Layout: React.FC<LayoutProps> = ({ isAuthenticated, isAdmin }) => {
  const location = useLocation();

  if (!isAuthenticated) return <Outlet />;

  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
  };

  let user: { email?: string } = {};
  try { user = JSON.parse(localStorage.getItem('user') || '{}'); } catch { user = {}; }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3 text-primary-600 font-bold text-xl">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-sm">
              <Send className="w-4 h-4 text-white" />
            </div>
            <span>FinRemit</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {isAdminRoute ? (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === '/admin' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Shield className="w-5 h-5" />
              <span>Admin Panel</span>
            </Link>
          ) : (
            <>
              <Link
                to="/"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  location.pathname === '/' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              {/* Other user links can go here */}
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-200 bg-gray-50/50">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
              <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'User'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-gray-200 flex items-center justify-between px-8 bg-white sticky top-0 z-10 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-800">
            {isAdminRoute ? 'Operations Portal' : 'My Dashboard'}
          </h1>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px]">{user.email}</p>
              <p className="text-xs text-gray-500">{isAdminRoute ? 'Admin Mode' : 'Standard View'}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold shadow-sm">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <div className="p-8 overflow-y-auto flex-1 bg-gray-50">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
