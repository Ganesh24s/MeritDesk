import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import { toast } from 'react-toastify'
import { HiOutlinePlusCircle, HiOutlinePencilSquare, HiXMark, HiOutlinePaperAirplane, HiOutlineMagnifyingGlass, HiOutlineFunnel, HiOutlineTrash } from 'react-icons/hi2'

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState([])
  const [departments, setDepartments] = useState([])
  const [skills, setSkills] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '', departmentId: '', role: 'EMPLOYEE' })
  const [editDrawer, setEditDrawer] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', email: '', departmentId: '', role: '', skillIds: [], maxCapacity: 10, active: true })
  const [filter, setFilter] = useState({ search: '', department: '', status: '' })

  useEffect(() => {
    fetchEmployees()
    api.get('/company/departments').then(r => setDepartments(r.data || []))
    api.get('/company/skills').then(r => setSkills(r.data || []))
  }, [])

  const fetchEmployees = async () => {
    try { const res = await api.get('/company/employees'); setEmployees(res.data || []) }
    catch { toast.error('Failed to load employees') }
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    try {
      await api.post('/company/employees/invite', inviteForm)
      toast.success('Invitation sent to ' + inviteForm.email)
      setShowInvite(false); setInviteForm({ name: '', email: '', departmentId: '', role: 'EMPLOYEE' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to invite') }
  }

  const openEdit = (emp) => {
    setEditDrawer(emp)
    setEditForm({
      name: emp.name,
      email: emp.email,
      departmentId: emp.departmentId || '',
      role: emp.role || 'EMPLOYEE',
      skillIds: emp.skills?.map(s => s.id) || [],
      maxCapacity: emp.maxCapacity || 10,
      active: emp.active,
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/company/employees/${editDrawer.id}`, editForm)
      toast.success('Employee updated!')
      setEditDrawer(null); fetchEmployees()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update') }
  }

  const handleToggleActive = async (emp) => {
    try {
      if (emp.active) {
        await api.put(`/company/employees/${emp.id}/deactivate`)
        toast.success('Employee deactivated')
      } else {
        await api.put(`/company/employees/${emp.id}/activate`)
        toast.success('Employee activated')
      }
      fetchEmployees()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const handleDeleteEmployee = async (id) => {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return
    try {
      await api.delete(`/company/employees/${id}`)
      toast.success('Employee deleted')
      fetchEmployees()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete employee')
    }
  }

  const toggleSkill = (id) => {
    setEditForm(prev => ({
      ...prev,
      skillIds: prev.skillIds.includes(id)
        ? prev.skillIds.filter(s => s !== id)
        : [...prev.skillIds, id]
    }))
  }

  const filtered = employees.filter(e => {
    if (filter.search) {
      const s = filter.search.toLowerCase()
      if (!e.name?.toLowerCase().includes(s) && !e.email?.toLowerCase().includes(s)) return false
    }
    if (filter.department && e.departmentId?.toString() !== filter.department) return false
    if (filter.status === 'active' && !e.active) return false
    if (filter.status === 'inactive' && e.active) return false
    if (filter.status === 'online' && e.availabilityStatus !== 'ONLINE') return false
    if (filter.status === 'busy' && e.availabilityStatus !== 'BUSY') return false
    if (filter.status === 'offline' && e.availabilityStatus !== 'OFFLINE') return false
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="section-title">Employees</h1>
        <button onClick={() => setShowInvite(!showInvite)} className="btn-primary flex items-center gap-2 text-sm">
          <HiOutlinePaperAirplane className="w-5 h-5" /> Invite Employee
        </button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <form onSubmit={handleInvite} className="glass-card p-6 space-y-4">
          <h3 className="font-semibold">Send Invitation</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="label">Name *</label>
              <input value={inviteForm.name} onChange={e => setInviteForm({...inviteForm, name: e.target.value})} required className="input-field" />
            </div>
            <div>
              <label className="label">Email *</label>
              <input type="email" value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} required className="input-field" />
            </div>
            <div>
              <label className="label">Department</label>
              <select value={inviteForm.departmentId} onChange={e => setInviteForm({...inviteForm, departmentId: e.target.value})} className="input-field">
                <option value="">None</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Role</label>
              <select value={inviteForm.role} onChange={e => setInviteForm({...inviteForm, role: e.target.value})} className="input-field">
                <option value="EMPLOYEE">Employee</option>
                <option value="DEPARTMENT_ADMIN">Dept Admin</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm">Send Invitation</button>
            <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
      )}

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center flex-1">
          <div className="relative min-w-[220px] max-w-xs flex-1">
            <HiOutlineMagnifyingGlass className="w-4 h-4 text-surface-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={filter.search} onChange={e => setFilter({...filter, search: e.target.value})}
              placeholder="Search employees..." className="input-field pl-10 text-xs" />
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-surface-600 dark:text-surface-300">
            <HiOutlineFunnel className="w-4 h-4 text-primary-500" />
            <span>Filter:</span>
          </div>
          <select value={filter.department} onChange={e => setFilter({...filter, department: e.target.value})} className="input-field max-w-[180px] text-xs">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={filter.status} onChange={e => setFilter({...filter, status: e.target.value})} className="input-field max-w-[140px] text-xs">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="online">🟢 Online</option>
            <option value="busy">🟡 Busy</option>
            <option value="offline">🔴 Offline</option>
          </select>
        </div>
        <span className="text-xs text-surface-400 font-mono font-medium">
          Showing {filtered.length} of {employees.length} employees
        </span>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Role</th>
                <th>Honour</th>
                <th>Workload</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-surface-400">No employees found</td></tr>
              ) : filtered.map(e => (
                <tr key={e.id} className={!e.active ? 'opacity-50' : ''}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {e.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{e.name}</p>
                        <p className="text-xs text-surface-400">{e.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{e.departmentName || <span className="text-surface-400">Unassigned</span>}</td>
                  <td><span className={`badge ${e.role === 'DEPARTMENT_ADMIN' ? 'badge-warning' : 'badge-info'}`}>{e.role?.replace('_',' ')}</span></td>
                  <td>
                    <p className="font-bold text-primary-500">{e.honourScore?.toFixed(0)}</p>
                    <p className="text-xs text-surface-400">{e.honourLevel}</p>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-2 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${(e.currentWorkload / e.maxCapacity) > 0.8 ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{width: `${Math.min((e.currentWorkload / e.maxCapacity) * 100, 100)}%`}}></div>
                      </div>
                      <span className="text-xs text-surface-500">{e.currentWorkload}/{e.maxCapacity}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex flex-col gap-1">
                      <span className={`badge ${e.active ? 'badge-success' : 'badge-danger'}`}>{e.active ? 'Active' : 'Inactive'}</span>
                      {e.active && (
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${
                            e.availabilityStatus === 'ONLINE' ? 'bg-emerald-400 animate-pulse' :
                            e.availabilityStatus === 'BUSY' ? 'bg-amber-400' :
                            'bg-red-400'
                          }`}></span>
                          <span className={`text-[10px] font-semibold ${
                            e.availabilityStatus === 'ONLINE' ? 'text-emerald-600 dark:text-emerald-400' :
                            e.availabilityStatus === 'BUSY' ? 'text-amber-600 dark:text-amber-400' :
                            'text-red-500 dark:text-red-400'
                          }`}>
                            {e.availabilityStatus === 'ONLINE' ? 'Online' : e.availabilityStatus === 'BUSY' ? 'Busy' : 'Offline'}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(e)} title="Edit"
                        className="p-1.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 text-blue-500">
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleActive(e)} title={e.active ? 'Deactivate' : 'Activate'}
                        className={`p-1.5 rounded-lg text-xs font-medium ${e.active ? 'hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-500' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-500'}`}>
                        {e.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => handleDeleteEmployee(e.id)} title="Delete Employee"
                        className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500">
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editDrawer && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditDrawer(null)}>
          <div className="w-full max-w-lg bg-white dark:bg-surface-900 max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Edit Employee</h2>
              <button onClick={() => setEditDrawer(null)} className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-800">
                <HiXMark className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-5">
              <div>
                <label className="label">Name *</label>
                <input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required className="input-field" />
              </div>
              <div>
                <label className="label">Email *</label>
                <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} required className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Department</label>
                  <select value={editForm.departmentId} onChange={e => setEditForm({...editForm, departmentId: e.target.value})} className="input-field">
                    <option value="">Unassigned</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  {editDrawer.departmentId && editForm.departmentId && editForm.departmentId !== editDrawer.departmentId?.toString() && (
                    <p className="text-xs text-amber-500 mt-1">⚠️ Transfer - Honour Score will be retained</p>
                  )}
                </div>
                <div>
                  <label className="label">Role</label>
                  <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="input-field">
                    <option value="EMPLOYEE">Employee</option>
                    <option value="DEPARTMENT_ADMIN">Dept Admin</option>
                  </select>
                  {editDrawer.role === 'EMPLOYEE' && editForm.role === 'DEPARTMENT_ADMIN' && (
                    <p className="text-xs text-blue-500 mt-1">🎉 Promoting to Department Admin</p>
                  )}
                </div>
              </div>
              <div>
                <label className="label">Max Capacity</label>
                <input type="number" min="1" value={editForm.maxCapacity} onChange={e => setEditForm({...editForm, maxCapacity: Number(e.target.value)})} className="input-field" />
              </div>

              {/* Skills */}
              <div>
                <label className="label">Skills</label>
                <div className="max-h-48 overflow-y-auto space-y-1 border border-surface-200 dark:border-surface-700 rounded-xl p-3">
                  {skills.length === 0 ? (
                    <p className="text-sm text-surface-400 text-center py-2">No skills available</p>
                  ) : skills.map(s => (
                    <label key={s.id} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800">
                      <input type="checkbox" checked={editForm.skillIds.includes(s.id)} onChange={() => toggleSkill(s.id)} className="rounded" />
                      <span className="text-sm">{s.name}</span>
                      {s.category && <span className="badge badge-info text-[10px]">{s.category}</span>}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn-primary text-sm">Save Changes</button>
                <button type="button" onClick={() => setEditDrawer(null)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
