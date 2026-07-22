import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { 
  HiOutlinePlusCircle, HiOutlineAdjustmentsHorizontal, HiOutlineMagnifyingGlass,
  HiOutlineEye, HiOutlineCalendar, HiStar
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

export default function CustomerTickets() {
  const navigate = useNavigate()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchTickets()
  }, [])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await api.get('/customer/tickets')
      setTickets(res.data || [])
    } catch {
      toast.error('Failed to load tickets')
    } finally {
      setLoading(false)
    }
  }

  // Filter list logic
  const filteredTickets = tickets.filter(t => {
    // Status filter
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false

    // Priority filter
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false

    // Text search (title, ID, description)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const titleMatch = t.title?.toLowerCase().includes(query)
      const descMatch = t.description?.toLowerCase().includes(query)
      const idMatch = String(t.id).includes(query)
      if (!titleMatch && !descMatch && !idMatch) return false
    }

    // Date range filter
    if (startDate) {
      const ticketDate = new Date(t.createdAt).toISOString().slice(0, 10)
      if (ticketDate < startDate) return false
    }
    if (endDate) {
      const ticketDate = new Date(t.createdAt).toISOString().slice(0, 10)
      if (ticketDate > endDate) return false
    }

    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">My Tickets</h1>
          <p className="text-sm text-surface-500">Track the resolution progress and history of your service tickets.</p>
        </div>
        <Link to="/dashboard/raise-ticket" className="btn-primary flex items-center gap-2 text-sm">
          <HiOutlinePlusCircle className="w-5 h-5" />
          Raise Ticket
        </Link>
      </div>

      {/* Filter Options */}
      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-surface-900 dark:text-white">
            <HiOutlineAdjustmentsHorizontal className="w-4 h-4 text-primary-500" />
            Filters & Sorting
          </div>
          {(statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchQuery || startDate || endDate) && (
            <button
              onClick={() => {
                setStatusFilter('ALL')
                setPriorityFilter('ALL')
                setSearchQuery('')
                setStartDate('')
                setEndDate('')
              }}
              className="text-xs font-bold text-red-500 hover:underline bg-transparent border-0 cursor-pointer"
            >
              Clear all filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Text Search */}
          <div className="relative">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-2.5 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Search ID, title..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field pl-9 py-2 text-xs"
            />
          </div>

          {/* Status Select */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="input-field py-2 text-xs cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>
          </div>

          {/* Priority Select */}
          <div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
              className="input-field py-2 text-xs cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="relative">
            <HiOutlineCalendar className="absolute left-3 top-2.5 w-4 h-4 text-surface-400" />
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="input-field pl-9 py-2 text-xs"
            />
          </div>

          {/* End Date */}
          <div className="relative">
            <HiOutlineCalendar className="absolute left-3 top-2.5 w-4 h-4 text-surface-400" />
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="input-field pl-9 py-2 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="table-container">
          <table className="min-w-full divide-y divide-surface-200/50 dark:divide-surface-800/50">
            <thead className="bg-surface-50 dark:bg-surface-800/40 text-[10px] font-bold text-surface-450 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3.5 text-left">ID</th>
                <th className="px-4 py-3.5 text-left">Title</th>
                <th className="px-4 py-3.5 text-left">Priority</th>
                <th className="px-4 py-3.5 text-left">Status</th>
                <th className="px-4 py-3.5 text-left">Assigned Agent</th>
                <th className="px-4 py-3.5 text-left">Submitted Time & Date</th>
                <th className="px-4 py-3.5 text-left">Solved Time & Date</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200/50 dark:divide-surface-800/50 text-xs text-surface-700 dark:text-surface-300">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-surface-400">
                    No tickets found matching your selection.
                  </td>
                </tr>
              ) : (
                filteredTickets.map(t => (
                  <tr key={t.id} className="hover:bg-surface-50/50 dark:hover:bg-surface-800/10 transition-colors cursor-pointer" onClick={() => navigate(`/dashboard/customer-tickets/${t.id}`)}>
                    <td className="px-4 py-4 font-mono font-semibold">#{t.id}</td>
                    <td className="px-4 py-4 font-bold max-w-[180px] truncate">{t.title}</td>
                    <td className="px-4 py-4">
                      <span className={`badge ${priorityColors[t.priority]}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge ${statusColors[t.status]}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold">{t.assignedToName || 'Unassigned'}</td>
                    <td className="px-4 py-4 font-mono text-[11px]">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-4 font-mono text-[11px]">
                      {t.resolvedAt ? new Date(t.resolvedAt).toLocaleString() : ((t.status === 'RESOLVED' || t.status === 'CLOSED') ? new Date(t.updatedAt).toLocaleString() : '-')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {(t.status === 'RESOLVED' || t.status === 'CLOSED') && !t.feedback && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(`/dashboard/customer-tickets/${t.id}`)
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 rounded-lg flex items-center gap-1 transition-colors border-0 cursor-pointer"
                            title="Rate Ticket Resolution"
                          >
                            <HiStar className="w-3.5 h-3.5" /> Rate
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/dashboard/customer-tickets/${t.id}`)
                          }}
                          className="p-2 rounded-xl text-primary-500 hover:bg-primary-500/10 bg-transparent border-0 cursor-pointer transition-colors"
                          title="View Details"
                        >
                          <HiOutlineEye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
