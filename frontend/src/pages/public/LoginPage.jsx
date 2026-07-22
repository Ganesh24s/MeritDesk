import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'

export default function LoginPage() {
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
      toast.success(`Welcome back, ${data.name}!`)
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
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-60 h-60 bg-accent-500/15 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1 mb-6">
            <img src="/logo.png" alt="MeritDesk Logo" className="w-24 h-24 object-contain" />
            <span className="font-bold text-2xl bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">MeritDesk</span>
          </Link>
          <h1 className="text-2xl font-bold text-white">Sign In to MeritDesk</h1>
          <p className="text-surface-400 mt-2 text-sm">Access your intelligent ticket management dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/[0.05] border border-white/10 rounded-2xl p-8 backdrop-blur-xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
              placeholder="you@company.com" />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-sm font-medium text-surface-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary-400 hover:underline">Forgot password?</Link>
            </div>
            <input 
              type="password" 
              value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
              placeholder="••••••••" />
          </div>
            <button type="submit" disabled={loading} className="w-full btn-primary !py-3 flex items-center justify-center gap-2">
              {loading ? <span className="animate-pulse">Signing In...</span> : 'Sign In'}
            </button>
        </form>



        <div className="mt-4 text-center text-sm text-surface-400 space-y-1 text-xs">
          <p>Are you a company admin? <Link to="/register-company" className="text-primary-400 hover:underline">Register your company</Link></p>
          <p>Don't have an account? <Link to="/register-customer" className="text-primary-400 hover:underline">Sign up as a customer</Link></p>
        </div>
      </div>
    </div>
  )
}
