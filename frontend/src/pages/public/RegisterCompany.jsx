import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import api from '../../api/axios'

export default function RegisterCompany() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    companyName: '', companyEmail: '', industry: '', address: '', size: '',
    adminName: '', adminEmail: '', password: '', logoUrl: '', website: ''
  })

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register-company', form)
      toast.success('Company registered! Please wait for platform admin approval.')
      navigate('/login')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-950 py-20 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/3 w-80 h-80 bg-primary-500/15 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 mb-6">
            <img src="/logo.png" alt="MeritDesk Logo" className="w-24 h-24 object-contain" />
            <span className="font-bold text-2xl bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">MeritDesk</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Register Your Company</h1>
          <p className="text-surface-400 mt-2 text-sm">Set up your intelligent ticket management platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.05] border border-white/10 rounded-2xl p-8 backdrop-blur-xl space-y-6">
          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Company Name *</label>
              <input type="text" value={form.companyName} onChange={update('companyName')} required className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Company Email *</label>
              <input type="email" value={form.companyEmail} onChange={update('companyEmail')} required className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Industry</label>
              <input type="text" value={form.industry} onChange={update('industry')} className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Company Size</label>
              <select value={form.size} onChange={update('size')} className="w-full px-4 py-3 rounded-xl bg-surface-900 border border-white/10 text-white focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all cursor-pointer">
                <option value="" className="bg-surface-900 text-surface-300">Select Company Size</option>
                <option value="1-10" className="bg-surface-900 text-white">1 - 10 employees</option>
                <option value="11-50" className="bg-surface-900 text-white">11 - 50 employees</option>
                <option value="51-200" className="bg-surface-900 text-white">51 - 200 employees</option>
                <option value="201-500" className="bg-surface-900 text-white">201 - 500 employees</option>
                <option value="500+" className="bg-surface-900 text-white">500+ employees</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Address</label>
            <input type="text" value={form.address} onChange={update('address')} className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
          </div>

          <hr className="border-white/10" />
          <h3 className="text-lg font-semibold text-white">Admin Account</h3>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Admin Name *</label>
              <input type="text" value={form.adminName} onChange={update('adminName')} required className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Admin Email *</label>
              <input type="email" value={form.adminEmail} onChange={update('adminEmail')} required className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Password *</label>
            <input type="password" value={form.password} onChange={update('password')} required minLength={6} className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Logo URL</label>
              <input type="url" value={form.logoUrl} onChange={update('logoUrl')} className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-300 mb-1.5">Website</label>
              <input type="url" value={form.website} onChange={update('website')} className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-60">
            {loading ? 'Registering...' : 'Register Company'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-surface-400">
          Already registered? <Link to="/login" className="text-primary-400 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
