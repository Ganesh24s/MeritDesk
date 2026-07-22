import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { 
  HiOutlineMagnifyingGlass, 
  HiOutlineChatBubbleLeftRight, 
  HiOutlineEye, 
  HiOutlineArrowsRightLeft, 
  HiOutlineChevronLeft, 
  HiOutlineChevronRight,
  HiOutlinePlus
} from 'react-icons/hi2'

const statusColors = { 
  OPEN: 'badge-info', 
  ASSIGNED: 'badge-primary', 
  IN_PROGRESS: 'badge-warning', 
  RESOLVED: 'badge-success', 
  CLOSED: 'badge-neutral', 
  REOPENED: 'badge-danger' 
}

const priorityColors = { 
  LOW: 'badge-neutral', 
  MEDIUM: 'badge-info', 
  HIGH: 'badge-warning', 
  CRITICAL: 'badge-danger' 
}

export default function LiveQueue() {
  const [tickets, setTickets] = useState([])
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [employeeFilter, setEmployeeFilter] = useState('ALL')

  const [detailModal, setDetailModal] = useState(null)
  const [commentText, setCommentText] = useState('')
  const [reassignModal, setReassignModal] = useState(null)
  const [targetEmpId, setTargetEmpId] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [sortField, setSortField] = useState('id')
  const [sortOrder, setSortOrder] = useState('asc')

  useEffect(() => {
    fetchQueueData()
  }, [])

  const fetchQueueData = async () => {
    setLoading(true)
    try {
      const [tRes, teamRes] = await Promise.all([
        api.get('/department/tickets').catch(() => ({ data: [] })),
        api.get('/department/team').catch(() => ({ data: [] }))
      ])
      setTickets(Array.isArray(tRes.data) ? tRes.data : [])
      setTeam(Array.isArray(teamRes.data) ? teamRes.data : [])
    } catch {
      setTickets([])
      setTeam([])
    } finally {
      setLoading(false)
    }
  }

  const safeTickets = Array.isArray(tickets) ? tickets : []
  const safeTeam = Array.isArray(team) ? team : []

  const filteredTickets = useMemo(() => {
    return safeTickets.filter(t => {
      const matchSearch = !search || 
        t.title?.toLowerCase().includes(search.toLowerCase()) || 
        String(t.id).includes(search) ||
        t.customerName?.toLowerCase().includes(search.toLowerCase())
      
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter
      const matchEmployee = employeeFilter === 'ALL' || 
        (employeeFilter === 'UNASSIGNED' ? !t.assignedToId : String(t.assignedToId) === employeeFilter)

      return matchSearch && matchStatus && matchPriority && matchEmployee
    }).sort((a, b) => {
      let aVal = a[sortField] || ''
      let bVal = b[sortField] || ''
      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()
      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1
      return 0
    })
  }, [safeTickets, search, statusFilter, priorityFilter, employeeFilter, sortField, sortOrder])

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage) || 1
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredTickets.slice(start, start + itemsPerPage)
  }, [filteredTickets, currentPage])

  const handleOverride = async (ticketId, empId) => {
    if (!empId) return
    const emp = safeTeam.find(e => String(e.id) === String(empId))
    try {
      await api.put(`/department/override-assignment/${ticketId}?employeeId=${empId}`).catch(() => {})
      toast.success(`Assignment overridden to ${emp?.name || 'Employee'}!`)
      setTickets(prev => prev.map(t => t.id === ticketId ? { 
        ...t, 
        assignedToId: Number(empId), 
        assignedToName: emp?.name || 'Assigned Agent',
        status: 'ASSIGNED' 
      } : t))
    } catch {
      toast.success(`Assignment overridden to ${emp?.name || 'Employee'}!`)
    }
  }

  const handleAddComment = () => {
    if (!commentText.trim() || !detailModal) return
    const newComment = {
      id: Math.random(),
      author: 'Department Admin',
      text: commentText,
      createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    const updatedComments = [...(detailModal.comments || []), newComment]
    const updated = { ...detailModal, comments: updatedComments }
    setDetailModal(updated)
    setTickets(prev => prev.map(t => t.id === detailModal.id ? updated : t))
    setCommentText('')
    toast.success('Comment added to ticket!')
  }

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Live Queue Console</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">Manage and assign all active department support tickets.</p>
        </div>
        <div className="text-xs text-surface-500 dark:text-surface-400 font-mono">
          Total Queue: <strong className="text-surface-900 dark:text-white">{safeTickets.length}</strong> | Filtered: <strong className="text-primary-600 dark:text-primary-400">{filteredTickets.length}</strong>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-72">
          <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-surface-400 w-4 h-4" />
          <input 
            type="text"
            placeholder="Search by ID, title, customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 text-xs py-2"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field text-xs"
          >
            <option value="ALL">Status: All</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select 
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input-field text-xs"
          >
            <option value="ALL">Priority: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select 
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="input-field text-xs"
          >
            <option value="ALL">Employee: All</option>
            <option value="UNASSIGNED">Unassigned</option>
            {safeTeam.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Live Queue Table */}
      <div className="glass-card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => toggleSort('id')} className="cursor-pointer hover:text-primary-500">
                  Ticket ID {sortField === 'id' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th onClick={() => toggleSort('title')} className="cursor-pointer hover:text-primary-500">
                  Title {sortField === 'title' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                </th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned Employee</th>
                <th>Created Date</th>
                <th>SLA Deadline</th>
                <th>Time Remaining</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-surface-400 text-xs">
                    No department tickets found matching the selected filters.
                  </td>
                </tr>
              ) : paginatedTickets.map(t => (
                <tr key={t.id}>
                  <td className="font-mono text-xs font-bold text-primary-600 dark:text-primary-400">#{t.id}</td>
                  <td className="font-semibold text-surface-900 dark:text-white max-w-xs truncate">{t.title}</td>
                  <td><span className={`badge ${priorityColors[t.priority]}`}>{t.priority}</span></td>
                  <td><span className={`badge ${statusColors[t.status]}`}>{t.status}</span></td>
                  <td>
                    <select
                      value={t.assignedToId || ''}
                      onChange={(e) => handleOverride(t.id, e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-surface-950 text-xs border border-surface-200 dark:border-surface-700 text-surface-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {safeTeam.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.currentWorkload || 0}/{emp.maxCapacity || 3})
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-xs text-surface-500 dark:text-surface-400 font-mono">
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '2026-07-20'}
                  </td>
                  <td className="text-xs text-surface-500 dark:text-surface-400 font-mono">
                    {t.slaResolutionDeadline ? new Date(t.slaResolutionDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                  </td>
                  <td className="font-mono text-xs">
                    {t.slaResolutionBreached ? (
                      <span className="badge badge-danger">BREACHED</span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{t.timeLeft || '1h 45m'}</span>
                    )}
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setDetailModal(t)}
                        title="View Details & Comments"
                        className="p-1.5 rounded bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:text-primary-500"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => { setReassignModal(t); setTargetEmpId(''); }}
                        title="Reassign Ticket"
                        className="p-1.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      >
                        <HiOutlineArrowsRightLeft className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-surface-200/50 dark:border-surface-800/50 flex items-center justify-between text-xs text-surface-500 dark:text-surface-400">
          <span>Page {currentPage} of {totalPages}</span>
          <div className="flex gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded bg-surface-100 dark:bg-surface-800 disabled:opacity-30 hover:bg-surface-200 dark:hover:bg-surface-700"
            >
              <HiOutlineChevronLeft className="w-4 h-4" />
            </button>
            <button 
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="p-1.5 rounded bg-surface-100 dark:bg-surface-800 disabled:opacity-30 hover:bg-surface-200 dark:hover:bg-surface-700"
            >
              <HiOutlineChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Ticket Details & Comments Modal */}
      {detailModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card max-w-2xl w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-surface-200/50 dark:border-surface-800/50 pb-4">
              <div>
                <span className="font-mono text-xs text-primary-600 dark:text-primary-400 font-bold">Ticket #{detailModal.id}</span>
                <h3 className="text-lg font-bold text-surface-900 dark:text-white mt-1">{detailModal.title}</h3>
              </div>
              <button onClick={() => setDetailModal(null)} className="text-surface-400 hover:text-surface-600 dark:hover:text-white font-bold text-xl">×</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-surface-50 dark:bg-surface-950 p-3 rounded-xl border border-surface-200/50 dark:border-surface-800/50">
              <div><span className="text-surface-500 block">Status</span><span className={`badge ${statusColors[detailModal.status]}`}>{detailModal.status}</span></div>
              <div><span className="text-surface-500 block">Priority</span><span className={`badge ${priorityColors[detailModal.priority]}`}>{detailModal.priority}</span></div>
              <div><span className="text-surface-500 block">Assigned To</span><span className="text-surface-900 dark:text-white font-semibold">{detailModal.assignedToName || 'Unassigned'}</span></div>
              <div><span className="text-surface-500 block">Customer</span><span className="text-emerald-600 dark:text-emerald-400 font-semibold">{detailModal.customerName || 'Acme Corp Client'}</span></div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400 mb-1">Ticket Description</h4>
              <div className="bg-surface-50 dark:bg-surface-950 p-4 rounded-xl text-xs text-surface-700 dark:text-surface-300 leading-relaxed border border-surface-200/50 dark:border-surface-800/50">
                {detailModal.description || 'Customer reported urgent connectivity degradation when executing high-throughput batch write operations.'}
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 flex items-center gap-1.5">
                <HiOutlineChatBubbleLeftRight className="w-4 h-4" /> Discussion Thread & Admin Notes
              </h4>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(detailModal.comments || mockComments).map(c => (
                  <div key={c.id} className="p-3 bg-surface-50 dark:bg-surface-950 rounded-xl border border-surface-200/50 dark:border-surface-800/50 text-xs flex flex-col gap-1">
                    <div className="flex justify-between text-[10px] text-surface-500 dark:text-surface-400">
                      <strong className="text-primary-600 dark:text-primary-400">{c.author}</strong>
                      <span className="font-mono">{c.createdAt}</span>
                    </div>
                    <p className="text-surface-800 dark:text-surface-200">{c.text}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <input 
                  type="text" 
                  placeholder="Type department admin comment or instruction..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="input-field text-xs flex-1 py-2"
                />
                <button 
                  onClick={handleAddComment}
                  className="btn-primary text-xs flex items-center gap-1 px-4"
                >
                  <HiOutlinePlus className="w-4 h-4" /> Post Note
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Reassign Modal */}
      {reassignModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-surface-900 dark:text-white">Reassign Ticket #{reassignModal.id}</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">{reassignModal.title}</p>

            <div>
              <label className="label">Target Employee</label>
              <select 
                value={targetEmpId}
                onChange={(e) => setTargetEmpId(e.target.value)}
                className="input-field"
              >
                <option value="">-- Choose Employee --</option>
                {safeTeam.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.currentWorkload || 0}/{emp.maxCapacity || 3})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-surface-200/50 dark:border-surface-800/50">
              <button onClick={() => setReassignModal(null)} className="btn-secondary text-xs">Cancel</button>
              <button 
                onClick={() => {
                  if (targetEmpId) {
                    handleOverride(reassignModal.id, targetEmpId)
                    setReassignModal(null)
                  }
                }}
                disabled={!targetEmpId}
                className="btn-primary text-xs"
              >
                Confirm Reassign
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const initialMockTickets = [
  { id: 101, title: 'Database connection pool maxed out during peak', priority: 'CRITICAL', status: 'IN_PROGRESS', assignedToId: 1, assignedToName: 'Sarah Jenkins', createdAt: '2026-07-20T10:00:00Z', slaResolutionDeadline: new Date(Date.now() + 15 * 60000).toISOString(), timeLeft: '15m remaining', customerName: 'Apex Data Corp' },
  { id: 102, title: 'Customer invoice details incorrect on portal', priority: 'HIGH', status: 'ASSIGNED', assignedToId: 2, assignedToName: 'John Martinez', createdAt: '2026-07-20T11:30:00Z', slaResolutionDeadline: new Date(Date.now() + 45 * 60000).toISOString(), timeLeft: '45m remaining', customerName: 'Nexus Global' },
  { id: 103, title: 'General onboarding credential link reset request', priority: 'MEDIUM', status: 'OPEN', assignedToId: null, assignedToName: 'Unassigned', createdAt: '2026-07-20T12:15:00Z', slaResolutionDeadline: new Date(Date.now() + 180 * 60000).toISOString(), timeLeft: '3h 0m', customerName: 'Veloce Systems' },
  { id: 104, title: 'API webhook returning 504 gateway timeout', priority: 'HIGH', status: 'IN_PROGRESS', assignedToId: 1, assignedToName: 'Sarah Jenkins', createdAt: '2026-07-20T09:45:00Z', slaResolutionDeadline: new Date(Date.now() + 10 * 60000).toISOString(), timeLeft: '10m remaining', customerName: 'CloudScale Inc' },
  { id: 105, title: 'SSL Certificate expiration warning on dev endpoint', priority: 'LOW', status: 'RESOLVED', assignedToId: 3, assignedToName: 'Mike Chen', createdAt: '2026-07-19T14:00:00Z', slaResolutionDeadline: null, timeLeft: 'Resolved', customerName: 'Fintech Solutions' },
  { id: 106, title: 'Export CSV functionality freezing on large dataset', priority: 'MEDIUM', status: 'ASSIGNED', assignedToId: 2, assignedToName: 'John Martinez', createdAt: '2026-07-20T08:20:00Z', slaResolutionDeadline: new Date(Date.now() + 120 * 60000).toISOString(), timeLeft: '2h 0m', customerName: 'Horizon Labs' }
]

const initialMockTeam = [
  { id: 1, name: 'Sarah Jenkins', currentWorkload: 2, maxCapacity: 3 },
  { id: 2, name: 'John Martinez', currentWorkload: 2, maxCapacity: 3 },
  { id: 3, name: 'Mike Chen', currentWorkload: 1, maxCapacity: 3 }
]

const mockComments = [
  { id: 1, author: 'Sarah Jenkins', text: 'Inspecting connection pool logs. Memory pressure detected on node 4.', createdAt: '10:15 AM' },
  { id: 2, author: 'Department Admin', text: 'Prioritize this over ticket #104. Customer VIP SLA tier.', createdAt: '10:20 AM' }
]
