import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineTicket, HiOutlineCheckCircle, HiOutlineClock, HiOutlineExclamationTriangle } from 'react-icons/hi2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

export default function EmployeeDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [honour, setHonour] = useState(null)
  const [tickets, setTickets] = useState([])
  const [notifications, setNotifications] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, honourRes, ticketsRes, notifRes, profileRes] = await Promise.all([
        api.get('/employee/dashboard-stats'),
        api.get('/employee/honour'),
        api.get('/employee/tickets'),
        api.get('/notifications'),
        api.get('/employee/performance')
      ])
      setStats(statsRes.data)
      setHonour(honourRes.data)
      setTickets(ticketsRes.data || [])
      setNotifications(notifRes.data || [])
      setProfile(profileRes.data)
    } catch (err) {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const updateAvailability = async (status) => {
    try {
      await api.put(`/employee/availability?status=${status}`)
      toast.success(`Availability updated to ${status}`)
      // Reload profile/availability status
      const profileRes = await api.get('/employee/performance')
      setProfile(profileRes.data)
    } catch {
      toast.error('Failed to update availability')
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const activeTickets = tickets.filter(t => ['ASSIGNED', 'IN_PROGRESS', 'REOPENED'].includes(t.status))

  const levelColor = {
    'Legend': 'from-amber-400 to-amber-600 border-amber-500/30 text-amber-500',
    'Trusted': 'from-emerald-400 to-emerald-600 border-emerald-500/30 text-emerald-500',
    'Reliable': 'from-blue-400 to-blue-600 border-blue-500/30 text-blue-500',
    'Needs Improvement': 'from-orange-400 to-orange-600 border-orange-500/30 text-orange-500',
    'Under Review': 'from-red-400 to-red-600 border-red-500/30 text-red-500'
  }

  const chartData = {
    labels: honour?.history?.slice().reverse().map((_, i) => `${i + 1}`) || [],
    datasets: [{
      label: 'Honour Score',
      data: honour?.history?.slice().reverse().map(h => h.scoreAfterChange) || [],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointHoverRadius: 6,
    }]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Welcome back, {profile?.name || 'Agent'}</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Here is an overview of your workload and performance.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-surface-500 dark:text-surface-400">Current Status:</span>
          {profile?.availabilityStatus === 'ONLINE' && (
            <span className="badge badge-success flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Online</span>
          )}
          {profile?.availabilityStatus === 'BUSY' && (
            <span className="badge badge-warning flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Busy</span>
          )}
          {profile?.availabilityStatus === 'OFFLINE' && (
            <span className="badge badge-neutral flex items-center gap-1"><span className="w-1.5 h-1.5 bg-surface-500 rounded-full"></span> Offline</span>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Assigned Tickets</span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500"><HiOutlineTicket className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold mt-2 text-surface-900 dark:text-white">{stats?.assignedCount || 0}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><HiOutlineClock className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold mt-2 text-surface-900 dark:text-white">{stats?.inProgressCount || 0}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Resolved This Week</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><HiOutlineCheckCircle className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold mt-2 text-surface-900 dark:text-white">{stats?.resolvedThisWeek || 0}</div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between">
            <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">SLA Breaches</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-500"><HiOutlineExclamationTriangle className="w-5 h-5" /></div>
          </div>
          <div className="text-2xl font-bold mt-2 text-surface-900 dark:text-white">{stats?.slaBreachesThisMonth || 0}</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left 2 Cols: Honour trend & My tickets */}
        <div className="md:col-span-2 space-y-6">
          {/* Honour Trend Card */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-surface-900 dark:text-white">Honour Standing</h3>
                <p className="text-xs text-surface-400">Track your standing and level progress.</p>
              </div>
              <div className="flex flex-col items-end">
                <span className={`text-3xl font-extrabold bg-gradient-to-r ${levelColor[honour?.level] || 'from-primary-400 to-primary-600'} bg-clip-text text-transparent`}>
                  {honour?.currentScore?.toFixed(1)}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-surface-200/50 dark:border-surface-700/50 mt-1">
                  {honour?.level}
                </span>
              </div>
            </div>
            <div className="h-64">
              {honour?.history?.length > 0 ? (
                <Line
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        min: 0,
                        max: 100,
                        ticks: { color: '#94a3b8' },
                        grid: { color: 'rgba(148, 163, 184, 0.05)' }
                      },
                      x: {
                        ticks: { color: '#94a3b8' },
                        grid: { display: false }
                      }
                    },
                    plugins: {
                      legend: { display: false }
                    }
                  }}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-surface-400 text-sm">No honour score trend data.</div>
              )}
            </div>
          </div>

          {/* My Tickets list */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg text-surface-900 dark:text-white">My Active Tickets</h3>
                <p className="text-xs text-surface-400">Recently assigned and in-progress tickets.</p>
              </div>
              <Link to="/dashboard/my-tickets" className="text-xs text-primary-500 font-semibold hover:underline">View All</Link>
            </div>

            <div className="space-y-3">
              {activeTickets.length === 0 ? (
                <div className="text-center py-8 text-surface-400 text-sm">No active tickets assigned. Great job!</div>
              ) : (
                activeTickets.slice(0, 5).map(t => (
                  <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/30 dark:border-surface-700/20 hover:border-primary-500/40 transition-colors">
                    <div className="space-y-0.5 max-w-[70%]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-surface-400">#{t.id}</span>
                        <h4 className="font-semibold text-sm truncate text-surface-800 dark:text-surface-100">{t.title}</h4>
                      </div>
                      <p className="text-xs text-surface-400">Customer: {t.raisedByName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${t.priority === 'CRITICAL' ? 'badge-danger' : t.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                        {t.priority}
                      </span>
                      <button
                        onClick={() => navigate('/dashboard/my-tickets')}
                        className="text-xs text-primary-500 hover:underline bg-transparent border-0 cursor-pointer font-medium"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Notifications & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-base text-surface-900 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <label className="text-xs text-surface-400 block mb-1">Set Availability Status</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => updateAvailability('ONLINE')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    profile?.availabilityStatus === 'ONLINE'
                      ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                      : 'bg-transparent border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/40'
                  }`}
                >
                  Online
                </button>
                <button
                  onClick={() => updateAvailability('BUSY')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    profile?.availabilityStatus === 'BUSY'
                      ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                      : 'bg-transparent border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/40'
                  }`}
                >
                  Busy
                </button>
                <button
                  onClick={() => updateAvailability('OFFLINE')}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                    profile?.availabilityStatus === 'OFFLINE'
                      ? 'bg-surface-500 dark:bg-surface-600 text-white border-surface-600 shadow-md'
                      : 'bg-transparent border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/40'
                  }`}
                >
                  Offline
                </button>
              </div>
            </div>
          </div>

          {/* Latest Notifications */}
          <div className="glass-card p-6 flex flex-col max-h-[400px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-base text-surface-900 dark:text-white">Latest Notifications</h3>
              <Link to="/dashboard/employee-notifications" className="text-xs text-primary-500 hover:underline font-semibold">All</Link>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {notifications.length === 0 ? (
                <p className="text-center py-6 text-surface-400 text-sm">No new notifications.</p>
              ) : (
                notifications.slice(0, 6).map(n => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border transition-colors ${
                      !n.read
                        ? 'bg-primary-50/50 dark:bg-primary-950/15 border-primary-500/20'
                        : 'bg-surface-50/40 dark:bg-surface-800/20 border-surface-200/50 dark:border-surface-700/20'
                    }`}
                  >
                    <p className="text-xs font-medium text-surface-800 dark:text-surface-200 line-clamp-2">{n.message}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[10px] text-surface-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                      {!n.read && <span className="w-1.5 h-1.5 bg-primary-500 rounded-full"></span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
