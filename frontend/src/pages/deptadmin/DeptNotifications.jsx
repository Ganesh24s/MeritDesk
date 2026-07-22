import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import {
  HiOutlineBell,
  HiOutlineExclamationTriangle,
  HiOutlineArrowUpCircle,
  HiOutlineQueueList,
  HiOutlineScale,
  HiOutlineCheckCircle,
  HiOutlineEye,
  HiOutlineXMark,
  HiOutlineTrash
} from 'react-icons/hi2'

const notifConfig = {
  SLA_WARNING:       { icon: HiOutlineExclamationTriangle, color: 'text-red-500',    bg: 'bg-red-500/10 dark:bg-red-950/20 border-red-500/20',    label: 'SLA Warning',      route: '/dashboard/dept-risk-tickets' },
  ESCALATION:        { icon: HiOutlineArrowUpCircle,       color: 'text-purple-500', bg: 'bg-purple-500/10 dark:bg-purple-950/20 border-purple-500/20', label: 'Escalation',    route: '/dashboard/dept-dashboard' },
  OVERFLOW_TICKET:   { icon: HiOutlineQueueList,           color: 'text-amber-500',  bg: 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/20',   label: 'Overflow Ticket', route: '/dashboard/dept-overflow' },
  CONFLICT_ASSIGNED: { icon: HiOutlineScale,               color: 'text-blue-500',   bg: 'bg-blue-500/10 dark:bg-blue-950/20 border-blue-500/20',      label: 'Conflict',        route: '/dashboard/dept-conflicts' },
  TICKET_RESOLVED:   { icon: HiOutlineCheckCircle,         color: 'text-emerald-500',bg: 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/20', label: 'Resolved',    route: '/dashboard/dept-dashboard' },
  GENERAL:           { icon: HiOutlineBell,                color: 'text-surface-400',bg: 'bg-surface-100 dark:bg-surface-800 border-surface-200 dark:border-surface-700', label: 'General', route: '/dashboard/dept-dashboard' }
}

export default function DeptNotifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [readFilter, setReadFilter] = useState('ALL')

  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dept_dismissed_notifications') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      let list = []
      if (Array.isArray(res.data) && res.data.length > 0) {
        list = res.data.map(n => ({
          id: n.id,
          type: n.type || 'GENERAL',
          title: n.title || n.message,
          body: n.body || n.link || '',
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          read: n.read
        }))
      } else if (Array.isArray(res.data) && res.data.length === 0) {
        list = []
      } else {
        list = mockNotifications
      }

      setNotifications(list.filter(n => !dismissedIds.includes(n.id)))
    } catch {
      setNotifications(mockNotifications.filter(n => !dismissedIds.includes(n.id)))
    } finally {
      setLoading(false)
    }
  }

  const safeNotifs = Array.isArray(notifications) ? notifications : []
  const unreadCount = safeNotifs.filter(n => !n.read).length

  const filtered = safeNotifs.filter(n => {
    if (readFilter === 'UNREAD') return !n.read
    if (readFilter === 'READ') return n.read
    return true
  })

  const markAsRead = async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    try {
      await api.put(`/notifications/${id}/read`)
    } catch {}
  }

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    toast.success('All notifications marked as read!')
    try {
      await api.put('/notifications/read-all')
    } catch {}
  }

  const dismissNotif = async (e, id) => {
    e.stopPropagation()
    const updated = [...dismissedIds, id]
    setDismissedIds(updated)
    try {
      localStorage.setItem('dept_dismissed_notifications', JSON.stringify(updated))
    } catch {}

    setNotifications(prev => prev.filter(n => n.id !== id))
    toast.info('Notification dismissed.')
    try {
      await api.delete(`/notifications/${id}`)
    } catch {}
  }

  const clearAll = async () => {
    const allIds = safeNotifs.map(n => n.id)
    const updated = Array.from(new Set([...dismissedIds, ...allIds]))
    setDismissedIds(updated)
    try {
      localStorage.setItem('dept_dismissed_notifications', JSON.stringify(updated))
    } catch {}

    setNotifications([])
    toast.info('All notifications cleared')
    try {
      await api.delete('/notifications')
    } catch {}
  }

  const handleClick = (notif) => {
    markAsRead(notif.id)
    const cfg = notifConfig[notif.type] || notifConfig.GENERAL
    if (cfg.route) {
      navigate(cfg.route)
    }
  }


  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="section-title">Department Notifications</h1>
          <p className="text-sm text-surface-500 dark:text-surface-400 mt-1">
            Department-level alerts for SLA breaches, escalations, overflow, and conflicts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="badge badge-danger font-mono font-bold">{unreadCount} Unread</span>
          )}
          <button onClick={markAllRead} className="btn-secondary text-xs flex items-center gap-1.5">
            <HiOutlineEye className="w-4 h-4" /> Mark All Read
          </button>
          {safeNotifs.length > 0 && (
            <button onClick={clearAll} className="btn-secondary text-xs flex items-center gap-1.5 text-red-500 hover:text-red-600 dark:text-red-400">
              <HiOutlineTrash className="w-4 h-4" /> Clear All
            </button>
          )}
        </div>
      </div>


      {/* Filter Tabs */}
      <div className="glass-card p-4 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          {['ALL', 'UNREAD', 'READ'].map(tab => (
            <button
              key={tab}
              onClick={() => setReadFilter(tab)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                readFilter === tab
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-white'
              }`}
            >
              {tab === 'ALL' ? `All (${safeNotifs.length})` : tab === 'UNREAD' ? `Unread (${unreadCount})` : `Read (${safeNotifs.length - unreadCount})`}
            </button>
          ))}
        </div>
        <span className="text-xs text-surface-500 dark:text-surface-400 font-mono">
          Click any notification to navigate to the relevant section
        </span>
      </div>

      {/* Notification Cards */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <HiOutlineBell className="w-12 h-12 text-surface-300 dark:text-surface-600 mx-auto mb-3" />
            <h3 className="font-bold text-surface-900 dark:text-white mb-1">No notifications found</h3>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              {readFilter === 'UNREAD' ? "You're all caught up — no unread alerts." : 'No notifications match the selected filter.'}
            </p>
          </div>
        ) : (
          filtered.map(notif => {
            const cfg = notifConfig[notif.type] || notifConfig.GENERAL
            const Icon = cfg.icon

            return (
              <div
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group
                  ${cfg.bg}
                  ${!notif.read ? 'ring-1 ring-primary-500/30' : 'opacity-70 hover:opacity-100'}
                `}
              >
                {/* Unread indicator dot */}
                {!notif.read && (
                  <span className="absolute top-3.5 right-10 w-2 h-2 rounded-full bg-primary-500 shadow-md shadow-primary-500/50 animate-pulse" />
                )}

                {/* Icon */}
                <div className={`p-2.5 rounded-xl ${notif.read ? 'bg-surface-100 dark:bg-surface-800' : 'bg-white/50 dark:bg-white/10'} shrink-0`}>
                  <Icon className={`w-5 h-5 ${cfg.color}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[10px] font-extrabold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-[10px] text-surface-400 dark:text-surface-500 font-mono mr-6">{notif.time || '10 min ago'}</span>
                  </div>
                  <p className={`text-sm font-semibold ${notif.read ? 'text-surface-700 dark:text-surface-300' : 'text-surface-900 dark:text-white'}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="text-xs text-surface-500 dark:text-surface-400 mt-0.5 leading-relaxed">{notif.body}</p>
                  )}
                  <p className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold mt-1 group-hover:underline">
                    Click to navigate →
                  </p>
                </div>

                {/* Dismiss */}
                <button
                  onClick={(e) => dismissNotif(e, notif.id)}
                  className="shrink-0 p-1 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-white hover:bg-surface-200/50 dark:hover:bg-surface-700/50 transition-colors"
                  title="Dismiss"
                >
                  <HiOutlineXMark className="w-4 h-4" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

const mockNotifications = [
  { id: 1, type: 'SLA_WARNING', title: 'SLA Breach Imminent — Ticket #101', body: 'Ticket #101 has less than 15% SLA time remaining. Immediate escalation or reassignment recommended.', time: '2 min ago', read: false },
  { id: 2, type: 'OVERFLOW_TICKET', title: 'New Overflow Ticket — Enterprise SSO Failure', body: 'Ticket #301 has been added to the overflow queue. Department is at 92% capacity.', time: '8 min ago', read: false },
  { id: 3, type: 'ESCALATION', title: 'Escalation Received from Employee', body: 'Sarah Jenkins escalated Ticket #104 requesting Company Admin intervention on gateway timeout.', time: '15 min ago', read: false },
  { id: 4, type: 'CONFLICT_ASSIGNED', title: 'New Conflict Ticket Assigned — Case #CONF-2', body: 'Customer Fintech Solutions filed a 1-star rating dispute against Mike Chen on Ticket #105.', time: '32 min ago', read: false },
  { id: 5, type: 'TICKET_RESOLVED', title: 'Ticket #105 Resolved Successfully', body: 'Mike Chen resolved SSL certificate expiration ticket within SLA window. Customer notified.', time: '1 hr ago', read: true },
  { id: 6, type: 'SLA_WARNING', title: 'SLA Warning — Ticket #104 Approaching Deadline', body: 'Ticket #104 API Webhook Gateway Timeout now at 18% SLA remaining. Auto-risk detection triggered.', time: '1.5 hr ago', read: true },
  { id: 7, type: 'GENERAL', title: 'Department Weekly Performance Report Ready', body: 'Your department weekly performance report for July 14–20 has been generated and is available in Reports.', time: '2 hr ago', read: true }
]
