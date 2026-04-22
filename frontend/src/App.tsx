import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { api } from './api/fintech-api';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import Layout from './components/Layout';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    let user: { email?: string } = {};
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    if (token && user.email) {
      api.setToken(token);
      setIsAuthenticated(true);
      if (user.email.includes('admin@')) {
        setIsAdmin(true);
      }
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login setIsAuth={setIsAuthenticated} setIsAdmin={setIsAdmin} /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Register setIsAuth={setIsAuthenticated} /> : <Navigate to="/" />} />
        
        <Route element={<Layout isAuthenticated={isAuthenticated} isAdmin={isAdmin} />}>
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/admin" element={isAuthenticated && isAdmin ? <AdminDashboard /> : <Navigate to="/" />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
