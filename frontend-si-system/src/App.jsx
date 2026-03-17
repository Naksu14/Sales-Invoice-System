import React from 'react'
import { Login } from './modules/auth/login'
import { ForgotPassword } from './modules/auth/forgotPassword'
import { OtpVerification } from './modules/auth/otpVerification'
import { ChangePassword } from './modules/auth/changePassword'
import { DashboardPage } from './modules/pages/dashboardPage'
import { SalesInvoicePage } from './modules/pages/salesInvoicePage'
import { InvoiceProfilePage } from './modules/pages/invoiceProfilePage'
import { UserAccountPage } from './modules/pages/userAccountPage'
import { UserManagementPage } from './modules/pages/userManagementPage'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

const hasAuthToken = () => {
  const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token')
  return Boolean(token)
}

const ProtectedRoute = ({ children }) => {
  return hasAuthToken() ? children : <Navigate to="/login" replace />
}

const GuestRoute = ({ children }) => {
  return hasAuthToken() ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <div className="flex">
      <Router>
        <Routes>
          <Route
            path="/"
            element={<Navigate to={hasAuthToken() ? '/dashboard' : '/login'} replace />}
          />

          <Route
            path="/login"
            element={
              <GuestRoute>
                <Login />
              </GuestRoute>
            }
          />

          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/change-password" element={<ChangePassword />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sales-invoice"
            element={
              <ProtectedRoute>
                <SalesInvoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/invoice-profile"
            element={
              <ProtectedRoute>
                <InvoiceProfilePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-account"
            element={
              <ProtectedRoute>
                <UserAccountPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-management"
            element={
              <ProtectedRoute>
                <UserManagementPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
