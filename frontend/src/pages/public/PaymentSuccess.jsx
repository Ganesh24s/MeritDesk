import { useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { HiCheckCircle } from 'react-icons/hi'

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const navigate = useNavigate()

  useEffect(() => {
    if (!sessionId) {
      navigate('/dashboard')
    }
  }, [sessionId, navigate])

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 text-center max-w-lg bg-surface-900/50 backdrop-blur-xl border border-surface-800 rounded-2xl p-10">
        <HiCheckCircle className="w-24 h-24 text-emerald-400 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
        <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
        <p className="text-surface-300 mb-8 leading-relaxed">
          Thank you for upgrading to the Enterprise tier! Your subscription is now active, and you have unlocked all premium features for your company.
        </p>
        <Link to="/dashboard" className="btn-primary w-full inline-block !py-3">
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
