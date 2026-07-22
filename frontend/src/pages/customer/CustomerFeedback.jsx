import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineTrophy, HiOutlineCalendar, HiStar, HiOutlineEye } from 'react-icons/hi2'

export default function CustomerFeedback() {
  const navigate = useNavigate()
  const [feedbackSummary, setFeedbackSummary] = useState(null)
  const [pendingFeedbackTickets, setPendingFeedbackTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchFeedback()
  }, [])

  const fetchFeedback = async () => {
    setLoading(true)
    try {
      const [fRes, tRes] = await Promise.all([
        api.get('/customer/feedback').catch(() => ({ data: null })),
        api.get('/customer/tickets').catch(() => ({ data: [] }))
      ])
      setFeedbackSummary(fRes.data)
      const allTickets = Array.isArray(tRes.data) ? tRes.data : []
      const pending = allTickets.filter(t => (t.status === 'RESOLVED' || t.status === 'CLOSED') && !t.feedback)
      setPendingFeedbackTickets(pending)
    } catch {
      toast.error('Failed to load feedback logs')
    } finally {
      setLoading(false)
    }
  }

  // Filter feedback items in frontend
  const filteredFeedbackList = (feedbackSummary?.feedbackList || []).filter(item => {
    if (ratingFilter !== 'ALL' && item.rating !== parseInt(ratingFilter)) {
      return false
    }
    if (startDate) {
      const itemDate = new Date(item.createdAt).toISOString().slice(0, 10)
      if (itemDate < startDate) return false
    }
    if (endDate) {
      const itemDate = new Date(item.createdAt).toISOString().slice(0, 10)
      if (itemDate > endDate) return false
    }
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="section-title">My Service Reviews</h1>
        <p className="text-sm text-surface-500">View performance feedback and ratings you gave to service agents.</p>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Pending Feedback Banner if any */}
          {pendingFeedbackTickets.length > 0 && (
            <div className="glass-card p-6 border-2 border-amber-500/30 bg-amber-500/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <HiStar className="w-5 h-5 text-amber-500" /> Tickets Pending Your Rating & Feedback
                  </h3>
                  <p className="text-xs text-surface-500 mt-0.5">Please rate the support quality for these resolved tickets to help us maintain service standards.</p>
                </div>
                <span className="badge badge-warning text-xs">{pendingFeedbackTickets.length} Pending</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingFeedbackTickets.map(t => (
                  <div key={t.id} className="p-4 rounded-xl bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700/60 flex justify-between items-center text-sm shadow-sm">
                    <div>
                      <span className="font-mono text-xs text-primary-500 font-bold">#{t.id}</span>
                      <p className="font-bold text-surface-900 dark:text-white truncate max-w-xs">{t.title}</p>
                      <span className="text-xs text-surface-400">Agent: {t.assignedToName || 'Unassigned'}</span>
                    </div>
                    <button
                      onClick={() => navigate(`/dashboard/customer-tickets/${t.id}`)}
                      className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow cursor-pointer transition-all border-0 flex items-center gap-1"
                    >
                      <HiStar className="w-4 h-4" /> Rate Now
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat-card md:col-span-1">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Average Rating Given</span>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-4xl font-extrabold text-surface-900 dark:text-white">
                  {feedbackSummary?.averageRating?.toFixed(1) || '0.0'}
                </div>
                <div className="flex text-amber-500">
                  <HiStar className="w-6 h-6" />
                </div>
              </div>
              <p className="text-[10px] text-surface-400 mt-1">Average rating out of 5 stars</p>
            </div>

            <div className="stat-card md:col-span-1">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Total Feedback Submitted</span>
              <div className="text-4xl font-extrabold mt-2 text-primary-500">
                {feedbackSummary?.totalFeedbackCount || 0}
              </div>
              <p className="text-[10px] text-surface-400 mt-1">Total reviews submitted across all resolved tickets</p>
            </div>

            {/* Premium perk placeholder */}
            <div className="stat-card md:col-span-1 bg-gradient-to-br from-primary-500/5 to-accent-500/5 border border-primary-500/20">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Agent standing contribution</span>
              <div className="text-2xl font-bold mt-2 text-surface-800 dark:text-surface-100 flex items-center gap-1.5">
                <HiOutlineTrophy className="w-6 h-6 text-amber-500" />
                Honour Influenced
              </div>
              <p className="text-[10px] text-surface-400 mt-1">Ratings $\ge$ 4 award agent score points; ratings $\le$ 2 deduct score points.</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-wrap gap-4 items-center justify-between bg-white dark:bg-surface-800 p-4 rounded-2xl border border-surface-200 dark:border-surface-700/60 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Rating filter */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-surface-400">Rating</label>
                <select
                  value={ratingFilter}
                  onChange={e => setRatingFilter(e.target.value)}
                  className="bg-surface-50 dark:bg-surface-800 text-xs px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 outline-none cursor-pointer text-surface-700 dark:text-surface-300"
                >
                  <option value="ALL">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              {/* Date Filters */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-surface-400">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-surface-50 dark:bg-surface-800 text-xs px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 outline-none text-surface-700 dark:text-surface-300"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase font-bold text-surface-400">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-surface-50 dark:bg-surface-800 text-xs px-3 py-2 rounded-xl border border-surface-200 dark:border-surface-700 outline-none text-surface-700 dark:text-surface-300"
                />
              </div>
            </div>

            {(ratingFilter !== 'ALL' || startDate || endDate) && (
              <button
                onClick={() => {
                  setRatingFilter('ALL')
                  setStartDate('')
                  setEndDate('')
                }}
                className="text-xs font-bold text-red-500 hover:underline bg-transparent border-0 cursor-pointer pt-3"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Feedback table */}
          <div className="table-container">
            <table className="min-w-full divide-y divide-surface-200/50 dark:divide-surface-800/50">
              <thead className="bg-surface-50 dark:bg-surface-800/40 text-[10px] font-bold text-surface-450 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 text-left">Ticket ID</th>
                  <th className="px-6 py-3.5 text-left">Ticket Title</th>
                  <th className="px-6 py-3.5 text-left">Rating</th>
                  <th className="px-6 py-3.5 text-left">Comment</th>
                  <th className="px-6 py-3.5 text-left">Review Date</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-200/50 dark:divide-surface-800/50 text-xs text-surface-700 dark:text-surface-300">
                {filteredFeedbackList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-surface-400">
                      No feedback records found matching selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredFeedbackList.map((f) => (
                    <tr key={f.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/10 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold">#{f.ticketId}</td>
                      <td className="px-6 py-4 font-semibold max-w-[200px] truncate">{f.ticketTitle}</td>
                      <td className="px-6 py-4">
                        <div className="flex text-amber-500 gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <HiStar key={star} className={`w-4.5 h-4.5 ${star <= f.rating ? 'text-amber-500' : 'text-surface-200 dark:text-surface-700'}`} />
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-[300px] truncate italic">"{f.comment || 'No comment provided'}"</td>
                      <td className="px-6 py-4">{new Date(f.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => navigate(`/dashboard/customer-tickets/${f.ticketId}`)}
                          className="p-2 rounded-xl text-primary-500 hover:bg-primary-500/10 bg-transparent border-0 cursor-pointer transition-colors"
                          title="View Ticket details"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
