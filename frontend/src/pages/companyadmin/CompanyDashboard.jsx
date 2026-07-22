import { useState, useEffect } from 'react'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'
import api from '../../api/axios'
import { HiOutlineBuildingOffice2, HiOutlineUserGroup, HiOutlineTicket, HiOutlineShieldCheck, HiOutlineUsers, HiOutlineArrowTrendingUp } from 'react-icons/hi2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler)

export default function CompanyDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/company/stats').then(r => { setStats(r.data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading || !stats) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  const cards = [
    { label: 'Departments', value: stats.totalDepartments || 0, icon: HiOutlineBuildingOffice2, color: 'from-blue-500 to-cyan-500' },
    { label: 'Employees', value: stats.totalEmployees || 0, icon: HiOutlineUserGroup, color: 'from-violet-500 to-purple-600' },
    { label: 'Customers', value: stats.totalCustomers || 0, icon: HiOutlineUsers, color: 'from-pink-500 to-rose-500' },
    { label: 'Active Tickets', value: stats.activeTickets || 0, icon: HiOutlineTicket, color: 'from-amber-500 to-orange-500' },
    { label: 'Resolved', value: stats.resolvedTickets || 0, icon: HiOutlineArrowTrendingUp, color: 'from-emerald-500 to-green-600' },
    { label: 'SLA Compliance', value: `${(stats.slaComplianceRate || 0).toFixed(1)}%`, icon: HiOutlineShieldCheck, color: 'from-indigo-500 to-blue-600' },
  ]

  // Ticket trends chart (last 30 days)
  const trends = stats.ticketTrends || []
  const trendLabels = trends.map(t => t.date?.slice(5)) // MM-DD
  const trendData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Created',
        data: trends.map(t => t.created || 0),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: 'Resolved',
        data: trends.map(t => t.resolved || 0),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        borderWidth: 2,
      },
    ],
  }

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: 'rgba(148,163,184,0.1)' }, beginAtZero: true },
      x: { ticks: { color: '#94a3b8', maxTicksLimit: 10 }, grid: { display: false } },
    },
    plugins: { legend: { labels: { color: '#94a3b8', usePointStyle: true, padding: 20 } } },
  }

  // SLA Breaches by Department (pie chart)
  const breachLabels = Object.keys(stats.slaBreachesByDepartment || {})
  const breachValues = Object.values(stats.slaBreachesByDepartment || {})
  const breachColors = ['#ef4444','#f59e0b','#6366f1','#10b981','#06b6d4','#8b5cf6','#ec4899','#14b8a6']
  const breachData = {
    labels: breachLabels,
    datasets: [{ data: breachValues, backgroundColor: breachColors.slice(0, breachLabels.length), borderWidth: 0 }],
  }

  // Top 5 employees leaderboard
  const topEmployees = stats.topEmployees || []

  // Recent activity
  const recentActivity = stats.recentActivity || []

  const getActivityIcon = (type) => {
    switch (type) {
      case 'ESCALATION': return '🚨'
      case 'SLA_BREACH': return '⚠️'
      case 'TICKET_RESOLVED': return '✅'
      case 'EXTENSION_REQUEST': return '⏳'
      default: return '🎫'
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'ESCALATION': return 'border-l-red-500'
      case 'SLA_BREACH': return 'border-l-amber-500'
      case 'TICKET_RESOLVED': return 'border-l-emerald-500'
      case 'EXTENSION_REQUEST': return 'border-l-blue-500'
      default: return 'border-l-primary-500'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="section-title">Company Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {cards.map(c => (
          <div key={c.label} className="glass-card p-5 group hover:scale-[1.02] transition-transform duration-200">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-white shadow-lg`}>
                <c.icon className="w-5 h-5" />
              </div>
            </div>
            <div className={`text-2xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}>{c.value}</div>
            <p className="text-xs text-surface-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <h3 className="font-semibold mb-4 text-surface-700 dark:text-surface-200">📊 Ticket Trends (Last 30 Days)</h3>
          <div className="h-64">
            <Line data={trendData} options={trendOptions} />
          </div>
        </div>
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 text-surface-700 dark:text-surface-200">🔴 SLA Breaches by Department</h3>
          {breachLabels.length > 0 ? (
            <div className="max-w-[220px] mx-auto">
              <Doughnut data={breachData} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12, font: { size: 11 } } } } }} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-surface-400 text-sm">No SLA breaches 🎉</div>
          )}
        </div>
      </div>

      {/* Bottom Row: Leaderboard + Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Leaderboard */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 text-surface-700 dark:text-surface-200">🏆 Top Employees by Honour Score</h3>
          <div className="space-y-2">
            {topEmployees.length === 0 ? (
              <p className="text-center text-surface-400 text-sm py-8">No employee data</p>
            ) : topEmployees.map((emp, i) => (
              <div key={emp.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-400/30' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                  i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                  'bg-surface-100 dark:bg-surface-800 text-surface-500'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{emp.name}</p>
                  <p className="text-xs text-surface-400 truncate">{emp.departmentName || 'Unassigned'}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-500">{emp.honourScore?.toFixed(0)}</p>
                  <p className="text-xs text-surface-400">{emp.honourLevel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4 text-surface-700 dark:text-surface-200">📋 Recent Activity</h3>
          <div className="space-y-2 max-h-[360px] overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-center text-surface-400 text-sm py-8">No recent activity</p>
            ) : recentActivity.map((item, i) => (
              <div key={i} className={`p-3 rounded-xl border-l-4 ${getActivityColor(item.type)} bg-surface-50/50 dark:bg-surface-800/30`}>
                <div className="flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{getActivityIcon(item.type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-surface-700 dark:text-surface-300 leading-snug">{item.message}</p>
                    <p className="text-xs text-surface-400 mt-1">{item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
