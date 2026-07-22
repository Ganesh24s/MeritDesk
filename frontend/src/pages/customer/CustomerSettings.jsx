import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineBell } from 'react-icons/hi'

export default function CustomerSettings() {
  const [profile, setProfile] = useState({ name: '', email: '', password: '' })
  const [notifSettings, setNotifSettings] = useState({
    emailNotifySlaBreach: true,
    emailNotifyEscalation: true,
    emailNotifyExtensionRequest: true,
    emailNotifySystemAlert: true
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const [profileRes, notifRes] = await Promise.all([
        api.get('/customer/profile'),
        api.get('/customer/notification-settings')
      ])
      setProfile({
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        password: ''
      })
      setNotifSettings(notifRes.data || {
        emailNotifySlaBreach: true,
        emailNotifyEscalation: true,
        emailNotifyExtensionRequest: true,
        emailNotifySystemAlert: true
      })
    } catch {
      toast.error('Failed to load user settings')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    if (!profile.name.trim() || !profile.email.trim()) {
      toast.error('Name and email are required')
      return
    }
    try {
      const body = {
        name: profile.name,
        email: profile.email,
        password: profile.password || null
      }
      await api.put('/customer/profile', body)
      toast.success('Profile updated successfully!')
      setProfile(prev => ({ ...prev, password: '' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    }
  }

  const handleNotifToggle = async (key) => {
    const updatedSettings = {
      ...notifSettings,
      [key]: !notifSettings[key]
    }
    try {
      await api.put('/customer/notification-settings', updatedSettings)
      setNotifSettings(updatedSettings)
      toast.success('Notification preferences updated')
    } catch {
      toast.error('Failed to update notification settings')
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="section-title">My Account Settings</h1>
        <p className="text-sm text-surface-500">Manage your contact information, credentials, and notification triggers.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Email Preferences Column */}
        <div>
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2">
              <HiOutlineBell className="w-5 h-5 text-primary-500" />
              Email Preferences
            </h3>
            <p className="text-xs text-surface-400">Choose which updates you want emailed to you immediately.</p>
            
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-surface-700 dark:text-surface-300">
                <input
                  type="checkbox"
                  checked={notifSettings.emailNotifySlaBreach}
                  onChange={() => handleNotifToggle('emailNotifySlaBreach')}
                  className="rounded border-surface-350 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                />
                <span>Ticket SLA Warn/Breaches</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-surface-700 dark:text-surface-300">
                <input
                  type="checkbox"
                  checked={notifSettings.emailNotifyEscalation}
                  onChange={() => handleNotifToggle('emailNotifyEscalation')}
                  className="rounded border-surface-350 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                />
                <span>Critical Ticket Escalations</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-surface-700 dark:text-surface-300">
                <input
                  type="checkbox"
                  checked={notifSettings.emailNotifyExtensionRequest}
                  onChange={() => handleNotifToggle('emailNotifyExtensionRequest')}
                  className="rounded border-surface-350 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                />
                <span>Deadline extension alerts</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-surface-700 dark:text-surface-300">
                <input
                  type="checkbox"
                  checked={notifSettings.emailNotifySystemAlert}
                  onChange={() => handleNotifToggle('emailNotifySystemAlert')}
                  className="rounded border-surface-350 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                />
                <span>General system alerts</span>
              </label>
            </div>
          </div>
        </div>

        {/* Profile Edit Column */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdateProfile} className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2 border-b border-surface-200/50 dark:border-surface-700/50 pb-2.5">
              <HiOutlineUser className="w-5 h-5 text-primary-500" />
              Customer Profile
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="label">Full Name</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="input-field"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={e => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  className="input-field"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="pt-2.5 border-t border-surface-200/50 dark:border-surface-700/50 mt-4 space-y-3">
                <h4 className="text-xs font-bold uppercase text-surface-450 flex items-center gap-1.5">
                  <HiOutlineLockClosed className="w-4 h-4" />
                  Change Account Password
                </h4>
                <div>
                  <label className="label">New Password (Leave empty to keep current)</label>
                  <input
                    type="password"
                    value={profile.password}
                    onChange={e => setProfile(prev => ({ ...prev, password: e.target.value }))}
                    className="input-field"
                    placeholder="Enter new password"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-surface-200/50 dark:border-surface-700/50">
              <button
                type="submit"
                className="btn-primary py-2.5 text-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
