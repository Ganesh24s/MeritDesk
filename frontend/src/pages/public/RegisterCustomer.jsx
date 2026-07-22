import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'
import api from '../../api/axios'

export default function RegisterCustomer() {
  const navigate = useNavigate()
  const { login: authLogin } = useAuth()
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState([])
  const [form, setForm] = useState({ name: '', email: '', password: '', companyId: '', phone: '' })

  useEffect(() => {
    api.get('/auth/active-companies').then(res => setCompanies(res.data || [])).catch(() => {})
  }, [])

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.post('/auth/register-customer', { ...form, companyId: Number(form.companyId) })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data))
      toast.success('Registration successful!')
      window.location.href = '/dashboard'
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-accent-500/15 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 mb-6">
            <img src="/logo.png" alt="MeritDesk Logo" className="w-24 h-24 object-contain" />
            <span className="font-bold text-2xl bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">MeritDesk</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Customer Sign Up</h1>
          <p className="text-surface-400 mt-2 text-sm">Create an account to raise and track tickets</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.05] border border-white/10 rounded-2xl p-8 backdrop-blur-xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Full Name *</label>
            <input type="text" value={form.name} onChange={update('name')} required className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={update('email')} required className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Password *</label>
            <input type="password" value={form.password} onChange={update('password')} required minLength={6} className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Company *</label>
            <select value={form.companyId} onChange={update('companyId')} required className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/10 text-white focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all cursor-pointer">
              <option value="" className="bg-surface-900 text-surface-300">Select a company</option>
              {companies.map(c => <option key={c.id} value={c.id} className="bg-surface-900 text-white">{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Phone</label>
            <input type="tel" value={form.phone} onChange={update('phone')} className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-60">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-400">
          Already have an account? <Link to="/customer-login" className="text-primary-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
