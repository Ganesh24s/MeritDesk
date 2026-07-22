import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineAdjustmentsHorizontal, HiOutlineMagnifyingGlass, HiOutlineClock, HiOutlineUser, HiOutlinePhone, HiOutlineEnvelope } from 'react-icons/hi2'

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

export default function EmployeeTickets() {
  const [tickets, setTickets] = useState([])
  const [selected, setSelected] = useState(null)
  const [comment, setComment] = useState('')
  const [status, setStatus] = useState('')
  
  // Extension Request Modal state
  const [showExtensionModal, setShowExtensionModal] = useState(false)
  const [extensionReason, setExtensionReason] = useState('')
  const [requestedDeadline, setRequestedDeadline] = useState('')

  // Filters state
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState('ACTIVE')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    try {
      const r = await api.get('/employee/tickets')
      setTickets(r.data || [])
    } catch {
      toast.error('Failed to fetch tickets')
    }
  }

  const isOverdue = (t) => {
    return t.slaResolutionBreached || (t.slaResolutionDeadline && new Date(t.slaResolutionDeadline) < new Date())
  }

  const formatTimeRemaining = (t) => {
    if (t.status === 'RESOLVED' || t.status === 'CLOSED') return '-'
    if (t.slaResolutionBreached) return <span className="text-red-500 font-semibold">BREACHED</span>
    if (!t.slaResolutionDeadline) return '-'

    const deadline = new Date(t.slaResolutionDeadline)
    const now = new Date()
    const diffMs = deadline - now

    if (diffMs < 0) {
      return <span className="text-red-500 font-semibold">OVERDUE</span>
    }

    const diffMins = Math.floor(diffMs / 60000)
    const hours = Math.floor(diffMins / 60)
    const mins = diffMins % 60

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days}d remaining`
    }
    return `${hours}h ${mins}m remaining`
  }

  // Accept/Acknowledge Ticket Action
  const handleAcceptTicket = async (ticketId) => {
    try {
      await api.put(`/employee/tickets/${ticketId}`, {
        status: 'IN_PROGRESS',
        comment: 'Ticket acknowledged and accepted by agent.'
      })
      toast.success('Ticket acknowledged successfully!')
      fetchTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept ticket')
    }
  }

  // Update Status or Add Comment Action
  const handleUpdate = async () => {
    if (!comment.trim()) {
      toast.error('Comment is required for any update')
      return
    }
    try {
      await api.put(`/employee/tickets/${selected.id}`, {
        status: status || null,
        comment
      })
      toast.success('Ticket updated successfully!')
      setSelected(null)
      setComment('')
      setStatus('')
      fetchTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket')
    }
  }

  // Submit Extension Request Action
  const handleSubmitExtension = async () => {
    if (!extensionReason.trim()) {
      toast.error('Reason for extension is required')
      return
    }
    if (!requestedDeadline) {
      toast.error('Please specify a requested deadline')
      return
    }
    try {
      await api.post(`/employee/tickets/${selected.id}/request-extension`, {
        reason: extensionReason,
        requestedDeadline: new Date(requestedDeadline).toISOString().slice(0, 19)
      })
      toast.success('Extension request submitted to admin!')
      setShowExtensionModal(false)
      setExtensionReason('')
      setRequestedDeadline('')
      setSelected(null)
      fetchTickets()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit extension request')
    }
  }

  // Filtering Logic
  const filteredTickets = tickets.filter(t => {
    // Tab filtering
    if (activeTab === 'ACTIVE' && (t.status === 'RESOLVED' || t.status === 'CLOSED')) return false
    if (activeTab === 'RESOLVED' && t.status !== 'RESOLVED' && t.status !== 'CLOSED') return false

    // Search query matching (title, ID, customer)
    if (search.trim()) {
      const query = search.toLowerCase()
      const titleMatch = t.title?.toLowerCase().includes(query)
      const idMatch = t.id?.toString().includes(query)
      const customerMatch = t.raisedByName?.toLowerCase().includes(query)
      if (!titleMatch && !idMatch && !customerMatch) return false
    }

    // Status filter
    if (statusFilter && t.status !== statusFilter) return false

    // Priority filter
    if (priorityFilter && t.priority !== priorityFilter) return false

    // Date range filter
    if (startDate) {
      const start = new Date(startDate)
      const created = new Date(t.createdAt)
      if (created < start) return false
    }
    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999) // End of day
      const created = new Date(t.createdAt)
      if (created > end) return false
    }

    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">My Tickets</h1>
          <p className="text-sm text-surface-500">Manage, prioritize, and resolve your assigned support queue.</p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            showFilters || search || statusFilter || priorityFilter || startDate || endDate
              ? 'bg-primary-500/10 text-primary-500 border-primary-500/30'
              : 'bg-white dark:bg-surface-800 border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300'
          }`}
        >
          <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
          Filters {(statusFilter || priorityFilter || startDate || endDate) && '•'}
        </button>
      </div>

      {/* Filter panel */}
      {(showFilters || search || statusFilter || priorityFilter || startDate || endDate) && (
        <div className="glass-card p-5 grid md:grid-cols-4 gap-4 animate-slide-down">
          <div className="md:col-span-2">
            <label className="label">Search Query</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search ticket title, ID, or customer..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-field pl-10"
              />
              <HiOutlineMagnifyingGlass className="absolute left-3 top-3.5 w-5 h-5 text-surface-400" />
            </div>
          </div>

          <div>
            <label className="label">Status</label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>

          <div>
            <label className="label">Priority</label>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="input-field"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          <div>
            <label className="label">Created Date From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">Created Date To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex items-end justify-end md:col-span-2">
            {(search || statusFilter || priorityFilter || startDate || endDate) && (
              <button
                onClick={() => {
                  setSearch(''); setStatusFilter(''); setPriorityFilter(''); setStartDate(''); setEndDate('')
                }}
                className="text-xs text-red-500 font-bold hover:underline py-3 px-4"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-surface-200/50 dark:border-surface-700/50 gap-4">
        <button
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all bg-transparent border-0 cursor-pointer ${
            activeTab === 'ACTIVE' ? 'border-primary-500 text-primary-500' : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
          }`}
        >
          Active Workload ({tickets.filter(t => t.status !== 'RESOLVED' && t.status !== 'CLOSED').length})
        </button>
        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all bg-transparent border-0 cursor-pointer ${
            activeTab === 'RESOLVED' ? 'border-primary-500 text-primary-500' : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
          }`}
        >
          Resolved & Closed History ({tickets.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length})
        </button>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Solved Date & Time</th>
                <th>SLA Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-surface-400">
                    No tickets found matching current view parameters.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(t => (
                  <tr key={t.id}>
                    <td className="font-mono">#{t.id}</td>
                    <td className="font-semibold max-w-xs truncate">{t.title}</td>
                    <td><span className={`badge ${priorityColors[t.priority] || 'badge-neutral'}`}>{t.priority}</span></td>
                    <td><span className={`badge ${statusColors[t.status] || 'badge-neutral'}`}>{t.status}</span></td>
                    <td>{t.raisedByName}</td>
                    <td className="text-xs font-mono">
                      {t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : ((t.status === 'RESOLVED' || t.status === 'CLOSED') ? new Date(t.updatedAt).toLocaleString() : '-')}
                    </td>
                    <td className="text-xs font-mono">
                      {t.slaResolutionDeadline ? new Date(t.slaResolutionDeadline).toLocaleString() : '-'}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {t.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleAcceptTicket(t.id)}
                            className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 text-xs px-2.5 py-1 rounded-lg border-0 cursor-pointer font-bold transition-all"
                          >
                            Accept
                          </button>
                        )}
                        <button
                          onClick={() => { setSelected(t); setComment(''); setStatus('') }}
                          className="bg-primary-500/10 text-primary-500 hover:bg-primary-500/20 text-xs px-2.5 py-1 rounded-lg border-0 cursor-pointer font-bold transition-all"
                        >
                          Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Update Modal */}
      {selected && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="glass-card p-6 w-full max-w-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-surface-200/50 dark:border-surface-700/50 pb-3">
              <h3 className="font-bold text-lg text-surface-900 dark:text-white">Ticket details: #{selected.id}</h3>
              <button
                onClick={() => { setSelected(null); setComment(''); setStatus('') }}
                className="text-surface-400 hover:text-surface-600 bg-transparent border-0 text-xl cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-surface-400">Title</label>
                  <p className="font-semibold text-sm">{selected.title}</p>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-surface-400">Description</label>
                  <p className="text-xs text-surface-500 whitespace-pre-wrap">{selected.description}</p>
                </div>
                {selected.category && (
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-surface-400">Category</label>
                    <p className="text-xs">{selected.category}</p>
                  </div>
                )}
                {selected.assignmentReasoning && (
                  <div className="p-3 bg-blue-500/5 dark:bg-blue-500/10 rounded-xl text-xs border border-blue-500/20">
                    <strong className="text-blue-500">Intelligent Routing:</strong>
                    <p className="text-surface-500 dark:text-surface-400 mt-0.5 line-clamp-3 hover:line-clamp-none transition-all">{selected.assignmentReasoning}</p>
                  </div>
                )}
              </div>

              {/* Customer Contact Details */}
              <div className="space-y-3 p-4 bg-surface-50 dark:bg-surface-800/40 rounded-xl border border-surface-200/30 dark:border-surface-700/20">
                <h4 className="text-xs uppercase tracking-wider font-bold text-surface-400 mb-2">Customer Details</h4>
                <div className="flex items-center gap-2 text-xs">
                  <HiOutlineUser className="w-4 h-4 text-surface-400 flex-shrink-0" />
                  <span className="font-semibold text-surface-800 dark:text-surface-200">{selected.raisedByName || 'Unknown Name'}</span>
                </div>
                {selected.raisedByEmail && (
                  <div className="flex items-center gap-2 text-xs">
                    <HiOutlineEnvelope className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    <a href={`mailto:${selected.raisedByEmail}`} className="text-primary-500 hover:underline">{selected.raisedByEmail}</a>
                  </div>
                )}
                {selected.raisedByPhone && (
                  <div className="flex items-center gap-2 text-xs">
                    <HiOutlinePhone className="w-4 h-4 text-surface-400 flex-shrink-0" />
                    <span className="text-surface-500 dark:text-surface-400">{selected.raisedByPhone}</span>
                  </div>
                )}
                <div className="border-t border-surface-200/40 dark:border-surface-700/30 pt-2.5 mt-2">
                  <label className="text-[10px] uppercase font-bold text-surface-400">Resolution SLA Deadline</label>
                  <p className="text-xs mt-0.5">
                    {selected.slaResolutionDeadline ? new Date(selected.slaResolutionDeadline).toLocaleString() : '-'}
                  </p>
                  {selected.status !== 'RESOLVED' && selected.status !== 'CLOSED' && (
                    <button
                      onClick={() => setShowExtensionModal(true)}
                      className="mt-2 text-xs font-bold text-primary-500 hover:underline bg-transparent border-0 cursor-pointer p-0"
                    >
                      Request SLA Extension
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Action form */}
            <div className="p-4 bg-surface-50 dark:bg-surface-800/40 rounded-xl border border-surface-200/30 dark:border-surface-700/20 space-y-3">
              <h4 className="text-xs uppercase tracking-wider font-bold text-surface-400">Update Ticket & Status</h4>
              <div className="grid md:grid-cols-3 gap-3">
                <div className="md:col-span-1">
                  <label className="label">Update Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className="input-field py-2"
                  >
                    <option value="">No change (Add Comment)</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Update Comment / Internal Note *</label>
                  <textarea
                    value={comment}
                    onChange={e => setComment(e.target.value)}
                    className="input-field py-2"
                    rows={2}
                    placeholder="Provide details about the status update or internal notes..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1.5 border-t border-surface-200/30 dark:border-surface-700/25">
                <button
                  onClick={handleUpdate}
                  className="btn-primary py-2 text-xs"
                >
                  Submit Update
                </button>
              </div>
            </div>

            {/* Timeline */}
            {selected.history?.length > 0 && (
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase text-surface-400 tracking-wider">Ticket Timeline & History</h4>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                  {selected.history.map(h => (
                    <div key={h.id} className="flex flex-col gap-1 p-2.5 rounded-lg bg-surface-50 dark:bg-surface-800/40 border border-surface-200/10 dark:border-surface-700/10 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`badge ${statusColors[h.status] || 'badge-neutral'}`}>{h.status || 'COMMENT'}</span>
                          <span className="font-semibold text-surface-700 dark:text-surface-300">Updated by: {h.changedByName}</span>
                        </div>
                        <span className="text-surface-400 text-[10px]">{new Date(h.timestamp).toLocaleString()}</span>
                      </div>
                      {h.comment && <p className="text-surface-500 dark:text-surface-400 mt-1 pl-2 border-l-2 border-surface-300 dark:border-surface-700">{h.comment}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* SLA Extension Request Modal */}
      {showExtensionModal && createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card p-6 w-full max-w-md space-y-4">
            <h3 className="font-bold text-lg text-surface-900 dark:text-white">Request SLA Deadline Extension</h3>
            <p className="text-xs text-surface-400">Provide an extension deadline and justifying reason. The request will be submitted to the Department Admin.</p>

            <div className="space-y-3">
              <div>
                <label className="label">Requested SLA Deadline *</label>
                <input
                  type="datetime-local"
                  value={requestedDeadline}
                  onChange={e => setRequestedDeadline(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Justification / Reason *</label>
                <textarea
                  value={extensionReason}
                  onChange={e => setExtensionReason(e.target.value)}
                  className="input-field"
                  rows={4}
                  placeholder="Explain why you need more time to resolve this ticket..."
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-surface-200/50 dark:border-surface-700/50">
              <button onClick={() => setShowExtensionModal(false)} className="btn-secondary py-2 text-xs">
                Cancel
              </button>
              <button onClick={handleSubmitExtension} className="btn-primary py-2 text-xs">
                Submit Request
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
