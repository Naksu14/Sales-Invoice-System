import React, { useState } from 'react'

// Replace this URL with the Apps Script Web App URL after you deploy it
const WEBAPP_URL = '<PASTE_YOUR_WEBAPP_URL_HERE>'

export default function SheetsTest() {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setMessage(null)
    if (!name.trim()) return setMessage({ type: 'error', text: 'Name is required' })
    setLoading(true)
    try {
      const res = await fetch(WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), age: age.trim() })
      })

      // If deployed as "Anyone, even anonymous" you will get JSON back
      const data = await res.json().catch(() => null)
      setMessage({ type: 'success', text: (data && data.message) || 'Submitted' })
      setName('')
      setAge('')
    } catch (err) {
      console.error(err)
      setMessage({ type: 'error', text: err.message || 'Submission failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">Google Sheets Test — Add Name & Age</h2>

      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm text-slate-700">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-md border px-3 py-2" />

        <label className="block text-sm text-slate-700">Age</label>
        <input value={age} onChange={(e) => setAge(e.target.value)} className="w-full rounded-md border px-3 py-2" />

        {message && (
          <div className={`text-sm ${message.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {message.text}
          </div>
        )}

        <div className="pt-2">
          <button type="submit" className="bg-black text-white px-4 py-2 rounded-md" disabled={loading}>
            {loading ? 'Sending...' : 'Send to Sheet'}
          </button>
        </div>
      </form>
    </div>
  )
}
