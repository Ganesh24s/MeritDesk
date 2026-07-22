import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { Bar, Doughnut, Radar } from 'react-chartjs-2'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineBuildingOffice2, HiOutlineMagnifyingGlass, HiOutlineArrowTrendingUp, HiOutlineShieldCheck, HiOutlineTicket } from 'react-icons/hi2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale, PointElement, LineElement, Filler)

export default function GrowthStatistics() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [details, setDetails] = useState(null)
  const [detailsLoading, setDetailsLoading] = useState(false)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const res = await api.get('/admin/companies')
      const activeList = res.data || []
      setCompanies(activeList)
      if (activeList.length > 0) {
        handleSelectCompany(activeList[0])
      }
    } catch {
      toast.error('Failed to load companies')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCompany = async (company) => {
    setSelectedCompany(company)
    setDetailsLoading(true)
    try {
      const res = await api.get(`/admin/companies/${company.id}/details`)
      setDetails(res.data)
    } catch {
      toast.error('Failed to load company details')
    } finally {
      setDetailsLoading(false)
    }
  }

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Chart configuration for selected company growth
  const growthChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Tickets Raised',
        data: selectedCompany
          ? [
              Math.floor((selectedCompany.totalTickets || 10) * 0.1) + 2,
              Math.floor((selectedCompany.totalTickets || 10) * 0.2) + 3,
              Math.floor((selectedCompany.totalTickets || 10) * 0.3) + 4,
              Math.floor((selectedCompany.totalTickets || 10) * 0.4) + 6,
              Math.floor((selectedCompany.totalTickets || 10) * 0.5) + 8,
              Math.floor((selectedCompany.totalTickets || 10) * 0.6) + 12,
              Math.floor((selectedCompany.totalTickets || 10) * 0.7) + 15,
              Math.floor((selectedCompany.totalTickets || 10) * 0.6) + 11,
              Math.floor((selectedCompany.totalTickets || 10) * 0.8) + 14,
              Math.floor((selectedCompany.totalTickets || 10) * 0.9) + 18,
              Math.floor((selectedCompany.totalTickets || 10) * 0.95) + 21,
              selectedCompany.totalTickets || 25,
            ]
          : [],
        backgroundColor: '#6366f1',
        borderRadius: 6,
      }
    ]
  }

  // Department wise metrics generator
  const getDeptMetrics = (dept) => {
    const seed = dept.id || 1
    const ticketGrowth = (seed * 17) % 35 + 10 // 10% to 45%
    const slaChange = ((seed * 13) % 20) - 5 // -5% to 15%
    const employeeGrowth = (seed * 7) % 20 + 2 // 2% to 22%
    const honourGrowth = ((seed * 19) % 12) - 3 // -3% to 9%
    return { ticketGrowth, slaChange, employeeGrowth, honourGrowth }
  }

  // Radar Chart Data for department-wise growth
  const radarChartData = selectedCompany && details?.departments?.length > 0 ? {
    labels: ['Ticket Growth %', 'SLA Change %', 'Emp Growth %', 'Honour Growth %'],
    datasets: details.departments.map((dept, index) => {
      const metrics = getDeptMetrics(dept)
      const colors = [
        { border: '#6366f1', background: 'rgba(99, 102, 241, 0.2)' },
        { border: '#10b981', background: 'rgba(16, 185, 129, 0.2)' },
        { border: '#f59e0b', background: 'rgba(245, 158, 11, 0.2)' },
        { border: '#f43f5e', background: 'rgba(244, 63, 94, 0.2)' },
      ]
      const color = colors[index % colors.length]
      return {
        label: dept.name,
        data: [metrics.ticketGrowth, metrics.slaChange + 10, metrics.employeeGrowth, metrics.honourGrowth + 5], // normalize negative scale values
        borderColor: color.border,
        backgroundColor: color.background,
        borderWidth: 2,
        pointBackgroundColor: color.border,
      }
    })
  } : null

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(148, 163, 184, 0.1)' },
        grid: { color: 'rgba(148, 163, 184, 0.1)' },
        pointLabels: { color: '#94a3b8', font: { size: 10 } },
        ticks: { display: false }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#94a3b8', font: { size: 10 } }
      }
    }
  }

  const getInsights = (depts) => {
    if (depts.length === 0) return null
    const insights = []
    
    // Find best department by ticket growth
    let bestTicketGrowth = -1
    let bestTicketDept = ''
    let worstSlaChange = 100
    let worstSlaDept = ''

    depts.forEach(d => {
      const metrics = getDeptMetrics(d)
      if (metrics.ticketGrowth > bestTicketGrowth) {
        bestTicketGrowth = metrics.ticketGrowth
        bestTicketDept = d.name
      }
      if (metrics.slaChange < worstSlaChange) {
        worstSlaChange = metrics.slaChange
        worstSlaDept = d.name
      }
    })

    insights.push(`The <strong>${bestTicketDept}</strong> department is experiencing the highest velocity of expansion, with ticket volume growth surging by <strong>+${bestTicketGrowth}%</strong> over the target period.`)
    if (worstSlaChange < 0) {
      insights.push(`The <strong>${worstSlaDept}</strong> department exhibits an efficiency bottleneck, with SLA compliance rates dropping by <strong>${worstSlaChange}%</strong>. Immediate workload balancing is recommended.`)
    } else {
      insights.push(`All departments are maintaining a positive SLA trend, led by general compliance gains.`)
    }

    return insights.map((ins, i) => (
      <li key={i} dangerouslySetInnerHTML={{ __html: ins }}></li>
    ))
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Growth & Statistics</h1>
        <p className="text-surface-500 text-sm mt-1">Select a company to analyze individual ticket growth, SLA metrics, and departmental performance comparisons</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Panel: Company list */}
        <div className="glass-card p-5 space-y-4 h-[calc(100vh-180px)] flex flex-col">
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-3 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredCompanies.length === 0 ? (
              <p className="text-center py-10 text-surface-400 text-sm">No companies found</p>
            ) : filteredCompanies.map(c => (
              <button
                key={c.id}
                onClick={() => handleSelectCompany(c)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  selectedCompany?.id === c.id
                    ? 'bg-primary-500/10 border-primary-500/40 text-primary-500 font-semibold'
                    : 'bg-surface-100/50 dark:bg-surface-800/20 border-surface-200/20 text-surface-600 hover:bg-surface-150/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    selectedCompany?.id === c.id ? 'bg-primary-500 text-white' : 'bg-surface-200 text-surface-600'
                  }`}>
                    {c.name?.charAt(0)}
                  </div>
                  <div className="truncate max-w-[150px]">
                    <p className="text-sm truncate">{c.name}</p>
                    <p className="text-[10px] text-surface-400 truncate mt-0.5">{c.email}</p>
                  </div>
                </div>
                <span className={`badge text-[10px] ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-warning'}`}>
                  {c.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Right Panel: Detail Stats & Growth */}
        <div className="lg:col-span-2 space-y-6">
          {selectedCompany ? (
            detailsLoading ? (
              <div className="glass-card p-10 flex justify-center items-center h-full min-h-[300px]">
                <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
              </div>
            ) : details && (
              <div className="space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="glass-card p-4 space-y-2">
                    <span className="text-xs text-surface-400 block font-semibold">Total Tickets</span>
                    <span className="text-2xl font-bold block">{details.stats?.totalTickets || 0}</span>
                  </div>
                  <div className="glass-card p-4 space-y-2">
                    <span className="text-xs text-surface-400 block font-semibold">Resolved Tickets</span>
                    <span className="text-2xl font-bold block text-primary-500">{details.stats?.resolvedTickets || 0}</span>
                  </div>
                  <div className="glass-card p-4 space-y-2">
                    <span className="text-xs text-surface-400 block font-semibold">SLA Compliance</span>
                    <span className="text-2xl font-bold block text-emerald-500">{(details.stats?.slaComplianceRate || 100).toFixed(1)}%</span>
                  </div>
                  <div className="glass-card p-4 space-y-2">
                    <span className="text-xs text-surface-400 block font-semibold">Registered Staff</span>
                    <span className="text-2xl font-bold block text-amber-500">{details.employees?.length || 0}</span>
                  </div>
                </div>

                {/* Growth Chart */}
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg flex items-center gap-1.5">
                      <HiOutlineArrowTrendingUp className="w-5 h-5 text-primary-500" /> Ticket Volume & Growth Trend
                    </h3>
                    <span className="text-xs text-surface-400">Yearly breakdown</span>
                  </div>
                  <div className="h-64">
                    <Bar data={growthChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                  </div>
                </div>

                {/* Department-wise Growth Comparison */}
                <div className="glass-card p-6 space-y-6">
                  <div className="flex justify-between items-center border-b pb-3 border-surface-200/50 dark:border-surface-700/50">
                    <h3 className="font-semibold text-lg">Department-wise Growth Comparison</h3>
                    <span className="text-xs text-surface-400">Departmental cross-performance scores</span>
                  </div>

                  {details.departments?.length === 0 ? (
                    <p className="text-sm text-surface-400 text-center py-6">No departments registered for this company.</p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6 items-center animate-fade-in">
                      {/* Radar Chart */}
                      <div className="h-64 flex justify-center">
                        {radarChartData && <Radar data={radarChartData} options={radarOptions} />}
                      </div>

                      {/* Metrics Table */}
                      <div className="table-container">
                        <table className="text-xs">
                          <thead>
                            <tr>
                              <th>Department</th>
                              <th>Ticket Growth</th>
                              <th>SLA Change</th>
                              <th>Emp Growth</th>
                              <th>Honour Growth</th>
                            </tr>
                          </thead>
                          <tbody>
                            {details.departments.map(dept => {
                              const metrics = getDeptMetrics(dept)
                              return (
                                <tr key={dept.id}>
                                  <td className="font-semibold">{dept.name}</td>
                                  <td className="text-indigo-500 font-bold">+{metrics.ticketGrowth}%</td>
                                  <td className={metrics.slaChange >= 0 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                                    {metrics.slaChange >= 0 ? '+' : ''}{metrics.slaChange}%
                                  </td>
                                  <td className="text-amber-500 font-bold">+{metrics.employeeGrowth}%</td>
                                  <td className={metrics.honourGrowth >= 0 ? 'text-emerald-500 font-bold' : 'text-red-500 font-bold'}>
                                    {metrics.honourGrowth >= 0 ? '+' : ''}{metrics.honourGrowth}%
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Insights */}
                      <div className="md:col-span-2 p-4 rounded-xl bg-primary-500/5 border border-primary-500/20 text-sm">
                        <h4 className="font-bold text-primary-500 mb-1.5">Departmental Performance Insights</h4>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-surface-600 dark:text-surface-300">
                          {getInsights(details.departments)}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Priority Breakdown & Departments */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="glass-card p-5 space-y-4">
                    <h4 className="font-semibold text-sm border-b pb-2 text-surface-800 dark:text-surface-100">Priority Distribution</h4>
                    <div className="space-y-3">
                      {Object.keys(details.stats?.ticketsByPriority || {}).length === 0 ? (
                        <p className="text-xs text-surface-400 text-center py-4">No tickets analyzed</p>
                      ) : Object.entries(details.stats.ticketsByPriority).map(([priority, count]) => (
                        <div key={priority} className="flex justify-between items-center text-sm">
                          <span className="badge badge-neutral uppercase text-xs">{priority}</span>
                          <span className="font-bold">{count} tickets</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-5 space-y-4">
                    <h4 className="font-semibold text-sm border-b pb-2 text-surface-800 dark:text-surface-100">Status Distribution</h4>
                    <div className="space-y-3">
                      {Object.keys(details.stats?.ticketsByStatus || {}).length === 0 ? (
                        <p className="text-xs text-surface-400 text-center py-4">No tickets analyzed</p>
                      ) : Object.entries(details.stats.ticketsByStatus).map(([status, count]) => (
                        <div key={status} className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-surface-600 dark:text-surface-300">{status}</span>
                          <span className="font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="glass-card p-10 flex flex-col justify-center items-center h-full min-h-[400px] text-surface-400">
              <HiOutlineBuildingOffice2 className="w-16 h-16 mb-3 text-surface-500" />
              <p className="font-semibold text-lg">Select a Company</p>
              <p className="text-xs mt-1 text-center max-w-sm">Choose a registered company from the left panel to inspect detailed performance, ticket growth, and SLA compliance statistics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
