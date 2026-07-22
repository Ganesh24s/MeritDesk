import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineUser, HiOutlineLockClosed, HiOutlineBell, HiOutlineStatusOnline } from 'react-icons/hi'

export default function EmployeeSettings() {
  const [profile, setProfile] = useState({ name: '', email: '', password: '' })
  const [availability, setAvailability] = useState('ONLINE')
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
        api.get('/employee/performance'),
        api.get('/employee/notification-settings')
      ])
      setProfile({
        name: profileRes.data.name || '',
        email: profileRes.data.email || '',
        password: ''
      })
      setAvailability(profileRes.data.availabilityStatus || 'ONLINE')
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

  // Update profile handler
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
      await api.put('/employee/profile', body)
      toast.success('Profile updated successfully!')
      setProfile(prev => ({ ...prev, password: '' }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile')
    }
  }

  // Update availability handler
  const handleUpdateAvailability = async (status) => {
    try {
      await api.put(`/employee/availability?status=${status}`)
      setAvailability(status)
      toast.success(`Availability status set to ${status}`)
    } catch {
      toast.error('Failed to update availability')
    }
  }

  // Update notification preference check
  const handleNotifToggle = async (key) => {
    const updatedSettings = {
      ...notifSettings,
      [key]: !notifSettings[key]
    }
    try {
      await api.put('/employee/notification-settings', updatedSettings)
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
        <h1 className="section-title">Account Settings</h1>
        <p className="text-sm text-surface-500">Manage your profile information, availability, and notification configurations.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Availability Settings & Alerts */}
        <div className="space-y-6">
          {/* Availability Status Cards */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2">
              <HiOutlineStatusOnline className="w-5 h-5 text-primary-500" />
              Duty Availability
            </h3>
            <p className="text-xs text-surface-400">Update your duty status. Setting to Busy will lower your auto-assignment score, and Offline stops automatic assignment completely.</p>
            
            <div className="space-y-2.5">
              <button
                onClick={() => handleUpdateAvailability('ONLINE')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                  availability === 'ONLINE'
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md'
                    : 'bg-transparent border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50'
                }`}
              >
                <span>Online</span>
                <span className={`w-2 h-2 rounded-full ${availability === 'ONLINE' ? 'bg-white' : 'bg-emerald-500'}`}></span>
              </button>
              
              <button
                onClick={() => handleUpdateAvailability('BUSY')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                  availability === 'BUSY'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                    : 'bg-transparent border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50'
                }`}
              >
                <span>Busy / In Session</span>
                <span className={`w-2 h-2 rounded-full ${availability === 'BUSY' ? 'bg-white' : 'bg-amber-500'}`}></span>
              </button>
              
              <button
                onClick={() => handleUpdateAvailability('OFFLINE')}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all duration-200 ${
                  availability === 'OFFLINE'
                    ? 'bg-surface-500 dark:bg-surface-600 text-white border-surface-600 shadow-md'
                    : 'bg-transparent border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50'
                }`}
              >
                <span>Offline / Paused</span>
                <span className={`w-2 h-2 rounded-full ${availability === 'OFFLINE' ? 'bg-white' : 'bg-surface-400'}`}></span>
              </button>
            </div>
          </div>

          {/* Email Notification Preferences */}
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2">
              <HiOutlineBell className="w-5 h-5 text-primary-500" />
              Email Alerts
            </h3>
            <p className="text-xs text-surface-400">Choose which events trigger instant emails to your address.</p>
            
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-surface-700 dark:text-surface-300">
                <input
                  type="checkbox"
                  checked={notifSettings.emailNotifySlaBreach}
                  onChange={() => handleNotifToggle('emailNotifySlaBreach')}
                  className="rounded border-surface-350 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                />
                <span>SLA Breach Alerts</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-surface-700 dark:text-surface-300">
                <input
                  type="checkbox"
                  checked={notifSettings.emailNotifyEscalation}
                  onChange={() => handleNotifToggle('emailNotifyEscalation')}
                  className="rounded border-surface-350 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                />
                <span>Critical Escalation Warnings</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-surface-700 dark:text-surface-300">
                <input
                  type="checkbox"
                  checked={notifSettings.emailNotifyExtensionRequest}
                  onChange={() => handleNotifToggle('emailNotifyExtensionRequest')}
                  className="rounded border-surface-350 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                />
                <span>SLA Extension Approved/Rejected</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-xs font-medium text-surface-700 dark:text-surface-300">
                <input
                  type="checkbox"
                  checked={notifSettings.emailNotifySystemAlert}
                  onChange={() => handleNotifToggle('emailNotifySystemAlert')}
                  className="rounded border-surface-350 text-primary-600 focus:ring-primary-500 h-4.5 w-4.5"
                />
                <span>General System Notifications</span>
              </label>
            </div>
          </div>
        </div>

        {/* Profile Card Form */}
        <div className="md:col-span-2">
          <form onSubmit={handleUpdateProfile} className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-base text-surface-900 dark:text-white flex items-center gap-2 border-b border-surface-200/50 dark:border-surface-700/50 pb-2.5">
              <HiOutlineUser className="w-5 h-5 text-primary-500" />
              Personal Profile
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
                  Change Password
                </h4>
                <div>
                  <label className="label">New Password (Leave blank to keep current)</label>
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
                Save Profile
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
