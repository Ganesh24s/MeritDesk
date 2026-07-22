import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import {
  HiOutlineArrowDownTray,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineTicket,
  HiOutlineUserGroup,
} from 'react-icons/hi2'

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler)

export default function DeptReports() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7')
  const [employeeFilter, setEmployeeFilter] = useState('ALL')
  const [team, setTeam] = useState([])
  const [reportData, setReportData] = useState(null)

  useEffect(() => {
    fetchReport()
  }, [dateRange, employeeFilter])

  const fetchReport = async () => {
    setLoading(true)
    try {
      const [reportRes, teamRes] = await Promise.all([
        api.get(`/department/reports?days=${dateRange}&employeeId=${employeeFilter}`).catch(err => {
          console.error('Reports API error:', err)
          return { data: null }
        }),
        api.get('/department/team').catch(() => ({ data: [] }))
      ])
      setReportData(reportRes.data || null)
      setTeam(Array.isArray(teamRes.data) ? teamRes.data : [])
    } catch {
      setReportData(null)
      setTeam([])
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    const d = reportData || {}
    const rows = [
      ['Metric', 'Value'],
      ['SLA Compliance %', `${d.slaCompliancePercent ?? 100}%`],
      ['Avg Resolution Time (mins)', d.avgResolutionMins || 0],
      ['Total Tickets Created', d.totalCreated || 0],
      ['Total Tickets Resolved', d.totalResolved || 0],
    ]
    const csv = rows.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dept_report_${dateRange}days.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV export downloaded!')
  }

  const data = reportData || {}
  const safeTeam = Array.isArray(team) ? team : []

  const trendData = {
    labels: data.trendLabels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Created',
        data: data.createdTrend || [],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245,158,11,0.12)',
        fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3
      },
      {
        label: 'Resolved',
        data: data.resolvedTrend || [],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,0.12)',
        fill: true, tension: 0.4, borderWidth: 2, pointRadius: 3
      }
    ]
  }

  const priorityData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: data.priorityBreakdown || [0, 0, 0, 0],
      backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'],
      borderWidth: 0
    }]
  }

  const employeeLoadData = {
    labels: safeTeam.map(e => e.name),
    datasets: [{
      label: 'Active Tickets',
      data: safeTeam.map(e => e.currentWorkload || 0),
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
      borderRadius: 6,
      borderWidth: 0
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(148,163,184,0.08)' }, beginAtZero: true },
      x: { ticks: { color: '#64748b' }, grid: { display: false } }
    },
    plugins: { legend: { labels: { color: '#64748b', usePointStyle: true } } }
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { color: '#64748b', usePointStyle: true } } }
  }

  const totalCreated = data.totalCreated || 0
  const totalResolved = data.totalResolved || 0
  const resolutionRate = totalCreated > 0 ? Math.round((totalResolved / totalCreated) * 100) : 0

  const kpiCards = [
    { label: 'SLA Compliance', value: `${data.slaCompliancePercent ?? 100}%`, icon: HiOutlineShieldCheck, color: 'from-emerald-500 to-teal-500', sub: 'Tickets resolved within SLA' },
    { label: 'Avg Resolution Time', value: `${data.avgResolutionMins || 0} min`, icon: HiOutlineClock, color: 'from-blue-500 to-indigo-500', sub: 'Mean time to resolution' },
    { label: 'Tickets Created', value: totalCreated, icon: HiOutlineTicket, color: 'from-amber-500 to-orange-500', sub: `In last ${dateRange} days` },
    { label: 'Tickets Resolved', value: totalResolved, icon: HiOutlineChartBar, color: 'from-purple-500 to-violet-500', sub: `${resolutionRate}% resolution rate` }
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Department Reports & Analytics</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Performance insights, SLA compliance, and employee workload breakdown.</p>
        </div>
        <button onClick={handleExportCSV} className="btn-primary text-xs flex items-center gap-2">
          <HiOutlineArrowDownTray className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-medium text-surface-700 dark:text-surface-300">
          <span>Date Range:</span>
          {['7', '30', '90'].map(d => (
            <button
              key={d}
              onClick={() => setDateRange(d)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                dateRange === d ? 'bg-primary-600 text-white' : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-surface-700 dark:text-surface-300">
          <HiOutlineUserGroup className="w-4 h-4" />
          <select
            value={employeeFilter}
            onChange={e => setEmployeeFilter(e.target.value)}
            className="input-field text-xs"
          >
            <option value="ALL">All Employees</option>
            {safeTeam.map(e => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </select>
        </div>
        {loading && (
          <span className="text-xs text-surface-400 font-mono animate-pulse">Refreshing report…</span>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((c, i) => (
          <div key={i} className="stat-card group relative overflow-hidden">
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

      {/* Charts Row 1: Trend + Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 glass-card p-6">
          <h3 className="font-bold text-base text-surface-900 dark:text-white mb-1">Ticket Volume Trends</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">Created vs Resolved over the past {dateRange} days</p>
          <div className="h-64">
            <Line data={trendData} options={chartOptions} />
          </div>
        </div>

        <div className="lg:col-span-4 glass-card p-6">
          <h3 className="font-bold text-base text-surface-900 dark:text-white mb-1">Priority Distribution</h3>
          <p className="text-xs text-surface-500 dark:text-surface-400 mb-4">Ticket breakdown by priority level</p>
          <div className="h-64">
            <Doughnut data={priorityData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Charts Row 2: Employee Load */}
      <div className="glass-card p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2">
              <HiOutlineUserGroup className="w-5 h-5 text-primary-500" /> Employee Load Report
            </h3>
            <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5">Current active ticket workload per team member</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="h-56">
            <Bar data={employeeLoadData} options={chartOptions} />
          </div>

          <div className="divide-y divide-surface-200/50 dark:divide-surface-800/50">
            {safeTeam.map(emp => {
              const ratio = (emp.currentWorkload || 0) / (emp.maxCapacity || 3)
              const pct = Math.round(ratio * 100)
              return (
                <div key={emp.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="font-semibold text-sm text-surface-900 dark:text-white block truncate">{emp.name}</span>
                    <span className="text-[10px] text-surface-500 dark:text-surface-400 font-mono">
                      {emp.currentWorkload || 0}/{emp.maxCapacity || 3} tickets · Honour {emp.honourScore || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="w-28 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct >= 80 ? 'bg-red-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-surface-700 dark:text-surface-300 w-10 text-right">{pct}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
