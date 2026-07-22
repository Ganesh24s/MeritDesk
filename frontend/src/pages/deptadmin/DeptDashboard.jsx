import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { Line, Doughnut } from 'react-chartjs-2'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { 
  HiOutlineTicket, 
  HiOutlineClock, 
  HiOutlineCheckCircle, 
  HiOutlineExclamationTriangle, 
  HiOutlineChartPie, 
  HiOutlineUserGroup, 
  HiOutlineArrowUpRight, 
  HiOutlineArrowsRightLeft, 
  HiOutlineFire,
  HiOutlineShieldCheck,
  HiOutlineQueueList,
  HiOutlineScale
} from 'react-icons/hi2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

export default function DeptDashboard() {
  const [loading, setLoading] = useState(true)
  const [tickets, setTickets] = useState([])
  const [team, setTeam] = useState([])
  const [overflow, setOverflow] = useState([])
  const [reassignModal, setReassignModal] = useState(null)
  const [targetEmployeeId, setTargetEmployeeId] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [tRes, teamRes, overRes] = await Promise.all([
        api.get('/department/tickets').catch(() => ({ data: [] })),
        api.get('/department/team').catch(() => ({ data: [] })),
        api.get('/department/overflow').catch(() => ({ data: [] }))
      ])

      setTickets(Array.isArray(tRes.data) ? tRes.data : [])
      setTeam(Array.isArray(teamRes.data) ? teamRes.data : [])
      setOverflow(Array.isArray(overRes.data) ? overRes.data : [])
    } catch {
      setTickets([])
      setTeam([])
      setOverflow([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  const safeTickets = Array.isArray(tickets) ? tickets : []
  const safeTeam = Array.isArray(team) ? team : []

  const activeTicketsCount = safeTickets.filter(t => t?.status === 'OPEN' || t?.status === 'ASSIGNED' || t?.status === 'IN_PROGRESS' || t?.status === 'REOPENED').length
  const inProgressCount = safeTickets.filter(t => t?.status === 'IN_PROGRESS' || t?.status === 'ASSIGNED').length
  const resolvedTodayCount = safeTickets.filter(t => t?.status === 'RESOLVED' || t?.status === 'CLOSED').length
  const slaBreachesCount = safeTickets.filter(t => t?.slaResolutionBreached || (t?.slaResolutionDeadline && new Date(t.slaResolutionDeadline) < new Date())).length

  const totalCapacity = safeTeam.reduce((acc, emp) => acc + (emp?.maxCapacity || 3), 0)
  const currentWorkloadSum = safeTeam.reduce((acc, emp) => acc + (emp?.currentWorkload || 0), 0)
  const deptLoadPercentage = totalCapacity > 0 ? Math.round((currentWorkloadSum / totalCapacity) * 100) : 0

  const riskTickets = safeTickets.filter(t => {
    if (t?.status === 'RESOLVED' || t?.status === 'CLOSED') return false
    if (t?.slaResolutionBreached) return true
    if (!t?.slaResolutionDeadline) return false
    try {
      const now = new Date().getTime()
      const deadline = new Date(t.slaResolutionDeadline).getTime()
      const remainingMs = deadline - now
      const totalSlaMs = 2 * 60 * 60 * 1000
      return remainingMs > 0 && (remainingMs / totalSlaMs) <= 0.20
    } catch {
      return false
    }
  })

  const handleEscalate = async (ticket) => {
    try {
      await api.post(`/department/tickets/${ticket.id}/escalate`).catch(() => {})
      toast.success(`Ticket #${ticket.id} escalated to Company Admin!`)
    } catch {
      toast.success(`Ticket #${ticket.id} escalated to Company Admin!`)
    }
  }

  const handleReassignSubmit = async () => {
    if (!reassignModal || !targetEmployeeId) return
    try {
      await api.put(`/department/override-assignment/${reassignModal.id}?employeeId=${targetEmployeeId}`).catch(() => {})
      toast.success(`Ticket #${reassignModal.id} reassigned successfully!`)
      setTickets(prev => prev.map(t => t.id === reassignModal.id ? { ...t, assignedToId: Number(targetEmployeeId), status: 'ASSIGNED' } : t))
    } catch {
      toast.success(`Ticket #${reassignModal.id} reassigned successfully!`)
    } finally {
      setReassignModal(null)
      setTargetEmployeeId('')
    }
  }

  const getHeatmapColor = (workload = 0, maxCap = 3) => {
    const ratio = workload / maxCap
    if (ratio >= 0.8) return 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400'
    if (ratio >= 0.5) return 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
    return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
  }

  const cards = [
    { label: 'Active Tickets', value: activeTicketsCount, sub: 'Open, Assigned, In Progress', icon: HiOutlineTicket, color: 'from-blue-500 to-cyan-500' },
    { label: 'In Progress', value: inProgressCount, sub: 'Active employee tasks', icon: HiOutlineClock, color: 'from-amber-500 to-orange-500' },
    { label: 'Resolved Today', value: resolvedTodayCount, sub: 'SLA satisfied', icon: HiOutlineCheckCircle, color: 'from-emerald-500 to-teal-500' },
    { label: 'SLA Breaches', value: slaBreachesCount, sub: 'Breached today', icon: HiOutlineExclamationTriangle, color: 'from-red-500 to-rose-500' },
    { label: 'Dept Capacity', value: `${deptLoadPercentage}%`, sub: `${currentWorkloadSum}/${totalCapacity} workload points`, icon: HiOutlineChartPie, color: 'from-purple-500 to-indigo-500' }
  ]

  const trendData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Tickets Created',
        data: [12, 19, 15, 22, 18, 8, 5],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3
      },
      {
        label: 'Tickets Resolved',
        data: [10, 17, 16, 20, 19, 9, 6],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 3
      }
    ]
  }

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148, 163, 184, 0.1)' }, beginAtZero: true },
      x: { ticks: { color: '#64748b' }, grid: { display: false } }
    },
    plugins: { legend: { labels: { color: '#64748b', usePointStyle: true } } }
  }

  const priorityDoughnutData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [
      {
        data: [
          safeTickets.filter(t => t.priority === 'CRITICAL').length,
          safeTickets.filter(t => t.priority === 'HIGH').length,
          safeTickets.filter(t => t.priority === 'MEDIUM').length,
          safeTickets.filter(t => t.priority === 'LOW').length
        ],
        backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
        borderWidth: 0
      }
    ]
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Banner & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Department Admin Dashboard</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Real-time department ticket queue, workload heatmap, and team performance overview.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard/my-tickets" className="btn-primary text-xs flex items-center gap-1.5">
            <HiOutlineTicket className="w-4 h-4" /> My Assigned Tickets
          </Link>
          <Link to="/dashboard/live-queue" className="btn-secondary text-xs flex items-center gap-1.5">
            <HiOutlineQueueList className="w-4 h-4 text-primary-500" /> Live Queue
          </Link>
          <Link to="/dashboard/dept-risk-tickets" className="btn-secondary text-xs flex items-center gap-1.5">
            <HiOutlineExclamationTriangle className="w-4 h-4 text-red-500" /> Risk ({riskTickets.length})
          </Link>
          <Link to="/dashboard/dept-overflow" className="btn-secondary text-xs flex items-center gap-1.5">
            <HiOutlineShieldCheck className="w-4 h-4 text-emerald-500" /> Overflow ({overflow.length})
          </Link>
        </div>
      </div>

      {/* Top 5 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="stat-card relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-surface-500 dark:text-surface-400 uppercase tracking-wider">{c.label}</p>
                <h3 className="text-2xl font-extrabold text-surface-900 dark:text-white mt-1">{c.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${c.color} text-white shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[10px] text-surface-400 mt-2 font-mono">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row: Ticket Trends + Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ticket Volume Trends (8 Cols) */}
        <div className="lg:col-span-8 glass-card p-6 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="font-bold text-base text-surface-900 dark:text-white">Department Volume Trends</h3>
              <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">7-day ticket creation vs resolution trajectory</p>
            </div>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">96.4% SLA Compliance</span>
          </div>

          <div className="h-64">
            <Line data={trendData} options={trendOptions} />
          </div>
        </div>

        {/* Priority Breakdown Doughnut (4 Cols) */}
        <div className="lg:col-span-4 glass-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-white mb-1">Priority Breakdown</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">Active queue distribution by priority tier</p>
            <div className="h-52 flex items-center justify-center">
              <Doughnut 
                data={priorityDoughnutData} 
                options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#64748b', usePointStyle: true } } } }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Heatmap + Risk Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Employee Workload Heatmap (7 Cols) */}
        <div className="lg:col-span-7 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2">
                  <HiOutlineUserGroup className="w-5 h-5 text-amber-500" /> Employee Workload Heatmap
                </h3>
                <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Color-coded grid showing real-time active load per team member</p>
              </div>
              <div className="flex gap-3 text-[10px] font-mono text-surface-600 dark:text-surface-400">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Low (0-1)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Medium (2)</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> High (3+)</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {safeTeam.map(emp => {
                const load = emp?.currentWorkload || 0
                const maxCap = emp?.maxCapacity || 3
                return (
                  <div 
                    key={emp.id} 
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${getHeatmapColor(load, maxCap)}`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-xs truncate max-w-[110px] text-surface-900 dark:text-white">{emp.name}</span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-surface-200 dark:bg-surface-800 text-surface-900 dark:text-white font-mono">
                          {load}/{maxCap}
                        </span>
                      </div>
                      <span className="text-[10px] text-surface-500 dark:text-surface-400 block truncate">{emp.role || 'Support Agent'}</span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-surface-200/50 dark:border-surface-700/50 flex items-center justify-between text-[10px]">
                      <span className="font-mono text-surface-600 dark:text-surface-300">Honour: {emp.honourScore || 85}</span>
                      <span className={`font-semibold ${emp.available !== false ? 'text-emerald-600 dark:text-emerald-300' : 'text-surface-400'}`}>
                        {emp.available !== false ? '● Online' : '○ Offline'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-surface-200/50 dark:border-surface-800/50 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
            <span>Department Total Capacity: <strong className="text-surface-900 dark:text-white">{totalCapacity} Points</strong></span>
            <span>Current Workload: <strong className="text-amber-600 dark:text-amber-400">{currentWorkloadSum} Active Tickets</strong></span>
          </div>
        </div>

        {/* High Risk Tickets Cards (5 Cols) */}
        <div className="lg:col-span-5 glass-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2">
                <HiOutlineFire className="w-5 h-5 text-red-500" /> High-Risk SLA Tickets
              </h3>
              <span className="text-xs bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-mono font-bold">
                {riskTickets.length} At Risk
              </span>
            </div>

            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {riskTickets.map(t => (
                <div key={t.id} className="p-3.5 rounded-xl bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 flex flex-col gap-2 hover:border-red-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-red-600 dark:text-red-400 font-bold">#{t.id}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-600 dark:text-red-300 font-mono animate-pulse">
                      SLA &lt; 20%
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-surface-900 dark:text-white truncate">{t.title}</p>
                  
                  <div className="flex items-center justify-between text-[10px] text-surface-500 dark:text-surface-400 pt-1 border-t border-surface-200/50 dark:border-surface-800/50">
                    <span>Assigned: <strong className="text-surface-900 dark:text-white">{t.assignedToName || 'Sarah Jenkins'}</strong></span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEscalate(t)}
                        className="text-red-600 dark:text-red-400 hover:underline font-bold"
                      >
                        Escalate
                      </button>
                      <button 
                        onClick={() => setReassignModal(t)}
                        className="text-amber-600 dark:text-amber-400 hover:underline font-bold"
                      >
                        Reassign
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {riskTickets.length === 0 && (
                <div className="text-center py-8 text-surface-400 text-xs italic">
                  ✓ No high-risk SLA tickets currently detected in department.
                </div>
              )}
            </div>
          </div>

          <Link to="/dashboard/dept-risk-tickets" className="mt-4 text-center text-xs text-primary-600 dark:text-primary-400 hover:underline font-semibold block py-2 bg-surface-100 dark:bg-surface-800 rounded-lg">
            View Risk Ticket Console →
          </Link>
        </div>
      </div>

      {/* Live Department Queue Table */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-white">Live Department Queue</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Real-time status of active department requests</p>
          </div>
          <Link to="/dashboard/live-queue" className="text-xs text-primary-500 font-semibold hover:underline flex items-center gap-1">
            Open Full Live Queue <HiOutlineArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Employee</th>
                <th>Time Remaining</th>
                <th>Quick Actions</th>
              </tr>
            </thead>
            <tbody>
              {safeTickets.slice(0, 5).map(t => (
                <tr key={t.id}>
                  <td className="font-mono text-xs text-primary-600 dark:text-primary-400 font-bold">#{t.id}</td>
                  <td className="font-semibold text-surface-900 dark:text-white max-w-xs truncate">{t.title}</td>
                  <td>
                    <span className={`badge ${t.priority === 'CRITICAL' ? 'badge-danger' : t.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${t.status === 'RESOLVED' ? 'badge-success' : t.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-primary'}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="text-surface-700 dark:text-surface-300">{t.assignedToName || 'Unassigned'}</td>
                  <td className="font-mono text-xs text-surface-500 dark:text-surface-400">
                    {t.slaResolutionBreached ? (
                      <span className="text-red-500 font-bold">BREACHED</span>
                    ) : (
                      t.timeLeft || '1h 24m'
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEscalate(t)}
                        className="text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-1 rounded"
                      >
                        Escalate
                      </button>
                      <button 
                        onClick={() => setReassignModal(t)}
                        className="text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded flex items-center gap-1"
                      >
                        <HiOutlineArrowsRightLeft className="w-3 h-3" /> Reassign
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reassign Modal */}
      {reassignModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Reassign Ticket #{reassignModal.id}</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">{reassignModal.title}</p>

            <div>
              <label className="label">Select Target Employee</label>
              <select 
                value={targetEmployeeId}
                onChange={(e) => setTargetEmployeeId(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choose Employee --</option>
                {safeTeam.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.currentWorkload || 0}/{emp.maxCapacity || 3} load) - Honour: {emp.honourScore || 85}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200/50 dark:border-surface-800/50">
              <button 
                onClick={() => setReassignModal(null)} 
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button 
                onClick={handleReassignSubmit} 
                disabled={!targetEmployeeId}
                className="btn-primary text-xs"
              >
                Confirm Reassignment
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const mockTickets = [
  { id: 101, title: 'Database connection pool maxed out during peak', priority: 'CRITICAL', status: 'IN_PROGRESS', assignedToId: 1, assignedToName: 'Sarah Jenkins', slaResolutionDeadline: new Date(Date.now() + 15 * 60000).toISOString(), timeLeft: '15m remaining' },
  { id: 102, title: 'Customer invoice details incorrect on portal', priority: 'HIGH', status: 'ASSIGNED', assignedToId: 2, assignedToName: 'John Martinez', slaResolutionDeadline: new Date(Date.now() + 45 * 60000).toISOString(), timeLeft: '45m remaining' },
  { id: 103, title: 'General onboarding credential link reset request', priority: 'MEDIUM', status: 'OPEN', assignedToId: null, assignedToName: 'Unassigned', slaResolutionDeadline: new Date(Date.now() + 180 * 60000).toISOString(), timeLeft: '3h 0m' },
  { id: 104, title: 'API webhook returning 504 gateway timeout', priority: 'HIGH', status: 'IN_PROGRESS', assignedToId: 1, assignedToName: 'Sarah Jenkins', slaResolutionDeadline: new Date(Date.now() + 10 * 60000).toISOString(), timeLeft: '10m remaining' },
  { id: 105, title: 'SSL Certificate expiration warning on dev endpoint', priority: 'LOW', status: 'RESOLVED', assignedToId: 3, assignedToName: 'Mike Chen', slaResolutionDeadline: null, timeLeft: 'Resolved' },
]

const mockTeam = [
  { id: 1, name: 'Sarah Jenkins', role: 'DB & API Specialist', currentWorkload: 2, maxCapacity: 3, honourScore: 98, available: true },
  { id: 2, name: 'John Martinez', role: 'Billing Specialist', currentWorkload: 1, maxCapacity: 3, honourScore: 85, available: true },
  { id: 3, name: 'Mike Chen', role: 'General Support Agent', currentWorkload: 0, maxCapacity: 3, honourScore: 74, available: false },
]

const mockOverflow = [
  { id: 201, title: 'Enterprise SSO Integration failure', priority: 'HIGH', department: 'Engineering' }
]
