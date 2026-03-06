import React, { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import AuthBackground from '../../components/auth/authBackground'
import Container from '../../components/auth/container'
import AuthButton from '../../components/auth/button'
import { verifyOtp } from '../../services/authService'

export const OtpVerification = () => {
    const navigate = useNavigate()
	const location = useLocation()
	const email = location.state?.email || ''
    const [otp, setOtp] = useState('')
    const [errorMessage, setErrorMessage] = useState('')

	const handleVerifyOtp = async () => {
		setErrorMessage('')

		if (!email) {
			setErrorMessage('Email is missing. Please go back to Forgot Password and request OTP again.')
			return
		}

		if (!/^\d{6}$/.test(otp)) {
			setErrorMessage('Please enter a valid 6-digit OTP.')
			return
		}

		try {
			await verifyOtp(email, otp)
			navigate('/change-password')
		} catch (error) {
			console.error('OTP verification failed:', error)
			const message =
				error?.message ||
				error?.error ||
				'OTP verification failed. Please try again.'
			setErrorMessage(message)
		}
	}

	return (
		<AuthBackground>
			<Container
				title="OTP Verification"
				subtitle="Enter the 6-digit code sent to your email"
				footer={<span>Didn&apos;t get a code? <span className="text-blue-500 hover:underline ml-1">Resend Code</span></span>}
			>
				<input
					type="text"
					value={otp}
					onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
					placeholder="Enter OTP"
					maxLength={6}
					className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-gray-400"
				/>
				<AuthButton
					type="button"
                    onClick={handleVerifyOtp}
				>
					Verify OTP
				</AuthButton>
				{errorMessage && (
					<div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
						{errorMessage}
					</div>
				)}
			</Container>
		</AuthBackground>
	)
}

