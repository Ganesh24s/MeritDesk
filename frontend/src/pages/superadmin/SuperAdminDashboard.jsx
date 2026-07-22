import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js'
import { Line } from 'react-chartjs-2'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineBuildingOffice2, HiOutlineTicket, HiOutlineUserGroup, HiOutlineClock, HiOutlineShieldCheck } from 'react-icons/hi2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [detailedStats, setDetailedStats] = useState(null)

  useEffect(() => {
    // Fetch stats
    api.get('/admin/stats').then(res => setStats(res.data)).catch(() => {})
    api.get('/admin/detailed-stats').then(res => setDetailedStats(res.data)).catch(() => {})
  }, [])

  if (!stats || !detailedStats) {
    return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>
  }

  // Chart data
  const chartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Ticket Volume',
        data: [65, 82, 95, 110, 140, 185, 230, 210, 245, 290, 310, 340],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'SLA Breaches',
        data: [5, 8, 12, 10, 9, 14, 18, 11, 15, 12, 8, 10],
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  }

  const statCards = [
    { label: 'Total Companies', value: stats.totalCompanies, icon: HiOutlineBuildingOffice2, color: 'text-primary-500 bg-primary-500/10' },
    { label: 'Active Companies', value: stats.activeCompanies, icon: HiOutlineBuildingOffice2, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Pending Approvals', value: stats.pendingCompanies, icon: HiOutlineClock, color: 'text-amber-500 bg-amber-500/10' },
    { label: 'Pending Tickets', value: stats.openTickets || 0, icon: HiOutlineTicket, color: 'text-blue-500 bg-blue-500/10' },
    { label: 'Global SLA Compliance', value: `${(detailedStats.globalSlaComplianceRate || 100).toFixed(1)}%`, icon: HiOutlineShieldCheck, color: 'text-violet-500 bg-violet-500/10' }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Platform Dashboard</h1>
        <p className="text-surface-500 text-sm mt-1">Global monitoring, analytics, and health status</p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="glass-card p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-surface-400 block">{card.label}</span>
              <span className="text-2xl font-bold text-surface-900 dark:text-white mt-1 block">{card.value}</span>
            </div>
            <div className={`p-3 rounded-xl ${card.color}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Leaderboard */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Global Platform Trends</h2>
          <div className="h-80">
            <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#94a3b8' } } } }} />
          </div>
        </div>

        <div className="glass-card p-6 space-y-4">
          <h2 className="text-lg font-semibold">Top Companies</h2>
          <p className="text-xs text-surface-500">Ranked by total resolved tickets</p>
          <div className="space-y-3">
            {detailedStats.topCompanies?.map((c, i) => (
              <div key={c.name + '_' + i} className="flex items-center justify-between p-3 rounded-xl bg-surface-150/50 dark:bg-surface-800/40">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-white font-bold text-sm">#{i+1}</div>
                  <div>
                    <p className="font-semibold text-sm">{c.name}</p>
                    <p className="text-xs text-surface-400">{c.email}</p>
                  </div>
                </div>
                <span className="badge badge-success">{c.resolvedTickets} resolved</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Global Employee Leaderboard</h2>
        <p className="text-xs text-surface-500">Top employees globally by Honour Score</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {detailedStats.topEmployees?.map((emp, i) => (
            <div key={emp.email} className="p-4 rounded-xl bg-surface-150/50 dark:bg-surface-800/40 border border-surface-200/10 flex flex-col justify-between h-28">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">#{i+1}</div>
                <p className="font-semibold text-xs truncate max-w-[120px]">{emp.name}</p>
              </div>
              <p className="text-[10px] text-surface-400 truncate">{emp.email}</p>
              <div className="flex justify-between items-baseline mt-2">
                <span className="text-[9px] text-surface-400 uppercase tracking-wider">{emp.role?.replace('_', ' ')}</span>
                <span className="font-bold text-emerald-500 text-sm">🏆 {emp.honourScore?.toFixed(0)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
