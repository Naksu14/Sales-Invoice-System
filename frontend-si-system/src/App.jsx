import React from 'react'
import { Login } from './modules/auth/login'
import { ForgotPassword } from './modules/auth/forgotPassword'
import { OtpVerification } from './modules/auth/otpVerification'
import { ChangePassword } from './modules/auth/changePassword'
import { DashboardPage } from './modules/pages/dashboardPage'
import { SalesInvoicePage } from './modules/pages/salesInvoicePage'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <div className="flex">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/otp-verification" element={<OtpVerification />} />
          <Route path="/change-password" element={<ChangePassword />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/sales-invoice" element={<SalesInvoicePage />} />
        </Routes>
      </Router>
    </div>
  )
}

export default App
