import React, { useState } from 'react'
import { login } from '../../services/authService'
import { useNavigate } from 'react-router-dom'
import AuthBackground from '../../components/auth/authBackground'
import Container from '../../components/auth/container'
import AuthButton from '../../components/auth/button'

export const Login = () => {
    const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

    const handleLogin = async (e) => {
        e.preventDefault()
    setErrorMessage('')
    const form = e.currentTarget
    const email = form.email.value
    const password = form.password.value
        try {
            await login(email, password)
            navigate('/dashboard')
        } catch (error) {
        setErrorMessage('Login failed. Please check your credentials and try again.')
        }
    }

  return (
    <AuthBackground>
      <Container
        title="Login"
        subtitle="Sign in to continue to SI System"
        footer={<span>Forgot your password? <span className="text-blue-500 hover:underline ml-1" onClick={() => navigate('/forgot-password')}>Reset it here</span></span>}
      >
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
          />
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Password"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm outline-none focus:border-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M3.53 2.47a.75.75 0 0 0-1.06 1.06l2.18 2.18C2.89 7.03 1.71 8.74 1.19 10.1a2.37 2.37 0 0 0 0 1.8C2.44 15.16 6.01 19.5 12 19.5c2.28 0 4.24-.63 5.88-1.63l2.59 2.59a.75.75 0 1 0 1.06-1.06L3.53 2.47Zm11.7 11.7-4.4-4.4a2.25 2.25 0 0 0 3.4 3.4Z" />
                  <path d="M12 6c5.99 0 9.56 4.34 10.81 7.6a2.37 2.37 0 0 1 0 1.8c-.27.7-.73 1.52-1.38 2.37l-2.13-2.13a5.25 5.25 0 0 0-6.94-6.94L9.93 6.27A11.9 11.9 0 0 1 12 6Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M1.19 12.1a2.37 2.37 0 0 1 0-1.8C2.44 7.04 6.01 2.7 12 2.7s9.56 4.34 10.81 7.6a2.37 2.37 0 0 1 0 1.8C21.56 15.36 17.99 19.7 12 19.7S2.44 15.36 1.19 12.1Zm10.81 4.1a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Zm0-2.25a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                </svg>
              )}
            </button>
          </div>
          <AuthButton>
            Login
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
