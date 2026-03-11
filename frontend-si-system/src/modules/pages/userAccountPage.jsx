import React, { useEffect, useState } from 'react'
import PersonIcon from '@mui/icons-material/Person'
import LockIcon from '@mui/icons-material/Lock'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../../components/pageLayout'
import { getCurrentUser, resetPassword } from '../../services/authService'
import { updateUserProfile } from '../../services/userServices'

export const UserAccountPage = () => {
  const queryClient = useQueryClient()

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
  })

  const [updatedUser, setUpdatedUser] = useState({ full_name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')
  const [passwordMessage, setPasswordMessage] = useState('')
  const [profileError, setProfileError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (!user) return
    setUpdatedUser({
      full_name: user.full_name || '',
      email: user.email || '',
    })
  }, [user])

  const handleSaveProfile = async () => {
    setProfileError('')
    setProfileMessage('')

    if (!user?.user_id) {
      setProfileError('Unable to update profile: missing user ID.')
      return
    }

    if (!updatedUser.full_name?.trim() || !updatedUser.email?.trim()) {
      setProfileError('Full name and email are required.')
      return
    }

    setProfileLoading(true)
    try {
      const updated = await updateUserProfile(user.user_id, {
        full_name: updatedUser.full_name.trim(),
        email: updatedUser.email.trim(),
      })

      const normalizedUser = {
        ...user,
        ...updated,
        full_name: updated?.full_name ?? updatedUser.full_name.trim(),
        email: updated?.email ?? updatedUser.email.trim(),
      }

      localStorage.setItem('user', JSON.stringify(normalizedUser))
      sessionStorage.setItem('user', JSON.stringify(normalizedUser))
      setUpdatedUser({
        full_name: normalizedUser.full_name || '',
        email: normalizedUser.email || '',
      })
      queryClient.setQueryData(['currentUser'], normalizedUser)
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      setProfileMessage('Profile updated successfully.')
    } catch (error) {
      setProfileError(error?.message || error?.error || 'Failed to update profile.')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleUpdatePassword = async () => {
    setPasswordError('')
    setPasswordMessage('')

    if (!updatedUser.email?.trim()) {
      setPasswordError('Email is required to update password.')
      return
    }

    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New password and confirm password do not match.')
      return
    }

    setPasswordLoading(true)
    try {
      await resetPassword(updatedUser.email.trim(), passwordForm.newPassword)
      setPasswordMessage('Password updated successfully.')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      setPasswordError(error?.message || error?.error || 'Failed to update password.')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto w-full space-y-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-700">PROFILE SETTINGS</h1>
            <p className="mt-1 text-lg text-slate-500">Manage your account settings</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-4 ">
            <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-slate-600">
                <PersonIcon sx={{ fontSize: 18 }} />
                <h2 className="text-sm font-semibold tracking-wide">PERSONAL INFORMATION</h2>
              </div>

              <div className="mx-auto w-full max-w-[520px] space-y-4 p-4">
                <label className="text-sm text-slate-600">
                  <span className="mb-1 block">Full Name</span>
                  <input
                    type="text"
                    value={updatedUser.full_name}
                    onChange={(e) => setUpdatedUser((prev) => ({ ...prev, full_name: e.target.value }))}
                    className="h-10 w-full rounded-sm border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
                  />
                </label>

                <label className="text-sm text-slate-600">
                  <span className="mb-1 block">Email Address</span>
                  <input
                    type="email"
                    value={updatedUser.email}
                    onChange={(e) => setUpdatedUser((prev) => ({ ...prev, email: e.target.value }))}
                    className="h-10 w-full rounded-sm border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none focus:border-slate-300"
                  />
                </label>

                <label className="text-sm text-slate-600">
                  <span className="mb-1 block">User Role</span>
                  <input
                    type="text"
                    value={user?.role || ''}
                    readOnly
                    className="h-10 w-full cursor-not-allowed rounded-sm border border-slate-200 bg-slate-100 px-3 text-sm text-slate-500 outline-none"
                  />
                </label>
              </div>

              <div className="mx-auto mt-8 flex w-full max-w-[520px] justify-end">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={profileLoading}
                  className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#222625]"
                >
                  {profileLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              {profileError && (
                <div className="text-center mx-auto mt-3 w-full max-w-[520px] rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {profileError}
                </div>
              )}
              {profileMessage && (
                <div className="text-center mx-auto mt-3 w-full max-w-[520px] rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {profileMessage}
                </div>
              )}
            </section>

            <section className="rounded-md border border-slate-300 bg-white p-5 shadow-sm">
              <div className="mb-6 flex items-center gap-2 text-slate-600">
                <LockIcon sx={{ fontSize: 18 }} />
                <h2 className="text-sm font-semibold tracking-wide">PASSWORD AND SECURITY</h2>
              </div>

              <div className="mx-auto w-full max-w-[520px] space-y-4">
                <label className="block text-sm text-slate-600">
                  <span className="mb-1 block">Current Password</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="Enter Current Password"
                    className="h-10 w-full rounded-sm border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300"
                  />
                </label>

                <label className="block text-sm text-slate-600">
                  <span className="mb-1 block">New Password</span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                    placeholder="Enter New Password"
                    className="h-10 w-full rounded-sm border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300"
                  />
                </label>

                <label className="block text-sm text-slate-600">
                  <span className="mb-1 block">Confirm New Password</span>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Confirm New Password"
                    className="h-10 w-full rounded-sm border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-300"
                  />
                </label>
              </div>

              <div className="mx-auto mt-8 flex w-full max-w-[520px] justify-end">
                <button
                  type="button"
                  onClick={handleUpdatePassword}
                  disabled={passwordLoading}
                  className="rounded-md bg-black px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-[#222625]"
                >
                  {passwordLoading ? 'Updating...' : 'Update'}
                </button>
              </div>
              {passwordError && (
                <div className="text-center mx-auto mt-3 w-full max-w-[520px] rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {passwordError}
                </div>
              )}
              {passwordMessage && (
                <div className="text-center mx-auto mt-3 w-full max-w-[520px] rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  {passwordMessage}
                </div>
              )}
            </section>
          </div>
      </div>
    </PageLayout>
  )
}
