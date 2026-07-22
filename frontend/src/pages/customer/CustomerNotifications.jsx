import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineBell, HiOutlineEnvelopeOpen, HiOutlineChevronRight } from 'react-icons/hi2'

export default function CustomerNotifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL') // ALL, UNREAD

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data || [])
    } catch {
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  const markRead = async (n) => {
    try {
      if (!n.read) {
        await api.put(`/notifications/${n.id}/read`)
        // Update local state
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x))
      }
      
      // Parse ticket ID from the notification message (e.g. "Your ticket #12 '...' has been resolved!")
      const match = n.message.match(/#(\d+)/)
      if (match) {
        navigate(`/dashboard/customer-tickets/${match[1]}`)
      } else {
        navigate('/dashboard/customer-tickets')
      }
    } catch {
      toast.error('Failed to update notification')
    }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(prev => prev.map(x => ({ ...x, read: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to update notifications')
    }
  }

  const displayedNotifications = filter === 'UNREAD' 
    ? notifications.filter(x => !x.read) 
    : notifications

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title">Notification Feed</h1>
          <p className="text-sm text-surface-500">Stay updated on ticket assignments, status updates, and feedback requests.</p>
        </div>
        {notifications.some(x => !x.read) && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-bold text-primary-500 hover:underline bg-transparent border-0 cursor-pointer p-2 rounded-xl hover:bg-primary-500/5 transition-all"
          >
            <HiOutlineEnvelopeOpen className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200/50 dark:border-surface-700/50 gap-4">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all bg-transparent border-0 cursor-pointer ${
            filter === 'ALL' ? 'border-primary-500 text-primary-500' : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('UNREAD')}
          className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all bg-transparent border-0 cursor-pointer ${
            filter === 'UNREAD' ? 'border-primary-500 text-primary-500' : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
          }`}
        >
          Unread ({notifications.filter(x => !x.read).length})
        </button>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="glass-card overflow-hidden divide-y divide-surface-200/50 dark:divide-surface-800/50">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-16 text-surface-400">
              <HiOutlineBell className="w-12 h-12 mx-auto text-surface-300 mb-2" />
              <p className="text-sm">No notifications found.</p>
            </div>
          ) : (
            displayedNotifications.map(n => (
              <div
                key={n.id}
                onClick={() => markRead(n)}
                className={`p-4 flex items-center justify-between hover:bg-surface-50/50 dark:hover:bg-surface-800/30 transition-all cursor-pointer ${
                  !n.read ? 'bg-primary-50/40 dark:bg-primary-950/10 border-l-4 border-l-primary-500' : 'pl-[19px]'
                }`}
              >
                <div className="space-y-1 pr-4 min-w-0">
                  <p className={`text-sm ${!n.read ? 'font-bold text-surface-900 dark:text-white' : 'text-surface-600 dark:text-surface-300'}`}>
                    {n.message}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-surface-400">
                    <span className="font-semibold uppercase tracking-wider text-[9px] px-1.5 py-0.2 rounded bg-surface-150 dark:bg-surface-800 text-surface-500">
                      {n.type || 'Alert'}
                    </span>
                    <span>{new Date(n.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex-shrink-0 text-surface-400">
                  <HiOutlineChevronRight className="w-5 h-5 hover:text-primary-500 transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
