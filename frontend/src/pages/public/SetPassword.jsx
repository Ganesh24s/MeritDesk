import { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../api/axios'

export default function SetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const res = await api.post('/auth/set-password', { token, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data))
      toast.success('Password set successfully! Welcome!')
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 w-80 h-80 bg-primary-500/15 rounded-full blur-[120px]"></div>
      </div>
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-lg">M</div>
            <span className="font-bold text-2xl bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">MeritDesk</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Set Your Password</h1>
          <p className="text-surface-400 mt-2 text-sm">Create a secure password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.05] border border-white/10 rounded-2xl p-8 backdrop-blur-xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
              placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-60">
            {loading ? 'Setting Password...' : 'Set Password & Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
