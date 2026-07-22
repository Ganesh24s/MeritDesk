import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineBell, HiOutlineCog6Tooth } from 'react-icons/hi2'

export default function CompanyNotifications() {
  const [notifications, setNotifications] = useState([])
  const [settings, setSettings] = useState({
    emailNotifySlaBreach: true,
    emailNotifyEscalation: true,
    emailNotifyExtensionRequest: true,
    emailNotifySystemAlert: true,
  })
  const [tab, setTab] = useState('log')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [notifsRes, settingsRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/company/notification-settings'),
      ])
      setNotifications(notifsRes.data || [])
      setSettings(settingsRes.data || settings)
    } catch {}
    setLoading(false)
  }

  const handleSettingChange = async (key) => {
    const updated = { ...settings, [key]: !settings[key] }
    setSettings(updated)
    try {
      await api.put('/company/notification-settings', updated)
      toast.success('Settings updated!')
    } catch { toast.error('Failed to update'); setSettings(settings) }
  }

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all')
      setNotifications(n => n.map(x => ({ ...x, read: true })))
      toast.success('All marked as read')
    } catch {}
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'SLA_BREACH': case 'SLA_WARNING': return '⚠️'
      case 'ESCALATION': return '🚨'
      case 'EXTENSION': return '⏳'
      default: return '🔔'
    }
  }

  const getTypeBadge = (type) => {
    switch (type) {
      case 'SLA_BREACH': return 'badge-danger'
      case 'SLA_WARNING': return 'badge-warning'
      case 'ESCALATION': return 'badge-danger'
      case 'EXTENSION': return 'badge-info'
      default: return 'badge-neutral'
    }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  const settingItems = [
    { key: 'emailNotifySlaBreach', label: 'SLA Breach Alerts', description: 'Receive email when an SLA is breached or near breach', icon: '⚠️' },
    { key: 'emailNotifyEscalation', label: 'Escalation Alerts', description: 'Receive email when a ticket is escalated to Critical', icon: '🚨' },
    { key: 'emailNotifyExtensionRequest', label: 'Extension Requests', description: 'Receive email when employees request SLA extensions', icon: '⏳' },
    { key: 'emailNotifySystemAlert', label: 'System Alerts', description: 'Receive email for general system notifications', icon: '🔔' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="section-title">Notifications</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
        {[
          { key: 'log', label: 'Alert Log', icon: HiOutlineBell },
          { key: 'settings', label: 'Email Settings', icon: HiOutlineCog6Tooth },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${tab === t.key ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'log' && (
        <>
          <div className="flex justify-end">
            <button onClick={markAllRead} className="btn-secondary text-sm">Mark All Read</button>
          </div>
          <div className="space-y-2">
            {notifications.length === 0 ? (
              <div className="glass-card p-8 text-center text-surface-400">No notifications</div>
            ) : notifications.map(n => (
              <div key={n.id} className={`glass-card p-4 flex items-start gap-3 transition-all ${!n.read ? 'border-l-4 border-l-primary-500 bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                <span className="text-xl flex-shrink-0 mt-0.5">{getTypeIcon(n.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${getTypeBadge(n.type)} text-[10px]`}>{n.type?.replace('_', ' ')}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>}
                  </div>
                  <p className="text-sm text-surface-700 dark:text-surface-300">{n.message}</p>
                  <p className="text-xs text-surface-400 mt-1">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'settings' && (
        <div className="glass-card p-6 space-y-4">
          <h3 className="font-semibold text-surface-700 dark:text-surface-200 mb-2">Email Notification Preferences</h3>
          <p className="text-sm text-surface-500 mb-4">Toggle which email notifications you want to receive. In-app notifications will always be sent.</p>
          <div className="space-y-3">
            {settingItems.map(item => (
              <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-surface-400">{item.description}</p>
                  </div>
                </div>
                <button onClick={() => handleSettingChange(item.key)}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${settings[item.key] ? 'bg-primary-500' : 'bg-surface-300 dark:bg-surface-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${settings[item.key] ? 'translate-x-6' : ''}`}></span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
