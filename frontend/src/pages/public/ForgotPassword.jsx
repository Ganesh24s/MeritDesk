import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiOutlineMail, HiArrowLeft, HiOutlineShieldCheck, HiArrowRight, HiOutlineKey } from 'react-icons/hi'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

export default function ForgotPassword() {
  const navigate = useNavigate()
  
  const [step, setStep] = useState(1) // 1: Request OTP, 2: Verify OTP, 3: New Password
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      toast.success('If an account exists, a 6-digit OTP has been sent to your email.')
      setStep(2)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to request password reset')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return
    setLoading(true)
    try {
      await api.post('/auth/verify-reset-otp', { otp })
      toast.success('OTP verified! You can now choose a new password.')
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/auth/reset-password', { token: otp, password })
      const data = res.data
      
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data))
      
      toast.success('Password successfully reset! Logging you in...')
      
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 1500)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary-500/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center gap-2 mb-6 group">
            <img src="/logo.png" alt="MeritDesk Logo" className="w-16 h-16 object-contain group-hover:scale-110 transition-transform" />
          </Link>
          <h1 className="text-2xl font-bold text-white">Reset Password</h1>
          <p className="text-surface-400 mt-2 text-sm">
            {step === 1 && "Enter your email and we'll send you an OTP"}
            {step === 2 && "Enter the OTP sent to your email to verify"}
            {step === 3 && "Choose a strong new password"}
          </p>
        </div>

        <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-8 backdrop-blur-xl transition-all duration-300">
          {step === 1 && (
            <form onSubmit={handleRequestOtp} className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
                  placeholder="name@company.com" 
                />
              </div>
              <button type="submit" disabled={loading || !email} className="w-full btn-primary !py-3 flex items-center justify-center gap-2">
                {loading ? <span className="animate-pulse">Sending OTP...</span> : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-primary-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <HiOutlineShieldCheck className="w-6 h-6 text-primary-400" />
                </div>
                <p className="text-surface-400 text-sm">OTP sent to <span className="text-white font-medium">{email}</span></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5 text-center">Enter 6-Digit OTP</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 text-center tracking-[0.5em] font-bold text-xl focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
                  placeholder="------" 
                />
              </div>
              <button type="submit" disabled={loading || otp.length !== 6} className="w-full btn-primary !py-3 flex items-center justify-center gap-2">
                {loading ? <span className="animate-pulse">Verifying...</span> : 'Verify OTP'} <HiArrowRight />
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <HiOutlineKey className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-emerald-400 font-medium text-sm">OTP Verified Successfully</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">New Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
                  placeholder="••••••••" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-1.5">Confirm Password</label>
                <input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder:text-surface-500 focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500 outline-none transition-all"
                  placeholder="••••••••" 
                />
              </div>
              <button type="submit" disabled={loading || !password || !confirmPassword} className="w-full btn-primary !py-3 flex items-center justify-center gap-2">
                {loading ? <span className="animate-pulse">Saving...</span> : 'Reset Password'} <HiArrowRight />
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-surface-400 hover:text-white inline-flex items-center gap-2 transition-colors">
            <HiArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
