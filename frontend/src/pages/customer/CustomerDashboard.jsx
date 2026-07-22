import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineTicket, HiOutlineClock, HiOutlineCheckCircle, HiOutlineChatBubbleLeftRight, HiOutlinePlusCircle, HiOutlineBell } from 'react-icons/hi2'

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [activeTickets, setActiveTickets] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        api.get('/customer/dashboard-stats'),
        api.get('/customer/tickets')
      ])
      
      setStats(statsRes.data)
      
      const allTickets = ticketsRes.data || []
      // Active tickets are: OPEN, ASSIGNED, IN_PROGRESS, REOPENED
      const active = allTickets.filter(t => 
        t.status === 'OPEN' || t.status === 'ASSIGNED' || t.status === 'IN_PROGRESS' || t.status === 'REOPENED'
      )
      setActiveTickets(active)

      // Compile recent activities from ticket histories
      const compiledActivities = []
      allTickets.forEach(t => {
        if (t.history) {
          t.history.forEach(h => {
            compiledActivities.push({
              ticketId: t.id,
              ticketTitle: t.title,
              performedBy: h.changedByName || 'System',
              comment: h.comment,
              status: h.status,
              timestamp: new Date(h.timestamp)
            })
          })
        }
      })
      // Sort activities desc by timestamp
      compiledActivities.sort((a, b) => b.timestamp - a.timestamp)
      setActivities(compiledActivities.slice(0, 10))

    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="section-title">Support Workspace</h1>
          <p className="text-sm text-surface-500">Track and manage your service requests and submit new tickets.</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/raise-ticket')}
          className="btn-primary flex items-center gap-2"
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
          Raise New Ticket
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Active Tickets</span>
            <HiOutlineTicket className="w-5 h-5 text-primary-500" />
          </div>
          <div className="text-3xl font-extrabold mt-2 text-surface-900 dark:text-white">
            {stats?.activeTicketsCount || 0}
          </div>
          <p className="text-[10px] text-surface-400 mt-1">Open, Assigned or In Progress</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">In Progress</span>
            <HiOutlineClock className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold mt-2 text-surface-900 dark:text-white">
            {stats?.inProgressTicketsCount || 0}
          </div>
          <p className="text-[10px] text-surface-400 mt-1">Actively being worked on</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Resolved</span>
            <HiOutlineCheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold mt-2 text-surface-900 dark:text-white">
            {stats?.resolvedTicketsCount || 0}
          </div>
          <p className="text-[10px] text-surface-400 mt-1">Successfully resolved requests</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Awaiting Feedback</span>
            <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-purple-500" />
          </div>
          <div className={`text-3xl font-extrabold mt-2 ${stats?.awaitingFeedbackCount > 0 ? 'text-purple-500' : 'text-surface-900 dark:text-white'}`}>
            {stats?.awaitingFeedbackCount || 0}
          </div>
          <p className="text-[10px] text-surface-400 mt-1">Resolved without rating</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Active Tickets list */}
        <div className="md:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg text-surface-900 dark:text-white">My Active Tickets</h3>
              <p className="text-xs text-surface-400">Tickets awaiting support updates or action.</p>
            </div>
            <Link to="/dashboard/customer-tickets" className="text-xs text-primary-500 font-semibold hover:underline">View All</Link>
          </div>

          <div className="divide-y divide-surface-200/50 dark:divide-surface-800/50">
            {activeTickets.length === 0 ? (
              <div className="text-center py-12 text-surface-400 text-sm">
                No active tickets. Need help? Click 'Raise New Ticket' above.
              </div>
            ) : (
              activeTickets.slice(0, 5).map(t => (
                <div
                  key={t.id}
                  onClick={() => navigate(`/dashboard/customer-tickets/${t.id}`)}
                  className="py-3 flex items-center justify-between hover:bg-surface-50/50 dark:hover:bg-surface-800/20 px-2 rounded-xl transition-all cursor-pointer"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-surface-400">#{t.id}</span>
                      <h4 className="font-semibold text-sm truncate text-surface-800 dark:text-surface-100">{t.title}</h4>
                    </div>
                    <p className="text-xs text-surface-400 mt-1 truncate max-w-lg">{t.description}</p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`badge ${
                      t.priority === 'CRITICAL' ? 'badge-danger' : t.priority === 'HIGH' ? 'badge-warning' : 'badge-info'
                    }`}>
                      {t.priority}
                    </span>
                    <span className={`badge ${
                      t.status === 'IN_PROGRESS' ? 'badge-warning' : t.status === 'OPEN' ? 'badge-info' : 'badge-success'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Recent activity logs */}
        <div className="glass-card p-6 flex flex-col">
          <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <HiOutlineBell className="w-5 h-5 text-primary-500" />
            Recent Activity
          </h3>

          <div className="flex-1 overflow-y-auto space-y-4 max-h-[350px] pr-1">
            {activities.length === 0 ? (
              <div className="text-center py-12 text-surface-400 text-xs">No recent activity.</div>
            ) : (
              activities.map((act, i) => (
                <div key={i} className="flex gap-3 text-xs leading-relaxed">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></div>
                    {i < activities.length - 1 && <div className="w-[1px] bg-surface-200 dark:bg-surface-700 flex-1 my-1"></div>}
                  </div>
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="text-surface-700 dark:text-surface-300">
                      <span className="font-semibold text-surface-900 dark:text-white">{act.performedBy}</span> updated ticket{' '}
                      <Link to={`/dashboard/customer-tickets/${act.ticketId}`} className="text-primary-500 font-bold hover:underline">
                        #{act.ticketId}
                      </Link>{' '}
                      to <span className="font-bold">{act.status}</span>.
                    </p>
                    {act.comment && <p className="text-[11px] italic text-surface-450 truncate">"{act.comment}"</p>}
                    <span className="text-[10px] text-surface-400 block">{act.timestamp.toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
