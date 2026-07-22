import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineDocumentArrowDown, HiOutlineFunnel } from 'react-icons/hi2'

export default function CompanyReports() {
  const [report, setReport] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('departments')
  const [filters, setFilters] = useState({ startDate: '', endDate: '', departmentId: '' })

  useEffect(() => {
    api.get('/company/departments').then(r => setDepartments(r.data || []))
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.startDate) params.set('startDate', `${filters.startDate}T00:00:00`)
      if (filters.endDate) params.set('endDate', `${filters.endDate}T23:59:59`)
      if (filters.departmentId) params.set('departmentId', filters.departmentId)
      const res = await api.get(`/company/reports?${params}`)
      setReport(res.data)
    } catch { toast.error('Failed to load reports') }
    setLoading(false)
  }

  const exportCSV = (data, filename, headers) => {
    const csv = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] ?? ''}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success(`${filename}.csv downloaded!`)
  }

  const printReport = () => {
    window.print()
    toast.success('Print dialog opened')
  }

  if (loading || !report) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  const deptReports = report.departmentReports || []
  const empReports = report.employeeReports || []
  const breachReports = report.breachReports || []
  const leaderboard = report.honourLeaderboard || []
  const recurringCats = report.recurringCategories || {}

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="section-title">Company Reports</h1>
        <div className="flex gap-2">
          <button onClick={printReport} className="btn-secondary text-sm flex items-center gap-2">
            <HiOutlineDocumentArrowDown className="w-4 h-4" /> Print / PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-end gap-4">
        <HiOutlineFunnel className="w-5 h-5 text-surface-400" />
        <div>
          <label className="label">Start Date</label>
          <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} className="input-field" />
        </div>
        <div>
          <label className="label">End Date</label>
          <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} className="input-field" />
        </div>
        <div>
          <label className="label">Department</label>
          <select value={filters.departmentId} onChange={e => setFilters({...filters, departmentId: e.target.value})} className="input-field">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <button onClick={fetchReports} className="btn-primary text-sm">Apply Filters</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
        {[
          { key: 'departments', label: '🏢 Departments' },
          { key: 'employees', label: '👥 Employees' },
          { key: 'breaches', label: '⚠️ SLA Breaches' },
          { key: 'leaderboard', label: '🏆 Leaderboard' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Department Reports */}
      {tab === 'departments' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-surface-200/50 dark:border-surface-700/50">
            <h3 className="font-semibold">Department Performance</h3>
            <button onClick={() => exportCSV(deptReports, 'department_report', ['departmentName','totalTickets','activeTickets','resolvedTickets','slaComplianceRate','currentLoad','capacity'])}
              className="btn-secondary text-xs">Export CSV</button>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Department</th><th>Total</th><th>Active</th><th>Resolved</th><th>SLA %</th><th>Load</th></tr></thead>
              <tbody>
                {deptReports.length === 0 ? <tr><td colSpan="6" className="text-center py-6 text-surface-400">No data</td></tr> :
                deptReports.map(d => (
                  <tr key={d.departmentId}>
                    <td className="font-medium">{d.departmentName}</td>
                    <td>{d.totalTickets}</td>
                    <td><span className="badge badge-warning">{d.activeTickets}</span></td>
                    <td><span className="badge badge-success">{d.resolvedTickets}</span></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${d.slaComplianceRate >= 90 ? 'bg-emerald-500' : d.slaComplianceRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{width: `${Math.min(d.slaComplianceRate, 100)}%`}}></div>
                        </div>
                        <span className="text-sm font-medium">{d.slaComplianceRate?.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="text-sm">{d.currentLoad}/{d.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Employee Reports */}
      {tab === 'employees' && (
        <div className="glass-card overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-surface-200/50 dark:border-surface-700/50">
            <h3 className="font-semibold">Employee Performance</h3>
            <button onClick={() => exportCSV(empReports, 'employee_report', ['employeeName','departmentName','ticketsResolved','avgResolutionTimeHours','honourScore','honourLevel'])}
              className="btn-secondary text-xs">Export CSV</button>
          </div>
          <div className="table-container">
            <table>
              <thead><tr><th>Employee</th><th>Department</th><th>Resolved</th><th>Avg Resolution</th><th>Honour Score</th><th>Level</th></tr></thead>
              <tbody>
                {empReports.length === 0 ? <tr><td colSpan="6" className="text-center py-6 text-surface-400">No data</td></tr> :
                empReports.map(e => (
                  <tr key={e.employeeId}>
                    <td className="font-medium">{e.employeeName}</td>
                    <td className="text-sm">{e.departmentName}</td>
                    <td><span className="badge badge-success">{e.ticketsResolved}</span></td>
                    <td className="text-sm">{e.avgResolutionTimeHours?.toFixed(1)}h</td>
                    <td className="font-bold text-primary-500">{e.honourScore?.toFixed(0)}</td>
                    <td><span className="badge badge-primary">{e.honourLevel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SLA Breach Reports */}
      {tab === 'breaches' && (
        <div className="space-y-4">
          {/* Recurring Categories */}
          {Object.keys(recurringCats).length > 0 && (
            <div className="glass-card p-5">
              <h3 className="font-semibold mb-3">Recurring Breach Categories</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(recurringCats).sort(([,a],[,b]) => b - a).map(([cat, count]) => (
                  <div key={cat} className="badge badge-danger px-3 py-1.5 text-sm">
                    {cat}: {count} breach{count > 1 ? 'es' : ''}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="glass-card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-surface-200/50 dark:border-surface-700/50">
              <h3 className="font-semibold">SLA Breach Details ({breachReports.length})</h3>
              <button onClick={() => exportCSV(breachReports, 'sla_breaches', ['ticketId','title','priority','category','departmentName','assignedToName','breachType','rootCause'])}
                className="btn-secondary text-xs">Export CSV</button>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>#</th><th>Title</th><th>Priority</th><th>Department</th><th>Assigned</th><th>Breach Type</th><th>Root Cause</th></tr></thead>
                <tbody>
                  {breachReports.length === 0 ? <tr><td colSpan="7" className="text-center py-6 text-surface-400">No SLA breaches 🎉</td></tr> :
                  breachReports.map(b => (
                    <tr key={b.ticketId}>
                      <td className="font-mono text-xs">#{b.ticketId}</td>
                      <td className="font-medium text-sm max-w-[180px] truncate">{b.title}</td>
                      <td><span className={`badge ${b.priority === 'CRITICAL' ? 'badge-danger' : b.priority === 'HIGH' ? 'badge-warning' : 'badge-info'}`}>{b.priority}</span></td>
                      <td className="text-sm">{b.departmentName}</td>
                      <td className="text-sm">{b.assignedToName}</td>
                      <td><span className="badge badge-danger">{b.breachType}</span></td>
                      <td className="text-xs text-surface-500 max-w-[250px] truncate" title={b.rootCause}>{b.rootCause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard */}
      {tab === 'leaderboard' && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">🏆 Full Honour Leaderboard</h3>
            <button onClick={() => exportCSV(leaderboard.map(e => ({name: e.name, email: e.email, honourScore: e.honourScore, honourLevel: e.honourLevel, departmentName: e.departmentName})), 'honour_leaderboard', ['name','email','honourScore','honourLevel','departmentName'])}
              className="btn-secondary text-xs">Export CSV</button>
          </div>
          <div className="space-y-2">
            {leaderboard.length === 0 ? (
              <p className="text-center text-surface-400 py-8">No employee data</p>
            ) : leaderboard.map((emp, i) => (
              <div key={emp.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  i === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-400/30' :
                  i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-white' :
                  i === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                  'bg-surface-100 dark:bg-surface-800 text-surface-500'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{emp.name}</p>
                  <p className="text-xs text-surface-400 truncate">{emp.departmentName || 'Unassigned'} · {emp.email}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary-500">{emp.honourScore?.toFixed(0)}</p>
                  <p className="text-xs text-surface-400">{emp.honourLevel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
