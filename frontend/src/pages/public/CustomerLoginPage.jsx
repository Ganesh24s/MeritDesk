import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const data = await login(email, password)
      if (data.role !== 'CUSTOMER') {
        toast.error('Please use the Employee Login page')
        return
      }
      toast.success(`Welcome, ${data.name}!`)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-accent-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/3 left-1/4 w-60 h-60 bg-primary-500/15 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 mb-6">
            <img src="/logo.png" alt="MeritDesk Logo" className="w-24 h-24 object-contain" />
            <span className="font-bold text-2xl bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">MeritDesk</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Customer Login</h1>
          <p className="text-surface-400 mt-2 text-sm">Track your tickets and provide feedback</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.05] border border-white/10 rounded-2xl p-8 backdrop-blur-xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
              placeholder="customer@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
              placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full !py-3 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-surface-400 space-y-2">
          <p>Don't have an account? <Link to="/register-customer" className="text-primary-400 hover:underline">Sign Up</Link></p>
          <p>Employee? <Link to="/login" className="text-primary-400 hover:underline">Login here</Link></p>
        </div>
      </div>
    </div>
  )
}
