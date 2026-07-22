import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { useAuth } from '../../context/AuthContext'

export default function CompanySettings() {
  const { user } = useAuth()
  const [tab, setTab] = useState('company')
  const [loading, setLoading] = useState(true)
  const [company, setCompany] = useState({ name: '', logoUrl: '', website: '', address: '', industry: '' })
  const [profile, setProfile] = useState({ name: '', email: '', password: '' })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await api.get('/company/settings')
      setCompany({
        name: res.data.name || '',
        logoUrl: res.data.logoUrl || '',
        website: res.data.website || '',
        address: res.data.address || '',
        industry: res.data.industry || '',
      })
      setProfile({ name: user?.name || '', email: user?.email || '', password: '' })
    } catch {}
    setLoading(false)
  }

  const handleCompanySave = async (e) => {
    e.preventDefault()
    try {
      await api.put('/company/settings', company)
      toast.success('Company settings updated!')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update') }
  }

  const handleProfileSave = async (e) => {
    e.preventDefault()
    try {
      await api.put('/company/profile', profile)
      toast.success('Profile updated!')
      setProfile(p => ({ ...p, password: '' }))
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update') }
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full"></div></div>

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="section-title">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-100 dark:bg-surface-800 rounded-xl p-1 w-fit">
        {[
          { key: 'company', label: '🏢 Company Profile' },
          { key: 'admin', label: '👤 Admin Profile' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-white dark:bg-surface-700 shadow-sm text-primary-600' : 'text-surface-500 hover:text-surface-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <form onSubmit={handleCompanySave} className="glass-card p-6 space-y-6 max-w-2xl">
          <h3 className="font-semibold text-lg">Company Details</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name *</label>
              <input value={company.name} onChange={e => setCompany({...company, name: e.target.value})} required className="input-field" />
            </div>
            <div>
              <label className="label">Industry</label>
              <input value={company.industry} onChange={e => setCompany({...company, industry: e.target.value})} className="input-field" placeholder="e.g. Technology" />
            </div>
            <div>
              <label className="label">Website</label>
              <input value={company.website} onChange={e => setCompany({...company, website: e.target.value})} className="input-field" placeholder="https://example.com" />
            </div>
            <div>
              <label className="label">Logo URL</label>
              <input value={company.logoUrl} onChange={e => setCompany({...company, logoUrl: e.target.value})} className="input-field" placeholder="https://..." />
            </div>
            <div className="md:col-span-2">
              <label className="label">Address</label>
              <input value={company.address} onChange={e => setCompany({...company, address: e.target.value})} className="input-field" />
            </div>
          </div>
          <button type="submit" className="btn-primary text-sm">Save Changes</button>
        </form>
      )}

      {tab === 'admin' && (
        <form onSubmit={handleProfileSave} className="glass-card p-6 space-y-6 max-w-2xl">
          <h3 className="font-semibold text-lg">Admin Profile</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {profile.name?.charAt(0) || 'A'}
            </div>
            <div>
              <p className="font-semibold text-lg">{profile.name}</p>
              <p className="text-sm text-surface-400">{profile.email}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Full Name *</label>
              <input value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} required className="input-field" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} required className="input-field" />
            </div>
            <div className="md:col-span-2">
              <label className="label">New Password <span className="text-surface-400">(leave blank to keep current)</span></label>
              <input type="password" value={profile.password} onChange={e => setProfile({...profile, password: e.target.value})} className="input-field" placeholder="••••••••" />
            </div>
          </div>
          <button type="submit" className="btn-primary text-sm">Update Profile</button>
        </form>
      )}
    </div>
  )
}
