import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/Dashboard';
import Banks from './pages/Banks';
import Accounts from './pages/Accounts';
import Transactions from './pages/Transactions';
import Archives from './pages/Archives';
import SuperAdminPanel from './pages/SuperAdminPanel';
import Users from './pages/Users';

function DashboardRedirect() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <AdminDashboard />;
  return <ClientDashboard />;
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardRedirect />} />
          <Route path="banks" element={<ProtectedRoute adminOnly><Banks /></ProtectedRoute>} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="archives" element={<Archives />} />
          <Route path="stella-panel" element={<ProtectedRoute adminOnly><SuperAdminPanel /></ProtectedRoute>} />
          <Route path="users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
