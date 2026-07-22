import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineCheck, HiOutlineBellAlert } from 'react-icons/hi2'

export default function SuperAdminNotifications() {
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data || [])
    } catch {
      toast.error('Failed to load notifications')
    }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(notifications.map(n => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to mark all as read')
    }
  }

  const getAlertColor = (message) => {
    if (message.includes('suspension') || message.includes('suspended') || message.includes('error')) return 'border-l-red-500 bg-red-500/5'
    if (message.includes('registration') || message.includes('registered') || message.includes('new company')) return 'border-l-amber-500 bg-amber-500/5'
    return 'border-l-primary-500 bg-primary-500/5'
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="section-title">System Alerts & Notifications</h1>
          <p className="text-surface-500 text-sm mt-1">Platform-level registration updates, suspensions, and performance issues</p>
        </div>
        {notifications.some(n => !n.read) && (
          <button onClick={markAllRead} className="btn-primary text-sm flex items-center gap-1.5 py-2">
            <HiOutlineCheck className="w-5 h-5" /> Mark All Read
          </button>
        )}
      </div>

      <div className="glass-card p-6 space-y-4">
        {notifications.length === 0 ? (
          <div className="text-center py-10 text-surface-400">
            <HiOutlineBellAlert className="w-12 h-12 mx-auto text-surface-500 mb-2" />
            <p className="font-semibold text-sm">No system alerts at this time</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-200/50 dark:divide-surface-700/50">
            {notifications.map(n => (
              <div
                key={n.id}
                className={`py-4 px-3 flex items-start justify-between border-l-4 rounded-r-xl transition-all duration-300 mb-2 border-surface-200/20 ${getAlertColor(n.message)}`}
              >
                <div>
                  <p className="font-medium text-surface-950 dark:text-surface-50">{n.message}</p>
                  <p className="text-xs text-surface-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
                {!n.read && (
                  <span className="badge badge-warning text-[10px] uppercase font-bold tracking-wider">Unread</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
