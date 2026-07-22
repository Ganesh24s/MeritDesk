import { Link } from 'react-router-dom'
import { HiOutlineXCircle } from 'react-icons/hi'

export default function PaymentCancel() {
  return (
    <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-red-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="relative z-10 text-center max-w-lg bg-surface-900/50 backdrop-blur-xl border border-surface-800 rounded-2xl p-10">
        <HiOutlineXCircle className="w-24 h-24 text-red-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Payment Cancelled</h1>
        <p className="text-surface-300 mb-8 leading-relaxed">
          The checkout process was cancelled and you have not been charged. You can try upgrading again whenever you're ready from your billing dashboard.
        </p>
        <Link to="/dashboard" className="btn-secondary w-full inline-block !py-3">
          Return to Dashboard
        </Link>
      </div>
    </div>
  )
}
