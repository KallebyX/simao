import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';

// Layout components
import AuthLayout from '@/components/layouts/AuthLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';

// Auth pages
import Login from '@/pages/auth/Login';
import ForgotPassword from '@/pages/auth/ForgotPassword';
import ResetPassword from '@/pages/auth/ResetPassword';

// Protected pages
import Dashboard from '@/pages/Dashboard';
import Tickets from '@/pages/Tickets';
import TicketDetail from '@/pages/TicketDetail';
import Contacts from '@/pages/Contacts';
import ContactDetail from '@/pages/ContactDetail';
import Users from '@/pages/Users';
import Queues from '@/pages/Queues';
import WhatsAppConnections from '@/pages/WhatsAppConnections';
import Campaigns from '@/pages/Campaigns';
import CampaignDetail from '@/pages/CampaignDetail';
import QuickMessages from '@/pages/QuickMessages';
import ChatBot from '@/pages/ChatBot';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import Tags from '@/pages/Tags';
import ApiTokens from '@/pages/ApiTokens';
import Financeiro from '@/pages/Financeiro';

// Components
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import NotificationContainer from '@/components/ui/NotificationContainer';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

function App() {
  const { isAuthenticated, loading, user } = useAuth();
  
  // Initialize socket connection when authenticated
  const { connect, disconnect } = useSocket({
    autoConnect: isAuthenticated,
    onConnect: () => console.log('Socket connected successfully'),
    onDisconnect: () => console.log('Socket disconnected'),
    onError: (error) => console.error('Socket error:', error)
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, user, connect, disconnect]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : 
            <AuthLayout><Login /></AuthLayout>
          } />
          <Route path="/forgot-password" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : 
            <AuthLayout><ForgotPassword /></AuthLayout>
          } />
          <Route path="/reset-password/:token" element={
            isAuthenticated ? <Navigate to="/dashboard" replace /> : 
            <AuthLayout><ResetPassword /></AuthLayout>
          } />

          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout><Dashboard /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/tickets" element={
            <ProtectedRoute>
              <DashboardLayout><Tickets /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/tickets/:ticketId" element={
            <ProtectedRoute>
              <DashboardLayout><TicketDetail /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/contacts" element={
            <ProtectedRoute>
              <DashboardLayout><Contacts /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/contacts/:contactId" element={
            <ProtectedRoute>
              <DashboardLayout><ContactDetail /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute permission="user:create">
              <DashboardLayout><Users /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/queues" element={
            <ProtectedRoute permission="queue:create">
              <DashboardLayout><Queues /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/whatsapp-connections" element={
            <ProtectedRoute permission="whatsapp:create">
              <DashboardLayout><WhatsAppConnections /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/campaigns" element={
            <ProtectedRoute permission="campaign:create">
              <DashboardLayout><Campaigns /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/campaigns/:campaignId" element={
            <ProtectedRoute permission="campaign:edit">
              <DashboardLayout><CampaignDetail /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/quick-messages" element={
            <ProtectedRoute>
              <DashboardLayout><QuickMessages /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/chatbot" element={
            <ProtectedRoute permission="queue:edit">
              <DashboardLayout><ChatBot /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/tags" element={
            <ProtectedRoute>
              <DashboardLayout><Tags /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/api-tokens" element={
            <ProtectedRoute permission="settings:edit">
              <DashboardLayout><ApiTokens /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute permission="reports:view">
              <DashboardLayout><Reports /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/settings" element={
            <ProtectedRoute permission="settings:edit">
              <DashboardLayout><Settings /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/financeiro" element={
            <ProtectedRoute permission="settings:edit">
              <DashboardLayout><Financeiro /></DashboardLayout>
            </ProtectedRoute>
          } />

          <Route path="/profile" element={
            <ProtectedRoute>
              <DashboardLayout><Profile /></DashboardLayout>
            </ProtectedRoute>
          } />

          {/* Default redirects */}
          <Route path="/" element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
          } />

          {/* 404 fallback */}
          <Route path="*" element={
            isAuthenticated ? 
              <Navigate to="/dashboard" replace /> : 
              <Navigate to="/login" replace />
          } />
        </Routes>

        {/* Global notification container */}
        <NotificationContainer />
      </div>
    </Router>
  );
}

export default App;