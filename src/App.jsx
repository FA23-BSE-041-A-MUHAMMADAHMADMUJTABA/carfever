import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Shared Components
import Nav from './components/Nav';
import Footer from './components/Footer';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ListingsPage from './pages/ListingsPage';
import DetailPage from './pages/DetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';

// Dashboards
import SellerDashboard from './pages/dashboards/SellerDashboard';
import BuyerDashboard from './pages/dashboards/BuyerDashboard';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import ContractDetailsPage from './pages/dashboards/ContractDetailsPage';

function AppRoutes() {
  const { user } = useAuth();
  const location = useLocation();
  const isDashboard = ['/seller', '/buyer', '/admin'].some(p => location.pathname.startsWith(p));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  return (
    <>
      {!isDashboard && location.pathname !== '/admin/login' && <Nav />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<><HomePage /><Footer /></>} />
        <Route path="/listings" element={<><ListingsPage /><Footer /></>} />
        <Route path="/car/:id" element={<><DetailPage /><Footer /></>} />
        
        {/* Auth Routes */}
        <Route path="/login" element={user ? <Navigate to={user.role === 'seller' ? '/seller' : user.role === 'admin' ? '/admin' : '/buyer'} /> : <LoginPage />} />
        <Route path="/register" element={user ? <Navigate to={user.role === 'seller' ? '/seller' : '/buyer'} /> : <RegisterPage />} />
        <Route path="/admin/login" element={user?.role === 'admin' ? <Navigate to="/admin" /> : <AdminLoginPage />} />
        
        {/* Dashboards (Protected) */}
        <Route path="/seller/*" element={<ProtectedRoute roles={['seller']}><SellerDashboard /></ProtectedRoute>} />
        <Route path="/buyer/*" element={<ProtectedRoute roles={['buyer']}><BuyerDashboard /></ProtectedRoute>} />
        <Route path="/admin/*" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        
        {/* Contracts (Protected) */}
        <Route path="/buyer/contract/:id" element={<ProtectedRoute roles={['buyer']}><ContractDetailsPage /></ProtectedRoute>} />
        <Route path="/seller/contract/:id" element={<ProtectedRoute roles={['seller']}><ContractDetailsPage /></ProtectedRoute>} />
        <Route path="/admin/contract/:id" element={<ProtectedRoute roles={['admin']}><ContractDetailsPage /></ProtectedRoute>} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toast />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </AuthProvider>
  );
}
