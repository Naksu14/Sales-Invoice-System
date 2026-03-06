import React from 'react'
import { useNavigate } from 'react-router-dom'
import AuthBackground from '../../components/auth/authBackground'
import Container from '../../components/auth/container'
import AuthButton from '../../components/auth/button'
import { resetPassword } from '../../services/authService'

export const ChangePassword = () => {
  const navigate = useNavigate()

  const handleChangePassword = async () => {
    try {
      await resetPassword()
      navigate('/login')
    } catch (error) {
      console.error('Password reset failed:', error)
      // Handle error (e.g., show error message to user)
    }
  }
  return (
    <AuthBackground>
      <Container
        title="Change Password"
        subtitle="Enter your new password"
        footer={<span>Remembered your password? <span className="text-blue-500 hover:underline ml-1" onClick={() => navigate('/login')}>Login</span></span>}
      >
        <input
          type="password"
          placeholder="Password"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
        />
        <input
          type="password"
          placeholder="Confirm Password"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
        />
        <AuthButton
          type="button"
          onClick={handleChangePassword}
        >
            Change Password
        </AuthButton>
      </Container>
    </AuthBackground>
  )
}
