import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthBackground from '../../components/auth/authBackground'
import Container from '../../components/auth/container'
import AuthButton from '../../components/auth/button'
import { sendOtp } from '../../services/authService'

export const ForgotPassword = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setErrorMessage('')

    const trimmedEmail = email.trim()
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)

    if (!trimmedEmail) {
      setErrorMessage('Email is required.')
      return
    }

    if (!isEmailValid) {
      setErrorMessage('Please enter a valid email address.')
      return
    }

    setIsLoading(true)
    try {
      await sendOtp(trimmedEmail)
      navigate('/otp-verification', { state: { email: trimmedEmail } })
    } catch (error) {
      const message =
        error?.message ||
        error?.error ||
        'Failed to send OTP. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthBackground>
      <Container
        title="Forgot Password"
        subtitle="Enter your email to receive a verification code"
        footer={
        <span>Remembered your password?<span className="text-blue-500 hover:underline ml-1" onClick={() => navigate('/login')}>Login</span> 
        </span>
    }
      >
        <form onSubmit={handleSendOtp} className="space-y-4">
          <input
            type="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          <AuthButton
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send OTP'}
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
