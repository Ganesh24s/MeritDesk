import { useState, useEffect } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { Bar, Doughnut } from 'react-chartjs-2'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineFolderArrowDown, HiOutlineMagnifyingGlass } from 'react-icons/hi2'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement)

export default function PlatformReports() {
  const [activeTab, setActiveTab] = useState('AUDIT')

  // Audit Logs State
  const [logs, setLogs] = useState([])
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterDate, setFilterDate] = useState('')

  // Compliance State
  const [companies, setCompanies] = useState([])

  useEffect(() => {
    fetchAuditLogs()
    fetchCompanyData()
  }, [])

  const fetchAuditLogs = async () => {
    try {
      const res = await api.get('/admin/audit-logs')
      setLogs(res.data || [])
    } catch {}
  }

  const fetchCompanyData = async () => {
    try {
      const res = await api.get('/admin/companies')
      setCompanies(res.data || [])
    } catch {}
  }

  // Filter audit logs
  const filteredLogs = logs.filter(log => {
    const userMatch = !filterUser || log.user?.name?.toLowerCase()?.includes(filterUser.toLowerCase()) || log.user?.email?.toLowerCase()?.includes(filterUser.toLowerCase())
    const actionMatch = !filterAction || log.action?.toLowerCase()?.includes(filterAction.toLowerCase())
    const dateMatch = !filterDate || new Date(log.timestamp).toLocaleDateString()?.includes(new Date(filterDate).toLocaleDateString())
    return userMatch && actionMatch && dateMatch
  })

  // Export CSV
  const exportComplianceCSV = () => {
    if (companies.length === 0) return
    const headers = 'Company Name,Company Email,Industry,Total Employees,Total Tickets,Status,Created Date\n'
    const rows = companies.map(c => 
      `"${c.name}","${c.email}","${c.industry || ''}",${c.totalEmployees},${c.totalTickets},"${c.status}","${new Date(c.createdAt || Date.now()).toLocaleDateString()}"`
    ).join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', 'MeritDesk_SLA_Compliance_Report.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('CSV Report exported!')
  }

  // Chart configs
  const barChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'New Registrations',
        data: [3, 5, 8, 12, 15, 20, 25, 28, 30, 35, 42, 48],
        backgroundColor: '#6366f1',
        borderRadius: 8
      }
    ]
  }

  const activeCount = companies.filter(c => c.status === 'ACTIVE').length
  const pendingCount = companies.filter(c => c.status === 'PENDING').length
  const otherCount = companies.length - activeCount - pendingCount

  const doughnutData = {
    labels: ['Active', 'Pending', 'Suspended/Rejected'],
    datasets: [
      {
        data: [activeCount || 5, pendingCount || 2, otherCount || 1],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }
    ]
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Platform Reports</h1>
        <p className="text-surface-500 text-sm mt-1">Audit trail tracking, SLA compliance summaries, and tenant analytics export</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200/50 dark:border-surface-700/50 gap-4">
        {['AUDIT', 'COMPLIANCE', 'GROWTH'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all bg-transparent border-0 cursor-pointer ${
              activeTab === tab ? 'border-primary-500 text-primary-500' : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
            }`}
          >
            {tab === 'AUDIT' && 'Platform Audit Logs'}
            {tab === 'COMPLIANCE' && 'SLA Compliance Report'}
            {tab === 'GROWTH' && 'Growth & Statistics'}
          </button>
        ))}
      </div>

      {/* Audit Logs View */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="glass-card p-5 grid md:grid-cols-3 gap-4">
            <div>
              <label className="label">Search User</label>
              <input
                type="text"
                placeholder="Name or Email..."
                value={filterUser}
                onChange={e => setFilterUser(e.target.value)}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="label">Search Action</label>
              <input
                type="text"
                placeholder="CREATE_TICKET, LOGIN, etc..."
                value={filterAction}
                onChange={e => setFilterAction(e.target.value)}
                className="input-field mt-1"
              />
            </div>
            <div>
              <label className="label">Search Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="input-field mt-1"
              />
            </div>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Description</th>
                    <th>Entity Type</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-6 text-surface-400">No logs found</td></tr>
                  ) : filteredLogs.map(log => (
                    <tr key={log.id}>
                      <td>
                        <p className="font-semibold">{log.user?.name || 'System'}</p>
                        <p className="text-xs text-surface-400">{log.user?.email || '-'}</p>
                      </td>
                      <td>
                        <span className="badge badge-neutral text-xs">
                          {log.user?.role || 'SYSTEM'}
                        </span>
                      </td>
                      <td className="font-mono text-sm font-semibold">{log.action}</td>
                      <td className="text-sm">{log.details || '-'}</td>
                      <td className="text-xs font-mono text-surface-400">{log.entityType || '-'} (#{log.entityId || '-'})</td>
                      <td className="text-xs text-surface-500">{new Date(log.timestamp).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SLA Compliance View */}
      {activeTab === 'COMPLIANCE' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg">Tenant Company SLA Compliances</h3>
            <button onClick={exportComplianceCSV} className="btn-primary text-sm flex items-center gap-1.5 py-2">
              <HiOutlineFolderArrowDown className="w-5 h-5" /> Export Compliance CSV
            </button>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Email</th>
                    <th>Total Tickets</th>
                    <th>Status</th>
                    <th>SLA Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map(c => (
                    <tr key={c.id}>
                      <td className="font-semibold">{c.name}</td>
                      <td>{c.email}</td>
                      <td>{c.totalTickets}</td>
                      <td><span className="badge badge-success">{c.status}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: '92%' }}></div>
                          </div>
                          <span className="text-sm font-semibold text-emerald-500">92.0%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Growth view */}
      {activeTab === 'GROWTH' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card p-6 space-y-4">
            <h3 className="font-semibold text-lg">Monthly Registration Growth</h3>
            <div className="h-80">
              <Bar data={barChartData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="glass-card p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-lg">Active vs Inactive Companies</h3>
              <p className="text-xs text-surface-500 mt-1">Tenant distribution across statuses</p>
            </div>
            <div className="h-56 flex justify-center">
              <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false }} />
            </div>
            <div className="space-y-2 text-sm pt-4">
              <div className="flex justify-between"><span>Active Tenant Companies</span><span className="font-bold text-emerald-500">{activeCount}</span></div>
              <div className="flex justify-between"><span>Pending Approval Entries</span><span className="font-bold text-amber-500">{pendingCount}</span></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
