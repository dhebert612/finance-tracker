import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore.js';
import AppShell from './components/layout/AppShell.js';
import LoginPage from './pages/LoginPage.js';
import RegisterPage from './pages/RegisterPage.js';
import DashboardPage from './pages/DashboardPage.js';
import PaychecksPage from './pages/PaychecksPage.js';
import BillsPage from './pages/BillsPage.js';
import StatementsPage from './pages/StatementsPage.js';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppShell>{children}</AppShell>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute><LoginPage /></PublicRoute>
          }/>
          <Route path="/register" element={
            <PublicRoute><RegisterPage /></PublicRoute>
          }/>

          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute><DashboardPage /></ProtectedRoute>
          }/>
          <Route path="/paychecks" element={
            <ProtectedRoute><PaychecksPage /></ProtectedRoute>
          }/>
          <Route path="/bills" element={
            <ProtectedRoute><BillsPage /></ProtectedRoute>
          }/>
          <Route path="/statements" element={
            <ProtectedRoute><StatementsPage /></ProtectedRoute>
          }/>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}