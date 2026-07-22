import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineQueueList, HiOutlineLockClosed, HiOutlineTicket } from 'react-icons/hi2'

const priorityColors = {
  LOW: 'badge-neutral',
  MEDIUM: 'badge-info',
  HIGH: 'badge-warning',
  CRITICAL: 'badge-danger'
}

export default function EmployeeOverflow() {
  const [overflowTickets, setOverflowTickets] = useState([])
  const [honourScore, setHonourScore] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [honourRes, overflowRes] = await Promise.all([
        api.get('/employee/honour'),
        api.get('/employee/tickets/overflow')
      ])
      setHonourScore(honourRes.data.currentScore || 0)
      setOverflowTickets(overflowRes.data || [])
    } catch {
      toast.error('Failed to load overflow queue data')
    } finally {
      setLoading(false)
    }
  }

  const handleClaim = async (ticketId) => {
    try {
      await api.post(`/employee/tickets/${ticketId}/claim`)
      toast.success('Ticket claimed and assigned to you successfully!')
      fetchData() // Refresh list
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to claim overflow ticket')
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const isEligible = honourScore >= 80

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Overflow Queue</h1>
          <p className="text-sm text-surface-500">Claim tickets from overload departments to assist company-wide queue resolution.</p>
        </div>
        <span className="text-xs font-semibold bg-surface-100 dark:bg-surface-800/40 px-3 py-1.5 rounded-xl border border-surface-200/50 dark:border-surface-700/50">
          My Honour Score: <span className={`font-bold ${isEligible ? 'text-emerald-500' : 'text-red-500'}`}>{honourScore.toFixed(0)}</span>
        </span>
      </div>

      {/* Access Denied / Lock view if under 80 */}
      {!isEligible ? (
        <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4 border-red-500/20">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
            <HiOutlineLockClosed className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-surface-900 dark:text-white">Claim Access Locked</h2>
          <p className="text-sm text-surface-400">
            To unlock the Overflow Queue, you must maintain an Honour Score of **80 or higher** (Trusted or Legend level standing). Help customers meet SLAs to build your Honour!
          </p>
          <div className="pt-2">
            <div className="w-full bg-surface-200 dark:bg-surface-800 rounded-full h-3.5 max-w-md mx-auto overflow-hidden">
              <div
                className="bg-red-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min((honourScore / 80) * 100, 100)}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-surface-400 mt-1 block">Progress to Unlock: {honourScore.toFixed(0)} / 80</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="stat-card">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Available Overflow Tickets</span>
              <div className="text-3xl font-extrabold mt-1 text-primary-500">{overflowTickets.length}</div>
            </div>
            <div className="stat-card">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Overflow Queue Access</span>
              <div className="text-sm font-semibold mt-1.5 text-emerald-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Active & Unlocked
              </div>
            </div>
            <div className="stat-card">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Standing Requirement</span>
              <div className="text-sm font-semibold mt-1.5 text-surface-600 dark:text-surface-300">
                Honour Score &ge; 80 (Trusted / Legend)
              </div>
            </div>
          </div>

          {/* Overflow Tickets List */}
          <div className="glass-card overflow-hidden">
            <div className="p-4 border-b border-surface-200/50 dark:border-surface-700/50 flex items-center justify-between">
              <h3 className="font-bold text-base text-surface-900 dark:text-white">Active Overflow Queue</h3>
              <button
                onClick={fetchData}
                className="text-xs text-primary-500 font-semibold hover:underline bg-transparent border-0 cursor-pointer"
              >
                Refresh Queue
              </button>
            </div>

            <div className="divide-y divide-surface-200/50 dark:divide-surface-800/50">
              {overflowTickets.length === 0 ? (
                <div className="text-center py-12 text-surface-400">
                  <HiOutlineTicket className="w-10 h-10 mx-auto text-surface-300 mb-2" />
                  <p className="text-sm">There are no tickets in the overflow queue at this time.</p>
                </div>
              ) : (
                overflowTickets.map(t => (
                  <div key={t.id} className="p-5 flex flex-col md:flex-row md:items-center md:justify-between hover:bg-surface-50/50 dark:hover:bg-surface-800/20 transition-colors gap-4">
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs text-surface-400">#{t.id}</span>
                        <h4 className="font-bold text-base text-surface-800 dark:text-surface-100">{t.title}</h4>
                        <span className={`badge ${priorityColors[t.priority] || 'badge-neutral'}`}>{t.priority}</span>
                      </div>
                      <p className="text-xs text-surface-500 line-clamp-2">{t.description}</p>
                      
                      {/* Metainfo row */}
                      <div className="flex gap-4 text-xs text-surface-400 flex-wrap pt-1">
                        <span><strong>Customer:</strong> {t.raisedByName}</span>
                        <span><strong>Department:</strong> {t.departmentName || 'General'}</span>
                        <span className="text-red-500 font-medium"><strong>Reason:</strong> Department load exceeds 90%</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center">
                      <button
                        onClick={() => handleClaim(t.id)}
                        className="btn-primary py-2 text-xs w-full md:w-auto"
                      >
                        Claim Ticket
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
