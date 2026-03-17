import React, { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageLayout } from '../../components/pageLayout'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { getCurrentUser } from '../../services/authService'
import { createUser, deleteUser, getUsers, updateUser } from '../../services/userServices'

const INITIAL_FORM = {
  full_name: '',
  email: '',
  role: 'encoder',
  password: '',
}

export const UserManagementPage = () => {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState(INITIAL_FORM)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: currentUser, isLoading: loadingCurrentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  })

  const isAdmin = currentUser?.role === 'admin'

  const {
    data: users = [],
    isLoading: loadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ['si-users'],
    queryFn: getUsers,
    enabled: !!isAdmin,
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['si-users'] })
      closeForm()
    },
    onError: (err) => {
      setFormError(err?.message || err?.error || 'Failed to create user.')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ userId, payload }) => updateUser(userId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['si-users'] })
      closeForm()
    },
    onError: (err) => {
      setFormError(err?.message || err?.error || 'Failed to update user.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['si-users'] })
    },
  })

  const closeForm = () => {
    setFormOpen(false)
    setEditingUser(null)
    setFormData(INITIAL_FORM)
    setFormError('')
  }

  const openCreateForm = () => {
    setEditingUser(null)
    setFormData(INITIAL_FORM)
    setFormError('')
    setFormOpen(true)
  }

  const openEditForm = (user) => {
    setEditingUser(user)
    setFormError('')
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      role: user.role || 'encoder',
      password: '',
    })
    setFormOpen(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFormError('')

    if (!formData.full_name.trim() || !formData.email.trim() || !formData.role) {
      setFormError('Full name, email, and role are required.')
      return
    }

    if (!editingUser && formData.password.trim().length < 6) {
      setFormError('Password is required and must be at least 6 characters for new users.')
      return
    }

    if (editingUser) {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        role: formData.role,
      }
      if (formData.password.trim()) {
        payload.password = formData.password.trim()
      }
      updateMutation.mutate({ userId: editingUser.user_id, payload })
      return
    }

    createMutation.mutate({
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      password: formData.password.trim(),
    })
  }

  const handleDelete = (user) => {
    if (!user?.user_id) return
    if (user.user_id === currentUser?.user_id) {
      window.alert('You cannot delete your own account.')
      return
    }

    setDeleteTarget(user)
  }

  const closeDeleteModal = () => {
    if (deleteMutation.isPending) return
    setDeleteTarget(null)
  }

  const confirmDelete = () => {
    if (!deleteTarget?.user_id) return
    deleteMutation.mutate(deleteTarget.user_id, {
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: ['si-users'] })
        setDeleteTarget(null)
      },
    })
  }

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return users

    return users.filter((u) => {
      const blob = `${u.user_id} ${u.full_name || ''} ${u.email || ''} ${u.role || ''}`.toLowerCase()
      return blob.includes(q)
    })
  }, [searchTerm, users])

  if (loadingCurrentUser) {
    return (
      <PageLayout>
        <p className="text-sm text-slate-600">Loading user permissions...</p>
      </PageLayout>
    )
  }

  if (!isAdmin) {
    return (
      <PageLayout>
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800">
          Admin access required. You do not have permission to manage users.
        </div>
      </PageLayout>
    )
  }

  return (
    <>
      <PageLayout>
        <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-700">USER MANAGEMENT</h1>
            <p className="mt-1 text-lg text-slate-500">Create, update, and delete user accounts</p>
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-md bg-[#0b2a32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#113743]"
          >
            Create Account
          </button>
        </div>

        <div className="rounded-md border border-slate-300 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search name, email, role..."
              className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          {usersError ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {usersError?.message || usersError?.error || 'Failed to load users.'}
            </div>
          ) : null}

          {loadingUsers ? (
            <p className="text-sm text-slate-600">Loading users...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-y-0 text-sm">
                <thead>
                  <tr className="bg-slate-100 text-left text-slate-700">
                    <th className="rounded-l-md px-4 py-2">ID</th>
                    <th className="px-4 py-2">Full Name</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Role</th>
                    <th className="px-4 py-2">Created</th>
                    <th className="rounded-r-md px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border-b border-slate-200 px-4 py-6 text-center text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.user_id} className="text-slate-700">
                        <td className="border-b border-slate-200 px-4 py-3">{user.user_id}</td>
                        <td className="border-b border-slate-200 px-4 py-3">{user.full_name}</td>
                        <td className="border-b border-slate-200 px-4 py-3">{user.email}</td>
                        <td className="border-b border-slate-200 px-4 py-3 capitalize">{user.role}</td>
                        <td className="border-b border-slate-200 px-4 py-3">
                          {user.created_at ? new Date(user.created_at).toLocaleString() : '-'}
                        </td>
                        <td className="border-b border-slate-200 px-4 py-3">
                          <div className="flex gap-2">
                            {user.user_id !== currentUser?.user_id ? (
                                <>
                                <button
                              type="button"
                              onClick={() => openEditForm(user)}
                              className="rounded border border-slate-300 px-3 py-1.5 hover:bg-slate-100"
                            >
                              Edit
                            </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(user)}
                                disabled={deleteMutation.isPending}
                                className="rounded border border-rose-300 px-3 py-1.5 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                              >
                                Delete
                              </button></>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      </PageLayout>

      {formOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800">
              {editingUser ? 'Edit User Account' : 'Create User Account'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {editingUser
                ? 'Update user details. Leave password blank to keep current password.'
                : 'Fill details to create a new user account.'}
            </p>

            <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
              <label className="block text-sm text-slate-700">
                <span className="mb-1 block">Full Name</span>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none"
                />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1 block">Email</span>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none"
                />
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1 block">Role</span>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none"
                >
                  <option value="admin">Admin</option>
                  <option value="encoder">Encoder</option>
                </select>
              </label>

              <label className="block text-sm text-slate-700">
                <span className="mb-1 block">Password {editingUser ? '(optional)' : ''}</span>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 outline-none"
                />
              </label>

              {formError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {formError}
                </div>
              ) : null}

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-md bg-[#0b2a32] px-4 py-2 text-sm font-medium text-white hover:bg-[#113743] disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingUser
                      ? 'Update User'
                      : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete User"
        message={deleteTarget ? `Delete user "${deleteTarget.full_name}"? This action cannot be undone.` : 'Delete this user?'}
        confirmText={deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        cancelText="Cancel"
        onCancel={closeDeleteModal}
        onConfirm={confirmDelete}
      />
    </>
  )
}
