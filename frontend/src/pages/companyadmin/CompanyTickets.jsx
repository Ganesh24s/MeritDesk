import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineArrowPath, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineClock, HiOutlineMagnifyingGlass, HiOutlineFunnel } from 'react-icons/hi2'

const priorityBadge = (p) => {
  const map = { CRITICAL: 'badge-danger', HIGH: 'badge-warning', MEDIUM: 'badge-info', LOW: 'badge-neutral' }
  return map[p] || 'badge-neutral'
}

const statusBadge = (s) => {
  const map = { OPEN: 'badge-info', ASSIGNED: 'badge-primary', IN_PROGRESS: 'badge-warning', RESOLVED: 'badge-success', CLOSED: 'badge-neutral' }
  return map[s] || 'badge-neutral'
}

export default function CompanyTickets() {
  const [tickets, setTickets] = useState([])
  const [employees, setEmployees] = useState([])
  const [extensionRequests, setExtensionRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [filter, setFilter] = useState({ status: '', priority: '', search: '' })
  const [assignDrawer, setAssignDrawer] = useState(null) // ticketId
  const [selectedEmployee, setSelectedEmployee] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [ticketRes, empRes, extRes] = await Promise.all([
        api.get('/company/tickets'),
        api.get('/company/employees'),
        api.get('/company/tickets/extension-requests'),
      ])
      setTickets(ticketRes.data || [])
      setEmployees(empRes.data || [])
      setExtensionRequests(extRes.data || [])
    } catch { toast.error('Failed to load data') }
    setLoading(false)
  }

  const handleAssign = async () => {
    if (!assignDrawer || !selectedEmployee) return
    try {
      await api.put(`/company/tickets/${assignDrawer}/assign/${selectedEmployee}`)
      toast.success('Ticket reassigned!')
      setAssignDrawer(null)
      setSelectedEmployee('')
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to assign') }
  }

  const handleEscalate = async (id) => {
    if (!confirm('Escalate this ticket to CRITICAL priority? The resolution deadline will be set to 2 hours.')) return
    try {
      await api.put(`/company/tickets/${id}/escalate`)
      toast.success('Ticket escalated!')
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to escalate') }
  }

  const handleExtension = async (id, approve) => {
    try {
      await api.put(`/company/tickets/${id}/extension/${approve ? 'approve' : 'reject'}`)
      toast.success(`Extension ${approve ? 'approved' : 'rejected'}!`)
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to process') }
  }

  const filtered = tickets.filter(t => {
    if (tab === 'resolved' && t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false
    if (filter.status && t.status !== filter.status) return false
    if (filter.priority && t.priority !== filter.priority) return false
    if (filter.search) {
      const s = filter.search.toLowerCase()
      return t.title?.toLowerCase().includes(s) || t.assignedToName?.toLowerCase().includes(s) || t.category?.toLowerCase().includes(s)
    }
    return true
  })

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="section-title">Company Tickets</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
        {[
          { key: 'all', label: `All Tickets (${tickets.length})` },
          { key: 'resolved', label: `Resolved History (${tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length})` },
          { key: 'extensions', label: `Extension Requests (${extensionRequests.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {(tab === 'all' || tab === 'resolved') && (
        <>
          {/* Filters */}
          <div className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-3 items-center flex-1">
              <div className="relative min-w-[220px] max-w-xs flex-1">
                <HiOutlineMagnifyingGlass className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input value={filter.search} onChange={e => setFilter({ ...filter, search: e.target.value })}
                  placeholder="Search tickets by ID, title..." className="input-field pl-10 text-xs" />
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
                <HiOutlineFunnel className="w-4 h-4 text-primary-500" />
                <span>Filter:</span>
              </div>
              <select value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} className="input-field max-w-[160px] text-xs">
                <option value="">All Status</option>
                {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <select value={filter.priority} onChange={e => setFilter({ ...filter, priority: e.target.value })} className="input-field max-w-[140px] text-xs">
                <option value="">All Priority</option>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <span className="text-xs text-surface-400 font-mono font-medium">
              Showing {filtered.length} of {tickets.length} tickets
            </span>
          </div>

          {/* Tickets Table */}
          <div className="glass-card overflow-hidden">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Department</th>
                    <th>Assigned To</th>
                    <th>Solved Time & Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan="8" className="text-center py-8 text-surface-400">No tickets found</td></tr>
                  ) : filtered.map(t => (
                    <tr key={t.id} className={t.escalated ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                      <td className="font-mono text-xs">#{t.id}</td>
                      <td>
                        <div className="max-w-[180px]">
                          <p className="font-medium text-sm truncate">{t.title}</p>
                          {t.category && <p className="text-xs text-surface-400">{t.category}</p>}
                        </div>
                      </td>
                      <td><span className={`badge ${priorityBadge(t.priority)}`}>{t.priority}</span></td>
                      <td><span className={`badge ${statusBadge(t.status)}`}>{t.status?.replace('_', ' ')}</span></td>
                      <td className="text-sm">{t.departmentName || '—'}</td>
                      <td className="text-sm">{t.assignedToName || <span className="text-amber-500">Unassigned</span>}</td>
                      <td className="text-xs font-mono">
                        {t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : ((t.status === 'RESOLVED' || t.status === 'CLOSED') ? new Date(t.updatedAt).toLocaleString() : '—')}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <button onClick={() => { setAssignDrawer(t.id); setSelectedEmployee(t.assignedToId || '') }} title="Reassign"
                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500">
                            <HiOutlineArrowPath className="w-4 h-4" />
                          </button>
                          {!t.escalated && t.status !== 'RESOLVED' && t.status !== 'CLOSED' && (
                            <button onClick={() => handleEscalate(t.id)} title="Escalate"
                              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                              <HiOutlineExclamationTriangle className="w-4 h-4" />
                            </button>
                          )}
                          {t.escalated && <span className="badge badge-danger text-[10px]">Escalated</span>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Extension Requests Tab */}
      {tab === 'extensions' && (
        <div className="space-y-3">
          {extensionRequests.length === 0 ? (
            <div className="glass-card p-8 text-center text-surface-400">No pending extension requests 🎉</div>
          ) : extensionRequests.map(t => (
            <div key={t.id} className="glass-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <HiOutlineClock className="w-5 h-5 text-amber-500" />
                    <span className="font-semibold">Ticket #{t.id}: {t.title}</span>
                  </div>
                  <p className="text-sm text-surface-500">Assigned to: <span className="font-medium text-surface-700 dark:text-surface-300">{t.assignedToName}</span></p>
                  <p className="text-sm text-surface-500 mt-1">Reason: <span className="text-surface-700 dark:text-surface-300">{t.extensionReason || 'No reason provided'}</span></p>
                  <p className="text-sm text-surface-500 mt-1">Requested Deadline: <span className="font-medium text-blue-500">{t.extensionRequestedDeadline ? new Date(t.extensionRequestedDeadline).toLocaleString() : '—'}</span></p>
                  <p className="text-sm text-surface-500 mt-1">Current Deadline: <span className={t.slaResolutionBreached ? 'text-red-500 font-semibold' : 'text-surface-600 dark:text-surface-300'}>{t.slaResolutionDeadline ? new Date(t.slaResolutionDeadline).toLocaleString() : '—'}</span></p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleExtension(t.id, true)} className="btn-success text-sm flex items-center gap-1">
                    <HiOutlineCheckCircle className="w-4 h-4" /> Approve
                  </button>
                  <button onClick={() => handleExtension(t.id, false)} className="btn-danger text-sm flex items-center gap-1">
                    <HiOutlineXCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Assignment Modal */}
      {assignDrawer && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setAssignDrawer(null)}>
          <div className="glass-card p-6 w-full max-w-md animate-fade-in" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-4">Reassign Ticket #{assignDrawer}</h3>
            <label className="label">Select Employee</label>
            <select value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)} className="input-field mb-4">
              <option value="">-- Select --</option>
              {employees.filter(e => e.active).map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.departmentName}) - Load: {e.currentWorkload}/{e.maxCapacity}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button onClick={handleAssign} className="btn-primary text-sm" disabled={!selectedEmployee}>Assign</button>
              <button onClick={() => setAssignDrawer(null)} className="btn-secondary text-sm">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
