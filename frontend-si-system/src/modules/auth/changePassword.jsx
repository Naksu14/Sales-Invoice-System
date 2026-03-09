import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthBackground from '../../components/auth/authBackground'
import Container from '../../components/auth/container'
import AuthButton from '../../components/auth/button'
import { resetPassword } from '../../services/authService'

export const ChangePassword = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const email = location.state?.email || ''
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    if (!email) {
      setErrorMessage('Email is missing. Please verify OTP again.')
      return
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(email, newPassword)
      navigate('/login')
    } catch (error) {
      console.error('Password reset failed:', error)
      const message =
        error?.message ||
        error?.error ||
        'Failed to reset password. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthBackground>
      <Container
        title="Change Password"
        subtitle="Enter your new password"
        footer={<span>Remembered your password? <span className="text-blue-500 hover:underline ml-1" onClick={() => navigate('/login')}>Login</span></span>}
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm Password"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          <AuthButton
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Changing...' : 'Change Password'}
          </AuthButton>
          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
        </form>
      </Container>
    </AuthBackground>
  )
}
