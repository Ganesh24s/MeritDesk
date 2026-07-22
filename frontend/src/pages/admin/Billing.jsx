import { useState, useEffect } from 'react'
import { HiOutlineCreditCard, HiOutlineCheckCircle, HiOutlineStar } from 'react-icons/hi'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Billing() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [subscription, setSubscription] = useState(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    fetchSubscription()
    
    // Load Razorpay Script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  const fetchSubscription = async () => {
    try {
      const res = await api.get('/payments/subscription')
      setSubscription(res.data.data)
    } catch (error) {
      toast.error('Failed to fetch subscription status')
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async () => {
    setCheckoutLoading(true)
    try {
      // 1. Create order on backend
      const orderRes = await api.post('/payments/create-order')
      const orderId = orderRes.data.data.orderId

      // 2. Open Razorpay Widget
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TFjRYUVNwv8xOT',
        amount: "29900", // 29900 paise = 299 INR
        currency: "INR",
        name: "MeritDesk Enterprise",
        description: "Upgrade to Enterprise Tier",
        order_id: orderId,
        handler: async function (response) {
          // 3. Verify Payment
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })
            toast.success("Payment successful!")
            navigate('/payment/success')
          } catch (err) {
            toast.error("Payment verification failed")
            setCheckoutLoading(false)
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email
        },
        theme: {
          color: "#6366f1"
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        toast.error(response.error.description || 'Payment Failed')
        setCheckoutLoading(false)
      })
      
      rzp.open()
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to initialize checkout')
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-8">Billing & Subscription</h1>
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-2 bg-surface-700 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-32 bg-surface-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isEnterprise = subscription?.planId === 'ENTERPRISE' && subscription?.status === 'ACTIVE'

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Billing & Subscription</h1>
        <p className="text-surface-400">Manage your company's plan and payment methods.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Current Plan Card */}
        <div className="bg-surface-900 border border-surface-800 rounded-2xl p-6 relative overflow-hidden">
          {isEnterprise && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-500/10 rounded-bl-full -mr-16 -mt-16 blur-2xl"></div>
          )}
          
          <div className="flex items-start justify-between mb-8">
            <div>
              <p className="text-sm font-medium text-surface-400 mb-1">Current Plan</p>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                {isEnterprise ? 'Enterprise' : 'Starter'}
                {isEnterprise && <HiOutlineStar className="text-accent-400 w-6 h-6" />}
              </h2>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              subscription?.status === 'ACTIVE' 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {subscription?.status}
            </span>
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex items-center gap-3 text-surface-300">
              <HiOutlineCheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />
              <span>{isEnterprise ? 'Unlimited Departments' : '1 Department'}</span>
            </div>
            <div className="flex items-center gap-3 text-surface-300">
              <HiOutlineCheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />
              <span>{isEnterprise ? 'Unlimited Employees' : 'Up to 5 Employees'}</span>
            </div>
            <div className="flex items-center gap-3 text-surface-300">
              <HiOutlineCheckCircle className="text-emerald-400 w-5 h-5 flex-shrink-0" />
              <span>{isEnterprise ? 'Advanced SLA Analytics' : 'Basic Reporting'}</span>
            </div>
          </div>
        </div>

        {/* Upgrade Card */}
        {!isEnterprise && (
          <div className="bg-gradient-to-br from-primary-900/50 to-accent-900/50 border border-primary-500/30 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-primary-500/20 rounded-xl flex items-center justify-center mb-6">
                <HiOutlineCreditCard className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Upgrade to Enterprise</h3>
              <p className="text-surface-300 text-sm mb-6">
                Unlock unlimited scaling, priority intelligent routing, and advanced SLA analytics for your growing team.
              </p>
              <div className="mb-8">
                <span className="text-3xl font-bold text-white">₹299</span>
                <span className="text-surface-400">/month</span>
              </div>
            </div>
            
            <button 
              onClick={handleUpgrade}
              disabled={checkoutLoading}
              className="w-full btn-primary !py-3 flex items-center justify-center gap-2"
            >
              {checkoutLoading ? <span className="animate-pulse">Loading secure checkout...</span> : 'Upgrade Now'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
