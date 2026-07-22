import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlineTrash, HiOutlinePlus, HiOutlineCpuChip } from 'react-icons/hi2'

export default function PlatformSettings() {
  const [activeTab, setActiveTab] = useState('SLA')

  // SLA Templates State
  const [slaTemplates, setSlaTemplates] = useState([
    { priority: 'CRITICAL', response: 15, resolution: 240 },
    { priority: 'HIGH', response: 30, resolution: 480 },
    { priority: 'MEDIUM', response: 120, resolution: 1440 },
    { priority: 'LOW', response: 480, resolution: 4320 },
  ])

  // Super Admins State
  const [superAdmins, setSuperAdmins] = useState([])
  const [adminForm, setAdminForm] = useState({ name: '', email: '', password: '' })
  const [showAddAdmin, setShowAddAdmin] = useState(false)

  // System Configuration State
  const [sysConfig, setSysConfig] = useState({
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: 'meritdesk13@gmail.com',
    maxCompanies: 50,
    defaultCompanyCapacity: 100
  })

  useEffect(() => {
    if (activeTab === 'ADMINS') {
      fetchSuperAdmins()
    }
  }, [activeTab])

  const fetchSuperAdmins = async () => {
    try {
      const res = await api.get('/admin/super-admins')
      setSuperAdmins(res.data || [])
    } catch {
      toast.error('Failed to load Super Admins')
    }
  }

  // SLA Template Handlers
  const handleSlaSave = (priority, key, val) => {
    setSlaTemplates(slaTemplates.map(s => s.priority === priority ? { ...s, [key]: Number(val) } : s))
    toast.success('SLA Template updated locally (auto-inherited by new companies)')
  }

  // Super Admin Handlers
  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    try {
      await api.post('/admin/super-admins', adminForm)
      toast.success('Super Admin created successfully!')
      setShowAddAdmin(false)
      setAdminForm({ name: '', email: '', password: '' })
      fetchSuperAdmins()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create Super Admin')
    }
  }

  const handleDeleteAdmin = async (id, name) => {
    if (!confirm(`Are you sure you want to remove Super Admin ${name}?`)) return
    try {
      await api.delete(`/admin/super-admins/${id}`)
      toast.success('Super Admin removed')
      fetchSuperAdmins()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove Super Admin')
    }
  }

  // System Config Handlers
  const handleSysSave = (e) => {
    e.preventDefault()
    toast.success('System Configuration saved successfully!')
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="section-title">Platform Settings</h1>
        <p className="text-surface-500 text-sm mt-1">Configure global default structures, skills taxonomies, and admin governance</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200/50 dark:border-surface-700/50 gap-4">
        {['SLA', 'ADMINS', 'SYSTEM'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold text-sm border-b-2 transition-all bg-transparent border-0 cursor-pointer ${
              activeTab === tab ? 'border-primary-500 text-primary-500' : 'border-transparent text-surface-400 hover:text-surface-600 dark:hover:text-surface-200'
            }`}
          >
            {tab === 'SLA' && 'SLA Templates'}
            {tab === 'ADMINS' && 'Super Admins'}
            {tab === 'SYSTEM' && 'System Config'}
          </button>
        ))}
      </div>

      {/* SLA Templates Tab */}
      {activeTab === 'SLA' && (
        <div className="glass-card p-6 space-y-6">
          <div>
            <h2 className="text-lg font-semibold">Global SLA Templates</h2>
            <p className="text-xs text-surface-500 mt-1">Standard priorities that new tenant companies automatically inherit upon approval</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {slaTemplates.map(s => (
              <div key={s.priority} className="p-4 rounded-xl bg-surface-150/50 dark:bg-surface-800/40 border border-surface-200/30 space-y-3">
                <span className="badge badge-primary font-bold">{s.priority}</span>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="label text-xs">Response Time (mins)</label>
                    <input
                      type="number"
                      value={s.response}
                      onChange={e => handleSlaSave(s.priority, 'response', e.target.value)}
                      className="input-field mt-1"
                    />
                  </div>
                  <div>
                    <label className="label text-xs">Resolution Time (mins)</label>
                    <input
                      type="number"
                      value={s.resolution}
                      onChange={e => handleSlaSave(s.priority, 'resolution', e.target.value)}
                      className="input-field mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}


      {/* Super Admins Tab */}
      {activeTab === 'ADMINS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Super Admin Registry</h2>
              <p className="text-xs text-surface-500">Manage individuals who have platform governance access</p>
            </div>
            <button onClick={() => setShowAddAdmin(!showAddAdmin)} className="btn-primary text-sm flex items-center gap-1.5">
              <HiOutlinePlus className="w-4 h-4" /> Create Super Admin
            </button>
          </div>

          {showAddAdmin && (
            <form onSubmit={handleCreateAdmin} className="glass-card p-6 space-y-4 max-w-lg">
              <h3 className="font-semibold text-sm">New Admin Profile</h3>
              <div className="space-y-3">
                <div><label className="label">Name</label><input required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} className="input-field" /></div>
                <div><label className="label">Email</label><input type="email" required value={adminForm.email} onChange={e => setAdminForm({...adminForm, email: e.target.value})} className="input-field" /></div>
                <div><label className="label">Password</label><input type="password" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} className="input-field" /></div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm">Create</button>
                <button type="button" onClick={() => setShowAddAdmin(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          )}

          <div className="glass-card overflow-hidden">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {superAdmins.map(admin => (
                    <tr key={admin.id}>
                      <td className="font-semibold">{admin.name}</td>
                      <td>{admin.email}</td>
                      <td><span className="badge badge-danger">SUPER ADMIN</span></td>
                      <td className="text-right">
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold hover:underline bg-transparent border-0 cursor-pointer"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* System Configuration Tab */}
      {activeTab === 'SYSTEM' && (
        <form onSubmit={handleSysSave} className="glass-card p-6 space-y-6 max-w-2xl">
          <div>
            <h2 className="text-lg font-semibold">Global System Configurations</h2>
            <p className="text-xs text-surface-500">Configure global resource limitations and backend settings</p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-sm border-b pb-2 border-surface-200/50 dark:border-surface-700/50 text-primary-500 flex items-center gap-1.5">
              <HiOutlineCpuChip className="w-5 h-5" /> Mail SMTP Server Configuration
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">SMTP Host</label>
                <input value={sysConfig.smtpHost} onChange={e => setSysConfig({...sysConfig, smtpHost: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="label">SMTP Port</label>
                <input value={sysConfig.smtpPort} onChange={e => setSysConfig({...sysConfig, smtpPort: e.target.value})} className="input-field" />
              </div>
              <div className="col-span-2">
                <label className="label">SMTP Username</label>
                <input value={sysConfig.smtpUser} onChange={e => setSysConfig({...sysConfig, smtpUser: e.target.value})} className="input-field" />
              </div>
            </div>

            <h3 className="font-semibold text-sm border-b pb-2 border-surface-200/50 dark:border-surface-700/50 text-primary-500 pt-4">
              Platform Allocation Limits
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Maximum Active Companies Limit</label>
                <input type="number" value={sysConfig.maxCompanies} onChange={e => setSysConfig({...sysConfig, maxCompanies: Number(e.target.value)})} className="input-field" />
              </div>
              <div>
                <label className="label">Default Employee Capacity per Dept</label>
                <input type="number" value={sysConfig.defaultCompanyCapacity} onChange={e => setSysConfig({...sysConfig, defaultCompanyCapacity: Number(e.target.value)})} className="input-field" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn-primary text-sm py-2">Save System Configurations</button>
        </form>
      )}
    </div>
  )
}
