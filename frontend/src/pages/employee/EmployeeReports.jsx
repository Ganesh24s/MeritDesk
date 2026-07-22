import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend } from 'chart.js'
import { Line, Pie } from 'react-chartjs-2'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineCalendar, HiOutlineClock, HiOutlineShieldCheck, HiOutlineSparkles } from 'react-icons/hi2'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend)

export default function EmployeeReports() {
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().slice(0, 10)
  })
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [startDate, endDate])

  const fetchReports = async () => {
    setLoading(true)
    try {
      // Format to ISO strings for request
      const startIso = new Date(startDate).toISOString()
      const endIso = new Date(endDate)
      endIso.setHours(23, 59, 59, 999)
      const res = await api.get(`/employee/reports?startDate=${startIso}&endDate=${endIso.toISOString()}`)
      setReports(res.data)
    } catch {
      toast.error('Failed to load performance analytics')
    } finally {
      setLoading(false)
    }
  }

  const formatResolutionTime = (mins) => {
    if (!mins || mins === 0) return '0 mins'
    if (mins < 60) return `${mins.toFixed(0)} mins`
    const hours = mins / 60
    if (hours < 24) return `${hours.toFixed(1)} hours`
    const days = hours / 24
    return `${days.toFixed(1)} days`
  }

  // Setup Line Chart data
  const lineChartData = {
    labels: reports?.resolutionTrends?.map(pt => pt.date) || [],
    datasets: [{
      label: 'Resolved Tickets',
      data: reports?.resolutionTrends?.map(pt => pt.count) || [],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4
    }]
  }

  // Setup Pie Chart data
  const statusLabels = reports ? Object.keys(reports.statusDistribution) : []
  const statusCounts = reports ? Object.values(reports.statusDistribution) : []
  const pieColors = ['#60a5fa', '#3b82f6', '#f59e0b', '#10b981', '#6b7280', '#ef4444']

  const pieChartData = {
    labels: statusLabels,
    datasets: [{
      data: statusCounts,
      backgroundColor: pieColors.slice(0, statusLabels.length),
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.1)'
    }]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="section-title">Personal Reports</h1>
          <p className="text-sm text-surface-500">Analyze your ticket resolution trends, resolution times, and SLA compliance.</p>
        </div>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-surface-800 p-2.5 rounded-2xl border border-surface-200 dark:border-surface-700">
          <div className="flex items-center gap-1.5 text-xs text-surface-500">
            <HiOutlineCalendar className="w-4 h-4" />
            <span>Range:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs font-semibold text-surface-750 dark:text-surface-200"
          />
          <span className="text-surface-300 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="bg-transparent border-0 outline-none text-xs font-semibold text-surface-750 dark:text-surface-200"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Analytics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Total Resolved</span>
              <div className="text-3xl font-extrabold mt-1 text-surface-900 dark:text-white">{reports?.totalResolved || 0}</div>
              <p className="text-[10px] text-surface-400 mt-1">Within selected range</p>
            </div>

            <div className="stat-card">
              <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Resolved This Month</span>
              <div className="text-3xl font-extrabold mt-1 text-primary-500">{reports?.resolvedThisMonth || 0}</div>
              <p className="text-[10px] text-surface-400 mt-1">Calendar month running count</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">Avg Resolution Time</span>
                <HiOutlineClock className="w-4 h-4 text-surface-400" />
              </div>
              <div className="text-2xl font-bold mt-2 text-surface-900 dark:text-white">
                {formatResolutionTime(reports?.averageResolutionTimeMinutes)}
              </div>
              <p className="text-[10px] text-surface-400 mt-1">From creation to resolution</p>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500 dark:text-surface-400 font-medium uppercase tracking-wider">SLA Compliance</span>
                <HiOutlineShieldCheck className="w-4 h-4 text-emerald-500" />
              </div>
              <div className={`text-3xl font-extrabold mt-1 ${
                (reports?.slaComplianceRate || 100) >= 90 ? 'text-emerald-500' : 'text-amber-500'
              }`}>
                {reports?.slaComplianceRate?.toFixed(1) || '100'}%
              </div>
              <p className="text-[10px] text-surface-400 mt-1">Percentage resolved within SLA</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Resolution Trends Line Chart */}
            <div className="md:col-span-2 glass-card p-6">
              <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4">Resolution Volume Trend</h3>
              <div className="h-72">
                {reports?.resolutionTrends?.length > 0 ? (
                  <Line
                    data={lineChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: { color: '#94a3b8', stepSize: 1 },
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
                  <div className="flex h-full items-center justify-center text-surface-400 text-sm">No trend data in this date range.</div>
                )}
              </div>
            </div>

            {/* Status Distribution Pie Chart */}
            <div className="glass-card p-6 flex flex-col">
              <h3 className="font-bold text-base text-surface-900 dark:text-white mb-4">Ticket Status Distribution</h3>
              <div className="relative flex-1 flex items-center justify-center h-64">
                {statusCounts.some(c => c > 0) ? (
                  <Pie
                    data={pieChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { color: '#94a3b8', boxWidth: 12, padding: 15, font: { size: 11 } }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="text-center text-surface-400 text-sm">No ticket status data.</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
